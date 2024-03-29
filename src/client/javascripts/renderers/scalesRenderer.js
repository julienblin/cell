/**
 * Renderer for project scales tab.
 */

var ScalesRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#scales', engine);
        self.scaleLinesRenderer = {};

        var _scalesTabsSelector = '#scalesTabs';
        var _scalesTabsContentSelector = '#scalesTabsContent';
        var _modalNewScaleSelector = '#modalNewScale';
        var _modalRenameScaleSelector = '#modalRenameScale';
        var _modalDeleteScaleSelector = '#modalDeleteScale';

        var _renderTabs = function() {
            var previousScale = null;
            _.each(self.engine.data.scales, function(scale) {
                if(!scale.id) return;

                if(!$('a[data-id="' + scale.id + '"][data-toggle="tab"]', _scalesTabsSelector).length) {
                    var newScaleTab = $(self.getTemplate('#scale-tab-template')(scale));
                    var newScaleContent = $(self.getTemplate('#scale-tab-content-template')(scale));
                    if(previousScale) {
                        previousScale.after(newScaleTab);
                    } else {
                        newScaleTab.addClass('active');
                        newScaleContent.addClass('active');
                        $(_scalesTabsSelector).prepend(newScaleTab);
                    }

                    $(_scalesTabsContentSelector).append(newScaleContent);
                } else {
                    $('a[href="#scale' + scale.id + '"]', _scalesTabsSelector).text(scale.name);
                }

                previousScale = $('a[href="#scale' + scale.id + '"]', _scalesTabsSelector).parent();
            });

            // Adding the plus tab.
            if(!$('a[data-behavior~="createScale"]', _scalesTabsSelector).length) {
                $(_scalesTabsSelector)
                    .append($('<li><a href="#" class="btn-success" data-behavior="createScale">Create scale</a></li>'));
            }

            var lastActiveTabIndex = $('li.active:first', _scalesTabsSelector).index();

            // Removing non relevant tabs
            _.each($('a[data-toggle="tab"]', _scalesTabsSelector), function(tabLink) {
                var scaleId = $(tabLink).data('id');
                if(!self.engine.data.nav.scales[scaleId]) {
                    $(tabLink).parent().remove();
                    $('div.tab-pane[data-id="' + scaleId + '"]', _scalesTabsContentSelector).remove();
                }
            });

            // Define a new active tab if needed
            if(!$('li.active', _scalesTabsSelector).length) {
                if(lastActiveTabIndex > 0) {
                    $(':nth-child(' + lastActiveTabIndex + ') a', _scalesTabsSelector).tab('show');
                } else {
                    $('a[data-toggle="tab"]:first', _scalesTabsSelector).tab('show');
                }
            }
        };

        var _ensureScaleLinesRenderer = function() {
            _.each(self.engine.data.scales, function(scale) {
                if(!scale.id) return;

                if(!self.scaleLinesRenderer[scale.id]) {
                    self.scaleLinesRenderer[scale.id] = new ScaleLinesRenderer(scale, self.engine);
                }
            });

            // Remove non-relevant renderers
            _.each(self.scaleLinesRenderer, function(renderer, scaleId) {
                if(!self.engine.data.nav.scales[scaleId]) {
                    delete self.scaleLinesRenderer[scaleId];
                }
            });
        };

        // Event subscriptions
        self.on('render', function() {
            _renderTabs();
            _ensureScaleLinesRenderer();
            var firstVisibleTabContent = $('.tab-pane:visible:first', _scalesTabsContentSelector);
            if(firstVisibleTabContent.length > 0) {
                var visibleScaleId = firstVisibleTabContent.data('id');
                self.scaleLinesRenderer[visibleScaleId].emit('render');
            }

            $('a[data-behavior~="createScale"]', self.tabSelector).removeClass('disabled');
            $('a.dropdown-toggle', self.tabSelector).removeClass('disabled');

            if(self.engine.isReadOnly) {
                console.log($('a.dropdown-toggle', self.tabSelector));
                $('a[data-behavior~="createScale"]', self.tabSelector).addClass('disabled');
                $('a.dropdown-toggle', self.tabSelector).addClass('disabled');
            }
        });

        $(_scalesTabsSelector).on('shown', 'a[data-toggle="tab"]', function(e) {
            self.scaleLinesRenderer[$(e.target).data('id')].emit('render');
        });

        $(self.tabSelector).on('click', 'a[data-behavior~="createScale"]', function(e) {
            e.preventDefault();
            if(self.engine.isReadOnly) return;

            $('input[name="name"]', _modalNewScaleSelector).val('');
            $(_modalNewScaleSelector).modal('show');
        });

        $(_modalNewScaleSelector).on('submit', function(e) {
            var scaleName = $('input[name="name"]', _modalNewScaleSelector).val();
            var currentLastScale = _.last(self.engine.data.scales);
            if(scaleName) {
                var modifications = [{
                    model: 'Scale',
                    action: 'create',
                    insertAfter: currentLastScale ? currentLastScale.id : null,
                    values: {
                        isActive: true,
                        name: scaleName,
                        columns: []
                    }
                }];
                self.engine.applyModifications(modifications);
                $(_modalNewScaleSelector).modal('hide');
            }
            e.preventDefault();
        });

        $(self.tabSelector).on('click', 'a[data-behavior="renameScale"]', function(e) {
            e.preventDefault();
            if(self.engine.isReadOnly) return;

            var currentScaleId = $(this).closest('[data-id]').data('id');
            var currentScale = self.engine.data.nav.scales[currentScaleId];
            $('input[name="name"]', _modalRenameScaleSelector).val(currentScale.name);
            $('input[name="id"]', _modalRenameScaleSelector).val(currentScale.id);
            $('input[name="oldValue"]', _modalRenameScaleSelector).val(currentScale.name);
            $(_modalRenameScaleSelector).modal('show');
        });

        $(_modalRenameScaleSelector).on('submit', function(e) {
            var scaleName = $('input[name="name"]', _modalRenameScaleSelector).val();
            if(scaleName) {
                var modifications = [{
                    model: 'Scale',
                    action: 'update',
                    id: $('input[name="id"]', _modalRenameScaleSelector).val(),
                    values: {
                        name: [$('input[name="oldValue"]', _modalRenameScaleSelector).val(), scaleName]
                    }
                }];
                self.engine.applyModifications(modifications);
                $(_modalRenameScaleSelector).modal('hide');
            }
            e.preventDefault();
        });

        $(self.tabSelector).on('click', 'a[data-behavior="deleteScale"]', function(e) {
            e.preventDefault();
            if(self.engine.isReadOnly) return;

            var currentScaleId = $(this).closest('[data-id]').data('id');
            var currentScale = self.engine.data.nav.scales[currentScaleId];
            $('input[name="id"]', _modalDeleteScaleSelector).val(currentScale.id);
            $('#deleteScaleName').text(currentScale.name);
            $(_modalDeleteScaleSelector).modal('show');
        });

        $(_modalDeleteScaleSelector).on('submit', function(e) {
            var modifications = [{
                model: 'Scale',
                action: 'delete',
                id: $('input[name="id"]', _modalDeleteScaleSelector).val()
            }];
            self.engine.applyModifications(modifications);
            $(_modalDeleteScaleSelector).modal('hide');
            e.preventDefault();
        });

        return self;
    };
})();
