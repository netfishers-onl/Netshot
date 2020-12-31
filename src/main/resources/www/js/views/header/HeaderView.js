/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/header/header.html',
	'views/admin/AboutDialog',
	'views/users/UserDialog'
], function($, _, Backbone, headerTemplate, AboutDialog, UserDialog) {

	return Backbone.View.extend({
		el: $("#header"),

		initialize: function() {

		},

		render: function() {
			var compiledTemplate = _.template(headerTemplate);
			this.$el.html(compiledTemplate({
				user: user.toJSON()
			}));
			if (!user.isAdmin()) {
				this.$('#nstoolbar-admin').next().addBack().remove();
			}
			this.$('#nstoolbarpages').buttonset();
			this.$('#nstoolbar-devices').click(function() {
				window.location = "#/devices";
			});
			this.$('#nstoolbar-diagnostics').click(function() {
				window.location = "#/diagnostics";
			});
			this.$('#nstoolbar-compliance').click(function() {
				window.location = "#/compliance";
			});
			this.$('#nstoolbar-tasks').click(function() {
				window.location = "#/tasks";
			});
			this.$('#nstoolbar-reports').click(function() {
				window.location = "#/reports";
			});
			this.$('#nstoolbar-admin').click(function() {
				window.location = "#/admin";
			});
			this.$('#nstoolbar-help').unbind('click').button().click(function() {
				var helpMenu = $('#nstoolbar-helpmenu');
				$('.nstoolbarmenu').not(helpMenu).hide();
				helpMenu.toggle()
						.prependTo('#container').position({
							my: "left top",
							at: "left bottom",
							of: this
						});
				$('#nstoolbar-helpmenu #userguide').unbind('click')
						.click(function() {
							helpMenu.hide();
							window.open("https://github.com/netfishers-onl/Netshot/wiki/Netshot-User-Guide", "help");
							return false;
						});
				$('#nstoolbar-helpmenu #apibrowser').unbind('click')
						.click(function() {
							helpMenu.hide();
							window.open("/api-browser/", "api-browser");
							return false;
						});
				$('#nstoolbar-helpmenu #about').unbind('click')
						.click(function() {
							helpMenu.hide();
							var aboutDialog = new AboutDialog();
							return false;
						});
				return false;
			});
			this.$('#nstoolbar-help').buttonset();
			this.$('#nstoolbar-helpmenu').hide().menu();
			this.$("#nsuser").click(function() {
				var userDialog = new UserDialog({
					model: user
				});
				return false;
			});
			return this;
		}

	});

});
