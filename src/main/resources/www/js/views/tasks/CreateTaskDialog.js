/** Copyright 2013-2024 Netshot */
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
	'text!templates/tasks/createRunGroupDiagnosticsTask.html',
	'text!templates/tasks/createCheckGroupComplianceTask.html',
	'text!templates/tasks/createCheckGroupSoftwareTask.html',
	'text!templates/tasks/createPurgeDatabaseTask.html'
], function($, _, Backbone, Dialog, TaskModel, DeviceCollection,
		DeviceGroupCollection, DomainCollection, MonitorTaskDialog,
		TaskSchedulerToolbox, createTaskTemplate, createScanSubnetsTaskTemplate,
		createTakeGroupSnapshotTaskTemplate,
		createRunGroupDiagnosticsTaskTemplate,
		createCheckGroupComplianceTaskTemplate,
		createCheckGroupSoftwareTaskTemplate,
		createPurgeDatabaseTaskTemplate) {

	return Dialog.extend({

		template: _.template(createTaskTemplate),

		dialogOptions: {
			title: "Schedule a task"
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"< Previous": function() {
				this.dialogButtons().eq(1).button('disable');
				this.dialogButtons().eq(2).show();
				this.dialogButtons().eq(3).hide();
				this.$('.nsdialog-page1').show();
				this.$('.nsdialog-page2').hide();
				this.$('#nstasks-specifictask').html("");
			},
			"Next >": function() {
				this.dialogButtons().eq(1).button('enable');
				this.dialogButtons().eq(2).hide();
				this.dialogButtons().eq(3).show();
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
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
		},

		onCreate: function() {
			this.dialogButtons().eq(1).button('disable');
			this.dialogButtons().eq(3).hide();
			this.$('input[name="tasktype"]').each(function() {
				var requiredLevel = $(this).data("level") || 0;
				if (user.get('level') < requiredLevel) {
					$(this).next().andSelf().remove();
				}
			});
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
						if (typeof value !== "number") {
							$(this).spinner('value', 168);
						}
					}
				});
				that.$("#olderthan").click(function() {
					that.$('#olderthanhours').spinner('option', 'disabled', !$(this).is(":checked"));
				});

				that.getTaskData = function() {
					var data = {
						group: that.$('#group').val(),
						dontRunDiagnostics: !that.$('#dorundiagnostics').is(':checked'),
						dontCheckCompliance: !that.$('#docheckcompliance').is(':checked')
					};
					if (that.$('#olderthan').is(':checked')) {
						data.limitToOutofdateDeviceHours = that.$('#olderthanhours').spinner('value');
					}
					return data;
				};
			});
			this.renderScheduler();
		},

		renderCreateRunGroupDiagnosticsTask: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				var template = _.template(createRunGroupDiagnosticsTaskTemplate);
				that.$('#nstasks-specifictask').html(template);
				that.groups.each(function(group) {
					$('<option />').attr('value', group.get('id'))
							.text(group.get('name')).appendTo(that.$('#group'));
				});

				that.getTaskData = function() {
					return {
						group: that.$('#group').val(),
						dontCheckCompliance: !that.$('#checkcompliance').is(':checked')
					};
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
			var that = this;
			var template = _.template(createPurgeDatabaseTaskTemplate);
			this.$('#nstasks-specifictask').html(template);
			this.$('#tasksolderthandays').spinner({
				step: 15,
				page: 15,
				numberFormat: "n",
				min: 0,
				value: this.$('#tasksolderthandays').prop('value'),
				change: function() {
					var value = $(this).spinner('value');
					if (typeof value !== "number") {
						$(this).spinner('value', 90);
					}
				}
			});
			this.$('#configsbiggerthan').spinner({
				step: 100,
				page: 100,
				numberFormat: "n",
				min: 0,
				value: this.$('#configsbiggerthan').prop('value'),
				change: function() {
					var value = $(this).spinner('value');
					if (typeof value !== "number") {
						$(this).spinner('value', 500);
					}
				}
			});
			this.$('#configsolderthandays').spinner({
				step: 10,
				page: 50,
				numberFormat: "n",
				min: 0,
				value: this.$('#configsolderthandays').prop('value'),
				change: function() {
					var value = $(this).spinner('value');
					if (typeof value !== "number") {
						$(this).spinner('value', 200);
					}
				}
			});
			this.$('#configskeepeverydays').spinner({
				step: 1,
				page: 5,
				numberFormat: "n",
				min: 1,
				value: this.$('#configskeepeverydays').prop('value'),
				change: function() {
					var value = $(this).spinner('value');
					if (typeof value !== "number") {
						$(this).spinner('value', 7);
					}
				}
			});
			this.$('#configsdelete').closest('fieldset').find('.ui-spinner').on('click', function() {
				return false;
			});
			this.$('#configsfiltersize,#configskeep').on('click', function() {
				if ($(this).closest('div').is('.ui-state-disabled')) {
					return false;
				}
				$(this).closest('div').find('input.spinner').spinner($(this).prop('checked') ? 'enable' : 'disable');
			});
			this.$('#configsdelete').on('click', function() {
				var fs = $(this).closest('fieldset');
				if ($(this).prop('checked')) {
					fs.find('#configsolderthandays').spinner('enable');
					fs.find('#configsfiltersize,#configskeep').closest('div').removeClass("ui-state-disabled");
				}
				else {
					fs.find('#configsfiltersize,#configskeep').prop('checked', false).trigger('click');
					fs.find('#configsolderthandays').spinner('disable');
					fs.find('#configsfiltersize,#configskeep').closest('div').addClass("ui-state-disabled");
				}
			}).prop('checked', true).trigger('click');
			this.getTaskData = function() {
				var data = {
					daysToPurge: that.$('#tasksolderthandays').spinner('value')
				};
				if (that.$('#configsdelete').prop('checked')) {
					data.configDaysToPurge = that.$('#configsolderthandays').spinner('value');
					if (that.$('#configsfiltersize').prop('checked')) {
						data.configSizeToPurge = that.$('#configsbiggerthan').spinner('value');
					}
					if (that.$('#configskeep').prop('checked')) {
						data.configKeepDays = that.$('#configskeepeverydays').spinner('value');
					}
				}
				return data;
			};
			this.renderScheduler();
		},

		renderScheduler: function() {
			this.taskSchedulerToolbox = new TaskSchedulerToolbox();
		}

	});
});
