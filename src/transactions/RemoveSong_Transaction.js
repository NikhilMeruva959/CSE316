import jsTPS_Transaction from "../common/jsTPS.js"
/**
 * RemoveSong_Transaction
 * 
 * This class represents a transaction that works with drag
 * and drop. It will be managed by the transaction stack.
 * 
 * @author McKilla Gorilla
 * @author ?
 */
export default class RemoveSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, initCurrKey, initIndex, initSong) {
        super();
        this.app = initApp;
        this.currKey = initCurrKey
        this.index = initIndex;
        this.song = initSong;
    }

    doTransaction() {
        this.app.deleteSong(this.currKey, this.index);
    }
    
    undoTransaction() {
        this.app.addSongSpecificIndex(this.index, this.song);
    }
}