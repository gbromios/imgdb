'use strict'
define(
[        'jquery', 'underscore', 'backbone'],
function( $,        _,            Backbone ) {
	var Screen = function(element){
		$(window).on('resize', _.debounce(this._resize, 500));
		$(window).on('DOMMouseScroll mousewheel', this._scroll);

		this.$el = $(element || window);

		Object.defineProperties(this, {
			width: { get: () => this.$el.width() },
			height: { get: () => this.$el.height() },
			// spacer doesn't make sense from a 100% generic point of view (i.e. only
			// good for $(window)) but it will work out for what it's needed for
			spacer: { get: () => $('#fixed-top-container').height() },
			imageWidth: { get: () => this.width - 32 },
			imageHeight: { get: () => this.height - this.spacer - 16 },
			fullHeight: { get: () => $(document).height() },
			top: { get: () => this.$el.scrollTop() }, // will this work on non window?
			bottom: { get: () => this.top + this.height },
			// should be allowed to control this, but by default, just use 8
			//tileWidth: { get: () => window.Math.min(8, window.Math.floor(this.width / this.tileSize)) },
			tileWidth: { get: () => window.Math.floor(this.width / this.tileSize) },
			tileHeight: { get: () => window.Math.ceil(this.height / this.tileSize) },
			// number of tiles that can fit at once
			tileCapacity: { get: () => this.tileHeight * this.tileWidth },
			// how many tile rows down is the top of the window
			// todo: account for fixed top header element
			topTile: { get: () => window.Math.floor(this.top / this.tileSize) },
			bottomTile: { get: () => this.topTile + this.tileHeight },
			atTop: { get: () => this.top === 0 }, // TODO - account for fixed top header
			toBottom: { get: () => this.bottom - this.fullHeight }
		});
	};
	$.extend(Screen, Backbone.Events, {
		// offer a singleton Whole-Window version for convenience
		Window: new Screen(),
		tileSize: 128, // TODO set this more wisely
		_resize: function() {
			this.trigger('resize.moon', this)
		},
		_scroll: function() {
			this.trigger('scroll.moon', this)
		}
	});

	return Screen;

});
