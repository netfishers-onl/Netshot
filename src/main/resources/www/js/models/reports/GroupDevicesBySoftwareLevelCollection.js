/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.group = options.group;
			this.level = options.level;
		},

		url: function() {
			return "api/reports/groupdevicesbysoftwarelevel/" + this.group + "/"
					+ this.level;
		},

	});

});