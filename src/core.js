const request = require('request-promise-lite')
const _ = require('underscore')
const async = require('async')
const path = require('path')
const pako = require('pako')
const md5 = require('md5')
const fs = require('fs')

const Util = require('./utilities')

/** Core class
 * imageCache Core function
 */
class Core {
  constructor (options) {
    this.eventProvider = {
      onGet: function () {},
      onSet: function () {},
      onRemove: function () {},
      onFlush: function () {},
      onFetch: function () {},
      onError: function () {}
    }
    this.inlineCompress = false
    this.defaultOptions = {
      dir: path.join(__dirname, 'cache/'),
      compressed: false,
      extname: '.cache',
      googleCache: true,
      timeout: 5000
    }

    this.options = Object.assign(this.defaultOptions, options)
  }

  /** Check params images to actualiy be Array data type
	 * and convert them into Array data
	 *
	 * @param	{Array|String} 	images
	 * @return	{Array}
	 */
  isArray (images) {
    if (!_.isArray(images)) {
      let temp = images
      images = [temp]
    }
    /** Check is cache directory available
		 */
    if (!this._isDirExists()) {
      fs.mkdirSync(this.options.dir)
    }

    return images
  }
  /** isDirExists
	 * Synchronius function to check is path on dir options is a Directory
	 *
	 * @return Object
	 */
  _isDirExists () {
    try {
      fs.statSync(this.options.dir)
    } catch (e) {
      return false
    }

    return true
  }
  _isFileExist (pathFile) {
    try {
      fs.statSync(pathFile)
    } catch (e) {
      return false
    }

    return true
  }
  /** getFilePath
	 * @description Syncronius function to get file path after joining dir, filename, and extention options
	 *
	 * @param  {String} 	image
	 * @return {String}
	 */
  getFilePath (image) {
    let fileName = (this.options.compressed) ? `${md5(image)}_min` : md5(image)

    return this.options.dir + fileName + this.options.extname
  }
  /**
   * @description get Data URI with simple way
   * @param {String} url
   *
   * @return {Promise}
   */
  toBase64 (url) {
    const query = new request.Request('GET', url, {
      isBuffer: true,
      resolveWithFullResponse: true,
      timeout: this.options.timeout
    })

    return query.run().then(res => {
      const data = 'data:' + res.headers['content-type'] + ';base64,' + res.body.toString('base64')
      // callback(err, res, data);
      return Promise.resolve({ success: true, dataUri: data })
    }).catch(error => {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.resolve({ success: false, err: 'ERR_FETCH_IMAGE', status: error.statusCode })
    })
  }
  /** getImages
	 * @description Async function to get every images with base64 format
	 *
	 * @param  {Array} 		images
	 * @param  {Function} 	callback
	 * @return {Promise}
	 */
  getImages (images) {
    return new Promise((resolve, reject) => {
      const resultsImages = []

      async.map(images, (image, next) => {
        // temporary image url
        let rawImage = image

        if (this.options.googleCache) {
          image = Util.getGoogleUri(image)
        }

        this.toBase64(image).then(res => {
          if (res.success) {
            resultsImages.push({
              error: false,
              url: rawImage,
              timestamp: new Date().getTime(),
              hashFile: md5(rawImage),
              compressed: this.options.compressed,
              data: res.dataUri
            })

            next(null)
          } else {
            next({
              error: true,
              url: rawImage,
              errorDetail: res
            })
          }
        })
      }, (error, results) => {
        if (!_.isNull(error)) {
          reject(error)
        } else {
          resolve(resultsImages)
        }
      })
    })
  }

  /** unlinkCache
	 * @description Sync function remove cache file using `fs`
	 */
  unlinkCache () {
    fs.unlinkSync(path)
  }

