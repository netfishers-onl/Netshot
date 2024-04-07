/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/task/TaskModel',
	'text!templates/tasks/monitorTask.html'
], function($, _, Backbone, Dialog, TaskModel, monitorTaskTemplate) {

	var MonitorTaskDialog = Dialog.extend({

		template: _.template(monitorTaskTemplate),

		initialize: function() {
			var that = this;
			this.active = false;
			this.model = new TaskModel({
				id: this.options.taskId
			});
			var fetchAndRender = function() {
				that.model.fetch().complete(function() {
					that.render();
				});
			};
			if (typeof this.options.delay === "number") {
				setTimeout(fetchAndRender, this.options.delay);
			}
			else {
				fetchAndRender();
			}
		},

		dialogOptions: {
			title: "Task status",
			width: 600,
		},

		buttons: {
			"Close": function() {
				this.close();
			}
		},

		onCreate: function() {
			this.active = true;
			this.refresh();
		},

		refresh: function() {
			if (!this.active) {
				return;
			}
			var that = this;
			var compiledTemplate = _.template(monitorTaskTemplate);
			this.$el.html(compiledTemplate(this.model.toJSON()));
			this.$("#nstask-showlog a").click(function() {
				$(this).closest("#nstask-tasklog").find(".nsdialog-log").show();
				$(this).hide();
				return false;
			});
			if ($.inArray(this.model.get('status'), [
				"SUCCESS",
				"FAILURE",
				"CANCELLED"
			]) == -1) {
				this.model.fetch().complete(function() {
					setTimeout(function() {
						that.refresh();
					}, 5000);
				});
			}
			else {
				this.$("#nstask-tasklog .nsdialog-log").html(this.model.get('log')
						.replace(/\n/g, "<br/>"));
				this.$("#nstask-tasklog").show();
				this.$("#nstask-showlog").show();
				if (this.model.get('status') == "SUCCESS"
						&& this.model.get('type') == "DiscoverDeviceTypeTask") {
					this.$("#gotosnapshot").click(function() {
						that.close();
						var monitorTaskDialog = new MonitorTaskDialog({
							taskId: that.model.get('snapshotTaskId')
						});
						return false;
					});
				}
				if (this.model.get('status') == "SUCCESS"
						&& this.model.get('type') == "TakeSnapshotTask") {
					this.$("#gotodevice").click(function() {
						that.close();
						return true;
					});
				}
				if (this.model.get('status') != "CANCELLED" && this.model.get('debugEnabled')) {
					this.$("#nstask-showdebuglog").show();
					var url = that.model.getDebugLogUrl();
					this.$("#nstask-showdebuglog a").click(function() {
						window.location = url;
						return false;
					}).prop("href", url);
				}
			}
		},

		onClose: function() {
			this.active = false;
		}

	});
	return MonitorTaskDialog;
});
