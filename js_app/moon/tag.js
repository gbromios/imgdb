'use strict'
define([
		'moon/tag/list-view',
], function(
		ListView
) {
	return Backbone.$.extend({
		View: {
			List: ListView
		}
	}, Backbone.Events);
});

