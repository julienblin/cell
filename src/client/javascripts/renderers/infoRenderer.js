/**
 * Renderer for project info tab.
 */

var InfoRenderer = (function() {
    return function(engine) {
        var self = {};
        self.__proto__ = BaseRenderer("#info", engine);

        // Event subscriptions
        self.on('render', function() {
            $('[data-property="projectName"]').text(engine.data.projectName);
            $('[data-property="clientName"]').text(engine.data.clientName);
            $('#createdAt').text('Created:' + new Date(engine.data.created).toLocaleString());
            document.title = "Cell - " + engine.data.clientName + ' - ' + engine.data.projectName;
        });

        $('[contenteditable]', self.tabSelector).on('change', function(e) {
            var target = $(this);
            self.emit('applyModifications', [{
                model: 'Project',
                id: engine.projectId,
                action: 'update',
                property: target.data('property'),
                oldValue: target.data('before'),
                newValue: target.text()
            }]);
        });

        return self;
    }
})();
