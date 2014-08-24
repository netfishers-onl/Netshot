define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/NewDeviceModel',
	'models/device/DeviceTypeCollection',
	'models/domain/DomainCollection',
	'views/tasks/MonitorTaskDialog',
	'text!templates/devices/addDevice.html'
], function($, _, Backbone, Dialog, NewDeviceModel, DeviceTypeCollection,
		DomainCollection, MonitorTaskDialog, addDeviceTemplate) {

	var AddDeviceDialog = Dialog.extend({

		template: _.template(addDeviceTemplate),

		initialize: function() {
			var that = this;
			var onDataHandler = function() {
				that.render();
			}
			this.model = new NewDeviceModel();
			this.deviceTypes = new DeviceTypeCollection([]);
			this.domains = new DomainCollection([]);
			$.when(that.deviceTypes.fetch(), that.domains.fetch())
					.done(onDataHandler);
		},

		dialogOptions: {
			title: "Add device",
		},

		buttons: {
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				that.model.save({
					autoDiscover: that.$('#autodiscover').is(":checked"),
					ipAddress: that.$('#deviceip').val(),
					deviceType: that.$('#devicetype').val(),
					domainId: that.$('#devicedomain').val(),
				}).done(function(data) {
					that.close();
					var monitorTaskDialog = new MonitorTaskDialog({
						taskId: data.id,
						delay: 1200
					});
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

		onCreate: function() {
			var that = this;
			that.$('#autodiscover').change(function() {
				if (that.$('#autodiscover').is(":checked")) {
					that.$('#devicetype').prev().addBack().hide();
				}
				else {
					that.$('#devicetype').prev().addBack().show();
				}
			}).prop('checked', true).trigger('change');
			_.each(this.deviceTypes.models, function(deviceType) {
				$('<option />').attr('value', deviceType.get('name')).text(deviceType
						.get('description')).appendTo(that.$('#devicetype'));
			});
			_.each(this.domains.models, function(domain) {
				$('<option />').attr('value', domain.get('id'))
						.text(domain.get('name')).appendTo(that.$('#devicedomain'));
			});
		}

	});
	return AddDeviceDialog;
});
