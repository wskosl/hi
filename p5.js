let player;
let pads = [];
let gravity = 0.5;
let jumpStrength = 16;
let scrollOffset = 0;
let score = 0;

function setup() {
  createCanvas(400, 600);
  resetGame();
}

function draw() {
  background(30, 30, 50);

  for (let i = pads.length - 1; i >= 0; i--) {
    pads[i].show();

    if (player.velocity.y > 0 && player.hits(pads[i])) {
      if (pads[i].isFake) {
        resetGame(); // Reset on red pad touch
        return; // Stop rest of draw after reset
      } else {
        player.jump();
      }
    }

    if (pads[i] && pads[i].offScreen()) {
      pads.splice(i, 1);
    }
  }

  // Scroll screen upward
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
  text("Score: " + score, 10, 10);
}

function keyPressed() {
  if (key === 'A' || keyCode === LEFT_ARROW) {
    player.move(-1);
  } else if (key === 'D' || keyCode === RIGHT_ARROW) {
    player.move(1);
  }
}

function keyReleased() {
  if (key === 'A' || keyCode === LEFT_ARROW || key === 'D' || keyCode === RIGHT_ARROW) {
    player.move(0);
  }
}

function resetGame() {
  pads = [];
  score = 0;
  scrollOffset = 0;

  let startPad = new Pad(width / 2 - 40, height - 100, false);
  pads.push(startPad);

  let lastY = startPad.y;
  let lastX = startPad.x;

  for (let i = 1; i < 8; i++) {
    let y = lastY - random(90, 140);
    let x;

    do {
      x = constrain(lastX + random(-120, 120), 20, width - 100);
    } while (abs(x - lastX) < 60);

    let isFake = random(1) < 0.05; // 5% chance red pad now
    pads.push(new Pad(x, y, isFake));
    lastX = x;
    lastY = y;
  }

  player = new Player(startPad.x + startPad.w / 2, startPad.y - 20);
}

function spawnPadAtTop() {
  let highestPadY = min(...pads.map(p => p.y));
  let lastPad = pads.find(p => p.y === highestPadY);
  let y = lastPad.y - random(90, 140);
  let x;

  do {
    x = constrain(lastPad.x + random(-120, 120), 20, width - 100);
  } while (abs(x - lastPad.x) < 60);

  let isFake = random(1) < 0.05; // 5% chance red pad now
  pads.push(new Pad(x, y, isFake));
}

class Player {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 40;
    this.velocity = createVector(0, 0);
    this.speed = 5;
    this.direction = 0;
  }

  update() {
    this.velocity.y += gravity;
    this.pos.y += this.velocity.y;
    this.pos.x += this.direction * this.speed;

    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;

    if (this.pos.y > height + 200) {
      resetGame();
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
    let nextY = this.pos.y + this.velocity.y;
    let playerBottom = nextY + this.size / 2;

    let padTop = pad.y;
    let isWithinX = this.pos.x > pad.x && this.pos.x < pad.x + pad.w;

    return (
      playerBottom >= padTop &&
      playerBottom <= padTop + 10 &&
      isWithinX &&
      this.velocity.y > 0
    );
  }
}

class Pad {
  constructor(x, y, isFake = false) {
    this.x = x;
    this.y = y;
    this.w = 80;
    this.h = 10;
    this.isFake = isFake;
  }

  show() {
    if (this.isFake) {
      fill(255, 70, 70);
    } else {
      fill(0, 200, 255);
    }
    rect(this.x, this.y, this.w, this.h);
  }

  offScreen() {
    return this.y > height + 20;
  }
}
