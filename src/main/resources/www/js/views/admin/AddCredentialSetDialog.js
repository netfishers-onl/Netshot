/** Copyright 2013-2024 Netshot */
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

	return Dialog.extend({

		template: _.template(addCredentialSetTemplate),

		initialize: function() {
			var that = this;
			this.model = new CredentialSetModel();
			this.domains = new DomainCollection([]);
			this.domains.fetch().done(function() {
				that.render();
			});
		},

		dialogOptions: {
			title: "Add credentials",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var credentialSet = {
					name: that.$('#credentialsname').val(),
					type: that.$('input[name="credentialstype"]:checked').val(),
					username: that.$('#credentialsusername').val(),
					password: that.$('#credentialspassword').val(),
					superPassword: that.$('#credentialssuper').val(),
					community: that.$('#credentialscommunity').val(),
					authType: that.$('#credentialssnmpv3authtype').val(),
					authKey: that.$('#credentialssnmpv3authkey').val(),
					privType: that.$('#credentialssnmpv3privtype').val(),
					privKey: that.$('#credentialssnmpv3privkey').val(),
					publicKey: that.$('#credentialspublickey').val(),
					privateKey: that.$('#credentialsprivatekey').val()
				};
				var domain = that.$('#credentialsdomain').val();
				if (domain != 0) {
					credentialSet['mgmtDomain'] = {
						id: domain
					};
				}
				this.model.save(credentialSet).done(function(data) {
					that.close();
					that.options.onAdded();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});

			},
		},

		onCreate: function() {
			var that = this;
			this.$("input[name='credentialstype']").change(function() {
				if ($(this).val().match(/SNMP v(1|2)/)) {
					that.$('.nsadmin-credentialscli').hide();
					that.$('.nsadmin-credentialsclikey').hide();
					that.$('.nsadmin-credentialssnmpv3').hide();
					that.$('.nsadmin-credentialscommunity').show();
				}
				else if ($(this).val().match(/SNMP v3/)) {
					that.$('.nsadmin-credentialscommunity').hide();
					that.$('.nsadmin-credentialscli').hide();
					that.$('.nsadmin-credentialsclikey').hide();
					that.$('.nsadmin-credentialssnmpv3').show();
				}
				else if ($(this).val().match(/(SSH|Telnet)/)) {
					that.$('.nsadmin-credentialscommunity').hide();
					that.$('.nsadmin-credentialssnmpv3').hide();
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
			$('<option />').attr('value', 0).text("[Any]").appendTo(that
					.$('#credentialsdomain'));
			this.domains.each(function(domain) {
				$('<option />').attr('value', domain.get('id'))
						.text(domain.get('name')).appendTo(that.$('#credentialsdomain'));
			});
			$.each(CredentialSetModel.prototype.authTypes, function(index, authType) {
				$('<option />').attr('value', authType).text(authType).appendTo(that.$('#credentialssnmpv3authtype'));
			});
			$.each(CredentialSetModel.prototype.privTypes, function(index, privType) {
				$('<option />').attr('value', privType).text(privType).appendTo(that.$('#credentialssnmpv3privtype'));
			});
			this.$("#credentialsname").select();
		}

	});
});
