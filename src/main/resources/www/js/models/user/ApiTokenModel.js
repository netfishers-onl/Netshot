/** Copyright 2013-2020 NetFishers */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/apitokens",

		defaults: {
			description: "",
			token: "",
			level: 500,
		},
		
		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				"level",
				"description",
				"id",
				"token"
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		},

	});

});
