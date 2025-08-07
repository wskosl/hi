let player;
let pads = [];
let gravity = 0.5;
let jumpStrength = 19;
let scrollOffset = 0;
let score = 0;
let highScore = 0;
let gameStarted = false;
let playButton;
let restartButton;
let firstTime = true;
let gameOver = false;

let bounceSound;
let gameOverSound;
let bgMusic;

let currentDirectionKey = null;

// --- FALLING SPIKES / EVENT (FINAL TWEAKS) ---
let fallingSpikes = [];

// Event scheduling
let eventActive = false;
let eventStartTime = 0;
const EVENT_DURATION = 30000; // 30 seconds
const EVENT_SPAWN_INTERVAL = 2000; // every 2 seconds while event active
let nextEventScore = 0;
const EVENT_MIN_GAP = 400;
const EVENT_MAX_GAP = 800;

// Path warning & spawn timing
let pathWarningActive = false;
let pathWarningStart = 0;
const PATH_WARNING_DURATION = 700; // ms before spawn to display the red faded path (base)
let pathX = 0;
let pathW = 80; // width of spawn path (similar to pad width)
let nextEventSpawnTime = 0; // millis time for next spawn (spawn happens after warning)

// visual popup
let eventPopupStart = 0;
const EVENT_POPUP_DURATION = 1800; // initial popup show time (ms)

// side glow visuals — moved a bit outward so it doesn't hinder the game view
const SIDE_GLOW_WIDTH = 56;
const SIDE_GLOW_BASE_ALPHA = 70; // base alpha for glow
const SIDE_GLOW_PULSE_STRENGTH = 60; // pulsing amplitude
const SIDE_GLOW_OUTSET = 18; // how far to push glow partly off-screen (px)

// blinking '!' inside path warning
const BLINK_PERIOD = 600; // ms

// flashing path warning options
const PATH_FLASH_AMPLITUDE = 120; // extra alpha at flash peak
const PATH_FLASH_PERIOD = 150; // ms per flash cycle during last part of warning

// debug toggle
let debugForceEvent = false;

// schedule first event
function scheduleNextEvent() {
  let gap = int(random(EVENT_MIN_GAP, EVENT_MAX_GAP + 1));
  nextEventScore = score + gap;
}

function preload() {
  bounceSound = loadSound('Sound/plasma-bounce-357127-[AudioTrimmer.com].mp3');
  gameOverSound = loadSound('Sound/negative_beeps-6008.mp3');
  bgMusic = loadSound('Sound/Different Heaven - Nekozilla [NCS Release].mp3');
}

function setup() {
  createCanvas(400, 600);
  textAlign(CENTER, CENTER);
  loadHighScore();

  playButton = createButton("Play");
  playButton.position(width / 2 - 30, height / 2);
  playButton.mousePressed(startGame);

  restartButton = createButton("Restart");
  restartButton.position(width / 2 - 35, height / 2 + 50);
  restartButton.mousePressed(() => {
    gameOver = false;
    resetGame();
  });
  restartButton.hide();

  scheduleNextEvent();
}

