/**
 * Projects-related pages. A lot of it is done client-side though.
 */

"use strict";

var util = require('util'),
    Snapshot = require('../models/snapshot');

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

exports.createSnapshot = function(req, res, next) {
    Snapshot.create({
        model: 'Project',
        ref: req.project.id,
        title: req.body.title,
        data: req.body.data
    }, function(err, snapshot) {
        if (err) return res.json({ status: 'error', error: err });
        res.json({ status: 'success', id: snapshot.id });
    });
};

exports.openSnapshot = function(req, res, next) {
    var searchQuery = { model: 'Project', ref: req.project.id };
    if(req.query.title) searchQuery.title = new RegExp(req.query.title, 'i');

    Snapshot.paginate(searchQuery, { created: -1 }, { currentPage: req.query.page }, function(err, pagination, results){
        if (err) return next(err);
        res.render(req.query.search || req.query.page ? 'projects/_formOpenSnapshot' : 'projects/openSnapshot', {
            title: req.query.title,
            pagination: pagination,
            results: results,
            projectId: req.project.id
        });
    });
};

exports.showSnapshot = function(req, res, next) {
    Snapshot.findById(req.params.snapshotId, function(err, snapshot) {
        if(err) return next(err);
        res.render('projects/project', {
            title: req.project.clientName + ' - ' + req.project.projectName,
            project: req.project,
            snapshot: JSON.stringify(snapshot)
        });
    });
};