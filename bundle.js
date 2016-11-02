(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

const READY_TIMER = 2400;

/* Classes and Libraries */
const Game = require('./game');
const Vector = require('./vector');
const Camera = require('./camera');
const Player = require('./player');
const BulletPool = require('./bullet_pool');
const Enemy1 = require('./enemies/enemy1');
const Enemy2 = require('./enemies/enemy2');
const Enemy3 = require('./enemies/enemy3');
const Enemy4 = require('./enemies/enemy4');
const Enemy5 = require('./enemies/enemy5');
const Powerup = require('./powerup');


/* Global variables */
var canvas = document.getElementById('screen');
var screenSize = {width: canvas.width, height: canvas.height};
var game = new Game(canvas, update, render);
var input = {
  up: false,
  down: false,
  left: false,
  right: false,
  firing: false
}
// var camera = new Camera(canvas);
// var bullets = new BulletPool(10);
// var missiles = [];
// var player = new Player(bullets, missiles);
var player = new Player();
var debugInput = true;
var levels = [];
var curLevel = 0;
levels.push(new Image());
//levels.push(new Image());
//levels.push(new Image());
levels[0].src = 'assets/Backgrounds/level1.png';
//levels[1].src = 'assets/Backgrounds/level2.png';
//levels[2].src = 'assets/Backgrounds/level3.png';
var levelSize = {width: 810, height: 4320};
var levelTop = levelSize.height - screenSize.height;
var cloudTop = levelSize.height - screenSize.height;
var platTop = levelSize.height - screenSize.height;
var clouds = new Image();
clouds.src = 'assets/Backgrounds/clouds.png';
var platforms = new Image();
platforms.src = 'assets/Backgrounds/platforms.png';
var waitingEnemies = [];
var enemies = [];
var waitingPowerups = [];
var powerups = [];
var enemyShots = [];
var enemyTimer = 300;
var pKey = false;
var state = 'ready';
var countDown = READY_TIMER;  // Countdown for ready screen
var enemiesDestroyed = 0;
var levelDestroyed = 0;
var score = 0;
var levelScore = 0;
buildLevel();


/**
 * @function onkeydown
 * Handles keydown events
 */
window.onkeydown = function(event) {
  if(state == 'summary'){
    curLevel++;
    // start next level
    state == 'ready';
  }
  else if(state == 'dead'){
    // restart current level
    state == 'ready';
  }

  switch(event.key) {
    case "ArrowUp":
    case "w":
      event.preventDefault();
      if(state == 'running' || state == 'ready'){
        input.up = true;
        input.down = false;
      }
      break;
    case "ArrowDown":
    case "s":
      event.preventDefault();
      if(state == 'running' || state == 'ready'){
        input.down = true;
        input.up = false;
      }    
      break;
    case "ArrowLeft":
    case "a":
      event.preventDefault();
      if(state == 'running' || state == 'ready'){
        input.left = true;
        input.right = false;
      }    
      break;
    case "ArrowRight":
    case "d":
      event.preventDefault();
      if(state == 'running' || state == 'ready'){
        input.right = true;
        input.left = false;
      }    
      break;
    case " ":
      event.preventDefault();
      if(state == 'running'){
        input.firing = true;
      }
      break;
    case "p":
      event.preventDefault();
      if(!pKey){
        pKey = true;
        if(state == 'running'){
          state = 'paused';
        }
        else if(state == 'paused'){
          state = 'running';
          input = {
          up: false,
          down: false,
          left: false,
          right: false,
          firing: false
          }          
        }
      }
      break;      
    default:
      if(debugInput){
        debugInput = false;
        player.debug(event.key);
      }
      break;
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
      event.preventDefault();
      pKey = false;
      break;
    default:
      debugInput = true;
      break;
  }
}

/**
 * Pause game if window loses focus
 */
window.onblur = function(){
  // if(state == 'running' || state == 'ready'){
  //   state = 'paused';
  // }
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

  switch(state){
    case 'ready':
      // update the player
      player.update(elapsedTime, input);

      // Update countdown
      countDown -= elapsedTime;
      if(countDown <= 0){
        countDown = READY_TIMER;
        state = 'running';
        player.state = 'running';
      }
      break;

    case 'running':
      enemyTimer++;

      // Pop any waiting enemies whose start times have passed
      while(waitingEnemies.length){
        if(waitingEnemies[0].startTime <= enemyTimer){
          enemies.push(waitingEnemies[0]);
          waitingEnemies.splice(0, 1);
        }
        else break;
      }

      // Pop first waiting powerup off the waiting list and make active
      if(waitingPowerups.length && enemyTimer >= waitingPowerups[0].startTime){
        powerups.push(waitingPowerups[0]);
        waitingPowerups.splice(0, 1);
      }

      // Move the three backgrounds
      // levelTop-=1;
      // cloudTop -= 2;
      // platTop -= 3;
      if(levelTop <= 0) levelTop = levelSize.height;
      if(cloudTop <= 0) cloudTop = levelSize.height;
      if(platTop <= 0) platTop = levelSize.height;

      // update the player
      player.update(elapsedTime, input);

      // Update enemies
      var markedForRemoval = [];
      enemies.forEach(function(enemy, i){
        enemy.update(elapsedTime, player.position);
        if(enemy.remove)
          markedForRemoval.unshift(i);
      });
      // Remove enemies that are off-screen or have been destroyed
      markedForRemoval.forEach(function(index){
        enemies.splice(index, 1);
      });

      // Update enemy shots
      var markedForRemoval = [];
      enemyShots.forEach(function(shot, i){
        shot.update(elapsedTime);
        if(shot.remove)
          markedForRemoval.unshift(i);
      });
      // Remove shots that have hit player or go off screen
      markedForRemoval.forEach(function(index){
        enemyShots.splice(index, 1);
      });

      // Check for shot on player collisions
      check_player_hit();
      // Check for enemy on player collisions
      // Check for shot on enemy collisions
      // Check for player on powerup collisions

      // If player is dead, check lives count and act accordingly
      if(player.state == 'dead'){
        if(player.lives > 0){
          state = 'dead';
        }
        else{
          state = 'gameover';
        }
      }

      if(waitingEnemies.length == 0 && enemies.length == 0){
        player.state = 'finished';
        state = 'levelDone';
      }
      break;
    
    case 'levelDone':
      // update the player
      player.update(elapsedTime, input);
      if(player.state == 'offscreen'){
        if(curLevel < 2) state = 'summary';
          else state = 'gameDone';
      }
      // Update enemy shots
      var markedForRemoval = [];
      enemyShots.forEach(function(shot, i){
        shot.update(elapsedTime);
        if(shot.remove)
          markedForRemoval.unshift(i);
      });
      // Remove shots that have hit player or go off screen
      markedForRemoval.forEach(function(index){
        enemyShots.splice(index, 1);
      });      
      break;
    case 'gameDone':
    case 'paused':
    case 'dead':
    case 'gameover':
    case 'summary':
  }
}


function check_player_hit(){
  for(var i = 0; i < enemyShots.length; i++){
    var playerX = player.position.x + 23;
    var playerY = player.position.y + 27;
    var shotX = enemyShots[i].position.x + 5;
    var shotY = enemyShots[i].position.y + 5;

    if(!(shotX + 5 < playerX - 25||
       shotX - 5 > playerX + 25 ||
       shotY + 5 < playerY - 25 ||
       shotY - 5 > playerY + 25))
    {
        enemyShots.splice(i, 1);
        player.struck(2);
    }
  }
}


function restart(){

}



/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {

  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, 1024, screenSize.height);

{/********* Draw far background *********/
  if(levelTop < levelSize.height - screenSize.height){  
    ctx.drawImage(levels[curLevel], 
                  0, levelTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height
                  );
  }

  else{
    ctx.drawImage(levels[curLevel], 
                  0, levelTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height 
                  );
    ctx.drawImage(levels[curLevel], 
                  0, 0, levelSize.width, screenSize.height,
                  0, (levelSize.height - levelTop), levelSize.width, screenSize.height 
                  );
  }
}/***************************************/

{/************* Draw clouds *************/
  ctx.globalAlpha = 0.7;
  if(cloudTop < levelSize.height - screenSize.height){  
    ctx.drawImage(clouds, 
                  0, cloudTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height
                  );
  }

  else{
    ctx.drawImage(clouds, 
                  0, cloudTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height 
                  );
    ctx.drawImage(clouds, 
                  0, 0, levelSize.width, screenSize.height,
                  0, (levelSize.height - cloudTop), levelSize.width, screenSize.height 
                  );
  }
  ctx.globalAlpha = 1;
}/***************************************/

{/************ Draw platforms ***********/
  if(platTop < levelSize.height - screenSize.height){  
    ctx.drawImage(platforms, 
                  0, platTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height
                  );
  }

  else{
    ctx.drawImage(platforms, 
                  0, platTop, levelSize.width, screenSize.height,
                  0, 0, levelSize.width, screenSize.height 
                  );
    ctx.drawImage(platforms, 
                  0, 0, levelSize.width, screenSize.height,
                  0, (levelSize.height - platTop), levelSize.width, screenSize.height 
                  );
  }
}/***************************************/

  ctx.font = "30px Arial";
  ctx.strokeText(enemyTimer, 840, 600);
  ctx.strokeText(player.shields, 840, 550);
  ctx.stroke();

  // Render enemies
  for(var i = 0; i < enemies.length; i++){
    enemies[i].render(elapsedTime, ctx);
  }

  // Render enemy shots
  for(var i = 0; i < enemyShots.length; i++){
    enemyShots[i].render(elapsedTime, ctx);
  }

  // Render the player
  player.render(elapsedTime, ctx);

  // Render the GUI 
  renderGUI(elapsedTime, ctx);

  switch(state){
    case 'ready':
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "75px impact";
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.textAlign = "center";
      ctx.fillText(Math.ceil(countDown/(READY_TIMER/3)),  levelSize.width/2, canvas.height/2); 
      ctx.strokeText(Math.ceil(countDown/(READY_TIMER/3)),  levelSize.width/2, canvas.height/2);
      break;
    case 'running':
      break;
    case 'paused':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.font = "50px impact";
      ctx.fillText("PAUSED", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("PAUSED", levelSize.width/2, canvas.height/2); 
      break;
    case 'dead':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "60px Georgia, serif";
      ctx.fillStyle = "red";
      ctx.strokeStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText("YOU DIED", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("YOU DIED", levelSize.width/2, canvas.height/2); 
      ctx.font = "35px impact";
      ctx.fillStyle = "black";
      ctx.fillText("Lives remaining: " + score, levelSize.width/2, canvas.height/2 + 40);
      ctx.fillText("Press any key to continue", levelSize.width/2, canvas.height/2 + 80);
      break;
    case 'gameover':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "60px Georgia, serif";
      ctx.fillStyle = "red";
      ctx.strokeStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText("YOU DIED", levelSize.width/2, canvas.height/2 - 75); 
      ctx.strokeText("YOU DIED", levelSize.width/2, canvas.height/2 - 75);       
      ctx.font = "40px impact";
      ctx.fillText("GAME OVER", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("GAME OVER", levelSize.width/2, canvas.height/2); 
      ctx.font = "35px impact";
      ctx.fillStyle = "black";
      ctx.fillText("Final Score: " + score, levelSize.width/2, canvas.height/2 + 40);
      ctx.fillText("Total Enemies Destroyed: " + enemiesDestroyed, levelSize.width/2, canvas.height/2 + 80);
      break;
    case 'gameDone':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "60px impact";
      ctx.fillStyle = "red";
      ctx.strokeStyle = 'black';
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("GAME OVER", levelSize.width/2, canvas.height/2); 
      ctx.font = "35px impact";
      ctx.fillStyle = "black";
      ctx.fillText("Final Score: " + score, levelSize.width/2, canvas.height/2 + 40);
      ctx.fillText("Total Enemies Destroyed: " + enemiesDestroyed, levelSize.width/2, canvas.height/2 + 80);
      break;      
    case 'summary':
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, levelSize.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "60px impact";
      ctx.fillStyle = "white";
      ctx.strokeStyle = 'black';
      ctx.textAlign = "center";
      ctx.fillText("LEVEL COMPLETE!", levelSize.width/2, canvas.height/2); 
      ctx.strokeText("LEVEL COMPLETE!", levelSize.width/2, canvas.height/2); 
      ctx.font = "35px impact";
      ctx.fillStyle = "black";
      ctx.fillText("Level Score: " + levelScore, levelSize.width/2, canvas.height/2 + 40);
      ctx.fillText("Enemies Destroyed: " + enemiesDestroyed, levelSize.width/2, canvas.height/2 + 80);
      break;
  }
}


function buildLevel(){
  // Drop powerups
  waitingPowerups = [];
  switch(curLevel){
    case 0:
      waitingPowerups.push(new Powerup({x: 400, y: -50}, 1000, 1));
      waitingPowerups.push(new Powerup({x: 600, y: -50}, 2000, 4));
      waitingPowerups.push(new Powerup({x: 200, y: -50}, 3000, 3));
      break;

    case 1:
      waitingPowerups.push(new Powerup({x: 400, y: -50}, 1000, 4));
      waitingPowerups.push(new Powerup({x: 600, y: -50}, 2000, 2));
      waitingPowerups.push(new Powerup({x: 200, y: -50}, 3000, 1));
      break;

    case 2:
      waitingPowerups.push(new Powerup({x: 400, y: -50}, 1000, 3));
      waitingPowerups.push(new Powerup({x: 600, y: -50}, 2000, 4));
      waitingPowerups.push(new Powerup({x: 200, y: -50}, 3000, 1));    
      break;

    default:
      break;
  }

  waitingEnemies = [];
  enemies = [];
  // Enemy 1
  for(var k = 0; k < 4; k++){
    for(var i = 0; i < 5; i++){
      for(var j =0; j < 3; j++){
        waitingEnemies.push(new Enemy1({x: 200 + 100*i, y: -50}, 300 + 100*i + 10*j + 1000*k, curLevel, enemyShots));
      }
    }
  }

  // Enemy 2
    // waitingEnemies.push(new Enemy2({x: 650, y: 100}, 0, curLevel, enemyShots))
    // waitingEnemies.push(new Enemy2({x: 300, y: 300}, 0, curLevel, enemyShots))
    // waitingEnemies.push(new Enemy2({x: 500, y: 550}, 0, curLevel, enemyShots))
  
  var multiplier = 1440;
  for(var i = 0; i < 3; i++){
    waitingEnemies.push(new Enemy2({x: 650, y: -100}, multiplier*i + 115, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 480, y: -50}, multiplier*i + 170, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 100, y: -50}, multiplier*i + 200, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 400, y: -50}, multiplier*i + 390, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 700, y: -50}, multiplier*i + 430, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 50, y: -50}, multiplier*i + 590, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 300, y: -50}, multiplier*i + 590, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 150, y: -50}, multiplier*i + 700, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 650, y: -50}, multiplier*i + 750, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 270, y: -50}, multiplier*i + 800, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 700, y: -50}, multiplier*i + 850, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 700, y: -50}, multiplier*i + 950, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 50, y: -50}, multiplier*i + 1000, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 200, y: -50}, multiplier*i + 1050, curLevel, enemyShots))
    waitingEnemies.push(new Enemy2({x: 150, y: -50}, multiplier*i + 1100, curLevel, enemyShots))
  }

  // Enemy 3
  var direction = 1;
  for(var i = 0; i < 8; i++){
    waitingEnemies.push(new Enemy3({x: (405 - 405*direction) - (12 + 12*direction) , y: 100 + i*60}, 100, i%2+1, curLevel, enemyShots))
    direction *= -1;
  }
  for(var i = 0; i < 8; i++){
    waitingEnemies.push(new Enemy3({x: (405 - 405*direction) - (12 + 12*direction) , y: 100 + i*60}, 2800, i%2+1, curLevel, enemyShots))
    direction *= -1;
  }
  for(var i = 0; i < 8; i++){
    waitingEnemies.push(new Enemy3({x: (405 - 405*direction) - (12 + 12*direction) , y: 100 + i*60}, 3800, i%2+1, curLevel, enemyShots))
    direction *= -1;
  }    
  for(var i = 0; i < 6; i++){
    waitingEnemies.push(new Enemy3({x: 60 + 130*i, y: -50}, 900 + 20*i, 0, curLevel, enemyShots))
    waitingEnemies.push(new Enemy3({x: 400, y: -50}, 1700 + 50*i, 0, curLevel, enemyShots))
    waitingEnemies.push(new Enemy3({x: 400, y: -50}, 2000 + 50*i, 0, curLevel, enemyShots))
    waitingEnemies.push(new Enemy3({x: 400, y: -50}, 3000 + 50*i, 0, curLevel, enemyShots))
  }  


  // Enemy 4
  for(var i = 0; i < 5; i++){
    waitingEnemies.push(new Enemy4({x: -50, y: -50}, 600 +  20*i, 1, curLevel, enemyShots))
  }
  for(var j = 0; j < 4; j++){
    for(var i = 0; i < 5; i++){
      waitingEnemies.push(new Enemy4({x: -50, y: -50}, 1000 + 1000*j +  20*i, 1, curLevel, enemyShots))
    }
  }
  for(var j = 0; j < 3; j++){
    for(var i = 0; i < 5; i++){
      waitingEnemies.push(new Enemy4({x: 860, y: -50}, 1100 +  1100*j +  20*i, -1, curLevel, enemyShots))
    }  
  }


  // Enemy 5
  for(var i = 0; i < 5; i++){
    waitingEnemies.push(new Enemy5({x: 10, y: -50}, 1100 + 30*i, 1, curLevel, enemyShots))
  }
  for(var i = 0; i < 5; i++){
    waitingEnemies.push(new Enemy5({x: 800, y: -50}, 2800 + 30*i, -1, curLevel, enemyShots))
  }  

  // Sort waiting enemies list from least startTime to greatest
  waitingEnemies.sort(function(a, b){
    return a.startTime - b.startTime;
  });
}

