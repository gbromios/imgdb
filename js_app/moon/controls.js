'use strict'
define(
[        'backbone', 'moon/query'],
function( Backbone, Query) {
	function mkbtn(id, fa, on) {
		return $('<button class="icon-btn">')
			.addClass('btn-' + id)
			.click(on || function(){ return; })
			.append( $('<span class="fa fa-3x">').addClass('fa-' + fa) )
		;
	}

	return Backbone.View.extend({
		tagName: 'div',
		id: 'fixed-top-container',
		initialize: function(){},
		events: {
		},
		render: function() {
			this.$el.append(
				$('<a>')
					.prop('href', '/')
					.text('the moon is chill')
					.addClass('moonroute main-link'),
				$('<div>').addClass('btn-group btn-group-list').append(
					mkbtn("moon", "moon-o"),
					mkbtn("settings", "gear"),
					mkbtn("search", "search"),
					mkbtn("tags", "tags").attr('href', '/tags').addClass('moonroute')
				),
				$('<div>').addClass('btn-group btn-group-image').append(
					mkbtn("back", "times", function(){
						// whatever the current address is, turn it to a list-version
						moon.navigate(Query.fromLocation().listURL(), {trigger: true});
					}),
					mkbtn("image", "image"),
					mkbtn("prev", "arrow-left", function(){
					}),
					mkbtn("next", "arrow-right", function(){
						console.log('going to next image');

						var model = window.moon.image_view.model;
						console.log(model);
						var i = moon.images.nextOf(model);
						var query = Query.fromLocation();

						if (i === null) { console.log('hit a null next image!'); return; }
						if (i === -1) {
							// we need to load this image. probably show the loader imo
							console.log('we need to load our next image');
							window.moon.images.getMore({
								success: function(c, r, o) {
									// goto whatever image we got first
									console.log('loading', r.data[0].id);
									window.moon.navigate(query.transform({}, r.data[0].id).imageURL(), {trigger: true});
								}
							});
						} else {
							console.log(i, query.transform({}, i.id).imageURL());
							window.moon.navigate(query.transform({}, i.id).imageURL(), {trigger: true});
						}
					}),
					mkbtn('tagme', 'tag', function(){
						var model = window.moon.image_view.model
						window.open('/tagme/' + model.id, '_blank' );
					})
				)
			);
			return this;
		},
		gotoMode: function(mode) {
			// list or full?
			if (mode === this.mode) {
				return;
			} else {
				this.mode = mode;
			}

			// todo: i think on mobile mode, going to image mode hides the main title

			if (mode === 'full') {
				// show controls for a single image
				//$('.btn-group-list').stop().animate({'width':0}, 300);
				//$('.btn-group-image').stop().delay(10).animate({'width':256}, 300);
				
			} else if (mode === 'list') {
				//$('.btn-group-image').stop().animate({'width':0}, 300);
				//$('.btn-group-list').stop().delay(10).animate({'width':256}, 300);
				// show controls for the list of images
			} else {
			}
		},
	});


});
