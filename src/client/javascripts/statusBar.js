window.statusBar = (function() {
    var _statusIconSelector = "#icon-status";

    return {
        changeIcon: function(status) {
            $(_statusIconSelector).removeClass();
            switch(status) {
                case 'ok':
                    $(_statusIconSelector).addClass('icon-ok');
                    break;
                case 'loading':
                    $(_statusIconSelector).addClass('icon-cog');
                    break;
                case 'error':
                    $(_statusIconSelector).addClass('icon-remove');
                    break;
            }
        }
    }
})();