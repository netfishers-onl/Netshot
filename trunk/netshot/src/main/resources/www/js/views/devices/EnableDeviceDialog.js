/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'text!templates/devices/enableDevice.html'
], function($, _, Backbone, Dialog, DeviceModel, enableDeviceTemplate) {

	return Dialog.extend({

		template: _.template(enableDeviceTemplate),

		dialogOptions: {
			title: "Enable device",
		},

		buttons: {
			"Confirm": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();
				var device = {
					enabled: true
				};
				saveModel.save(device).done(function(data) {
					that.close();
					that.model.set(data);
					that.options.onEnabled();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText);
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});

			},
			"Cancel": function() {
				this.close();
			}
		},

	});
});
