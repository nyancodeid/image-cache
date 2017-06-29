var assert = require('assert');
var imageCache = require('../image-cache');

var url = 'http://webresource.c-ctrip.com/ResCRMOnline/R5/html5/images/57.png';
var urlNone = 'http://webresource.c-ctrip.com/ResCRM/57.png';
var urlYes = "https://lh3.googleusercontent.com/-AUpXPK4IOi4/AAAAAAAAAAI/AAAAAAAAAAA/AI6yGXxcuACwUIVtH8VfdOlCD8KQjDDZSw/s32-c-mo/photo.jpg";

describe('imageCache Test', function() {
	beforeEach(function() {
		imageCache.setOptions({
			dir: __dirname + "/images/",
			compressed: false
		});
	});

	describe('#Expect Error', function() {
		it('#isCached() should be return false', function(done) {
			imageCache.isCached(url, function(exist) {
				assert.equal(exist, false);

				done();
			});
		});
		it('#isCachedSync() should be return false', function() {
			var exists = imageCache.isCachedSync(url);
			
			assert.equal(exists, false);
		});
		it('#getCache() should be return error code ENOENT', function(done) {
			imageCache.getCache(url, function(error, result) {
				assert.equal(error.code, "ENOENT");

				done();
			});
		});
		it('#getCacheSync() should be return error code ENOENT', function() {
			try	{
				var result = imageCache.getCacheSync(url);
			} catch(error) {
				assert.equal(error.code, "ENOENT");
			}
		});
	});
	describe('#Expect Success', function() {
		it('#getCache() should be return type Object', function(done) {
			imageCache.getCache(urlYes, function(error, result) {
				assert.equal(typeof result, "object");

				done();
			});
		});
	});
});