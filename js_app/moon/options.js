;(function(){
'use strict';

define([
		'underscore',
		'backbone'
], function(
		_,
		Backbone
) {

	var store = window.localStorage;

	var options = {
		theme: { default: 'day', allowed: ['day','night'] },
		fit:   { default: 'fit-both', allowed: ['fit-both', 'fit-h', 'fit-v', 'fit-none'] },
		rudeness: { default: '0', allowed: ['0', '1'] },
		random: { default: '0', allowed: ['0', '1'] }
	};

	var properties = _.mapObject(options, function(value, key){
		return {
			get: function() {
				var stored_value = store.getItem(key);
				if (stored_value === null) {
						return options[key].default;
				} else if (options[key].allowed.indexOf(stored_value) === -1) {
					store.removeItem(key);
					return options[key].default;
				} else {
					return stored_value;
				}
			},
			set: function(new_value) {
				if (options[key].allowed.indexOf(new_value) === -1) {
					// TODO should probably just throw i think.
					console.log('options error: cant set', key, 'to', new_value, '; allowed:', options[key].allowed);
					return;
				} else if (new_value === this[key]) {
					// key already set to value, no event
					return;
				} else if (new_value === options[key].default) {
					store.removeItem(key);
				} else {
					store.setItem(key, new_value)
				}
				this.trigger('setOption.moon', { key: key, value: new_value });
			}
		};
	});

	// might make this do events but no need atm
	return Object.defineProperties(Backbone.$.extend({}, Backbone.Events), properties);

});

})();
