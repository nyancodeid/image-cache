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

	check(images) {
		/* Check params images to actualiy be Array data type
		 */
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
	isDirExists() {

		return fs.existsSync(this.options.dir);
	}
	getFilePath() {
		var fileName = (this.options.compressed) ? `${md5(image)}_min` : md5(image);

		return this.options.dir + fileName + this.options.extname;
	}
	getImages(images, callback) {
		let fetch = (url, cb) => {
			var untouchUrl = url;
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
							url: untouchUrl,
							timestamp: new Date().getTime(),
							hashFile: md5(untouchUrl),
							compressed: this.options.compressed,
							data: body
						});
					} else {
						cb(null, {
							error: true,
							url: untouchUrl,
							statusCode: res.statusCode,
							statusMessage: res.statusMessage
						});
					}
				}
			});
		}
		async.map(images, fetch, function(error, results){
			if (error) {
				console.error(error);
			} else {
				callback(null, results);
			}
		});
	}
	getGoogleUrl(url) {
		return 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy'
		+ '?container=focus'
		+ '&url=' + url
		;
	}
	isFolderExists() {

		return fs.existsSync(this.options.dir);
	}
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

					image.size = Core.util.toSize(file.size, true);

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
	readFile(image, options, callback) {
		var path = this.getFilePath(image, options);
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
	readFileSync(image, options) {
		let path = this.getFilePath(image, options);
		let results = this.backToString(fs.readFileSync(path));

		let stats = fs.statSync(path);
		
		if (stats.isFile()) {
			results = JSON.parse(results);

			results.size = this.toSize(stats.size, true);
			results = JSON.stringify(results);
			
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
	fetchImageFunc(image, callback) {
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
}
class imageCache extends Core {
	isCached(image, callback) {
		return new Promise((resolve, reject) => {
			fs.stat(this.getFilePath(image), (exists) => { 
				resolve(exists);
			}).catch((e) => {
				reject(e);
			});
		});
	};
}

module.exports = new imageCache;