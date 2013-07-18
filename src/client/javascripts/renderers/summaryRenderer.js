/**
 * Renderer for project summary tab.
 */

var SummaryRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#summary', engine);
        self.renderers = {
            '#summaryProfilePrices': new SummaryProfilePricesRenderer(engine),
            '#summaryProfileProjects': new SummaryProfileProjectsRenderer(engine),
            '#summaryScales': new SummaryScalesRenderer(engine)
        };

        var _tabsSelector = '#summaryTabs';
        var _summaryTabsContentSelector = '#summaryTabsContent';

        // Event subscriptions
        self.on('render', function() {
            $('[data-property="totalUT"]', self.tabSelector).text(numeral(self.engine.data.computed.totalUT).format('0,0') + ' UT');
            $('[data-property="totalPrice"]', self.tabSelector).text(numeral(self.engine.data.computed.totalPrice).format('0,0 $'));

            var firstVisibleTabContent = $('.tab-pane:visible:first', _summaryTabsContentSelector);
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
