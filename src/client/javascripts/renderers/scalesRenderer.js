/**
 * Renderer for project scales tab.
 */

var ScalesRenderer = (function() {
    return function(engine) {
        var self = {};
        self.__proto__ = BaseRenderer('#scales', engine);

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
                    var newScaleTab = $('<li><a href="#scale' + scale.id + '" data-toggle="tab" data-id="' + scale.id + '">' + scale.title + '</a></li>');
                    var newScaleContent = $(
                        '<div class="tab-pane" style="min-height: 200px;" id="scale' + scale.id + '" data-id="' + scale.id + '">' +
                            '<div class="row-fluid">' +
                                '<div class="span9"></div>' +
                                '<div class="span3">' +
                                    '<div class="btn-group">' +
                                        '<a href="#" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">Actions <span class="caret"></span></a>' +
                                        '<ul class="dropdown-menu">' +
                                            '<li><a href="#" data-behavior="renameScale">Rename</a></li>' +
                                            '<li class="divider"></li>' +
                                            '<li><a href="#" data-behavior="deleteScale"><span class="label label-important">Delete</span></a></li>' +
                                        '</ul>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>');
                    if(previousScale) {
                        previousScale.after(newScaleTab);
                    } else {
                        newScaleTab.addClass('active');
                        newScaleContent.addClass('active');
                        $(_scalesTabsSelector).prepend(newScaleTab);
                    }

                    $(_scalesTabsContentSelector).append(newScaleContent);
                } else {
                    $('a[href="#scale' + scale.id + '"]', _scalesTabsSelector).text(scale.title);
                }

                previousScale = $('a[href="#scale' + scale.id + '"]', _scalesTabsSelector).parent();
            });

            // Adding the plus tab.
            if(!$('a[data-behavior="createScale"]', _scalesTabsSelector).length) {
                $(_scalesTabsSelector)
                    .append($('<li><a href="#" class="btn-success" data-behavior="createScale">Create scale</a></li>'));
            }

            var lastActiveTabIndex = $('li.active:first', _scalesTabsSelector).index();

            // Removing non relevant tabs
            _.each($('a[data-toggle="tab"]', _scalesTabsSelector), function(tabLink) {
                var scaleId = $(tabLink).data('id');
                if(!_.findWhere(self.engine.data.scales, { id: scaleId })) {
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

        // Event subscriptions
        self.on('render', function() {
            _renderTabs();
        });

        $(self.tabSelector).on('click', 'a[data-behavior="createScale"]', function(e) {
            $(_modalNewScaleSelector).modal('show');
            e.preventDefault();
        });

        $(_modalNewScaleSelector).on('submit', function(e) {
            var scaleTitle = $('input[name="title"]', _modalNewScaleSelector).val();
            if(scaleTitle) {
                var modifications = [{
                    model: 'Scale',
                    action: 'create',
                    values: {
                        isActive: true,
                        title: scaleTitle
                    }
                }];
                self.emit('applyModifications', modifications);
                $(_modalNewScaleSelector).modal('hide');
            }
            e.preventDefault();
        });

        $(self.tabSelector).on('click', 'a[data-behavior="renameScale"]', function(e) {
            var currentScaleId = $(this).closest('[data-id]').data('id');
            var currentScale = _.findWhere(self.engine.data.scales, { id: currentScaleId });
            $('input[name="title"]', _modalRenameScaleSelector).val(currentScale.title);
            $('input[name="id"]', _modalRenameScaleSelector).val(currentScale.id);
            $('input[name="oldValue"]', _modalRenameScaleSelector).val(currentScale.title);
            $(_modalRenameScaleSelector).modal('show');
            e.preventDefault();
        });

        $(_modalRenameScaleSelector).on('submit', function(e) {
            var scaleTitle = $('input[name="title"]', _modalRenameScaleSelector).val();
            if(scaleTitle) {
                var modifications = [{
                    model: 'Scale',
                    action: 'update',
                    id: $('input[name="id"]', _modalRenameScaleSelector).val(),
                    property: 'title',
                    oldValue: $('input[name="oldValue"]', _modalRenameScaleSelector).val(),
                    newValue: scaleTitle
                }];
                self.emit('applyModifications', modifications);
                $(_modalRenameScaleSelector).modal('hide');
            }
            e.preventDefault();
        });

        $(self.tabSelector).on('click', 'a[data-behavior="deleteScale"]', function(e) {
            var currentScaleId = $(this).closest('[data-id]').data('id');
            var currentScale = _.findWhere(self.engine.data.scales, { id: currentScaleId });
            $('input[name="id"]', _modalDeleteScaleSelector).val(currentScale.id);
            $('#deleteScaleName').text(currentScale.title);
            $(_modalDeleteScaleSelector).modal('show');
            e.preventDefault();
        });

        $(_modalDeleteScaleSelector).on('submit', function(e) {
            var modifications = [{
                model: 'Scale',
                action: 'delete',
                id: $('input[name="id"]', _modalDeleteScaleSelector).val()
            }];
            self.emit('applyModifications', modifications);
            $(_modalDeleteScaleSelector).modal('hide');
            e.preventDefault();
        });

        return self;
    }
})();
