window.modals = (function(){
    var _openModal = function(modalId, url, callback) {
        $('#modals').load(url, function(responseText, textStatus, req) {
            if (textStatus == "error") {
                alerts.error('There has been an error while loading modal.');
                if (callback) callback(false);
            } else {
                behaviors.apply(modalId);
                $(modalId).modal('show');
                if (callback) callback(true);
            }
        });
    };

    return {
        new: function(callback) {
            _openModal('#modalNew', '/modals/new', callback);
        },
        open: function(callback) {
            _openModal('#modalOpen', '/modals/open', callback);
        }
    };
})();