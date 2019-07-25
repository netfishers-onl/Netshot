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
	'models/compliance/PolicyCollection',
	'models/device/DeviceGroupCollection',
	'text!templates/reports/configComplianceReport.html',
	'text!templates/reports/chartLegend.html',
	'text!templates/reports/configComplianceNonCompliantDeviceRow.html',
	'text!templates/reports/reportPolicyFilter.html',
	'text!templates/reports/reportGroupFilter.html',
	], function($, _, Backbone, Chart, ReportView,
			GroupConfigComplianceStatCollection, GroupNonCompliantDevicesCollection,
			DomainCollection, PolicyCollection, DeviceGroupCollection,
			configComplianceReportTemplate, chartLegendTemplate,
			configComplianceNonCompliantDeviceRowTemplate, reportPolicyFilterTemplate,
			reportGroupFilterTemplate) {

	return ReportView.extend({

		template: _.template(configComplianceReportTemplate),
		chartLegendTemplate: _.template(chartLegendTemplate),
		nonCompliantDeviceTemplate: _.template(configComplianceNonCompliantDeviceRowTemplate),
		policyFilterTemplate: _.template(reportPolicyFilterTemplate),
		groupFilterTemplate: _.template(reportGroupFilterTemplate),

		render: function() {
			var that = this;

			this.$el.html(this.template());
			
			this.$('#filterdomain').click(function() {
				that.$('#domain').prop('disabled', !$(this).prop('checked'));
			});
			this.$('#filtergroup').click(function() {
				that.$('#filtergroups input').prop('disabled', !$(this).prop('checked'));
				that.enableUpdateButton();
			});
			this.$('#filterpolicy').click(function() {
				that.$('#filterpolicies input').prop('disabled', !$(this).prop('checked'));
				that.enableUpdateButton();
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
			this.deviceGroups = new DeviceGroupCollection([]);
			this.policies = new PolicyCollection([]);
			$.when(
				this.domains.fetch(),
				this.deviceGroups.fetch(),
				this.policies.fetch()
			).done(function() {
				that.renderDomainList();
				that.renderDeviceGroupList();
				that.renderPolicyList();
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

		enableUpdateButton: function() {
			var withGroups = !(this.$('#filtergroup').is(':checked')) ||
				this.$('#filtergroups input:checked').length > 0;
			var withPolicies = !(this.$('#filterpolicy').is(':checked')) ||
				this.$('#filterpolicies input:checked').length > 0;
			this.$('#update').button((withGroups && withPolicies) ? 'enable' : 'disable');
		},

		renderPolicyList: function() {
			var that = this;
			this.htmlBuffer = "";
			this.policies.each(function(policy) {
				that.htmlBuffer += that.policyFilterTemplate(policy.toJSON());
			});
			this.$('#filterpolicies').html(this.htmlBuffer);
			this.$('#filterpolicies input').click(function() {
				that.enableUpdateButton();
			});
		},

		renderDeviceGroupList: function() {
			var that = this;
			this.htmlBuffer = "";
			this.deviceGroups.each(function(group) {
				if (group.get('hiddenFromReports')) {
					return;
				}
				that.htmlBuffer += that.groupFilterTemplate(group.toJSON());
			});
			this.$('#filtergroups').html(this.htmlBuffer);
			this.$('#filtergroups input').click(function() {
				that.enableUpdateButton();
			});
		},

		refreshGroupConfigComplianceStats: function() {
			var that = this;
			this.$('#devices').hide();
			this.selectedDeviceGroups = undefined;
			if (this.$('#filtergroup').is(':checked')) {
				this.selectedDeviceGroups = this.$('#filtergroups input:checked').map(function() { return $(this).data('group-id'); }).get();
			}
			this.selectedPolicies = undefined;
			if (this.$('#filterpolicy').is(':checked')) {
				this.selectedPolicies = this.$('#filterpolicies input:checked').map(function() { return $(this).data('policy-id'); }).get();
			}
			this.groupConfigComplianceStats = new GroupConfigComplianceStatCollection([], {
				domains: this.$('#filterdomain').prop('checked') ? [this.$('#domain').val()] : undefined,
				deviceGroups: this.selectedDeviceGroups,
				policies: this.selectedPolicies,
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
				domains: this.groupConfigComplianceStats.domains,
				policies: this.selectedPolicies,
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
