;(function(){
'use strict';

define([
		'backbone',
		'moon/controls/top',
		'moon/controls/search'
], function(
		Backbone,
		Top,
		Search
) {
	return Backbone.$.extend({
		Top: Top,
		Search: Search,
	}, Backbone.Events);
});

})();