function draw() {
  background(30, 30, 50);

  if (!gameStarted) {
    fill(255);
    textSize(28);
    text("Press Play to Start", width / 2, height / 2 - 50);
    textSize(20);
    text("High Score: " + highScore, width / 2, height / 2 + 50);
    return;
  }

  if (gameOver) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Game Over", width / 2, height / 2 - 60);
    textSize(20);
    text("Final Score: " + score, width / 2, height / 2 - 20);
    text("High Score: " + highScore, width / 2, height / 2 + 10);
    restartButton.show();
    return;
  }

  // debug force event if toggled
  if (debugForceEvent && !eventActive) {
    startEventNow();
    debugForceEvent = false;
  }

  // --- EVENT TRIGGER CHECK (by score) ---
  if (!eventActive && score >= nextEventScore) {
    startEventNow();
  }

  // --- EVENT SIDE GLOW & POPUP ---
  if (eventActive) {
    // pulsating alpha using sine wave
    let t = millis() / 300; // speed of pulse
    let pulse = sin(t) * SIDE_GLOW_PULSE_STRENGTH; // -amp..amp
    let alpha = constrain(SIDE_GLOW_BASE_ALPHA + pulse, 20, 220);

    noStroke();
    // left glow drawn slightly off-canvas to not block center
    fill(255, 0, 0, alpha * 0.55);
    rect(-SIDE_GLOW_OUTSET, 0, SIDE_GLOW_WIDTH, height);
    // right glow drawn slightly off-canvas to the right
    rect(width - SIDE_GLOW_WIDTH + SIDE_GLOW_OUTSET, 0, SIDE_GLOW_WIDTH, height);

    // Popup with countdown timer (show while event active)
    let timeLeft = max(0, EVENT_DURATION - (millis() - eventStartTime));
    let secondsLeft = ceil(timeLeft / 1000);

    // popup background (semi transparent)
    push();
    rectMode(CENTER);
    noStroke();
    fill(0, 0, 0, 160);
    rect(width / 2, height / 2 - 80, 240, 80, 10);

    // "EVENT" big text
    fill(255, 180, 180);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("EVENT", width / 2, height / 2 - 100 + 20);

    // subtext + countdown
    textSize(18);
    fill(255);
    text("Falling Spikes — " + secondsLeft + "s", width / 2, height / 2 - 70 + 40);
    pop();
  }

  // --- PATH WARNING (visual) & spawn timing ---
  if (pathWarningActive) {
    let elapsed = millis() - pathWarningStart;
    // compute alpha, base faded + flash when in last portion
    let baseAlpha = 60; // always semi transparent
    let alpha = baseAlpha;

    // If warning is in its last 700ms, flash stronger to grab attention
    let timeLeftToSpawn = PATH_WARNING_DURATION - elapsed;
    if (timeLeftToSpawn < 700 && timeLeftToSpawn > 0) {
      // flash oscillation
      let flashPhase = (millis() % PATH_FLASH_PERIOD) / PATH_FLASH_PERIOD;
      let flashVal = sin(flashPhase * TWO_PI); // -1..1
      // Map to 0..PATH_FLASH_AMPLITUDE
      alpha += map(flashVal, -1, 1, 0, PATH_FLASH_AMPLITUDE);
    }

    // draw faded path rectangle (wide enough to include cluster spread)
    push();
    noStroke();
    fill(255, 0, 0, alpha * 0.7); // keep fairly transparent
    rect(pathX - pathW / 2, 0, pathW, height);
    pop();

    // blinking "!" inside the path indicator (centered vertically top-ish so it's visible)
    let blinkPhase = (millis() % BLINK_PERIOD) / BLINK_PERIOD;
    let blinkOn = blinkPhase < 0.5;
    if (blinkOn) {
      push();
      textAlign(CENTER, TOP);
      textSize(36);
      fill(255, 220, 220, 220);
      // place the "!" near the top of the canvas inside the path rectangle for visibility
      text("!", pathX, 30);
      pop();
    }

    // spawn once warning duration elapsed
    if (elapsed >= PATH_WARNING_DURATION && eventActive) {
      // spawn a cluster (1..N) at pathX (spread inside pathW)
      spawnClusterAt(pathX);
      pathWarningActive = false;
      // schedule next path warning after spawn interval minus warning so cadence = spawn interval
      nextEventSpawnTime = millis() + EVENT_SPAWN_INTERVAL - PATH_WARNING_DURATION;
    }
  }

  // If event active and no active path warning, schedule next one when the time comes
  if (eventActive && !pathWarningActive) {
    if (nextEventSpawnTime <= 0) {
      // first spawn: schedule immediate warning so first spawn occurs PATH_WARNING_DURATION after scheduling
      scheduleNextPathWarning();
    } else if (millis() >= nextEventSpawnTime) {
      scheduleNextPathWarning();
    }

    // stop event if duration passed
    if (millis() - eventStartTime >= EVENT_DURATION) {
      eventActive = false;
      pathWarningActive = false;
      // schedule the next event based on score
      scheduleNextEvent();
      nextEventSpawnTime = 0;
    }
  }

  // --- update & draw falling spikes ---
  for (let i = fallingSpikes.length - 1; i >= 0; i--) {
    fallingSpikes[i].update();
    fallingSpikes[i].show();

    if (fallingSpikes[i].hitsPlayer(player)) {
      endGame();
      return;
    }

    if (fallingSpikes[i].offScreen()) {
      fallingSpikes.splice(i, 1);
    }
  }

  // --- normal pad loop ---
  for (let i = pads.length - 1; i >= 0; i--) {
    pads[i].update();
    pads[i].show();

    if (player.velocity.y > 0 && player.hits(pads[i])) {
      if (pads[i].isFake) {
        endGame();
        return;
      } else {
        player.jump();
        bounceSound.setVolume(0.3);
        bounceSound.play();
      }
    }

    if (player.velocity.y < 0 && pads[i].isSpike && player.hitsSpikesFromBelow(pads[i])) {
      endGame();
      return;
    }

    if (pads[i] && pads[i].offScreen()) {
      pads.splice(i, 1);
    }
  }

  if (player.pos.y < height / 2) {
    let diff = height / 2 - player.pos.y;
    player.pos.y = height / 2;
    scrollOffset += diff;
    score += int(diff * 0.1);

    for (let pad of pads) {
      pad.y += diff;
    }

    if (random(1) < 0.15) {
      spawnPadAtTop();
    }
  }

  player.update();
  player.show();

  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("High: " + highScore, 10, 10);
  text("Score: " + score, 10, 40);

  // small hint for debug (not intrusive)
  push();
  textSize(12);
  fill(200);
  textAlign(RIGHT, BOTTOM);
  text("Press E to trigger event (debug)", width - 8, height - 8);
  pop();
}

