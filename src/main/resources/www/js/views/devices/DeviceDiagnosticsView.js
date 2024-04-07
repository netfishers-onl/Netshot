/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'tablesort',
	'models/device/DeviceDiagnosticResultCollection',
	'views/devices/RunDeviceDiagnosticsDialog',
	'text!templates/devices/deviceDiagnostics.html',
	'text!templates/devices/deviceDiagnostic.html',
	'text!templates/devices/noDiagnostic.html',
], function($, _, Backbone, TableSort, DeviceDiagnosticResultCollection, RunDeviceDiagnosticsDialog,
		deviceDiagnosticsTemplate, deviceDiagnosticTemplate, deviceNoDiagnosticTemplate) {

	return Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceDiagnosticsTemplate),
		diagnosticTemplate: _.template(deviceDiagnosticTemplate),
		noDiagnosticTemplate: _.template(deviceNoDiagnosticTemplate),

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

			if (this.diagnosticResults.length === 0) {
				this.$("#diagnostics tbody").html(this.noDiagnosticTemplate());
			}
			else {
				var $table = this.$("#diagnostics tbody");
				this.diagnosticResults.each(function(diagnosticResult) {
					$(that.diagnosticTemplate(diagnosticResult.toJSON())).appendTo($table);
				});
			}

			return this;
		},

		destroy: function() {
			this.$el.empty();
		}

	});
});
