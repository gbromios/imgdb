'use strict'
define(
[        'backbone', 'handlebars', 'moon/query'],
function( Backbone,   Handlebars,   Query) {
	return Backbone.View.extend({
		id: 'full-image',
		className: 'main-view',
		tagName: 'div',
		events: {
			'click #full-image': function(e) { console.log('eat it');},
			'load #full-image > img': function(e) {
				console.log('what gives');
			}
		},
		initialize: function(options) {
			Backbone.$.extend(this, options);
			this.template = Handlebars.compile($('#full-image-template').html());
			// i dont think i can put this under the normal events attribute

			this.listenTo(Query, 'goto.moon.img', this.go);
			this.img_selector = '#full-image > img';

		},
		go: function(query) {
			if (!query.isImage) {
				return;
			}

			var model = this.images.get(query.imageID);

			// did we get a model from the image collection?
			if (model) {
				// update our model and re-render if the model changed.
				this.model = model;
				this.render();
			} else {
				// TODO show loading spinner.
				this.model = null;
				var full = this;
				this.images.hasImage(query.imageID).then(function(model){
					// TODO hide loading spinner
					full.model = model;
					full.render();
				}).catch(function(error){
					// we aint loading ur image.
					console.log('cant go to image' + error)
				});
			}
			return this;
		},
		fit: function() {
			var image = $(this.img_selector);
			console.log(image, this.img_selector)
			image.removeAttr('style');

			console.log(image.width(), this.screen.imageWidth);

			if (image.width() > this.screen.imageWidth) {
				image.css('width', this.screen.imageWidth);
			}
			if (image.height() > this.screen.imageHeight) {
				image.removeAttr('style');
				image.css('height', this.screen.imageHeight);
			}

		},
		render: function() {
			$('.main-view:not(#full-image)').hide();
			if (!this.model) {
				this.$el.empty()
				// show the loader.
				return;
			}

			// TODO check collection to see if there's a next/prev image

			this.$el.empty().append(this.template(this.model.attributes));

			$(this.img_selector).on('load', function(e){ this.fit(); }.bind(this))

			this.$el.show();
			return this;
		},
		loaded: function() {
			if (!$(this.img_selector).length) {
				return false;
			}
			var img = $(this.img_selector)[0];

			if (!img.complete) {
				return false;
			}

			if (typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0) {
				return false;
			}

			return true;

		}
	});
});
