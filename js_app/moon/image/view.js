;(function(){
'use strict';

define([
	'moon/image/view/list',
	'moon/image/view/tile',
	'moon/image/view/full'
], function(
		List,
		Tile,
		Full
) {
	return {
		List: List,
		Tile: Tile,
		Full: Full,
	};
});

})();
