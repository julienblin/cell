window.modals = (function(){
    var _openModal = function(modalId, url, callback) {
        $('#modals').load(url, function(responseText, textStatus, req) {
            if (textStatus == "error") {
                alerts.error('There has been an error while loading modal.');
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
        close: function(modal) {
            switch(modal) {
                case 'new':
                    var modalId = '#modalNew';
                    break;
                case 'open':
                    var modalId = '#modalOpen';
                    break;
                case 'addUser':
                    var modalId = '#modalAddUser';
                    break;
                default:
                    throw new Error('unknown modal ' + modal);
            }

            $(modalId).modal('hide');
        }
    };
})();