define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'text!templates/devices/disableMultiDevices.html'
], function($, _, Backbone, Dialog, DeviceModel, disableMultiDevicesTemplate) {

	var DisableMultiDevicesDialog = Dialog.extend({

		template: _.template(disableMultiDevicesTemplate),

		dialogOptions: {
			title: "Disable devices",
		},
		
		templateData: function() {
			return {
				number: this.options.devices.length
			};
		},

		buttons: {
			"Confirm": function(event) {
				var that = this;
				that.$('button').button('disable');
				var $button = $(event.target).closest('button');
				var $buttons = $(event.target).closest(".ui-dialog").find('button');
				$buttons.button('disable');
				that.$el.on('dialogbeforeclose', function() {
					return false;
				});
				that.$('#bar').css('width', '0%');
				that.$('#status').show();
				var devices = that.options.devices;
				var total = devices.length;
				var device;
				
				var startNext = function() {
					if (devices.length === 0) {
						that.close();
						that.options.onDisabled();
						return;
					}
					device = devices.pop();
					device.save({
						enabled: false
					}).done(function(data) {
						that.$('#bar').css('width', (100 * (1 - devices.length / total)) + '%');
						startNext();
					}).fail(function(data) {
						var error = $.parseJSON(data.responseText);
						that.$("#errormsg").text("Error processing " + device.get('name') + ": " + error.errorMsg);
						that.$("#error").show();
						$buttons.button('enable');
						$button.button('disable');
						that.$el.off('dialogbeforeclose');
					});
				};
				startNext();
			},
			"Cancel": function() {
				this.close();
			}
		}

	});
	return DisableMultiDevicesDialog;
});
