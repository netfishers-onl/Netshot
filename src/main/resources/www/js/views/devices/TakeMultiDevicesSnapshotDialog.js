/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'models/task/TaskModel',
	'text!templates/devices/takeMultiDevicesSnapshot.html'
], function($, _, Backbone, Dialog, DeviceModel, TaskModel, takeMultiDevicesSnapshotTemplate) {

	return Dialog.extend({

		template: _.template(takeMultiDevicesSnapshotTemplate),

		dialogOptions: {
			title: "Take snapshots",
		},
		
		templateData: function() {
			return {
				number: this.options.devices.length
			};
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Confirm": function(event) {
				var that = this;
				that.$('button').button('disable');
				var $button = $(event.target).closest('button');
				var $buttons = $(event.target).closest(".ui-dialog").find('button');
				$buttons.button('disable');
				that.$el.on('dialogbeforeclose', function() {
					return false;
				});
				that.$('#bar').css('width', '0%');
				that.$('#status').show();
				var data = {
					credentialSetIds: [],
					clearCredentialSetIds: []
				};
				if (that.$('#devicedomain').val() != "none") {
					data.mgmtDomain = that.$('#devicedomain').val();
				}
				if (!that.$('#autotrycredentials').prop('indeterminate')) {
					data.autoTryCredentials = that.$('#autotrycredentials').is(":checked")
				}
				that.$('#devicecredentials input:checkbox').each(function() {
					if (!$(this).prop('indeterminate')) {
						if ($(this).prop('checked')) {
							data.credentialSetIds.push($(this).prop('name')
									.replace("credentialset", ""));
						}
						else {
							data.clearCredentialSetIds.push($(this).prop('name')
									.replace("credentialset", ""));
						}
					}
				});
				var devices = that.options.devices;
				var total = devices.length;
				var device;
				
				var startNext = function() {
					if (devices.length === 0) {
						that.close();
						that.options.onScheduled();
						return;
					}
					device = devices.pop();
					var task = new TaskModel({
						type: "TakeSnapshotTask",
						device: device.get('id'),
						scheduleType: 'ASAP'
					});
					task.save().done(function(data) {
						that.$('#bar').css('width', (100 * (1 - devices.length / total)) + '%');
						startNext();
					}).fail(function(data) {
						var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
						that.$("#errormsg").text("Error processing " + device.get('name') + ": " + error.errorMsg);
						that.$("#error").show();
						$buttons.button('enable');
						$button.button('disable');
						that.$el.off('dialogbeforeclose');
					});
				};
				startNext();
			},
		}

	});
});
