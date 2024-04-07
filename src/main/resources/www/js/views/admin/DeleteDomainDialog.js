/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/domain/DomainModel',
	'text!templates/admin/deleteDomain.html'
], function($, _, Backbone, Dialog, DomainModel, deleteDomainTemplate) {

	return Dialog.extend({

		template: _.template(deleteDomainTemplate),

		dialogOptions: {
			title: "Delete domain",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Delete": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = this.model.clone();
				saveModel.destroy().done(function(data) {
					that.close();
					that.options.onDeleted();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
		}

	});
});
