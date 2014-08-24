define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/devices/deviceGeneral.html'
], function($, _, Backbone, deviceGeneralTemplate) {

	var DeviceGeneralView = Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceGeneralTemplate),

		initialize: function(options) {
			this.device = options.device;
			this.render();
		},

		render: function() {
			var that = this;
			this.$el.html(this.template(this.device.toJSON()));

			return this;
		},

		destroy: function() {

			this.$el.empty();
		}

	});
	return DeviceGeneralView;
});
