
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Cell' });
};

exports.login = function(req, res){
    res.render('login');
};