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
var level1Size = {width: 810, height: 4320};
var level1Top = level1Size.height - 786;

var waitingEnemies = [];
for(var i = 0; i < 20; i++){
  for(var j =0; j < 5; j++){
    waitingEnemies.push(new Enemy1({x: 200, y: -50}, 100*i + 10*j));
  }
}
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
      if(temp){
        temp = false;
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
      temp = true;
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

  level1Top-=2;
  if(level1Top <= 0) level1Top = level1Size.height;

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
  ctx.fillRect(0, 0, 1024, 786);

  ctx.font = "30px Arial";
  ctx.strokeText(level1Top, 820, 750);
  ctx.strokeText(enemyTimer, 820, 600);
  ctx.stroke();


  // TODO: Render backgroundsa

  if(level1Top < level1Size.height - 786){  
    ctx.drawImage(level1, 
                  0, level1Top, level1Size.width, 786,
                  0, 0, level1Size.width, 786
                  );
  }

  else{
    ctx.drawImage(level1, 
                  0, level1Top, level1Size.width, 786,
                  0, 0, level1Size.width, 786 
                  );
    ctx.drawImage(level1, 
                  0, 0, level1Size.width, 786,
                  0, (level1Size.height - level1Top), level1Size.width, 786 
                  );                    
  }

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
    
    for(var i = 0; i < enemies.length; i++){
      enemies[i].render(elapsedTime, ctx);
    }

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
