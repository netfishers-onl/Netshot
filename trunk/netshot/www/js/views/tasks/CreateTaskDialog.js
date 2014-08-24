define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/task/TaskModel',
	'models/device/DeviceCollection',
	'models/device/DeviceGroupCollection',
	'models/domain/DomainCollection',
	'views/tasks/MonitorTaskDialog',
	'views/tasks/TaskSchedulerToolbox',
	'text!templates/tasks/createTask.html',
	'text!templates/tasks/createScanSubnetsTask.html',
	'text!templates/tasks/createTakeGroupSnapshotTask.html',
	'text!templates/tasks/createCheckGroupComplianceTask.html',
	'text!templates/tasks/createCheckGroupSoftwareTask.html',
	'text!templates/tasks/createPurgeDatabaseTask.html'
], function($, _, Backbone, Dialog, TaskModel, DeviceCollection,
		DeviceGroupCollection, DomainCollection, MonitorTaskDialog,
		TaskSchedulerToolbox, createTaskTemplate, createScanSubnetsTaskTemplate,
		createTakeGroupSnapshotTaskTemplate,
		createCheckGroupComplianceTaskTemplate,
		createCheckGroupSoftwareTaskTemplate,
		createPurgeDatabaseTaskTemplate) {

	var CreateTaskDialog = Dialog.extend({

		template: _.template(createTaskTemplate),

		dialogOptions: {
			title: "Schedule a task"
		},

		buttons: {
			"< Previous": function() {
				this.dialogButtons().eq(0).button('disable');
				this.dialogButtons().eq(1).show();
				this.dialogButtons().eq(2).hide();
				this.$('.nsdialog-page1').show();
				this.$('.nsdialog-page2').hide();
				this.$('#nstasks-specifictask').html("");
			},
			"Next >": function() {
				this.dialogButtons().eq(0).button('enable');
				this.dialogButtons().eq(1).hide();
				this.dialogButtons().eq(2).show();
				this.$('.nsdialog-page1').hide();
				this.$('.nsdialog-page2').show();
				this.taskType = this.$('input[name="tasktype"]:checked').prop('id');
				this["renderCreate" + this.taskType]();
			},
			"Finish": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var task = new TaskModel({
					'type': this.taskType,
				});
				task.set(this.getTaskData());
				task.set(this.taskSchedulerToolbox.getSchedule());
				task.save().done(function(data) {
					that.close();
					var monitorTaskDialog = new MonitorTaskDialog({
						taskId: data.id,
						delay: 1200
					});
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText);
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
			this.dialogButtons().eq(0).button('disable');
			this.dialogButtons().eq(2).hide();
		},

		renderCreateScanSubnetsTask: function() {
			var that = this;
			this.domains = new DomainCollection([]);
			this.domains.fetch().done(function() {
				var template = _.template(createScanSubnetsTaskTemplate);
				that.$('#nstasks-specifictask').html(template);
				that.domains.each(function(domain) {
					$('<option />').attr('value', domain.get('id')).text(domain
							.get('name')).appendTo(that.$('#domain'));
				});

				that.getTaskData = function() {
					return {
						domain: that.$('#domain').val(),
						subnets: that.$('#subnets').val()
					}
				};
			});
			this.renderScheduler();
		},

		renderCreateTakeGroupSnapshotTask: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				var template = _.template(createTakeGroupSnapshotTaskTemplate);
				that.$('#nstasks-specifictask').html(template);
				that.groups.each(function(group) {
					$('<option />').attr('value', group.get('id'))
							.text(group.get('name')).appendTo(that.$('#group'));
				});
				that.$('#olderthanhours').spinner({
					step: 24,
					page: 24,
					numberFormat: "n",
					min: 0,
					value: 24,
					disabled: true,
					change: function() {
						var value = $(this).spinner('value');
						if (typeof(value) != "number") {
							$(this).spinner('value', 168);
						}
					}
				});
				that.$("#olderthan").click(function() {
					that.$('#olderthanhours').spinner('option', 'disabled', !$(this).is(":checked"));
				});

				that.getTaskData = function() {
					var data = {
						group: that.$('#group').val()
					};
					if (that.$('#olderthan').is(':checked')) {
						data.limitToOutofdateDeviceHours = that.$('#olderthanhours').spinner('value');
					}
					return data;
				};
			});
			this.renderScheduler();
		},

		renderCreateCheckGroupComplianceTask: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				var template = _.template(createCheckGroupComplianceTaskTemplate);
				that.$('#nstasks-specifictask').html(template);
				that.groups.each(function(group) {
					$('<option />').attr('value', group.get('id'))
							.text(group.get('name')).appendTo(that.$('#group'));
				});

				that.getTaskData = function() {
					return {
						group: that.$('#group').val(),
					}
				};
			});
			this.renderScheduler();
		},

		renderCreateCheckGroupSoftwareTask: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				var template = _.template(createCheckGroupSoftwareTaskTemplate);
				that.$('#nstasks-specifictask').html(template);
				that.groups.each(function(group) {
					$('<option />').attr('value', group.get('id'))
							.text(group.get('name')).appendTo(that.$('#group'));
				});

				that.getTaskData = function() {
					return {
						group: that.$('#group').val(),
					}
				};
			});
			this.renderScheduler();
		},
		
		renderCreatePurgeDatabaseTask: function() {
			var template = _.template(createPurgeDatabaseTaskTemplate);
			this.$('#nstasks-specifictask').html(template);
			this.getTaskData = function() {
				return {};
			};
			this.renderScheduler();
		},

		renderScheduler: function() {
			this.taskSchedulerToolbox = new TaskSchedulerToolbox();
		}

	});
	return CreateTaskDialog;
});
