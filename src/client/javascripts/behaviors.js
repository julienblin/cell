var applyStaticBehaviors = function(context) {
    context = context || $('body');
    $("[data-behavior~='tooltip']", context).tooltip();
};

$(function() {
    applyStaticBehaviors();
    $('#btnNewProject').on('click', function(e) {
        modals.new();
        e.preventDefault();
    });
    $('#btnOpenProject').on('click', function(e) {
        modals.open();
        e.preventDefault();
    });
});
