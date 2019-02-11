/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'tablesort',
	'models/device/DeviceComplianceResultCollection',
	'views/devices/CheckDeviceComplianceDialog',
	'text!templates/devices/deviceCompliance.html',
	'text!templates/devices/deviceRule.html'
], function($, _, Backbone, TableSort, DeviceComplianceResultCollection, CheckDeviceComplianceDialog,
		deviceComplianceTemplate, deviceRuleTemplate) {

	return Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceComplianceTemplate),
		ruleTemplate: _.template(deviceRuleTemplate),

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
			var $table = this.$("#rules tbody");
			_.each(this.deviceRules.models, function(deviceRule) {
				$(that.ruleTemplate(deviceRule.toJSON())).appendTo($table);
			});
			new TableSort(this.$("#rules").get(0));
			
			if (!user.isReadWrite()) {
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

			return this;
		},

		destroy: function() {
			this.$el.empty();
		}

	});
});
