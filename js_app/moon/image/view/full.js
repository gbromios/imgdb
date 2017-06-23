;(function(){
'use strict';

define( [
		'backbone',
		'handlebars',
		'moon/query',
		'moon/options',
		'moon/main-view',
], function(
		Backbone,
		Handlebars,
		Query,
		Options,
		MainView
) {
	return MainView.extend({
		id: 'full-image',
		tagName: 'div',
		template: Handlebars.compile($('#full-image-template').html()),
		events: {
			'click .taglist > a': function(e) {
				e.preventDefault();
				// TODO - meh
				new Query({}, e.currentTarget.innerHTML).go();
			},
			'click #full-image': function(e) { console.log('eat it');},
			'load #full-image > img': function(e) {
				// why wont this trigger :(
				console.log('what gives');
			}
		},
		initialize: function(options) {
			Backbone.$.extend(this, options);

			this.img_selector = '#full-image > img';

			this.listenTo(Query, 'goto.moon.img', this.go);
			this.listenTo(Options, 'setOption.moon', function(opt) {
				if (opt.key === 'fit') { this.fit(); }
			});

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

			// TODO clean these conditions up somehow
			if ((Options.fit === 'fit-both' || Options.fit === 'fit-h') && image.width() > this.screen.imageWidth) {
				image.css('width', this.screen.imageWidth);
			}
			if ((Options.fit === 'fit-both' || Options.fit === 'fit-v') && image.height() > this.screen.imageHeight) {
				image.removeAttr('style');
				image.css('height', this.screen.imageHeight);
			}

		},
		render: function() {
			this.show();
			this.$el.empty();
			if (!this.model) {
				// show a loading spinny
			} else {
				this.$el.empty().append(this.template(this.model.attributes));
				// TODO tried listening to this using event attribute, but it wont work. fix it.
				$(this.img_selector).on('load', function(e){ this.fit(); }.bind(this))
			}
			return this;
		},
	});
});

})();
