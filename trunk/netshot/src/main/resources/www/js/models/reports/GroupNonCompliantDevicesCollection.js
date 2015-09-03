/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.group = options.group;
		},

		url: function() {
			return "api/reports/groupconfignoncompliantdevices/" + this.group;
		},

		comparator: function(config) {
			return config.get('id') + config.get('policyName');
		}

	});

});