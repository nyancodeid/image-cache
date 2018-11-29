const Core = require('./core')
const _ = require('underscore')
const path = require('path')
const fs = require('fs')

/**
 * image-cache - Image Cache Async with Base64
 * @author Ryan Aunur Rassyid <Indonesia><ryandevstudio@gmail.com>
 */

/** imageCache class
 * @description imageCache extends from Core
 */
class imageCache extends Core {
  constructor (options) {
    super(options)
  }

  compress () {
    this.inlineCompress = true

    return this
  }
  /** isCached
	 * @description Async function check is image on argument available on cache
	 *
	 * @param {String}
	 * @param {Function}
	 * @return Promise
	 */
  isCached (image, callback) {
    if (_.isFunction(callback)) {
      return this.isCachedService(image).then(res => {
        callback(null, res)
      }).catch(error => {
        callback(error)
      })
    }

    return this.isCachedService(image)
  }
  /** isCachedSync
	 * @description check is image available on cached / already cached?
	 *
	 * @param {String} image
	 * @return {Boolean}
	 */
  isCachedSync (image) {
    try {
      return fs.statSync(this.getFilePath(image))
    } catch (e) {
      return false
    }
  }

  /** get() ASYNC
	 * @description Get cached image from folder using same url
	 *
	 * @param {String|Array} image
	 * @return {Callback|Promise}
	 */
  get (image, callback) {
    if (_.isFunction(callback)) {
      return this.getCacheService(image).then(res => {
        callback(null, res)
      }).catch(error => {
        callback(error)
      })
    }

    return this.getCacheService(image)
  }
  /** getSync() SYNC
	 * @description get image from cache
	 *
	 * @param {String|Array} 	image
	 * @return {Callback|Promise}
	 */
  getSync (image) {
    return this.readFileSync(image)
  }

  /** store() ASYNC
	 * @description store image as a cache
	 *
	 * @param {String|Array} images
	 * @return {Function|Promise}
	 */
  store (images, callback) {
    if (_.isFunction(callback)) {
      return this.storeCacheService(images).then(res => {
        callback(null, res)
      }).catch(error => {
        callback(error)
      })
    }

    return this.storeCacheService(images)
  }

  /**
	 * @description check is image already on cache will be return as cache or is not available
	 * on cache folder then will be return as image (and cached)
	 *
	 * @param {String|Array} images
	 * @param {Function|Promise} callback
	 */
  fetch (images, callback) {
    if (_.isFunction(callback)) {
      return this.fetchImagesService(images).then(res => {
        callback(null, res)
      }).catch(error => {
        callback(error)
      })
    }

    return this.fetchImagesService(images)
  }

  /**
	 * @description remove image from cache folder
	 *
	 * @param {Array|String} images
	 */
  remove (images, callback) {
    if (_.isFunction(callback)) {
      this.removeCacheService(images).then(res => {
        callback(null, res)
      }).catch(error => {
        callback(error)
      })
    } else {
      return this.removeCacheService(images)
    }
  }

  /**
	 * @description remove all cached image on Cache Directory
	 *
	 */
  flush (callback) {
    if (_.isFunction(callback)) {
      this.flushCacheService().then(res => {
        callback(null, res)
      }).catch(error => {
        callback(error)
      })
    } else {
      return this.flushCacheService()
    }
  }
  /**
	 * @description remove all cached image on Cache Directory Syncronius function
	 *
	 */
  flushSync () {
    var files = fs.readdirSync(this.options.dir)
    var deletedFiles = 0

    if (_.isEqual(files.length, 0)) {
      throw new Error({
        message: `ERR_EMPTY: ${this.options.dir} is empty folder`,
        code: `ERR_EMPTY`
      })
    } else {
      for (let $index in files) {
        let file = files[$index]

        if (_.isEqual(path.extname(file), this.options.extname)) {
          try {
            fs.unlinkSync(path.join(this.options.dir, file))
          } catch (e) {
            throw new Error(e)
          } finally {
            deletedFiles++
          }
        }
      }

      return {
        error: false,
        deleted: deletedFiles,
        totalFiles: files.length,
        dir: this.options.dir
      }
    }
  }

  on (event, callback) {
    switch (event) {
      case 'get':
        if (_.isFunction(callback)) this.eventProvider.onGet = callback
        break
      case 'set':
        if (_.isFunction(callback)) this.eventProvider.onSet = callback
        break
      case 'fetch':
        if (_.isFunction(callback)) this.eventProvider.onFetch = callback
        break
      case 'remove':
        if (_.isFunction(callback)) this.eventProvider.onRemove = callback
        break
      case 'flush':
        if (_.isFunction(callback)) this.eventProvider.onFlush = callback
        break
      default:
        throw new Error({
          message: `ERR_EVENT: undefined event name '${event}'`,
          code: `ERR_EVENT`
        })
    }
  }
}

module.exports = imageCache
