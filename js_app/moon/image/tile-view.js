'use strict'
define(
[        'backbone', 'handlebars', 'lib/jquery-deparam'],
function( Backbone,   Handlebars,   deparam ) {
	return Backbone.View.extend({
		className: 'tile',
		tagName: 'li',
		events: {
			click: "openImage"
		},
		initialize: function() {
			this.template = Handlebars.compile($('#tile-image-template').html());
		},
		render: function() {
			if (!this.el.innerHTML) {
				this.setElement(this.template(this.model.attributes));
			}
			return this;
		},
		openImage: function(e){
			var path = '/' + this.model.id;
			var tag = window.location.pathname.replace(/^\/+|\/+$/g, '');
			var args = deparam(window.location.search.slice(1));
			if (tag) {
				args.tag = tag;
			}
			delete args.at; // TODO - when i fix paging, this can go away.
			var search = Backbone.$.param(args);
			if (search) {
				path += '?' + search;
			}
			window.moon.navigate(path, {trigger: true});
		},
	});
});