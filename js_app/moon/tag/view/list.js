;(function(){
'use strict';

define([
		'backbone',
		'handlebars',
		'moon/main-view'
], function(
		Backbone,
		Handlebars,
		MainView
) {
	return MainView.extend({
		id: 'tag-view',
		className: 'main-view app-centered',
		tagName: 'div',
		events: {},
		initialize: function(options) {
			Backbone.$.extend(this, options);
			this.template = Handlebars.compile($('#tag-list-template').html());
		},
		render: function() {
			if (!this.el.innerHTML) {
				this.$el.append($(this.template(
					_.map(this.tags.models, function(t){ return t.attributes  })
				)));
			}
			this.show();
			return this;
		},
	});
});

})();
