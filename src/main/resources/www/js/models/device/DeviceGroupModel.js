/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/groups",

		defaults: {
			'name': "A name"
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'id',
				'type',
				'name',
				'folder',
				'hiddenFromReports',
				'staticDevices',
				'driver',
				'query'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		},
		
		getPath: function() {
			var folder = this.get('folder');
			var path = [];
			_.each(folder.split('/'), function(f) {
				f = f.replace(/^\s+|\s+$/g, '');
				if (f === "") return;
				path.push(f);
			});
			return path;
		}

	});

});
