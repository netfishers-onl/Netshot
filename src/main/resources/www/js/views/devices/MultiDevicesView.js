/** Copyright 2013-2024 Netshot */
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
	'views/devices/RunDeviceScriptDialog',
	'views/devices/RunMultiDevicesDiagnosticsDialog'
], function($, _, Backbone, multiDevicesTemplate, EditMultiDevicesDialog,
		DeleteMultiDevicesDialog, DisableMultiDevicesDialog, EnableMultiDevicesDialog,
		TakeMultiDevicesSnapshotDialog, CheckMultiDevicesComplianceDialog,
		RunDeviceScriptDialog, RunMultiDevicesDiagnosticsDialog) {

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
			
			if (user.isExecuteReadWrite()) {
				this.$('#runscript').button({
					icons: {
						primary: "ui-icon-play"
					}
				}).click(function() {
					new RunDeviceScriptDialog({
						devices: that.getDevices(),
						deviceTypes: that.deviceTypes,
						onScheduled: function() {
							that.options.devicesView.fetchDevices();
						},
					});
					return false;
				});
			}
			else {
				this.$('#runscript').remove();
			}
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
			}
			else {
				this.$('#edit').remove();
				this.$("#delete").remove();
				this.$('#enable').remove();
				this.$('#disable').remove();
			}
			if (user.isOperator()) {
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
				this.$("#rundiagnostics").button({
					icons: {
						primary: "ui-icon-seek-next"
					}
				}).click(function() {
					new RunMultiDevicesDiagnosticsDialog({
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