/**
  * @function renderGUI
  * Renders the game's GUI
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx
  */
function renderGUI(elapsedTime, ctx) {
  // TODO: Render the GUI
}

},{"./bullet_pool":2,"./camera":3,"./enemies/enemy1":4,"./enemies/enemy2":5,"./enemies/enemy3":6,"./enemies/enemy4":7,"./enemies/enemy5":8,"./game":9,"./player":10,"./powerup":11,"./vector":17}],2:[function(require,module,exports){
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

},{"./vector":17}],4:[function(require,module,exports){
"use strict";

const SPEED = 5;
const MS_PER_FRAME = 1000/16;

const EnemyShot = require('../shots/enemy_shot');

/**
 * @module exports the Enemy1 class
 */
module.exports = exports = Enemy1;


/**
 * @constructor Enemy1
 * Creates a new enemy1 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy1(position, startTime, level, enemyShots) {
    this.level = level;
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
    this.imgWidth = 15;
    this.imgHeight = 19;
    this.width = 2*this.imgWidth;
    this.height = 2*this.imgHeight;
    this.enemyShots = enemyShots;
    this.shotWait = 1500 - 150*this.level;
    this.shotTimer = this.shotWait;
}


/**
 * @function updates the enemy1 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy1.prototype.update = function(time, playerPos) {
    this.frameTimer -= time;
    if(this.frameTimer <= 0){
        this.frameTimer = MS_PER_FRAME;
        this.frame++;
        if(this.frame >= 8){
            this.frame = 0;
        }
    }


    // Fire when ready
    this.shotTimer -= time;
    if(this.shotTimer <= 0){
        this.enemyShots.push(new EnemyShot({x: this.position.x + 10,
                                            y: this.position.y + 10},
                                            playerPos));
        this.shotTimer = this.shotWait;
    }


    // Apply velocity
    this.position.y += SPEED;

    if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
      this.position.y < -50 || this.position.y > this.worldHeight + 50){
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
                  this.imgWidth*this.frame, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}

},{"../shots/enemy_shot":12}],5:[function(require,module,exports){
"use strict";

const MOVEMENT = 0;
const MS_PER_FRAME = 1000/5;

const EnemyShot = require('../shots/enemy_shot');

/**
 * @module exports the Enemy2 class
 */
module.exports = exports = Enemy2;


/**
 * @constructor Enemy2
 * Creates a new enemy2 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy2(position, startTime, level, enemyShots) {
    this.level = level;
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.position = {
        x: position.x,
        y: position.y
    };
    this.image = new Image();
    this.image.src = 'assets/using/enemies/enemy_2.png';
    this.remove = false;
    this.frame = 0;
    this.frameTimer = MS_PER_FRAME;
    this.imgWidth = 24;
    this.imgHeight = 28;
    this.width = 2.25*this.imgWidth;
    this.height = 2.25*this.imgHeight;
    this.state = 'default';
    this.enemyShots = enemyShots;
    this.shotWait = 1500 - 150*this.level;
    this.shotTimer = this.shotWait;
}


/**
 * @function updates the enemy2 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy2.prototype.update = function(time, playerPos) {
    if(this.state == 'firing'){
        this.frameTimer -= time;
        if(this.frameTimer <= 0){
            this.frameTimer = MS_PER_FRAME;
            this.frame++;
            if(this.frame >= 3){
                this.enemyShots.push(new EnemyShot({x: this.position.x + 10,
                                                    y: this.position.y + 10},
                                                    playerPos));
                this.state = 'default';
                this.frame = 0;
            }
        }
    }

    // Fire when ready
    this.shotTimer -= time;
    if(this.shotTimer <= 0){
        this.state = 'firing';
        this.shotTimer = this.shotWait;
    }

    // Apply movement
    this.position.y += MOVEMENT;

    if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
        this.position.y < -50 || this.position.y > this.worldHeight + 50){
        this.remove = true;;
    }
}

/**
 * @function renders the enemy2 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy2.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.imgWidth*this.frame, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}

},{"../shots/enemy_shot":12}],6:[function(require,module,exports){
"use strict";

const SPEED = 4;

const EnemyShot = require('../shots/enemy_shot');

/**
 * @module exports the Enemy3 class
 */
module.exports = exports = Enemy3;


/**
 * @constructor Enemy3
 * Creates a new enemy3 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy3(position, startTime, type, level, enemyShots) {
    this.level = level;    
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.type = type; // 0: flies down, 1: right, 2: left
    this.position = {
        x: position.x,
        y: position.y
    };
    this.image = new Image();
    this.image.src = 'assets/using/enemies/enemy_3.png';
    this.remove = false;
    this.imgWidth = 24;
    this.imgHeight = 26;
    this.width = 2*this.imgWidth;
    this.height = 2*this.imgHeight;
    this.enemyShots = enemyShots;
    this.shotWait = 1500 - 150*this.level;
    this.shotTimer = this.shotWait;
}


/**
 * @function updates the enemy3 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy3.prototype.update = function(time, playerPos) {
    // Apply velocity
    switch(this.type){
        case 0:
            this.position.y += SPEED;
            break;
        case 1:
            this.position.x += SPEED;
            break;
        case 2:
            this.position.x -= SPEED;
            break;
    }

    // Fire when ready
    // this.shotTimer -= time;
    // if(this.shotTimer <= 0){
    //     this.enemyShots.push(new EnemyShot({x: this.position.x + 10,
    //                                         y: this.position.y + 10},
    //                                         playerPos));
    //     this.shotTimer = this.shotWait;
    // }

    if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
        this.position.y < -50 || this.position.y > this.worldHeight + 50){
        this.remove = true;;
    }
}

/**
 * @function renders the enemy3 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy3.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.imgWidth*this.type, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}

},{"../shots/enemy_shot":12}],7:[function(require,module,exports){
"use strict";

const MS_PER_FRAME = 1000/8;

const EnemyShot = require('../shots/enemy_shot');

/**
 * @module exports the Enemy4 class
 */
module.exports = exports = Enemy4;


/**
 * @constructor Enemy4
 * Creates a new enemy4 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy4(position, startTime, acceleration, level, enemyShots) {
    this.level = level;    
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.acceleration = acceleration; // initial direction. 1 = right, -1 = left
    this.position = {
        x: position.x,
        y: position.y
    };
    this.velocity = {
        x: 8 * this.acceleration,
        y: 5
    }
    this.image = new Image();
    this.image.src = 'assets/using/enemies/enemy_4.png';
    this.remove = false;
    this.frame = 0;
    this.frameTimer = MS_PER_FRAME;
    this.imgWidth = 24;
    this.imgHeight = 18;
    this.width = 2*this.imgWidth;
    this.height = 2*this.imgHeight;
    this.enemyShots = enemyShots;
    this.shotWait = 1500 - 150*this.level;
    this.shotTimer = this.shotWait;
}


/**
 * @function updates the enemy4 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy4.prototype.update = function(time, playerPos) {
    this.frameTimer -= time;
    if(this.frameTimer <= 0){
        this.frameTimer = MS_PER_FRAME;
        this.frame++;
        if(this.frame >= 5){
            this.frame = 0;
        }
    }

    // Apply velocity
    this.position.y += this.velocity.y;
    this.position.x += this.velocity.x;

    // Apply acceleration
    this.velocity.x -= this.acceleration/10;


    // Fire when ready
    this.shotTimer -= time;
    if(this.shotTimer <= 0){
        this.enemyShots.push(new EnemyShot({x: this.position.x + 10,
                                            y: this.position.y + 10},
                                            playerPos));
        this.shotTimer = this.shotWait;
    }  

    if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
        this.position.y < -50 || this.position.y > this.worldHeight + 50){
        this.remove = true;;
    }
}

/**
 * @function renders the enemy4 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Enemy4.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.imgWidth*this.frame, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}

},{"../shots/enemy_shot":12}],8:[function(require,module,exports){
"use strict";

const MS_PER_FRAME = 1000/16;
const DIST_TO_SWITCH = 150;

const EnemyShot = require('../shots/enemy_shot');

/**
 * @module exports the Enemy5 class
 */
module.exports = exports = Enemy5;


/**
 * @constructor Enemy5
 * Creates a new enemy5 object
 * @param {Postition} position object specifying an x and y
 */
function Enemy5(position, startTime, direction, level, enemyShots) {
    this.level = level;
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
        y: 5
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
    this.shotWait = 1500 - 150*this.level;
    this.shotTimer = this.shotWait;
    this.enemyShots = enemyShots;
}


/**
 * @function updates the enemy5 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Enemy5.prototype.update = function(time, playerPos) {
    // Update frames
    this.frameTimer -= time;
    if(this.frameTimer <= 0){
        this.frameTimer = MS_PER_FRAME;
        this.frame++;
        if(this.frame >= 8){
            this.frame = 0;
        }
    }

    // Fire when ready
    // this.shotTimer -= time;
    // if(this.shotTimer <= 0){
    //     this.enemyShots.push(new EnemyShot({x: this.position.x + 10,
    //                                         y: this.position.y + 10},
    //                                         playerPos));
    //     this.shotTimer = this.shotWait;
    // }

    // Swap x and y velocity every so often for zig zagging
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

},{"../shots/enemy_shot":12}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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
    this.velocity.x = 0;
    this.velocity.y = -PLAYER_SPEED;
    if(this.position.y < -50){
      this.state = 'offscreen';
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
  if(this.position.y < 36 && (this.state == 'running' || this.state == 'ready')) this.position.y = 36;

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
    ctx.drawImage(this.shield, 0 ,0, 556, 556, -11, -5, 70, 70);  
  }

  ctx.restore();

  // Render shots
  for(var i = 0; i < this.shots.length; i++){
    this.shots[i].render(elapsedTime, ctx);
  }
}
},{"./shots/shot1":13,"./shots/shot2":14,"./shots/shot3":15,"./shots/shot4":16,"./vector":17}],11:[function(require,module,exports){
"use strict";

const SPEED = 3;

/**
 * @module exports the Powerup class
 */
module.exports = exports = Powerup;


/**
 * @constructor Powerup
 * Creates a new powerup object
 * @param {Postition} position object specifying an x and y
 */
function Powerup(position, startTime, type) {
    this.startTime = startTime;
    this.worldWidth = 850;
    this.worldHeight = 800;
    this.type = type;
    this.position = {
        x: position.x,
        y: position.y
    };
    this.image = new Image();
    this.image.src = 'assets/using/powerups/powerup_' + type + '.png';
    this.remove = false;
    this.imgWidth = 20;
    this.imgHeight = 21;
    this.width = 1.5*this.imgWidth;
    this.height = 1.5*this.imgHeight;
    this.radius = this.width/2;
}


/**
 * @function updates the powerup object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Powerup.prototype.update = function(time) {
  // Apply velocity
  this.position.y += SPEED;

  if(this.position.x < -50 || this.position.x > this.worldWidth + 50 ||
     this.position.y < -50 || this.position.y > this.worldHeight + 50){
    this.remove = true;;
  }
}

/**
 * @function renders the powerup into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Powerup.prototype.render = function(time, ctx) {
    ctx.drawImage(this.image,
                  this.imgWidth*this.frame, 0, this.imgWidth, this.imgHeight,
                  this.position.x, this.position.y, this.width, this.height
                  );  
}

},{}],12:[function(require,module,exports){
"use strict";

const Vector = require('../vector');

const SPEED = 4;

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
  var direction = Vector.subtract(position, playerPos);
  var position = Vector.add(position, {x:30, y:30});
  this.velocity = Vector.scale(Vector.normalize(direction), SPEED);

  this.position = {
    x: position.x,
    y: position.y
  };
  // this.velocity = {
  //     x: 3 * (Math.PI/2 - angle)/(Math.PI/2),
  //     y: 3 * (angle - Math.PI/2)/(Math.PI/2)
  // }
  this.image = new Image();
  this.image.src = 'assets/using/shots/enemy_shot.png';
  this.radius = 5;
  this.remove = false;
}


/**
 * @function updates the enemyShot object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
EnemyShot.prototype.update = function(time) {
  // Apply velocity
  this.position.x -= this.velocity.x;
  this.position.y -= this.velocity.y;

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
    ctx.drawImage(this.image, 0 ,0, 11, 11, this.position.x, this.position.y, 10, 10);  
}

},{"../vector":17}],13:[function(require,module,exports){
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
  this.worldWidth = 850;
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

},{}],14:[function(require,module,exports){
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
  this.worldWidth = 850;
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

},{}],15:[function(require,module,exports){
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
  this.worldWidth = 850;
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

},{}],16:[function(require,module,exports){
"use strict";

const SPEED = 8;

/**
 * @module exports the Shot4 class
 */
module.exports = exports = Shot4;


/**
 * @constructor Shot4
 * Creates a new shot4 object
 * @param {Postition} position object specifying an x and y
 */
function Shot4(position, direction, level) {
  this.worldWidth = 850;
  this.worldHeight = 750;
  this.direction = direction;
  this.level = level;
  this.position = {
    x: position.x + 11 + 10*this.direction,
    y: position.y
  };
  this.image = new Image();
  this.image.src = 'assets/using/shots/shots_4.png';
  this.remove = false;
}


/**
 * @function updates the shot4 object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Shot4.prototype.update = function(time) {
  // Apply velocity
  this.position.x += SPEED * this.direction;

  if(this.position.x < 0 || this.position.x > this.worldWidth ||
     this.position.y < 0 || this.position.y > this.worldHeight){
    this.remove = true;;
  }
}

/**
 * @function renders the shot4 into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Shot4.prototype.render = function(time, ctx) {
    ctx.translate(this.position.x, this.position.y);
    ctx.drawImage(this.image, 28*this.level + 7 + 7*this.direction ,0, 14, 10, 0, 20, 28, 20);  
    ctx.translate(-this.position.x, -this.position.y);

}

},{}],17:[function(require,module,exports){
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
