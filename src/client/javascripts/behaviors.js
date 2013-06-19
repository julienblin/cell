window.behaviors = (function() {

    var _changingHash = false;

    return {
        apply: function(context) {
            context = context || $('body');
            $("[data-behavior~='tooltip']", context).tooltip();
            $("[data-behavior~='submit']", context).on('click', function(e) {
                var target = $($(this).attr('href')) || $(this).closest('form');
                target.submit();
                e.preventDefault();
            });

            $("form[data-behavior~='ajax']", context).on('submit', function(e) {
                var form = $(this);
                $.post(
                    form.attr('action'),
                    form.serialize(),
                    function(data, textStatus, xhr) {
                        form.replaceWith(data);
                        behaviors.apply(data);
                    }
                );
                e.preventDefault();
            });

            $("a[data-toggle='tab'][data-behavior~='persistent']", context).on('shown', function(e) {
                _changingHash = true;
                window.location.hash = '_' + e.target.href.substring(e.target.href.indexOf('#'));
                _changingHash = false;
            });
        },
        isChangingHash: function() {
            return _changingHash;
        }
    };
})();

$(function() {
    behaviors.apply();
    $('#btnNewProject').on('click', function(e) {
        modals.new();
        e.preventDefault();
    });
    $('#btnOpenProject').on('click', function(e) {
        modals.open();
        e.preventDefault();
    });

    // Reload persistent tabs if any
    if (window.location.hash && window.location.hash.length > 1) {
        var tab = $("a[data-toggle='tab'][data-behavior~='persistent'][href='" + window.location.hash.substring(2) +  "']");
        if (tab.length > 0) {
            tab.tab('show');
        }
    }

    $(window).on('hashchange', function(e) {
        if(!behaviors.isChangingHash()) {
            var tab = $("a[data-toggle='tab'][data-behavior~='persistent'][href='" + window.location.hash.substring(2) +  "']");
            if (tab.length > 0) {
                tab.tab('show');
            }
        }
    });
});