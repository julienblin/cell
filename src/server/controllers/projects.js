
exports.show = function(req, res) {
    res.end(req.project.clientName);
};