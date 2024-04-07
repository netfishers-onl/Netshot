/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'models/credentials/CredentialSetModel',
	'text!templates/devices/editDevice.html',
	'text!templates/devices/editCredentialDevice.html',
	'models/credentials/CredentialSetCollection',
	'models/domain/DomainCollection'
], function($, _, Backbone, Dialog, DeviceModel, CredentialSetModel, editDeviceTemplate,
		editCredentialDeviceTemplate, CredentialSetCollection, DomainCollection) {

	return Dialog.extend({

		template: _.template(editDeviceTemplate),
		credentialTemplate: _.template(editCredentialDeviceTemplate),

		initialize: function() {
			var that = this;
			this.credentialSets = new CredentialSetCollection([]);
			this.domains = new DomainCollection([]);
			$.when(that.credentialSets.fetch(), that.domains.fetch())
					.done(function() {
				that.render();
			});
		},

		dialogOptions: {
			title: "Edit device",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Save": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();
				var device = {
					'ipAddress': that.$('#deviceipaddress').val(),
					'comments': that.$('#devicecomments').val(),
					'autoTryCredentials': that.$('#autotrycredentials').is(":checked"),
					'credentialSetIds': [],
					'mgmtDomain': that.$('#devicedomain').val()
				};
				var fields = ["connectIpAddress", "sshPort", "telnetPort"];
				for (var f in fields) {
					var value = that.$('#device' + fields[f].toLowerCase()).val();
					if (value && that.$('#overrideconnectsettings').is(":checked")) {
						device[fields[f]] = value; 
					}
					else {
						device[fields[f]] = "";
					}
				}
				that.$('#devicecredentials input:checked').each(function() {
					device.credentialSetIds.push($(this).prop('name')
							.replace("credentialset", ""));
				});
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
				saveModel.save(device).done(function(data) {
					that.close();
					that.model.set(data);
					that.options.onEdited();
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
			var overrideConnectSettings = !!(this.model.get('connectAddress') || this.model.get('sshPort') || this.model.get('telnetPort'));
			that.$('#overrideconnectsettings').change(function() {
				if (that.$('#overrideconnectsettings').is(":checked")) {
					that.$('#deviceconnectionsettings').show();
				}
				else {
					that.$('#deviceconnectionsettings').hide();
				}
			}).prop('checked', overrideConnectSettings).trigger('change');
			this.credentialSets.each(function(credentialSet) {
				var model = credentialSet.toJSON();
				model['inUse'] = $.inArray(credentialSet.get("id"), that.model
						.get("credentialSetIds")) > -1;
				that.$("#devicecredentials").append(that.credentialTemplate(model));
			});
			that.$("input[name='credentialstype']").change(function() {
				if ($(this).val() === "Global") {
					that.$('#globalcredentials').show();
					that.$('.nsadmin-credentialscommunity').hide();
					that.$('.nsadmin-credentialscli').hide();
					that.$('.nsadmin-credentialsclikey').hide();
				}
				else if ($(this).val().match(/SNMP/)) {
					that.$('#globalcredentials').hide();
					that.$('.nsadmin-credentialscommunity').show();
					that.$('.nsadmin-credentialscli').hide();
					that.$('.nsadmin-credentialsclikey').hide();
				}
				else if ($(this).val().match(/(SSH|Telnet)/)) {
					that.$('#globalcredentials').hide();
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
			});
			var credentialSet = that.model.get('specificCredentialSet');
			if (credentialSet) {
				that.$('input[value="' + credentialSet.type + '"]').prop('checked', true).change();
			}
			else {
				that.$('#credentialstypecommon').prop('checked', true).change();
			}
			that.$("input[name='credentialstype']").change(function() {
				that.$('#credentialsusername').val("");
				that.$('#credentialspassword').val("");
				that.$('#credentialssuper').val("");
				that.$('#credentialspublickey').val("");
				that.$('#credentialsprivatekey').val("");
			});
			
			this.domains.each(function(domain) {
				$('<option />').attr('value', domain.get('id'))
					.text(domain.get('name')).appendTo(that.$('#devicedomain'));
			});
			this.$('#devicedomain').val(this.model.get('mgmtDomain').id);
		}

	});
});
