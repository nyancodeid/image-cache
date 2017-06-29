var imageCache = require('./image-cachev2');
var image = "https://4.bp.blogspot.com/-QcLPmwZh-VI/WU5rEVtx9WI/AAAAAAAAfWo/Rs9IBKIuqbc94LlWVjoXNSM_HN-6dQpdgCLcBGAs/s400/%255BHorribleSubs%255D%2BYu-Gi-Oh%2521%2BVRAINS%2B-%2B07%2B720p-muxed_001_1409.png";

imageCache.isCached(image, (exists) => {
	console.log(exists);
});

// imageCache.getCache(image, (error, results) => {
// 	console.log(results.url);
// });

// var results = imageCache.getCacheSync(image);
// console.log(results.url);

// imageCache.setCache(image, (error, results) => {
// 	console.log(results);
// });

imageCache.fetchImage(image).then((results) => {
	
});

