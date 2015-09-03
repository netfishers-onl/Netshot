/** Copyright 2013-2014 NetFishers */
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
	'views/devices/CheckMultiDevicesComplianceDialog',
	'views/devices/RunMultiDevicesScriptDialog'
], function($, _, Backbone, multiDevicesTemplate, EditMultiDevicesDialog,
		DeleteMultiDevicesDialog, DisableMultiDevicesDialog, EnableMultiDevicesDialog,
		TakeMultiDevicesSnapshotDialog, CheckMultiDevicesComplianceDialog,
		RunMultiDevicesScriptDialog) {

	return Backbone.View.extend({

		el: "#nsdevices-device",

		template: _.template(multiDevicesTemplate),

		currentView: null,

		initialize: function(options) {
			var that = this;
			this.deviceTypes = options.deviceTypes;
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
			
			if (user.isReadWrite()) {
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
				this.$('#runscript').button({
					icons: {
						primary: "ui-icon-play"
					}
				}).click(function() {
					new RunMultiDevicesScriptDialog({
						devices: that.getDevices(),
						deviceTypes: that.deviceTypes,
						onScheduled: function() {
							that.options.devicesView.fetchDevices();
						}
					});
					return false;
				});
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
				this.$('#nsdevices-multidevices-actions').remove();
			}
		},
		
		destroy: function() {
			this.$el.empty();
		}

	});
});
