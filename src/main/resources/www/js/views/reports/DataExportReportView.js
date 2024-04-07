/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/reports/ReportView',
	'views/devices/SelectGroupDialog',
	'models/device/DeviceGroupCollection',
	'models/reports/DataExportReportParamsModel',
	'models/domain/DomainCollection',
	'text!templates/reports/dataExportReport.html',
	'text!templates/devices/groupStaticItem.html',
], function($, _, Backbone, ReportView, SelectGroupDialog, DeviceGroupCollection,
		DataExportReportParamsModel, DomainCollection, dataExportReportTemplate,
		groupStaticItemTemplate) {

	return ReportView.extend({

		template: _.template(dataExportReportTemplate),
		staticGroupTemplate: _.template(groupStaticItemTemplate),
		selectedGroupIds: [],

		render: function() {
			var that = this;

			this.$el.html(this.template());
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				that.renderGroupField();
			});

			this.$('#filterdomain').click(function() {
				that.$('#domain').prop('disabled', !$(this).prop('checked'));
			});

			this.$('#groups').click(function(event) {
				new SelectGroupDialog({
					groups: that.groups,
					preselectedGroupIds: that.selectedGroupIds,
					constraints: {
						min: 0,
						max: Number.POSITIVE_INFINITY,
					},
					onSelected: function(groupIds) {
						that.selectedGroupIds = groupIds;
						that.renderGroupField();
					},
				});
				return false;
			});

			this.$('#exportinventory').click(function() {
				that.$('#exportinventoryhistory').prop('disabled', !$(this).prop('checked'));
				if (!$(this).prop('checked')) {
					that.$('#exportinventoryhistory').prop('checked', false);
				}
			});

			this.$('#export').button({
				icons: {
					primary: "ui-icon-arrowstop-1-s"
				}
			}).click(function() {
				ReportView.defaultOptions.domain = that.$('#filterdomain').prop('checked') ? that.$('#domain').val() : undefined;
				var exportParams = new DataExportReportParamsModel({
					groups: (that.selectedGroupIds.length > 0) ? that.selectedGroupIds : undefined,
					domains: (that.$('#filterdomain').prop('checked') ? [that.$('#domain').val()] : undefined),
					exportGroups: that.$('#exportgroups').prop('checked'),
					exportInterfaces: that.$('#exportinterfaces').prop('checked'),
					exportInventory: that.$('#exportinventory').prop('checked'),
					exportInventoryHistory: that.$('#exportinventoryhistory').prop('checked'),
					exportLocations: that.$('#exportlocations').prop('checked'),
					exportCompliance: that.$('#exportcompliance').prop('checked'),
					exportDeviceDriverAttributes: that.$('#exportdevicedriverattributes').prop('checked'),
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

		renderGroupField: function() {
			var that = this;
			this.$('#groups>.placeholder').toggle(this.selectedGroupIds.length === 0);
			this.$('#groups>ul').toggle(this.selectedGroupIds.length > 0);
			var $groupField = this.$('#groups>ul');
			$groupField.empty();
			_.each(this.selectedGroupIds, function(groupId) {
				var group = that.groups.get(groupId);
				if (group) {
					$groupField.append($(that.staticGroupTemplate(group.toJSON())));
				}
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
