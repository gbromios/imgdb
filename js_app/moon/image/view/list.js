'use strict'
define(
[        'backbone', 'moon/query', 'moon/image/view/tile'],
function( Backbone,   Query,        Tile ) {
	return Backbone.View.extend({
		id: 'image-list',
		className: 'main-view',
		tagName: 'ul',
		initialize: function(options) {
			Backbone.$.extend(this, options);

			this.listenTo(this.images, 'update', this.update);
			this.listenTo(this.images, 'reset', this.reset);

			this.listenTo(this.screen, 'scroll.moon', this.scroll);
			this.listenTo(this.screen, 'resize.moon', this.resize);

			// TODO figure out this will actually be set up.
			this.$el.addClass('app-centered');
			this.images.each(this.append, this);

			// keep track of the image of the first tile so we know whether to insert
			// or append any new ones
			this._begin = _.isEmpty(this.images.models) ? null : this.images.firstID;

			this.listenTo(Query, 'goto.moon.list', this.render);

		},
		resize: function() {
			this.$el.width(this.screen.tileWidth * this.screen.tileSize);
		},
		reset: function() {
			this.$el.empty();
			this._begin = null;
		},
		scroll: function(screen) {
			if (this.$el.is(':visible') && screen.bottomTile >= this.rows())  {
				// TODO try to make it even out the rows
				// TODO also support scrolling up tbh
				this.images.getNextPage({ data: { count: screen.tileCapacity } });
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
			return Math.ceil(this.$el.children().length / this.screen.tileWidth)
		},
		update: function(collection, options) {
			if (_.isEmpty(options.changes.added)) {
				// bail out if there were no added images.
				return;
			} else if (options.data.order === 'random') {
				// random order we just have to append, with no way of knowing which end
				// they're supposed to be on. might be able TODO something about it.
				_.each(options.changes.added, this.append, this);
			} else if (this.begin === null || options.changes.added[0].id > this._begin) {
				// if the added ids are higher than the first one, they go on the bottom.
				_.each(options.changes.added, this.append, this);
			} else {
				// smaller ids means they go on the top.
				// TODO try to keep existing image sin the same column when prepending.
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
