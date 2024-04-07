/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'tablesort',
	'models/device/DeviceComplianceResultCollection',
	'views/devices/CheckDeviceComplianceDialog',
	'text!templates/devices/deviceCompliance.html',
	'text!templates/devices/deviceRule.html',
	'text!templates/devices/noComplianceRule.html',
], function($, _, Backbone, TableSort, DeviceComplianceResultCollection, CheckDeviceComplianceDialog,
		deviceComplianceTemplate, deviceRuleTemplate, noComplianceRuleTemplate) {

	var displayFullRules = false;

	return Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceComplianceTemplate),
		ruleTemplate: _.template(deviceRuleTemplate),
		noRuleTemplate: _.template(noComplianceRuleTemplate),

		initialize: function(options) {
			this.device = options.device;
			this.deviceRules = new DeviceComplianceResultCollection([], {
				'device': this.device
			});
			var that = this;
			this.deviceRules.fetch().done(function() {
				that.render();
			});
		},

		render: function() {
			var that = this;

			this.$el.html(this.template(this.device.toJSON()));
			new TableSort(this.$("#rules").get(0));
			
			if (!user.isOperator()) {
				this.$("#checkcompliance").remove();
			}
			
			this.$("#checkcompliance").button({
				icons: {
					primary: "ui-icon-circle-check"
				}
			}).click(function() {
				var checkDeviceComplianceDialog = new CheckDeviceComplianceDialog({
					model: that.device
				});
			});

			if (this.deviceRules.length === 0) {
				this.$("#rules tbody").html(this.noRuleTemplate());
				this.$("#rules tfoot").remove();
			}
			else {
				this.$("#filtervalidrules").click(function() {
					displayFullRules = !$(this).is(":checked");
					that.renderRules();
				}).click();
			}

			return this;
		},

		renderRules: function() {
			var that = this;
			var $table = this.$("#rules tbody");
			$table.empty();
			_.each(this.deviceRules.models, function(deviceRule) {
				if (displayFullRules || deviceRule.get('result') === "NONCONFORMING") {
					$(that.ruleTemplate(deviceRule.toJSON())).appendTo($table);
				}
			});
		},

		destroy: function() {
			this.$el.empty();
		},

	});
});
