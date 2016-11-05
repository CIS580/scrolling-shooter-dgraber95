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
var enemyTimer = 0;
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
      levelTop -= 1;
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
        enemy.update(elapsedTime, player.position);
        if(enemy.remove)
          markedForRemoval.unshift(i);
      });
      // Remove enemies that are off-screen or have been destroyed
      markedForRemoval.forEach(function(index){
        enemies.splice(index, 1);
      });

      // Update powerups
      var markedForRemoval = [];
      powerups.forEach(function(powerup, i){
        powerup.update(elapsedTime);
        if(powerup.remove)
          markedForRemoval.unshift(i);
      });
      // Remove powerups that are off-screen or have been destroyed
      markedForRemoval.forEach(function(index){
        powerups.splice(index, 1);
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
      check_powerups();

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


function check_powerups(){
  for(var i = 0; i < powerups.length; i++){
    var playerX = player.position.x + 23;
    var playerY = player.position.y + 27;
    var powerupX = powerups[i].position.x + 5;
    var powerupY = powerups[i].position.y + 5;

    if((Math.pow((player.position.y + 27) - (powerups[i].position.y + 21), 2) + 
        Math.pow((player.position.x + 23) - (powerups[i].position.x + 20), 2) <= 
        Math.pow(45, 2))){
          player.pickupPowerup(powerups[i].type);
          powerups.splice(i, 1);

        }
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

  // Render powerups
  for(var i = 0; i < powerups.length; i++){
    powerups[i].render(elapsedTime, ctx);
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
      waitingPowerups.push(new Powerup({x: 400, y: -50}, 100, 1));
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
