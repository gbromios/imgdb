'use strict'
define(
[        'jquery', 'underscore', 'backbone'],
function( $,        _,            Backbone ) {
	return function(){

	var image = window.moon.images.first().toJSON();

	window.moon.list_view.remove();
	var categories = {};
	var tags = JSON.parse($('script#tag-data').text());
	tags.forEach(function(t){
		if (categories.hasOwnProperty(t.category)) {
			categories[t.category].push(t.name);
		} else {
			categories[t.category] = [t.name];
		}
	});

	var img = $('<img>')
		.attr('src', image.link.thumb)
		.on('click', function(){
			this.src = this.src.match('/tn/') ? image.link.name : image.link.thumb;
			juiceBar.focus();
		}).css('margin','5px')
	;
	var catLists = $('<div>').addClass('cat-lists');

	var juiceBar = $('<input>')
		.attr('type', 'text')
		.css({
			display: 'block',
			margin: '5px',
			'font-size': '20px'
		})
		.on('keypress', function(e){
			if (e.which === 13 && catLists.children('li').length === 1) {
				postTag(image, catLists.children('li')[0].innerHTML);
				fillCatLists(catLists);
				juiceBar.val('').focus();
			}
		})
		.on('input', _.debounce(function(){
			console.log('wat');
			var text = this.value;
			text = text
				.toLowerCase()
				.replace(/\ +/g, '_')
				.replace(/\W+/g, '')
			;
			this.value = text;

			if (text === '') {
				fillCatLists(catLists);
			} else {
				catLists.empty();
				tags.filter(function(tag){
					return tag.name.match(text) !== null;
				}).forEach(function(tag){
					catLists.append($('<li>')
						.text(tag.name)
						.css({margin: '5px', 'font-size': '2em'})
						.on('click', function(){
							postTag(image, this.innerHTML);
							fillCatLists(catLists);
							juiceBar.val('').focus();
						})
					);
				});
			}
		}, 350))
	;

	$('body')
		.empty()
		.append($('<a>').attr('href', '/'+image.id).text(image.id + ': ' + image.nice_name).css({'width':'100%', 'text-align':'center','font-size': '2.33em', position: 'absolute', left: '5px', top: '5px', color: 'white', 'text-shadow':'2px 2px 0 #000, 1px 1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, -1px -1px 0 #000'}))
		.append(img)
		.append(juiceBar)
		.append(catLists)
	;

	fillCatLists(catLists);
	juiceBar.focus();


	function fillCatLists (target){
		target.empty();
		Object.keys(categories).sort().forEach(function (k) {
			var cg = categories[k];
			var ul = $('<ul>')
				.append($('<li>').text(k).css({'font-size': '1em', 'margin':'5px', 'color': '#dc3148'}))
				.css({'display':'inline-flex', 'flex-direction':'row', 'line-height':'18px', 'vertical-align': 'middle', 'flex-wrap':'wrap'})
			;
			cg.sort().forEach(function(t){
				ul.append($('<li>')
					.text(t)
					.css({'font-size': '1em', 'margin':'5px'})
					.on('click', function() {
						$(this).css('color', 'gray');
						console.log(this.innerHTML)
						postTag(image, this.innerHTML);
					})
				);
			});
			target.append(ul);
		});
	};

	function postTag(image, tag){
		$.ajax('/ti', {
			type: 'POST',
			data: { image_id: image.id, tag: tag.name || tag},
			success: function(reply){ console.log(reply) },
			error: function(xhr, status, error){ console.log('ERROR', error) }
		})
	};

	window.tt = function(id, tag) { postTag({id:id}, tag) };



	}
});

