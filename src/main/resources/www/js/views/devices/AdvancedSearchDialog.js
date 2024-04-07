/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceTypeCollection',
	'text!templates/devices/advancedSearch.html',
	'views/devices/SearchToolbox'
], function($, _, Backbone, Dialog, DeviceTypeCollection, advancedSearchTemplate, SearchToolbox) {

	return Dialog.extend({

		template: _.template(advancedSearchTemplate),

		initialize: function(options) {
			this.devicesView = options.devicesView;
			this.render();
		},

		dialogOptions: {
			title: "Advanced search",
			width: '750px',
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Search": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				that.devicesView.devices.resetFilter();
				that.devicesView.devices.filter.type = "advanced";
				that.devicesView.devices.filter.query = that.$("#expression").val();
				that.devicesView.devices.filter.text = "Advanced search";
				that.devicesView.devices.filter.driver = that.$('#devicetype').val();
				that.devicesView.decorateGroupList();
				that.devicesView.devices.fetch().done(function() {
					$('#nsdevices-searchfield').val("Advanced search")
							.one('focus', function() {
								$(this).val('');
							});
					that.devicesView.renderDeviceList();
					that.devicesView.saveFilter();
					if (that.devicesView.devices.length == 0) {
						that.$('#expression').val(that.devicesView.devices.filter.query);
						that.$("#errormsg").text("No device found.");
						that.$("#error").show();
						$button.button('enable');
					}
					else {
						that.close();
					}
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			}
		},

		onCreate: function() {
			var that = this;
			var searchToolbox = new SearchToolbox({
				onRendered: function() {
					if (that.devicesView.devices.filter.type == "advanced" || that.devicesView.devices.filter.type == "simple") {
						that.$('#devicetype').val(that.devicesView.devices.filter.driver).trigger("change");
						that.$('#expression').val(that.devicesView.devices.filter.query);
					}
				}
			});
		}

	});
});
