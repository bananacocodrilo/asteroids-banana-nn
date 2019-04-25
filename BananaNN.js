function BananaNN(genome){
    
    this.output = new Array(4);
    this.genome = new Array(4);
    this.xs;

    tf.tidy(() => {
        if(genome) {
            for(var i = 0; i < genome.length; i++){
                this.genome[i] = tf.tensor(genome[i].values, genome[i].shape);
            }
        }
        
        this.model = tf.sequential();
        this.hiddenLayer = tf.layers.dense({
            inputShape: [10],
            units: 12,
            activation: 'sigmoid'
        });
        
        this.outputLayer = tf.layers.dense({
            units: 4,
            activation: 'sigmoid'
        });
        
        
        this.model.add(this.hiddenLayer);
        this.model.add(this.outputLayer);
        if(genome){
            this.model.setWeights(this.genome);
        }
    });
        


    this.compute = (inputs) => {
        tf.tidy(() => {
            xs = tf.tensor2d([inputs])
            this.output = this.model.predict(xs).dataSync()    
        });
        // console.log(this.output)
        return this.output;

    }


    this.clean = () => {
        tf.dispose(this.xs);
        tf.dispose(this.genome);
        tf.dispose(this.model);
        tf.dispose(this.hiddenLayer);
        tf.dispose(this.outputLayer);
    }

}