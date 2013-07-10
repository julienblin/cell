/**
 * Renderer for project info tab.
 */

var InfoRenderer = (function() {
    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer("#info", engine);

        // Event subscriptions
        self.on('render', function() {
            $('[data-property="projectName"]').text(engine.data.projectName);
            $('[data-property="clientName"]').text(engine.data.clientName);
            $('#createdAt').text('Created:' + new Date(engine.data.created).toLocaleString());

            if(self.engine.data.isLocked) {
                $('#btnLockProject').addClass('active');
                $('#btnLockProject i').removeClass();
                $('#btnLockProject i').addClass('icon-lock');
                $('#btnLockProject span').text(' Locked!');
            } else {
                $('#btnLockProject').removeClass('active');
                $('#btnLockProject i').removeClass();
                $('#btnLockProject i').addClass('icon-pencil');
                $('#btnLockProject span').text(' Lock');
            }

            document.title = "Cell - " + engine.data.clientName + ' - ' + engine.data.projectName;
        });

        $('[contenteditable]', self.tabSelector).on('change', function(e) {
            var target = $(this);
            self.emit('applyModifications', [{
                model: 'Project',
                action: 'update',
                property: target.data('property'),
                oldValue: target.data('before'),
                newValue: target.text()
            }]);
        });

        $('#btnLockProject').on('click', function(e) {
            self.emit('applyModifications', [{
                model: 'Project',
                action: 'update',
                property: 'isLocked',
                oldValue: self.engine.data.isLocked,
                newValue: !self.engine.data.isLocked
            }]);
            e.preventDefault();
        });

        return self;
    }
})();
