define([
	'jquery',
	'underscore',
	'backbone',
	'views/reports/ReportView',
	'models/device/DeviceGroupCollection',
	'models/reports/DataExportReportParamsModel',
	'text!templates/reports/dataExportReport.html',
], function($, _, Backbone, ReportView, DeviceGroupCollection,
		DataExportReportParamsModel, dataExportReportTemplate) {

	var DataExportReportView = ReportView.extend({

		template: _.template(dataExportReportTemplate),

		render: function() {
			var that = this;

			this.$el.html(this.template());
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				that.renderGroupList();
			});

			this.$('#filtergroup').click(function() {
				if ($(this).prop('checked')) {
					that.$('#group').prop('disabled', false);
				}
				else {
					that.$('#group').prop('disabled', true);
				}
			});

			this.$('#export').button({
				icons: {
					primary: "ui-icon-arrowstop-1-s"
				}
			}).click(function() {
				var exportParams = new DataExportReportParamsModel({
					group: (that.$('#filtergroup').prop('checked') ? that.$('#group')
							.val() : -1),
					interfaces: that.$('#filterinterfaces').prop('checked'),
					inventory: that.$('#filterinventory').prop('checked')
				});
				window.location = exportParams.getDownloadUrl();
				return false;
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

		destroy: function() {
			this.$el.empty();
		}

	});
	return DataExportReportView;
});
