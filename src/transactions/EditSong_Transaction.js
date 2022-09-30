import jsTPS_Transaction from "../common/jsTPS.js"
/**
 * EditSong_Transaction
 * 
 * This class represents a transaction that works with drag
 * and drop. It will be managed by the transaction stack.
 * 
 * @author McKilla Gorilla
 * @author ?
 */
export default class EditSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, initIndex, initOldSongData, initNewSongData) {
        super();
        this.app = initApp;
        this.index = initIndex;
        this.oldSongData = initOldSongData;
        this.newSongData = initNewSongData;
    }

    doTransaction() {
        this.app.editSong(this.index, this.oldSongData, this.newSongData);
    }
    
    undoTransaction() {
        this.app.editSong(this.index, this.newSongData, this.oldSongData);
    }
}