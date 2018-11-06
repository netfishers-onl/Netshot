/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'Chart',
	'views/reports/ReportView',
	'models/reports/GroupConfigComplianceStatCollection',
	'models/reports/GroupNonCompliantDevicesCollection',
	'models/domain/DomainCollection',
	'text!templates/reports/configComplianceReport.html',
	'text!templates/reports/chartLegend.html',
	'text!templates/reports/configComplianceNonCompliantDeviceRow.html'
	], function($, _, Backbone, Chart, ReportView,
			GroupConfigComplianceStatCollection, GroupNonCompliantDevicesCollection,
			DomainCollection,
			configComplianceReportTemplate, chartLegendTemplate,
			configComplianceNonCompliantDeviceRowTemplate) {

	return ReportView.extend({

		template: _.template(configComplianceReportTemplate),
		chartLegendTemplate: _.template(chartLegendTemplate),
		nonCompliantDeviceTemplate: _
		.template(configComplianceNonCompliantDeviceRowTemplate),

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
				that.refreshGroupConfigComplianceStats();
				return false;
			});

			this.domains = new DomainCollection([]);
			this.domains.fetch().done(function() {
				that.renderDomainList();
				that.refreshGroupConfigComplianceStats();
			});

			return this;
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

		refreshGroupConfigComplianceStats: function() {
			var that = this;
			this.$('#devices').hide();
			this.groupConfigComplianceStats = new GroupConfigComplianceStatCollection([], {
				domains: this.$('#filterdomain').prop('checked') ? [this.$('#domain').val()] : undefined,
			});
			this.groupConfigComplianceStats.fetch().done(function() {
				that.renderGroupConfigComplianceStats();
			});
		},

		renderGroupConfigComplianceStats: function() {
			var that = this;
			var data = {
				datasets: [{
					data: [],
					backgroundColor: [],
					label: "Configuration compliance"
				}],
				labels: [],
			};
			var htmlLegend = "";
			this.groupConfigComplianceStats.each(function(stat, i) {
				var compliant = stat.get('compliantDeviceCount');
				var total = stat.get('deviceCount');
				var value = Math.round(total == 0 ? 100 : 100 * compliant / total);
				var color = that.legendColors[i % that.legendColors.length];
				var legend = {
					id: stat.get('groupId'),
					color: total === 0 ? "transparent" : color,
					text: stat.get('groupName'),
					value: total === 0 ? "" : (value + "%"),
					comment: total === 0 ? "No device" :
						(compliant + " compliant device" + (compliant > 1 ? "s" : "") + " out of " + total)
				};
				htmlLegend += that.chartLegendTemplate(legend);
				if (total === 0) {
					return;
				}
				data.datasets[0].data.push(value);
				data.datasets[0].backgroundColor.push(color);
				data.labels.push(" " + stat.get('groupName'));
			});
			var options = {
				scaleOverride: true,
				scaleSteps: 5,
				scaleStepWidth: 20,
				scaleLabel: "<%=value%>%"
			};
			if (this.chart) {
				this.chart.destroy();
			}
			this.chart = new Chart($("#chart-configcompliance"), {
				data: data,
				type: "polarArea",
				options: {
					responsive: false,
					scale: {
						ticks: {
							maxTicksLimit: 5,
							min: 0,
							max: 100
						}
					}
				}
			});
			this.$('#legend-configcompliance tbody').html(htmlLegend);
			this.$('#legend-configcompliance .nsreport-legend-text a').click(function() {
				var group = $(this).closest('.nsreport-legend-item').data('group-id');
				that.refreshGroupNonCompliantDevices(group);
				return false;
			});
		},

		refreshGroupNonCompliantDevices: function(id) {
			var that = this;
			this.groupNonCompliantDevices = new GroupNonCompliantDevicesCollection([], {
				group: id,
				domains: this.groupConfigComplianceStats.domains
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
