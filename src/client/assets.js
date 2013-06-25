/**
 * Assets configuration
 */

module.exports = function(assets) {
    assets.root = __dirname;
    assets.addJs('/javascripts/jquery.min.js');
    assets.addJs('/javascripts/bootstrap.min.js');
    assets.addJs('/javascripts/alerts.js');
    assets.addJs('/javascripts/modals.js');
    assets.addJs('/javascripts/behaviors.js');

    // Project specifics
    assets.addJs('/javascripts/numeral.js', 'project');
    assets.addJs('/javascripts/jquery.handsontable.js', 'project');
    assets.addJs('/javascripts/jquery.contextMenu.js', 'project');
    assets.addJs('/javascripts/jquery.ui.position.js', 'project');
    assets.addJs('/javascripts/projectengine.js', 'project');

    assets.addCss('/stylesheets/bootstrap.min.css');
    assets.addCss('/stylesheets/jquery.handsontable.css');
    assets.addCss('/stylesheets/jquery.handsontable.bootstrap.css');
    assets.addCss('/stylesheets/jquery.contextMenu.css');
    assets.addCss('/stylesheets/app.css');
}