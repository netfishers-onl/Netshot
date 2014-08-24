define([
	'jquery',
	'underscore',
	'backbone',
	'views/header/HeaderView',
	'views/devices/DevicesView',
	'views/admin/AdminView',
	'views/tasks/TasksView',
	'views/reports/ReportsView',
	'views/compliance/ComplianceView',
	'models/user/CurrentUserModel',
	'views/users/ReAuthDialog'
], function($, _, Backbone, HeaderView, DevicesView, AdminView, TasksView,
		ReportsView, ComplianceView, CurrentUserModel, ReAuthDialog) {

	makeLoadProgress(100);

	var initPages = function() {

		$(document).ajaxError(function(event, jqXHR, ajaxSettings, thrownError) {
			if (jqXHR.status == 401) {
				var reAuthDialog = new ReAuthDialog();
			}
		});

		var routes = {
			'devices(/:id)': 'showDevices',
			'admin': 'showAdmin',
			'reports': 'showReports',
			'tasks': 'showTasks',
			'compliance': 'showCompliance',
			// Default
			'*actions': 'showReports'
		};
		if (!user.isAdmin()) {
			delete routes.admin;
		}

		var AppRouter = Backbone.Router.extend({
			currentView: null,
			routes: routes
		});
		var app_router = new AppRouter;

		app_router.on('route:showDevices', function(id) {
			var id = parseInt(id);

			if (this.currentView != null
					&& typeof (this.currentView.selectDevice) == "function") {
				if (!isNaN(id)) {
					this.currentView.selectDevice(id);
				}
			}
			else {
				options = {};
				if (!isNaN(id)) {
					options['id'] = id;
				}
				this.currentView = new DevicesView(options);
				this.currentView.render();
			}
		});

		app_router.on('route:showAdmin', function() {
			this.currentView = new AdminView();
			this.currentView.render();
		});

		app_router.on('route:showReports', function() {
			this.currentView = new ReportsView();
			this.currentView.render();
		});

		app_router.on('route:showTasks', function() {
			this.currentView = new TasksView();
			this.currentView.render();
		});

		app_router.on('route:showCompliance', function() {
			this.currentView = new ComplianceView();
			this.currentView.render();
		});

		var headerView = new HeaderView();
		headerView.render();

		Backbone.history.start();

	};
	
	var checkVersionsAndStart = function() {
		if (window.user.get('serverVersion') == window.user.get('clientVersion')) {
			$("#splash").remove();
			initPages();
		}
		else {
			$("#splash #versionmismatch-error").show();
		}
	};

	var initialize = function() {

		window.user = new CurrentUserModel();
		window.user.fetch().done(function() {
			checkVersionsAndStart();
		}).fail(function(response) {
			if (response.status == 401 || response.status == 403) {
				$("#splash #authentication-box #authenticate").button({
					icons: {
						primary: "ui-icon-circle-triangle-e"
					}
				}).click(function() {
					$("#splash #authentication-box #authenticate").button('disable');
					$("#splash #connection-error").hide();
					window.user = new CurrentUserModel();
					window.user.save({
						username: $("#splash #authentication-box #username").val(),
						password: $("#splash #authentication-box #password").val()
					}).done(function(response) {
						checkVersionsAndStart();
					}).fail(function(response) {
						$("#splash #errormsg").text("Authentication error.");
						$("#splash #connection-error").show();
						$("#splash #authentication-box #authenticate").button('enable');
						$("#splash #authentication-box #password").val("");
					});
					return false;
				});
				$("#splash #authentication-box").keydown(function(e) {
					if (e.which == 13) {
						e.preventDefault();
						$("#splash #authentication-box #authenticate").click();
						return false;
					}
				}).show();
				$("#splash #authentication-box #authenticate").button('enable');
			}
			else {
				$("#splash #connection-error").show();
			}
		});
	};
	return {
		initialize: initialize
	};
});
