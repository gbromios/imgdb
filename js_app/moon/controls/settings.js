;(function(){
'use strict';

define([
		'underscore',
		'backbone',
		'handlebars',
], function(
		_,
		Backbone,
		Handlebars,
) {

	return Backbone.View.extend({
		template: Handlebars.compile($('#settings-template').html()),
		tagName: 'div',
		id: 'settings',
		events: {
			'click .btn-close-settings': 'remove',
			'click .btn-change-theme': 'changeTheme',
		},
		initialize: function(options) {
		},
		render: function() {
			// TODO - properly style/template line items
			console.log(this.$el)
			return this.$el.append(this.template());
		},
		changeTheme: function(){
			var dark = window.localStorage.getItem('dark');
			if (dark) {
				Backbone.$('#color-scheme').attr('href', '/s/css/color-day.css');
				window.localStorage.removeItem('dark');
			} else {
				Backbone.$('#color-scheme').attr('href', '/s/css/color-night.css');
				window.localStorage.setItem('dark', true);
			}
		}
	});
});

})();
