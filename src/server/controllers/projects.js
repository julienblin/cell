
exports.show = function(req, res) {
    res.render('projects/project', {
        title: req.project.clientName + ' - ' + req.project.projectName,
        project: req.project
    });
};