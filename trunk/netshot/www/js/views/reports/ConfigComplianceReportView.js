define([
	'jquery',
	'underscore',
	'backbone',
	'Chart',
	'views/reports/ReportView',
	'models/reports/GroupConfigComplianceStatCollection',
	'models/reports/GroupNonCompliantDevicesCollection',
	'text!templates/reports/configComplianceReport.html',
	'text!templates/reports/chartLegend.html',
	'text!templates/reports/configComplianceNonCompliantDeviceRow.html'
], function($, _, Backbone, Chart, ReportView,
		GroupConfigComplianceStatCollection, GroupNonCompliantDevicesCollection,
		configComplianceReportTemplate, chartLegendTemplate,
		configComplianceNonCompliantDeviceRowTemplate) {

	var ConfigComplianceReportView = ReportView
			.extend({

				template: _.template(configComplianceReportTemplate),
				chartLegendTemplate: _.template(chartLegendTemplate),
				nonCompliantDeviceTemplate: _
						.template(configComplianceNonCompliantDeviceRowTemplate),

				render: function() {
					var that = this;

					this.$el.html(this.template());

					this.groupConfigComplianceStats = new GroupConfigComplianceStatCollection([]);
					this.refreshGroupConfigComplianceStats();
					return this;
				},

				refreshGroupConfigComplianceStats: function() {
					var that = this;
					this.groupConfigComplianceStats.fetch().done(function() {
						that.renderGroupConfigComplianceStats();
					});
				},

				renderGroupConfigComplianceStats: function() {
					var that = this;
					var ctx = $("#chart-configcompliance").get(0).getContext("2d");
					var chart = new Chart(ctx);
					var data = [];
					var htmlLegend = "";
					this.groupConfigComplianceStats.each(function(stat, i) {
						var compliant = stat.get('compliantDeviceCount');
						var total = stat.get('deviceCount');
						var value = Math.round(total == 0 ? 100 : 100 * compliant / total);
						var color = that.legendColors[i % that.legendColors.length];
						data.push({
							value: value,
							color: color
						});
						var legend = {
							id: stat.get('groupId'),
							color: color,
							text: stat.get('groupName'),
							value: value + "%"
						};
						htmlLegend += that.chartLegendTemplate(legend);
					});
					var options = {
						scaleOverride: true,
						scaleSteps: 5,
						scaleStepWidth: 20,
						scaleLabel: "<%=value%>%"
					};
					new Chart(ctx).PolarArea(data, options);
					this.$('#legend-configcompliance tbody').html(htmlLegend);
					this.$('#legend-configcompliance .nsreport-legend-text a')
							.click(function() {
								var group = $(this).closest('.nsreport-legend-item')
										.data('group-id');
								that.refreshGroupNonCompliantDevices(group);
								return false;
							});
				},

				refreshGroupNonCompliantDevices: function(id) {
					var that = this;
					this.groupNonCompliantDevices = new GroupNonCompliantDevicesCollection([], {
						group: id
					});
					this.groupNonCompliantDevices.fetch().done(function() {
						that.renderGroupNonCompliantDevices();
					});
					this.$("#devices-groupname").text(this.groupConfigComplianceStats
							.findWhere({
								groupId: id
							}).get('groupName'));
				},

				renderGroupNonCompliantDevices: function() {
					var that = this;
					this.$("#devices tbody").html("");
					var htmlBuffer = "";
					var oldDeviceId = null;
					var oldPolicyName = null;
					this.groupNonCompliantDevices.each(function(device) {
						var data = device.toJSON();
						if (data['id'] == oldDeviceId) {
							data['name'] = "";
							data['mgmtAddress']['ip'] = "";
							if (data['policyName'] == oldPolicyName) {
								data['policyName'] = "";
							}
							else {
								oldPolicyName = data['policyName'];
							}
						}
						else {
							oldDeviceId = data['id'];
						}
						htmlBuffer += that.nonCompliantDeviceTemplate(data);
					});
					this.$('#devices tbody').html(htmlBuffer);
					this.$('#devices').show();
				},

				destroy: function() {
					this.$el.empty();
				}

			});
	return ConfigComplianceReportView;
});
