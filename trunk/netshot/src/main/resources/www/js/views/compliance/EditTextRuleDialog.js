/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceTypeCollection',
	'text!templates/compliance/editTextRule.html',
	'views/devices/SelectDeviceDialog',
	'models/compliance/RuleTestModel',
	'text!templates/compliance/ruleResultInfo.html',
	'views/compliance/RuleTestLogsDialog'
], function($, _, Backbone, Dialog, DeviceTypeCollection, editTextRuleTemplate,
		SelectDeviceDialog, RuleTestModel, ruleResultInfoTemplate,
		RuleTestLogsDialog) {

	var EditTextRuleDialog = Dialog.extend({

		template: _.template(editTextRuleTemplate),
		ruleResultInfoTemplate: _.template(ruleResultInfoTemplate),
		testDevice: null,

		dialogOptions: {
			title: "Edit text rule",
			width: 600,
			height: 520
		},
		
		deviceTypes: new DeviceTypeCollection([]),

		initialize: function(options) {
			var that = this;
			this.deviceTypes.fetch().done(function() {
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
					anyBlock: that.$("#anyblock").is(":checked")
				}).done(function(data) {
					that.close();
					that.model.set(data);
					that.options.onEdited();
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
		
		setTestDevice: function(device) {
			if (typeof(device) == "undefined") return;
			this.$("#ruledevice").val(device.get('name')).data('device-id', device.get('id'));
			this.$("#ruletest").button('enable');
			this.device = device;
			EditTextRuleDialog.testDevice = device;
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
				var attributes = that.defaultAttributes;
				that.driver = that.deviceTypes.findWhere({ name: $(this).val() });
				if (typeof(that.driver) == "object") {
					attributes = _.union(attributes, that.driver.get("attributes"));
				}
				attributes = _.sortBy(attributes, "title");
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
					type: ".TextRule"
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
					var error = $.parseJSON(data.responseText);
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
