/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	'models/diagnostic/DiagnosticModel'
], function(_, Backbone, DiagnosticModel) {

	return Backbone.Collection.extend({

		model: DiagnosticModel,

		url: function() {
			return "api/diagnostics";
		},

		comparator: function(config) {
			return config.get('name');
		}

	});

});
