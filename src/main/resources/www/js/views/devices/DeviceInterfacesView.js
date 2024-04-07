/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'tablesort',
	'models/device/DeviceInterfaceCollection',
	'text!templates/devices/deviceInterfaces.html',
	'text!templates/devices/deviceInterface.html'
], function($, _, Backbone, TableSort, DeviceInterfaceCollection,
		deviceInterfacesTemplate, deviceInterfaceTemplate) {

	TableSort.extend('interface', function(item) {
		return !!item.match(/^[A-Za-z]+[0-9\/]+$/);
	}, function(a, b) {
		var r = function(s) {
			return s.replace(/[0-9]+/g, function(n) { return ("000000" + n).slice(-5); });
		}
		return r(a).localeCompare(r(b));
	});

	return Backbone.View.extend({

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
			new TableSort(this.$("#interfaces").get(0));

			return this;
		},

		destroy: function() {

			this.$el.empty();
		}

	});
});
