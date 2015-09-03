/** Copyright 2013-2014 NetFishers */
require.config({
	paths: {
		jquery: 'libs/jquery/jquery-min',
		'jquery-ui': 'libs/jquery-ui/jquery-ui',
		'formatDateTime': 'libs/jquery/jquery.formatDateTime.min',
		rangyinput: 'libs/jquery/rangyinputs-jquery',
		underscore: 'libs/underscore/underscore-min',
		backbone: 'libs/backbone/backbone-min',
		ace: 'libs/ace',
		Chart: 'libs/Chart.js/Chart.min',
		templates: '../templates'
	},
	shim: {
		'jquery-ui': {
			deps: [
				'jquery'
			]
		},
		'formatDateTime': {
			deps: [
				'jquery'
			]
		},
		rangyinput: {
			deps: [
				'jquery'
			]
		},
		underscore: {
			exports: '_'
		},
		backbone: {
			deps: [
				'underscore',
				'jquery'
			],
			exports: 'Backbone'
		},
		Chart: {
			exports: 'Chart'
		}
	}
});

function makeLoadProgress(i) {
	var progress = parseInt($("#progress").data('progress')) + i;
	if (progress > 100) progress = 100;
	$("#progress").data('progress', progress);
	$("#progress #bar").css('width', progress + '%');
	if (progress == 100) {
		$("#splash").addClass('withbackground');
	}
}

require([
	'app',
], function(App) {
	App.initialize();
});
