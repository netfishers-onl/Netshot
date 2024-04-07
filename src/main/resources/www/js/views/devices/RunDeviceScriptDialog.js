/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'ace/ace',
	'text!templates/devices/runDeviceScript.html',
	'text!templates/devices/runDeviceScriptUserStringInputRow.html',
	'views/tasks/TaskSchedulerToolbox',
	'views/tasks/MonitorTaskDialog',
	'views/devices/SaveDeviceScriptDialog',
	'views/devices/LoadDeviceScriptDialog',
	'models/task/TaskModel',
	'models/device/ScriptModel',
	'models/device/ScriptCollection'
], function($, _, Backbone, Dialog, ace, runScriptTemplate, runDeviceScriptUserStringInputRowTemplate, TaskSchedulerToolbox,
		MonitorTaskDialog, SaveDeviceScriptDialog, LoadDeviceScriptDialog, TaskModel, ScriptModel, ScriptCollection) {

	var RunDeviceScriptDialog = Dialog.extend({

		template: _.template(runScriptTemplate),
		userStringInputRowTemplate: _.template(runDeviceScriptUserStringInputRowTemplate),

		dialogOptions: {
			title: "Run script",
			minWidth: 600,
			minHeight: 400,
			width: 800,
			height: 600,
			resizable: true,
			resizeStop: function(e, ui) {
				RunDeviceScriptDialog.prototype.dialogOptions.width = ui.size.width;
				RunDeviceScriptDialog.prototype.dialogOptions.height = ui.size.height;
			}
		},

		initialize: function(options) {
			var that = this;
			if (options.device) {
				// Single device
				this.device = options.device;
				this.deviceDriver = this.device.get("driver");
			}
			else {
				// Multi devices
				this.devices = [];
				this.deviceDriver = null;
				// If all devices are of the same type (driver), use this value automatically
				_.each(options.devices, function(device) {
					that.devices.push(device);
					var driver = device.get("driver");
					if (that.deviceDriver) {
						if (driver !== that.deviceDriver) {
							that.deviceDriver = null;
						}
					}
					else {
						that.deviceDriver = driver;
					}
				});
			}
			this.deviceTypes = options.deviceTypes;
			that.render();
		},
		
		templateData: function() {
			var firstDeviceNames = null;
			if (this.devices) {
				firstDeviceNames = _.map(this.devices.slice(0, 3), function(device) {
					return device.get("name");
				});
			}
			return {
				device: this.device ? this.device.toJSON() : null,
				firstDeviceNames,
				deviceCount: this.devices ? this.devices.length : 1,
			};
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"< Previous": function() {
				var that = this;
				this.dialogButtons().eq(1).button('disable');
				this.dialogButtons().eq(2).button('enable');
				this.dialogButtons().eq(2).show();
				this.dialogButtons().eq(3).hide();
				this.$('.nsdialog-page1').show();
				this.$('.nsdialog-page2').hide();
				this.$('#nstasks-specifictask').html("");
			},
			"Next >": function() {
				var that = this;
				that.$("#error").hide();
				that.$("#info").hide();
				this.dialogButtons().eq(2).button('disable');
				this.scriptContent = this.scriptEditor.getValue();
				var script = new ScriptModel({
					name: "#",
					script: this.scriptContent,
					deviceDriver: this.deviceDriver,
				}, {
					validateOnly: true,
				});
				script.save().done(function(data) {
					that.renderUserInputs(data.userInputDefinitions);
					that.dialogButtons().eq(1).button('enable');
					that.dialogButtons().eq(2).hide();
					that.dialogButtons().eq(3).show();
					that.$('.nsdialog-page1').hide();
					that.$('.nsdialog-page2').show();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					that.dialogButtons().eq(2).button('enable');
				});
			},
			"Finish": function(event) {
				var that = this;
				that.$("#error").hide();
				that.$("#info").hide();
				var $cancelButton = that.dialogButtons().eq(0);
				var $previousButton = that.dialogButtons().eq(1);
				var $finishButton = that.dialogButtons().eq(3);
				$cancelButton.button('disable');
				$previousButton.button('disable');
				$finishButton.button('disable');
				that.$('#bar').css('width', '0%');
				that.$el.on('dialogbeforeclose', function() {
					return false;
				});
				if (this.devices) {
					that.$('#status').show();
				}
				var userInputs = {};
				this.$("#userinputs .userinputrow").each(function() {
					var inputName = $(this).data("input-name");
					var inputValue = $(this).find("input.userstringinput").val();
					userInputs[inputName] = inputValue;
				});

				var devices = [];
				if (this.device) {
					devices = [this.device];
				}
				else {
					_.each(this.devices, function(device) {
						devices.push(device);
					});
				}
				var total = devices.length;

				var startNext = function(lastTaskId) {
					if (devices.length === 0) {
						that.$el.off('dialogbeforeclose');
						that.close();
						if (typeof that.options.onScheduled === "function") {
							that.options.onScheduled();
						}
						else if (lastTaskId !== undefined) {
							var monitorTaskDialog = new MonitorTaskDialog({
								taskId: lastTaskId,
								delay: 1200
							});
						}
						return;
					}
					var device = devices.pop();
					var task = new TaskModel({
						type: "RunDeviceScriptTask",
						device: device.get('id'),
						script: that.scriptEditor.getValue(),
						driver: that.deviceDriver,
					});
					if (Object.keys(userInputs).length > 0) {
						task.set({ userInputs });
					}
					task.set(that.taskSchedulerToolbox.getSchedule());
					task.save().done(function(data) {
						that.$('#bar').css('width', (100 * (1 - devices.length / total)) + '%');
						startNext(data.id);
					}).fail(function(data) {
						var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
						that.$("#errormsg").text("Error while processing " + device.get('name') + ": " + error.errorMsg);
						that.$("#error").show();
						$cancelButton.button('enable');
						$previousButton.button('enable');
						$finishButton.button('enable');
						that.$el.off('dialogbeforeclose');
					});
				};
				startNext();
			},
		},

		setDeviceDriver: function(type) {
			if (type) {
				this.deviceDriver = type;
			}
			else {
				this.deviceDriver = this.deviceTypes.at(0).get("name");
			}
			this.$('#devicetype').val(this.deviceDriver);
		},

		onCreate: function() {
			var that = this;
			this.dialogButtons().eq(1).button('disable');
			this.dialogButtons().eq(3).hide();

			_.each(this.deviceTypes.models, function(deviceType) {
				$('<option />').attr('value', deviceType.get('name')).text(deviceType
						.get('description')).appendTo(that.$('#devicetype'));
			});
			this.$('#devicetype').change(function() {
				that.deviceDriver = $(this).val();
			});
			this.setDeviceDriver(this.deviceDriver);
			
			this.taskSchedulerToolbox = new TaskSchedulerToolbox();

			this.$("#script").text(
				'function run(cli, device) {\n' +
				'	// This is an example for Cisco IOS driver\n' +
				'	cli.macro("configure");\n' +
				'	cli.command("no ip domain-lookup");\n' +
				'	cli.macro("end");\n' +
				'	cli.macro("save");\n' +
				'}\n'
			);
			this.scriptEditor = ace.edit('script');
			this.scriptEditor.getSession().setMode("ace/mode/javascript");
			this.scriptEditor.gotoLine(1);
			this.$el.on('dialogresizestop', function(even, ui) {
				that.scriptEditor.resize();
			});	
			this.$('#scripttools').click(function() {
				that.$('#editorfield').css("bottom", (that.$('#scripttools').height() + 11) + "px");
				that.scriptEditor.resize();
			});

			this.$("#loadscript").button({
				icons: {
					primary: "ui-icon-folder-open",
				}
			}).on("click", function() {
				new LoadDeviceScriptDialog({
					onLoad: function(script) {
						that.setDeviceDriver(script.get("deviceDriver"));
						that.scriptEditor.setValue(script.get("script"));
						that.scriptEditor.gotoLine(1);
					}
				});
				return false;
			});

			this.$("#savescript").button({
				icons: {
					primary: "ui-icon-disk",
				}
			}).on("click", function() {
				new SaveDeviceScriptDialog({
					script: that.scriptEditor.getValue(),
					driver: that.deviceDriver,
					deviceTypes: that.deviceTypes,
					onSaved: function() {
						that.$("#infomsg").text("Script successfully saved for later usage.");
						that.$("#info").show();
					},
				});
				return false;
			});

			this.$('.nstask-schedulelink a').on("click", function() {
				that.$('#scripttools').trigger("click");
			});
		},

		renderUserInputs: function(userInputDefinitions) {
			var that = this;
			var $inputFieldset = this.$("#userinputs");
			var $inputTbody = this.$("#userinputs table>tbody");
			$inputTbody.empty();
			if (userInputDefinitions && Object.keys(userInputDefinitions).length > 0) {
				_.each(userInputDefinitions, function(definition) {
					if (definition.type === "STRING") {
						$inputTbody.append(that.userStringInputRowTemplate(definition));
					}
				});
				$inputFieldset.show();
			}
			else {
				$inputFieldset.hide();
			}
		},

		onClose: function() {
			this.$el.off('dialogresizestop');
			if (this.scriptEditor) {
				this.scriptEditor.destroy();
			}
		}

	});
	return RunDeviceScriptDialog;
});
