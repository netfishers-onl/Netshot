/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'text!templates/devices/noDomain.html'
], function($, _, Backbone, Dialog, noDomainTemplate) {

	return Dialog.extend({

		template: _.template(noDomainTemplate),

		dialogOptions: {
			title: "No device domain",
		},

		buttons: {
			"Close": function() {
				this.close();
			}
		}

	});
});
