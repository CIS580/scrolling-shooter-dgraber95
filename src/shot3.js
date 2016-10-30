"use strict";

const SPEED = 5;

/**
 * @module exports the Shot3 class
 */
module.exports = exports = Shot3;


/**
 * @constructor Shot3
 * Creates a new shot3 object
 * @param {Postition} position object specifying an x and y
 */
function Shot3(position, level) {
  this.worldWidth = 1100;
  this.worldHeight = 750;
  this.level = level;
  this.position = {
    x: position.x + 11,
    y: position.y
  };
  this.image = new Image();
  this.image.src = 'assets/using/shots/shots_3.png';
  this.remove = false;
}


/**
 * @function updates the shot3 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Shot3.prototype.update = function(time) {
  // Apply velocity
  this.position.y -= SPEED;

  if(this.position.x < -50 || this.position.x > this.worldWidth ||
     this.position.y < -50 || this.position.y > this.worldHeight){
    this.remove = true;;
  }
}

/**
 * @function renders the shot3 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Shot3.prototype.render = function(time, ctx) {
    ctx.translate(this.position.x, this.position.y);
    ctx.drawImage(this.image, 9*this.level ,0, 9, 14, 0, 20, 18, 28);  
    ctx.translate(-this.position.x, -this.position.y);
    
}
