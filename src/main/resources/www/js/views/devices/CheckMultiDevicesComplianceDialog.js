/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'models/task/TaskModel',
	'text!templates/devices/checkMultiDevicesCompliance.html'
], function($, _, Backbone, Dialog, DeviceModel, TaskModel, checkMultiDevicesComplianceTemplate) {

	return Dialog.extend({

		template: _.template(checkMultiDevicesComplianceTemplate),

		dialogOptions: {
			title: "Check compliance",
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
						type: "CheckComplianceTask",
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
			}
		}

	});
});
