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
			this.$("input[name='credentialstype']").change(function() {
				if ($(this).val().match(/SNMP/)) {
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
			$('<option />').attr('value', 0).text("[Any]").appendTo(that
					.$('#credentialsdomain'));
			this.domains.each(function(domain) {
				$('<option />').attr('value', domain.get('id'))
						.text(domain.get('name')).appendTo(that.$('#credentialsdomain'));
			});
			this.$("#credentialsname").select();
		}

	});
});
