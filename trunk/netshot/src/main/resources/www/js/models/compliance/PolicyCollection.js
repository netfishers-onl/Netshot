/** Copyright 2013-2014 NetFishers */
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
