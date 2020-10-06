const base64Img = require('base64-img');
const _ 		= require('underscore');
const async 	= require("async");
const path 		= require('path');
const pako 		= require('pako');
const md5 		= require("md5");
const fs 		= require('fs');

/** Core class
 * imageCache Core function
 */
module.exports = class Core {
	constructor(args) {
		this.eventProvider = {
			onGet: function() {},
			onSet: function() {},
			onRemove: function() {},
			onFlush: function() {},
			onFetch: function() {},
			onError: function() {}
		}
		this.inlineCompress = false;
		this.options = {
			dir: path.join(__dirname, "cache/"),
			compressed: false,
			extname: '.cache',
			googleCache: true
		};
	}

	/** Utility
	 * @description list of utility
	 */
	equal(a, b) {
		return (a == b);
	}
	/** Check params images to actualiy be Array data type
	 * and convert them into Array data
	 *
	 * @param	{Array|String} 	images
	 * @return	{Array}
	 */
	isArray(images) {
		if (!Array.isArray(images)) {
			let temp = images;
			images = [temp];
		}
		/** Check is cache directory available
		 */
		if (!this.isDirExists()) {
			fs.mkdirSync(this.options.dir);
		}

		return images;
	}
	/** isDirExists
	 * Synchronius function to check is path on dir options is a Directory
	 *
	 * @return Object
	 */
	isDirExists() {
		try	{
			fs.statSync(this.options.dir);
		} catch(e) {
			return false;
		}

		return true;
	}
	isFileExist(pathFile) {
		try	{
			fs.statSync(pathFile);
		} catch(e) {
			return false;
		}

		return true;
	}
	/** getFilePath
	 * @description Syncronius function to get file path after joining dir, filename, and extention options
	 *
	 * @param  {String} 	image
	 * @return {String}
	 */
	getFilePath(image) {
		let fileName = (this.options.compressed) ? `${md5(image)}_min` : md5(image);

		return path.join(this.options.dir, `${fileName}${this.options.extname}`);
	}
	/** getImages
	 * @description Async function to get every images with base64 format
	 *
	 * @param  {Array} 		images
	 * @param  {Function} 	callback
	 * @return {Callback} 	(error, results)	Boolean, Object
	 */
	getImages(images, callback) {
		let fetch = (url, callback) => {
			var tempUri = url;
			if (this.options.googleCache) {
				url = this.getGoogleUrl(url);
			}

			base64Img.requestBase64(url, (error, res, body) => {
				if (error) {
					callback(error);
				} else {
					if (this.equal(res.statusCode.toString(), "200")) {
						callback(null, {
							error: false,
							url: tempUri,
							timestamp: new Date().getTime(),
							hashFile: md5(tempUri),
							compressed: this.options.compressed,
							data: body
						});
					} else {
						callback(true, {
							error: true,
							url: tempUri,
							statusCode: res.statusCode,
							statusMessage: res.statusMessage
						});
					}
				}
			});
		}
		async.map(images, fetch, (error, results) => {
			if (error) {
				callback(error);
			} else {
				callback(null, results);
			}
		});
	}
	/** stringToTime
	 * @description convert string to time, for example 1w => 604800
	 *
	 * @param {String} 		time
	 * @return {Integer} 		second
	 */
	stringToTime(time) {
		let weeks = time.toLowerCase().match(/([\d]+)w/);
		let days = time.toLowerCase().match(/([\d]+)d/);
		let hours = time.toLowerCase().match(/([\d]+)h/);
		let minutes = time.toLowerCase().match(/([\d]+)m/);

		if (weeks) {
			return weeks[1] * 7 * 24 * 60 * 60;
		} else if (days) {
			return days[1] * 24 * 60 * 60;
		} else if (hours) {
			return hours[1] * 60 * 60;
		} else if (minutes) {
			return minutes[1] * 60;
		}
	}
	/** getGoogleUrl
	 * @description Sync function get joined url
	 *
	 * @param {String} 	url
	 * @return {String}
	 */
	getGoogleUrl(url, options) {
		let urls = 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy'
					+ '?container=focus'
					+ '&url=' + url
					;

		if (_.isObject(options)) {
			if (!_.isNull(options.width)) urls += `&resize_w=${options.width}`;
			if (!_.isNull(options.refresh)) urls += `&refresh=${options.refresh}`;
		}

		return urls;
	}
	/** unlinkCache
	 * @description Sync function remove cache file using `fs`
	 * @param {Function} 	callback
	 * @return Type
	 */
	unlinkCache(callback) {
		try	{
			fs.unlinkSync(path);
		} catch(e) {
			callback(e);
		}

		callback(null);
	}
	/**
	 * @description convert Buffer into String
	 * @param {Buffer} content
	 */
	backToString(content) {
		if (Buffer.isBuffer(content)) content = content.toString('utf8');
		content = content.replace(/^\uFEFF/, '');

		return content;
	}
	/**
	 * @description set size of file
	 *
	 * @param {String} path
	 * @param {String} image
	 */
	setSize(path, image) {
		var type = typeof image;

		return new Promise((resolve, reject) => {
			fs.stat(path, (error, file) => {
				if (file.isFile()) {
					if (this.equal(type, "string")) image = JSON.parse(image);

					image.size = this.toSize(file.size, true);

					if (this.equal(type, "string")) image = JSON.stringify(image);
					resolve(image);
				} else {
					reject(path.basename(path) + " is not a file");
				}
			});
		});
	}
	/**
	 * @description read file from cached file
	 *
	 * @param {Object} params
	 * @param {Function} callback
	 */
	readFileFetch(params, callback) {
		fs.readFile(params.path, (err, cachedImage) => {
			if (!err) {
				cachedImage = this.inflate(this.backToString(cachedImage));

				cachedImage.cache = "HIT";

				this.setSize(params.path, cachedImage).then((result) => {
					callback(null, result);
				}).catch((error) => {
					callback(error);
				});

			} else {
				callback(err);
			}
		});
	}
	/**
	 * @description write cache file
	 *
	 * @param {Object} params
	 * @param {Function} callback
	 */
	writeFileFetch(params, callback) {
		this.writeFile({
			data: params.data,
			fileName: params.source.hashFile
		}, (error) => {
			if (error) {
				callback(error);
			} else {
				/** set Miss Cache
				 */
				params.source.cache = "MISS";
				callback(null, params.source);
			}
		});
	}
	/**
	 * @description compress file if compress options is true
	 *
	 * @param {Object} data
	 */
	deflate(data) {
		let result;
		if (this.options.compressed) {
			result = pako.deflate(JSON.stringify(data), { to: 'string' });
		} else {
			result = JSON.stringify(data);
		}

		return result;
	}
	/**
	 * @description decompress file if file is compressed
	 *
	 * @param {String} cachedImage
	 */
	inflate(cachedImage) {
		if (this.options.compressed) {
			cachedImage = pako.inflate(cachedImage, { to: 'string' });
		}

		return JSON.parse(cachedImage);
	}
	/**
	 * @description read file as async function
	 *
	 * @param {*} image
	 * @param {*} callback
	 */
	readFile(image, callback) {
		var path = this.getFilePath(image);
		fs.readFile(path, (error, results) => {
			if (error) {
				callback(error);
			} else {
				results = this.backToString(results);

				this.setSize(path, results).then((result) => {
					callback(null, result);
				}).catch((error) => {
					callback(error);
				});
			}
		});
	}
	readFileSync(image) {
		let path = this.getFilePath(image);
		let results = this.backToString(fs.readFileSync(path));

		let stats = this.isFileExist(path);

		if (stats.isFile()) {
			results = JSON.parse(results);
			results.size = this.toSize(stats.size, true);

			return results;
		} else {
			throw new Error({
				message: `ERR_FILE: ${path} is not a file`,
				code: `ERR_FILE`
			});
		}
	}
	writeFile(params, callback) {
        let fileName = `${params.fileName}${(this.options.compressed ? '_min' : '')}${this.options.extname}`;
        fs.writeFile(path.join(this.options.dir, fileName), params.data, (error) => {
            callback(error);
        });
	}
	fetchImage(image, callback) {
		if (image.exists) {
			this.readFileFetch({
				path: this.getFilePath(image.fileName)
			}, (error, result) => {
				if (error) {
					callback(error);
				} else {
					callback(null, result);
				}
			});
		} else {
			this.getImages([ image.url ], (error, results) => {
				if (error) {
					callback(error);
				} else {
					results.forEach((result) => {
						if (!result.error) {
							this.writeFileFetch({
								source: result,
								data: this.deflate(result)
							}, (error) => {
								if (error) {
									callback(error);
								} else {
									callback(null, result);
								}
							});
						}
					});
				}
			});
		}
	}
	toSize(size, read) {
		var thresh = read ? 1000 : 1024;
		if(Math.abs(size) < thresh) {
			return size + ' B';
		}
		var units = read
			? ['kB','MB','GB','TB','PB','EB','ZB','YB']
			: ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
		var u = -1;
		do {
			size /= thresh;
			++u;
		} while(Math.abs(size) >= thresh && u < units.length - 1);

		return size.toFixed(1)+' '+units[u];
	}

	setOptions(options) {

		this.options = Object.assign(this.options, options);
	}

	isCachedService(image, callback) {
		fs.stat(this.getFilePath(image), (err, stats) => {
			/** Represented from Object into Boolean
			 */

			if (stats) {
				callback(null, true);
			} else {
				if (this.equal(err.code, "ENOENT")) {
					callback(null, false);
				}
			}
		});
	}
	getCacheService(image, callback) {
		this.readFile(image, (error, results) => {
			if (error) {
				callback(error);
			} else {
				callback(null, this.inflate(results));
			}

			this.eventProvider.onGet({
				url: image,
				error: error
			});
		});
	}
	storeCacheService(images, callback) {
		this.eventProvider.onSet();

		images = this.isArray(images);

		this.getImages(images, (error, results) => {
			if (!error) {

				results.forEach((result) => {
					if (result.error) callback("Error while getting images");

					this.writeFile({
						fileName: result.hashFile,
						data: this.deflate(result)
					}, (error) => {
						if (error) {
							callback("Error while write files " + result.hashFile);
						} else {
							callback(null, result);
						}
					});
				});
			} else {

				callback(error.message);
			}
		});
	}
	removeCacheService(images, callback) {
		this.eventProvider.onRemove();

		images = this.isArray(images);

		images.forEach((image) => {
			try	{
				fs.unlinkSync(this.getFilePath(image));
			} catch(e) {
				callback(e);
			}
		});

		/** Callback onSuccess
		 * `images` will be send back into resolve
		 */
		callback(null, images);
	}
	fetchImagesService(images, callback) {
		this.eventProvider.onFetch();

		images = this.isArray(images);

		async.waterfall([
			(callback) => {
				let imagesMore = [];

				async.each(images, (image, callbackEach) => {
					let fileName = this.getFilePath(image);
					let exists = this.isFileExist(fileName);
					let url = image;

					imagesMore.push({
						fileName: image,
						exists: exists,
						url: url
					});

					callbackEach(null);
				}, (err) => {
					if (!err) callback(null, imagesMore);
				});
			},
			(imagesMore, callback) => {
				async.map(imagesMore, this.fetchImage.bind(this), (error, results) => {
					if (error) {
						callback(error);
					} else {
						if (this.equal(results.length, 1) && Array.isArray(results)) {
							results = results[0];
						}

						callback(null, results);
					}
				});
			}
		], (error, success) => {
			if (!error) {
				callback(null, success);
			} else {
				callback(error);
			}
		});
	}
	flushCacheService(callback) {
		this.eventProvider.onFlush();

		fs.readdir(this.options.dir, (error, files) => {
			var targetFiles = [];

			if (this.equal(files.length, 0)) {
				/**
				 * Callback error when `folder empty`
				 * @return Object
				 */
				callback({
					message: `ERR_EMPTY: ${this.options.dir} is empty folder`,
					code: `ERR_EMPTY`
				});
			} else {
				files.forEach((file) => {
					if (this.equal(path.extname(file), self.options.extname)) {
						targetFiles.push(self.options.dir + "/" + file);
					}
				});

				async.map(targetFiles, this.unlinkCache, (error, results) => {
					if (error) {
						callback(error);
					} else {
						/**
						 * Callback onSuccess
						 * @return Object
						 */
						callback(null, {
							deleted: targetFiles.length,
							totalFiles: files.length,
							dir: options.dir
						});
					}
				});
			}
		});
	}
}
