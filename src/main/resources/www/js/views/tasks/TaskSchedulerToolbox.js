/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/tasks/taskSchedulerToolbox.html'
], function($, _, Backbone, taskSchedulerToolboxTemplate) {

	return Backbone.View.extend({

		el: "#nstasks-schedulertoolbox",

		template: _.template(taskSchedulerToolboxTemplate),

		initialize: function(options) {
			var that = this;
			that.render();
		},

		render: function() {
			var that = this;
			this.$el.html(this.template);

			this.$('.nstask-schedulelink a').click(function() {
				that.$('.nstask-schedulelink').hide();
				that.$('.nstask-schedule').show();
				return false;
			});

			var in10min = new Date();
			in10min.setTime(in10min.getTime() + 10 * 60 * 1000);
			this.$('.nsdatepicker').datepicker({
				dateFormat: "dd/mm/y",
				autoSize: true,
				onSelect: function() {}
			}).datepicker('setDate', in10min);
			this.$('.nstimepicker.hour').change(function() {
				var value = $(this).val();
				value = value.replace(/^ */, "");
				value = value.replace(/ *$/, "");
				if (value.match(/^(2[0-3])|([01][0-9])$/)) {
					$(this).val(value);
				}
				else if (value.match(/^[0-9]$/)) {
					$(this).val("0" + value);
				}
				else {
					$(this).val("00");
				}
			}).val(("0" + in10min.getHours()).slice(-2));
			this.$('.nstimepicker.min').change(function() {
				var value = $(this).val();
				value = value.replace(/^ */, "");
				value = value.replace(/ *$/, "");
				if (value.match(/^[0-5][0-9]$/)) {
					$(this).val(value);
				}
				else if (value.match(/^[0-9]$/)) {
					$(this).val("0" + value);
				}
				else {
					$(this).val("00");
				}
			}).val(("0" + in10min.getMinutes()).slice(-2));
			this.$('.nstimepicker.inmin').change(function() {
				var value = $(this).val();
				value = value.replace(/^ */, "");
				value = value.replace(/ *$/, "");
				if (value.match(/^[0-9]+$/)) {
					$(this).val(value);
				}
				else {
					$(this).val("10");
				}
			}).val(10);
			this.$('#scheduleasap').click(function() {
				that.$('.schedule-options').hide();
			});
			this.$('#schedulein').click(function() {
				that.$('.schedule-options').hide();
				that.$('#schedulein-options').show();
			});
			this.$('#scheduleat').click(function() {
				that.$('.schedule-options').hide();
				that.$('#scheduleat-options').show();
			});
			this.$('#schedulerepeat').click(function() {
				that.$('.schedule-options').hide();
				that.$('#schedulerepeat-options').show();
			});
			this.$('#schedulerepeatfactor').spinner({
				min: 1,
			});
			if (typeof this.options.onRendered === "function") {
				this.options.onRendered();
			}

			return this;
		},

		getSchedule: function() {
			var type = this.$('input[name="schedule"]:checked').val().toUpperCase();
			var ref = new Date();
			var factor = 1;
			if (type == "IN") {
				type = "AT";
				var minutes = parseInt(this.$('#schedulein-min').val());
				ref.setTime(ref.getTime() + minutes * 60 * 1000);
			}
			else if (type == "AT") {
				var hours = parseInt(this.$('#scheduleat-timehour').val());
				var minutes = parseInt(this.$('#scheduleat-timemin').val());
				ref = this.$('#scheduleat-day').datepicker('getDate');
				ref.setTime(ref.getTime() + (hours * 60 + minutes) * 60 * 1000);
			}
			else if (type == "REPEAT") {
				type = this.$('#schedulerepeatunit').val();
				var hours = parseInt(this.$('#schedulerepeat-timehour').val());
				var minutes = parseInt(this.$('#schedulerepeat-timemin').val());
				ref = this.$('#schedulerepeat-day').datepicker('getDate');
				ref.setTime(ref.getTime() + (hours * 60 + minutes) * 60 * 1000);
				factor = this.$('#schedulerepeatfactor').spinner("value");
			}
			var schedule = {
				scheduleType: type,
				scheduleFactor: factor,
				scheduleReference: ref,
			};
			return schedule;
		},

	});
});
