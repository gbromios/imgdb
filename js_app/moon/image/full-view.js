'use strict'
define(
[        'backbone', 'handlebars', 'moon/screen'],
function( Backbone,   Handlebars,   Screen ) {
	function fitImage(target) {
		var image = $(target);
		image.removeAttr('style');
		// TODO optional
		if (image.width() > Screen.imageWidth) {
			image.css('width', Screen.imageWidth);
		}

		return;
		if (image.height() > Screen.imageHeight) {
			image.removeAttr('style');
			image.css('height', Screen.imageHeight);
		}
	}

	return Backbone.View.extend({
		id: 'full-image',
		className: 'main-view',
		tagName: 'div',
		events: {
		},
		initialize: function() {
			this.img_selector = '#full-image > img';
			this.template = Handlebars.compile($('#full-image-template').html());
		},
		setImage: function(query) {
			if (query.imageID === null) {
				throw "setting an image reqires an image query!"
			}
			// change to a new image
			var model = moon.images.get(query.imageID);

			// did we get a model from the image collection?
			if (model) {
				// if we have no model currently, or if a different one is passed in
				if (!this.model || model.id !== this.model.id) {
					this.model = model;
				}
				this.render();
			} else {
				this.model = null;
				// gonna have to search for it....
				moon.images.setQuery(query, {
					success: function(collection) {
					// should be in here...
						model = collection.get(query.imageID);
						if (model) {
							this.model = model;
							this.render();
						} else {
						}
					},
					error: function(){
					},
					thisArg: this
				});
			}
			return this;
		},
		render: function() {
			$('.main-view:not(#full-image)').hide();
			if (!this.model) {
				this.$el.empty()
				return;
			}

			// TODO check collection to see if there's a next/prev image

			this.$el.empty().append(this.template(this.model.attributes));

			$(this.img_selector).on('load', function(){
				fitImage(this);
			})

			this.$el.show();
			return this;
		},
	});
});
