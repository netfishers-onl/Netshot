/** Copyright 2013-2024 Netshot */
require.config({
	paths: {
		jquery: 'libs/jquery/jquery-min',
		'jquery-ui': 'libs/jquery-ui/jquery-ui',
		rangyinput: 'libs/jquery/rangyinputs-jquery',
		underscore: 'libs/underscore/underscore-min',
		backbone: 'libs/backbone/backbone-min',
		ace: 'libs/ace',
		Chart: 'libs/Chart.js/Chart.min',
		dayjs: 'libs/dayjs/dayjs.min',
		tablesort: 'libs/tablesort/tablesort.min',
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
		},
		dayjs: {
			exports: 'dayjs'
		},
		tablesort: {
			exports: 'Tablesort',
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