function keyPressed() {
  if (!gameStarted) return;

  let k = key.toLowerCase();

  if (!gameOver) {
    if (k === 'a' || keyCode === LEFT_ARROW) {
      currentDirectionKey = 'left';
      player.move(-1);
    } else if (k === 'd' || keyCode === RIGHT_ARROW) {
      currentDirectionKey = 'right';
      player.move(1);
    }
  }

  // debug toggle: press 'e' to force start event immediately
  if (k === 'e') {
    debugForceEvent = true;
  }

  if (gameOver && k === 'r') {
    gameOver = false;
    resetGame();
  }
}

function keyReleased() {
  if (!gameStarted || gameOver) return;

  let k = key.toLowerCase();

  if ((k === 'a' && currentDirectionKey === 'left') ||
      (keyCode === LEFT_ARROW && currentDirectionKey === 'left')) {
    currentDirectionKey = null;
    player.move(0);
  }

  if ((k === 'd' && currentDirectionKey === 'right') ||
      (keyCode === RIGHT_ARROW && currentDirectionKey === 'right')) {
    currentDirectionKey = null;
    player.move(0);
  }
}

function startGame() {
  resetGame();
  gameStarted = true;

  if (firstTime) {
    playButton.hide();
    firstTime = false;
  }

  if (!bgMusic.isPlaying()) {
    bgMusic.setVolume(0.1);
    bgMusic.loop();
  }
}

function resetGame() {
  checkHighScore();
  pads = [];
  score = 0;
  scrollOffset = 0;
  restartButton.hide();

  // clear falling spikes and event state when resetting
  fallingSpikes = [];
  eventActive = false;
  pathWarningActive = false;
  nextEventSpawnTime = 0;
  scheduleNextEvent();

  if (!bgMusic.isPlaying()) {
    bgMusic.setVolume(0.1);
    bgMusic.loop();
  }

  let startPad = new Pad(width / 2 - 40, height - 100, false, false, false);
  pads.push(startPad);

  let lastY = startPad.y;
  let lastX = startPad.x;

  for (let i = 1; i < 8; i++) {
    let y = lastY - random(90, 130);
    let x;

    do {
      x = constrain(lastX + random(-120, 120), 20, width - 100);
    } while (abs(x - lastX) < 60);

    let type = decidePadType(x, y);
    pads.push(new Pad(x, y, type.isFake, type.isSpike, type.isMoving));
    lastX = x;
    lastY = y;
  }

  player = new Player(startPad.x + startPad.w / 2, startPad.y - 20);
}

