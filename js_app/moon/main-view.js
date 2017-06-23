;(function(){
'use strict';

define([
		'underscore',
		'backbone'
], function(
		_,
		Backbone,
) {
	return Backbone.View.extend({
		className: 'main-view',
		show: function() {
			Backbone.$('.main-view').removeClass('current-view');
			this.$el.addClass('current-view');
		}
	});

});

})();


