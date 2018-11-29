const fs = require('fs')
const _ = require('underscore')

/** stringToTime
 * @description convert string to time, for example 1w => 604800
 *
 * @param {String} time string time example 1h, 1w, 1s.. etc
 * @return {Integer} in second
 */
const stringToTime = (time) => {
  let weeks = time.toLowerCase().match(/([\d]+)w/)
  let days = time.toLowerCase().match(/([\d]+)d/)
  let hours = time.toLowerCase().match(/([\d]+)h/)
  let minutes = time.toLowerCase().match(/([\d]+)m/)

  if (weeks) {
    return weeks[1] * 7 * 24 * 60 * 60
  } else if (days) {
    return days[1] * 24 * 60 * 60
  } else if (hours) {
    return hours[1] * 60 * 60
  } else if (minutes) {
    return minutes[1] * 60
  }
}

/** getGoogleUrl
 * @description sync function get joined url
 *
 * @param {String} url input url https://example.com/image.png
 * @param {Object} options width and refresh
 * @return {String} google cache full url
 */
const getGoogleUri = (url, options) => {
  let fullUri = 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy' +
		'?container=focus' +
		'&url=' + url

  if (_.isObject(options)) {
    if (!_.isNull(options.width)) fullUri += `&resize_w=${options.width}`
    if (!_.isNull(options.refresh)) fullUri += `&refresh=${options.refresh}`
  }

  return fullUri
}

/**
 * @description convert Buffer into String
 * @param {Buffer} content
 * @returns {String}
 */
const backToString = (content) => {
  if (Buffer.isBuffer(content)) content = content.toString('utf8')
  content = content.replace(/^\uFEFF/, '')

  return content
}

/**
 * @description set size of file
 *
 * @param {String} path
 * @param {String} image
 * @returns {String}
 */
const setSize = (path, image) => {
  const imageType = typeof image
  const file = fs.statSync(path)

  if (file.isFile()) {
    // if params `image` is a string (json) we parse it first
    if (_.isEqual(imageType, 'string')) image = JSON.parse(image)

    // let's set image size
    image.size = toSize(file.size, true)

    // and if variable `image` is a `object` then we `stringify` them
    if (!_.isObject(imageType, 'string')) image = JSON.stringify(image)

    return Promise.resolve(image)
  } else {
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject(path.basename(path) + ' is not a file')
  }
}

/**
 * @description convert number to readable size format
 *
 * @param {Number} size
 * @param {Boolean} read
 */
const toSize = (size, read) => {
  const thresh = read ? 1000 : 1024
  const units = read
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  let u = -1

  if (Math.abs(size) < thresh) return size + ' B'

  do {
    size /= thresh
    ++u
  } while (Math.abs(size) >= thresh && u < units.length - 1)

  return size.toFixed(1) + ' ' + units[u]
}

module.exports = {
  setSize,
  toSize,
  backToString,
  getGoogleUri,
  stringToTime
}
