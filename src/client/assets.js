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

    assets.addCss('/stylesheets/bootstrap.min.css');
    assets.addCss('/stylesheets/app.css');
}