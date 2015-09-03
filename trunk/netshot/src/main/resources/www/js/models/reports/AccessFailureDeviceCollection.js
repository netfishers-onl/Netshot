/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.days = options.days;
		},

		url: function() {
			return "api/reports/accessfailuredevices/" + this.days;
		},
		
		comparator: function(item) {
			return [item.get("lastSuccess"), item.get("lastFailure")];
		}

	});

});