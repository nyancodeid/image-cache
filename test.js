var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var imageCache = require('./image-cache');


describe('imageCache Test', function() {
	beforeEach(function() {
		imageCache.setOptions({
			dir: "images/",
			compressed: false
		});
	});

	describe('#isCached()', function() {
		it('should be return false', function(done) {
			var url = 'http://webresource.c-ctrip.com/ResCRMOnline/R5/html5/images/57.png';

			imageCache.isCached(url, function(exist) {
				assert.equal(exist, false);

				done();
			});
		});
	});

	describe('#getCache()', function() {
		it('should be return error 301 moved', function(done) {
			var url = ['https://lh3.googleusercontent.com/-AUpXPK4IOi4/AAAAAAAAAAI/AAAAAAAAAAA/AI6yGXxcuACwUIVtH8VfdOlCD8KQjDDZSw/s32-c-mo/photo.jpg'];

			imageCache.setCache(url, {googleCache: true, resize: false},function(error) {
				console.log(url);
				
				done();
			});
		});
	});
});