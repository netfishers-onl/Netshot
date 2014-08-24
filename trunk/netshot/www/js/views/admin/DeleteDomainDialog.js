define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/domain/DomainModel',
	'text!templates/admin/deleteDomain.html'
], function($, _, Backbone, Dialog, DomainModel, deleteDomainTemplate) {

	var DeleteDomainDialog = Dialog.extend({

		template: _.template(deleteDomainTemplate),

		dialogOptions: {
			title: "Delete domain",
		},

		buttons: {
			"Confirm": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = this.model.clone();
				saveModel.destroy().done(function(data) {
					that.close();
					that.options.onDeleted();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText);
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
			"Cancel": function() {
				this.close();
			}
		}

	});
	return DeleteDomainDialog;
});
