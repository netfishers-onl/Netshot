define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'text!templates/devices/disableDevice.html'
], function($, _, Backbone, Dialog, DeviceModel, disableDeviceTemplate) {

	var DisableDeviceDialog = Dialog.extend({

		template: _.template(disableDeviceTemplate),

		dialogOptions: {
			title: "Disable device",
		},

		buttons: {
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
					var error = $.parseJSON(data.responseText);
					this.$("#errormsg").text("Error: " + error.errorMsg);
					this.$("#error").show();
					$button.button('enable');
				});

			},
			"Cancel": function() {
				this.close();
			}
		},

	});
	return DisableDeviceDialog;
});
