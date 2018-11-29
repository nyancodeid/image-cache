/* This test need Internet connection to fetch
 * Image file from the Internet
 */

const ImageCacheProvider = require('../src/main')
const assert = require('assert')
const path = require('path')

const imageCache = new ImageCacheProvider({
  dir: path.join(__dirname, 'images/'),
  compressed: false
})

var url = 'http://webresource.c-ctrip.com/ResCRMOnline/R5/html5/images/57.png'
var urlYes = 'https://lh3.googleusercontent.com/-AUpXPK4IOi4/AAAAAAAAAAI/AAAAAAAAAAA/AI6yGXxcuACwUIVtH8VfdOlCD8KQjDDZSw/s32-c-mo/photo.jpg'
var urlNone = 'http://webresource.c-ctrip.com/ResCRM/57.png'

describe('imageCache Test', function () {
  describe('#Check is file cached', function () {
    /* isCached with Callback
		 * test isCached call with async function using callback.
		 *
		 * @expect Boolean 		false
		 */
    it('#isCached() {Callback} should be return false', function (done) {
      imageCache.isCached(url, (err, exist) => {
        if (err) done()

        assert.strictEqual(exist, false)

        done()
      })
    })
    /* isCached with Callback
		 * test isCached call with async function using Promise.
		 *
		 * @expect Boolean 		true
		 */
    it('#isCached() {Promise} should be return true', function (done) {
      imageCache.isCached(urlYes).then((exist) => {
        assert.strictEqual(exist, true)

        done()
      }).catch((e) => {
        done()
      })
    })
    /* isCachedSync
		 * test isCachedSync call with sync function.
		 *
		 * @expect Boolean 		false
		 */
    it('#isCachedSync() {Try} should be return false', function () {
      var exists = imageCache.isCachedSync(url)

      assert.strictEqual(exists, false)
    })
  })
  describe('#Get file from cached', function () {
    it('#get() {Callback} should be return error code ENOENT', function (done) {
      imageCache.get(url, function (error, result) {
        assert.strictEqual(error.code, 'ENOENT')

        done()
      })
    })
    // it('#get() {Promise} should be return object without error', function (done) {
    //   imageCache.get(urlYes).then((result) => {
    //     // console.log(result)
    //     assert.strictEqual(typeof result, 'object')
    //     assert.strictEqual(result.error, false)

    //     done()
    //   }).catch((error) => {
    //     assert.notStrictEqual(error.code, 'ENOENT')

    //     done()
    //   })
    // })
    it('#getSync() should be return error code ENOENT', function () {
      try {
        imageCache.getSync(url)
      } catch (e) {
        assert.strictEqual(e.code, 'ENOENT')
      }
    })
  })
  describe('#store a image', function () {
    it('should be false', function (done) {
      imageCache.compress().store(urlYes).then((result) => {
        // console.log(result)

        done()
      }).catch((e) => {
        done()
      })
    })
  })
  describe('#fetch a image ', function () {
    it('#fetch() {Callback} should be return false', function (done) {
      imageCache.fetch(urlNone, (err, result) => {
        assert.strictEqual(err, null)

        done()
      })
    })
    it('#fetch() {Promise} should be return false', function (done) {
      imageCache.fetch(urlYes).then((result) => {
        assert.strictEqual(result.error, false)

        done()
      }).catch(console.error)
    })
  })
})
