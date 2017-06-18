'use strict'
define(
[        'backbone', 'handlebars', 'moon/query'],
function( Backbone,   Handlebars,   Query) {
	return Backbone.View.extend({
		id: 'full-image',
		className: 'main-view',
		tagName: 'div',
		events: {
			'load #full-image > img': function(e) {
				var image = $(e.target);
				image.removeAttr('style');
				if (image.width() > Screen.imageWidth) {
					image.css('width', Screen.imageWidth);
				}
				if (image.height() > Screen.imageHeight) {
					image.removeAttr('style');
					image.css('height', Screen.imageHeight);
				}
			}
		},
		initialize: function(options) {
			Backbone.$.extend(this, options);
			this.template = Handlebars.compile($('#full-image-template').html());
			// i dont think i can put this under the normal events attribute

			this.listenTo(Query, 'goto.moon.img', this.go);

		},
		go: function(query) {
			if (!query.isImage) {
				return;
			}

			var model = this.images.get(query.imageID);

			// did we get a model from the image collection?
			if (model) {
				// update our model and re-render if the model changed.
				if (!this.model || model.id !== this.model.id) {
					this.model = model;
					this.render();
				}
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
		render: function() {
			$('.main-view:not(#full-image)').hide();
			if (!this.model) {
				this.$el.empty()
				// show the loader.
				return;
			}

			// TODO check collection to see if there's a next/prev image

			this.$el.empty().append(this.template(this.model.attributes));

			$(this.img_selector).on('load', function(e){ this.fit(e); })

			this.$el.show();
			return this;
		},
	});
});
