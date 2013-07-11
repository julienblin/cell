/**
 * Manages behaviors.
 * Behaviors are attached to DOM element through the data-behavior html5 attribute.
 * Available behaviors:
 *  - tooltip: bootstrap tooltips
 *  - submit: submits forms (either through href or closest search)
 *  - ajax: (on forms and a) - performs ajax request are renders the results
 *  - persistent (on a.tabs): persists tab selection between refreshs (using url hashbang!)
 *
 * + various utilities (including a change event for contenteditable).
 */

window.behaviors = (function() {
    "use strict";

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
                var ajaxTarget = form;
                if(form.data('ajax-target')) {
                    ajaxTarget = $(form.data('ajax-target'));
                }
                var ajaxTargetContainer = ajaxTarget.parent();
                $.ajax({
                    url: form.attr('action'),
                    type: form.attr('method') || 'POST',
                    data: form.serialize(),
                    success: function(data, textStatus, xhr) {
                        ajaxTarget.replaceWith(data);
                        behaviors.apply(ajaxTargetContainer);
                    }
                });
                e.preventDefault();
            });

            $("a[data-behavior~='ajax']", context).on('click', function(e) {
                var link = $(this);
                var ajaxTarget = $(link.data('ajax-target'));
                var ajaxTargetContainer = ajaxTarget.parent();
                $.ajax({
                    url: link.attr('href'),
                    type: 'GET',
                    success: function(data, textStatus, xhr) {
                        ajaxTarget.replaceWith(data);
                        behaviors.apply(ajaxTargetContainer);
                    }
                });
                e.preventDefault();
            });

            $("a[data-toggle='tab'][data-behavior~='persistent']", context).on('shown', function(e) {
                _changingHash = true;
                window.location.hash = '!' + e.target.href.substring(e.target.href.indexOf('#') + 1);
                _changingHash = false;
            });

            $("input[data-behavior~='autocomplete']", context).typeahead({
                source: function(query, process) {
                    $.get(
                        $(this.$element).attr('data-autocomplete-source'),
                        { q: query },
                        function(data, textStatus, xhr) {
                            process(data);
                        }
                    );
                }
            });
        },
        isChangingHash: function() {
            return _changingHash;
        }
    };
})();

$(function() {
    "use strict";

    numeral.language($('html').attr('lang'));

    behaviors.apply();
    $('#btnNewProject').on('click', function(e) {
        modals.new();
        e.preventDefault();
    });
    $('#btnOpenProject').on('click', function(e) {
        modals.open();
        e.preventDefault();
    });

    // Prevents dropdown from closing on click (in tables normally).
    $('#container').on('click', '.input-dropdown-menu', function(e) {
        e.stopPropagation();
    });

    // Bind change event on contenteditable
    $('body').on('focus', '[contenteditable]', function() {
        var $this = $(this);
        $this.data('before', $this.html());
        return $this;
    }).on('blur', '[contenteditable]', function(e) {
            var $this = $(this);
            if ($this.data('before') !== $this.html()) {
                $this.trigger('change');
            }
            return $this;
        })
      .on('keydown', '[contenteditable]', function(e) {
            if(e.keyCode == 13) {
                e.preventDefault();
                $(this).blur();
            }
        });

    // Reload persistent tabs if any
    if (window.location.hash && window.location.hash.length > 1) {
        var tab = $("a[data-toggle='tab'][data-behavior~='persistent'][href='#" + window.location.hash.substring(2) +  "']");
        if (tab.length > 0) {
            tab.tab('show');
        }
    }

    $(window).on('hashchange', function(e) {
        if(!behaviors.isChangingHash()) {
            var tab = $("a[data-toggle='tab'][data-behavior~='persistent'][href='#" + window.location.hash.substring(2) +  "']");
            if (tab.length > 0) {
                tab.tab('show');
            }
        }
    });

    $(document).ajaxSend(function() {
        statusBar.changeIcon('loading');
    }).ajaxSuccess(function() {
        statusBar.changeIcon('ok');
    }).ajaxError(function() {
        statusBar.changeIcon('error');
    });
});