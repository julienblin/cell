/**
 * Assets configuration
 */

module.exports = function(assets) {
    assets.root = __dirname;
    assets.addJs('/javascripts/lib/jquery.min.js');
    assets.addJs('/javascripts/lib/bootstrap.min.js');
    assets.addJs('/javascripts/lib/jquery.pnotify.js');
    assets.addJs('/javascripts/lib/numeral.js');
    assets.addJs('/javascripts/lib/moment.min.js');
    assets.addJs('/javascripts/math.js');
    assets.addJs('/javascripts/notifications.js');
    assets.addJs('/javascripts/eventEmitter.js');
    assets.addJs('/javascripts/statusBar.js');
    assets.addJs('/javascripts/modals.js');
    assets.addJs('/javascripts/behaviors.js');

    // Project specifics
    assets.addJs('/javascripts/lib/jquery.handsontable.js', 'project');
    assets.addJs('/javascripts/lib/jquery.contextMenu.js', 'project');
    assets.addJs('/javascripts/lib/jquery.ui.position.js', 'project');
    assets.addJs('/javascripts/lib/underscore.min.js', 'project');
    assets.addJs('/javascripts/lib/handlebars.js', 'project');
    assets.addJs('/javascripts/lib/highcharts.js', 'project');

    assets.addJs('/javascripts/handsontableExtensions.js', 'project');
    assets.addJs('/javascripts/projectCalculator.js', 'project');
    assets.addJs('/javascripts/renderers/baseRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/baseTabRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/infoRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/profilePricesRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/profileProjectsRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/profilesRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/scaleLinesRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/scalesRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/estimationLinesRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/summaryProfilePricesRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/summaryProfileProjectsRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/summaryScalesRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/summaryRenderer.js', 'project');
    assets.addJs('/javascripts/renderers/usersRenderer.js', 'project');
    assets.addJs('/javascripts/projectEngine.js', 'project');

    assets.addCss('/stylesheets/bootstrap.min.css');
    assets.addCss('/stylesheets/jquery.pnotify.default.css');
    assets.addCss('/stylesheets/jquery.handsontable.css');
    assets.addCss('/stylesheets/jquery.handsontable.bootstrap.css');
    assets.addCss('/stylesheets/jquery.contextMenu.css');
    assets.addCss('/stylesheets/app.css');
}