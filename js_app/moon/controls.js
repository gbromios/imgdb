;(function(){
'use strict';

define([
		'backbone',
		'moon/controls/top',
		'moon/controls/search',
		'moon/controls/settings'
], function(
		Backbone,
		Top,
		Search,
		Settings
) {
	return Backbone.$.extend({
		Top: Top,
		Search: Search,
		Settings: Settings
	}, Backbone.Events);
});

})();
