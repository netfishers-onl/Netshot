/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'ace/ace',
	'text!templates/compliance/editRuleScript.html',
	'views/devices/SelectDeviceDialog',
	'models/compliance/RuleTestModel',
	'text!templates/compliance/ruleResultInfo.html',
	'views/compliance/RuleTestLogsDialog'
], function($, _, Backbone, Dialog, ace, editRuleScriptTemplate,
		SelectDeviceDialog, RuleTestModel, ruleResultInfoTemplate,
		RuleTestLogsDialog) {

	var EditRuleScriptDialog = Dialog.extend({

		template: _.template(editRuleScriptTemplate),
		ruleResultInfoTemplate: _.template(ruleResultInfoTemplate),
		testDevice: null,

		dialogOptions: {
			title: "Edit rule script",
			width: 800,
			height: 600,
			minWidth: 600,
			minHeight: 500,
			resizable: true,
			resizeStop: function(e, ui) {
				EditRuleScriptDialog.prototype.dialogOptions.width = ui.size.width;
				EditRuleScriptDialog.prototype.dialogOptions.height = ui.size.height;
			}
		},

		initialize: function(options) {
			var that = this;
			that.render();
		},

		buttons: {
			"Save": function(event) {
				var that = this;
				that.$("#error").hide();
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var rule = that.model.clone();
				rule.save({
					script: that.scriptEditor.getValue(),
					enabled: rule.get('enabled')
				}).done(function(data) {
					that.close();
					that.model.set(data);
					that.options.onEdited();
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
		
		setTestDevice: function(device) {
			if (typeof device == "undefined") return;
			this.$("#ruledevice").val(device.get('name')).data('device-id', device.get('id'));
			this.$("#ruletest").button('enable');
			this.device = device;
			EditRuleScriptDialog.testDevice = device;
		},

		onCreate: function() {
			var that = this;

			this.scriptEditor = ace.edit('nscompliance-editrule-script');
			if (that.model.get("type").match(/JavaScriptRule/)) {
				this.scriptEditor.getSession().setMode("ace/mode/javascript");
			}
			else if (that.model.get("type").match(/PythonRule/)) {
				this.scriptEditor.getSession().setMode("ace/mode/python");
			}
			this.scriptEditor.setValue(that.model.get("script"));
			this.scriptEditor.gotoLine(1);
			this.$el.on('dialogresizestop', function(even, ui) {
				that.scriptEditor.resize();
			});

			this.$("#ruledevice").click(function() {
				var selectDeviceDialog = new SelectDeviceDialog({
					onSelected: function(device) {
						that.setTestDevice(device);
					}
				});
			});

			this.$("#ruletest").button({
				icons: {
					primary: "ui-icon-play"
				},
				disabled: true
			}).click(function(event) {
				var $button = $(event.target).closest("button");
				$button.button('disable');
				that.$el.removeClass("witherror").removeClass("withinfo");
				var test = new RuleTestModel({
					device: that.device.get('id'),
					script: that.scriptEditor.getValue(),
					type: that.model.get('type')
				});
				test.save().done(function(data) {
					$button.button('enable');
					var result = new RuleTestModel(data);
					that.$("#info").html(that.ruleResultInfoTemplate(result.toJSON()))
							.show();
					that.$("#nscompliance-ruleresult").click(function() {
						var logDialog = new RuleTestLogsDialog({
							model: result
						});
						return false;
					});
					that.$el.addClass("withinfo");
				}).fail(function(data) {
					that.$("#info").hide();
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$el.removeClass("withinfo").addClass("witherror");
					$button.button('enable');
				});
				return false;
			});
			
			this.setTestDevice(EditRuleScriptDialog.testDevice);

		},

		onClose: function() {
			this.$el.off('dialogresizestop');
			if (this.scriptEditor) {
				this.scriptEditor.destroy();
			}
		}

	});
	return EditRuleScriptDialog;
});
