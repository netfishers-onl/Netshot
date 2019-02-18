/** Copyright 2013-2019 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'tablesort',
	'models/device/DeviceDiagnosticResultCollection',
	'views/devices/RunDeviceDiagnosticsDialog',
	'text!templates/devices/deviceDiagnostics.html',
	'text!templates/devices/deviceDiagnostic.html'
], function($, _, Backbone, TableSort, DeviceDiagnosticResultCollection, RunDeviceDiagnosticsDialog,
		deviceDiagnosticsTemplate, deviceDiagnosticTemplate) {

	return Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceDiagnosticsTemplate),
		diagnosticTemplate: _.template(deviceDiagnosticTemplate),

		initialize: function(options) {
			this.device = options.device;
			this.diagnosticResults = new DeviceDiagnosticResultCollection([], {
				'device': this.device,
			});
			var that = this;
			this.diagnosticResults.fetch().done(function() {
				that.render();
			});
		},

		render: function() {
			var that = this;

			this.$el.html(this.template());
			var $table = this.$("#diagnostics tbody");
			this.diagnosticResults.each(function(diagnosticResult) {
				$(that.diagnosticTemplate(diagnosticResult.toJSON())).appendTo($table);
			});
			new TableSort(this.$("#diagnostics").get(0));
			
			this.$("#rundiagnostics").button({
				icons: {
					primary: "ui-icon-seek-next"
				}
			}).click(function() {
				var runDiagnosticsDialog = new RunDeviceDiagnosticsDialog({
					model: that.device
				});
			});

			return this;
		},

		destroy: function() {
			this.$el.empty();
		}

	});
});
