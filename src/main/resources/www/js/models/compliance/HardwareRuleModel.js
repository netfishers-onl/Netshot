/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/hardwarerules",

		defaults: {
			family: "",
			partNumber: "",
			group: -1,
			driver: "",
			endOfLife: null,
			endOfSale: null
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'id',
				'family',
				'familyRegExp',
				'group',
				'partNumber',
				'partNumberRegExp',
				'endOfLife',
				'driver',
				'endOfSale'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		}

	});

});
