define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var GroupNonCompliantDevicesCollection = Backbone.Collection.extend({

		initialize: function(models, options) {
			this.group = options.group;
		},

		url: function() {
			return "rs/reports/groupconfignoncompliantdevices/" + this.group;
		},

		comparator: function(config) {
			return config.get('id') + config.get('policyName');
		}

	});

	return GroupNonCompliantDevicesCollection;

});