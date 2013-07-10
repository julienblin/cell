
var util = require('util');

exports.show = function(req, res) {
    res.render('projects/project', {
        title: req.project.clientName + ' - ' + req.project.projectName,
        project: req.project
    });
};

exports.delete = function(req, res, next) {
    if (!req.project.isAuth('write', req.user)) {
        return next(new Error("user is not allowed to delete the project."));
    }

    req.project.remove(function (err) {
        if (err) return next(err);
        req.flash('success', util.format('Project %s - %s has been deleted successfully!', req.project.clientName, req.project.projectName));
        res.redirect('/');
    });
};