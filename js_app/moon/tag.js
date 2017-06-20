;(function(){
'use strict';

define([
		'moon/tag/view/list',
], function(
		ListView,
) {
	return Backbone.$.extend({
		View: {
			List: ListView
		}
	}, Backbone.Events);
});

})();
