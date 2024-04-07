/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'models/task/TaskModel',
	'text!templates/devices/takeDeviceSnapshot.html',
	'views/tasks/TaskSchedulerToolbox',
	'views/tasks/MonitorTaskDialog'
], function($, _, Backbone, Dialog, DeviceMode, TaskModel,
		takeDeviceSnapshotTemplate, TaskSchedulerToolbox, MonitorTaskDialog) {

	return Dialog.extend({

		template: _.template(takeDeviceSnapshotTemplate),

		dialogOptions: {
			title: "Take snapshot",
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
					'type': "TakeSnapshotTask",
					'device': that.model.get('id'),
					'debugEnabled': that.$('#debugsession').is(":checked"),
					'dontRunDiagnostics': !that.$('#thenrundiagnostics').is(':checked'),
					'dontCheckCompliance': !that.$('#thencheckcompliance').is(':checked'),
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
			var that = this;
			this.$("#hidden").hide();
			this.$(".nsdialog-logo").dblclick(function() {
				that.$("#hidden").show();
			});
			this.taskSchedulerToolbox = new TaskSchedulerToolbox();
		}

	});
});
