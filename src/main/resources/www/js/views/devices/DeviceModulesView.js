/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'tablesort',
	'models/device/DeviceModuleCollection',
	'text!templates/devices/deviceModules.html',
	'text!templates/devices/deviceModule.html'
], function($, _, Backbone, TableSort, DeviceModuleCollection, deviceModulesTemplate,
		deviceModuleTemplate) {

	var displayHistory = false;

	return Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceModulesTemplate),
		moduleTemplate: _.template(deviceModuleTemplate),

		initialize: function(options) {
			this.device = options.device;
			this.render();
		},

		render: function() {
			var that = this;

			this.$el.html(this.template());

			this.$("#displayhistory").click(function() {
				displayHistory = $(this).is(":checked");
				that.fetchModules();
			}).click();
			this.tableSort = new TableSort(this.$("#modules").get(0));
			return this;
		},

		fetchModules: function() {
			var that = this;
			this.deviceModules = new DeviceModuleCollection({}, {
				device: this.device,
				includeHistory: displayHistory,
			});
			this.deviceModules.fetch().done(function() {
				that.renderModules();
			});
		},

		renderModuleLine: function(deviceModule) {
			this.htmlBuffer += this.moduleTemplate(deviceModule.toJSON());
		},

		renderModules: function() {
			var that = this;
			var $table = this.$("#modules tbody");
			this.htmlBuffer = "";
			this.deviceModules.each(this.renderModuleLine, this);
			$table.html(this.htmlBuffer);
			this.$(".history").toggle(displayHistory);
			this.tableSort.refresh();
		},

		destroy: function() {
			this.$el.empty();
		}

	});
});
