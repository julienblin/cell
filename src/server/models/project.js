var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations');

var ProjectSchema = new Schema({
    clientName: { type: String, required: true, index: true },
    projectName: { type: String, required: true, validate: [validations.uniqueFieldInsensitive('Project', 'projectName', 'clientName')], index: true },

    users: {
        read: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        write: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    }
});

ProjectSchema.methods.isAuth = function(auth, user) {
    var readIndex = this.users.read.indexOf(user.id);
    var writeIndex = this.users.write.indexOf(user.id);
    switch(auth) {
        case 'read':
            if(readIndex != -1) return true;
            if(writeIndex != -1) return true;
            return false;
            break;
        case 'write':
            if(writeIndex != -1) return true;
            return false;
            break;
        default:
            throw new Error('unrecognized auth value: ' + auth);
            break;
    }
}

ProjectSchema.methods.setAuth = function(auth, user) {
    var readIndex = this.users.read.indexOf(user.id);
    var writeIndex = this.users.write.indexOf(user.id);
    switch(auth) {
        case 'none':
            if(readIndex != -1) this.users.read.splice(readIndex, 1);
            if(writeIndex != -1) this.users.write.splice(writeIndex, 1);
            break;
        case 'read':
            if(readIndex == -1) this.users.read.push(user.id);
            if(writeIndex != -1) this.users.write.splice(writeIndex, 1);
            break;
        case 'write':
            if(readIndex != -1) this.users.read.splice(readIndex, 1);
            if(writeIndex == -1) this.users.write.push(user.id);
            break;
    }
};

ProjectSchema.statics.create = function(values, user, callback) {
    var Project = mongoose.model('Project');
    var newProject = new Project(values);
    newProject.setAuth('write', user);
    newProject.save(function(err) {
        if (err) return callback(err, null);
        callback(null, newProject);
    });
};

ProjectSchema.plugin(require('./plugins/paginate'));

module.exports = mongoose.model('Project', ProjectSchema);