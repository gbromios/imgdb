'use strict'
define(
[        'backbone', 'handlebars', 'moon/query'],
function( Backbone,   Handlebars,   Query) {
	return Backbone.View.extend({
		tagName: 'div',
		id: 'fixed-top-container',
		initialize: function(options){
			Backbone.$.extend(this, options);
			this.mode = null;
			this.template = Handlebars.compile($('#controls-template').html());
			this.btn_partial = Handlebars.registerPartial(
				'control-btn',
				$('#control-btn-partial').html()
			);

			this.listenTo(Query, 'goto.moon.img', this.imageMode);
			this.listenTo(Query, 'goto.moon.list', this.listMode);

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
		imageMode: function(query) {
			if (this.mode !== 'image') {
				self.mode = 'image';
				$('.btn-group-list').stop().animate({'width':0}, 200);
				$('.btn-group-image').stop().delay(210).animate({'width':335}, 200);
			}
			// make sure the buttons are in the right state.
			$('.btn-next, .btn-prev').prop('disabled', true);

			var model = this.images.get(query.imageID);

			// did we get a model from the image collection?
			if (model) {
				this.togglePrevNext(model);
			} else {
				var controls = this;
				this.images.hasImage(query.imageID).then(function(model){
					controls.togglePrevNext(model);
				});
			}
			return this;
		},
		togglePrevNext: function(image) {
			if (this.images.nextOf(image) !== null) {
				$('.btn-next').prop('disabled', false);
			}
			if (this.images.prevOf(image) !== null) {
				$('.btn-prev').prop('disabled', false);
			}
		},
		listMode: function() {
			if (this.mode !== 'list') {
				self.mode = 'list';
				$('.btn-group-image').stop().animate({'width':0}, 200);
				$('.btn-group-list').stop().delay(210).animate({'width':268}, 200);
			}
		},
		gotoPrevious: function() {
			var model = window.moon.image_view.model; // TODO - THIS IS BAD.
			var image = this.images.prevOf(model);
			var query = Query.fromLocation();

			if (image === null) {
				// TODO when i implement prev/next detection, this wont happen
				console.log('hit a null previous image!');
			} else if (image === -1) {
				// we need to load this image. probably show the loader imo
				this.images.getPrevPage({
					success: function(c, r, o) {
						window.moon.navigate(query.transform({}, c.prevOf(model).id).imageURL(), {trigger: true});
					}
				});
			} else {
				window.moon.navigate(query.transform({}, image.id).imageURL(), {trigger: true});
			}
		},
		gotoNext: function() {
			var model = window.moon.image_view.model;
			var image = this.images.nextOf(model);
			var query = Query.fromLocation();

			if (image === null) {
				// TODO when i implement prev/next detection, this wont happen
				console.log('hit a null next image!');
			} else if (image === -1) {
				// we need to load this image. probably show the loader imo
				this.images.getNextPage({
					success: function(c, r, o) {
						window.moon.navigate(query.transform({}, r.data[0].id).imageURL(), {trigger: true});
					}
				});
			} else {
				window.moon.navigate(query.transform({}, image.id).imageURL(), {trigger: true});
			}
		}
	});
});
