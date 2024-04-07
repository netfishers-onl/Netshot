/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/NewDeviceModel',
	'models/domain/DomainCollection',
	'models/credentials/CredentialSetModel',
	'views/tasks/MonitorTaskDialog',
	'views/devices/NoDomainDialog',
	'text!templates/devices/addDevice.html'
], function($, _, Backbone, Dialog, NewDeviceModel, DomainCollection, CredentialSetModel,
		MonitorTaskDialog, NoDomainDialog, addDeviceTemplate) {

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
			"Cancel": function() {
				this.close();
			},
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var autoDiscover = that.$('#autodiscover').is(":checked");
				var device = {
					autoDiscover: autoDiscover,
					ipAddress: that.$('#deviceip').val(),
					deviceType: that.$('#devicetype').val(),
					domainId: (that.$('#devicedomain').val() ? that.$('#devicedomain').val() : -1)
				};
				if (!autoDiscover) {
					if (that.$('#overrideconnectsettings').is(":checked")) {
						var fields = ["connectIpAddress", "sshPort", "telnetPort"];
						for (var f in fields) {
							var value = that.$('#device' + fields[f].toLowerCase()).val();
							if (value) {
								device[fields[f]] = value; 
							}
						}
					}
					var credentialSet = {
						name: "",
						type: that.$('input[name="credentialstype"]:checked').val(),
						username: that.$('#credentialsusername').val(),
						password: that.$('#credentialspassword').val(),
						superPassword: that.$('#credentialssuper').val(),
						publicKey: that.$('#credentialspublickey').val(),
						privateKey: that.$('#credentialsprivatekey').val()
					};
					if (credentialSet.type !== "Global") {
						var credentialModel = new CredentialSetModel();
						device.specificCredentialSet = credentialModel.cleanUp(credentialSet);
					}
				}
				that.model.save(device).done(function(data) {
					that.close();
					var monitorTaskDialog = new MonitorTaskDialog({
						taskId: data.id,
						delay: 1200
					});
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			}
		},

		onCreate: function() {
			var that = this;
			that.$('#autodiscover').change(function() {
				if (that.$('#autodiscover').is(":checked")) {
					that.$('#overrideconnectsettings').prop('checked', false).trigger('change');
					that.$('#devicetype').parent().hide();
					that.$('.nsdevices-autodiscoverimcompatible').hide();
				}
				else {
					that.$('#devicetype').parent().show();
					that.$('.nsdevices-autodiscoverimcompatible').show();
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
			that.$("input[name='credentialstype']").change(function() {
				if ($(this).val() === "Global") {
					that.$('.nsadmin-credentialscommunity').hide();
					that.$('.nsadmin-credentialscli').hide();
					that.$('.nsadmin-credentialsclikey').hide();
				}
				else if ($(this).val().match(/SNMP/)) {
					that.$('.nsadmin-credentialscommunity').show();
					that.$('.nsadmin-credentialscli').hide();
					that.$('.nsadmin-credentialsclikey').hide();
				}
				else if ($(this).val().match(/(SSH|Telnet)/)) {
					that.$('.nsadmin-credentialscommunity').hide();
					that.$('.nsadmin-credentialscli').show();
					if ($(this).val().match(/Key/)) {
						that.$('.nsadmin-credentialsclikey').show();
						that.$('.nsadmin-credentialsclinokey').hide();
					}
					else {
						that.$('.nsadmin-credentialsclikey').hide();
						that.$('.nsadmin-credentialsclinokey').show();
					}
				}
			}).eq(0).prop('checked', true).change();
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
