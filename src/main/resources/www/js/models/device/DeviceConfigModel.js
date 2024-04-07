/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/configs",

		defaults: {
			'creationDate': 0
		},

		getItemUrl: function(item) {
			return this.urlRoot + "/" + this.get('id') + "/" + item;
		}

	});

});
