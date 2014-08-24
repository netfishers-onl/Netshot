define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var LastDayChangesCollection = Backbone.Collection.extend({

		url: "rs/reports/last7dayschangesbyday",

	});

	return LastDayChangesCollection;

});
