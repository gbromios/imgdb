;(function(){
'use strict';

define([
		'underscore',
		'backbone',
		'handlebars',
		'moon/options'
], function(
		_,
		Backbone,
		Handlebars,
		Options
) {
	return Backbone.View.extend({
		template: Handlebars.compile($('#settings-template').html()),
		tagName: 'div',
		id: 'settings',
		events: {
			'click .btn-close-settings': 'closeSettings',
			'click .btn-change-theme': 'changeTheme',
			'click .btn-fit': 'changeFit'
		},
		initialize: function(options) {
		},
		render: function() {
			// hide the current main view, will re-show it on close.
			$('.main-view.current-view').hide();

			// TODO - these are all buttons atm, should probably use the relevant input types
			this.$el.append(this.template({
				buttons: [
					[
						{ name: 'change-theme', icon: 'paint-brush', value: '', text: 'Change Theme' }
					],[
						{ name: 'fit', icon: 'arrows', value: 'fit-both', text: 'Fit Images Horizontally and Vertically' },
						{ name: 'fit', icon: 'arrows-h', value: 'fit-h', text: 'Fit Images Horizontally' },
						{ name: 'fit', icon: 'arrows-v', value: 'fit-v', text: 'Fit Images Vertically (...why would you want this?)' },
						{ name: 'fit', icon: 'square', value: 'fit-none', text: 'Do Not Resize Images to Fit Screen' },
					],[
						{ name: 'close-settings', icon: 'check', value: '', text: 'Close Settings' }
					]
				]
			}));

			// non selected fit - options should be grayed out
			this.$('.btn-fit > span').addClass('grayed-out');
			this.$('.btn-fit[value="' + Options.fit + '"] > span').removeClass('grayed-out');

			// probably these should be using css to begin with, but this will work for now
			this.$('hr').last().remove();

			return this.$el;

		},
		closeSettings: function(){
			$('.main-view.current-view').show();
			this.remove();
		},
		changeTheme: function(){
			// TODO - more sophisticated theme selection, lol
			if (Options.theme === 'night') {
				Options.theme = 'day';
			} else {
				Options.theme = 'night';
			}
			var path = '/s/css/color-' + Options.theme + '.css'
			Backbone.$('#color-scheme').attr('href', path);
		},
		changeFit: function(e) {
			this.$('.btn-fit > span').addClass('grayed-out');
			var target = this.$(e.currentTarget);
			target.find('span').removeClass('grayed-out');
			Options.fit = target.val();
		}
	});
});

})();
