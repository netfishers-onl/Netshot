define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/task/TaskModel',
	'models/domain/DomainCollection',
	'views/tasks/MonitorTaskDialog',
	'text!templates/devices/scanSubnets.html'
], function($, _, Backbone, Dialog, TaskModel, DomainCollection,
		MonitorTaskDialog, scanSubnetsTemplate) {

	var ScanSubnetDialog = Dialog.extend({

		template: _.template(scanSubnetsTemplate),

		initialize: function() {
			var that = this;
			var onDataHandler = function() {
				that.render();
			}
			this.domains = new DomainCollection([]);
			this.domains.fetch().done(onDataHandler);
		},

		dialogOptions: {
			title: "Scan a subnet to find devices",
		},

		buttons: {
			"Scan": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var task = new TaskModel({
					type: "ScanSubnetsTask",
					domain: that.$('#devicedomain').val(),
					subnets: that.$('#subnets').val()
				});
				task.save().done(function(data) {
					that.close();
					var monitorTaskDialog = new MonitorTaskDialog({
						taskId: data.id,
						delay: 1200
					});
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
			var that = this;
			_.each(this.domains.models, function(domain) {
				$('<option />').attr('value', domain.get('id'))
						.text(domain.get('name')).appendTo(that.$('#devicedomain'));
			});
		}

	});
	return ScanSubnetDialog;
});
