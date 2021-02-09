/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/header/HeaderView',
	'views/devices/DevicesView',
	'views/diagnostics/DiagnosticsView',
	'views/admin/AdminView',
	'views/tasks/TasksView',
	'views/reports/ReportsView',
	'views/compliance/ComplianceView',
	'models/user/CurrentUserModel',
	'views/users/ReAuthDialog'
], function($, _, Backbone, HeaderView, DevicesView, DiagnosticsView, AdminView,
		TasksView, ReportsView, ComplianceView, CurrentUserModel, ReAuthDialog) {

	makeLoadProgress(100);

	var initPages = function() {
		
		$(document).ajaxComplete(function(event, jqXHR, ajaxSettings) {
			if (jqXHR.status == 403) {
				new ReAuthDialog();
			}
			else {
				if (typeof window.reauth !== "undefined") {
					clearTimeout(window.reauth);
				}
				window.reauth = setTimeout(function() {
					new ReAuthDialog();
				}, (window.user.get("maxIdleTimout") - 5) * 1000);
				
			}
		});

		var routes = {
			'devices(/:id)': 'showDevices',
			'diagnostics': 'showDiagnostics',
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
		var appRouter = new AppRouter;

		var switchToView = function(SubView, options) {
			if (appRouter.currentView && typeof appRouter.currentView.destroy === "function") {
				appRouter.currentView.destroy();
			}
			appRouter.currentView = new SubView(options);
			appRouter.currentView.render();
		}

		appRouter.on('route:showDevices', function(id) {
			var id = parseInt(id);

			if (this.currentView != null
					&& typeof this.currentView.selectDevice === "function") {
				if (!isNaN(id)) {
					this.currentView.selectDevice(id);
				}
			}
			else {
				options = {};
				if (!isNaN(id)) {
					options['id'] = id;
				}
				switchToView(DevicesView, options);
			}
		});

		appRouter.on('route:showAdmin', function() {
			switchToView(AdminView);
		});

		appRouter.on('route:showReports', function() {
			switchToView(ReportsView);
		});

		appRouter.on('route:showTasks', function() {
			switchToView(TasksView);
		});

		appRouter.on('route:showCompliance', function() {
			switchToView(ComplianceView);
		});

		appRouter.on('route:showDiagnostics', function() {
			switchToView(DiagnosticsView);
		});

		var headerView = new HeaderView();
		headerView.render();

		Backbone.history.start();

	};
	
	var start = function() {
		$("#splash").remove();
		initPages();
	};

	var initialize = function() {
	
		$(window).resize(function() {
			$("body").toggleClass("nssmallscreen", $(window).width() < 1200);
		}).resize();

		window.formatDateTime = function(date, format) {
			var d = new Date(date);
			var f = format;
			if (f === "day") {
				f = { year: "2-digit", month: "2-digit", day: "2-digit" };
			}
			else if (f === "second") {
				f = { hour: "2-digit", minute: "2-digit", second: "2-digit" };
			}
			else if (f === "full") {
				return d.toLocaleString(undefined, { year: "2-digit", month: "2-digit", day: "2-digit" }) + " "
						+ d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
			}
			if (!f) {
				return d.toLocaleString(undefined, { year: "2-digit", month: "2-digit", day: "2-digit" }) + " "
						+ d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
			}
			return d.toLocaleString(undefined, f);
		}

		window.formatFileSize = function(size) {
			var u = ["GB", "MB", "KB", "B"];
			var s = size;
			while (s > 1024 && u.length > 1) {
				s = s / 1024;
				u.pop();
			}
			return s.toFixed(2) + u.pop();
		}

		window.user = new CurrentUserModel();
		window.user.fetch().done(function() {
			start();
		}).fail(function(response) {
			if (response.status == 401 || response.status == 403) {
				$("#splash #authentication-box #authenticate").button({
					icons: {
						primary: "ui-icon-circle-triangle-e"
					}
				});
				$("#splash #authentication-box").submit(function() {
					$("#splash #authentication-box #authenticate").button('disable');
					$("#splash #connection-error").hide();
					window.user = new CurrentUserModel();
					window.user.save({
						username: $("#splash #authentication-box #username").val(),
						password: $("#splash #authentication-box #password").val()
					}, {
						success: function(model, response, options) {
							model.attributes.password = "";
						},
						error: function(model, response, options) {
							model.attributes.password = "";
						},
					}).done(function(response) {
						start();
					}).fail(function(response) {
						$("#splash #errormsg").text("Authentication error.");
						$("#splash #connection-error").show();
						$("#splash #authentication-box #authenticate").button('enable');
						$("#splash #authentication-box #password").val("");
					});
					return false;
				}).show();
				$("#splash #authentication-box #authenticate").button('enable');
				$("#splash #authentication-box #username").focus();
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
