var Project = require('../models/project'),
    _ = require('underscore');

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
    var searchQuery = {};
    if(req.query.clientName) searchQuery.clientName = new RegExp(req.query.clientName, 'i');
    if(req.query.projectName) searchQuery.projectName = new RegExp(req.query.projectName, 'i');
    Project.queries.findPaginate(searchQuery, { clientName: 1, projectName: 1 }, req.user, { currentPage: req.query.page, pageSize: 10 }, function(err, pagination, results){
        res.render(req.query.search || req.query.page ? 'modals/_formOpen' : 'modals/open', {
            pagination: pagination,
            results: results,
            clientName: req.query.clientName,
            projectName: req.query.projectName
        });
    });
};

exports.clientNames = function(req, res) {
    Project.queries.getAccessibleClientNames(req.query.q, req.user, function(err, clientNames) {
        res.json(clientNames);
    });
};