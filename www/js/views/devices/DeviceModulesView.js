define([
	'jquery',
	'underscore',
	'backbone',
	'models/device/DeviceModuleCollection',
	'text!templates/devices/deviceModules.html',
	'text!templates/devices/deviceModule.html'
], function($, _, Backbone, DeviceModuleCollection, deviceModulesTemplate,
		deviceModuleTemplate) {

	var DeviceModulesView = Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceModulesTemplate),
		moduleTemplate: _.template(deviceModuleTemplate),

		initialize: function(options) {
			this.device = options.device;
			this.deviceModules = new DeviceModuleCollection({}, {
				'device': this.device
			});
			var that = this;
			this.deviceModules.fetch().done(function() {
				that.render();
			});
		},

		render: function() {
			var that = this;

			this.$el.html(this.template());
			var $table = this.$("#modules tbody");
			this.deviceModules.each(function(deviceModule) {
				$(that.moduleTemplate(deviceModule.toJSON())).appendTo($table);
			});

			return this;
		},

		destroy: function() {
			this.$el.empty();
		}

	});
	return DeviceModulesView;
});
