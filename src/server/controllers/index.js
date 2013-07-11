/**
 * GET homepage
 */

"use strict";

exports.index = function(req, res){
    res.render('index', { title: 'Cell' });
};