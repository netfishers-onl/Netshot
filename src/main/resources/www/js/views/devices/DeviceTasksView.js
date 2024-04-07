/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'tablesort',
	'models/task/TaskCollection',
	'views/tasks/MonitorTaskDialog',
	'views/tasks/CancelTaskDialog',
	'text!templates/devices/deviceTasks.html',
	'text!templates/devices/deviceTask.html'
], function($, _, Backbone, TableSort, TaskCollection, MonitorTaskDialog,
		CancelTaskDialog, deviceTasksTemplate, deviceTaskTemplate) {

	return Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceTasksTemplate),
		taskTemplate: _.template(deviceTaskTemplate),

		initialize: function(options) {
			this.device = options.device;
			this.render();
		},

		render: function() {
			var that = this;
			this.$el.html(this.template());
			this.refreshTasks();
		},
		
		refreshTasks: function() {
			var that = this;
			this.deviceTasks = new TaskCollection({}, {
				device: this.device
			});
			this.deviceTasks.fetch().done(function() {
				that.renderTasks();
			});
		},
		
		renderTasks: function() {
			var that = this;
			var $table = this.$("#tasks tbody");
			$table.html("");
			this.deviceTasks.each(function(task) {
				$(that.taskTemplate(task.toJSON())).appendTo($table);
			});
			if (!user.isReadWrite()) {
				that.$('#tasks .cancel').remove();
			}

			that.$('#tasks button.cancel').button({
				icons: {
					primary: "ui-icon-cancel"
				},
				text: false
			}).click(function() {
				var id = $(this).closest('tr').data('task-id');
				var cancelTaskDialog = new CancelTaskDialog({
					model: that.deviceTasks.get(id),
					onCancelled: function() {
						that.refreshTasks();
					}
				});
			});
			that.$('#tasks button.monitor').button({
				icons: {
					primary: "ui-icon-newwin"
				},
				text: false
			}).click(function() {
				var id = $(this).closest('tr').data('task-id');
				var monitorTaskDialog = new MonitorTaskDialog({
					taskId: id
				});
			});
			new TableSort($table.parent().get(0));

			return this;
		},

		destroy: function() {
			this.$el.empty();
		}

	});
});
