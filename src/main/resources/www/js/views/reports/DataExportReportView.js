/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/reports/ReportView',
	'models/device/DeviceGroupCollection',
	'models/reports/DataExportReportParamsModel',
	'models/domain/DomainCollection',
	'text!templates/reports/dataExportReport.html',
], function($, _, Backbone, ReportView, DeviceGroupCollection,
		DataExportReportParamsModel, DomainCollection, dataExportReportTemplate) {

	return ReportView.extend({

		template: _.template(dataExportReportTemplate),

		render: function() {
			var that = this;

			this.$el.html(this.template());
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				that.renderGroupList();
			});

			this.$('#filterdomain').click(function() {
				that.$('#domain').prop('disabled', !$(this).prop('checked'));
			});

			this.$('#filtergroup').click(function() {
				that.$('#group').prop('disabled', !$(this).prop('checked'));
			});

			this.$('#export').button({
				icons: {
					primary: "ui-icon-arrowstop-1-s"
				}
			}).click(function() {
				ReportView.defaultOptions.domain = that.$('#filterdomain').prop('checked') ? that.$('#domain').val() : undefined;
				var exportParams = new DataExportReportParamsModel({
					groups: (that.$('#filtergroup').prop('checked') ? [that.$('#group').val()] : undefined),
					domains: (that.$('#filterdomain').prop('checked') ? [that.$('#domain').val()] : undefined),
					interfaces: that.$('#filterinterfaces').prop('checked'),
					inventory: that.$('#filterinventory').prop('checked'),
					locations: that.$('#filterlocations').prop('checked'),
					compliance: that.$('#filtercompliance').prop('checked'),
				});
				window.location = exportParams.getDownloadUrl();
				return false;
			});
			
			this.domains = new DomainCollection([]);
			this.domains.fetch().done(function() {
				that.renderDomainList();
			});

			return this;
		},

		renderGroupList: function() {
			var that = this;
			this.groups.each(function(group) {
				$('<option />').attr('value', group.get('id')).text(group.get('name'))
						.appendTo(that.$('#group'));
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

		destroy: function() {
			this.$el.empty();
		}

	});
});
