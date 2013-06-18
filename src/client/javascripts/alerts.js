window.alerts = (function() {

    return {
        error: function(message) {
            $('#flashes').append('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>' + message + '</div>');
        }
    };
})();