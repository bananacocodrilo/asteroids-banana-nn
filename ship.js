// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/hacZU523FyM

function Ship(color, borderColor) {
    // Number of diviews for the field of view
    const viewSections = 10;
    // Max distance the ship can see in each direction
    const maxHorizon = 1000;

    this.pos = createVector(width / 2, height / 2);
    this.r = 20;
    this.heading = 0;
    this.rotation = 0;
    this.vel = createVector(0, 0);
    this.isBoosting = false;
    this.view = new Array(viewSections).fill(maxHorizon)
    this.color = color;
    this.borderColor = borderColor;

    this.boosting = function(b) {
        this.isBoosting = b;
    }

    this.update = function() {
        // Update heading
        this.heading += this.rotation;
        if(this.heading > TWO_PI){
            this.heading -= TWO_PI; 
        }else if(this.heading < 0){
            this.heading = TWO_PI - this.heading;
        }

        // Update acceleration
        if (this.isBoosting) {
            this.boost();
        }

        // Update position
        this.pos.add(this.vel);
        
        // Decrease speed for next turn
        this.vel.mult(0.99);

        // Calculate if ship goes offscreen
        if (this.pos.x > width + this.r) {
            this.pos.x = -this.r;
        } else if (this.pos.x < -this.r) {
            this.pos.x = width + this.r;
        }
        if (this.pos.y > height + this.r) {
            this.pos.y = -this.r;
        } else if (this.pos.y < -this.r) {
            this.pos.y = height + this.r;
        }
    }

    this.boost = function() {
        var force = p5.Vector.fromAngle(this.heading);
        force.mult(0.1);
        this.vel.add(force);
    }

    this.hits = function(asteroid) {
        let d = dist(this.pos.x, this.pos.y, asteroid.pos.x, asteroid.pos.y);

        if (d < this.r + asteroid.r) {
            return true;
        } else {

            if(d < maxHorizon){
                this.look(d, asteroid);
            }

            return false;
        }
    }


    this.clearView = function(){
        for(let i = 0; i < this.view.length; i++){
            this.view[i] = maxHorizon;
        }
    }

    this.look = function(d, asteroid){
        let dy = asteroid.pos.y - this.pos.y;
        let dx = asteroid.pos.x - this.pos.x;
        // Angle of the asteroid viewed from the ship.
        let angleViewed = Math.atan2(dy, dx) + PI - this.heading;
        // Gives an integuer between 0 and viewSections to use as index.
        let viewSection  = Math.floor(viewSections * (angleViewed) / TWO_PI);
        
        if(d < this.view[viewSection]){
            this.view[viewSection] = d;
        }

        return null;
    }


    this.render = function() {
        push();
        
        translate(this.pos.x, this.pos.y);
        rotate(this.heading + PI / 2);
        
        strokeWeight(4);
        stroke(this.borderColor);
        fill(this.color);
        triangle(-this.r, this.r, this.r, this.r, 0, -this.r);
        
        pop();
    }


    this.setRotation = function(a) {
        this.rotation = a;
    }
 
    
    
}