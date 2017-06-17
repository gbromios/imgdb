'use strict'
define(
[        'backbone', 'handlebars', 'moon/query'],
function( Backbone,   Handlebars,   Query) {
	return Backbone.View.extend({
		tagName: 'div',
		id: 'fixed-top-container',
		initialize: function(){
			this.template = Handlebars.compile($('#controls-template').html());
			this.btn_partial = Handlebars.registerPartial(
				'control-btn',
				$('#control-btn-partial').html()
			);
		},
		events: {
			'click .btn-moon': function() {},
			'click .btn-settings': function() {},
			'click .btn-search': function() {},
			'click .btn-tags': function() {
				// go to the tag list
				moon.navigate('/tags', {trigger: true});
			},
			'click .btn-back': function() {
				// whatever the current address is, turn it to a list-version
				moon.navigate(Query.fromLocation().listURL(), {trigger: true});
			},
			'click .btn-image': function() {},
			'click .btn-prev': 'gotoPrevious',
			'click .btn-next': 'gotoNext',
			'click .btn-tag': function() {}
		},
		render: function() {
			return this.$el.append(this.template({
				site_name: 'the moon is chill', // TODO site config or something
				list_buttons: [
					{ name: 'moon', icon: 'moon-o' },
					{ name: 'settings', icon: 'gear' },
					{ name: 'search', icon: 'search' },
					{ name: 'tags', icon: 'tags' },
				],
				img_buttons: [
					{ name: 'back', icon: 'times' },
					{ name: 'image', icon: 'image' },
					{ name: 'prev', icon: 'arrow-left' },
					{ name: 'next', icon: 'arrow-right' },
					{ name: 'tag', icon: 'tag' },
				]
			}));
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
		gotoPrevious: function() {
			var model = window.moon.image_view.model;
			var i = moon.images.prevOf(model);
			var query = Query.fromLocation();

			if (i === null) {
				console.log('hit a null previous image!');
			} else if (i === -1) {
				// we need to load this image. probably show the loader imo
				window.moon.images.getPrevPage({
					success: function(c, r, o) {
						window.moon.navigate(query.transform({}, moon.images.prevOf(model).id).imageURL(), {trigger: true});
					}
				});
			} else {
				window.moon.navigate(query.transform({}, i.id).imageURL(), {trigger: true});
			}
		},
		gotoNext: function() {
			var model = window.moon.image_view.model;
			var i = moon.images.nextOf(model);
			var query = Query.fromLocation();

			if (i === null) {
				console.log('hit a null next image!');
			} else if (i === -1) {
				// we need to load this image. probably show the loader imo
				window.moon.images.getNextPage({
					success: function(c, r, o) {
						window.moon.navigate(query.transform({}, r.data[0].id).imageURL(), {trigger: true});
					}
				});
			} else {
				window.moon.navigate(query.transform({}, i.id).imageURL(), {trigger: true});
			}
		}
	});
});
