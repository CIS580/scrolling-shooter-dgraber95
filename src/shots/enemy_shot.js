"use strict";

/**
 * @module exports the EnemyShot class
 */
module.exports = exports = EnemyShot;


/**
 * @constructor EnemyShot
 * Creates a new enemyShot object
 * @param {Postition} position object specifying an x and y
 */
function EnemyShot(position, playerPos) {
  this.worldWidth = 810;
  this.worldHeight = 786;
  this.position = {
    x: position.x,
    y: position.y
  };
  this.velocity = {
      x: playerPos.x - this.position.x,
      y: playerPos.y - this.position.y
  }
  this.image = new Image();
  this.image.src = 'assets/using/shots/enemyShot.png';
  this.radius = 4;
  this.remove = false;
}


/**
 * @function updates the enemyShot object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
EnemyShot.prototype.update = function(time) {
  // Apply velocity
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;

  if(this.position.x < -50 || this.position.x > this.worldWidth ||
     this.position.y < -50 || this.position.y > this.worldHeight){
    this.remove = true;;
  }
}

/**
 * @function renders the enemyShot into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
EnemyShot.prototype.render = function(time, ctx) {
    // TODO: draw properly
    //ctx.drawImage(this.image, 12*this.level ,0, 12, 13, 0, 10, 24, 26);  
}
