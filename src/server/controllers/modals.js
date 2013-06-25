var Project = require('../models/project');

exports.new = function(req, res) {
    res.render('modals/new', {
        project: new Project()
    });
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
                if (err) {
                    res.render('modals/_formNew', {
                        project: project
                    });
                    return;
                }
                res.ajaxRedirect('/projects/' + project.id);
            });
            break;

        case 'copy':
            break;
    }
};

exports.open = function(req, res) {
    res.render('modals/open');
};

exports.clientNames = function(req, res) {
    Project.queries.getAccessibleClientNames(req.query.q, req.user, function(err, clientNames) {
        res.json(clientNames);
    });
};