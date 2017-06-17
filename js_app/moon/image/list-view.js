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
			this.listenTo(this.collection, 'reset', this.reset);

			this.listenTo(Screen, 'scroll.moon', this.scroll);
			this.listenTo(Screen, 'resize.moon', this.resize);

			this.$el.addClass('app-centered')
			this.collection.each(this.append, this);
			this._begin = _.isEmpty(this.collection.models) ? null : this.collection.firstID
		},
		resize: function() {
			this.$el.width(Screen.tileWidth * Screen.tileSize);
		},
		reset: function() {
			this.$el.empty();
			this._begin = null;
		},
		scroll: function() {
			if (Screen.bottomTile >= this.rows()) {
				this.collection.getNextPage();
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
			if (_.isEmpty(options.changes.added)) {
				return;
			} else if (options.data.order === 'random') {
				_.each(options.changes.added, this.append, this);
			} else if (options.changes.added[0].id > this._begin) {
				_.each(options.changes.added, this.append, this);
			} else {
				_.each(options.changes.added.reverse(), this.prepend, this);
				// idk if other things will use this array??? re-reverse it.
				options.changes.added.reverse();
			}
			this._begin = collection.firstID;
		},
		append: function(image) {
			this.$el.append(new Tile({model: image}).render().$el);
		},
		prepend: function(image) {
			this.$el.prepend(new Tile({model: image}).render().$el);
		}

	});

});
