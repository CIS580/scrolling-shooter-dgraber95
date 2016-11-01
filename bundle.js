(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Game = require('./game');
const Vector = require('./vector');
const Camera = require('./camera');
const Player = require('./player');
const BulletPool = require('./bullet_pool');


/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var input = {
  up: false,
  down: false,
  left: false,
  right: false,
  firing: false
}
var camera = new Camera(canvas);
var bullets = new BulletPool(10);
var missiles = [];
var player = new Player(bullets, missiles);

var temp = true;

var level1 = new Image();
level1.src = 'assets/Backgrounds/Grassy.png';

/**
 * @function onkeydown
 * Handles keydown events
 */
window.onkeydown = function(event) {
  switch(event.key) {
    case "ArrowUp":
    case "w":
      input.up = true;
      input.down = false;
      event.preventDefault();
      break;
    case "ArrowDown":
    case "s":
      input.down = true;
      input.up = false;
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "a":
      input.left = true;
      input.right = false;
      event.preventDefault();
      break;
    case "ArrowRight":
    case "d":
      input.right = true;
      input.left = false;
      event.preventDefault();
      break;
    case " ":
      input.firing = true;
      event.preventDefault();
      break;
    case "p":
      if(temp){
        temp = false;
        player.updateShot1();
      }
  }
}

/**
 * @function onkeyup
 * Handles keydown events
 */
window.onkeyup = function(event) {
  switch(event.key) {
    case "ArrowUp":
    case "w":
      input.up = false;
      event.preventDefault();
      break;
    case "ArrowDown":
    case "s":
      input.down = false;
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "a":
      input.left = false;
      event.preventDefault();
      break;
    case "ArrowRight":
    case "d":
      input.right = false;
      event.preventDefault();
      break;
    case " ":
      input.firing = false;
      event.preventDefault();
      break;      
    case "p":
      temp = true;
  }
}

/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());

/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {

  // update the player
  player.update(elapsedTime, input);

  // update the camera
  camera.update(player.position);

  // Update bullets
  bullets.update(elapsedTime, function(bullet){
    if(!camera.onScreen(bullet)) return true;
    return false;
  });

  // Update missiles
  var markedForRemoval = [];
  missiles.forEach(function(missile, i){
    missile.update(elapsedTime);
    if(Math.abs(missile.position.x - camera.x) > camera.width * 2)
      markedForRemoval.unshift(i);
  });
  // Remove missiles that have gone off-screen
  markedForRemoval.forEach(function(index){
    missiles.splice(index, 1);
  });
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 1024, 786);

  // TODO: Render background
  ctx.drawImage(level1, 0, 0, 1200, 6400, 0, 0, 600, 3200);

  // Transform the coordinate system using
  // the camera position BEFORE rendering
  // objects in the world - that way they
  // can be rendered in WORLD cooridnates
  // but appear in SCREEN coordinates
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  renderWorld(elapsedTime, ctx);
  ctx.restore();

  // Render the GUI without transforming the
  // coordinate system
  renderGUI(elapsedTime, ctx);
}

/**
  * @function renderWorld
  * Renders the entities in the game world
  * IN WORLD COORDINATES
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function renderWorld(elapsedTime, ctx) {
    // Render the bullets
    bullets.render(elapsedTime, ctx);

    // Render the missiles
    missiles.forEach(function(missile) {
      missile.render(elapsedTime, ctx);
    });

    // Render the player
    player.render(elapsedTime, ctx);
}

/**
  * @function renderGUI
  * Renders the game's GUI IN SCREEN COORDINATES
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx
  */
function renderGUI(elapsedTime, ctx) {
  // TODO: Render the GUI
}

},{"./bullet_pool":2,"./camera":3,"./game":4,"./player":5,"./vector":9}],2:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = BulletPool;

/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function BulletPool(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
BulletPool.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
BulletPool.prototype.update = function(elapsedTime, callback) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
BulletPool.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "black";
  for(var i = 0; i < this.end; i++) {
    ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
    ctx.arc(this.pool[4*i], this.pool[4*i+1], 2, 0, 2*Math.PI);
  }
  ctx.fill();
  ctx.restore();
}

},{}],3:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');

/**
 * @module Camera
 * A class representing a simple camera
 */
