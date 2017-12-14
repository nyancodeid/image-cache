/* This test need Internet connection to fetch 
 * Image file from the Internet
 */

const imageCache = require('../image-cache');
const assert = require('assert');



var url = 'http://webresource.c-ctrip.com/ResCRMOnline/R5/html5/images/57.png';
var urlYes = "https://lh3.googleusercontent.com/-AUpXPK4IOi4/AAAAAAAAAAI/AAAAAAAAAAA/AI6yGXxcuACwUIVtH8VfdOlCD8KQjDDZSw/s32-c-mo/photo.jpg";
var urlNone = 'http://webresource.c-ctrip.com/ResCRM/57.png';

describe('imageCache Test', function() {
	beforeEach(function() {
		imageCache.setOptions({
			dir: __dirname + "/images/",
			compressed: false
		});
	});

	describe('#Expect Error', function() {
		describe('#Check is file cached', function() {
			it('#isCached() {Callback} should be return false', function(done) {
				imageCache.isCached(url, function(err, exist) {
					assert.equal(exist, false);

					done();
				});
			});
			it('#isCached() {Promise} should be return false', function(done) {
				imageCache.isCached(url).then((exist) => {
					assert.equal(exist, false);

					done();
				}).catch((e) => {
					done();
				});
			});
			it('#isCachedSync() {Try} should be return false', function() {
				var exists = imageCache.isCachedSync(url);
				
				assert.equal(exists, false);
			});
		});
		describe('#Get file from cached', function() {
			it('#get() {Callback} should be return error code ENOENT', function(done) {
				imageCache.get(url, function(error, result) {
					assert.equal(error.code, "ENOENT");

					done();
				});
			});
			it('#get() {Promise} should be return error code ENOENT', function(done) {
				imageCache.get(url).catch((error) => {
					assert.equal(error.code, "ENOENT");

					done();
				});
			});
			it('#getSync() should be return error code ENOENT', function() {
				var result = imageCache.getSync(url);
				
				assert.equal(result.code, "ENOENT");
			});
		});
		
	});
	describe('#Expect Success', function() {
		// it('#getCache() should be return type Object', function(done) {
		// 	imageCache.getCache(urlYes, function(error, result) {
		// 		assert.equal(typeof result, "object");

		// 		done();
		// 	});
		// });
	});
});