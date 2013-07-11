/**
 * Renderer for project users tab.
 */

var UsersRenderer = (function() {
    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#users', engine);
        self.usersWriteListSelector = '#usersWriteList';
        self.usersReadListSelector = '#usersReadList';

        var _userAddAuth = '';

        // Event subscriptions
        self.on('render', function() {
            $(self.usersWriteListSelector).html($(self.getTemplate('#users-list-template')({
                users: _.sortBy(_.map(self.engine.data.usersWrite, function(user) {
                    if (user.id === self.engine.userId)
                        user.current = true;
                    return user;
                }), 'username')
            })));
            $(self.usersReadListSelector).html($(self.getTemplate('#users-list-template')({
                users: _.sortBy(_.map(self.engine.data.usersRead, function(user) {
                    if (user.id === self.engine.userId)
                        user.current = true;
                    return user;
                }), 'username')
            })));
        });

        $('#linkAddEditor, #linkAddReader').on('click', function(e) {
            switch(e.currentTarget.id) {
                case 'linkAddEditor':
                    _userAddAuth = 'write';
                    break;
                case 'linkAddReader':
                    _userAddAuth = 'read';
                    break;
            }
            var existingUserIds = _.union(
                _.pluck(self.engine.data.usersRead, 'id'),
                _.pluck(self.engine.data.usersWrite, 'id')
            );
            modals.addUser(existingUserIds, function(success, modalId) {
                if(success) {
                    $('a[data-behavior~="userSelected"]', modalId).on('click', function(e) {
                        modals.close('addUser');
                        self.engine.setAuth($(this).data('id'), _userAddAuth);
                        e.preventDefault();
                    });
                }
            });
            e.preventDefault();
        });

        $(self.tabSelector).on('click', 'button[data-behavior~="removeUser"]', function(e) {
            self.engine.setAuth($(this).data('id'), 'none');
            e.preventDefault();
        });

        return self;
    }
})();
