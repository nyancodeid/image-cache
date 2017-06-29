var base64Img = require('base64-img');
var async = require("async");
var path = require('path');
var pako = require('pako'); 
var md5 = require("md5");
var fs = require('fs');

var imageCache = function() {
	this.options = {
		dir: path.join(__dirname, "cache/"),
		compressed: false,
		extname: '.cache',
		googleCache: true
	};
};

imageCache.prototype.setOptions = function(options) {
	self = this;

	for (var option in options) {
		if (typeof self.options[option] == "undefined") throw Error("option \'" + option + "\' is not available");

		self.options[option] = options[option];
	}
};

imageCache.prototype.isCached = function(image, callback) {
	self = this;

	fs.exists(Core.getFilePath(image, self.options), function(exists) { 
		callback(exists);
	});
};
imageCache.prototype.isCachedSync = function(image) {
	self = this;

	return fs.existsSync(Core.getFilePath(image, self.options));
};

imageCache.prototype.getCache = function(image, callback) {
	self = this;

	Core.readFile(image, self.options, (error, results) => {
		if (!error) {
			var output = Core.inflate(results, self.options);
			
			callback(null, output);
		} else {
			callback(error);
		}
	});
};
imageCache.prototype.getCacheSync = function(image) {
	self = this;

	return JSON.parse(Core.readFileSync(image, self.options));
};

imageCache.prototype.setCache = function(images, callback) {
	self = this;
	
	images = Core.check(images, self.options);

	Core.getImages(images, self.options, (error, results) => {
		if (error) {
			callback(error);
		} else {
			results.forEach((result) => {
				if (!result.error) {
					let output = Core.deflate(result, self.options);

					Core.writeFile({
						fileName: result.fileName,
						output: output,
						options: self.options
					}, (error) => {
						callback(error);
					});
				} else {
					console.log(result);
				}
			});
		}
	});
};

imageCache.prototype.fetchImage = function(images, callback) {
	self = this;

	return new Promise((resolve, reject) => {
		images = Core.check(images, self.options);

		var imagesMore = [];
		images.forEach(function(image) {
			var fileName = (options.compressed) ? md5(image) + "_min" : md5(image); 
			var exists = fs.existsSync(options.dir + fileName + options.extname); 
			var url = image;

			imagesMore.push({
				fileName: fileName,
				exists: exists,
				url: url
			});
		});

		async.map(imagesMore, Core.fetchImageFunc, (error, results) => {
			if (error) {
				console.timeEnd('fetchImage');
				reject(error);
			} else {
				console.timeEnd('fetchImage');
				resolve(results);
			}
		});
	});
};

imageCache.prototype.flushCache = function() {
	self = this;

	fs.readdir(options.dir, (error, files) => {
		var targetFiles = [];

		if (files.length == 0) {
			callback("this folder is empty");
		} else {
			files.forEach((file) => {
				if (path.extname(file) == self.options.extname) {
					targetFiles.push(self.options.dir + "/" + file);
				}
			});

			async.map(targetFiles, unlinkCache, function(error, results) {
				if (error) {
					callback(error);
				} else {
					// callback when no error
					callback(null, {
						deleted: targetFiles.length,
						totalFiles: files.length,
						dir: options.dir
					});
				}
			});
		}
	});
};
imageCache.prototype.flushCacheSync = function() {
	self = this;

	var files = fs.readdirSync(self.options.dir);
	var deletedFiles = 0;

	if (files.length == 0) {
		return {error: true, message: "this folder is empty"};
	} else {
		files.forEach(function(file) {
			if (path.extname(file) == self.options.extname) {
				try	{
					fs.unlinkSync(path.join(self.options.dir, file));
				} catch (e) {
					return {error: true, message: e};
				} finally {
					deletedFiles++;
				}
			}
		});

		return {
			error: false,
			deleted: deletedFiles,
			totalFiles: files.length,
			dir: options.dir
		}
	}
};

var Core = {
	check: function(images, options) {
		/* Check params images to actualiy be Array data type
		 */
		if (!Array.isArray(images)) {
			let temp = images;
			images = [temp];
		}
		/* Check is cache directory available
		 */
		if (!Core.isDirExists(options)) {
			fs.mkdirSync(options.dir);
		}

		return images;
	},
	isDirExists: function(options) {
		return fs.existsSync(options.dir);
	},
	getFilePath: function(image, options) {
		var fileName = (options.compressed) ? md5(image) + "_min" : md5(image);

		return options.dir + fileName + options.extname;
	},
	getImages: function(images, options, callback) {
		var fetch = function(url, cb) {
			var untouchUrl = url;
			if (options.googleCache) {
				url = Core.getGoogleUrl(url);
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
							compressed: options.compressed,
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
	},
	getGoogleUrl: function(url) {
		return 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy'
		+ '?container=focus'
		+ '&url=' + url
		;
	},
	isFolderExists: function() {
		return fs.existsSync(options.dir);
	},
	unlinkCache: function() {
		fs.unlinkSync(path);

		callback("deleted");
	},
	backToString: function(content) {
		if (Buffer.isBuffer(content)) content = content.toString('utf8');
		content = content.replace(/^\uFEFF/, '');
		
		return content;
	},
	readFileFetch: function() {
		fs.readFile(path, (err, cachedImage) => {
			if (!err) {
				cachedImage = backToString(cachedImage);
				if (options.compressed) {
					cachedImage = pako.inflate(cachedImage, { to: 'string' });
				}
				cachedImage = JSON.parse(cachedImage);
				
				// this cache will be HIT
				return cachedImage;
			} else {
				return "error while read cache files #" + fileName;
			}
		});
	},
	writeFileFetch: function(params, callback) {
		Core.writeFile(params.source.fileName, params.data, params.options, (error) => {
			if (error) {
				callback(error);
			} else {
				source.cache = "MISS";
				callback(source);
			}
		});
	},
	deflate: function(data, options) {
		if (options.compressed) {
			result = pako.deflate(JSON.stringify(data), { to: 'string' });
		} else {
			result = JSON.stringify(data);
		}

		return result;
	},
	inflate: function(cachedImage, options) {
		if (options.compressed) {
			cachedImage = pako.inflate(cachedImage, { to: 'string' });
		}

		return JSON.parse(cachedImage);
	},
	readFile: function(image, options, callback) {
		fs.readFile(Core.getFilePath(image, options), (error, results) => {
			if (error) {
				callback(error);
			} else {
				results = Core.backToString(results);

				callback(null, results);
			}
		});
	},
	readFileSync: function(image, options) {
		return Core.backToString(fs.readFileSync(Core.getFilePath(image, options)));
	},
	writeFile: function(params, callback) {
		fs.writeFile(path.join(params.options.dir, params.fileName + params.options.extname), params.data, (error) => {
			callback(error);
		});
	},
	fetchImageFunc: function(image, callback) {
		if (image.exists) {
			Core.readFileFetch();
		} else {
			getImage([ image.url ], function(error, results) {
				if (error) {
					callback(error);
				} else {
					results.forEach((result) => {
					});
				}
			});
		}
	}
}

module.exports = new imageCache();