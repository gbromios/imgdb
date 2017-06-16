'use strict'
define(
[        'jquery', 'backbone', 'moon/screen', 'moon/image/tile-view' ],
function( $,        Backbone,   Screen,        Tile ) {
	return Backbone.View.extend({
		id: 'image-list',
		className: 'main-view',
		tagName: 'ul',
		initialize: function() {
			this.listenTo(this.collection, 'update', this.update);
			this.listenTo(this.collection, 'add', this.add);
			this.listenTo(this.collection, 'reset', this.reset);

			this.listenTo(Screen, 'scroll.moon', this.scroll);
			this.listenTo(Screen, 'resize.moon', this.resize);

			this.$el.addClass('app-centered')
			this.collection.each(this.add, this);
		},
		resize: function() {
			this.$el.width(Screen.tileWidth * Screen.tileSize);
		},
		reset: function() {
			this.$el.empty();
		},
		scroll: function() {
			if (Screen.bottomTile >= this.rows()) {
				// get two more pages when we scroll to the bottom
				this.collection.getMore();
			}
		},
		render: function() {
			// show all the images?
			this.resize();
			$('.main-view:not(#image-list)').hide();
			this.$el.show();
			return this;
		},
		destroy: function(){
			this.remove();
			this.unbind();
		},
		rows: function() {
			return Math.ceil(this.$el.children().length / Screen.tileWidth)
		},
		update: function(collection, options) {
			// in random mode, I actually want duplicates to keep appearing. haha.
			_.each(options.changes.merged, function(image){
				this.add(image);
			}, this);
		},
		add: function(image) {
			this.$el.append(new Tile({model: image}).render().$el);
		}

	});

});
