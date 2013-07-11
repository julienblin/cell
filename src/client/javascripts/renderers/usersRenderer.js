/**
 * Renderer for project users tab.
 */

var UsersRenderer = (function() {
    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#users', engine);
        self.usersWriteListSelector = '#usersWriteList';
        self.usersReadListSelector = '#usersReadList';

        // Event subscriptions
        self.on('render', function() {
            $(self.usersWriteListSelector).html($(self.getTemplate('#users-list-template')({
                users: _.map(self.engine.data.usersWrite, function(user) {
                    if (user.id === self.engine.userId)
                        user.current = true;
                    return user;
                })
            })));
            $(self.usersReadListSelector).html($(self.getTemplate('#users-list-template')({
                users: _.map(self.engine.data.usersRead, function(user) {
                    if (user.id === self.engine.userId)
                        user.current = true;
                    return user;
                })
            })));
        });

        return self;
    }
})();
