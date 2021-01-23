/** Copyright 2013-2021 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/hook/HookModel',
	'text!templates/admin/addWebHook.html'
], function($, _, Backbone, Dialog, HookModel, addWebHookTemplate) {

	return Dialog.extend({

		template: _.template(addWebHookTemplate),

		dialogOptions: {
			title: "Edit Web hook",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Save": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();
				var triggers = [];
				that.$('input[name="hooktrigger"]').each(function(index, i) {
					var $input = $(i);
					if ($input.prop("checked")) {
						triggers.push({
							type: $input.data('type'),
							item: $input.data('item'),
						});
					}
				});
				saveModel.save({
					'name': that.$('#hookname').val(),
					'type': "Web",
					'url': that.$('#hookurl').val(),
					'enabled': that.$('#hookenabled').prop('checked'),
					'sslValidation': that.$('#hooksslvalidation').prop('checked'),
					'action': that.$('input[name="hookaction"]:checked').val(),
					'triggers': triggers,
				}).done(function(data) {
					that.close();
					that.options.onEdited();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			}
		},
		
		onCreate: function() {
			var that = this;
			this.$('#hookurl').keyup(function(event) {
				var url = $(event.target).val();
				that.$('#hooksslvalidation').closest("fieldset").toggle(url.startsWith("https"));
			}).keyup();
			var modelTriggers = this.model.get("triggers"); 
			var $triggers = this.$('#hooktriggers');
			$.each(HookModel.prototype.allTriggers, function(index, trigger) {
				$div = $('<div/>');
				var id = (trigger.type + "-" + trigger.item).toLowerCase();
				var checked = _.some(modelTriggers, function(t) {
					return t.type === trigger.type && t.item === trigger.item;
				});
				$('<input type="checkbox" name="hooktrigger" />')
					.data(trigger).attr('id', id)
					.prop("checked", checked)
					.appendTo($div);
				$div.append(" ");
				$('<label/>').attr('for', id).text(trigger.description).appendTo($div);
				$div.appendTo($triggers);
			});
		}

	});
});
