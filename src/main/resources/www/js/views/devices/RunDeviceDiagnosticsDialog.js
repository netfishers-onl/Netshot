/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'models/task/TaskModel',
	'text!templates/devices/runDeviceDiagnostics.html',
	'views/tasks/TaskSchedulerToolbox',
	'views/tasks/MonitorTaskDialog'
], function($, _, Backbone, Dialog, DeviceMode, TaskModel,
		runDeviceDiagnosticsTemplate, TaskSchedulerToolbox, MonitorTaskDialog) {

	return Dialog.extend({

		template: _.template(runDeviceDiagnosticsTemplate),

		dialogOptions: {
			title: "Run diagnostics on a device",
		},

		buttons: {
			"Save": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var task = new TaskModel({
					'type': "RunDiagnosticsTask",
					'device': that.model.get('id'),
					'dontCheckCompliance': !that.$('#checkcompliance').is(':checked'),
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
			"Cancel": function() {
				this.close();
			}
		},

		onCreate: function() {
			this.taskSchedulerToolbox = new TaskSchedulerToolbox();
		}

	});
});
