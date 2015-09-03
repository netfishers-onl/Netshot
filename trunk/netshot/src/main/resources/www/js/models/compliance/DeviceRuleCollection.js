/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/compliance/RuleModel'
	], function(_, Backbone, RuleModel) {

	return Backbone.Collection.extend({

		model: RuleModel,

		initialize: function(models, options) {
			this.device = options.device;
		},

		url: function() {
			return "api/rules/device/" + this.device.get('id');
		},

		comparator: function(config) {
			return config.get('name');
		}

	});

});
