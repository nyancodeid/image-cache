var base64Img = require('base64-img');
var async = require("async");
var path = require('path');
var pako = require('pako'); 
var md5 = require("md5");
var fs = require('fs');


// Global Options
var options = {
	dir: path.join(__dirname, "cache/"),
	compressed: true,
	extname: '.json',
	googleCache: true
}


/**
 * @description
 * setOptions
 * @param {object} [required]
 * @example
 * setOptions({compressed: false});
 */
exports.setOptions = function(customOptions) {
	for (var option in customOptions) {
		options[option] = customOptions[option];
	}
};

/**
 * @description
 * isCached
 * @param {string} [required]
 * @param {function} [callback]
 * @example
 * isCached('http://foo.bar/foo.png', function(exist) { });
 * @return {boolean}
 */
exports.isCached = function(image, callback) {
	var fileName = (options.compressed) ? md5(image) + "_min" : md5(image); 
	
	fs.exists(options.dir + fileName + options.extname, function(exists) { 
		callback(exists);
	});
};
exports.isCachedSync = function(image) {
	var fileName = (options.compressed) ? md5(image) + "_min" : md5(image); 
	var whereFile = options.dir + fileName + options.extname;

	return fs.existsSync(whereFile);
}

/**
 * @description
 * setCache
 * @param {array|string} [required]
 * @param {function} [callback]
 * @example
 * setCache(['http://foo.bar/foo.png'], function(error) { });
 * @return {boolean}
 */
exports.setCache = function(images, callback) {
	if (typeof images == "string") {
		var temp = images;
		images = [temp];
	}

	if (!isFolderExist()) {
		fs.mkdirSync(options.dir);
	}

	getImage(images, function(error, results) {
		if (error) {
			callback(error);
		} else {
			results.forEach(function(result) {
				if (!result.error)
				{

					var fileName = (result.compressed) ? result.hashFile + "_min" : result.hashFile;
					var data;
					if (result.compressed) {
						data = pako.deflate(JSON.stringify(result), { to: 'string' });
					} else {
						data = JSON.stringify(result);
					}

					fs.writeFile(options.dir + fileName + options.extname, data, function(error) {
						if (error) callback(error);
						else callback(null);
					});
				} else {
					console.log(result);
				}
			});
		}
	});
};

/**
 * @description
 * getCache
 * @param {string} [required]
 * @param {function} [callback]
 * @example
 * getCache('http://foo.bar/foo.png', function(error, results) { });
 * @return undefined
 */
exports.getCache = function(image, callback) {
	var fileName = (options.compressed) ? md5(image) + "_min" : md5(image); 

	fs.readFile(options.dir + fileName + options.extname, function(err, cachedImage) {
		if (!err) {
			cachedImage = backToString(cachedImage);
			if (options.compressed) {
				// Inflate, decompressing string
				cachedImage = pako.inflate(cachedImage, { to: 'string' });
				
			}
			callback(null, JSON.parse(cachedImage));
		} else {
			callback(err);
		}
	});
};
exports.getCacheSync = function(image) {
	var fileName = (options.compressed) ? md5(image) + "_min" : md5(image); 
	var whereFile = options.dir + fileName + options.extname;

	var cachedImage = fs.readFileSync(whereFile);

	cachedImage = backToString(cachedImage);
	if (options.compressed) {
		// Inflate, decompressing string
		cachedImage = pako.inflate(cachedImage, { to: 'string' });
	}

	return JSON.parse(cachedImage);
}

/**
 * @description
 * flushCache (devare all cache)
 * @param {function} [callback]
 * @example
 * flushCache(function(error) { });
 * @return undefined
 */
