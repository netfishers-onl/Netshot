define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var DomainModel = Backbone.Model.extend({

		urlRoot: "rs/domains",

		defaults: {
			name: "Domain Name",
			description: "Description",
			ipAddress: "0.0.0.0"
		}

	});

	return DomainModel;

});
