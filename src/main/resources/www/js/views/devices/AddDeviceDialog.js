/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/NewDeviceModel',
	'models/domain/DomainCollection',
	'views/tasks/MonitorTaskDialog',
	'views/devices/NoDomainDialog',
	'text!templates/devices/addDevice.html'
], function($, _, Backbone, Dialog, NewDeviceModel,
		DomainCollection, MonitorTaskDialog, NoDomainDialog,
		addDeviceTemplate) {

	return Dialog.extend({

		template: _.template(addDeviceTemplate),

		initialize: function(options) {
			var that = this;
			this.model = new NewDeviceModel();
			this.deviceTypes = options.deviceTypes;
			this.domains = new DomainCollection([]);
			this.domains.fetch().done(function() {
				if (that.domains.length == 0) {
					new NoDomainDialog();
				}
				else {
					that.render();	
				}
			});
		},

		dialogOptions: {
			title: "Add device",
		},

		buttons: {
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var device = {
					autoDiscover: that.$('#autodiscover').is(":checked"),
					ipAddress: that.$('#deviceip').val(),
					deviceType: that.$('#devicetype').val(),
					domainId: (that.$('#devicedomain').val() ? that.$('#devicedomain').val() : -1)
				};
				if (that.$('#overrideconnectsettings').is(":checked")) {
					var fields = ["connectIpAddress", "sshPort", "telnetPort"];
					for (var f in fields) {
						var value = that.$('#device' + fields[f].toLowerCase()).val();
						if (value) {
							device[fields[f]] = value; 
						}
					}
				}
				that.model.save(device).done(function(data) {
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
					that.$('#overrideconnectsettings').prop('checked', false).trigger('change');
					that.$('#devicetype').parent().hide();
					that.$('#deviceconnectionsettings').parent().hide();
				}
				else {
					that.$('#devicetype').parent().show();
					that.$('#deviceconnectionsettings').parent().show();
				}
			}).prop('checked', true).trigger('change');
			that.$('#overrideconnectsettings').change(function() {
				if (that.$('#overrideconnectsettings').is(":checked")) {
					that.$('#deviceconnectionsettings').show();
				}
				else {
					that.$('#deviceconnectionsettings').hide();
				}
			}).prop('checked', false).trigger('change');
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
});
