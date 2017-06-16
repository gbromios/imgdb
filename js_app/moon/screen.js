'use strict'
define(
[        'jquery', 'underscore', 'backbone'],
function( $,        _,            Backbone ) {
	var Screen = $.extend({
		tileSize: 128,
		_resize: function() {
			Screen.trigger('resize.moon', Screen)
		},
		_scroll: function() {
			Screen.trigger('scroll.moon', Screen)
		}
	}, Backbone.Events);

	Object.defineProperties(Screen, {
		// idk if this should be the width of the window or some smaller part of the app?
		width: { get: () => $(window).width() },
		height: { get: () => $(window).height() },
		spacer: { get: () => $('#fixed-top-container').height() }, // < also needs to account for other shit that might be open e.g. image tags
		imageWidth: { get: () => Screen.width - 32 },
		imageHeight: { get: () => Screen.height - Screen.spacer - 16 },
		fullHeight: { get: () => $(document).height() },
		top: { get: () => $(window).scrollTop() },
		bottom: { get: () => Screen.top + Screen.height },
		// should be allowed to control this, but by default, just use 8
		//tileWidth: { get: () => window.Math.min(8, window.Math.floor(Screen.width / Screen.tileSize)) },
		tileWidth: { get: () => window.Math.floor(Screen.width / Screen.tileSize) },
		tileHeight: { get: () => window.Math.ceil(Screen.height / Screen.tileSize) },
		// number of tiles that can fit at once
		tileCapacity: { get: () => Screen.tileHeight * Screen.tileWidth },
		// how many tile rows down is the top of the window
		// todo: account for fixed top header element
		topTile: { get: () => window.Math.floor(Screen.top / Screen.tileSize) },
		bottomTile: { get: () => Screen.topTile + Screen.tileHeight },
		atTop: { get: () => Screen.top === 0 }, // TODO - account for fixed top header
		toBottom: { get: () => Screen.bottom - Screen.fullHeight }
	});

	$(window).on('resize', _.debounce(Screen._resize, 500));
	$(window).on('DOMMouseScroll mousewheel', Screen._scroll);

	return Screen;

});
