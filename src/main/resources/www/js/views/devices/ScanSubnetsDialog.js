/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/task/TaskModel',
	'models/domain/DomainCollection',
	'views/tasks/MonitorTaskDialog',
	'views/devices/NoDomainDialog',
	'text!templates/devices/scanSubnets.html'
], function($, _, Backbone, Dialog, TaskModel, DomainCollection,
		MonitorTaskDialog, NoDomainDialog, scanSubnetsTemplate) {

	return Dialog.extend({

		template: _.template(scanSubnetsTemplate),

		initialize: function() {
			var that = this;
			this.domains = new DomainCollection([]);
			this.domains.fetch().done(function() {
				if (that.domains.length == 0) {
					new NoDomainDialog();
				}
				else {
					that.render();	
				}
			});
		},

		dialogOptions: {
			title: "Scan a subnet to find devices",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Scan": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var task = new TaskModel({
					type: "ScanSubnetsTask",
					domain: (that.$('#devicedomain').val() ? that.$('#devicedomain').val() : -1),
					subnets: that.$('#subnets').val()
				});
				task.save().done(function(data) {
					that.close();
					var monitorTaskDialog = new MonitorTaskDialog({
						taskId: data.id,
						delay: 1200
					});
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
		},

		onCreate: function() {
			var that = this;
			_.each(this.domains.models, function(domain) {
				$('<option />').attr('value', domain.get('id'))
						.text(domain.get('name')).appendTo(that.$('#devicedomain'));
			});
		}

	});
});