function endGame() {
  checkHighScore();
  gameOver = true;

  if (bgMusic.isPlaying()) {
    bgMusic.stop();
  }

  if (!gameOverSound.isPlaying()) {
    gameOverSound.setVolume(0.2);
    gameOverSound.play();
  }
}

// --- Event helpers ---

function startEventNow() {
  eventActive = true;
  eventStartTime = millis();
  eventPopupStart = millis();
  nextEventSpawnTime = 0; // schedule immediate path warning
  pathWarningActive = false;
}

function scheduleNextPathWarning() {
  pathX = random(20 + pathW / 2, width - 20 - pathW / 2);
  pathWarningActive = true;
  pathWarningStart = millis();
  nextEventSpawnTime = millis() + PATH_WARNING_DURATION;
}

function spawnClusterAt(x) {
  // determine cluster size by score (scales up with difficulty)
  let maxCluster = 1 + floor(constrain(score / 400, 0, 4)); // 1..5
  let count = floor(random(1, maxCluster + 1));

  for (let i = 0; i < count; i++) {
    let offset = random(-pathW / 2 + 8, pathW / 2 - 8);
    spawnFallingSpikeAt(x + offset);
  }
}

function spawnFallingSpikeAt(x) {
  let spike = new FallingSpike(x, -20);
  fallingSpikes.push(spike);
}

// --- pad spawning + other game functions ---
function spawnPadAtTop() {
  let highestPadY = min(...pads.map(p => p.y));
  let lastPad = pads.find(p => p.y === highestPadY);
  let y = lastPad.y - random(90, 130);
  let x;

  do {
    x = constrain(lastPad.x + random(-120, 120), 20, width - 100);
  } while (abs(x - lastPad.x) < 60);

  let type = decidePadType(x, y);
  pads.push(new Pad(x, y, type.isFake, type.isSpike, type.isMoving));
}

function decidePadType(x, y) {
  if (score >= 300 && random(1) < 0.10 && !nearbyPadType(y, 'spike')) {
    return { isFake: false, isSpike: true, isMoving: false };
  }
  if (random(1) < 0.20 && !nearbyPadType(y, 'spike') && !nearbyPadType(y, 'fake')) {
    return { isFake: true, isSpike: false, isMoving: false };
  }
  let movingChance = score >= 500 ? 0.40 : 0.15;
  if (random(1) < movingChance) {
    return { isFake: false, isSpike: false, isMoving: true };
  }
  return { isFake: false, isSpike: false, isMoving: false };
}

function nearbyPadType(y, type) {
  for (let p of pads) {
    if (abs(p.y - y) < 150) {
      if (type === 'spike' && p.isSpike) return true;
      if (type === 'fake' && p.isFake) return true;
    }
  }
  return false;
}

// --- Player / Pad classes (mostly unchanged) ---
class Player {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.prevPos = this.pos.copy();
    this.size = 40;
    this.velocity = createVector(0, 0);
    this.speed = 5;
    this.direction = 0;
  }

  update() {
    this.prevPos = this.pos.copy();
    this.velocity.y += gravity;
    this.pos.y += this.velocity.y;
    this.pos.x += this.direction * this.speed;

    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;

    if (this.pos.y > height + 200) {
      endGame();
    }
  }

  show() {
    fill(255);
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  move(dir) {
    this.direction = dir;
  }

  jump() {
    this.velocity.y = -jumpStrength;
  }

  hits(pad) {
    let bottomPrev = this.prevPos.y + this.size / 2;
    let bottomNow = this.pos.y + this.size / 2;
    let padTop = pad.y;
    let isCrossing = bottomPrev <= padTop && bottomNow >= padTop;

    let isWithinX = this.pos.x + this.size / 4 > pad.x &&
                    this.pos.x - this.size / 4 < pad.x + pad.w;

    return isCrossing && isWithinX && this.velocity.y > 0;
  }

  hitsSpikesFromBelow(pad) {
    let topPrev = this.prevPos.y - this.size / 2;
    let topNow = this.pos.y - this.size / 2;
    let spikeBottom = pad.y + pad.h;

    let isCrossing = topPrev >= spikeBottom && topNow <= spikeBottom;

    let isWithinX = this.pos.x + this.size / 4 > pad.x &&
                    this.pos.x - this.size / 4 < pad.x + pad.w;

    return isCrossing && isWithinX;
  }
}

