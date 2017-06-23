;(function(){
'use strict';

define([
		'backbone',
		'handlebars',
		'moon/query'
], function(
		Backbone,
		Handlebars,
		Query
) {
	return Backbone.View.extend({
		className: 'tile',
		tagName: 'li',
		template: Handlebars.compile(Backbone.$('#tile-image-template').html()),
		events: {
			click: "openImage"
		},
		initialize: function() {
		},
		render: function() {
			// TODO - since we could theoretically load a lot of these at once, dont
			// pull the thumbnail until it's on the screen. then, paging might be
			// completely unnecessary.
			if (!this.el.innerHTML) {
				this.setElement(this.template(this.model.attributes));
			}
			return this;
		},
		openImage: function(e){
			Query.fromLocation().toImage(this.model.id).go();
		},
	});
});

})();
