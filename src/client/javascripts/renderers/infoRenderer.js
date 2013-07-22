/**
 * Renderer for project info tab.
 */

var InfoRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer("#info", engine);

        var _attachEventHandlers = function() {
            $('[contenteditable]', self.tabSelector).on('change', function(e) {
                var target$ = $(this);
                var modification = {
                    model: 'Project',
                    action: 'update',
                    values: {}
                };
                modification.values[target$.data('property')] = [target$.data('before'), target$.text()];
                self.engine.applyModifications([modification]);
            });

            $('#infoNotesArea', self.tabSelector).on('change', function(e) {
                var target$ = $(this);
                self.engine.applyModifications([{
                    model: 'Project',
                    action: 'update',
                    values: {
                        notes: [self.engine.data.notes, target$.val()]
                    }
                }]);
            });

            $('#infoContingencyInput', self.tabSelector).on('change', function(e) {
                var target$ = $(this);
                self.engine.applyModifications([{
                    model: 'Project',
                    action: 'update',
                    values: {
                        contingency: [self.engine.data.contingency, target$.val()]
                    }
                }]);
            });

            $('#btnLockProject').on('click', function(e) {
                self.engine.applyModifications([{
                    model: 'Project',
                    action: 'update',
                    values: {
                        isLocked: [self.engine.data.isLocked, !self.engine.data.isLocked]
                    }
                }]);
                e.preventDefault();
            });

            $('#btnOpenSnapshot').on('click', function(e) {
                e.preventDefault();
                modals.openModal('#modalOpenSnapshot', '/projects/' + self.engine.projectId + '/snapshots');
            });
        };

        // Event subscriptions
        self.on('render', function() {
            $('#infoMain').html(self.getTemplate('#info-main-template')({
                projectName: self.engine.data.projectName,
                clientName: self.engine.data.clientName,
                notes: self.engine.data.notes,
                contingency: self.engine.data.contingency,
                isReadOnly: self.engine.isReadOnly
            }));

            if(self.engine.isSnapshot) {
                $('#infoGutter').html(self.getTemplate('#info-gutter-snapshot-template')({
                    projectId: self.engine.projectId,
                    snapshotTitle: self.engine.snapshotTitle
                }));
            } else {
                $('#infoGutter').html(self.getTemplate('#info-gutter-project-template')({
                    isLocked: self.engine.data.isLocked,
                    isReadOnly: self.engine.data.isReadOnly,
                    isUserReadOnly: self.engine.data.isUserReadOnly
                }));
            }

            _attachEventHandlers();

            $('#createdAt').text('Created:' + moment(self.engine.data.createdAt).calendar());
            document.title = "Cell - " + engine.data.clientName + ' - ' + engine.data.projectName;
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
                    notify.fatal('An internal error has occurred. Reason:' + errorThrown);
                },
                success: function(data) {
                    if(data.status === 'success') {
                        $('#modalTakeSnapshot').modal('hide');
                        var snapshotUrl = '/projects/' + self.engine.projectId + '/snapshots/' + data.id;
                        notify.info('Snapshot successfully taken.<br><a href="' + snapshotUrl + '">Open it.</a>', { hide: false });
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