module.exports = exports = Camera;

/**
 * @constructor Camera
 * Creates a camera
 * @param {Rect} screen the bounds of the screen
 */
function Camera(screen) {
  this.x = 0;
  this.y = 0;
  this.width = screen.width;
  this.height = screen.height;
}

/**
 * @function update
 * Updates the camera based on the supplied target
 * @param {Vector} target what the camera is looking at
 */
Camera.prototype.update = function(target) {
  // TODO: Align camera with player
}

/**
 * @function onscreen
 * Determines if an object is within the camera's gaze
 * @param {Vector} target a point in the world
 * @return true if target is on-screen, false if not
 */
Camera.prototype.onScreen = function(target) {
  return (
     target.x > this.x &&
     target.x < this.x + this.width &&
     target.y > this.y &&
     target.y < this.y + this.height
   );
}

/**
 * @function toScreenCoordinates
 * Translates world coordinates into screen coordinates
 * @param {Vector} worldCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toScreenCoordinates = function(worldCoordinates) {
  return Vector.subtract(worldCoordinates, this);
}

/**
 * @function toWorldCoordinates
 * Translates screen coordinates into world coordinates
 * @param {Vector} screenCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toWorldCoordinates = function(screenCoordinates) {
  return Vector.add(screenCoordinates, this);
}

},{"./vector":9}],4:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],5:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');
const Shot1 = require('./shot1');
const Shot2 = require('./shot2');
const Shot3 = require('./shot3');

/* Constants */
const PLAYER_SPEED = 7;
const BULLET_SPEED = 14;
const SHOT1_TIMER = 200;
const SHOT3_TIMER = 600;

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
function Player(bullets, missiles) {
  this.missiles = missiles;
  this.missileCount = 4;
  this.bullets = bullets;
  this.angle = 0;
  this.angle_offset = 0;
  this.position = {x: 200, y: 200};
  this.velocity = {x: 0, y: 0};
  this.img = new Image();
  this.img.src = 'assets/using/ship/ship.png';
  this.guns = new Image();
  this.guns.src = 'assets/using/ship/side_guns.png';
  this.shield = new Image();
  this.shield.src = 'assets/using/ship/shield.png';
  this.shots = [];
  this.shot1Timer = SHOT1_TIMER;
  this.shot3Timer = SHOT3_TIMER;
  this.shot1Level = 0;
  this.shot3Level = 0;
}

Player.prototype.updateShot1 = function(){
  if(this.shot1Level < 3){
    this.shot1Level++;
  }
  else this.shot1Level = 0;

  if(this.shot3Level == 0) this.shot3Level = 1;
  else this.shot3Level = 0;
}

/**
 * @function update
 * Updates the player based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * @param {Input} input object defining input, must have
 * boolean properties: up, left, right, down
 */
Player.prototype.update = function(elapsedTime, input) {

  // set the velocity
  this.velocity.x = 0;
  if(input.left) this.velocity.x -= PLAYER_SPEED;
  if(input.right) this.velocity.x += PLAYER_SPEED;
  this.velocity.y = 0;
  if(input.up) this.velocity.y -= PLAYER_SPEED / 2;
  if(input.down) this.velocity.y += PLAYER_SPEED;

  // determine player angle
  this.angle = 0;
  if(this.velocity.x < 0) this.angle = -1;
  if(this.velocity.x > 0) this.angle = 1;

  // move the player
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;

  // don't let the player move off-screen
  if(this.position.x < 44) this.position.x = 44;
  if(this.position.x > 980) this.position.x = 980;
  if(this.position.y > 750) this.position.y = 750;
  if(this.position.y < 36) this.position.y = 36;

  this.shot1Timer -= elapsedTime;
  this.shot3Timer -= elapsedTime;

  if(input.firing){
    if(this.shot1Timer <= 0){
      this.shots.push(new Shot1(this.position, this.shot1Level));
      this.shots.push(new Shot2(this.position, -1));
      this.shots.push(new Shot2(this.position, 1));
      this.shot1Timer = SHOT1_TIMER;
    }
    if(this.shot3Timer <= 0){
      var posx = this.position.x;
      var posy = this.position.y;
      this.shots.push(new Shot3({x: posx - 27, y : posy}, this.shot3Level));
      this.shots.push(new Shot3({x: posx + 33, y: posy}, this.shot3Level));
      this.shot3Timer = SHOT3_TIMER;      
    }
  }

  for(var i = 0; i < this.shots.length; i++){
    this.shots[i].update(elapsedTime);
  }
  if(this.shots.length && this.shots[this.shots.length - 1].remove){
    this.shots.splice(this.shots.length - 1, 1);
  }
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
  ctx.drawImage(this.img, 42+offset, 0, 21, 27, 0, 0, 46, 54);
  ctx.drawImage(this.guns, 0 ,0, 41, 13, -18, 15, 82, 26);  
  ctx.drawImage(this.shield, 0 ,0, 556, 556, -27, -20, 100, 100);  
  ctx.restore();

  for(var i = 0; i < this.shots.length; i++){
    this.shots[i].render(elapsedTime, ctx);
  }
}

