;(function(){
'use strict';

define([
		'backbone',
		'handlebars',
		'moon/query',
		'moon/controls/search',
		'moon/controls/settings'
], function(
		Backbone,
		Handlebars,
		Query,
		SearchBar,
		Settings
) {
	return Backbone.View.extend({
		tagName: 'div',
		id: 'fixed-top-container',
		template: Handlebars.compile($('#controls-template').html()),
		initialize: function(options){
			Backbone.$.extend(this, options);
			this.mode = null;
			this.listenTo(Query, 'goto.moon.img', this.imageMode);
			this.listenTo(Query, 'goto.moon.list', this.listMode);

		},
		events: {
			'click .main-link': function(e) {
				e.preventDefault();
				// TODO should be a base query that represents the default "/"
				new Query({}, '').go();
			},
			'click .btn-moon': function() {},
			'click .btn-settings': 'openSettings',
			'click .btn-search': 'openSearch',
			'click .btn-tags': function() {
				// go to the tag list
				new Query({}, 'tags').go(); // TODO - possibly find a nicer way to do this.
			},
			'click .btn-back': function() {
				// whatever the current address is, turn it to a list-version
				Query.fromLocation().toList().go();
			},
			'click .btn-prev': 'gotoPrevious',
			'click .btn-next': 'gotoNext',
			'click .btn-info': function() {}
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
					{ name: 'prev', icon: 'arrow-left' },
					{ name: 'next', icon: 'arrow-right' },
					{ name: 'info', icon: 'list-alt' }
				]
			}));
		},
		imageMode: function(query) {
			if (this.mode !== 'image') {
				self.mode = 'image';
				$('.btn-group-list').stop().animate({'width':0}, 200);
				$('.btn-group-image').stop().delay(210).animate({'width':268}, 200);
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
			var model = window.moon.image_view.model; // TODO - THIS IS BAD. would using the path be any better.
			var image = this.images.prevOf(model);
			var query = Query.fromLocation(); // this could easily be where we get the image id from

			if (image === null) {
				// this should never happen
				console.log('hit a null previous image!');
			} else if (image === -1) {
				// we need to load this image. probably show the loader imo
				this.images.getPrevPage({
					success: function(c, r, o) {
						query.toImage(c.prevOf(model)).go();
					}
				});
			} else {
				query.toImage(image).go();
			}
		},
		gotoNext: function() {
			var model = window.moon.image_view.model; // not ideal, see above.
			var image = this.images.nextOf(model);
			var query = Query.fromLocation();

			if (image === null) {
				// this should never happen
				console.log('hit a null next image!');
			} else if (image === -1) {
				// we need to load this image. probably show the loader imo
				this.images.getNextPage({
					success: function(c, r, o) {
						query.toImage(c.nextOf(model)).go();
					}
				});
			} else {
				query.toImage(image).go();
			}
		},
		openSearch: function() {
			var search = new SearchBar({ query: Query.fromLocation() });
			console.log(search.query, Query.fromLocation())
			Backbone.$('body').append(search.render());
			search.$el.find('input.text-search').trigger('focus');
		},
		openSettings: function() {
			var settings = new Settings();
			Backbone.$('body').append(settings.render());
		}
	});
});

})();
