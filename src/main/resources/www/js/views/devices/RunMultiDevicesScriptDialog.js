/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'models/task/TaskModel',
	'text!templates/devices/runMultiDevicesScript.html',
	'models/device/ScriptModel',
	'models/device/ScriptCollection'
], function($, _, Backbone, Dialog, DeviceModel, TaskModel, runMultiDevicesScriptTemplate,
		ScriptModel, ScriptCollection) {

	var RunMultiDeviceScriptDialog = Dialog.extend({

		template: _.template(runMultiDevicesScriptTemplate),

		dialogOptions: {
			title: "Run script on multiple devices",
			width: 600,
			height: 500,
			resizable: true,
			resizeStop: function(e, ui) {
				RunMultiDeviceScriptDialog.prototype.dialogOptions.width = ui.size.width;
				RunMultiDeviceScriptDialog.prototype.dialogOptions.height = ui.size.height;
			}
		},
		
		templateData: function() {
			return {
				number: this.options.devices.length
			};
		},
		
		initialize: function(options) {
			var that = this;
			this.deviceTypes = options.deviceTypes;
			this.render();
		},
		
		
		onCreate: function() {
			var that = this;
			_.each(this.deviceTypes.models, function(deviceType) {
				$('<option />').attr('value', deviceType.get('name')).text(deviceType
						.get('description')).appendTo(that.$('#devicetype'));
			});

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
			this.$('.nstask-schedulelink a').on("click", function() {
				that.$('#scripttools').trigger("click");
			});

			this.$("#scriptsaving").button({
				icons: {
					primary: "ui-icon-arrowthick-1-w"
				},
				text: false
			}).on("click", function() {
				if ($(this).is(":checked")) {
					that.$("#scriptloading").prop("checked", false).button("refresh");
					that.$("#loadtools").removeClass("expanded");
					that.$("#savetools").addClass("expanded");
					that.$("#savetools input.text").select();
				}
				else {
					that.$("#savetools").removeClass("expanded");
				}
			});
			this.$("#savetools input.text").on("keyup", function() {
				if ($(this).val().length > 0) {
					that.$("#scriptsave").button("enable");
				} else {
					that.$("#scriptsave").button("disable");
				}
			});
			this.$("#scriptloading").button({
				icons: {
					primary: "ui-icon-arrowthick-1-e"
				},
				text: false
			}).on("click", function() {
				if ($(this).is(":checked")) {
					that.refreshScripts();
					that.$("#scriptsaving").prop("checked", false).button("refresh");
					that.$("#savetools").removeClass("expanded");
					that.$("#loadtools").addClass("expanded");
				}
				else {
					that.$("#loadtools").removeClass("expanded");
				}
			});
			this.$("#scriptload").button({
				icons: {
					primary: "ui-icon-folder-open"
				},
				text: false,
				disabled: true
			}).on("click", function() {
				var id = that.$("#loadtools select").val();
				var script = new ScriptModel({
					id: id
				});
				that.$("#error").hide();
				that.$("#info").hide();
				script.fetch().done(function(data) {
					that.$("#infomsg").text("The script template has been loaded.");
					that.$("#info").show();
					that.scriptEditor.setValue(script.get("script"));
					that.$("#scriptloading").prop("checked", false).button("refresh");
					that.$("#loadtools").removeClass("expanded");
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
				return false;
				
			});
			this.$("#scriptdelete").button({
				icons: {
					primary: "ui-icon-trash"
				},
				text: false,
				disabled: true
			}).on("click", function() {
				var id = that.$("#loadtools select").val();
				var script = that.scripts.get(id);
				that.$("#error").hide();
				that.$("#info").hide();
				script.destroy().done(function(data) {
					that.$("#infomsg").text("The script template has been deleted.");
					that.$("#info").show();
					that.refreshScripts();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
				return false;
				
			});
			this.$("#scriptsave").button({
				icons: {
					primary: "ui-icon-disk"
				},
				text: false,
				disabled: true
			}).on("click", function(event) {
				that.$("#error").hide();
				that.$("#info").hide();
				var $button = $(event.target).closest("button");
				var script = new ScriptModel({
					name: that.$("#savetools input.text").val(),
					script: that.scriptEditor.getValue(),
					deviceDriver: that.$("#devicetype").val()
				});
				script.save().done(function(data) {
					that.$("#infomsg").text("Script successfully saved as a template.");
					that.$("#info").show();
					that.$("#scriptsaving").prop("checked", false).button("refresh");
					that.$("#savetools").removeClass("expanded");
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
				return false;
			});
			that.$("#loadtools select").on("change", function() {
				var id = $(this).val();
				var script = that.scripts.get(id);
				if (script) {
					that.$("#loadtools #name").text(script.get("name"));
					that.$("#loadtools #author").text(script.get("author"));
					that.$("#scriptload").button("enable");
					that.$("#scriptdelete").button("enable");
				}
			});
			that.$('#devicetype').on("change", function() {
				that.refreshScripts();
			});
			
		},
		
		refreshScripts: function() {
			var that = this;
			this.scripts = new ScriptCollection([]);
			var $select = that.$("#loadtools select");
			that.$("#loadtools td").text("");
			that.$("#scriptload").button("disable");
			that.$("#scriptdelete").button("disable");
			$select.empty();
			this.scripts.fetch().done(function() {
				_.each(that.scripts.where({ deviceDriver: that.$("#devicetype").val() }), function(script) {
					$("<option/>").attr('value', script.get("id")).text(script.get("name"))
						.appendTo($select);
				});
				that.$("#loadtools select").trigger("change");
			});
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
						type: "RunDeviceScriptTask",
						device: device.get('id'),
						script: that.scriptEditor.getValue(),
						driver: that.$("#devicetype").val(),
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
			},
		}

	});
	return RunMultiDeviceScriptDialog;
});
