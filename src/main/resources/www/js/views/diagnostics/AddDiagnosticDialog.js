/** Copyright 2013-2019 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'ace/ace',
	'models/device/DeviceGroupCollection',
	'models/diagnostic/DiagnosticModel',
	'text!templates/diagnostics/addDiagnostic.html',
	'models/device/DeviceTypeCollection',
], function($, _, Backbone, Dialog, ace, DeviceGroupCollection, DiagnosticModel,
		addDiagnosticTemplate, DeviceTypeCollection) {

	var AddDiagnosticDialog = Dialog.extend({

		template: _.template(addDiagnosticTemplate),
		
		deviceTypes: new DeviceTypeCollection([]),

		initialize: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			$.when(this.groups.fetch(), this.deviceTypes.fetch()).then(function() {
				that.render();
			});
		},

		dialogOptions: {
			title: "Add diagnostic",
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
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var diagnostic = new DiagnosticModel();
				var data = {
					'name': that.$('#diagnosticname').val(),
					'targetGroup': that.$('#group').val(),
					'type': "." + that.$('input[name="diagnostictype"]:checked').data('type'),
					'enabled': that.$('#diagnosticenabled').is(':checked'),
					'resultType': that.$('#resulttype').val(),
				};
				if (data.type === ".SimpleDiagnostic") {
					_.extend(data, {
						'deviceDriver': that.$('#devicetype').val(),
						'cliMode': that.$('#climode').val(),
						'command': that.$('#command').val(),
						'modifierPattern': that.$('#modifierpattern').val(),
						'modifierReplacement': that.$('#modifierreplacement').val(),
					});
				}
				else if (data.type === ".JavaScriptDiagnostic") {
					_.extend(data, {
						'script': that.jsScriptEditor.getValue(),
					});
				}
				else if (data.type === ".PythonDiagnostic") {
					_.extend(data, {
						'script': that.pyScriptEditor.getValue(),
					});
				}
				diagnostic.save(data).done(function(data) {
					that.close();
					var diagnostic = new DiagnosticModel(data);
					that.options.onAdded(diagnostic);
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

			this.jsScript =
				'function diagnose(cli, device, diagnostic) {\n' +
					'\tcli.macro("enable");\n' +
					'\tvar output = cli.command("show something");\n' +
					'\t// Process output somewhat\n' +
					'\tdiagnostic.set(output);\n' +
				'}\n';
			this.pyScript =
				'def diagnose(cli, device, diagnostic):\n' +
					'  cli.macro("enable")\n' +
					'  output = cli.command("show something")\n' +
					'  # Process output somewhat\n' +
					'  diagnostic.set(output)\n';

			this.deviceTypes.each(function(deviceType) {
				$('<option />').attr('value', deviceType.get('name')).text(
					deviceType.get('description')).appendTo(that.$('#devicetype'));
			});
			that.$('#devicetype').change(function() {
				that.$('#climode').empty();
				that.driver = that.deviceTypes.findWhere({ name: $(this).val() });
				if (typeof that.driver == "object" && that.driver) {
					var cliModes = that.driver.get('cliMainModes');
					if (cliModes) {
						_.each(cliModes, function(cliMode) {
							$('<option />').attr('value', cliMode).text(cliMode).appendTo(that.$('#climode'));
						});
					}
				}
			}).change();
			that.$('input[name="diagnostictype"]').change(function() {
				var diagnosticType = $('input[name="diagnostictype"]:checked').data('type');
				that.$('.nsdiagnostics-settings[data-for-type="' + diagnosticType + '"]').show();
				if (diagnosticType === "JavaScriptDiagnostic") {
					$('<div id="nsdiagnostic-adddiagnostic-script-js" class="nsdiagnostic-adddiagnostic-script" />')
						.appendTo('#nsdiagnostics-adddiagnostic-editorfield-js');
					that.jsScriptEditor = ace.edit('nsdiagnostic-adddiagnostic-script-js');
					that.jsScriptEditor.setValue(that.jsScript);
					that.jsScriptEditor.getSession().setMode("ace/mode/javascript");
					that.jsScriptEditor.gotoLine(1);
				}
				else if (that.jsScriptEditor) {
					that.jsScript = that.jsScriptEditor.getValue();
					that.jsScriptEditor.destroy();
					that.jsScriptEditor = null;
					that.$('#nsdiagnostics-adddiagnostic-editorfield-js').empty();
				}
				if (diagnosticType === "PythonDiagnostic") {
					$('<div id="nsdiagnostic-adddiagnostic-script-py" class="nsdiagnostic-adddiagnostic-script" />')
						.appendTo('#nsdiagnostics-adddiagnostic-editorfield-py');
					that.pyScriptEditor = ace.edit('nsdiagnostic-adddiagnostic-script-py');
					that.pyScriptEditor.setValue(that.pyScript);
					that.pyScriptEditor.getSession().setMode("ace/mode/python");
					that.pyScriptEditor.gotoLine(1);
				}
				else if (that.pyScriptEditor) {
					that.pyScript = that.pyScriptEditor.getValue();
					that.pyScriptEditor.destroy();
					that.pyScriptEditor = null;
					that.$('#nsdiagnostics-adddiagnostic-editorfield-py').empty();
				}
				that.$('.nsdiagnostics-settings:not([data-for-type="' + diagnosticType + '"])').hide();
			}).change();
			this.$el.on('dialogresizestop', function(even, ui) {
				if (that.jsScriptEditor) {
					that.jsScriptEditor.resize();
				}
				if (that.pyScriptEditor) {
					that.pyScriptEditor.resize();
				}
			});

		},

		onClose: function() {
			if (this.jsScriptEditor) {
				this.jsScriptEditor.destroy();
			}
			if (this.pyScriptEditor) {
				this.pyScriptEditor.destroy();
			}
			this.$el.off('dialogresizestop');
		}

	});

	return AddDiagnosticDialog;
});
