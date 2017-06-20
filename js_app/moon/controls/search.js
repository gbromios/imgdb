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
		tagName: 'div',
		id: 'search-bar',
		template: Handlebars.compile($('#search-bar-template').html()),
		events: {
			'click .btn-search-submit': 'submit',
			'click .btn-search-clear': 'clear',
			'keydown input': 'keydown',
		},
		initialize: function(options) {
			this.query = options.query;
		},
		render: function() {
			var value = this.query.args.search || '';
			return this.$el.append(this.template(value));
		},
		submit: function() {
			var value = this.$el.find('input').val();
			if (!value) {
				this.clear();
			} else {
				this.query.args.search = value;
				window.moon.navigate(this.query.listURL(), {trigger: true});
				this.remove();
			}
		},
		clear: function() {
			delete this.query.args.search;
			window.moon.navigate(this.query.listURL(), {trigger: true});
			this.remove();
		},
		keydown: function(e) {
			if (e.keyCode === 13) {
				this.submit();
			}
		}

	});
});

})();
