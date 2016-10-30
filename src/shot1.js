"use strict";

const SPEED = 8;

/**
 * @module exports the Shot1 class
 */
module.exports = exports = Shot1;


/**
 * @constructor Shot1
 * Creates a new shot1 object
 * @param {Postition} position object specifying an x and y
 */
function Shot1(position, level) {
  this.worldWidth = 1100;
  this.worldHeight = 750;
  this.position = {
    x: position.x + 11,
    y: position.y - 20
  };
  this.level = level;
  this.image = new Image();
  this.image.src = 'assets/using/shots/shots_1.png';
  this.remove = false;
}


/**
 * @function updates the shot1 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Shot1.prototype.update = function(time) {
  // Apply velocity
  this.position.y -= SPEED;

  if(this.position.x < -50 || this.position.x > this.worldWidth ||
     this.position.y < -50 || this.position.y > this.worldHeight){
    this.remove = true;;
  }
}

/**
 * @function renders the shot1 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Shot1.prototype.render = function(time, ctx) {
    ctx.translate(this.position.x, this.position.y);
    ctx.drawImage(this.image, 12*this.level ,0, 12, 13, 0, 10, 24, 26);  
    ctx.translate(-this.position.x, -this.position.y);
}
