/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	'models/diagnostic/DiagnosticModel'
	], function(_, Backbone, DiagnosticModel) {

	return Backbone.Collection.extend({

		model: DiagnosticModel,

		initialize: function(models, options) {
			this.device = options.device;
		},

		url: function() {
			return "api/devices/" + this.device.get('id') + "/diagnosticresults";
		},

		comparator: function(config) {
			return config.get('name');
		}

	});

});
