/**
 * Renderer for project info tab.
 */

var InfoRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer("#info", engine);

        // Event subscriptions
        self.on('render', function() {
            $('[data-property="projectName"]').text(engine.data.projectName);
            $('[data-property="projectName"]').prop('contenteditable', !self.engine.isReadOnly);
            $('[data-property="clientName"]').text(engine.data.clientName);
            $('[data-property="clientName"]').prop('contenteditable', !self.engine.isReadOnly);
            if(self.engine.isSnapshot) {
                $('[data-property="snapshotTitle"]').text('Snapshot: ' + engine.snapshotTitle);
            }
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

            $('#btnLockProject').prop('disabled', self.engine.isUserReadOnly);
            $('#btnDeleteProject').prop('disabled', self.engine.isReadOnly);
        });

        $('[contenteditable]', self.tabSelector).on('change', function(e) {
            var target = $(this);
            self.engine.applyModifications([{
                model: 'Project',
                action: 'update',
                property: target.data('property'),
                oldValue: target.data('before'),
                newValue: target.text()
            }]);
        });

        $('#btnLockProject').on('click', function(e) {
            self.engine.applyModifications([{
                model: 'Project',
                action: 'update',
                property: 'isLocked',
                oldValue: self.engine.data.isLocked,
                newValue: !self.engine.data.isLocked
            }]);
            e.preventDefault();
        });

        $('#btnOpenSnapshot').on('click', function(e) {
            e.preventDefault();
            modals.openModal('#modalOpenSnapshot', '/projects/' + self.engine.projectId + '/snapshots');
        });

        $('#modalTakeSnapshotForm').on('submit', function(e) {
            e.preventDefault();
            var form$ = $(this);
            $.ajax({
                url:form$.attr('action'),
                method: form$.attr('method'),
                data: {
                    id: self.engine.projectId,
                    title: $('input[name="title"]', form$).val(),
                    data: JSON.stringify(self.engine.data)
                },
                error: function(xhr, testStatus, errorThrown) {
                    alerts.fatal('An internal error has occurred. Reason:' + errorThrown);
                },
                success: function(data) {
                    if(data.status === 'success') {
                        $('#modalTakeSnapshot').modal('hide');
                        var snapshotUrl = '/projects/' + self.engine.projectId + '/snapshots/' + data.id;
                        alerts.info('Snapshot successfully taken. <a href="' + snapshotUrl + '">Open it.</a>', 10000);
                        behaviors.displayValidationErrors({});
                    } else {
                        if(data.error) {
                            behaviors.displayValidationErrors(data.error.errors);
                        }
                    }
                }
            });
        });

        return self;
    };
})();
