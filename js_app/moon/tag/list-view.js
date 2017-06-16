'use strict'
define(
[        'backbone', 'handlebars'],
function( Backbone,   Handlebars ){
	return Backbone.View.extend({
		id: 'tag-view',
		className: 'main-view app-centered',
		tagName: 'div',
		events: { },
		initialize: function() {
			this.template = Handlebars.compile($('#tag-list-template').html());
		},
		render: function() {
			if (!this.el.innerHTML) {
				this.$el.append($(this.template(
					_.map(moon.tags.models, function(t){ return t.attributes  })
				)));
			}

			$('.main-view:not(#tag-view)').hide();
			this.$el.show();

			return this;
		},
	});
});
