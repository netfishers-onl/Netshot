/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'text!templates/devices/selectGroup.html',
	'text!templates/devices/selectGroupListItem.html',
	'text!templates/devices/selectGroupFolderListItem.html',
], function($, _, Backbone, Dialog, selectGroupTemplate,
		selectGroupListItemTemplate, selectGroupFolderListItemTemplate) {

	return Dialog.extend({

		el: "#nsdialog-child",

		template: _.template(selectGroupTemplate),
		groupListItemTemplate: _.template(selectGroupListItemTemplate),
		groupFolderListItemTemplate: _.template(selectGroupFolderListItemTemplate),

		dialogOptions: {
			title: "Select group(s)",
			width: "400px"
		},

		initialize: function(options) {
			var that = this;
			this.constraints = _.defaults(options.constraints || {}, { min: 1, max: 1 });
			this.groups = options.groups || [];
			this.preselectedGroupIds = options.preselectedGroupIds || [];
			that.render();
		},
		
		templateData: function() {
			return {
				constraints: this.constraints,
			};
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Select": function(event) {
				var that = this;
				that.options.onSelected(this.getSelectedGroupIds());
				that.close();
			},
		},

		updateSelectState: function() {
			var count = this.getSelectedGroupIds().length;
			var valid = (count >= this.constraints.min) && (count <= this.constraints.max);
			this.dialogButtons().eq(1).button(valid ? 'enable' : 'disable');
		},

		renderFolder: function($list, name, branch) {
			var $item = $list;
			if (name) {
				$item = $(this.groupFolderListItemTemplate({ name: name }));
				$list.append($item);
			}
			var folders = [];
			for (var f in branch.folders) {
				folders.push(f);
			}
			for (var f of folders.sort()) {
				this.renderFolder($item.children('ul'), f, branch.folders[f]);
			}
			for (var g in branch.groups.sort()) {
				$item.children('ul').append($(this.groupListItemTemplate(branch.groups[g])));
			}
		},

		getSelectedGroupIds: function() {
			return this.$("#grouptree .group.active").map(function() {
				return $(this).data('group-id');
			}).get();
		},

		onCreate: function() {
			var that = this;
			var multiMode = (this.constraints.max != 1);

			var tree = { groups: [], folders: {} };
			this.groups.each(function(group) {
				var branch = tree;
				var path = group.getPath();
				for (var p in path) {
					var f = path[p];
					if (!branch.folders[f]) {
						branch.folders[f] = { groups: [], folders: {} };
					}
					branch = branch.folders[f];
				}
				var groupData = group.toJSON();
				groupData['preselected'] = that.preselectedGroupIds.indexOf(group.get('id')) > -1;
				branch.groups.push(groupData);
			});
			this.$('.placeholder').toggle(this.groups.size() === 0);
			this.renderFolder(this.$('#grouptree'), null, tree);
			that.updateSelectState();

			this.$("#grouptree .group").mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function() {
				if (multiMode) {
					$(this).toggleClass("active");
				}
				else {
					that.$('#grouptree .group').removeClass("active");
					$(this).addClass("active");
				}
				that.updateSelectState();
			});
		},

	});
});
