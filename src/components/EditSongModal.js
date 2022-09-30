import React, { Component } from 'react';

export default class EditSongModal extends Component {
    editSongConfirm = () => {
        let newSong = {title: "", artist: "", youTubeId: ""}

        newSong.title = document.getElementById("edit-song-modal-title-textfield").value;
        newSong.artist = document.getElementById("edit-song-modal-artist-textfield").value;
        newSong.youTubeId = document.getElementById("edit-song-modal-youTubeId-textfield").value;
        console.log("KOKOK");
        console.log(newSong);

        let modal = document.getElementById("edit-song-modal");
        modal.classList.remove("is-visible");
        this.props.editSongCallBack(newSong);
    }
    render() {
        const { songKeyPair, hideEditSongModalCallback } = this.props;
        let name = "";
        if (songKeyPair) {
            name = songKeyPair.name;
        }
        return (
            <div id="edit-song-modal" class="modal" data-animation="slideInOutLeft">
            <div id='edit-song-root' class="modal-root">
                <div id="edit-song-modal-header" class="modal-north">Edit Song</div>
                <div id="edit-song-modal-content" class="modal-center">
                    <div id="title-prompt" class="modal-prompt">Title:</div><input id="edit-song-modal-title-textfield" class='modal-textfield' type="text"/>
                    <div id="artist-prompt" class="modal-prompt">Artist:</div><input id="edit-song-modal-artist-textfield" class='modal-textfield' type="text"  />
                    <div id="you-tube-id-prompt" class="modal-prompt">You Tube Id:</div><input id="edit-song-modal-youTubeId-textfield" class='modal-textfield' type="text" />
                </div>
                <div class="modal-south">
                    <input type="button" onClick={this.editSongConfirm} id="edit-song-confirm-button" class="modal-button" value='Confirm' />
                    <input type="button" onClick={hideEditSongModalCallback} id="edit-song-cancel-button" class="modal-button" value='Cancel' />
                </div>
            </div>
        </div>
        );
    }
}