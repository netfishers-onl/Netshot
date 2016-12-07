/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'Chart',
	'views/reports/ReportView',
	'models/reports/GroupSoftwareComplianceStatCollection',
	'models/reports/GroupDevicesBySoftwareLevelCollection',
	'text!templates/reports/softwareComplianceReport.html',
	'text!templates/reports/chartLegend.html',
	'text!templates/reports/softwareGroupComplianceChart.html',
	'text!templates/reports/softwareComplianceDeviceRow.html'
	], function($, _, Backbone, Chart, ReportView,
			GroupSoftwareComplianceStatCollection,
			GroupDevicesBySoftwareLevelCollection, softwareComplianceReportTemplate,
			chartLegendTemplate, softwareGroupComplianceChartTemplate,
			softwareComplianceDeviceRow) {

	return ReportView.extend({

		template: _.template(softwareComplianceReportTemplate),
		chartLegendTemplate: _.template(chartLegendTemplate),
		groupChartTemplate: _.template(softwareGroupComplianceChartTemplate),
		deviceTemplate: _.template(softwareComplianceDeviceRow),

		render: function() {
			var that = this;

			this.$el.html(this.template());

			this.groupSoftwareComplianceStats = new GroupSoftwareComplianceStatCollection([]);
			this.refreshGroupSoftwareComplianceStats();
			return this;
		},

		refreshGroupSoftwareComplianceStats: function() {
			var that = this;
			this.groupSoftwareComplianceStats.fetch().done(function() {
				that.groupSoftwareComplianceStats
				.each(that.renderGroupSoftwareComplianceStats, that);
				that.$(".nsreport-legend-item a").click(function() {
					var group = $(this).closest("[data-group-id]").data("group-id");
					var level = $(this).text().toLowerCase();
					that.refreshGroupDevices(group, level);
					return false;
				});
			});
		},

		renderGroupSoftwareComplianceStats: function(group) {
			var that = this;
			var html = this.groupChartTemplate(group.toJSON());
			var $group = this.$("#nsreport-softwarecompliance-groups")
				.append(html).find('.group-chart').last();

			var htmlLegend = "";
			var data = {
				labels: [],
				datasets: [{
					data: [],
					backgroundColor: []
				}],
			};

			var color = '#FFD700';
			data.labels.push("Gold");
			data.datasets[0].data.push(group.get('goldDeviceCount'));
			data.datasets[0].backgroundColor.push(color);
			htmlLegend += that.chartLegendTemplate({
				id: group.get('groupId'),
				color: color,
				text: "Gold",
				value: group.get('goldDeviceCount')
			});

			color = '#C0C0C0';
			data.labels.push("Silver");
			data.datasets[0].data.push(group.get('silverDeviceCount'));
			data.datasets[0].backgroundColor.push(color);
			htmlLegend += that.chartLegendTemplate({
				id: group.get('groupId'),
				color: color,
				text: "Silver",
				value: group.get('silverDeviceCount')
			});

			color = '#CD7F32';
			data.labels.push("Bronze");
			data.datasets[0].data.push(group.get('bronzeDeviceCount'));
			data.datasets[0].backgroundColor.push(color);
			htmlLegend += that.chartLegendTemplate({
				id: group.get('groupId'),
				color: color,
				text: "Bronze",
				value: group.get('bronzeDeviceCount')
			});

			var rest = group.get('deviceCount') - group.get('goldDeviceCount')
				- group.get('silverDeviceCount') - group.get('bronzeDeviceCount');
			color = '#000000';
			data.labels.push("Non compliant");
			data.datasets[0].data.push(rest);
			data.datasets[0].backgroundColor.push(color);
			htmlLegend += that.chartLegendTemplate({
				id: group.get('groupId'),
				color: color,
				text: "Non compliant",
				value: rest
			});

			var options = {};
			new Chart($group.find('.chart'), {
				data: data,
				type: "pie",
				options: {
					responsive: false,
					legend: {
						display: false,
					}
				}
			});
			$group.find('.legend tbody').html(htmlLegend);
		},

		refreshGroupDevices: function(group, level) {
			var that = this;
			this.groupDevices = new GroupDevicesBySoftwareLevelCollection([], {
				group: group,
				level: level
			});
			this.groupDevices.fetch().done(function() {
				that.renderGroupDevices();
				that.$el.scrollTop(that.$("#devices").position().top);
			});
			this.$("#devices-level").text(level.toUpperCase());
			this.$("#devices-groupname").text(this.groupSoftwareComplianceStats
					.findWhere({
						groupId: group
					}).get('groupName'));
		},

		renderGroupDevices: function() {
			var that = this;
			this.$("#devices tbody").html("");
			var htmlBuffer = "";
			this.groupDevices.each(function(device) {
				htmlBuffer += that.deviceTemplate(device.toJSON());
			});
			this.$('#devices tbody').html(htmlBuffer);
			this.$('#devices').show();
		},

		destroy: function() {
			this.$el.empty();
		}

	});
});
