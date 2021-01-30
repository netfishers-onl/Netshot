/** Copyright 2013-2019 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'ace/ace',
	'models/device/DeviceGroupCollection',
	'models/diagnostic/DiagnosticModel',
	'text!templates/diagnostics/editScriptDiagnostic.html',
	'models/device/DeviceTypeCollection',
], function($, _, Backbone, Dialog, ace, DeviceGroupCollection, DiagnosticModel,
		editDiagnosticTemplate, DeviceTypeCollection) {

	var EditScriptDiagnosticDialog = Dialog.extend({

		template: _.template(editDiagnosticTemplate),

		initialize: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().then(function() {
				that.render();
			});
		},

		dialogOptions: {
			title: "Edit script diagnostic",
			width: 530,
			minWidth: 530,
			height: 500,
			minHeight: 410,
			resizable: true,
			resizeStop: function(e, ui) {
				AddDiagnosticDialog.prototype.dialogOptions.width = ui.size.width;
				AddDiagnosticDialog.prototype.dialogOptions.height = ui.size.height;
			}
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Save": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();

				saveModel.save({
					'name': that.$('#diagnosticname').val(),
					'targetGroup': that.$('#group').val(),
					'type': saveModel.get('type'),
					'enabled': that.$('#diagnosticenabled').is(':checked'),
					'resultType': that.$('#resulttype').val(),
					'script': that.scriptEditor.getValue(),
				}).done(function(data) {
					that.close();
					that.model.set(data);
					that.options.onEdited();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			}
		},

		onCreate: function() {
			var that = this;
			this.groups.each(function(group) {
				$('<option />').attr('value', group.get('id')).text(group.get('name'))
						.appendTo(that.$('#group'));
			});
			this.$('#group').val(this.model.get('targetGroup') ? this.model.get('targetGroup').id : -1);
			this.$('#resulttype').val(this.model.get('resultType'));
			this.scriptEditor = ace.edit('nsdiagnostic-editdiagnostic-script');
			this.scriptEditor.setValue(this.model.get('script'));
			if (this.model.get("type") === ".JavaScriptDiagnostic") {
				this.scriptEditor.getSession().setMode("ace/mode/javascript");
			}
			else if (this.model.get("type") === ".PythonDiagnostic") {
				this.scriptEditor.getSession().setMode("ace/mode/python");
			}
			this.scriptEditor.gotoLine(1);
			this.$el.on('dialogresizestop', function(even, ui) {
				if (that.scriptEditor) {
					that.scriptEditor.resize();
				}
			});

		},

		onClose: function() {
			if (this.scriptEditor) {
				this.scriptEditor.destroy();
			}
			this.$el.off('dialogresizestop');
		}

	});

	return EditScriptDiagnosticDialog;
});
