/** Copyright 2013-2014 NetFishers */
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
					type: that.$('input[name="credentialstype"]:checked').val()
				};
				if (credentialSet.type.match(/(SSH|Telnet)/)) {
					credentialSet.username = that.$('#credentialsusername').val();
					credentialSet.password = that.$('#credentialspassword').val();
					credentialSet.superPassword = that.$('#credentialssuper').val();
					if (credentialSet.type.match(/Key/)) {
						credentialSet.publicKey = that.$('#credentialspublickey').val();
						credentialSet.privateKey = that.$('#credentialsprivatekey').val();
					}
				}
				else if (credentialSet.type.match(/SNMP/)) {
					credentialSet.community = that.$('#credentialscommunity').val();
					
				}
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
			if (that.model.get('type').match(/SNMP/)) {
				that.$('.nsadmin-credentialscommunity').show();
				that.$('.nsadmin-credentialscli').hide();
				that.$('.nsadmin-credentialsclikey').hide();
			}
			else if (that.model.get('type').match(/(SSH|Telnet)/)) {
				that.$('.nsadmin-credentialscommunity').hide();
				that.$('.nsadmin-credentialscli').show();
				if (that.model.get('type').match(/Key/)) {
					that.$('.nsadmin-credentialsclikey').show();
					that.$('.nsadmin-credentialsclinokey').hide();
				}
				else {
					that.$('.nsadmin-credentialsclikey').hide();
					that.$('.nsadmin-credentialsclinokey').show();
				}
			}
			$('<option />').attr('value', 0).text("[Any]").appendTo(that
					.$('#credentialsdomain'));
			this.domains.each(function(domain) {
				$('<option />').attr('value', domain.get('id'))
						.text(domain.get('name')).appendTo(that.$('#credentialsdomain'));
			});
			var domain = that.model.get('mgmtDomain');
			if (typeof domain === "object" && domain) {
				that.$('#credentialsdomain').val(domain.id);
			}
			this.$("#credentialsname").select();
		},

	});
});
