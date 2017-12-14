const base64Img = require('base64-img');
const async = require("async");
const path = require('path');
const pako = require('pako'); 
const md5 = require("md5");
const fs = require('fs');
const _ = require('underscore');

/**
 * image-cache - Image Cache Async with Base64
 * @author Ryan Aunur Rassyid <Indonesia><ryandevstudio@gmail.com> 
 */

class Core {
	constructor(args) {
		this.eventProvider = {
			onGet: function() {},
			onSet: function() {},
			onRemove: function() {},
			onFlush: function() {},
			onFetch: function() {},
			onError: function() {}
		}
		this.options = {
			dir: path.join(__dirname, "cache/"),
			compressed: false,
			extname: '.cache',
			googleCache: true
		};
	}

	equal(a, b) {
		return (a == b);
	}
	/* Check params images to actualiy be Array data type
	 * and convert them into Array data
	 *
	 * @params	Array|String 	images 
	 * @return	Array
	 */
	isArray(images) {
		if (!Array.isArray(images)) {
			let temp = images;
			images = [temp];
		}
		/* Check is cache directory available
		 */
		if (!this.isDirExists()) {
			fs.mkdirSync(this.options.dir);
		}

		return images;
	}
	/* isDirExists 
	 * Synchronius function to check is path on dir options is a Directory
	 *
	 * @return Object
	 */
	isDirExists() {

		return fs.statSync(this.options.dir);
	}
	/* getFilePath
	 * Syncronius function to get file path after joining dir, filename, 
	 * and extention options
	 *
	 * @params String 	image
	 * @return String
	 */
	getFilePath(image) {
		var fileName = (this.options.compressed) ? `${md5(image)}_min` : md5(image);

		return this.options.dir + fileName + this.options.extname;
	}
	/* getImages
	 * Async function to get every images with base64 format
	 *
	 * @params Array 		images
	 * @params Function 	callback
	 * @return Callback 	(error, results)	Boolean, Object
	 */
	getImages(images, callback) {
		let fetch = (url, cb) => {
			var tempUri = url;
			if (this.options.googleCache) {
				url = this.getGoogleUrl(url);
			}

			base64Img.requestBase64(url, function(error, res, body){
				if (error) {
					cb(error);
				} else {
					if (res.statusCode.toString() == "200") {
						cb(null, {
							error: false,
							url: tempUri,
							timestamp: new Date().getTime(),
							hashFile: md5(tempUri),
							compressed: this.options.compressed,
							data: body
						});
					} else {
						cb(null, {
							error: true,
							url: tempUri,
							statusCode: res.statusCode,
							statusMessage: res.statusMessage
						});
					}
				}
			});
		}
		async.map(images, fetch, function(error, results){
			if (error) {
				callback(error);
			} else {
				callback(null, results);
			}
		});
	}
	/* getGoogleUrl
	 * Sync function get joined url 
	 *
	 * @params String 	url 
	 * @return String
	 */
	getGoogleUrl(url) {
		return 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy'
		+ '?container=focus'
		+ '&url=' + url
		;
	}
	/* unlinkCache
	 * Sync function remove cache file using `fs`
	 * @params Function 	callback 
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
	backToString(content) {
		if (Buffer.isBuffer(content)) content = content.toString('utf8');
		content = content.replace(/^\uFEFF/, '');
		
		return content;
	}
	setSize(path, image) {
		var type = typeof image;

		return new Promise((resolve, reject) => {
			fs.stat(path, (error, file) => {
				if (file.isFile()) {
					if (type == "string") image = JSON.parse(image);

					image.size = this.toSize(file.size, true);

					if (type == "string") image = JSON.stringify(image);
					resolve(image);
				} else {
					reject(path.basename(path) + " is not a file");
				}
			});         
		});
	}
	readFileFetch(params, callback) {
		fs.readFile(params.path, (err, cachedImage) => {
			if (!err) {
				cachedImage = this.inflate(this.backToString(cachedImage));
				
				/* set Hit Cache
				 */
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
	writeFileFetch(params, callback) {
		Core.writeFile({
			data: params.data,
			fileName: params.source.hashFile
		}, (error) => {
			if (error) {
				callback(error);
			} else {
				/* set Miss Cache
				 */
				params.source.cache = "MISS";
				callback(null, params.source);
			}
		});
	}
	deflate(data) {
		if (this.options.compressed) {
			result = pako.deflate(JSON.stringify(data), { to: 'string' });
		} else {
			result = JSON.stringify(data);
		}

		return result;
	}
	inflate(cachedImage) {
		console.log(typeof cachedImage);
		if (this.options.compressed) {
			cachedImage = pako.inflate(cachedImage, { to: 'string' });
		}

		return JSON.parse(cachedImage);
	}
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

