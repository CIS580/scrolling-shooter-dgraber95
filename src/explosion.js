"use strict";

var fHz = 1000/60; // The update frequency

const Particle = require('./particle');

/**
 * @module exports the Explosion class
 */
module.exports = exports = Explosion;


/**
 * @constructor Explosion
 * Creates a new explosion object
 * @param {Postition} position object specifying an x and y
 */
function Explosion(position, colors) {
	this.particles = [];    // List of particles in the explosion
	this._killed = false;   // flag indicating if the explosion is done

    for ( var i = 0; i < colors.length; i++ ) {
        this.createExplosion({x: position.x, y: position.y}, colors[i]);
    }
}

/**
 * @function 
 */
Explosion.prototype.createExplosion = function(position, color) {
    // Number of particles to use
    var numParticles = 12;

    // Particle size parameters
    // Controls the size of the particle.
    var minSize = 5;
    var maxSize = 20;

    // Particle speed parameters
    // Controls how quickly the particle
    // speeds outwards from the blast center.
    var minSpeed = 60.0;
    var maxSpeed = 300.0;

    // Scaling speed parameters
    // Controls how quickly the particle shrinks.
    var minScaleSpeed = 1.0;
    var maxScaleSpeed = 2.0;

    // Uniformly distribute the particles in a circle
    for ( var angle=0; angle<360; angle += Math.round(360/numParticles) ) {
        
        // Create a new particle
        var speed = Math.randomFloat(minSpeed, maxSpeed);
        var particle = new Particle({x: position.x, y: position.y},                   // Position
                                    Math.randomFloat(minSize, maxSize), // Radius
                                    color,                              // Color
                                    Math.randomFloat(minScaleSpeed, maxScaleSpeed), // Scale speed
                                    {x: speed * Math.cos(angle * Math.PI / 180.0),
                                        y: speed * Math.sin(angle * Math.PI / 180.0)}   // Velocity
                                    );

        // Add the particle to the list of particles in the explosion
        this.particles.push(particle);
    }
}


/**
 * @function updates the explosion object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Explosion.prototype.update = function(time) {

    var remove = [];
    if (this.particles.length <= 0) {
        this._killed = true;
        return;	
    }
    
    for (var i = 0; i < this.particles.length; i++){
        this.particles[i].update();
        if(this.particles[i].remove){
            remove.unshift(i);
        }
    }

    for(var i = 0; i < remove.length; i++){
        this.particles.splice(i, 1);
    }
}


/**
 * @function renders the explosion into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Explosion.prototype.render = function(time, ctx) {
    for ( var i = 0; i < this.particles.length; i++) {
        this.particles[i].render(time, ctx);
    }
}


/*
 * randomFloat
 * Augments the Math library with a function
 * to generate random float values between
 * a given interval.
 */
Math.randomFloat = function(min, max){
	return min + Math.random()*(max-min);
};