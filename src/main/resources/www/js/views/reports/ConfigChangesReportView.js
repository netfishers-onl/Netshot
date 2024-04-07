/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'Chart',
	'views/reports/ReportView',
	'views/devices/DeviceConfigDiffView',
	'models/device/DeviceConfigChangeCollection',
	'models/reports/LastDayChangesCollection',
	'text!templates/reports/configChangesReport.html',
	'text!templates/reports/configChangeRow.html'
	], function($, _, Backbone, Chart, ReportView, DeviceConfigDiffView,
			DeviceConfigChangeCollection, LastDayChangesCollection,
			configChangesReportTemplate, configChangeRowTemplate) {

	return ReportView.extend({

		template: _.template(configChangesReportTemplate),
		configChangeRowTemplate: _.template(configChangeRowTemplate),

		render: function() {
			var that = this;

			this.$el.html(this.template());

			this.lastDayChanges = new LastDayChangesCollection([]);
			this.refreshLastDayChangesChart();

			this.configChanges = new DeviceConfigChangeCollection([]);

			this
			.$('#tabs')
			.buttonset()
			.change(function() {
				switch ($('#tabs :radio:checked').attr('id')) {
				case "last1hour":
					that.$("#day").hide();
					that.configChanges.toDate = new Date();
					that.configChanges.fromDate = new Date(that.configChanges.toDate - 3600 * 1000);
					break;
				case "last4hours":
					that.$("#day").hide();
					that.configChanges.toDate = new Date();
					that.configChanges.fromDate = new Date(that.configChanges.toDate - 4 * 3600 * 1000);
					break;
				case "last12hours":
					that.$("#day").hide();
					that.configChanges.toDate = new Date();
					that.configChanges.fromDate = new Date(that.configChanges.toDate - 12 * 3600 * 1000);
					break;
				case "last24hours":
					that.$("#day").hide();
					that.configChanges.toDate = new Date();
					that.configChanges.fromDate = new Date(that.configChanges.toDate - 24 * 3600 * 1000);
					break;
				case "period":
					that.$("#day").show();
					that.configChanges.fromDate = that.$('#day')
					.datepicker('getDate');
					that.configChanges.toDate = new Date(that.configChanges.fromDate
							.getTime() + 24 * 3600 * 1000);
					break;
				}
				that.refreshConfigChanges();
			});
			this.$('#last1hour').button({
				icons: {
					primary: "ui-icon-clock"
				}
			});
			this.$('#last4hours').button({
				icons: {
					primary: "ui-icon-clock"
				}
			});
			this.$('#last12hours').button({
				icons: {
					primary: "ui-icon-clock"
				}
			});
			this.$('#last24hours').button({
				icons: {
					primary: "ui-icon-clock"
				}
			});
			this.$('#period').button({
				icons: {
					primary: "ui-icon-calendar"
				}
			});
			this.$('#day').datepicker({
				dateFormat: window.dateFormats.picker,
				autoSize: true,
				onSelect: function() {
					that.configChanges.fromDate = $(this).datepicker('getDate');
					that.configChanges.toDate = new Date(that.configChanges.fromDate
							.getTime() + 24 * 3600 * 1000);
					that.refreshConfigChanges();
				}
			}).datepicker('setDate', new Date());

			this.$('#tabs').trigger('change');

			return this;
		},

		refreshConfigChanges: function() {
			var that = this;
			this.configChanges.fetch().done(function() {
				that.renderConfigChangeList();
			});
		},

		renderConfigChangeList: function() {
			var that = this;
			this.htmlBuffer = "";
			this.configChanges.each(this.renderConfigChangeRow, this);
			this.$("table>tbody").html(this.htmlBuffer);
			this.$("table .show").button({
				icons: {
					primary: "ui-icon-transfer-e-w"
				},
				text: false
			}).click(function() {
				var configChange = that.configChanges.get($(this).closest('tr')
						.data("change-id"));
				var diffView = new DeviceConfigDiffView({
					deviceName: configChange.get('deviceName'),
					configId1: 0,
					configId2: configChange.get('id'),
				});
			});
		},

		renderConfigChangeRow: function(configChange) {
			var data = configChange.toJSON();
			data['cid'] = configChange.cid;
			this.htmlBuffer += this.configChangeRowTemplate(data);
		},

		refreshLastDayChangesChart: function() {
			var that = this;
			this.lastDayChanges.fetch().done(function() {
				that.renderLastDayChangesChart();
			});
		},

		renderLastDayChangesChart: function() {
			var days = [];
			var changeCounts = [];
			var changeMax = 1;
			this.lastDayChanges.each(function(dayChanges) {
				var changeCount = dayChanges.get('changeCount') || 0;
				var day = dayChanges.get('changeDay');
				changeMax = Math.max(changeMax, changeCount);
				days.push(window.formatDateTime(day, "month"));
				changeCounts.push(changeCount);
			});
			var data = {
				labels: days,
				datasets: [{
					label: " Changes per day",
					backgroundColor: "rgba(220, 220,220, 0.5)",
					borderColor: "rgba(220, 220, 220, 1)",
					data: changeCounts,
					borderWidth: 2
				}]
			};
			new Chart($("#chart-lastdaychanges"), {
				data: data,
				type: "bar",
				options: {
					responsive: false,
					scales: {
						yAxes: [{
							ticks: {
								min: 0,
								maxTicksLimit: Math.min(5, changeMax + 2),
								suggestedMax: changeMax * 1.2
							}
						}]
					}
				}
			});
		},

		destroy: function() {
			this.$('#tabs').buttonset('destroy');
			this.$el.empty();
		}

	});
});
