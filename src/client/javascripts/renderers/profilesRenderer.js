/**
 * Renderer for project profiles tab.
 */

var ProfilesRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#profiles', engine);
        self.renderers = {
            '#profilePrices': new ProfilePricesRenderer(engine),
            '#profileProjects': new ProfileProjectsRenderer(engine)
        };

        var _tabsSelector = '#profilesTabs';
        var _profilesTabsContentSelector = '#profilesTabsContent';
        var _renderNotDone = true;

        // Event subscriptions
        self.on('render', function() {
            var firstVisibleTabContent = $('.tab-pane:visible:first', _profilesTabsContentSelector);
            if(firstVisibleTabContent.length > 0) {
                self.renderers['#' + firstVisibleTabContent.attr('id')].emit('render');
            }
        });

        $(_tabsSelector).on('shown', 'a[data-toggle="tab"]', function(e) {
            self.renderers[$(e.target).attr('href')].emit('render');
        });

        return self;
    };
})();
