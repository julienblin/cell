window.alerts = (function() {

    var _createAlert = function(level, message, dismissTimeout) {
        var alert = $('<div class="alert alert-' + level + ' fade in"><button type="button" class="close" data-dismiss="alert">&times;</button>' + message + '</div>');
        $('#flashes').append(alert);
        alert.dismiss = function() {
            alert.alert('close');
        };

        if(dismissTimeout) {
            setTimeout(function() { alert.dismiss(); }, dismissTimeout);
        }

        return alert;
    };

    return {
        fatal: function(message) {
            return _createAlert('error', message + " Please try to <strong><a href='javascript: location.reload();'>reload the page</a></strong>.");
        },

        error: function(message, dismissTimeout) {
            return _createAlert('error', message, dismissTimeout);
        },

        warning: function(message, dismissTimeout) {
            return _createAlert('warning', message, dismissTimeout);
        },

        info: function(message, dismissTimeout) {
            return _createAlert('info', message, dismissTimeout);
        },

        success: function(message, dismissTimeout) {
            return _createAlert('success', message, dismissTimeout);
        }
    };
})();