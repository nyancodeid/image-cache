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
		this.options = {
			dir: path.join(__dirname, "cache/"),
			compressed: false,
			extname: '.cache',
			googleCache: true
		};
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
		fs.unlinkSync(path);

		callback(true);
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
		let path = this.getFilePath(image, options);
		let results = this.backToString(fs.readFileSync(path));

		let stats = fs.statSync(path);
		
		if (stats.isFile()) {
			results = JSON.parse(results);
			results.size = this.toSize(stats.size, true);
			
			return results;
		} else {
			throw Error("is not a files");
		}
	}
	writeFile(params, callback) {
		fs.writeFile(path.join(this.options.dir, `${params.fileName} ${this.options.extname}`), params.data, (error) => {
			callback(error);
		});
	}
	fetchImagesChild(image, callback) {
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

	getCache(image, callback) {
		this.readFile(image, (error, results) => {
			if (error) callback(error);

			callback(null, this.inflate(results));
		});
	}
	setCache(images, callback) {
		images = this.isArray(images);

		this.getImages(images, (error, results) => {
			if (!error) {

				results.forEach(this.filterToWrite);
			} else {

				callback(error.message);
			}
		});
	}
	removeCache(images, callback) {
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
	fetchImages(images, callback) {
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
				async.map(imagesMore, this.fetchImagesChild, (error, results) => {
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
			(!error) {
				callback(null, success);
			} else {
				callback(error);
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
	isCached(image) {

		return new Promise((resolve, reject) => {
			fs.stat(this.getFilePath(image), (err, stats) => { 
				if (err) reject(err);

				resolve(true);
			});
		});
	}
	isCachedSync(image) {

		return fs.statSync(this.getFilePath(image));
	}

	get(image, callback) {
		if (_.isFunction(callback)) {

			this.getCache(image, callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.getCache(image, function(err, results) {
					if (err) reject(err);

					resolve(results);
				});
			});
		}
	};
	getSync(image) {

		return this.readFileSync(image);
	}

	set(images, callback) {
		if (_.isFunction(callback)) {

			this.setCache(images, callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.setCache(images, function(err, results) {
					if (err) reject(err);

					resolve(results);
				});
			});
		}
	}

	fetch(images, callback) {
		if (_.isFunction(callback)) {

			this.fetchImages(images, callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.fetchImages(images, function(err, results) {
					if (err) reject(err);

					resolve(results);
				});
			});
		}
	}

	remove(images) {
		if (_.isFunction(callback)) {

			this.removeCache(images, callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.removeCache(images, function(err, results) {
					if (err) reject(err);

					resolve(results);
				});
			});
		}
	}
}

module.exports = new imageCache;