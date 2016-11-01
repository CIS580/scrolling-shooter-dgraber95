"use strict";

const MS_PER_FRAME = 1000/16;
const DIST_TO_SWITCH = 50;

/**
 * @module exports the Enemy5 class
 */
module.exports = exports = Enemy5;


/**
 * @constructor Enemy5
 * Creates a new enemy5 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy5(position, startTime, direction) {
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.direction = direction; // direction. 1 = right, -1 = left
    this.position = {
        x: position.x,
        y: position.y
    };
    this.velocity = {
        x: 0,
        y: 3
    }
    this.image = new Image();
    this.image.src = 'assets/using/enemies/enemy_5.png';
    this.distanceTravelled = 0;
    this.remove = false;
    this.frame = 0;
    this.frameTimer = MS_PER_FRAME;
    this.imgWidth = 21;
    this.imgHeight = 21;
    this.width = 2*this.imgWidth;
    this.height = 2*this.imgHeight;
}


/**
 * @function updates the enemy5 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy5.prototype.update = function(time) {
    this.frameTimer -= time;
    if(this.frameTimer <= 0){
        this.frameTimer = MS_PER_FRAME;
        this.frame++;
        if(this.frame >= 8){
            this.frame = 0;
        }
    }

    this.distanceTravelled += 3;
    if(this.distanceTravelled >= DIST_TO_SWITCH){
        var temp = this.velocity.y;
        this.velocity.y = this.velocity.x;
        this.velocity.x = temp;
        this.distanceTravelled = 0;
    }

    // Apply velocity
    this.position.y += this.velocity.y;
    this.position.x += this.velocity.x * this.direction;

    if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
       this.position.y < -50 || this.position.y > this.worldHeight + 50){
        this.remove = true;;
    }
}

/**
 * @function renders the enemy5 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy5.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.imgWidth*this.frame, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}
