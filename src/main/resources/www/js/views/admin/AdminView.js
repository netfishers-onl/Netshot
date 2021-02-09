/** Copyright 2013-2021 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'tablesort',
	'models/domain/DomainCollection',
	'models/credentials/CredentialSetCollection',
	'models/user/UserCollection',
	'models/user/ApiTokenCollection',
	'models/device/DeviceTypeCollection',
	'models/hook/HookCollection',
	'views/admin/AddDomainDialog',
	'views/admin/EditDomainDialog',
	'views/admin/DeleteDomainDialog',
	'views/admin/AddCredentialSetDialog',
	'views/admin/EditCredentialSetDialog',
	'views/admin/DeleteCredentialSetDialog',
	'views/admin/AddUserDialog',
	'views/admin/EditUserDialog',
	'views/admin/DeleteUserDialog',
	'views/admin/AddApiTokenDialog',
	'views/admin/DeleteApiTokenDialog',
	'views/admin/AddWebHookDialog',
	'views/admin/EditWebHookDialog',
	'views/admin/DeleteWebHookDialog',
	'text!templates/admin/admin.html',
	'text!templates/admin/adminToolBar.html',
	'text!templates/admin/domain.html',
	'text!templates/admin/credentials.html',
	'text!templates/admin/user.html',
	'text!templates/admin/apiToken.html',
	'text!templates/admin/driver.html',
	'text!templates/admin/webHook.html',
], function($, _, Backbone, TableSort,
		DomainCollection, CredentialSetCollection, UserCollection, ApiTokenCollection,
		DeviceTypeCollection, HookCollection,
		AddDomainDialog, EditDomainDialog, DeleteDomainDialog,
		AddCredentialSetDialog, EditCredentialSetDialog, DeleteCredentialSetDialog,
		AddUserDialog, EditUserDialog, DeleteUserDialog,
		AddApiTokenDialog, DeleteApiTokenDialog, 
		AddWebHookDialog, EditWebHookDialog, DeleteWebHookDialog,
		adminTemplate, adminToolbarTemplate, domainRowTemplate,
		credentialsRowTemplate, userRowTemplate, apiTokenRowTemplate, driverRowTemplate,
		webHookRowTemplate) {

	makeLoadProgress(13);

	return Backbone.View.extend({

		el: $("#page"),

		template: _.template(adminTemplate),
		domainTemplate: _.template(domainRowTemplate),
		credentialsTemplate: _.template(credentialsRowTemplate),
		userTemplate: _.template(userRowTemplate),
		apiTokenTemplate: _.template(apiTokenRowTemplate),
		driverTemplate: _.template(driverRowTemplate),
		webHookTemplate: _.template(webHookRowTemplate),

		domains: new DomainCollection([]),
		credentialSets: new CredentialSetCollection([]),
		users: new UserCollection([]),
		apiTokens: new ApiTokenCollection([]),
		drivers: new DeviceTypeCollection([]),
		hooks: new HookCollection([]),

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
			this.refreshDrivers();
			this.refreshApiTokens();
			this.refreshHooks();

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
			$('#nsadmin-refreshdrivers').button({
				'icons': {
					'primary': "ui-icon-refresh"
				},
			}).off('click').on('click', function() {
				$(this).button("disable");
				that.drivers = new DeviceTypeCollection([], { refresh: true });
				that.refreshDrivers();
			});

			this.$('#nsadmin-addapitoken').button({
				'icons': {
					'primary': "ui-icon-plusthick"
				},
			}).click(function() {
				var addApiTokenDialog = new AddApiTokenDialog({
					onAdded: function() {
						that.refreshApiTokens();
					}
				});
				return false;
			});

			this.$('#nsadmin-addwebhook').button({
				'icons': {
					'primary': "ui-icon-plusthick"
				},
			}).click(function() {
				var addWebHookDialog = new AddWebHookDialog({
					onAdded: function() {
						that.refreshHooks();
					}
				});
				return false;
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
				new TableSort($table.parent().get(0));
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
				new TableSort($table.parent().get(0));
			});
		},

		refreshUsers: function() {
			var that = this;
			this.users.fetch().done(function() {
				var $table = that.$('#nsadmin-users table tbody');
				$table.empty();
				that.users.each(function(u) {
					var $row = $(that.userTemplate(u.toJSON())).appendTo($table);
					if (u.get('username') === user.get('username')) {
						$row.find('button').remove();
					} 
					$row.find('.edit').button({
						'icons': {
							'primary': "ui-icon-wrench"
						},
						'text': false,
					}).click({
						user: u
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
						user: u
					}, function(e) {
						var deleteUserDialog = new DeleteUserDialog({
							onDeleted: function() {
								that.refreshUsers();
							},
							model: e.data.user
						});
					});
				});
				new TableSort($table.parent().get(0));
			});
		},
		
		refreshDrivers: function() {
			var that = this;
			var $table = that.$('#nsadmin-drivers table tbody');
			$table.empty();
			this.drivers.fetch().done(function() {
				that.drivers.each(function(user) {
					var $row = $(that.driverTemplate(user.toJSON())).appendTo($table);
				});
				$('#nsadmin-refreshdrivers').button("enable");
			});
			new TableSort($table.parent().get(0));
		},

		refreshApiTokens: function() {
			var that = this;
			this.apiTokens.fetch().done(function() {
				var $table = that.$('#nsadmin-apitokens table tbody');
				$table.empty();
				that.apiTokens.each(function(t) {
					var $row = $(that.apiTokenTemplate(t.toJSON())).appendTo($table);
					$row.find('.delete').button({
						'icons': {
							'primary': "ui-icon-trash"
						},
						'text': false,
					}).click({
						apiToken: t,
					}, function(e) {
						var deleteApiTokenDialog = new DeleteApiTokenDialog({
							onDeleted: function() {
								that.refreshApiTokens();
							},
							model: e.data.apiToken
						});
					});
				});
				new TableSort($table.parent().get(0));
			});
		},

		refreshHooks: function() {
			var that = this;
			this.hooks.reset();
			this.hooks.fetch().done(function() {
				var $table = that.$el.find('#nsadmin-webhooks table tbody');
				$table.empty();
				that.hooks.each(function(hook) {
					if (hook.get('type') === "Web") {
						var $row = $(that.webHookTemplate(hook.toJSON()))
								.appendTo($table);
						$row.find('.edit').button({
							'icons': {
								'primary': "ui-icon-wrench"
							},
							'text': false,
						}).click({
							hook: hook
						}, function(e) {
							var editWebHookDialog = new EditWebHookDialog({
								onEdited: function() {
									that.refreshHooks();
								},
								model: e.data.hook
							});
						});
						$row.find('.delete').button({
							'icons': {
								'primary': "ui-icon-trash"
							},
							'text': false,
						}).click({
							hook: hook
						}, function(e) {
							var deleteWebHookDialog = new DeleteWebHookDialog({
								onDeleted: function() {
									that.refreshHooks();
								},
								model: e.data.hook
							});
						});
					}
				});
				new TableSort($table.parent().get(0));
			});
		},

	});
});
