/** Copyright 2013-2019 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'ace/ace',
	'models/device/DeviceGroupCollection',
	'models/diagnostic/DiagnosticModel',
	'text!templates/diagnostics/editSimpleDiagnostic.html',
	'models/device/DeviceTypeCollection',
], function($, _, Backbone, Dialog, ace, DeviceGroupCollection, DiagnosticModel,
		editDiagnosticTemplate, DeviceTypeCollection) {

	var EditSimpleDiagnosticDialog = Dialog.extend({

		template: _.template(editDiagnosticTemplate),
		
		deviceTypes: new DeviceTypeCollection([]),

		initialize: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			$.when(this.groups.fetch(), this.deviceTypes.fetch()).then(function() {
				that.render();
			});
		},

		dialogOptions: {
			title: "Edit simple diagnostic",
			width: 530,
			height: 440,
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
					'deviceDriver': that.$('#devicetype').val(),
					'cliMode': that.$('#climode').val(),
					'command': that.$('#command').val(),
					'modifierPattern': that.$('#modifierpattern').val(),
					'modifierReplacement': that.$('#modifierreplacement').val(),
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

			this.deviceTypes.each(function(deviceType) {
				$('<option />').attr('value', deviceType.get('name')).text(
					deviceType.get('description')).appendTo(that.$('#devicetype'));
			});
			this.$('#devicetype').val(this.model.get('deviceDriver'));

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
			this.$('#climode').val(this.model.get('cliMode'));

		}

	});

	return EditSimpleDiagnosticDialog;
});