class Pad {
  constructor(x, y, isFake = false, isSpike = false, isMoving = false) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.w = 80;
    this.h = 10;
    this.isFake = isFake;
    this.isSpike = isSpike;
    this.isMoving = isMoving;
    this.moveSpeed = 0.04 + random(0, 0.02);
    this.movePhase = random(TWO_PI);
  }

  update() {
    if (this.isMoving) {
      let minX = 20;
      let maxX = width - this.w - 20;
      let amplitude = (maxX - minX) / 2;
      let centerX = minX + amplitude;
      this.x = centerX + amplitude * sin(frameCount * this.moveSpeed + this.movePhase);
    }
  }

  show() {
    if (this.isSpike) {
      fill(0);
      rect(this.x, this.y, this.w, this.h, 12);

      let spikeCount = 4;
      let spikeWidth = this.w / spikeCount;
      stroke(255);
      strokeWeight(2);
      fill(30);
      for (let i = 0; i < spikeCount; i++) {
        let x1 = this.x + i * spikeWidth;
        let x2 = x1 + spikeWidth / 2;
        let x3 = x1 + spikeWidth;
        let y1 = this.y;
        let y2 = y1 - 15;
        beginShape();
        vertex(x1, y1);
        vertex(x2, y2);
        vertex(x3, y1);
        endShape(CLOSE);
      }
      noStroke();

    } else if (this.isFake) {
      fill(255, 70, 70);
      rect(this.x, this.y, this.w, this.h, 12);
    } else {
      fill(0, 200, 255);
      rect(this.x, this.y, this.w, this.h, 12);
      if (this.isMoving) {
        stroke(255, 255, 255, 100);
        strokeWeight(3);
        noFill();
        rect(this.x - 2, this.y - 2, this.w + 4, this.h + 4, 12);
        noStroke();
      }
    }
  }

  offScreen() {
    return this.y > height + 20;
  }
}

// --- Falling spike class (faster, longer, no spin) ---
class FallingSpike {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = random(3.8, 5.2); // faster initial drop speed
    this.size = random(20, 34); // wider base
    this.height = this.size * 1.8; // taller spike (longer)
    // no rotation
  }

  update() {
    this.vy += 0.20; // stronger gravity
    this.y += this.vy;
  }

  show() {
    push();
    translate(this.x, this.y);
    stroke(255);
    strokeWeight(1.2);
    fill(30);
    // draw a taller triangular spike: base centered, tip at bottom
    beginShape();
    vertex(-this.size / 2, -this.height / 2);
    vertex(this.size / 2, -this.height / 2);
    vertex(0, this.height / 2);
    endShape(CLOSE);
    noStroke();
    pop();
  }

  hitsPlayer(player) {
    let dx = this.x - player.pos.x;
    let dy = this.y - player.pos.y;
    let distSq = dx * dx + dy * dy;
    // use player's radius and an effective spike radius
    let r = (player.size / 2) + (this.size * 0.5);
    return distSq <= r * r;
  }

  offScreen() {
    return this.y > height + 80;
  }
}

function loadHighScore() {
  let savedScore = getItem('highscore');
  if (savedScore !== null) {
    highScore = savedScore;
  }
}

function checkHighScore() {
  if (score > highScore) {
    highScore = score;
    storeItem('highscore', highScore);
  }
}
