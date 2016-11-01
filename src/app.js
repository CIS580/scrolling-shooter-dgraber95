"use strict";

/* Classes and Libraries */
const Game = require('./game');
const Vector = require('./vector');
const Camera = require('./camera');
const Player = require('./player');
const BulletPool = require('./bullet_pool');
const Enemy1 = require('./enemies/enemy1');


/* Global variables */
var canvas = document.getElementById('screen');
var screenSize = {width: canvas.width, height: canvas.height}
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
levels.push(new Image());
levels.push(new Image());

levels[0].src = 'assets/Backgrounds/level1.png';
levels[1].src = 'assets/Backgrounds/level2.png';
levels[2].src = 'assets/Backgrounds/level3.png';

var levelSize = {width: 810, height: 4320};
var levelTop = levelSize.height - screenSize.height;

var waitingEnemies = [];
buildLevel();


var enemies = [];
var enemyTimer = 0;


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
    default:
      debugInput = true;
      break;
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

  enemyTimer++;

  if(waitingEnemies.length && enemyTimer >= waitingEnemies[0].startTime){
    enemies.push(waitingEnemies[0]);
    waitingEnemies.splice(0, 1);
  }

  levelTop-=2;
  if(levelTop <= 0) levelTop = levelSize.height;

  // update the player
  player.update(elapsedTime, input);

  // Update enemies
  var markedForRemoval = [];
  enemies.forEach(function(enemy, i){
    enemy.update(elapsedTime);
    if(enemy.remove)
      markedForRemoval.unshift(i);
  });
  // Remove enemies that are off-screen or have been destroyed
  markedForRemoval.forEach(function(index){
    enemies.splice(index, 1);
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
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, 1024, screenSize.height);

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

  for(var i = 0; i < enemies.length; i++){
    enemies[i].render(elapsedTime, ctx);
  }

  // Render the player
  player.render(elapsedTime, ctx);  

  // Render the GUI 
  renderGUI(elapsedTime, ctx);
}

function buildLevel(){
  for(var i = 0; i < 5; i++){
    for(var j =0; j < 5; j++){
      waitingEnemies.push(new Enemy1({x: 200, y: -50}, 100*i + 10*j));
    }
  }
  var direction = 1;
  for(var i = 0; i < 8; i++){
    waitingEnemies.push(new Enemy3({x: (405 - 405*direction) - (12 + 12*direction) , y: 100 + i*30}, 600, i%2+1))
    direction *= -1;
  }
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
