"use strict";

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
buildLevel();
var enemies = [];
var waitingPowerups = [];
var powerups = [];
var enemyShots = [];
var enemyTimer = 0;
var pKey = false;
var state = 'ready';


/**
 * @function onkeydown
 * Handles keydown events
 */
window.onkeydown = function(event) {
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
  if(state == 'running' || state == 'ready'){
    state = 'paused';
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

  switch(state){
    case 'ready':

      break;

    case 'running':

      break;

    case 'paused':

      break;

    case 'dead':

      break;

    case 'gameover':

      break;

    case 'summary':

      break;
  }

  enemyTimer++;
  console.log(enemyTimer);

  // Pop first waiting enemy off the waiting list and make active
  if(waitingEnemies.length && enemyTimer >= waitingEnemies[0].startTime){
    enemies.push(waitingEnemies[0]);
    waitingEnemies.splice(0, 1);
  }

  // Pop first waiting powerup off the waiting list and make active
  if(waitingPowerups.length && enemyTimer >= waitingPowerups[0].startTime){
    powerups.push(waitingPowerups[0]);
    waitingPowerups.splice(0, 1);
  }

  // Move the three backgrounds
  levelTop-=1;
  cloudTop -= 2;
  platTop -= 3;
  if(levelTop <= 0) levelTop = levelSize.height;
  if(cloudTop <= 0) cloudTop = levelSize.height;
  if(platTop <= 0) platTop = levelSize.height;

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

  ctx.font = "30px Arial";
  ctx.strokeText(enemyTimer, 820, 600);
  ctx.stroke();

/********* Draw far background *********/
{
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
}
/***********************************/



/********* Draw clouds *********/
{
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
}
/***********************************/




/********* Draw platforms *********/
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
/***********************************/


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
      for(var j =0; j < 5; j++){
        waitingEnemies.push(new Enemy1({x: 200 + 100*i, y: -50}, 300 + 100*i + 10*j + 1000*k, curLevel, enemyShots));
      }
    }
  }

  // Enemy 2
  var multiplier = 1440;
  for(var i = 0; i < 3; i++){
    waitingEnemies.push(new Enemy2({x: 650, y: -50}, multiplier*i + 115, curLevel, enemyShots))
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
  for(var i = 0; i < 8; i++){
    waitingEnemies.push(new Enemy4({x: -50, y: -50}, 600 +  10*i, 1, curLevel, enemyShots))
  }
  for(var j = 0; j < 4; j++){
    for(var i = 0; i < 8; i++){
      waitingEnemies.push(new Enemy4({x: -50, y: -50}, 1000 + 1000*j +  10*i, 1, curLevel, enemyShots))
    }
  }
  for(var j = 0; j < 3; j++){
    for(var i = 0; i < 8; i++){
      waitingEnemies.push(new Enemy4({x: 860, y: -50}, 1100 +  1100*j +  10*i, -1, curLevel, enemyShots))
    }  
  }


  // Enemy 5
  for(var i = 0; i < 6; i++){
    waitingEnemies.push(new Enemy5({x: 10, y: -50}, 1100 + 30*i, 1, curLevel, enemyShots))
  }
  for(var i = 0; i < 6; i++){
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
