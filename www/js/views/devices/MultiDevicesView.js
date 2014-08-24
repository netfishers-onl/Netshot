define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/devices/multiDevices.html',
	'views/devices/EditMultiDevicesDialog',
	'views/devices/DeleteMultiDevicesDialog',
	'views/devices/DisableMultiDevicesDialog',
	'views/devices/EnableMultiDevicesDialog',
	'views/devices/TakeMultiDevicesSnapshotDialog',
	'views/devices/CheckMultiDevicesComplianceDialog'
], function($, _, Backbone, multiDevicesTemplate, EditMultiDevicesDialog,
		DeleteMultiDevicesDialog, DisableMultiDevicesDialog, EnableMultiDevicesDialog,
		TakeMultiDevicesSnapshotDialog, CheckMultiDevicesComplianceDialog) {

	var MultiDevicesView = Backbone.View.extend({

		el: "#nsdevices-device",

		template: _.template(multiDevicesTemplate),

		currentView: null,

		initialize: function(options) {
			var that = this;
		},
		
		getDeviceItems: function() {
			return this.options.devicesView.$("#nsdevices-listbox>ul li.active");
		},
		
		getDevices: function() {
			var that = this;
			var devices = [];
			this.getDeviceItems().each(function() {
				devices.push(that.options.devicesView.devices.get($(this).data('device-id')));
			});
			return devices;
		},
		
		render: function() {
			var that = this;

			this.$el.html(this.template({
				selectedDeviceNumber: this.getDeviceItems().length
			}));
			
			if (user.isAdmin()) {
				this.$('#edit').button({
					icons: {
						primary: "ui-icon-wrench"
					}
				}).click(function() {
					var editDevices = new EditMultiDevicesDialog({
						devices: that.getDevices(),
						onEdited: function() {
							that.options.devicesView.fetchDevices();
						}
					});
					return false;
				});
				this.$("#delete").button({
					icons: {
						primary: "ui-icon-trash"
					}
				}).click(function() {
					var deleteDevices = new DeleteMultiDevicesDialog({
						devices: that.getDevices(),
						onDeleted: function() {
							that.options.devicesView.fetchDevices();
						}
					});
					return false;
				});
				this.$('#enable').button({
					icons: {
						primary: "ui-icon-power"
					}
				}).click(function() {
					var enableDevices = new EnableMultiDevicesDialog({
						devices: that.getDevices(),
						onEnabled: function() {
							that.options.devicesView.fetchDevices();
						}
					});
					return false;
				});
				this.$('#disable').button({
				}).click(function() {
					var disableDevices = new DisableMultiDevicesDialog({
						devices: that.getDevices(),
						onDisabled: function() {
							that.options.devicesView.fetchDevices();
						}
					});
					return false;
				}).parent().buttonset();
				this.$('#snapshot').button({
					icons: {
						primary: "ui-icon ui-icon-arrowreturnthick-1-e"
					}
				}).click(function() {
					new TakeMultiDevicesSnapshotDialog({
						devices: that.getDevices(),
						onScheduled: function() {
							that.options.devicesView.fetchDevices();
						}
					});
					return false;
				});
				this.$("#checkcompliance").button({
					icons: {
						primary: "ui-icon-circle-check"
					}
				}).click(function() {
					new CheckMultiDevicesComplianceDialog({
						devices: that.getDevices(),
						onScheduled: function() {
							that.options.devicesView.fetchDevices();
						}
					});
					return false;
				});
			}
			else {
				this.$('#edit').remove();
				this.$('#delete').remove();
				this.$('#enable').remove();
				this.$('#disable').remove();
				this.$('#snapshot').remove();
				this.$('#checkcompliance').remove();
			}
		},
		
		destroy: function() {
			this.$el.empty();
		}

	});
	return MultiDevicesView;
});
