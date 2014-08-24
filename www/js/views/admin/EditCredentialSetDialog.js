define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/credentials/CredentialSetModel',
	'models/domain/DomainCollection',
	'text!templates/admin/addCredentialSet.html'
], function($, _, Backbone, Dialog, CredentialSetModel, DomainCollection,
		addCredentialSetTemplate) {

	var EditCredentialSetDialog = Dialog.extend({

		template: _.template(addCredentialSetTemplate),

		initialize: function() {
			var that = this;
			this.domains = new DomainCollection([]);
			this.domains.fetch().done(function() {
				that.render();
			});
		},

		dialogOptions: {
			title: "Edit credentials",
		},

		buttons: {
			"Save": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();
				var credentialSet = {
					name: that.$('#credentialsname').val(),
					type: that.$('input[name="credentialstype"]:checked').val(),
					username: that.$('#credentialsusername').val(),
					password: that.$('#credentialspassword').val(),
					superPassword: that.$('#credentialssuper').val(),
					community: that.$('#credentialscommunity').val()
				};
				var domain = that.$('#credentialsdomain').val();
				if (domain != 0) {
					credentialSet['mgmtDomain'] = {
						id: domain
					};
				}
				saveModel.save(credentialSet).done(function(data) {
					that.close();
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

			that.$('input[value="' + that.model.get('type') + '"]')
					.prop('checked', true);
			that.$('input[type="radio"]').prop('disabled', true);
			if (that.model.get('type').match(/Snmp/)) {
				that.$('.nsadmin-credentialscommunity').show();
				that.$('.nsadmin-credentialscli').hide();
			}
			else if (that.model.get('type').match(/(Ssh|Telnet)/)) {
				that.$('.nsadmin-credentialscommunity').hide();
				that.$('.nsadmin-credentialscli').show();
			}
			$('<option />').attr('value', 0).text("[Any]").appendTo(that
					.$('#credentialsdomain'));
			this.domains.each(function(domain) {
				$('<option />').attr('value', domain.get('id'))
						.text(domain.get('name')).appendTo(that.$('#credentialsdomain'));
			});
			var domain = that.model.get('mgmtDomain');
			if (typeof (domain) == "object") {
				that.$('#credentialsdomain').val(domain.id);
			}
		},

	});
	return EditCredentialSetDialog;
});
