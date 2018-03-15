/* This test need Internet connection to fetch
 * Image file from the Internet
 */

const assert = require('assert')
const path = require('path')
const imageCache = require('../image-cache')

var url = 'http://webresource.c-ctrip.com/ResCRMOnline/R5/html5/images/57.png'
var urlYes = 'https://lh3.googleusercontent.com/-AUpXPK4IOi4/AAAAAAAAAAI/AAAAAAAAAAA/AI6yGXxcuACwUIVtH8VfdOlCD8KQjDDZSw/s32-c-mo/photo.jpg'
var urlNone = 'http://webresource.c-ctrip.com/ResCRM/57.png'

describe('imageCache Test', function () {
  beforeEach(function () {
    imageCache.setOptions({
      dir: path.join(__dirname, '/images/'),
      compressed: false
    })
  })

  describe('#Check is file cached', function () {
    /* isCached with Callback
		 * test isCached call with async function using callback.
		 *
		 * @expect Boolean 		false
		 */
    it('#isCached() {Callback} should be return false', function (done) {
      imageCache.isCached(url, function (err, exist) {
        assert.equal(exist, false)
        done(err)
      })
    })
    /* isCached with Callback
		 * test isCached call with async function using Promise.
		 *
		 * @expect Boolean 		true
		 */
    it('#isCached() {Promise} should be return true', function () {
      return imageCache.isCached(urlYes)
        .then(exist => assert.equal(exist, true))
    })
    /* isCachedSync
		 * test isCachedSync call with sync function.
		 *
		 * @expect Boolean 		false
		 */
    it('#isCachedSync() {Try} should be return false', function () {
      var exists = imageCache.isCachedSync(url)

      assert.equal(exists, false)
    })
  })
  describe('#Get file from cached', function () {
    it('#get() {Callback} should be return error code ENOENT', function (done) {
      imageCache.get(url, function (error, result) {
        assert.equal(error.code, 'ENOENT')
        done()
      })
    })
    it('#get() {Promise} should be return object without error', function () {
      return imageCache.get(urlYes)
        .then((result) => {
          assert.equal(typeof result, 'object')
          assert.equal(result.error, false)
        }).catch((error) => {
          assert.notEqual(error.code, 'ENOENT')
        })
    })
    it('#getSync() should be return error code ENOENT', function () {
      var result = imageCache.getSync(url)

      assert.equal(result.code, 'ENOENT')
    })
  })
  describe('#store a image', function () {
    it('should be false', function () {
      return imageCache.compress().store(urlYes)
        .catch(error => assert.notEqual(error.message.indexOf('Error fething image'), -1))
    })
  })
  describe('#fetch a image ', function () {
    it('#fetch() {Callback} should be return false', function (done) {
      imageCache.fetch(urlNone, (err, result) => {
        assert.notEqual(err, null)
        done()
      })
    })
    it('#fetch() {Promise} should be return false', () => {
      return imageCache
        .fetch(urlYes)
        .then(result => assert.equal(result.error, false))
    })
  })
  describe('#event test', function () {
    it('#onGet event', function (done) {
      imageCache.on('get', function (data) {
        assert.equal(typeof data, 'object')
        done()
      })
      imageCache.get(urlYes).then((result) => {
        assert.equal(result.error, false)
      })
    })
  })
})
