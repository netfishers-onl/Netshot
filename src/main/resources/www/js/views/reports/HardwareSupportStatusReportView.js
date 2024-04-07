/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'Chart',
	'views/reports/ReportView',
	'models/reports/HardwareSupportStatCollection',
	'models/reports/HardwareSupportDevicesCollection',
	'text!templates/reports/hardwareSupportStatusReport.html',
	'text!templates/reports/hardwareSupportMilestoneRow.html',
	'text!templates/reports/hardwareSupportMilestoneRestRow.html',
	'text!templates/reports/hardwareSupportDeviceRow.html',
	'text!templates/reports/hardwareSupportStatusTitle.html'
], function($, _, Backbone, Chart, ReportView,
		HardwareSupportStatCollection,
		HardwareSupportDevicesCollection,
		hardwareSupportStatusReportTemplate,
		hardwareSupportMilestoneRowTemplate,
		hardwareSupportMilestoneRestRowTemplate,
		hardwareSupportDeviceRowTemplate,
		hardwareSupportStatusTitleTemplate) {

	return ReportView.extend({

		template: _.template(hardwareSupportStatusReportTemplate),
		milestoneRowTemplate: _.template(hardwareSupportMilestoneRowTemplate),
		milestoneRestRowTemplate: _.template(hardwareSupportMilestoneRestRowTemplate),
		deviceRowTemplate: _.template(hardwareSupportDeviceRowTemplate),
		statusTitleTemplate: _.template(hardwareSupportStatusTitleTemplate),

		render: function() {
			var that = this;
			this.$el.html(this.template());
			this.hardwareSupportStats = new HardwareSupportStatCollection([]);
			this.hardwareSupportStats.fetch().done(function() {
				that.renderHardwareSupportStats();
			});
			return this;
		},
		
		renderHardwareSupportStats: function() {
			var that = this;
			var eolData = [];
			var eosData = [];
			var maxData = [];
			var labels = [];
			
			var thisMonth = new Date();
			thisMonth.setMilliseconds(0);
			thisMonth.setSeconds(0);
			thisMonth.setMinutes(0);
			thisMonth.setHours(0);
			thisMonth.setDate(1);

			var eosCount = 0;
			var eolCount = 0;
			var eosMax = 0;
			var eolMax = 0;
			this.hardwareSupportStats.each(function(stat) {
				if (stat.get('type').match(/EoSStat/)) {
					eosMax += stat.get('deviceCount');
				}
				else if (stat.get('type').match(/EoLStat/)) {
					eolMax += stat.get('deviceCount');
				}
			});
			var eoxMax = (eosMax > eolMax ? eosMax : eolMax);
			for (var m = -4 * 12; m < 8 * 12; m++) {
				var month = new Date(thisMonth.valueOf());
				month.setMonth(m);
				var endMonth = new Date(month.valueOf());
				endMonth.setMonth(month.getMonth() + 1);
				this.hardwareSupportStats.each(function(stat) {
					if (stat.get('eoxDate') >= month.getTime() && stat.get('eoxDate') < endMonth.getTime()) {
						if (stat.get('type').match(/EoSStat/)) {
							eosCount += stat.get('deviceCount');
						}
						else if (stat.get('type').match(/EoLStat/)) {
							eolCount += stat.get('deviceCount');
						}
					}
				});
				var label = (month.getMonth() == 0 ? window.formatDateTime(month, "month") : "");
				labels.push(label);
				eosData.push(eosCount);
				eolData.push(eolCount);
				maxData.push(eoxMax);
			}
			
			var data = {
				labels: labels,
				datasets: [
					{
						label: "End-of-Life Devices",
						backgroundColor: "rgba(151,187,205,0.5)",
						borderColor: "rgba(151,187,205,1)",
						borderDash: [],
						borderDashOffset: 0.0,
						borderJoinStyle: 'miter',
						spanGaps: false,
						pointBorderWidth: 1,
						pointHoverBorderWidth: 2,
						pointRadius: 1,
						pointHitRadius: 10,
						data: eolData
					},
					{
						label: "End-of-Sale Devices",
						backgroundColor: "rgba(220,220,220,0.5)",
						borderColor: "rgba(220,220,220,1)",
						borderDash: [],
						borderDashOffset: 0.0,
						borderJoinStyle: 'miter',
						spanGaps: false,
						pointBorderWidth: 1,
						pointHoverBorderWidth: 2,
						pointRadius: 1,
						pointHitRadius: 10,
						data: eosData
					},
					{
						label: "Total Devices",
						fillColor: "rgba(240,90,90,0.01)",
						borderColor: "rgba(240,90,90,0.5)",
			            backgroundColor: "rgba(255,255,255,0.8)",
						borderCapStyle: 'butt',
						borderDash: [],
						borderDashOffset: 0.0,
						borderJoinStyle: 'miter',
						spanGaps: false,
						pointBorderWidth: 1,
						pointHoverBorderWidth: 2,
						pointRadius: 1,
						pointHitRadius: 10,
						fill: false,
						data: maxData
					}
				]
			};
			options = {
				bezierCurve: false,
				scaleSteps: 12,
				pointDot: false,
				scaleShowGridLines: false,
				scaleOverride: true,
				scaleSteps: 10,
				scaleStepWidth: Math.ceil(eoxMax / 10),
				scaleStartValue: 0
			};
			new Chart($("#chart-overview"), {
				data: data,
				type: "line",
				options: {
					responsive: false,
					scales: {
						yAxes: [{
							min: 0,
							maxTicksLimit: 10,
							suggestedMax: eoxMax * 1.2
						}]
					}
				}
			});
			
			var eosRest = 0;
			var eolRest = 0;
			this.hardwareSupportStats.each(function(stat) {
				if (typeof stat.get('eoxDate') === "number") {
					var row = that.milestoneRowTemplate(stat.toJSON());
					that.$("#milestones>tbody").append($(row));
				}
				else if (stat.get('type').match(/EoS/)) {
					eosRest = stat.get('deviceCount');
				}
				else if (stat.get('type').match(/EoL/)) {
					eolRest = stat.get('deviceCount');
				}
			});
			var restRow = that.milestoneRestRowTemplate({
				eosRest: eosRest,
				eolRest: eolRest
			});
			that.$("#milestones>tbody").append($(restRow));
			that.$("#milestones>tbody a.eoxdevices").click(function() {
				that.eoxDevices = new HardwareSupportDevicesCollection([], {
					type: $(this).data('type'),
					eoxDate: $(this).data('date')
				});
				that.eoxDevices.fetch().done(function() {
					that.renderEoxDevices();
				});
				return false;
			});
		},
		
		renderEoxDevices: function() {
			var that = this;
			this.htmlBuffer = "";
			this.eoxDevices.each(that.renderEoxDevice, this);
			this.$("#devices h1").html(this.statusTitleTemplate({
				type: this.eoxDevices.type,
				eoxDate: this.eoxDevices.eoxDate
			}));
			this.$("#devices table>tbody").html(this.htmlBuffer);
			this.$("#devices").show();
		},
		
		renderEoxDevice: function(device) {
			this.htmlBuffer += this.deviceRowTemplate(device.toJSON());
		},

		destroy: function() {
			this.$el.empty();
		}

	});
});