/**
 * @function fireBullet
 * Fires a bullet
 * @param {Vector} direction
 */
Player.prototype.fireBullet = function(direction) {
  var position = Vector.add(this.position, {x:30, y:30});
  var velocity = Vector.scale(Vector.normalize(direction), BULLET_SPEED);
  this.bullets.add(position, velocity);
}

/**
 * @function fireMissile
 * Fires a missile, if the player still has missiles
 * to fire.
 */
Player.prototype.fireMissile = function() {
  if(this.missileCount > 0){
    var position = Vector.add(this.position, {x:0, y:30})
    var missile = new Missile(position);
    this.missiles.push(missile);
    this.missileCount--;
  }
}

},{"./shot1":6,"./shot2":7,"./shot3":8,"./vector":9}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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
  this.worldWidth = 1100;
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

  if(this.position.x < -50 || this.position.x > this.worldWidth ||
     this.position.y < -50 || this.position.y > this.worldHeight){
    this.remove = true;;
  }
}

/**
 * @function renders the shot2 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Shot2.prototype.render = function(time, ctx) {
    ctx.translate(this.position.x, this.position.y);
    ctx.drawImage(this.image, 6 + 6*this.direction ,0, 12, 12, 0, 20, 18, 18);  
    ctx.translate(-this.position.x, -this.position.y);
}

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
"use strict";

/**
 * @module Vector
 * A library of vector functions.
 */
module.exports = exports = {
  add: add,
  subtract: subtract,
  scale: scale,
  rotate: rotate,
  dotProduct: dotProduct,
  magnitude: magnitude,
  normalize: normalize
}


/**
 * @function rotate
 * Scales a vector
 * @param {Vector} a - the vector to scale
 * @param {float} scale - the scalar to multiply the vector by
 * @returns a new vector representing the scaled original
 */
function scale(a, scale) {
 return {x: a.x * scale, y: a.y * scale};
}

/**
 * @function add
 * Computes the sum of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed sum
*/
function add(a, b) {
 return {x: a.x + b.x, y: a.y + b.y};
}

/**
 * @function subtract
 * Computes the difference of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed difference
 */
function subtract(a, b) {
  return {x: a.x - b.x, y: a.y - b.y};
}

/**
 * @function rotate
 * Rotates a vector about the Z-axis
 * @param {Vector} a - the vector to rotate
 * @param {float} angle - the angle to roatate by (in radians)
 * @returns a new vector representing the rotated original
 */
function rotate(a, angle) {
  return {
    x: a.x * Math.cos(angle) - a.y * Math.sin(angle),
    y: a.x * Math.sin(angle) + a.y * Math.cos(angle)
  }
}

/**
 * @function dotProduct
 * Computes the dot product of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed dot product
 */
function dotProduct(a, b) {
  return a.x * b.x + a.y * b.y
}

/**
 * @function magnitude
 * Computes the magnitude of a vector
 * @param {Vector} a the vector
 * @returns the calculated magnitude
 */
function magnitude(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

/**
 * @function normalize
 * Normalizes the vector
 * @param {Vector} a the vector to normalize
 * @returns a new vector that is the normalized original
 */
function normalize(a) {
  var mag = magnitude(a);
  return {x: a.x / mag, y: a.y / mag};
}

},{}]},{},[1]);
