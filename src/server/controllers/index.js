/**
 * GET homepage
 */


exports.index = function(req, res){
    res.render('index', { title: 'Cell' });
};