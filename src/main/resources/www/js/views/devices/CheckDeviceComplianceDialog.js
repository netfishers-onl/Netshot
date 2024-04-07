/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'models/task/TaskModel',
	'text!templates/devices/checkDeviceCompliance.html',
	'views/tasks/TaskSchedulerToolbox',
	'views/tasks/MonitorTaskDialog'
], function($, _, Backbone, Dialog, DeviceMode, TaskModel,
		checkDeviceComplianceTemplate, TaskSchedulerToolbox, MonitorTaskDialog) {

	return Dialog.extend({

		template: _.template(checkDeviceComplianceTemplate),

		dialogOptions: {
			title: "Check device compliance",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Save": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var task = new TaskModel({
					'type': "CheckComplianceTask",
					'device': that.model.get('id')
				});
				task.set(that.taskSchedulerToolbox.getSchedule());
				task.save().done(function(data) {
					that.close();
					var monitorTaskDialog = new MonitorTaskDialog({
						taskId: data.id,
						delay: 1200
					});
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
		},

		onCreate: function() {
			this.taskSchedulerToolbox = new TaskSchedulerToolbox();
		}

	});
});
