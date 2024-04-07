/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/softwarerules",

		defaults: {
			family: "",
			version: "",
			group: -1,
			driver: "",
			partNumber: "",
			level: "GOLD"
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'id',
				'family',
				'familyRegExp',
				'group',
				'version',
				'versionRegExp',
				'partNumber',
				'partNumberRegExp',
				'driver',
				'level'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		}

	});

});
