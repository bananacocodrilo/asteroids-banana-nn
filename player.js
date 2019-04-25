
function Player(options) {

    this.inputs =  [];
    this.output =  new Array(5);
    
    this.score = 0;
    this.timeAlive =  0;
    this.alive =  true;
    this.lasersTimer = -shotCooldown;


    this.render =  options.hasOwnProperty('render')? options.render : false;
    

    this.species = options.hasOwnProperty('species')? options.species : [...Array(8)].map(i=>(~~(Math.random()*36)).toString(36)).join('');

    this.color =  options.hasOwnProperty('color')? options.color : color(random(255),random(255),random(255));
    this.borderColor =  options.hasOwnProperty('borderColor')? options.borderColor : color(255,255,255);

    this.spareData = options.hasOwnProperty('spareData')? options.spareData : null;
    
    this.neuralNetwork = new BananaNN(options.genome);

    
    this.ship =  null;
    this.asteroids =  [];
    this.lasers =  [];
        
    
    this.initializeGame = () => {
        this.ship = new Ship(this.color, this.borderColor);

        // Lets kill fast the dumb players
        this.asteroids.push(
            new Asteroid(createVector(width/5, height/5), 
                null, 
                color(255,255,255), 
                createVector(2*width/(height+width), 2*height/(height+width))
            )
        );
        for (var i = 1; i < initialAsteroidsAmount; i++) {
            this.asteroids.push(new Asteroid(null, null, this.color));
        }

    }




    this.play = () => {
        
        if(this.alive){
            this.output = this.neuralNetwork.compute(this.inputs);

            this.output = [Math.round(this.output[0]),
                Math.round(this.output[1]),
                Math.round(this.output[2]),
                Math.round(this.output[3])]
            
            if(this.output[0]){
                // I dont like the machinegun-beyblades I'm getting
                if(this.lasersTimer < simulationFrames){
                    this.lasersTimer = simulationFrames + shotCooldown ;
                    this.lasers.push(new Laser(this.ship.pos, this.ship.heading));
                }
            }
            if(this.output[1]){
                this.ship.setRotation(0.1);
            }
            if(this.output[2]){
                this.ship.setRotation(-0.1);
            }
            
            if(this.output[1] && this.output[2] || !this.output[1] && !this.output[2] ){
                this.ship.setRotation(0);
            }
            
            if(this.output[3]){
                this.ship.boosting(true);
            }else{
                this.ship.boosting(false);
            }

        }
        

   
        return this.alive;
    }


    this.nextTurn = () =>{
        // Reset the view of the ship before computing the new one
        this.ship.clearView();


        // Calculate asteroids new positions
        for (let i = 0; i < this.asteroids.length; i++) {
            this.asteroids[i].update();

            if (this.ship.hits(this.asteroids[i])) {
                this.alive = false;
            }
    
        
            if(this.render){
                this.asteroids[i].render();
            }
        }



        // Calculate lasers new positions, delete offscreen, destroy and create new asteroids
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            this.lasers[i].update();
    
            if (this.lasers[i].offscreen()) {
                this.lasers.splice(i, 1);
            } else {
                
                for (let j = this.asteroids.length - 1; j >= 0; j--) {
                    
                    if (this.lasers[i].hits(this.asteroids[j])) {                       
                        if (this.asteroids[j].r > 15) {
                            let newAsteroids = this.asteroids[j].breakup();
                            this.asteroids = this.asteroids.concat(newAsteroids);
                        }

                        this.asteroids.splice(j, 1);
                        this.lasers.splice(i, 1);
                 
                        this.score++;
                        this.increaseDifficulty();

                        break;
                    }
                }
    
            }
            
        }
        for (let i = this.lasers.length - 1; i >= 0; i--) {        
            if(this.render){
                this.lasers[i].render();
            }
        }

        
        // Finally update ship        
        this.ship.update()
        if(this.render){
            this.ship.render();
        }



        // Compose the inputs for the neural network before the next play 
        this.inputs = []
        //     this.ship.heading, 
        //     this.ship.vel.mag(), 
        //     this.ship.vel.heading(), 
        //     this.ship.pos.x, 
        //     this.ship.pos.y,
        //     this.lasers.length
        // ];
        this.inputs = normalize(this.inputs.concat(this.ship.view))
    }

    this.increaseDifficulty = () => {
        // Create a new asteroid every 5 points starting at 10
        // The asteroid is created at a random position trying to be far from the ship
        if(this.score > 10 && this.score % 4 == 0 ){
            if(this.asteroids.length < maxAsteroids){
                this.asteroids.push(
                    new Asteroid( 
                        createVector(this.ship.pos.x + width * (0.2 + Math.random()/2), 
                                    this.ship.pos.y + height * (0.2 + Math.random()/2)),
                        random(100, 200),
                        this.color)
                );       
            }else{
                this.asteroids.forEach((asteroid)=>{
                    asteroid.vel *= 1.1;
                })
            }
        }
    }
}

function normalize(inputs){
    // inputs[0] /= TWO_PI;
    // inputs[1] /= 9.9;
    // inputs[2] /= inputs[2]/TWO_PI + 0.5;
    // inputs[3] /= width;
    // inputs[4] /= height;
    // inputs[5] /= maxShots;
     
    for(let i = 0; i<10; i++){
        inputs[i] = 1 - (inputs[i]/ 1000);
    }

    return inputs;
}