exports.flushCache = function(callback) {
	fs.readdir(options.dir, function(error, files) {
		var targetFiles = [];

		if (files.length == 0) {
			callback("this folder is empty");
		} else {
			files.forEach(function(file) {
				if (path.extname(file) == options.extname) {
					targetFiles.push(options.dir + "/" + file);
				}
			});

			async.map(targetFiles, unlinkCache, function(error, results) {
				if (error) {
					callback(error);
				} else {
					// callback when no error
					callback(null, {
						devared: targetFiles.length,
						totalFiles: files.length,
						dir: options.dir
					});
				}
			});
		}
	});
};
/**
 * @description
 * flushCacheSync (devare all cache with Synchronous)
 * @example
 * flushCache();
 * @return {object}
 */
exports.flushCacheSync = function() {
	var files = fs.readdirSync(options.dir);
	var devaredFiles = 0;

	if (files.length == 0) {
		return {error: true, message: "this folder is empty"};
	} else {
		files.forEach(function(file) {
			if (path.extname(file) == options.extname) {
				try	{
					fs.unlinkSync(path.join(options.dir, file));
				} catch (e) {
					return {error: true, message: e};
				} finally {
					devaredFiles++;
				}
			}
		});

		return {
			error: false,
			devared: devaredFiles,
			totalFiles: files.length,
			dir: options.dir
		}
	}
}

/**
 * @description
 * fetchImage - store and get cache
 * @param {string} [required]
 * @param {object} [options]
 * @param {function} [callback]
 * @example
 * fetchImage('http://foo.bar/foo.png').then(function(result) { ... });
 * @return undefined
 */
exports.fetchImage = function(images, option) {
	return new Promise((resolve, reject) => {
		console.time("fetchImage");

		if (!Array.isArray(images)) {
			images = [images];
		}

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

		async.map(imagesMore, fetchImageFunc, (error, results) => {
			if (error) {
				console.timeEnd('fetchImage');
				reject(error);
			} else {
				console.timeEnd('fetchImage');
				resolve(results);
			}
		});
	});
}


var getImage = function(images, callback) {
	var fetch = function(url, cb){
		untouchUrl = url;
		if (options.googleCache) {
			url = getGoogleUrl(url);
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
			console.error("[ERROR] " + error.file);
		} else {
			callback(null, results);
		}
	});
}
var backToString = function(content) {
	if (Buffer.isBuffer(content)) content = content.toString('utf8')
	content = content.replace(/^\uFEFF/, '')
	
	return content;
}
var unlinkCache = function(path, callback) {
	fs.unlinkSync(path);

	callback("deleted");
}
var isFolderExist = function() {
	
	return fs.existsSync(options.dir);
}
var getGoogleUrl = function(url) {
	return 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy'
	+ '?container=focus'
	+ '&url=' + url
	;
}
var readFile = function(path, callback) {
	// path = options.dir + fileName + options.extname

	fs.readFile(path, function(err, cachedImage) {
		if (!err) {
			cachedImage = backToString(cachedImage);
			if (options.compressed) {
				cachedImage = pako.inflate(cachedImage, { to: 'string' });
			}
			cachedImage = JSON.parse(cachedImage);
			cachedImage.cache = "HIT";

			callback(null, cachedImage);
		} else {
			callback("error while read cache files #" + fileName);
		}
	});
};
var fetchImageFunc = function(image, callback) {
	if (image.exists) {
		readFile(options.dir + image.fileName + options.extname, function(error, results) {
			if (error) {
				callback(error);
			} else {
				callback(null, results);
			}
		});
	} else {
		if (!isFolderExist()) {
			fs.mkdirSync(options.dir);
		}

		getImage([image.url], function(error, results) {
			if (error) {
				callback(error);
			} else {
				results.forEach(function(result) {
					if (!result.error) {
						var fileName = (result.compressed) ? result.hashFile + "_min" : result.hashFile;
						var data;
						if (result.compressed) {
							data = pako.deflate(JSON.stringify(result), { to: 'string' });
						} else {
							data = JSON.stringify(result);
						}

						fs.writeFile(options.dir + fileName + options.extname, data, function(error) {
							if (error) {
								callback(error);
							} else {
								result.cache = "MISS";
								callback(null, result);
							}
						});
					} else {
						callback(JSON.stringify(result));
					}
				});
			}
		});
	}
}
