'use strict'

define(
[ 'underscore', 'backbone', 'moon/image/model' ],
function( _, Backbone, Image) {
	return Backbone.Collection.extend({
		url: '/i',
		model: Image,
		comparator: 'id',

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

			if (last_query && last_query.equals(query)) {
				// no need to reset our data.
			} else {
				// we are resetting our dude.
				this.reset();
				this._xhr = null; // do I need to cancel the old one if it's in flight?
				this._paging = null;

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
							console.log('setQuery (load): our fetch errd out:' , r)
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

		getNextPage: function(options = {}) {
			// don't spam the server while pages are loading
			if (this._xhr) {
				return;
			}

			if (this._paging.last_item && this._paging.last_item === this.lastID) {
				// nothing more to get
				return;
			}

			var success = options.success;
			var error = options.error;
			var thisArg = options.thisArg;
			var this_collection = this;

			this._xhr = this.fetch({
				remove: false,
				data: this.query.requestData({
					after: this_collection.lastID,
					at: null
				}),
				success: function(collection, response, options) {
					console.log(response.paging);
					collection._xhr = null;
					if (success) {
						success.apply(thisArg, arguments);
					}
				},
				error: function(c, r, o) {
					if (error) {
						console.log('getNextPage: our fetch errd out:' , r)
						error.apply(thisArg, arguments);
					}
				},
			});

		},

		nextOf: function(model) {
			var i = this.indexOf(model);

			if (i === -1) {
				return null; // the given model isn't in the collection. should probably be a throw.
			} else if (this._paging && model.id === this._paging.last_item) {
				return null; // there are no more models.
			} else if (model.id === this.lastID) {
				// not found, but presumably it just hasnt been loaded yet
				return -1;
			} else {
				return this.at(i + 1);
			}

		},

		getPrevPage: function(options = {}) {
			// don't spam the server while pages are loading
			if (this._xhr) {
				return;
			}

			if (this._paging.first_item && this._paging.first_item === this.firstID) {
				// nothing more to get
				return;
			}

			var success = options.success;
			var error = options.error;
			var thisArg = options.thisArg;
			var this_collection = this;

			this._xhr = this.fetch({
				remove: false,
				data: this.query.requestData({
					before: this_collection.firstID,
					at: null
				}),
				success: function(collection, response, options) {
					console.log(response.paging);
					collection._xhr = null;
					if (success) {
						success.apply(thisArg, arguments);
					}
				},
				error: function(c, r, o) {
					if (error) {
						console.log('getNextPage: our fetch errd out:' , r)
						error.apply(thisArg, arguments);
					}
				},
			});

		},

		prevOf: function(model) {
			var i = this.indexOf(model);

			if (i === -1) {
				return null; // the given model isn't in the collection. should probably be a throw.
			} else if (this._paging && model.id === this._paging.first_item) {
				return null; // there are no more models.
			} else if (model.id === this.firstID) {
				// not found, but presumably it just hasnt been loaded yet
				return -1;
			} else {
				return this.at(i - 1);
			}
		}

	});
});
