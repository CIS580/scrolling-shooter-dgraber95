"use strict";

const SPEED = 8;

/**
 * @module exports the Shot2 class
 */
module.exports = exports = Shot2;


/**
 * @constructor Shot2
 * Creates a new shot2 object
 * @param {Postition} position object specifying an x and y
 */
function Shot2(position, direction) {
  this.worldWidth = 980;
  this.worldHeight = 750;
  this.direction = direction
  this.position = {
    x: position.x + 11,
    y: position.y
  };
  this.image = new Image();
  this.image.src = 'assets/using/shots/shots_2.png';
  this.remove = false;
}


/**
 * @function updates the shot2 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Shot2.prototype.update = function(time) {
  // Apply velocity
  this.position.y -= SPEED;
  this.position.x += SPEED * this.direction;

  if(this.position.x < 0 || this.position.x > this.worldWidth ||
     this.position.y < 0 || this.position.y > this.worldHeight){
    this.remove = true;;
  }
}

/**
 * @function renders the shot2 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Shot2.prototype.render = function(time, ctx) {
    ctx.save();

    ctx.translate(this.position.x, this.position.y);
    ctx.drawImage(this.image, 6 + 6*this.direction ,0, 12, 12, 0, 20, 18, 18);  

    ctx.restore();
}
