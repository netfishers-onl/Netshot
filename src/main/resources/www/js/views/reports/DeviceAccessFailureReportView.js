/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'tablesort',
	'views/reports/ReportView',
	'models/reports/AccessFailureDeviceCollection',
	'models/domain/DomainCollection',
	'text!templates/reports/deviceAccessFailureReport.html',
	'text!templates/reports/deviceAccessFailureRow.html'
], function($, _, Backbone, TableSort, ReportView, AccessFailureDeviceCollection,
		DomainCollection,
		deviceAccessFailureReportTemplate,
		deviceAccessFailureRowTemplate) {

	return ReportView.extend({

		template: _.template(deviceAccessFailureReportTemplate),
		rowTemplate: _.template(deviceAccessFailureRowTemplate),

		render: function() {
			var that = this;

			this.$el.html(this.template());

			this.$('#filterdomain').click(function() {
				that.$('#domain').prop('disabled', !$(this).prop('checked'));
			});

			this.$('#update').button({
				icons: {
					primary: "ui-icon-refresh"
				}
			}).click(function() {
				ReportView.defaultOptions.domain = that.$('#filterdomain').prop('checked') ? that.$('#domain').val() : undefined;
				that.refreshDevices();
				return false;
			});
			
			this.$('#olderthandays').spinner({
				step: 1,
				page: 1,
				numberFormat: "n",
				min: 1,
				value: this.$('#olderthandays').prop('value'),
				change: function() {
					var value = $(this).spinner('value');
					if (typeof value !== "number") {
						$(this).spinner('value', 3);
					}
				}
			});
			

			this.domains = new DomainCollection([]);
			this.domains.fetch().done(function() {
				that.renderDomainList();
				that.refreshDevices();
			});

			return this;
		},

		destroy: function() {
			this.$el.empty();
		},
		
		refreshDevices: function() {
			var that = this;
			this.devices = new AccessFailureDeviceCollection([], {
				days: this.$('#olderthandays').spinner('value'),
				domains: this.$('#filterdomain').prop('checked') ? [this.$('#domain').val()] : undefined,
			});
			this.devices.fetch().done(function() {
				that.renderDevices();
			});
		},
		
		renderDomainList: function() {
			var that = this;
			this.domains.each(function(domain) {
				$('<option />').attr('value', domain.get('id')).text(domain.get('name'))
						.appendTo(that.$('#domain'));
			});
			if (ReportView.defaultOptions.domain) {
				this.$('#domain').val(ReportView.defaultOptions.domain).prop('disabled', false);
				this.$('#filterdomain').prop('checked', true);
			}
		},
		
		renderDevices: function() {
			var that = this;
			this.htmlBuffer = "";
			this.devices.each(function(device) {
				that.htmlBuffer += that.rowTemplate(device.toJSON());
			});
			this.$("#nsreports-accessfailures table tbody").html(this.htmlBuffer);
			new TableSort(this.$("#nsreports-accessfailures table").get(0));
		}

	});
});
