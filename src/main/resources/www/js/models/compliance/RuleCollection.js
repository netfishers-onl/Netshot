/** Copyright 2013-2025 Netshot */
define([
	'underscore',
	'backbone',
	'models/compliance/RuleModel'
], function(_, Backbone, RuleModel) {

	return Backbone.Collection.extend({

		model: RuleModel,

		initialize: function(options) {
			this.policy = options.policy;
		},

		url: function() {
			return "api/policies/" + this.policy.get('id') + "/rules";
		},

		comparator: function(config) {
			return config.get('name');
		}

	});

});
