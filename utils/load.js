const Ora = require('ora');

class Loader{
    constructor() {
        this.loader = Ora().start();
    }

    success(message){
      this.loader.succeed(message);
    }

    fail(message){
        this.loader.fail(message);
    }

    console(message){
        this.loader.color = 'green';
        this.loader.text = message;
    }
}

module.exports = new Loader();