/** Copyright 2013-2014 NetFishers */
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
			this.deviceType = this.deviceTypes.findWhere({
				name: this.model.get("deviceDriver")
			});
			this.render();
		},

		render: function() {
			var that = this;
			var data = this.model.toJSON();
			
			data.fieldDescription = "Unknown";
			var attributes = EditTextRuleDialog.prototype.defaultAttributes;
			if (typeof this.deviceType === "object" && this.deviceType) {
				attributes = _.union(attributes, this.deviceType.get("attributes"));
			}
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
