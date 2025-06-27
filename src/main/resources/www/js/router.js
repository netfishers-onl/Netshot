/** Copyright 2013-2025 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'dayjs',
	'views/header/HeaderView',
	'views/devices/DevicesView',
	'views/diagnostics/DiagnosticsView',
	'views/admin/AdminView',
	'views/tasks/TasksView',
	'views/reports/ReportsView',
	'views/compliance/ComplianceView',
	'models/user/CurrentUserModel',
	'models/user/ServerInfoModel',
	'views/users/ReAuthDialog'
], function($, _, Backbone, dayjs, HeaderView, DevicesView, DiagnosticsView, AdminView,
		TasksView, ReportsView, ComplianceView, CurrentUserModel, ServerInfoModel,
		ReAuthDialog) {

	makeLoadProgress(100);

	var initPages = function() {
		
		$(document).on('ajaxComplete', function(event, jqXHR, ajaxSettings) {
			if (jqXHR.status == 401) {
				new ReAuthDialog();
			}
			else {
				if (typeof window.reauth !== "undefined") {
					clearTimeout(window.reauth);
				}
				var timeout = window.serverInfo.get("maxIdleTimout");
				if (timeout) {
					window.reauth = setTimeout(function() {
						new ReAuthDialog();
					}, (timeout - 5) * 1000);
				}
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
		window.serverInfo = new ServerInfoModel();
		window.serverInfo.fetch().done(function() {
			initPages();
		});
	};

	var generateOidcState = function() {
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		var state = "";
		for (var i = 0; i < 32; i++) {
			var c = Math.floor(Math.random() * chars.length);
			state += chars.charAt(c);
		}
		return state;
	};

	var showLogin = function(response) {
		var oidcAuthEndpoint = response.getResponseHeader("X-OIDC-AuthorizationEndpoint");
		var oidcClientId = response.getResponseHeader("X-OIDC-ClientID");

		$("#splash #authentication-box #authenticate").button({
			icons: {
				primary: "ui-icon-circle-triangle-e"
			}
		});
		var passwordChangeRequired = false;
		$("#splash #authentication-box").submit(function() {
			$("#splash #authentication-box #authenticate").button('disable');
			$("#splash #connection-error").hide();
			window.user = new CurrentUserModel();
			var data = {
				username: $("#splash #authentication-box #username").val(),
				password: $("#splash #authentication-box #password").val(),
			};
			if (passwordChangeRequired) {
				data.newPassword = $("#splash #authentication-box #newpassword1").val();
				if (data.newPassword != $("#splash #authentication-box #newpassword2").val()) {
					$("#splash #connection-error #errormsg")
						.text("You didn't accurately repeat password.");
					$("#splash #connection-error").show();
					$("#splash #authentication-box #newpassword1").focus();
					$("#splash #authentication-box #authenticate").button('enable');
					return false;
				}
			}
			window.user.save(data, {
				success: function(model, response, options) {
					model.attributes.password = "";
				},
				error: function(model, response, options) {
					model.attributes.password = "";
				},
			}).done(function(response) {
				start();
			}).fail(function(response) {
				if (response.status === 412) {
					// Password change required
					passwordChangeRequired = true;
					$("#splash #passwordchange-warning").show();
					$("#splash .changepassword").show();
					$("#splash #authentication-box #newpassword1").focus();
				}
				else if (response.status === 401) {
					passwordChangeRequired = false;
					$("#splash #passwordchange-warning").hide();
					$("#splash #connection-error #errormsg")
						.text("Authentication error.");
					$("#splash #connection-error").show();
					$("#splash #authentication-box #password").val("");
				}
				else {
					$("#splash #passwordchange-warning").hide();
					var message = "Connection error";
					try {
						message = response.responseJSON.errorMsg;
					}
					catch (e1) {
						//
					}
					$("#splash #connection-error #errormsg").text(message);
					$("#splash #connection-error").show();
				}
				$("#splash #authentication-box #authenticate").button('enable');
			});
			return false;
		});
		$("#splash #authentication-box #authenticate").button('enable');

		$("#splash #sso-box #redirect").button({
			icons: {
				primary: "ui-icon-extlink"
			}
		});
		$("#splash #sso-box #showpassform").click(function() {
			$("#splash #sso-box").hide();
			$("#splash #authentication-box").show();
		});

		if (oidcAuthEndpoint && oidcClientId) {
			$("#splash #sso-box").submit(function() {
				var redirectUri = window.location.href;
				var state = generateOidcState();
				sessionStorage.setItem("oidc.laststate", state);
				var url = oidcAuthEndpoint + "?" + $.param({
					"response_type": "code",
					"client_id": oidcClientId,
					"redirect_uri": redirectUri,
					"state": state,
					"scope": "openid",
				});
				console.log("Navigating to IdP at " + url);
				window.location.href = url;
				return false;
			});
			$("#splash #sso-box").show();
			$("#splash #authentication-box").hide();
		}
		else {
			$("#splash #sso-box").hide();
			$("#splash #authentication-box").show();
			$("#splash #authentication-box #username").focus();
		}
	};

	var checkAuthStatus = function() {
		window.user = new CurrentUserModel();
		
		window.user.fetch().then(function() {
			start();
		}).fail(function(response) {
			if (response.status == 401) {
				showLogin(response);
				return;
			}
			$("#splash #connection-error").show();
		});
	};

	var initialize = function() {
	
		$(window).resize(function() {
			$("body").toggleClass("nssmallscreen", $(window).width() < 1200);
		}).resize();

		// dayjs formats, except date picker
		window.dateFormats = {
			day: "YYYY-MM-DD",
			second: "HH:mm:ss",
			month: "YYYY-MM",
			full: "YYYY-MM-DD HH:mm:ss",
			picker: "yy-mm-dd",
			default: "YYYY-MM-DD HH:mm",
		};

		window.formatDateTime = function(date, format) {
			var format = dateFormats[format] || dateFormats.default;
			return dayjs(date).format(format);
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

		// Retrieve and remove query params from the URL
		var queryParams = {};
		var entryUrl = window.location.href;
		var urlPartMatch = entryUrl.match(/^(.+)\?(.*?)(#.*)?$/);
		if (urlPartMatch) {
			var targetUrl = urlPartMatch[1];
			if (urlPartMatch[3]) {
				targetUrl += urlPartMatch[3];
			}
			console.log("Cleaning URL: " + entryUrl + " -> " + targetUrl);
			window.history.replaceState({}, "", targetUrl);
			var qParamPart = urlPartMatch[2] || "";
			for (var qParam of qParamPart.split(/&/)) {
				var qpMatch = qParam.match(/^(.+)=(.+)$/);
				if (qpMatch) {
					queryParams[qpMatch[1]] = qpMatch[2];
				}
			}
		}

		var oldState = sessionStorage.getItem("oidc.laststate");
		sessionStorage.removeItem("oidc.laststate");
		if (queryParams.state && queryParams.code) {
			if (oldState === queryParams.state) {
				window.user = new CurrentUserModel();
				window.user.save({
					authorizationCode: queryParams.code,
					redirectUri: targetUrl,
				}, {
					success: function(model, response, options) {
						model.attributes.authorizationCode = "";
					},
					error: function(model, response, options) {
						model.attributes.authorizationCode = "";
					},
				}).done(function(response) {
					start();
				}).fail(function(response) {
					if (response.status === 401) {
						$("#splash #connection-error #errormsg")
							.text("SSO authentication error.");
						$("#splash #connection-error").show();
						if (response.status == 401) {
							showLogin(response);
							return;
						}
					}
					else {
						var message = "Connection error";
						try {
							message = response.responseJSON.errorMsg;
						}
						catch (e1) {
							//
						}
						$("#splash #connection-error #errormsg").text(message);
						$("#splash #connection-error").show();
					}
				});
			}
			else {
				console.error("Returned state from IdP doesn't match saved state.");
			}
		}
		else {
			checkAuthStatus();
		}
	};

	return {
		initialize: initialize
	};
});
