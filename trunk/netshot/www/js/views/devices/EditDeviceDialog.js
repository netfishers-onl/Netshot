define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceModel',
	'text!templates/devices/editDevice.html',
	'text!templates/devices/editCredentialDevice.html',
	'models/credentials/CredentialSetCollection',
	'models/domain/DomainCollection'
], function($, _, Backbone, Dialog, DeviceModel, editDeviceTemplate,
		editCredentialDeviceTemplate, CredentialSetCollection, DomainCollection) {

	var EditDeviceDialog = Dialog.extend({

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
				that.$('#devicecredentials input:checked').each(function() {
					device.credentialSetIds.push($(this).prop('name')
							.replace("credentialset", ""));
				});
				saveModel.save(device).done(function(data) {
					that.close();
					that.model.set(data);
					that.options.onEdited();
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
			this.credentialSets.each(function(credentialSet) {
				var model = credentialSet.toJSON();
				model['inUse'] = $.inArray(credentialSet.get("id"), that.model
						.get("credentialSetIds")) > -1;
				that.$("#devicecredentials").append(that.credentialTemplate(model));
			});
			this.domains.each(function(domain) {
				$('<option />').attr('value', domain.get('id'))
					.text(domain.get('name')).appendTo(that.$('#devicedomain'));
			});
			this.$('#devicedomain').val(this.model.get('mgmtDomain').id);
		}

	});
	return EditDeviceDialog;
});
