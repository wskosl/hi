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
