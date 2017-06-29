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
	// Check params images to actualiy be Array data type

};

imageCache.prototype.fetchImage = function() {
};

imageCache.prototype.flushCache = function() {
};
imageCache.prototype.flushCacheSync = function() {
};

var Core = {
	getFilePath: function(image, options) {
		var fileName = (options.compressed) ? md5(image) + "_min" : md5(image);

		return options.dir + fileName + options.extname;
	},
	getImages: function() {
		var fetch = function(url, cb) {
			var untouchUrl = url;
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
	},
	getGoogleUrl: function() {
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
		fs.readFile(path, function(err, cachedImage) {
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
	writeFileFetch: function() {
		fs.writeFile(options.dir + fileName + options.extname, data, function(error) {
			if (error) {
				callback(error);
			} else {
				// this cache will be MISS
				return result;
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
		fs.readFile(Core.getFilePath(image, options), function(error, results) {
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
	}
}

module.exports = new imageCache();