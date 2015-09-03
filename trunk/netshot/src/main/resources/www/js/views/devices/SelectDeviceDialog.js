/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceCollection',
	'text!templates/devices/selectDevice.html',
	'text!templates/devices/selectDeviceListItem.html',
], function($, _, Backbone, Dialog, DeviceCollection, selectDeviceTemplate,
		selectDeviceListItemTemplate) {

	return Dialog.extend({

		el: "#nsdialog-child",

		template: _.template(selectDeviceTemplate),
		deviceListItemTemplate: _.template(selectDeviceListItemTemplate),

		dialogOptions: {
			title: "Select device",
			width: "300px"
		},

		initialize: function() {
			var that = this;
			this.render();
		},

		buttons: {
			"Select": function(event) {
				var that = this;
				that.close();
				that.options.onSelected(this.device);
			},
			"Cancel": function() {
				this.close();
			}

		},

		disableSelectButton: function() {
			this.dialogButtons().eq(0).button('disable');
		},

		enableSelectButton: function() {
			this.dialogButtons().eq(0).button('enable');
		},

		onCreate: function() {
			var that = this;
			this.disableSelectButton();

			this.$('#devicesearch').keydown(function(e) {
				if (e.which == 13) {
					that.$("#error").hide();
					that.disableSelectButton();
					that.device = null;
					that.searchedDevices = new DeviceCollection({});
					that.searchedDevices.filter.type = "simple";
					that.searchedDevices.filter.text = that.$('#devicesearch').val();
					that.searchedDevices.fetch().done(function() {
						that.renderSearchedDevices();
					}).fail(function(data) {
						var error = $.parseJSON(data.responseText);
						that.$("#errormsg").text("Error: " + error.errorMsg);
						that.$("#error").show();
					});
					e.preventDefault();
					return false;
				}
			});
		},

		renderSearchedDevices: function() {
			var that = this;
			this.htmlBuffer = "";
			this.searchedDevices.each(this.renderSearchedDeviceListItem, this);
			this.$("#alldevices>ul").html(this.htmlBuffer);
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
				var id = $(this).data('device-id');
				that.device = that.searchedDevices.get(id);
				that.enableSelectButton();
			});
		},

		renderSearchedDeviceListItem: function(device) {
			this.htmlBuffer += this.deviceListItemTemplate(device.toJSON());
		},

	});
});
