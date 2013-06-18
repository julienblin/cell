var Project = require('../models/project');

exports.new = function(req, res) {
    res.render('modals/new');
};

exports.createNew = function(req, res) {
    switch(req.body.type) {
        case 'new':
            Project.create({
                clientName: req.body.clientName,
                projectName: req.body.projectName
            },
            req.user,
            function(err, project) {
                if (err) throw err;
                res.redirect('/projects/' + project.id);
            });
            break;

        case 'copy':
            break;
        default:
            throw new Error('Unrecognized type: ' + req.body.type);
    }
};

exports.open = function(req, res) {
    res.render('modals/open');
};