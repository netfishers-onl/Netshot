/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/reports/export",

		getDownloadUrl: function() {
			return this.urlRoot + '?' + $.param(this.attributes);
		}

	});

});