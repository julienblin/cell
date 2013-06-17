window.modals = {

    _openModal : function(modalId, url, callback) {
        $('#modals').load(url, function(responseText, textStatus, req) {
            if (textStatus == "error") {
                alerts.error('There has been an error while loading modal.');
                if (callback) callback(false);
            } else {
                $(modalId).modal('show');
                if (callback) callback(true);
            }
        });
    },

    new: function(callback) {
        this._openModal('#modalNew', '/modals/new', callback);
    },

    open: function(callback) {
        this._openModal('#modalOpen', '/modals/open', callback);
    }
};