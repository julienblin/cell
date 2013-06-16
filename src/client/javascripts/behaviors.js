var applyStaticBehaviors = function(context) {
    context = context || $('body');
    $("[data-behavior~='tooltip']", context).tooltip();
};

$(function() {
    applyStaticBehaviors();
});
