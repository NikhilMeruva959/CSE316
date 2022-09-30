import React, { Component } from 'react';

export default class DeleteSongModal extends Component {
    render() {
        const { songKeyPair, deleteSongCallback, hideDeleteSongModalCallback } = this.props;
        // console.log("777 " + songKeyPair);
        let name = "";
        if (songKeyPair) {
            name = songKeyPair.name;
        }
        return (
            <div class="modal" id="remove-song-modal" data-animation="slideInOutLeft">
            <div class="modal-root" id='verify-remove-song-root'>
                <div class="modal-north">
                    Remove song?
                </div>                            
                <div class="modal-center">
                    <div class="modal-center-content">
                        Are you sure you wish to permanently remove <span id="remove-song-span"></span> from the playlist?
                    </div>
                </div>
                <div class="modal-south">
                    <input type="button" onClick={deleteSongCallback} id="remove-song-confirm-button" class="modal-button" value='Confirm' />
                    <input type="button" onClick={hideDeleteSongModalCallback} id="remove-song-cancel-button" class="modal-button" value='Cancel' />
                </div>
            </div>
        </div>
    
        );
    }
}