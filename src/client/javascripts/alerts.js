window.alerts = {
    error: function(message) {
        $('#modals').append('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>' + message + '</div>');
    }
};