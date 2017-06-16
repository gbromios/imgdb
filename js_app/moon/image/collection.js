'use strict'

define(
[ 'underscore', 'backbone', 'moon/image/model' ],
function( _, Backbone, Image) {
	return Backbone.Collection.extend({
		url: '/i',
		model: Image,
		comparitor: false,

		initialize: function(models, options) {
			this._paging = options.paging; // required
			this.query = options.query; // required
			this._xhr = null;

			// gonna need to keep track of where we are exactly,
			// but the details are not clear to me yet.
			this._cursor = null;

			Object.defineProperties(this, {
				lastID: {
					get: function() { return this.isEmpty() ? null : this.last().get('id'); }
				},
				firstID: {
					get: function() { return this.isEmpty() ? null : this.first().get('id'); }
				}
			});
		},

		setQuery: function(query, options = {}) {
			// TODO check: should i rload?
			var last_query = this.query;
			// don't think i need to verify new query, caveat emptor
			this.query = query;

			console.log(last_query);
			if (last_query && last_query.equals(query)) {
				// no need to reset our data (but do we need to page to it?)
				// check before/after/at params to see if we can satisfy them with the
				// data we already have. (& possibly reset paging?)
				if (query.imageID) {
					this.pageTo(query.imageID, options)
				}

				// also, options callbacks?

				console.log('no need to reset')
			} else {
				// we are resetting our dude.
				this.reset();
				this._xhr = null; // do I need to cancel the old one if it's in flight?
				this._paging = {}; // prolly should null this? not sure it matters.

				var success = options.success;
				var error = options.error;
				var thisArg = options.thisArg;
				var this_collection = this;

				this._xhr = this.fetch({
					remove: false,
					data: this.query.requestData(),
					success: function(collection, response, options) {
						collection._paging = response.paging;
						collection._xhr = null;
						if (success) {
							success.apply(thisArg, arguments);
						}
					},
					error: function(c, r, o) {
						if (error) {
							console.log('getMore: our fetch errd out:' , r)
							error.apply(thisArg, arguments);
						}
					},
				});

			}

		},

		parse: function(response, options) {
			// doesn't feel kosher to pull paging data here but where else?
			return response.data;
		},

		pageTo: function(imageID, options = {}) {
			// if an image was requested, make sure our collection includes it.
			// this could be handled better, but i'll need to make some server changes
			var image = this.get(imageID);

			var success = options.success;
			var error = options.error;
			var thisArg = options.thisArg;
			// do we have the image that they want to view?
			if (image) {
				// if so, we're fine.
				if (options.success) {
					options.success.call(options.thisArg, this);
				}
			} else {
				// otherwise, fill out our collection so it has our image (or try?)
				// can we ignore pre-existence of some other xhr here?
				var this_collection = this;
				this._xhr = this.fetch({
					remove: false,
					data: this.query.requestData({after: null, at: imageID}), // other dirs will be more complicated
					success: function(collection, response, options) {
						collection._paging = response.paging;
						collection._xhr = null;
						if (success) {
							success.apply(thisArg, arguments);
						}
					},
					error: function(c, r, o) {
						if (error) {
							console.log('getMore: our fetch errd out:' , r)
							error.apply(thisArg, arguments);
						}
					},
				});
			}

		},

		getMore: function(options = {}) {
			// don't spam the server while pages are loading
			if (this._xhr) {
				return;
			}

			if (this._paging.last_item && this._paging.last_item === this.lastID) {
				return;
			}

			var success = options.success;
			var error = options.error;
			var thisArg = options.thisArg;
			var this_collection = this;

			this._xhr = this.fetch({
				remove: false,
				data: this.query.requestData({after: this_collection.lastID, at: null}),
				success: function(collection, response, options) {
					collection._paging = response.paging;
					collection._xhr = null;
					if (success) {
						success.apply(thisArg, arguments);
					}
				},
				error: function(c, r, o) {
					if (error) {
						console.log('getMore: our fetch errd out:' , r)
						error.apply(thisArg, arguments);
					}
				},
			});

		},
		after: function() {
			return this.isEmpty() ? null : this.last().id;
		},

		nextOf: function(model) {
			var i = this.indexOf(model);

			if (i === -1) {
				return null;
			} else if (this._paging && model.id === this._paging.last_item) {
				return null;
			} else if (model.id === this.lastID) {
				// not found, but presumably it just hasnt been loaded yet
				return -1;
			} else {
				return this.at(i + 1);
			}

		}

	});
});
