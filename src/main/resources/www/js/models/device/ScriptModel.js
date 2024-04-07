/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/scripts",

		initialize: function(models, options) {
			options = options || {};
			this.validateOnly = options.validateOnly;
		},

		urlRoot: function() {
			var u =  "api/scripts";
			if (this.validateOnly) {
				u += "?validateonly=true"
			}
			return u;
		},
		


	});

});
