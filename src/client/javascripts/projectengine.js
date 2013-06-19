window.ProjectEngine = function(id) {
    this.id = id;
};

ProjectEngine.prototype.init = function() {
    var loadingAlert = alerts.info('Loading project...');
    setTimeout(function() {
        loadingAlert.dismiss();
        var successAlert = alerts.success('Project loaded - good to go!', 3000);
    }, 3000);
}