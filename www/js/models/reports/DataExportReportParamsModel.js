define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var DataExportReportParamsModel = Backbone.Model.extend({

		urlRoot: "rs/reports/export",

		getDownloadUrl: function() {
			return this.urlRoot + '?' + $.param(this.attributes);
		}

	});

	return DataExportReportParamsModel;

});