  _getFilePath (image) {
    const fileName = (this.options.compressed) ? `${md5(image)}_min` : md5(image)

    return this.options.dir + fileName + this.options.extname
  }
  _readFile (image) {
    const path = this._getFilePath(image)
    try {
      var results = fs.readFileSync(path)
    } catch (e) {
      return Promise.reject(e)
    }

    if (_.isUndefined(results)) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        err: 'ERR_READ_FILE',
        file: image,
        path: path
      })
    }

    const file = Util.backToString(results)

    return Util.setSize(path, file).then((result) => {
      return result
    })
  }
  _writeFile (options) {
    fs.writeFileSync(path.join(this.options.dir, `${options.fileName} ${this.options.extname}`), options.data)
  }
  /**
	 * @description read file from cached file
	 *
	 * @param {Object} options contains `path`
	 * @param {Function} callback
	 */
  readFileFetch (options) {
    return new Promise((resolve, reject) => {
      fs.readFile(options.path, (err, cachedImage) => {
        if (!err) {
          cachedImage = this._uncompress(Util.backToString(cachedImage))

          cachedImage.cache = 'HIT'

          Util.setSize(options.path, cachedImage).then((result) => {
            resolve(result)
          }).catch((error) => {
            reject(error)
          })
        } else {
          reject(err)
        }
      })
    })
  }
  /**
	 * @description write cache file
	 *
	 * @param {Object} params
	 * @param {Function} callback
	 */
  writeFileFetch (params) {
    this._writeFile({
      data: params.data,
      fileName: params.source.hashFile
    })

    params.source.cache = 'MISS'

    return params.source
  }
  /**
	 * @description compress file if compress options is true
	 *
	 * @param {Object} data
	 */
  _compress (data) {
    const stringData = JSON.stringify(data)
    const result = (this.options.compressed)
      ? pako.deflate(stringData, {
        to: 'string'
      })
      : stringData

    return result
  }
  /**
	 * @description decompress file if file is compressed
	 *
	 * @param {String} cachedImage
	 */
  _uncompress (cachedImage) {
    if (this.options.compressed) {
      cachedImage = pako.inflate(cachedImage, {
        to: 'string'
      })
    }

    return JSON.parse(cachedImage)
  }
  /**
	 * @description read file
	 *
	 * @param {*} image
	 * @param {*} callback
	 */

  readFileSync (image) {
    let path = this.getFilePath(image)
    let results = Util.backToString(fs.readFileSync(path))

    let stats = this._isFileExist(path)

    if (stats.isFile()) {
      results = JSON.parse(results)
      results.size = Util.toSize(stats.size, true)

      return results
    } else {
      throw new Error({
        message: `ERR_FILE: ${path} is not a file`,
        code: `ERR_FILE`
      })
    }
  }

  fetchImage (image) {
    if (image.exists) {
      const pathFile = this.getFilePath(image.fileName)
      return this.readFileFetch({
        path: pathFile
      })
    } else {
      return this.getImages([ image.url ]).then(results => {
        if (!_.isArray(results)) return Promise.reject({ err: 'ERR_GET_IMAGES', error: results })

        const result = results[0]

        const cacheResults = this.writeFileFetch({
          source: result,
          data: this._compress(result)
        })

        return cacheResults
      })
    }
  }

  isCachedService (image) {
    try {
      const stats = fs.statSync(this.getFilePath(image))

      return (stats) ? Promise.resolve(true) : Promise.resolve(false)
    } catch (e) {
      if (_.isEqual(e.code, 'ENOENT')) {
        return Promise.resolve(false)
      }
    }
  }
  getCacheService (image) {
    return this._readFile(image).then(results => {
      this.eventProvider.onGet({
        url: image
      })

      return this.inflate(results)
    }).catch(error => {
      this.eventProvider.onGet({
        url: image,
        error: error
      })
      return Promise.reject(error)
    })
  }
  storeCacheService (images) {
    this.eventProvider.onSet()

    images = this.isArray(images)

    return this.getImages().then(results => {
      return new Promise((resolve, reject) => {
        const imageResults = []

        async.eachSeries(results, (image, next) => {
          try {
            this._writeFile({
              fileName: image.hashFile,
              data: this._compress(image)
            })

            imageResults.push(image)

            next(null)
          } catch (e) {
            next(e)
          }
        }, (error) => {
          if (!_.isNull(error)) return reject(error)

          return resolve(imageResults)
        })
      })
    })
  }
  removeCacheService (images, callback) {
    this.eventProvider.onRemove()

    images = this.isArray(images)

    images.forEach(image => {
      try {
        fs.unlinkSync(this.getFilePath(image))
      } catch (e) {
        callback(e)
      }
    })

    /** Callback onSuccess
		 * `images` will be send back into resolve
		 */
    callback(null, images)
  }
  fetchImagesService (images) {
    let imagesData = this.isArray(images)
    let imagesResults = []

    return new Promise((resolve, reject) => {
      imagesData = imagesData.map(image => {
        const fileName = this.getFilePath(image)
        const exists = this._isFileExist(fileName)
        const url = image

        return {
          fileName: image,
          exists: exists,
          url: url
        }
      })

      async.each(imagesData, (image, next) => {
        this.fetchImage(image).then(result => {
          imagesResults.push(
            (_.isString(result)) ? JSON.parse(result) : result
          )

          next(null)
        }).catch(e => {
          next(e)
        })
      }, (error) => {
        if (error) {
          // eslint-disable-next-line prefer-promise-reject-errors
          return reject({ err: 'ERR_FETCH_IMAGES', error: error })
        } else {
          // when `imagesResults` have only 1 result (object) then we only
          // return a `Object` it self
          if (_.isEqual(imagesResults.length, 1)) {
            imagesResults = imagesResults[0]
          }
          return resolve(imagesResults)
        }
      })
    })
  }
  flushCacheService () {
    this.eventProvider.onFlush()

    const files = fs.readdirSync(this.options.dir)
    const counts = { deleted: 0, available: files.length }

    const ERR_EMPTY_OR_INVALID = {
      message: `ERR_EMPTY: ${this.options.dir} is empty folders or invalid paths`,
      code: `ERR_EMPTY`
    }

    if (_.isArray(files)) return Promise.reject(ERR_EMPTY_OR_INVALID)

    if (_.isEqual(files.length, 0)) {
      return Promise.reject(ERR_EMPTY_OR_INVALID)
    } else {
      files.forEach(file => {
        if (_.isEqual(path.extname(file), this.options.extname)) {
          const pathFile = this.options.dir + '/' + file

          try {
            this.unlinkCache(pathFile)

            counts.deleted++
          } catch (e) {
            console.error(`Error: deleting path "${pathFile}"`)
          }
        }
      })

      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        files: counts,
        source: this.options.dir
      })
    }
  }
}

module.exports = Core
