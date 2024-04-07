/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/devices/deviceListItem.html'
], function($, _, Backbone, deviceListItemTemplate) {

	return Backbone.View.extend({

		tagName: "li",

		template: _.template(deviceListItemTemplate),

		events: {
			"mouseenter": "mouseEnter",
			"mouseleave": "mouseLeave",
			"click": "click"
		},

		initialize: function(options) {
			this.devicesView = options.devicesView;
			var that = this;

		},

		rawRender: function() {
			return this.template(this.model.toJSON());
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		click: function() {
			var that = this;
			this.model.fetch().done(function() {
				that.devicesView.deviceChange(that.model);
				that.select();
			});
		},

		select: function() {
			if (this.$el.hasClass("active")) return;
			this.$el.closest("ul").find(".active").removeClass("active");
			this.$el.removeClass("hover").addClass("active");
		},

		mouseEnter: function() {
			if (!this.$el.hasClass("active")) {
				this.$el.addClass("hover");
			}
		},

		mouseLeave: function() {
			this.$el.removeClass("hover");
		}

	});
});
