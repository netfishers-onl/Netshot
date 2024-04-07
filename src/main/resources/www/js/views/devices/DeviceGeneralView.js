/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/devices/deviceGeneral.html'
], function($, _, Backbone, deviceGeneralTemplate) {

	return Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceGeneralTemplate),

		initialize: function(options) {
			this.device = options.device;
			this.deviceTypes = options.deviceTypes;
			this.deviceType = this.deviceTypes.findWhere({
				name: this.device.get("driver")
			});
			this.render();
		},

		render: function() {
			var that = this;
			var fullAttributes = [];
			var data = this.device.toJSON();
			if (typeof this.deviceType == "object" && this.deviceType && data.attributes instanceof Array) {
				var definitions = _.where(this.deviceType.get("attributes"), { level: "DEVICE" });
				var attributes = _.indexBy(data.attributes, "name");
				for (var d in definitions) {
					var name = definitions[d].name;
					var attribute = attributes[name];
					if (typeof attribute !== "object" || !attribute) { attribute = {}; }
					fullAttributes.push(_.extend({}, definitions[d], attribute));
				}
			}
			data.attributes = fullAttributes;
			data.connectUri = this.device.getConnectUri();
			this.$el.html(this.template(data));

			return this;
		},

		destroy: function() {

			this.$el.empty();
		}

	});
});
