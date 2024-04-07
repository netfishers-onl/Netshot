/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'text!templates/devices/disableDevice.html'
], function($, _, Backbone, Dialog, DeviceModel, disableDeviceTemplate) {

	return Dialog.extend({

		template: _.template(disableDeviceTemplate),

		dialogOptions: {
			title: "Disable device",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Confirm": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();
				var device = {
					enabled: false
				};
				saveModel.save(device).done(function(data) {
					that.close();
					that.model.set(data);
					that.options.onDisabled();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					this.$("#errormsg").text("Error: " + error.errorMsg);
					this.$("#error").show();
					$button.button('enable');
				});
			},
		},

	});
});
