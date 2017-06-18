'use strict'
define([
		'backbone',
		'moon/image/model',
		'moon/image/collection',
		'moon/image/view'
], function(
		Backbone,
		Model,
		Collection,
		View
) {
	return Backbone.$.extend({
		View: View,
		Collection: Collection,
		Model: Model,
	}, Backbone.Events);
});

