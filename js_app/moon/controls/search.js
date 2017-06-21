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
		tagName: 'div',
		id: 'search-bar',
		template: Handlebars.compile($('#search-bar-template').html()),
		events: {
			'click .btn-search-submit': 'submit',
			'click .btn-text-search-clear': 'clearTextSearch',
			'input input.text-search': 'toggleTextSearchClearButton',
			'keydown input.text-search': 'keydown',
			'click .btn-rudeness': 'changeRudeness',
			'click .btn-random': 'changeRandom',
		},
		initialize: function(options) {
			this.query = options.query;
		},
		render: function() {
			// TODO - should also be able to choose the tag from here.
			// hide the current main view, will re-show it on close.
			$('.main-view.current-view').hide();

			this.$el.append(this.template({
				text_search: this.query.args.search || '',
				buttons: [
					[
						{ name: 'rudeness', icon: 'child', value: Options.rudeness, text: '' },
						{ name: 'random', icon: 'random', value: Options.random, text: 'Shuffle Mode' }
					],[
						{ name: 'search-submit', icon: 'check', value: '', text: 'Submit' }
					]
				]
			}));

			this.toggleTextSearchClearButton();
			this.styleRudeness();
			this.styleRandom();

			// TODO same as settings, do this with css
			this.$('hr').last().remove();

			// TODO should prolly do this in css too
			this.$('.btn-text-search-clear > span').addClass('accented');

			return this.$el;

		},
		closeSearch: function() {
			$('.main-view.current-view').show();
			this.remove();
		},
		submit: function() {
			var value = this.$el.find('input').val();
			// fulltext search?
			if (value) {
				this.query.args.search = value;
			} else {
				delete this.query.args.search;
			}

			// order by?

			// nsfw?

			window.moon.navigate(this.query.listURL(), {trigger: true});
			this.closeSearch();
		},
		clearAll: function() {
			delete this.query.args.search;
			window.moon.navigate(this.query.listURL(), {trigger: true});
			this.closeSearch();
		},
		keydown: function(e) {
			if (e.keyCode === 13) { // enter
				this.submit();
			} else if (e.keyCode === 27) { // escape
				$('.main-view.current-view').show();
				this.closeSearch();
			}
		},
		clearTextSearch: function() {
			this.$('input.text-search').val('');
			this.toggleTextSearchClearButton();
		},
		toggleTextSearchClearButton: function() {
			if (this.$('input.text-search').val()) {
				this.$('.btn-text-search-clear').css('opacity', 1);
			} else {
				this.$('.btn-text-search-clear').css('opacity', 0);
			}
		},
		changeRudeness: function() {
			Options.rudeness = Options.rudeness === '1' ? '0' : '1';
			this.styleRudeness();
		},
		styleRudeness: function() {
			if (Options.rudeness === '0') {
				this.$('.btn-rudeness > .fa').addClass('fa-child').removeClass('fa-warning').removeClass('accented');
				this.$('.btn-rudeness > .btn-text').text('SFW-ish');
			} else {
				this.$('.btn-rudeness > .fa').removeClass('fa-child').addClass('fa-warning').addClass('accented');
				this.$('.btn-rudeness > .btn-text').text('Definitely NSFW');
			}
		},
		changeRandom: function() {
			Options.random = Options.random === '1' ? '0' : '1';
			this.styleRandom();
		},
		styleRandom: function() {
			if (Options.random === '0') {
				this.$('.btn-random > span').addClass('grayed-out');
			} else {
				this.$('.btn-random > span').removeClass('grayed-out');
			}
		}
	});
});

})();
