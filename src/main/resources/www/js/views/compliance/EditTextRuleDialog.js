/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceTypeCollection',
	'models/diagnostic/DiagnosticCollection',
	'text!templates/compliance/editTextRule.html',
	'views/devices/SelectDeviceDialog',
	'models/compliance/RuleTestModel',
	'text!templates/compliance/ruleResultInfo.html',
	'views/compliance/RuleTestLogsDialog'
], function($, _, Backbone, Dialog, DeviceTypeCollection, DiagnosticCollection,
		editTextRuleTemplate, SelectDeviceDialog, RuleTestModel, ruleResultInfoTemplate,
		RuleTestLogsDialog) {

	var EditTextRuleDialog = Dialog.extend({

		template: _.template(editTextRuleTemplate),
		ruleResultInfoTemplate: _.template(ruleResultInfoTemplate),
		testDevice: null,

		dialogOptions: {
			title: "Edit text rule",
			width: 600,
			height: 630,
			minWidth: 600,
			minHeight: 530,
			resizable: true
		},
		
		deviceTypes: new DeviceTypeCollection([]),
		diagnostics: new DiagnosticCollection([]),

		initialize: function(options) {
			var that = this;
			$.when(this.deviceTypes.fetch(), this.diagnostics.fetch()).done(function() {
				that.render();
			});
		},
		
		defaultAttributes: [ {
			level: "DEVICE",
			name: "contact",
			title: "Contact",
			type: "TEXT",
			checkable: true
		}, {
			level: "DEVICE",
			name: "location",
			title: "Location",
			type: "TEXT",
			checkable: true
		}, {
			level: "DEVICE",
			name: "name",
			title: "Name",
			type: "TEXT",
			checkable: true
		} ],

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Save": function(event) {
				var that = this;
				that.$("#error").hide();
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var rule = that.model.clone();
				that.model.save({
					driver: that.$("#devicetype").val(),
					field: that.$("#fieldname").val(),
					regExp: that.$("#regexp").is(":checked"),
					context: that.$("#context").val(),
					text: that.$("#text").val(),
					enabled: rule.get('enabled'),
					invert: that.$("#invert").is(":checked"),
					matchAll: that.$("#matchall").is(":checked"),
					anyBlock: that.$("#anyblock").is(":checked"),
					normalize: that.$("#normalize").is(":checked"),
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
		},
		
		setTestDevice: function(device) {
			if (typeof device == "undefined") return;
			this.$("#ruledevice").val(device.get('name')).data('device-id', device.get('id'));
			this.$("#ruletest").button('enable');
			this.device = device;
			EditTextRuleDialog.testDevice = device;
		},

		getAttributes: function(driver) {
			var that = this;
			var attributes = this.defaultAttributes;
			if (typeof driver === "object" && driver) {
				attributes = _.union(attributes, driver.get("attributes"));
			}
			attributes = _.sortBy(attributes, "title");
			attributes = _.union(attributes, that.diagnostics.map(function(diagnostic) {
				return {
					level: "DEVICE",
					title: 'Diagnostic "' + diagnostic.get("name") + '"',
					name: diagnostic.get("name"),
					type: diagnostic.get("resultType"),
					checkable: true
				};
			}));
			return attributes;
		},

		onCreate: function() {
			var that = this;

			$('<option />').attr('value', "").text("[Any]").appendTo(this.$('#devicetype'));
			this.deviceTypes.each(function(deviceType) {
				$('<option />').attr('value', deviceType.get('name')).text(deviceType
						.get('description')).appendTo(that.$('#devicetype'));
			});
			this.$('#devicetype').change(function() {
				that.$('#fieldname').empty();
				that.driver = that.deviceTypes.findWhere({ name: $(this).val() });
				var attributes = that.getAttributes(that.driver);
				for (var a in attributes) {
					var attribute = attributes[a];
					if (!attribute.checkable) continue;
					var o = $('<option />').attr('value', attribute.name)
							.text(attribute.title);
					o.appendTo(that.$('#fieldname'));
				}
				that.$('#fieldname').change();
			}).val(that.model.get("deviceDriver")).change();
			this.$('#fieldname').val(that.model.get("field"));
			this.$('#text').val(that.model.get("text"));
			this.$('#context').val(that.model.get("context"));
			this.$('#regexp').prop("checked", that.model.get("regExp"));
			this.$('#dontinvert').prop("checked", !that.model.get("invert"));
			this.$('#invert').prop("checked", that.model.get("invert"));
			this.$('#matchall').prop("checked", that.model.get("matchAll"));
			this.$('#anyblock').prop("checked", that.model.get("anyBlock"));
			this.$('#normalize').prop("checked", that.model.get("normalize"));

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
					driver: that.$("#devicetype").val(),
					field: that.$("#fieldname").val(),
					regExp: that.$("#regexp").is(":checked"),
					context: that.$("#context").val(),
					text: that.$("#text").val(),
					invert: that.$("#invert").is(":checked"),
					matchAll: that.$("#matchall").is(":checked"),
					anyBlock: that.$("#anyblock").is(":checked"),
					normalize: that.$("#normalize").is(":checked"),
					type: "TextRule"
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
			
			this.setTestDevice(EditTextRuleDialog.testDevice);

		},

		onClose: function() {
		}

	});
	return EditTextRuleDialog;
});
