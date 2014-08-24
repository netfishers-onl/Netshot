define([
	'jquery',
	'underscore',
	'backbone',
	'models/device/DeviceInterfaceCollection',
	'text!templates/devices/deviceInterfaces.html',
	'text!templates/devices/deviceInterface.html'
], function($, _, Backbone, DeviceInterfaceCollection,
		deviceInterfacesTemplate, deviceInterfaceTemplate) {

	var DeviceInterfacesView = Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceInterfacesTemplate),
		interfaceTemplate: _.template(deviceInterfaceTemplate),

		initialize: function(options) {
			this.device = options.device;
			this.deviceInterfaces = new DeviceInterfaceCollection({}, {
				'device': this.device
			});
			var that = this;
			this.deviceInterfaces.fetch().done(function() {
				that.render();
			});
		},

		render: function() {
			var that = this;

			this.$el.html(this.template());
			var $table = this.$("#interfaces tbody");
			_.each(this.deviceInterfaces.models, function(deviceInterface) {
				$(that.interfaceTemplate(deviceInterface.toJSON())).appendTo($table);
			});

			return this;
		},

		destroy: function() {

			this.$el.empty();
		}

	});
	return DeviceInterfacesView;
});
