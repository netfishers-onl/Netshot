define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var HardwareSupportStatCollection = Backbone.Collection.extend({

		url: "rs/reports/hardwaresupportstats",
		
		comparator: function(s) {
			var d = s.get('eoxDate');
			return (typeof(d) == "number" ? d : 0xFFFFFFFFFFFFFFFF);
		}

	});

	return HardwareSupportStatCollection;

});