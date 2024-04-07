/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/rules",

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'id',
				'name',
				'enabled',
				'policy',
				'script',
				'exemptions',
				'driver',
				'field',
				'regExp',
				'context',
				'text',
				'type',
				'invert',
				'matchAll',
				'anyBlock',
				'normalize',
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		},

	});

});
