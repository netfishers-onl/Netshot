/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
], function($, _, Backbone) {

	var ReportView = Backbone.View.extend({

		el: "#nsreports-report",

		initialize: function(options) {
			this.render();
		},

		destroy: function() {
			this.$el.empty();
		},

		legendColors: [
			"#00ffff",
			"#f0ffff",
			"#f5f5dc",
			"#000000",
			"#0000ff",
			"#a52a2a",
			"#00ffff",
			"#00008b",
			"#008b8b",
			"#a9a9a9",
			"#006400",
			"#bdb76b",
			"#8b008b",
			"#556b2f",
			"#ff8c00",
			"#9932cc",
			"#8b0000",
			"#e9967a",
			"#9400d3",
			"#ff00ff",
			"#ffd700",
			"#008000",
			"#4b0082",
			"#f0e68c",
			"#add8e6",
			"#e0ffff",
			"#90ee90",
			"#d3d3d3",
			"#ffb6c1",
			"#ffffe0",
			"#00ff00",
			"#ff00ff",
			"#800000",
			"#000080",
			"#808000",
			"#ffa500",
			"#ffc0cb",
			"#800080",
			"#800080",
			"#ff0000",
			"#c0c0c0",
			"#ffffff",
			"#ffff00"
		]

	});
	
	ReportView.defaultOptions = {};
	return ReportView;
});
