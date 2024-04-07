/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/reports/reports.html',
	'views/reports/ConfigChangesReportView',
	'views/reports/ConfigComplianceReportView',
	'views/reports/SoftwareComplianceReportView',
	'views/reports/HardwareSupportStatusReportView',
	'views/reports/DataExportReportView',
	'views/reports/DeviceAccessFailureReportView'
], function($, _, Backbone, reportsTemplate, ConfigChangesReportView,
		ConfigComplianceReportView, SoftwareComplianceReportView,
		HardwareSupportStatusReportView,
		DataExportReportView, DeviceAccessFailureReportView) {

	makeLoadProgress(13);

	return Backbone.View.extend({

		el: $("#page"),

		template: _.template(reportsTemplate),

		initialize: function() {
		},

		render: function() {
			var that = this;
			$('#nstoolbar-reports').prop('checked', true);
			$('#nstoolbarpages').buttonset('refresh');

			this.$el.html(this.template);

			$('#nstoolbar-section').html("");

			this.$("#nsreports-listbox>ul li").mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function() {
				if ($(this).hasClass("active")) {
					return;
				}
				that.renderReport($(this).data('report'));
				$(this).closest('ul').find('li').removeClass("active");
				$(this).addClass("active");
			});

			this.reportView = null;

			return this;
		},

		renderReport: function(report) {
			if (report == "ConfigChanges") {
				this.reportView = new ConfigChangesReportView();
			}
			else if (report == "ConfigCompliance") {
				this.reportView = new ConfigComplianceReportView();
			}
			else if (report == "SoftwareCompliance") {
				this.reportView = new SoftwareComplianceReportView();
			}
			else if (report == "HardwareSupportStatus") {
				this.reportView = new HardwareSupportStatusReportView();
			}
			else if (report == "DataExport") {
				this.reportView = new DataExportReportView();
			}
			else if (report == "DeviceAccessFailure") {
				this.reportView = new DeviceAccessFailureReportView();
			}
		}

	});
});
