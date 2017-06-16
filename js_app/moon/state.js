'use strict'
define(
//[        'jquery', 'underscore', 'backbone']
//function( $,        _,            Backbone ) {
[        'backbone'],
function( Backbone ) {
	var State = function() {
		_.extend(this, Backbone.Event);
	};

	State.prototype.pushState = function (state) {
	};

	return State;
});
