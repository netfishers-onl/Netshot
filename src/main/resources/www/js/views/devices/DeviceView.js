/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/devices/device.html',
	'views/devices/DeleteDeviceDialog',
	'views/devices/EditDeviceDialog',
	'views/devices/DeviceGeneralView',
	'views/devices/DeviceConfigsView',
	'views/devices/DeviceInterfacesView',
	'views/devices/DeviceModulesView',
	'views/devices/DeviceDiagnosticsView',
	'views/devices/DeviceComplianceView',
	'views/devices/DeviceTasksView',
	'views/devices/DisableDeviceDialog',
	'views/devices/EnableDeviceDialog',
	'views/devices/TakeDeviceSnapshotDialog',
	'views/devices/RunDeviceScriptDialog'
], function($, _, Backbone, deviceTemplate, DeleteDeviceDialog,
		EditDeviceDialog, DeviceGeneralView, DeviceConfigsView,
		DeviceInterfacesView, DeviceModulesView, DeviceDiagnosticsView,
		DeviceComplianceView, DeviceTasksView, DisableDeviceDialog,
		EnableDeviceDialog, TakeDeviceSnapshotDialog, RunDeviceScriptDialog) {

	var DeviceView = Backbone.View.extend({

		el: "#nsdevices-device",

		template: _.template(deviceTemplate),

		currentView: null,

		initialize: function(options) {
			var that = this;
			this.deviceTypes = options.deviceTypes;
		},

		refresh: function() {
			var that = this;
			this.model.fetch().done(function() {
				that.render();
				that.options.onEdited();
			});
		},

		render: function() {
			var that = this;

			this.$el.html(this.template(this.model.toJSON()));

			this.$('#refresh').button({
				icons: {
					primary: "ui-icon-refresh"
				},
				text: false
			}).click(function() {
				$(this).button('disable');
				that.refresh();
			});
			this.$('#tabs').buttonset().change(function() {
				if (this.currentView != null) {
					this.currentView.destroy();
				}
				DeviceView.savedTab = that.$('#tabs :radio:checked').attr('id');
				switch (DeviceView.savedTab) {
				case "general":
					this.currentView = new DeviceGeneralView({
						deviceTypes: that.deviceTypes,
						device: that.model
					});
					break;
				case "configs":
					this.currentView = new DeviceConfigsView({
						deviceTypes: that.deviceTypes,
						device: that.model
					});
					break;
				case "interfaces":
					this.currentView = new DeviceInterfacesView({
						device: that.model
					});
					break;
				case "modules":
					this.currentView = new DeviceModulesView({
						device: that.model
					});
					break;
				case "diagnostics":
					this.currentView = new DeviceDiagnosticsView({
						device: that.model
					});
					break;
				case "compliance":
					this.currentView = new DeviceComplianceView({
						device: that.model
					});
					break;
				case "tasks":
					this.currentView = new DeviceTasksView({
						device: that.model
					});
					break;
				}

			});
			this.$('#general').button({
				icons: {
					primary: "ui-icon-home"
				}
			});
			this.$('#configs').button({
				icons: {
					primary: "ui-icon-script"
				}
			});
			this.$('#interfaces').button({
				icons: {
					primary: "ui-icon-transferthick-e-w"
				}
			});
			this.$('#modules').button({
				icons: {
					primary: "ui-icon-puzzle"
				}
			});
			this.$('#diagnostics').button({
				icons: {
					primary: "ui-icon-clipboard"
				}
			});
			this.$('#compliance').button({
				icons: {
					primary: "ui-icon-check"
				}
			});
			this.$('#tasks').button({
				icons: {
					primary: "ui-icon-clock"
				}
			});
			if (user.isExecuteReadWrite()) {
				this.$('#runscript').button({
					icons: {
						primary: "ui-icon ui-icon-play"
					},
					text: false
				}).click(function() {
					var runDeviceScriptDialog = new RunDeviceScriptDialog({
						device: that.model,
						deviceTypes: that.deviceTypes,
					});
				});
			}
			else {
				this.$('#runscript').remove();
			}
			if (user.isReadWrite()) {
				this.$('#edit').button({
					icons: {
						primary: "ui-icon-wrench"
					},
					text: false
				}).click(function() {
					var editDialog = new EditDeviceDialog({
						model: that.model,
						onEdited: function() {
							that.refresh();
							//that.options.onEdited(); // called by refresh();
						}
					});
				});
				this.$("#delete").button({
					icons: {
						primary: "ui-icon-trash"
					},
					text: false
				}).click(function() {
					var deleteDialog = new DeleteDeviceDialog({
						model: that.model,
						onDeleted: function() {
							Backbone.history.navigate("/devices/");
							that.options.onDeleted();
							that.destroy();
						}
					});
				});
				this.$('#enable').button({
					icons: {
						primary: "ui-icon-power"
					},
					text: false
				});
				if (this.model.get('status') == "INPRODUCTION") {
					this.$('#enable').prop('checked', true).button('refresh')
							.change(function(e) {
								var disableDialog = new DisableDeviceDialog({
									model: that.model,
									onDisabled: function() {
										that.refresh();
										that.options.onEdited();
									}
								});
								$(this).prop('checked', true).button('refresh');
								return false;
							});
				}
				else {
					this.$('#enable').change(function(e) {
						var enableDialog = new EnableDeviceDialog({
							model: that.model,
							onEnabled: function() {
								that.refresh();
								that.options.onEdited();
							}
						});
						$(this).prop('checked', false).button('refresh');
						return false;
					});
				}
			}
			else {
				this.$('#edit').remove();
				this.$('#delete').remove();
				this.$('#enable').next().addBack().remove();
			}
			if (user.isOperator()) {
				this.$('#snapshot').button({
					icons: {
						primary: "ui-icon ui-icon-arrowreturnthick-1-e"
					}
				}).click(function() {
					var takeDeviceSnapshotDialog = new TakeDeviceSnapshotDialog({
						model: that.model
					});
				});
			}
			else {
				this.$('#snapshot').remove();
			}
			if (DeviceView.savedTab) {
				this.$("#tabs #" + DeviceView.savedTab).prop('checked', true);
				this.$("#tabs").buttonset('refresh');
			}
			this.$('#tabs').trigger('change');

			Backbone.history.navigate("/devices/" + this.model.get('id'));

			return this;
		},

		destroy: function() {
			this.$('#tabs').buttonset('destroy');
			this.$('#edit').button('destroy');
			this.$("#delete").button('destroy');
			this.$('#enabled').button('destroy');
			this.$('#snapshot').button('destroy');
			this.$el.empty();
		}

	});
	return DeviceView;
});
