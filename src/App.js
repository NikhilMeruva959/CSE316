import React from 'react';
import './App.css';

// IMPORT DATA MANAGEMENT AND TRANSACTION STUFF
import DBManager from './db/DBManager';
import jsTPS from './common/jsTPS.js';

// OUR TRANSACTIONS
import MoveSong_Transaction from './transactions/MoveSong_Transaction.js';
import EditSong_Transaction from './transactions/EditSong_Transaction';
import RemoveSong_Transaction from './transactions/RemoveSong_Transaction';
import CreateSong_Transaction from './transactions/CreateSong_Transaction';

// THESE REACT COMPONENTS ARE MODALS
import DeleteListModal from './components/DeleteListModal.js';
import EditSongModal from './components/EditSongModal';
import RemoveSongModal from './components/RemoveSongModal';

// THESE REACT COMPONENTS ARE IN OUR UI
import Banner from './components/Banner.js';
import EditToolbar from './components/EditToolbar.js';
import PlaylistCards from './components/PlaylistCards.js';
import SidebarHeading from './components/SidebarHeading.js';
import SidebarList from './components/SidebarList.js';
import Statusbar from './components/Statusbar.js';

class App extends React.Component {
    constructor(props) {
        super(props);

        // THIS IS OUR TRANSACTION PROCESSING SYSTEM
        this.tps = new jsTPS();

        // THIS WILL TALK TO LOCAL STORAGE
        this.db = new DBManager();

        // GET THE SESSION DATA FROM OUR DATA MANAGER
        let loadedSessionData = this.db.queryGetSessionData();

        // SETUP THE INITIAL STATE
        this.state = {
            listKeyPairMarkedForDeletion : null,
            currentList : null,
            sessionData : loadedSessionData,
            songKeyPairMarkedForEdit: null,
            songKeyPairMarkedForDeletion: null
        }
    }
    sortKeyNamePairsByName = (keyNamePairs) => {
        keyNamePairs.sort((keyPair1, keyPair2) => {
            // GET THE LISTS
            return keyPair1.name.localeCompare(keyPair2.name);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CREATING A NEW LIST
    createNewList = () => {
        // FIRST FIGURE OUT WHAT THE NEW LIST'S KEY AND NAME WILL BE
        let newKey = this.state.sessionData.nextKey;
        let newName = "Untitled" + newKey;

        // MAKE THE NEW LIST
        let newList = {
            key: newKey,
            name: newName,
            songs: []
        };

        // MAKE THE KEY,NAME OBJECT SO WE CAN KEEP IT IN OUR
        // SESSION DATA SO IT WILL BE IN OUR LIST OF LISTS
        let newKeyNamePair = { "key": newKey, "name": newName };
        let updatedPairs = [...this.state.sessionData.keyNamePairs, newKeyNamePair];
        this.sortKeyNamePairsByName(updatedPairs);

        // CHANGE THE APP STATE SO THAT THE CURRENT LIST IS
        // THIS NEW LIST AND UPDATE THE SESSION DATA SO THAT THE
        // NEXT LIST CAN BE MADE AS WELL. NOTE, THIS setState WILL
        // FORCE A CALL TO render, BUT THIS UPDATE IS ASYNCHRONOUS,
        // SO ANY AFTER EFFECTS THAT NEED TO USE THIS UPDATED STATE
        // SHOULD BE DONE VIA ITS CALLBACK
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: newList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey + 1,
                counter: prevState.sessionData.counter + 1,
                keyNamePairs: updatedPairs
            }
        }), () => {
            // PUTTING THIS NEW LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationCreateList(newList);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF DELETING A LIST.
    deleteList = (key) => {
        // IF IT IS THE CURRENT LIST, CHANGE THAT
        let newCurrentList = null;
        if (this.state.currentList) {
            if (this.state.currentList.key !== key) {
                // THIS JUST MEANS IT'S NOT THE CURRENT LIST BEING
                // DELETED SO WE'LL KEEP THE CURRENT LIST AS IT IS
                newCurrentList = this.state.currentList;
            }
        }

        let keyIndex = this.state.sessionData.keyNamePairs.findIndex((keyNamePair) => {
            return (keyNamePair.key === key);
        });
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        if (keyIndex >= 0)
            newKeyNamePairs.splice(keyIndex, 1);

        // AND FROM OUR APP STATE
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : null,
            currentList: newCurrentList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter - 1,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // DELETING THE LIST FROM PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationDeleteList(key);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    deleteMarkedList = () => {
        this.deleteList(this.state.listKeyPairMarkedForDeletion.key);
        this.hideDeleteListModal();
    }
    // THIS FUNCTION SPECIFICALLY DELETES THE CURRENT LIST
    deleteCurrentList = () => {
        if (this.state.currentList) {
            this.deleteList(this.state.currentList.key);
        }
    }
    renameList = (key, newName) => {
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        // NOW GO THROUGH THE ARRAY AND FIND THE ONE TO RENAME
        for (let i = 0; i < newKeyNamePairs.length; i++) {
            let pair = newKeyNamePairs[i];
            if (pair.key === key) {
                pair.name = newName;
            }
        }
        this.sortKeyNamePairsByName(newKeyNamePairs);

        // WE MAY HAVE TO RENAME THE currentList
        let currentList = this.state.currentList;
        if (currentList.key === key) {
            currentList.name = newName;
        }

        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : null,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            let list = this.db.queryGetList(key);
            list.name = newName;
            this.db.mutationUpdateList(list);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF LOADING A LIST FOR EDITING
    loadList = (key) => {
        let newCurrentList = this.db.queryGetList(key);
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: newCurrentList,
            sessionData: this.state.sessionData
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            this.tps.clearAllTransactions();
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CLOSING THE CURRENT LIST
    closeCurrentList = () => {
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: null,
            sessionData: this.state.sessionData
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            this.tps.clearAllTransactions();
        });
    }
    setStateWithUpdatedList(list) {
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList : list,
            sessionData : this.state.sessionData
        }), () => {
            // UPDATING THE LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationUpdateList(this.state.currentList);
        });
    }
    getPlaylistSize = () => {
        return this.state.currentList.songs.length;
    }
    // THIS FUNCTION MOVES A SONG IN THE CURRENT LIST FROM
    // start TO end AND ADJUSTS ALL OTHER ITEMS ACCORDINGLY
    moveSong(start, end) {
        let list = this.state.currentList;

        // WE NEED TO UPDATE THE STATE FOR THE APP
        start -= 1;
        end -= 1;
        if (start < end) {
            let temp = list.songs[start];
            for (let i = start; i < end; i++) {
                list.songs[i] = list.songs[i + 1];
            }
            list.songs[end] = temp;
        }
        else if (start > end) {
            let temp = list.songs[start];
            for (let i = start; i > end; i--) {
                list.songs[i] = list.songs[i - 1];
            }
            list.songs[end] = temp;
        }
        this.setStateWithUpdatedList(list);
    }
    editSong = (index, oldSongData, newSongData) => {
        this.setState(prevState => ({
            songKeyPairMarkedForEdit : null,
            currentList: prevState.currentList,
            sessionData: prevState.sessionData
        }), () => {
            let list = this.state.currentList;
            // console.log("ZZZ: " + this.state.currentList.songs);
            // console.log("666");
            // console.log(this.state.currentList);
            console.log("----------------------------------------");
            console.log(this.state.currentList.songs[index].title);
            console.log("----------------------------------------");
            console.log(oldSongData);
            console.log(newSongData);
            if(list.songs[index].title === oldSongData.title){
                list.songs[index] = newSongData;
            }

            // this.db.mutationEditSong(this.state.currentList.key, index);
            this.setStateWithUpdatedList(this.state.currentList); 
            this.db.mutationUpdateList(this.state.currentList);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    };
    deleteSong = (key, index) => {
        this.setState(prevState => ({
            songKeyPairMarkedForDeletion : null,
            currentList: prevState.currentList,
            sessionData: prevState.sessionData
        }), () => {
            let list = this.state.currentList;
            // console.log("----66-----------------------------------");
            list.songs.splice([index], 1);
            // console.log("--------77--------------------------------");
            console.log(list);
            // console.log("--------8888--------------------------------");
            this.setStateWithUpdatedList(this.state.currentList); 
            this.db.mutationUpdateList(this.state.currentList);
            this.db.mutationUpdateSessionData(this.state.sessionData);
            // console.log(this.state.currentList);
        });
    }
    removeSong(index) {
        this.deleteSong(this.state.currentList.key, index);
    }
    addSongSpecificIndex = (index, song) => {
        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: prevState.sessionData
        }), () => {
            let list = this.state.currentList;
            list.songs.splice(index, 0, song);
            this.setStateWithUpdatedList(list);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        })
    }
    addSong = (song) => {
        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: prevState.sessionData
        }), () => {
            let list = this.state.currentList;
            list.songs.push(song);
            this.setStateWithUpdatedList(list);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        })
    }
    deleteMarkedSong = () => {
        console.log("Gym Class: " + this.state.currentList.key);
        console.log("Gym Class: " + this.state.songKeyPairMarkedForDeletion);
        console.log(this.state.currentList.songs[this.state.songKeyPairMarkedForDeletion]);

        // this.deleteSong(this.state.currentList.key, this.state.songKeyPairMarkedForDeletion);
        let transaction = new RemoveSong_Transaction(this, this.state.currentList.key,  this.state.songKeyPairMarkedForDeletion, this.state.currentList.songs[this.state.songKeyPairMarkedForDeletion]);
        this.tps.addTransaction(transaction);
        this.hideDeleteSongModal();
    }
    editMarkedSong = () => {
        console.log("Babel: " + this.state.songKeyPairMarkedForEdit);
        this.editSong(this.state.currentList.key, this.state.songKeyPairMarkedForEdit);
        this.hideEditSongModal();
    }
    // THIS FUNCTION ADDS A MoveSong_Transaction TO THE TRANSACTION STACK
    addMoveSongTransaction = (start, end) => {
        let transaction = new MoveSong_Transaction(this, start, end);
        this.tps.addTransaction(transaction);
    }
    addEditSongTransaction = (newSongInfo) => {
        console.log("Babel: " + this.state.songKeyPairMarkedForEdit);
        let indexEditTemp = this.state.songKeyPairMarkedForEdit;
        let oldSongInfo = this.state.currentList.songs[indexEditTemp];

        let transaction = new EditSong_Transaction(this, indexEditTemp, oldSongInfo, newSongInfo);
        this.tps.addTransaction(transaction);
        // this.editSong(this.state.currentList.key, this.state.songKeyPairMarkedForEdit);
        // this.hideEditSongModal();

    } 
    addCreateSongTransaction = () => {
        let addedSong = {title:"", artist:"", youTubeId:""};
        addedSong.title = "Untitled";
        addedSong.artist = "Unknown";
        addedSong.youTubeId = "dQw4w9WgXcQ";

        let size = this.state.currentList.songs.length;
        console.log("SSS:" + size);
        let transaction = new CreateSong_Transaction(this, size, addedSong);
        this.tps.addTransaction(transaction);

    }
    // THIS FUNCTION BEGINS THE PROCESS OF PERFORMING AN UNDO
    undo = () => {
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();

            // MAKE SURE THE LIST GETS PERMANENTLY UPDATED
            this.db.mutationUpdateList(this.state.currentList);
        }
    }
    // THIS FUNCTION BEGINS THE PROCESS OF PERFORMING A REDO
    redo = () => {
        if (this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();

            // MAKE SURE THE LIST GETS PERMANENTLY UPDATED
            this.db.mutationUpdateList(this.state.currentList);
        }
    }
    markListForDeletion = (keyPair) => {
        this.setState(prevState => ({
            currentList: prevState.currentList,
            listKeyPairMarkedForDeletion : keyPair,
            sessionData: prevState.sessionData
        }), () => {
            // PROMPT THE USER
            this.showDeleteListModal();
        });
    }
    markSongForEdit = (index) => {
        this.setState(prevState => ({
            currentList: prevState.currentList,
            songKeyPairMarkedForEdit : index,
            sessionData: prevState.sessionData
        }), () => {
            // PROMPT THE USER
            this.showEditSongModal();
        });
    }
    markSongForDeletion = (index) => {
        this.setState(prevState => ({
            currentList: prevState.currentList,
            songKeyPairMarkedForDeletion : index,
            sessionData: prevState.sessionData
        }), () => {
            // PROMPT THE USER
            this.showDeleteSongModal();
        });
    }
    // THIS FUNCTION SHOWS THE MODAL FOR PROMPTING THE USER
    // TO SEE IF THEY REALLY WANT TO DELETE THE LIST
    showDeleteListModal() {
        let modal = document.getElementById("delete-list-modal");
        modal.classList.add("is-visible");
    }
    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideDeleteListModal() {
        let modal = document.getElementById("delete-list-modal");
        modal.classList.remove("is-visible");
    }
    showEditSongModal(){
        let modal = document.getElementById("edit-song-modal");
        let list = this.state.currentList;
        let indexTemp = this.state.songKeyPairMarkedForEdit;
        document.getElementById("edit-song-modal-title-textfield").value = list.songs[indexTemp].title;
        document.getElementById("edit-song-modal-artist-textfield").value = list.songs[indexTemp].artist;
        document.getElementById("edit-song-modal-youTubeId-textfield").value = list.songs[indexTemp].youTubeId;
        modal.classList.add("is-visible");
    }
    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideEditSongModal() {
        let modal = document.getElementById("edit-song-modal");
        modal.classList.remove("is-visible");
    }
    showDeleteSongModal(){
        let modal = document.getElementById("remove-song-modal");
        let list = this.state.currentList;
        let indexTemp = this.state.songKeyPairMarkedForDeletion;
        document.getElementById("remove-song-span").innerHTML = list.songs[indexTemp].title + " ";
        modal.classList.add("is-visible");
    }
    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideDeleteSongModal() {
        let modal = document.getElementById("remove-song-modal");
        modal.classList.remove("is-visible");
    }
    render() {
        let canAddSong = this.state.currentList !== null;
        let canUndo = this.tps.hasTransactionToUndo();
        let canRedo = this.tps.hasTransactionToRedo();
        let canClose = this.state.currentList !== null;
        return (
            <div id="root">
                <Banner />
                <SidebarHeading
                    createNewListCallback={this.createNewList}
                />
                <SidebarList
                    currentList={this.state.currentList}
                    keyNamePairs={this.state.sessionData.keyNamePairs}
                    deleteListCallback={this.markListForDeletion}
                    loadListCallback={this.loadList}
                    renameListCallback={this.renameList}
                />
                <EditToolbar
                    canAddSong={canAddSong}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    canClose={canClose} 
                    addCallback={this.addCreateSongTransaction}
                    undoCallback={this.undo}
                    redoCallback={this.redo}
                    closeCallback={this.closeCurrentList}
                />
                <PlaylistCards
                    currentList={this.state.currentList}
                    moveSongCallback={this.addMoveSongTransaction} 
                    editSongCallBack={this.markSongForEdit}
                    deleteSongCallback={this.markSongForDeletion}
                />
                <Statusbar 
                    currentList={this.state.currentList} />
                <DeleteListModal
                    listKeyPair={this.state.listKeyPairMarkedForDeletion}
                    hideDeleteListModalCallback={this.hideDeleteListModal}
                    deleteListCallback={this.deleteMarkedList}
                />
                <EditSongModal
                    songKeyPair={this.state.songKeyPairMarkedForEdit}
                    hideEditSongModalCallback={this.hideEditSongModal}
                    editSongCallBack={this.addEditSongTransaction}
                />
                <RemoveSongModal
                    songKeyPair={this.state.songKeyPairMarkedForDeletion}
                    hideDeleteSongModalCallback={this.hideDeleteSongModal}
                    deleteSongCallback={this.deleteMarkedSong}
                />
            </div>
        );
    }
}

export default App;
