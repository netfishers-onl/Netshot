define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/domain/DomainModel',
	'text!templates/admin/addDomain.html'
], function($, _, Backbone, Dialog, DomainModel, addDomainTemplate) {

	var AddDomainDialog = Dialog.extend({

		template: _.template(addDomainTemplate),

		initialize: function() {
			this.model = new DomainModel();
			this.render();
		},

		dialogOptions: {
			title: "Add domain",
		},

		buttons: {
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				this.model.save({
					'name': that.$('#domainname').val(),
					'description': that.$('#domaindescription').val(),
					'ipAddress': that.$('#domainserveraddress').val(),
				}).done(function(data) {
					that.close();
					that.options.onAdded();
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
		},

	});
	return AddDomainDialog;
});
