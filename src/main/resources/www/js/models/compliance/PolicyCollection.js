/** Copyright 2013-2025 Netshot */
define([
	'underscore',
	'backbone',
	'models/compliance/PolicyModel'
], function(_, Backbone, PolicyModel) {

	return Backbone.Collection.extend({

		url: "api/policies",
		model: PolicyModel,

		comparator: function(config) {
			return config.get('name');
		}

	});

});
