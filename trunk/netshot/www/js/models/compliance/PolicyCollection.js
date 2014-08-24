define([
	'underscore',
	'backbone',
	'models/compliance/PolicyModel'
], function(_, Backbone, PolicyModel) {

	var PolicyCollection = Backbone.Collection.extend({

		url: "rs/policies",
		model: PolicyModel,

		comparator: function(config) {
			return config.get('name');
		}

	});

	return PolicyCollection;

});
