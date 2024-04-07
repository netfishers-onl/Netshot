/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.type = options.type;
			this.eoxDate = options.eoxDate;
		},

		url: function() {
			return "api/reports/hardwaresupportdevices/" + this.type.toLowerCase() + "/" + this.eoxDate;
		}

	});

});