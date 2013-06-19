window.behaviors = (function() {
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
});