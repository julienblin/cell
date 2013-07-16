/**
 * Manages modals windows (using the modals controller on the server)
 */

window.modals = (function(){
    "use strict";

    var _openModal = function(modalId, url, callback) {
        $('#modals').load(url, function(responseText, textStatus, req) {
            if (textStatus == "error") {
                notify.error('There has been an error while loading modal.');
                if (callback) callback(false, modalId);
            } else {
                behaviors.apply(modalId);
                $(modalId).modal('show');
                if (callback) callback(true, modalId);
            }
        });
    };

    return {
        new: function(callback) {
            _openModal('#modalNew', '/modals/new', callback);
        },
        open: function(callback) {
            _openModal('#modalOpen', '/modals/open', callback);
        },
        addUser: function(filteredUserIds, callback) {
            _openModal('#modalAddUser', '/modals/addUser?filter=' + filteredUserIds.join(), callback);
        },
        openModal: function(modalId, url, callback) {
            _openModal(modalId, url, callback);
        },
        close: function(modal) {
            var modalSelector;
            switch(modal) {
                case 'new':
                    modalSelector = '#modalNew';
                    break;
                case 'open':
                    modalSelector = '#modalOpen';
                    break;
                case 'addUser':
                    modalSelector = '#modalAddUser';
                    break;
                default:
                    modalSelector = modal;
                    break;
            }

            $(modalSelector).modal('hide');
        }
    };
})();