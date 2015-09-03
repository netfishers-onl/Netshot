/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/domain/DomainModel',
	'text!templates/admin/addDomain.html'
], function($, _, Backbone, Dialog, DomainModel, addDomainTemplate) {

	return Dialog.extend({

		template: _.template(addDomainTemplate),

		dialogOptions: {
			title: "Edit domain",
		},

		buttons: {
			"Save": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();
				saveModel.save({
					'name': that.$('#domainname').val(),
					'description': that.$('#domaindescription').val(),
					'ipAddress': that.$('#domainserveraddress').val(),
				}).done(function(data) {
					that.close();
					that.options.onEdited();
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
		
		onCreate: function() {
			this.$("#domainname").select();
		}

	});
});
