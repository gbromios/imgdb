;(function(){
'use strict';

require.config({
	paths: {
		jquery: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery',
		underscore: 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore',
		backbone: 'https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.3.3/backbone',
		handlebars: 'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.10/handlebars'
	}
});

require([
		'underscore',
		'backbone',
		'handlebars',
		'moon/image',
		'moon/tag',
		'moon/controls',
		'moon/query',
		'moon/screen',
		'moon/options',
		'lib/jquery-deparam'
], function (
		_,
		Backbone,
		Handlebars,
		Image,
		Tag,
		Controls,
		Query,
		Screen,
		Options,
		deparam
) {
	var Moon = Backbone.Router.extend({
		initialize: function() {
			var tagData = document.getElementById('tag-data');
			this.tags = new Backbone.Collection(window.JSON.parse(tagData.innerHTML));

			var screen = new Screen();

			var preload = window.JSON.parse(document.getElementById('image-data').innerHTML);
			this.images = new Image.Collection(preload.items, {
				paging: preload.paging,
				query: Query.fromLocation()
			});

			// a list of all the tags
			this.tag_view = new Tag.View.List({
				tags: this.tags
			});
			$('body').append(this.tag_view.$el);

			// list of current image thumbnails
			this.list_view = new Image.View.List({
				images: this.images,
				screen: screen
			});
			$('body').append(this.list_view.$el);

			// for viewing a whole image
			this.image_view = new Image.View.Full({
				images: this.images,
				screen: screen
			});
			$('body').append(this.image_view.$el);

			// controls at the top of the screen
			this.controls = new Controls.Top({
				images: this.images
			});
			$('body').append(this.controls.render());
			// i think this can just go in controls.render()
			$('.btn-group').hide();

		},
		routes: { // Query object doesn't really mesh nicely with routes tbh
			"tags": function () {
				this.tag_view.render();
				this.controls.listMode(); // cough
			},
			"tagme(/*id)": function() {
				// deprecated... for now.
			},
			"(:path)(?*search)": function(path, search) {
				// TODO need some promises magic before these can be async. for now call
				// Image.Collection.setQuery manually. c.f. Image.Collection.hasImage
				var query = new Query(deparam(search), path);
				console.log('pls go', query)
				this.images.doQuery(query);
				query.go();
			},
		}
	});

	$(function() {
		window.moon = new Moon();
		$(document.body).on('click', '.moonroute', function(e){
			if (e.metaKey || e.ctrlKey) {
				return;
			}
			e.preventDefault();
			var path = $(this).attr('href');
			window.moon.navigate(path, {trigger: true});
		});

		Backbone.history.start({pushState: true, root: '/'});

		var theme = '/s/css/color-' + Options.theme + '.css';
		Backbone.$('#color-scheme').attr('href', theme);

	});

	// DEBUG
	window.options = Options;

	// not sure where the best place is for these since they're used by unrelated views
	Handlebars.registerPartial('control-btn', $('#control-btn-partial').html());
	Handlebars.registerPartial('settings-btn', $('#settings-btn-partial').html());


});

})();
