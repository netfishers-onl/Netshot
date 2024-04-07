/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/diagnostics/diagnostics.html',
	'text!templates/diagnostics/diagnosticsToolBar.html',
	'text!templates/diagnostics/diagnosticListItem.html',
	'views/diagnostics/AddDiagnosticDialog',
	'views/diagnostics/DeleteDiagnosticDialog',
	'views/diagnostics/DiagnosticView',
	'models/diagnostic/DiagnosticCollection',
	'models/device/DeviceTypeCollection',
], function($, _, Backbone, diagnosticsTemplate, diagnosticsToolBarTemplate, diagnosticListItemTemplate,
		AddDiagnosticDialog, DeleteDiagnosticDialog, DiagnosticView, DiagnosticCollection,
		DeviceTypeCollection) {

	makeLoadProgress(13);

	return Backbone.View.extend({

		el: $("#page"),

		template: _.template(diagnosticsTemplate),
		toolBarTemplate: _.template(diagnosticsToolBarTemplate),
		diagnosticTemplate: _.template(diagnosticListItemTemplate),

		initialize: function() {
			this.diagnostics = new DiagnosticCollection([]);
			this.deviceTypes = new DeviceTypeCollection([]);
		},

		render: function() {
			var that = this;
			$('#nstoolbar-diagnostics').prop('checked', true);
			$('#nstoolbarpages').buttonset('refresh');

			this.$el.html(this.template);

			$('#nstoolbar-section').html(this.toolBarTemplate);
			if (!user.isReadWrite()) {
				$('#nstoolbar-section').empty();
			}
			$('#nstoolbar-section button').button();
			$('#nstoolbar-diagnostics-adddiagnostic').unbind('click').click(function() {
				var addDiagnosticDialog = new AddDiagnosticDialog({
					onAdded: function(diagnostic) {
						that.diagnostic = diagnostic;
						that.refreshDiagnostics();
					},
				});
			});

			this.refreshDiagnostics();
			return this;
		},

		refreshDiagnostics: function() {
			var that = this;
			$.when(this.diagnostics.fetch({ reset: true }), this.deviceTypes.fetch()).done(function() {
				that.renderDiagnosticList();
			});
		},

		renderDiagnosticListItem: function(diagnostic) {
			var line = this.diagnosticTemplate(diagnostic.toJSON());
			this.$("#nsdiagnostics-listbox>ul").append(line);
		},

		renderDiagnosticList: function() {
			var that = this;
			this.$("#nsdiagnostics-listbox>ul").empty();
			this.diagnostics.each(this.renderDiagnosticListItem, this);

			this.$("#nsdiagnostics-listbox .nsdiagnostics-list-diagnostic")
			.mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function() {
				if ($(this).hasClass("active")) {
					return;
				}
				var id = $(this).closest('li').data("diagnostic-id");
				that.diagnostic = that.diagnostics.get(id);
				that.renderDiagnostic();
				$(this).closest('ul').find('li').removeClass("active");
				$(this).addClass("active");
				that.$("#nscompliance-diagnostic").show();
			});

			if (!user.isExecuteReadWrite()) {
				this.$("#nsdiagnostics-listbox .edit").remove();
				this.$("#nsdiagnostics-listbox .delete").remove();
			}

			this.$("#nsdiagnostics-listbox .nsdiagnostics-list-diagnostic button.delete").button({
				icons: {
					primary: "ui-icon-trash"
				},
				text: false
			}).click(function() {
				var id = $(this).closest('li').data("diagnostic-id");
				var deleteDiagnosticDialog = new DeleteDiagnosticDialog({
					model: that.diagnostics.get(id),
					onDeleted: function() {
						that.diagnostic = null;
						that.renderDiagnostic();
						that.refreshDiagnostics();
					},
				});
			});

			if (this.diagnostic) {
				var id = this.diagnostic.get('id');
				this.$('#nsdiagnostics-listbox>ul li[data-diagnostic-id="' + id + '"]').click();
			}
		},

		renderDiagnostic: function() {
			var that = this;
			if (this.diagnosticView) {
				this.diagnosticView.destroy();
			}
			if (this.diagnostic) {
				this.diagnosticView = new DiagnosticView({
					model: this.diagnostic,
					deviceTypes: this.deviceTypes,
					onEdited: function() {
						that.refreshDiagnostics();
					}
				});
			}
		},

		destroy: function() {
			if (this.diagnosticView) {
				this.diagnosticView.destroy();
			}
		}
	});
});
