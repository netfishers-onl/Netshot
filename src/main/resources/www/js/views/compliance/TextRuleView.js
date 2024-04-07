/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/compliance/textRule.html',
	'views/compliance/EditTextRuleDialog'
], function($, _, Backbone, textRuleTemplate, EditTextRuleDialog) {

	return Backbone.View.extend({

		el: "#nscompliance-rule",

		template: _.template(textRuleTemplate),
		
		initialize: function(options) {
			var that = this;
			this.deviceTypes = options.deviceTypes;
			this.diagnostics = options.diagnostics;
			this.deviceType = this.deviceTypes.findWhere({
				name: this.model.get("deviceDriver")
			});
			this.render();
		},

		getAttributes: function(driver) {
			var that = this;
			var attributes = EditTextRuleDialog.prototype.defaultAttributes;
			if (typeof driver === "object" && driver) {
				attributes = _.union(attributes, driver.get("attributes"));
			}
			attributes = _.sortBy(attributes, "title");
			attributes = _.union(attributes, that.diagnostics.map(function(diagnostic) {
				return {
					level: "DEVICE",
					title: diagnostic.get("name") + " (diagnostic)",
					name: diagnostic.get("name"),
					type: diagnostic.get("resultType"),
					checkable: true
				};
			}));
			return attributes;
		},

		render: function() {
			var that = this;
			var data = this.model.toJSON();
			
			data.fieldDescription = "Unknown";
			var attributes = this.getAttributes(this.deviceType);
			for (var a in attributes) {
				var attribute = attributes[a];
				if (!attribute.checkable) continue;
				if (attribute.name == this.model.get("field")) {
					data.fieldDescription = attribute.title;
					break;
				}
			}

			this.$el.html(this.template(data));

			if (!user.isReadWrite()) {
				this.$("#ruleedit").remove();
			}

			this.$("#ruleedit").button({
				icons: {
					primary: "ui-icon-pencil"
				},
			}).click(function() {
				var editDialog = new EditTextRuleDialog({
					model: that.model,
					onEdited: function() {
						that.options.onEdited();
					}
				});
			});

			return this;
		},

		destroy: function() {
			this.$el.html("");
		}

	});
});
