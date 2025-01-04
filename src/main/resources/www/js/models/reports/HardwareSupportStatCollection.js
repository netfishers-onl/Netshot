/** Copyright 2013-2025 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Collection.extend({

		url: "api/reports/hardwaresupportstats",
		
		comparator: function(s) {
			var d = s.get('eoxDate');
			return (typeof(d) == "number" ? d : 0xFFFFFFFFFFFFFFFF);
		}

	});

});