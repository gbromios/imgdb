'use strict'

define(
[ 'underscore', 'backbone', 'moon/image/model' ],
function( _, Backbone, Image) {
	return Backbone.Collection.extend({
		url: '/i',
		model: Image,
		comparator: function(a, b) {
			if (this.query.args.order === 'random' || a.id < b.id) {
				return -1;
			} else {
				return 1;
			}
		},
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

		doQuery: function(query, args = {}) {
			// TODO check: should i rload?
			var last_query = this.query;
			// don't think i need to verify new query, caveat emptor
			this.query = query;

			if (last_query && last_query.equals(query) && !args.page) {
				// no need to reset our data.
				if (args.success) {
					args.success.apply(args.thisArg, arguments);
				}
			} else {
				// we are resetting our dude.
				if (!args.page) {
					this.reset();
				}
				// TODO: if there's a request we either have to abandon it or wait for it.
				if (this._xhr) {
					console.log('current request overridden by new query');
					this._xhr.abort('got new query.');
					this._xhr = null;
					this._paging = null;
				}

				this._xhr = this.fetch({
					remove: args.remove || false, // this should proably actually be true by default
					data: args.data || this.query.requestData(),
					success: function(collection, response, options) {
						collection._xhr = null;
						if (!args.page) {
							collection._paging = response.paging;
						}
						if (args.success) {
							args.success.apply(args.thisArg, arguments);
						}
					},
					error: function(collection, response, options) {
						collection._xhr = null;
						// not calling args.error callback yet b/c im lazy
						console.log('doQuery (load): our fetch errd out:' , response);
					},
				});

			}

		},

		parse: function(response, options) {
			// doesn't feel kosher to pull paging data here but where else?
			return response.data;
		},

		getNextPage: function(args = { data: {} }) {
			// don't spam the server while pages are loading
			if (this._xhr) {
				return;
			}

			if (this._paging.last_item && this._paging.last_item === this.lastID) {
				// nothing more to get
				return;
			}

			var data = _.extend(this.query.requestData({
				after: this.lastID,
				at: null
			}), args.data);

			return this.doQuery(this.query, Backbone.$.extend(args, {
				page: true,
				data: data
			}));
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

		getPrevPage: function(args = { data: {} }) {
			// don't spam the server while pages are loading
			if (this._xhr) {
				return;
			}

			if (this._paging.first_item && this._paging.first_item === this.firstID) {
				// nothing more to get
				return;
			}

			var data = _.extend(this.query.requestData({
				before: this.firstID,
				at: null
			}), args.data);

			return this.doQuery(this.query, Backbone.$.extend(args, {
				page: true,
				data: data
			}));

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
		},

		hasImage: function(id) {
			var d = Backbone.$.Deferred();
			var image = this.get(id);
			var collection = this;

			if (image) {
				// we already have this image
				d.resolve(image);
			} else if (this._xhr) {
				// we dont have this image, but the current api request is probably getting it.
				this._xhr.done(function(response, status, xhr){
					console.log('xhrdone', this, arguments)
					var image = collection.get(id);
					if (image) {
						d.resolve(image);
					} else {
						d.reject('image "' + id + '" wasnt in the last request!');
					}
				});
			} else {
				d.reject('image "' + id + '" isnt in the collection and no request is in flight!');
				// TODO annoying to extend collection backwards when using the back button 
				// but i think i have a decent fix. back button makes it
			}

			return d.promise();
		},

	});
});
