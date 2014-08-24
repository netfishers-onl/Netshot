define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var GroupDevicesBySoftwareLevelCollection = Backbone.Collection.extend({

		initialize: function(models, options) {
			this.group = options.group;
			this.level = options.level;
		},

		url: function() {
			return "rs/reports/groupdevicesbysoftwarelevel/" + this.group + "/"
					+ this.level;
		},

	});

	return GroupDevicesBySoftwareLevelCollection;

});