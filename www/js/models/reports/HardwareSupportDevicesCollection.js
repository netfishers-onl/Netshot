define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var HardwareSupportDevicesCollection = Backbone.Collection.extend({

		initialize: function(models, options) {
			this.type = options.type;
			this.eoxDate = options.eoxDate;
		},

		url: function() {
			return "rs/reports/hardwaresupportdevices/" + this.type + "/" + this.eoxDate;
		}

	});

	return HardwareSupportDevicesCollection;

});