		let stats = fs.statSync(path);
		
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
		fs.writeFile(path.join(this.options.dir, `${params.fileName} ${this.options.extname}`), params.data, (error) => {
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
	filterToWrite(result) {
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
	}


	setOptions(options) {

		this.options = Object.assign(this.options, options);
	}

	isCachedChild(image, callback) {
		fs.stat(this.getFilePath(image), (err, stats) => { 
			/* Represented from Object into Boolean
			 */	

			if (stats) {
				callback(null, true);
			} else {
				if (err.code == "ENOENT") {
					callback(null, false);
				}
			}
		});
	}
	getCacheChild(image, callback) {
		this.eventProvider.onGet();

		this.readFile(image, (error, results) => {
			if (error) {
				callback(error);
			} else {
				callback(null, this.inflate(results));
			}
		});
	}
	setCacheChild(images, callback) {
		this.eventProvider.onSet();

		images = this.isArray(images);

		this.getImages(images, (error, results) => {
			if (!error) {

				results.forEach(this.filterToWrite);
			} else {

				callback(error.message);
			}
		});
	}
	removeCacheChild(images, callback) {
		this.eventProvider.onRemove();

		images = this.isArray(images);

		images.forEach((image) => {
			try	{
				fs.unlinkSync(this.getFilePath(image));
			} catch(e) {
				callback(e);
			}
		});

		/* Callback onSuccess
		 * `images` will be send back into resolve
		 */
		callback(null, images);
	}
	fetchImagesChild(images, callback) {
		this.eventProvider.onFetch();

		images = this.isArray(images);

		async.waterfall([
			(callback) => {
				let imagesMore = [];

				async.each(images, (image, callbackEach) => {
					let fileName = this.getFilePath(image);
					let exists = (fs.statSync(filename)) ? true : false; 
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
				async.map(imagesMore, this.fetchImage, (error, results) => {
					if (error) {
						callback(true);
					} else {
						if (results.length == 1 && Array.isArray(results)) {
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
	flushCacheChild(callback) {
		this.eventProvider.onFlush();

		fs.readdir(this.options.dir, (error, files) => {
			var targetFiles = [];

			if (files.length == 0) {
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
					if (path.extname(file) == self.options.extname) {
						targetFiles.push(self.options.dir + "/" + file);
					}
				});

				async.map(targetFiles, this.unlinkCache, function(error, results) {
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
class imageCache extends Core {
	/* isCached
	 * Async function check is image on argument available on cache
	 *
	 * @param String 	image
	 * @return Promise
	 */
	isCached(image, callback) {
		if (_.isFunction(callback)) {

			this.isCachedChild(image, callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.isCachedChild(image, function(err, exists) {
					if (err) reject(err);

					resolve(exists);
				});
			});
		}
	}
	isCachedSync(image) {
		try	{
			fs.statSync(this.getFilePath(image));
		} catch(e) {
			if (this.equal(e.code, 'ENOENT')) {
				return false;
			}
		}

		return true;
	}

	get(image, callback) {
		if (_.isFunction(callback)) {

			this.getCacheChild(image, callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.getCacheChild(image, function(err, results) {
					if (err) reject(err);

					resolve(results);
				});
			});
		}
	};
	getSync(image) {
		try	{
			return this.readFileSync(image);
		} catch(e) {
			return e;
		}
	}

	set(images, callback) {
		if (_.isFunction(callback)) {

			this.setCacheChild(images, callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.setCacheChild(images, function(err, results) {
					if (err) reject(err);

					resolve(results);
				});
			});
		}
	}

	fetch(images, callback) {
		if (_.isFunction(callback)) {

			this.fetchImagesChild(images, callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.fetchImagesChild(images, function(err, results) {
					if (err) reject(err);

					resolve(results);
				});
			});
		}
	}

	remove(images) {
		if (_.isFunction(callback)) {

			this.removeCacheChild(images, callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.removeCacheChild(images, function(err, results) {
					if (err) reject(err);

					resolve(results);
				});
			});
		}
	}

	flush() {
		if (_.isFunction(callback)) {

			this.flushCacheChild(callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.flushCacheChild(function(err, results) {
					if (err) reject(err);

					resolve(results);
				});
			});
		}
	}
	flushSync() {
		var files = fs.readdirSync(this.options.dir);
		var deletedFiles = 0;

		if (files.length == 0) {
			throw new Error({
				message: `ERR_EMPTY: ${this.options.dir} is empty folder`,
				code: `ERR_EMPTY`
			});
		} else {
			for (let $index in files) {
				let file = files[$index];

				if (path.extname(file) == this.options.extname) {
					try {
						fs.unlinkSync(path.join(this.options.dir, file));
					} catch (e) {
						throw new Error(e);
					} finally {
						deletedFiles++;
					}
				}
			}

			return {
				error: false,
				deleted: deletedFiles,
				totalFiles: files.length,
				dir: options.dir
			}
		}
	}

	on(event, callback) {
		switch(event) {
			case 'get':
				if (_.isFunction(callback)) this.eventProvider.onGet = callback;
				break;
			case 'set':
				if (_.isFunction(callback)) this.eventProvider.onSet = callback;
				break;
			case 'fetch':
				if (_.isFunction(callback)) this.eventProvider.onFetch = callback;
				break;
			case 'remove':
				if (_.isFunction(callback)) this.eventProvider.onRemove = callback;
				break;
			case 'flush':
				if (_.isFunction(callback)) this.eventProvider.onFlush = callback;
				break;
			default:
				throw new Error({
					message: `ERR_EVENT: undefined event name '${event}'`,
					code: `ERR_EVENT`
				});
				break;
		}
	}
}

module.exports = new imageCache;