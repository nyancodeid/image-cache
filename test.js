var imageCache = require('./image-cache');
var path = require('path');
var fs = require("fs");

imageCache.setOptions({
	dir: path.join(__dirname, 'images/'),
	compressed: true,
	extname: '.cache'
});

imageCache.isCached('https://eladnava.com/content/images/2015/11/js-6.jpg', function(exist) {
	console.log(exist);
	if (!exist) {
		imageCache.setCache([
			'https://eladnava.com/content/images/2015/11/js-6.jpg'
		], function(error) {
			console.log(error);
		});
	} else {
		imageCache.getCache('https://eladnava.com/content/images/2015/11/js-6.jpg', function(error, image) {
			console.log(image.url);
		});
	}
});

imageCache.flushCache(function(error, results) {
	if (error) {
		console.log(error);
	} else {
		console.log(results);
	}
});