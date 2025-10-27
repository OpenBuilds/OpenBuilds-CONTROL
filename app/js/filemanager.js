const { EventEmitter } = require('events');

class FileManager extends EventEmitter { 
    constructor() {
        super();
        this._lastFilePath = "";
    }

    get lastFilePath() {
        return this._lastFilePath;
    }

    set lastFilePath(path) {
        this._lastFilePath = path;
        this.raiseLastFilePathChangedEvent();
    }

    clear(){
        this._lastFilePath = "";
        this.raiseLastFilePathChangedEvent();
    }

    raiseLastFilePathChangedEvent() {
        this.emit('lastFilePathChangedEvent', this._lastFilePath);
    }
}

module.exports = new FileManager();
