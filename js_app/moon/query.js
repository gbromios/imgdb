;(function(){
'use strict';

define([
		'backbone',
		'underscore',
		'moon/options',
		'lib/jquery-deparam'
], function(
		Backbone,
		_,
		Options,
		deparam
) {

	// once I get a feel for how i want this to work, i will probably
	// re-introduce Backbone.Router into the mix. for now, this can just
	// manually parse its own paths (there arent too many)
	var _started = false;
	var _window = null;
	var _last = null;

	var Query = function(args, path) {
		this.args = args || {};
		this.path = path || '';

		Object.defineProperties(this, {
			isTag: { get: () => this._isTag() },
			isImage: { get: () => this._isImage() },
			imageID: { get: () => this._imageID() },
			tagID:   { get: () => this._tagID() },
			search: { get: () => this._search() },
			fullPath: { get: () => '/' + this.path + '?' + this.search }
		});
	}

	Backbone.$.extend(Query, Backbone.Events);

	Query.prototype.go = function() {
		// TODO might need to test redundancy check some more.
		if (this.path !== _last.path) {
			_window.history.pushState(this.args, undefined, '/' + this.path);
		}

		this.load();

	};

	Query.prototype.load = function() {
		_last = this
		// this will surely be a little more complex. for now, just sorta hack in
		// what was already there.
		if (this.path === 'tags') {
			// just show the tags, lul
			_window.moon.tag_view.render();
			return;
		}

		var event = this.isImage ? 'goto.moon.img' : 'goto.moon.list';
		return Query.trigger(event, this);
	};


	Query.prototype._search = function() {
		var args = _.clone(this.args);
		// TODO - still need to sort tag-based paths out before I
		// use this, but it'll need some work
		return Backbone.$.param(args)
	};

	Query.prototype._isTag = function() {
		// valid image names are never valid tag names
		// but the reverse is possible (wait... is it tho?)
		if (this.isImage) {
			return false;
		} else if (this.path.match(/^[\w]{2,39}/)) {
			return true;
		} else {
			return false;
		}
	};

	Query.prototype._isImage = function() {
		// looks at the path to determine if this is an image
		if (this.path.match(/^[a-f0-9]{40}$/)) {
			return true;
		} else if (this.path.match(/.*\.[a-z]{3,4}$/)){
			return true;
		} else if (this.path.match(/^[0-9]{1,8}$/)){
			return true;
		} else {
			return false;
		}
	};

	Query.prototype._tagID = function() {
		if (this.isTag) {
			return this.path;
		} else if (this.args.tag) {
			return this.args.tag;
		} else {
			return null;
		}
	};

	Query.prototype._imageID = function() {
		if (this.isImage) {
			// can get directly in the path.
			// if it's an int, assuem they want an int
			if (this.path.match(/^[0-9]{1,8}$/)) {
				return parseInt(this.path);
			} else {
				return this.path;
			}
		} else if (this.args.at) {
			// an 'at' argument will also work
			return this.args.at;
		} else {
			return null;
		}

	};

	Query.prototype.toImage = function (image) {
		// can use the explicit image param, or fall back to the at param
		// includes leading '/'
		var path = '';
		var args = _.clone(this.args);

		if (image) {
			// an Image model or an id
			path = (image.id ? image.id : image).toString();
		} else if (this.isImage) {
			path += this.path;
		} else if (args.at) {
			path += args.at
		} else {
			throw "not enough information to make an image query: need an image/id argument, id in the path OR an at argument";
		}

		delete args.at;

		// TODO I think ima switch up how tag paths work
		if (this.isTag) {
			console.log('yep');
			args.tag = this.path;
		}

		return new Query(args, path);
	};

	Query.prototype.toList = function() {
		var args = _.clone(this.args);
		var path = '';

		if (this.isImage) {
			args.at = this.path
		}

		if (this.isTag) {
			path = this.path
		} else if (args.tag) {
			path = args.tag;
			delete args.tag;
		} else {
			path = '';
			console.log('no tag toList:', path)
		}

		return new Query(args, path);

	};

	Query.prototype.requestData = function(extraArgs) {
		var args = _.clone(this.args);
		if (this.isImage) {
			args.at = this.path;
		} else if (this.isTag) {
			args.tag = this.path
		}

		if (!args.rudeness) {
			args.rudeness = Options.nsfw === '0' ? 1 : 2;
		}

		_.extend(args, extraArgs);

		if (!args.count) {
			args.count = 100;
		}

		return _.omit(args, function(val){ return val === null; });

	};

	Query.prototype.equals = function(other) {
		// i.e.: do these two queries always necessitate a reset+load for the
		// collection using them? the collection may still need to page up to the
		// data it wants
		if (!other) {
			return false;
		}

		var ignore = ['count','before','after','at'];
		return _.isEqual(
			_.omit(this.requestData(), ignore),
			_.omit(other.requestData(), ignore)
		);

	};

	Query.prototype.transform = function(args, path) {
		if (path === undefined) {
			path = this.path;
		}
		var args = _.extend(this.args, args);
		return new Query(args, String(path));
	};

	Query.fromLocation = function() {
		// remove leading question mark and turn query string into an object
		var args = deparam(_window.location.search.replace(/^\?/, ''));
		// remove leading slash
		var path = _window.location.pathname.replace(/^\/+|\/+$/g, '');

		// some special cases that are not query-able
		// TODO can get rid of this once I fix how the tag list is displayed
		if (path === 'tags') {
			return new Query({}, path); // TODO temporary haxxor
		} else if (path === 'tagme') {
			return null;
		}

		return new Query(args, path);

	};

	Query.fromURL = function () {
		// NYI - takes a whole url string and parses out pathname/search
	};

	Query.fromState = function(state) {
		// i.e. a popstate event.state
	};

	Query.start = function(window) {
		// save the initial state so we know where to go
		if (_started) { throw "you already started!"; }

		_started = true;
		_window = window;

		// save the initial state so we know where to go
		// probably just want to load it up here? might need to re-think that.
		var base_query = Query.fromLocation();
		_last = base_query;

		_window.onpopstate = function(event) {
			//console.log('popped state', event.state, _window.location.pathname);
			var args = event.state;
			var path = _window.location.pathname.replace(/^\/+|\/+$/g, '')
			console.log('POP', args, path)
			if (args === null) {
				// this is the base query; page load.
				base_query.load();
			} else {
				new Query(args, path).load();
			}
		};

		return base_query;

	};


	return Query;

});

})();
