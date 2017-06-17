'use strict'
require.config({
	paths: {
		jquery: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery',
		underscore: 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore',
		backbone: 'https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.3.3/backbone',
		handlebars: 'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.10/handlebars'
	}
});

require(
[
	'underscore',
	'backbone',
	'moon/image/collection',
	'moon/image/list-view',
	'moon/image/full-view',
	'moon/tag/list-view',
	'moon/controls',
	'moon/screen',
	'moon/query',
	'lib/jquery-deparam',
],
function (
	_,
	Backbone,
	Images,
	ListView,
	ImageView,
	TagView,
	Controls,
	Screen,
	Query,
	deparam,
) {
	var Moon = Backbone.Router.extend({
		initialize: function() {
			var tagData = document.getElementById('tag-data');
			this.tags = new Backbone.Collection(window.JSON.parse(tagData.innerHTML));

			var preload = window.JSON.parse(document.getElementById('image-data').innerHTML);
			this.images = new Images(preload.items, {
				paging: preload.paging,
				query: Query.fromLocation()
			});

			this.list_view = new ListView({collection: this.images});
			$('body').append(this.list_view.$el.hide());

			this.image_view = new ImageView();
			$('body').append(this.image_view.$el.hide());

			this.controls = new Controls();
			$('body').append(this.controls.render().$el);

			this.tag_view = new TagView({collection: this.tags});
			$('body').append(this.tag_view.$el.hide());

		},
		routes: {
			"tags": function () {
				this.tag_view.render();
			},
			"tagme(/*id)": function() {
			},
			"(:path)(?*search)": function(path, search) {
				var query = new Query(deparam(search), path)
				window.qq = query;
				window.QQ = Query;

				this.images.setQuery(query);

				// could be an image or the list of images.
				if (query.isImage) {
					this.controls.gotoMode('full');
					this.image_view.setImage(query); // might need to do more work for the id
				} else {
					this.controls.gotoMode('list');
					this.list_view.render();
				}

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
			var path = $(this).attr('href')
			moon.navigate(path, {trigger: true})
		});

		Backbone.history.start({pushState: true, root: '/'});

	});

});
