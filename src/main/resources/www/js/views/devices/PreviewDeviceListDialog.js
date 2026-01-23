/** Copyright 2013-2025 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceCollection',
	'text!templates/devices/previewDeviceList.html',
	'text!templates/devices/previewDeviceListItem.html',
], function($, _, Backbone, Dialog, DeviceCollection, previewDeviceListTemplate,
		previewDeviceListItemTemplate) {

	return Dialog.extend({

		el: "#nsdialog-child",

		template: _.template(previewDeviceListTemplate),
		deviceListItemTemplate: _.template(previewDeviceListItemTemplate),

		dialogOptions: {
			title: "Device list",
			width: "400px"
		},

		initialize: function(options) {
			var that = this;
			this.devices = options.devices || [];
			this.render();
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
		},

		onCreate: function() {
			var that = this;
			this.renderDevices();
		},

		renderDevices: function() {
			var that = this;
			this.$("#summary #count").text(this.devices.length);
			this.htmlBuffer = "";
			this.devices.each(this.renderDeviceListItem, this);
			this.$("#alldevices>ul").html(this.htmlBuffer);
			this.$(".placeholder").toggle(this.devices.length === 0);
			this.$("#alldevices>ul li").mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function() {
				$(this).closest('ul').find('li').removeClass("active");
				$(this).addClass("active");
			});
		},

		renderDeviceListItem: function(device) {
			this.htmlBuffer += this.deviceListItemTemplate(device.toJSON());
		},

	});
});
