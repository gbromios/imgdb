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
	var Query = function(args, path) {
		this.args = args || {};
		this.path = path || '';

		Object.defineProperties(this, {
			isTag: { get: () => this._isTag() },
			isImage: { get: () => this._isImage() },
			imageID: { get: () => this._imageID() }
		});
	}

	Backbone.$.extend(Query, Backbone.Events);

	Query.prototype.go = function() {
		// if I ever want to extend query beyond these two cases, I'll subclass it
		return Query.trigger(this.isImage ? 'goto.moon.img' : 'goto.moon.list', this);
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

	Query.prototype.imageURL = function () {
		// can use the explicit image param, or fall back to the at param
		// includes leading '/'
		var path = '/';
		var args = _.clone(this.args);

		if (this.isImage) {
			path += this.path;
		} else if (args.at) {
			path += args.at
			delete args.at;
		} else {
			throw "not enough information to make an image url: need an id in the path OR an at argument"
		}

		var search = Backbone.$.param(args)
		if (search) {
			path += '?' + search;
		}

		return path;
	};

	Query.prototype.listURL = function() {
		// includes leading '/'

		var args = _.clone(this.args);
		var path = '/';

		if (this.isImage) {
			args.at = this.path
		}

		if (this.isTag) {
			path += this.path
		} else if (args.tag) {
			path += args.tag;
			delete args.tag;
		}

		var search = Backbone.$.param(args)
		if (search) {
			path += '?' + search;
		}
		return path;

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

		if (!args.count) {
			args.count = 100;
		}

		// args can be overridden if desired. careful about sending count: null
		_.extend(args, extraArgs);

		// dont send nulls to the api pls
		return _.omit(args, function(val){ return val === null; });

	};


	Query.prototype.equals = function(other) {
		// i.e.: do these two queries always necessitate a reset+load for the
		// collection using them? the collection may still need to page up to the
		// data it wants

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
		var args = deparam(window.location.search.replace(/^\?/, ''));
		// remove leading slash
		var path = window.location.pathname.replace(/^\/+|\/+$/g, '');

		// some special cases that are not query-able
		// TODO can get rid of this once I fix how the tag list is displayed
		if (path === 'tags') {
			return null;
		} else if (path === 'tagme') {
			return null;
		}

		return new Query(args, path);

	};

	Query.fromURL = function () {
		// NYI - takes a whole url string and parses out pathname/search
	};

	return Query;

});

})();
