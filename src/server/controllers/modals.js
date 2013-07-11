/**
 * Regroup all AJAX modals (such as new/open a project and addUsers)
 */

"use strict";

var Project = require('../models/project'),
    User = require('../models/user'),
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

exports.open = function(req, res, next) {
    var searchQuery = {};
    if(req.query.clientName) searchQuery.clientName = new RegExp(req.query.clientName, 'i');
    if(req.query.projectName) searchQuery.projectName = new RegExp(req.query.projectName, 'i');
    Project.queries.findPaginate(searchQuery, { clientName: 1, projectName: 1 }, req.user, { currentPage: req.query.page, pageSize: 10 }, function(err, pagination, results){
        if (err) return next(err);
        res.render(req.query.search || req.query.page ? 'modals/_formOpen' : 'modals/open', {
            pagination: pagination,
            results: results,
            clientName: req.query.clientName,
            projectName: req.query.projectName
        });
    });
};

exports.clientNames = function(req, res, next) {
    Project.queries.getAccessibleClientNames(req.query.q, req.user, function(err, clientNames) {
        if (err) return next(err);
        res.json(clientNames);
    });
};

exports.addUser = function(req, res, next) {
    var searchQuery = {};
    if(req.query.username) searchQuery.username = new RegExp(req.query.username, 'i');
    if(req.query.email) searchQuery.email = new RegExp(req.query.email, 'i');

    if(req.query.filter) {
        searchQuery = {
            '$and': [
                { '_id': { '$nin': req.query.filter.split(',') } },
                { 'isActive' : true },
                searchQuery
            ]
        };
    }

    console.log(searchQuery);
    User.paginate(searchQuery, "username", { currentPage: req.query.page, pageSize: 10 }, function(err, pagination, results){
        if (err) return next(err);
        res.render(req.query.search || req.query.page ? 'modals/_formAddUser' : 'modals/addUser', {
            pagination: pagination,
            results: results,
            filter: req.query.filter,
            username: req.query.username,
            email: req.query.email
        });
    });
};