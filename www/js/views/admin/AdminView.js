define([
	'jquery',
	'underscore',
	'backbone',
	'models/domain/DomainCollection',
	'views/admin/AddDomainDialog',
	'views/admin/EditDomainDialog',
	'views/admin/DeleteDomainDialog',
	'models/credentials/CredentialSetCollection',
	'views/admin/AddCredentialSetDialog',
	'views/admin/EditCredentialSetDialog',
	'views/admin/DeleteCredentialSetDialog',
	'models/user/UserCollection',
	'views/admin/AddUserDialog',
	'views/admin/EditUserDialog',
	'views/admin/DeleteUserDialog',
	'views/admin/AboutDialog',
	'text!templates/admin/admin.html',
	'text!templates/admin/adminToolBar.html',
	'text!templates/admin/domain.html',
	'text!templates/admin/credentials.html',
	'text!templates/admin/user.html'
], function($, _, Backbone, DomainCollection, AddDomainDialog,
		EditDomainDialog, DeleteDomainDialog, CredentialSetCollection,
		AddCredentialSetDialog, EditCredentialSetDialog, DeleteCredentialSetDialog,
		UserCollection, AddUserDialog, EditUserDialog, DeleteUserDialog,
		AboutDialog, adminTemplate, adminToolbarTemplate, domainRowTemplate,
		credentialsRowTemplate, userRowTemplate) {

	makeLoadProgress(15);

	var AdminView = Backbone.View.extend({

		el: $("#page"),

		template: _.template(adminTemplate),
		domainTemplate: _.template(domainRowTemplate),
		credentialsTemplate: _.template(credentialsRowTemplate),
		userTemplate: _.template(userRowTemplate),

		domains: new DomainCollection([]),
		credentialSets: new CredentialSetCollection([]),
		users: new UserCollection([]),

		initialize: function() {
			var that = this;
		},

		render: function() {
			var that = this;
			$('#nstoolbar-admin').prop('checked', true);
			$('#nstoolbarpages').buttonset('refresh');

			this.$el.html(this.template);

			this.refreshUsers();
			this.refreshDomains();
			this.refreshCredentials();

			this.$('#nsadmin-adduser').button({
				'icons': {
					'primary': "ui-icon-plusthick"
				},
			}).click(function() {
				var addUserDialog = new AddUserDialog({
					onAdded: function() {
						that.refreshUsers();
					}
				});
				return false;
			});

			this.$('#nsadmin-adddomain').button({
				'icons': {
					'primary': "ui-icon-plusthick"
				},
			}).click(function() {
				var addDomainDialog = new AddDomainDialog({
					onAdded: function() {
						that.refreshDomains();
					}
				});
				return false;
			});

			this.$('#nsadmin-addcredentials').button({
				'icons': {
					'primary': "ui-icon-plusthick"
				},
			}).click(function() {
				var addCredentialSetDialog = new AddCredentialSetDialog({
					onAdded: function() {
						that.refreshCredentials();
					}
				});
				return false;
			});

			$('#nstoolbar-section').html(_.template(adminToolbarTemplate));
			$('#nstoolbar-section button').button();
			$('#nstoolbar-admin-about').unbind('click').click(function() {
				var aboutDialog = new AboutDialog();
			});
			return this;
		},

		refreshDomains: function() {
			var that = this;
			this.domains.reset();
			this.domains.fetch().done(function() {
				var $table = that.$el.find('#nsadmin-domains table tbody');
				$table.empty();
				that.domains.each(function(domain) {
					var $row = $(that.domainTemplate(domain.toJSON())).appendTo($table);
					$row.find('.edit').button({
						'icons': {
							'primary': "ui-icon-wrench"
						},
						'text': false,
					}).click({
						domain: domain
					}, function(e) {
						var editDomainDialog = new EditDomainDialog({
							onEdited: function() {
								that.refreshDomains();
								that.refreshCredentials();
							},
							model: e.data.domain
						});
					});
					$row.find('.delete').button({
						'icons': {
							'primary': "ui-icon-trash"
						},
						'text': false,
					}).click({
						domain: domain
					}, function(e) {
						var deleteDomainDialog = new DeleteDomainDialog({
							onDeleted: function() {
								that.refreshDomains();
								that.refreshCredentials();
							},
							model: e.data.domain
						});
					});
				});
			});
		},

		refreshCredentials: function() {
			var that = this;
			this.credentialSets.reset();
			this.credentialSets.fetch().done(function() {
				var $table = that.$el.find('#nsadmin-credentials table tbody');
				$table.empty();
				that.credentialSets.each(function(credentialSet) {
					var $row = $(that.credentialsTemplate(credentialSet.toJSON()))
							.appendTo($table);
					$row.find('.edit').button({
						'icons': {
							'primary': "ui-icon-wrench"
						},
						'text': false,
					}).click({
						credentialSet: credentialSet
					}, function(e) {
						var editCredentialSetDialog = new EditCredentialSetDialog({
							onEdited: function() {
								that.refreshCredentials();
							},
							model: e.data.credentialSet
						});
					});
					$row.find('.delete').button({
						'icons': {
							'primary': "ui-icon-trash"
						},
						'text': false,
					}).click({
						credentialSet: credentialSet
					}, function(e) {
						var deleteCredentialSetDialog = new DeleteCredentialSetDialog({
							onDeleted: function() {
								that.refreshCredentials();
							},
							model: e.data.credentialSet
						});
					});
				});
			});
		},

		refreshUsers: function() {
			var that = this;
			this.users.fetch().done(function() {
				var $table = that.$('#nsadmin-users table tbody');
				$table.empty();
				that.users.each(function(user) {
					var $row = $(that.userTemplate(user.toJSON())).appendTo($table);
					$row.find('.edit').button({
						'icons': {
							'primary': "ui-icon-wrench"
						},
						'text': false,
					}).click({
						user: user
					}, function(e) {
						var model = e.data.user;
						model.set('password', '-');
						var editUserDialog = new EditUserDialog({
							onEdited: function() {
								that.refreshUsers();
							},
							model: model
						});
					});
					$row.find('.delete').button({
						'icons': {
							'primary': "ui-icon-trash"
						},
						'text': false,
					}).click({
						user: user
					}, function(e) {
						var deleteUserDialog = new DeleteUserDialog({
							onDeleted: function() {
								that.refreshUsers();
							},
							model: e.data.user
						});
					});
				});
			});
		},

	});
	return AdminView;
});
