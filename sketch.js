// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/hacZU523FyM
const initialAsteroidsAmount = 5;

const generationSize = 1000;
const batchSize = 50;
const sparedAmount = 1; // Must be lower than generationSize
const mutationRate = 0.1;
const shotCooldown = 45;

const fps = 30
const timeWeight = 0.01


const maxShots = 15;
const maxAsteroids = 20;

let genCount = 0;



let totalScore;
let ship;
let asteroids = [];
let lasers = [];

let alivePlayers = new Array();
let playingPlayers = new Array();
let deadPlayers = new Array();
let batch = 0;


let bestScore = 0;
let simulationFrames = 0;
let render;

let generationBests = {};

let previousGen = {
    bestScore:0,
    duration: 0,
    color: 255
}

function setup(){
    createCanvas(800, 450);
    frameRate(30)
    noLoop();

    for(let i = 0; i < generationSize; i++){
        alivePlayers[i] = new Player({render: false});
    }

    launchSimulation()
}


function draw() {
    background(0);
    simulationFrames++;



    for(let i = playingPlayers.length - 1; i >= 0; i--){

        playingPlayers[i].nextTurn();
        playingPlayers[i].play();
        
        if( playingPlayers[i].score > bestScore){
            bestScore = playingPlayers[i].score
        }

        if(!playingPlayers[i].alive){
            playingPlayers[i].score += simulationFrames*timeWeight;
            deadPlayers.push(playingPlayers[i]);
            playingPlayers.splice(i,1);

            if(playingPlayers.length){
                playingPlayers[0].render = true;
            }

        }

    }

    if(playingPlayers.length == 0){
        let i = 0;
        for(i = 0; i < batchSize && i<alivePlayers.length; i++){
            playingPlayers.push(alivePlayers[i]);
        }
        alivePlayers.splice(0,i);
        simulationFrames=0;
        batch++;
    }

    if(playingPlayers.length == 0 && alivePlayers.length == 0 ){
        noLoop();
        prepareNextGeneartion();
        launchSimulation();
        console.log(`Gen ${genCount-1} best score: ${Math.round(10*generationBests[genCount-1].data.score)/10}, avg: ${Math.round(10*totalScore/generationSize)/10}`)
        console.log(generationBests[genCount-1].genome)
    }

    
    let info = `Gen: ${genCount}, batch: ${batch}/${Math.ceil(generationSize/batchSize)}. Current best: ${bestScore}, sim time: ${Math.floor(simulationFrames/30)}; ${playingPlayers.length}/${batchSize} still alive. fr: ${Math.round(getFrameRate())}` 
    let info2 = `Previous gen best score: ${Math.floor(previousGen.bestScore)}, duration ${Math.floor(previousGen.duration/30)}`
    
    fill(255)
        .strokeWeight(4)
        .textSize(20);
    text(info, 10, 30);
    
    fill(previousGen.color)
        .strokeWeight(4)
        .textSize(20);
    text(info2, 10, 50); 

}




function prepareNextGeneartion(){
    let firstChoosingScore, secondChoosingScore;
    totalScore = 0;
    alivePlayers = [];

    deadPlayers.sort((a,b)=> {

        return b.score - a.score;
    })
    
    for(let i = 0; i < deadPlayers.length; i++){
        totalScore += deadPlayers[i].score;
    }
    
    // Spare the best ones
    for(let i = 0; i < sparedAmount && i < deadPlayers.length; i++){

        let options = {
            color: deadPlayers[i].color,
            borderColor: deadPlayers[i].borderColor,
            render: (i==0),
            genome: deadPlayers[i].genome,
            species: deadPlayers[i].species,
            spareData: {
                position: i+1,
                score: deadPlayers[i].score,
                survivalTime: simulationFrames
            }
        }
        
        alivePlayers.push(new Player(options))
    }

    generationBests[genCount] = {
        data: alivePlayers[0].spareData,
        genome: []
    }

    let genome =  alivePlayers[0].neuralNetwork.model.getWeights();

    for(let j = 0; j < genome.length; j++){
        generationBests[genCount].genome.push([{
            values: genome[j].dataSync(),
            shape: genome[j].shape
        }])
    }


    // Random breeding
    for(let i = sparedAmount; i < generationSize; i++){
        let firstParent = null; 
        let secondParent = null;
        let childOptions = {};
        let childGenome = []

        firstChoosingScore = Math.floor(totalScore * Math.random());
        secondChoosingScore = Math.floor(totalScore * Math.random());
        
        // Choose parents
        for(let i = 0; i < deadPlayers.length; i++){
            if(firstChoosingScore <= deadPlayers[i].score){
                firstParent = deadPlayers[i];
                break;
            }else{
                firstChoosingScore -= deadPlayers[i].score
            }
        }

        for(let i = 0; i < deadPlayers.length; i++){
            if(secondChoosingScore <= deadPlayers[i].score){
                secondParent = deadPlayers[i];
                break;
            }else{
                secondChoosingScore -= deadPlayers[i].score
            }
        }


        // Calculate genome
        childGenome = breed(firstParent, secondParent);
        
        childOptions = {
            color: firstParent.color,
            borderColor: secondParent.color,
            render: false,
            genome: childGenome,
        }
        
        // Push into new generation
        alivePlayers.push(new Player(childOptions));
    }
}


function launchSimulation(){
    genCount++;
    simulationFrames = 0;
    bestScore = 0;
    batch = 0;
    
    for(let i = 0; i< deadPlayers.length; i++){
        deadPlayers[i].neuralNetwork.clean();
    }
    deadPlayers = new Array();
    
    alivePlayers[0].render = true;
    for(let i = 0; i < alivePlayers.length; i++){
        alivePlayers[i].initializeGame();
    }

    // We'll watch the previous best playing during the simulation
    console.log(`****** Launching generation ${genCount} *****`);
    if(alivePlayers[0].spareData){
        previousGen = {
            bestScore: alivePlayers[0].spareData.score,
            duration: alivePlayers[0].spareData.survivalTime,
            color: alivePlayers[0].color
        }
    }
    
    
    loop();
}



function breed(firstParent, secondParent){
    let childGenome = [];
    let firstParentGenome = firstParent.neuralNetwork.model.getWeights();
    let secondParentGenome = secondParent.neuralNetwork.model.getWeights();
    let midPoint = 0.5;//firstParent.score / (firstParent.score + secondParent.score);
    
    
    
    for(let i = 0; i < firstParentGenome.length; i++){
        let firstValues = firstParentGenome[i].dataSync().slice();
        let secondValues = secondParentGenome[i].dataSync().slice();
    
        childGenome[i] = {
            shape: firstParentGenome[i].shape,
            values: []
        };

        for(let j = 0; j < firstValues.length; j++){
        
            if(Math.random() < midPoint){
                childGenome[i].values[j] = firstValues[j];
            } else {
                childGenome[i].values[j] = secondValues[j];
            }

            //Random mutation
            if(Math.random < mutationRate) {
                childGenome[i].values[j]  = (childGenome[i].values[j] + random(0.1));
            }

        }
    }

    return childGenome;
}
