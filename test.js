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
});