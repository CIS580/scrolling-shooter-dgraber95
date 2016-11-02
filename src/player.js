"use strict";

/* Classes and Libraries */
const Vector = require('./vector');
const Shot1 = require('./shots/shot1');
const Shot2 = require('./shots/shot2');
const Shot3 = require('./shots/shot3');
const Shot4 = require('./shots/shot4');

/* Constants */
const PLAYER_SPEED = 7;
const BULLET_SPEED = 14;
const SHOT12_TIMER = 200;
const SHOT34_TIMER = 600;
const SHIELD_TIMER = 100;

/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = Player;

/**
 * @constructor Player
 * Creates a player
 * @param {BulletPool} bullets the bullet pool
 */
function Player() {
  this.angle = 0;
  this.angle_offset = 0;
  this.position = {x: 405, y: 500};
  this.velocity = {x: 0, y: 0};
  this.img = new Image();
  this.img.src = 'assets/using/ship/ship.png';
  this.guns = new Image();
  this.guns.src = 'assets/using/ship/side_guns.png';
  this.shield = new Image();
  this.shield.src = 'assets/using/ship/shield.png';
  this.shots = [];
  this.shot12Timer = SHOT12_TIMER;
  this.shot34Timer = SHOT34_TIMER;
  this.shot1Level = 0;
  this.shot2Level = -1;
  this.shot3Level = -1;
  this.shot4Level = -1;
  this.shielding = false;
  this.shieldTimer = SHIELD_TIMER;
  this.shields = 100;
  this.lives = 3;
  this.state = 'ready';
}

Player.prototype.debug = function(key){
  switch(key){
    case '1': // Base gun
      this.pickupPowerup(1);
      break;
    case '2': // Green angled shots
      this.pickupPowerup(2);
      break;
    case '3': // Missiles
      this.pickupPowerup(3);
      break;
    case '4': // Horizontal shots
      this.pickupPowerup(4);
      break;
    case 'o': // shield
      this.shielding = true;
      break;
    case 'r': // reset shot levels
      this.shot1Level = 0;
      this.shot2Level = -1;
      this.shot3Level = -1;
      this.shot4Level = -1;
      break;   
  }
}

Player.prototype.struck = function(damage){
  if(this.shields > 0){
    this.shielding = true;
    this.shields -= damage;
  }
  else{
    // Destroy player
    this.state = 'exploding';
  }
}

Player.prototype.pickupPowerup = function(powerup){
  switch(powerup){
    case 1: // Base gun
      if(this.shot1Level < 3) this.shot1Level++;
      break;
    case 2: // Green angled shots
      if(this.shot2Level < 0) this.shot2Level++;
      break;
    case 3: // Missiles
      if(this.shot3Level < 1) this.shot3Level++;
      break;
    case 4: // Horizontal shots
      if(this.shot4Level < 2) this.shot4Level++;
      break;
  }
}

/**
 * @function update
 * Updates the player based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * @param {Input} input object defining input, must have
 * boolean properties: up, left, right, down
 */
Player.prototype.update = function(elapsedTime, input) {
  if(this.shielding){
    this.shieldTimer -= elapsedTime;
    if(this.shieldTimer <= 0){
      this.shielding = false;
      this.shieldTimer = SHIELD_TIMER;
    }
  }

  if(this.state == 'running' || this.state == 'ready'){
    // set the velocity
    this.velocity.x = 0;
    if(input.left) this.velocity.x -= PLAYER_SPEED;
    if(input.right) this.velocity.x += PLAYER_SPEED;
    this.velocity.y = 0;
    if(input.up) this.velocity.y -= PLAYER_SPEED / 2;
    if(input.down) this.velocity.y += PLAYER_SPEED;
  }
  else if(this.state == 'finished'){
    this.velocity.y -= PLAYER_SPEED * 4;
    if(this.position.y < -50){
      this.state == 'offscreen';
    }
  }

  // determine player angle
  this.angle = 0;
  if(this.velocity.x < 0) this.angle = -1;
  if(this.velocity.x > 0) this.angle = 1;

  // move the player
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;

  // don't let the player move off-screen
  if(this.position.x < 10) this.position.x = 10;
  if(this.position.x > 750) this.position.x = 750;
  if(this.position.y > 750) this.position.y = 750;
  if(this.position.y < 36 && this.state != 'finished') this.position.y = 36;

  this.shot12Timer -= elapsedTime;
  this.shot34Timer -= elapsedTime;


  // add necessary shots
  if(input.firing && this.state == 'running'){
    if(this.shot12Timer <= 0){
      this.shots.push(new Shot1(this.position, this.shot1Level));
      if(this.shot2Level >= 0){
        this.shots.push(new Shot2(this.position, -1));
        this.shots.push(new Shot2(this.position, 1));
      }
      this.shot12Timer = SHOT12_TIMER;
    }
    if(this.shot34Timer <= 0){
      var posx = this.position.x;
      var posy = this.position.y;
      if(this.shot3Level >= 0){
        this.shots.push(new Shot3({x: posx - 27, y : posy}, this.shot3Level));
        this.shots.push(new Shot3({x: posx + 33, y: posy}, this.shot3Level));
      }
      if(this.shot4Level >= 0){
        this.shots.push(new Shot4(this.position, -1, this.shot4Level));
        this.shots.push(new Shot4(this.position, 1, this.shot4Level));
      }
      this.shot34Timer = SHOT34_TIMER;
    }
  }

  var markedForRemoval = [];
  var self = this;
  for(var i = 0; i < this.shots.length; i++){
    this.shots[i].update(elapsedTime);
    if(this.shots[i].remove){
      markedForRemoval.unshift(i);
    }
  }
  markedForRemoval.forEach(function(index){
    self.shots.splice(index, 1);
  });
}

/**
 * @function render
 * Renders the player helicopter in world coordinates
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
Player.prototype.render = function(elapsedTime, ctx) {
  var offset = this.angle * 21;
  ctx.save();
  ctx.translate(this.position.x, this.position.y);

  // Draw ship
  ctx.drawImage(this.img, 42+offset, 0, 21, 27, 0, 0, 46, 54);

  // Draw missle launchers
  if(this.shot3Level >= 0){
    ctx.drawImage(this.guns, 0 ,0, 41, 13, -18, 15, 82, 26);
  }

  // Draw shield
  if(this.shielding){
    ctx.drawImage(this.shield, 0 ,0, 556, 556, -27, -20, 100, 100);  
  }

  ctx.restore();

  // Render shots
  for(var i = 0; i < this.shots.length; i++){
    this.shots[i].render(elapsedTime, ctx);
  }
}