/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'ace/ace',
	'text!templates/compliance/jsRule.html',
	'views/compliance/EditRuleScriptDialog'
], function($, _, Backbone, ace, jsRuleTemplate, EditRuleScriptDialog) {

	return Backbone.View.extend({

		el: "#nscompliance-rule",

		template: _.template(jsRuleTemplate),
		initialize: function(options) {
			var that = this;
			this.render();
		},

		render: function() {
			var that = this;

			this.$el.html(this.template(this.model.toJSON()));

			if (!user.isReadWrite()) {
				this.$("#ruleedit").remove();
			}

			this.$("#ruleedit").button({
				icons: {
					primary: "ui-icon-pencil"
				},
			}).click(function() {
				var editDialog = new EditRuleScriptDialog({
					model: that.model,
					onEdited: function() {
						that.options.onEdited();
					}
				});
			});

			this.scriptEditor = ace.edit('nscompliance-rule-script');
			this.scriptEditor.getSession().setMode("ace/mode/javascript");
			this.scriptEditor.setReadOnly(true);
			this.scriptEditor.setValue(that.model.get("script"));
			this.scriptEditor.setHighlightActiveLine(false);
			this.scriptEditor.renderer.setShowGutter(false);
			this.scriptEditor.gotoLine(1);

			return this;
		},

		destroy: function() {
			this.scriptEditor.destroy();
			this.$el.html("");
		}

	});
});
