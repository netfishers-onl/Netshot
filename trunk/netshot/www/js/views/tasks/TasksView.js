define([
	'jquery',
	'underscore',
	'backbone',
	'models/task/TaskCollection',
	'views/tasks/MonitorTaskDialog',
	'views/tasks/CancelTaskDialog',
	'views/tasks/CreateTaskDialog',
	'text!templates/tasks/tasks.html',
	'text!templates/tasks/tasksToolBar.html',
	'text!templates/tasks/taskRow.html'
], function($, _, Backbone, TaskCollection, MonitorTaskDialog,
		CancelTaskDialog, CreateTaskDialog, tasksTemplate, tasksToolBarTemplate,
		taskRowTemplate) {

	makeLoadProgress(15);

	var TasksView = Backbone.View.extend({

		el: $("#page"),

		template: _.template(tasksTemplate),
		toolBarTemplate: _.template(tasksToolBarTemplate),
		taskTemplate: _.template(taskRowTemplate),

		selectedDate: new Date(),

		tasks: new TaskCollection([]),

		initialize: function() {
			this.tasks.status = "RUNNING";
			var that = this;
		},

		render: function() {
			var that = this;
			$('#nstoolbar-tasks').prop('checked', true);
			$('#nstoolbarpages').buttonset('refresh');

			this.$el.html(this.template);

			this.refreshTasks();

			$('#nstoolbar-section').html(this.toolBarTemplate);
			if (!user.isAdmin()) {
				$('#nstoolbar-tasks-create').remove();
			}
			$('#nstoolbar-section button').button();
			$('#nstoolbar-tasks-create').unbind('click').click(function() {
				createTaskDialog = new CreateTaskDialog();
			});

			this.$('#refresh').button({
				icons: {
					primary: "ui-icon-refresh"
				},
				text: false,
				disabled: true,
			}).click(function() {
				$(this).button('disable');
				that.refreshTasks();
			});
			this.$('#tabs').buttonset().change(function() {

				switch ($('#tabs :radio:checked').attr('id')) {
				case "all":
					that.$('#day').show();
					that.tasks.status = "ANY";
					break;
				case "running":
					that.$('#day').hide();
					that.tasks.status = "RUNNING";
					break;
				case "scheduled":
					that.$('#day').hide();
					that.tasks.status = "SCHEDULED";
					break;
				case "success":
					that.$('#day').show();
					that.tasks.status = "SUCCESS";
					break;
				case "failure":
					that.$('#day').show();
					that.tasks.status = "FAILURE";
					break;
				case "cancelled":
					that.$('#day').show();
					that.tasks.status = "CANCELLED";
					break;
				}
				that.refreshTasks();
			});
			this.$('#all').button({
				icons: {
					primary: "ui-icon-star"
				}
			});
			this.$('#running').button({
				icons: {
					primary: "ui-icon-play"
				}
			});
			this.$('#failure').button({
				icons: {
					primary: "ui-icon-alert"
				}
			});
			this.$('#success').button({
				icons: {
					primary: "ui-icon-flag"
				}
			});
			this.$('#scheduled').button({
				icons: {
					primary: "ui-icon-clock"
				}
			});
			this.$('#cancelled').button({
				icons: {
					primary: "ui-icon-cancel"
				}
			});
			this.$('#day').datepicker({
				dateFormat: "dd/mm/y",
				autoSize: true,
				onSelect: function() {
					that.tasks.day = $(this).datepicker('getDate');
					that.refreshTasks();
				}
			}).datepicker('setDate', this.selectedDate);

			return this;
		},

		refreshTasks: function() {
			var that = this;
			this.tasks.reset();
			this.tasks.fetch().done(function() {
				that.renderTaskList();

				if (!user.isAdmin()) {
					that.$('#nstasks-tasks .cancel').remove();
				}

				that.$('#nstasks-tasks button.cancel').button({
					icons: {
						primary: "ui-icon-cancel"
					},
					text: false
				}).click(function() {
					var id = $(this).closest('tr').data('task-id');
					var cancelTaskDialog = new CancelTaskDialog({
						model: that.tasks.get(id),
						onCancelled: function() {
							that.refreshTasks();
						}
					});
				});
				that.$('#nstasks-tasks button.monitor').button({
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
				that.$('#refresh').button('enable');
			});
		},

		renderTaskList: function() {
			this.htmlBuffer = "";
			this.tasks.each(this.renderTaskRow, this);
			this.$("#nstasks-tasks table>tbody").html(this.htmlBuffer);
		},

		renderTaskRow: function(task) {
			var row = this.taskTemplate(task.toJSON());
			this.htmlBuffer += row;
		}

	});
	return TasksView;
});
