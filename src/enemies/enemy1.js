"use strict";

const SPEED = 5;
const MS_PER_FRAME = 1000/16;

/**
 * @module exports the Enemy1 class
 */
module.exports = exports = Enemy1;


/**
 * @constructor Enemy1
 * Creates a new enemy1 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy1(position, startTime) {
  this.startTime = startTime;
  this.worldWidth = 850;
  this.worldHeight = 800;
  this.position = {
    x: position.x,
    y: position.y
  };
  this.image = new Image();
  this.image.src = 'assets/using/enemies/enemy_1.png';
  this.remove = false;
  this.frame = 0;
  this.frameTimer = MS_PER_FRAME;
  this.width = 15;
  this.height = 19;
}


/**
 * @function updates the enemy1 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy1.prototype.update = function(time) {
    this.frameTimer -= time;
    if(this.frameTimer <= 0){
        this.frameTimer = MS_PER_FRAME;
        this.frame++;
        if(this.frame >= 8){
            this.frame = 0;
        }
    }

  // Apply velocity
  this.position.y += SPEED;

  if(this.position.x < 0 || this.position.x > this.worldWidth ||
     this.position.y < -100 || this.position.y > this.worldHeight){
    this.remove = true;;
  }
}

/**
 * @function renders the enemy1 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy1.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.width*this.frame, 0, this.width, this.height,
                  this.position.x, this.position.y, 2*this.width, 2*this.height
                  );  
}
