var base64Img = require('base64-img');
var async = require("async");
var path = require('path');
var pako = require('pako'); 
var md5 = require("md5");
var fs = require('fs'); 

options = {
	dir: path.join(__dirname, "cache/"),
	compressed: true,
	extname: '.json'
}

/**
 * @description
 * setOptions
 * @param {object} [required]
 * @example
 * setOptions({compressed: false});
 */
exports.setOptions = function(customOptions) {
	for (let option in customOptions) {
		options[option] = customOptions[option];
	}
};

function getImage(images, callback) {
	var fetch = function(url, cb){
        base64Img.requestBase64(url, function(error, res, body){
               if (error) {
                    cb(error);
               } else {
               		if (res.statusCode.toString() == "200")
               		{
	                    cb(null, {
	                    	error: false,
	                        url: url,
	                        timestamp: new Date().getTime(),
	                        hashFile: md5(url),
	                        compressed: options.compressed,
	                        data: body
	                    });
               		} else {
               			cb(null, {
               				error: true,
               				url: url
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
function backToString (content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8')
  content = content.replace(/^\uFEFF/, '')
  return content
}

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
	let fileName = (options.compressed) ? md5(image) + "_min" : md5(image); 
	
	fs.exists(options.dir + fileName + options.extname, function(exists) { 
		callback(exists);
	});
};

/**
 * @description
 * setCache
 * @param {array} [required]
 * @param {function} [callback]
 * @example
 * setCache(['http://foo.bar/foo.png'], function(error) { });
 * @return {boolean}
 */
exports.setCache = function(images, callback) {
	getImage(images, function(error, results) {
		results.forEach(function(result) {
			if (!result.error)
			{

				let fileName = (result.compressed) ? result.hashFile + "_min" : result.hashFile;
				let data;
				if (result.compressed) {
       				data = pako.deflate(JSON.stringify(result), { to: 'string' });
       			} else {
       				data = JSON.stringify(result);
       			}

				fs.writeFile(options.dir + fileName + options.extname, data, function(error) {
					if (error) callback(error);
				});
			}
		});
	});
};

/**
 * @description
 * getCache
 * @param {string} [required]
 * @param {function} [callback]
 * @example
 * getCache('http://foo.bar/foo.png', function(error, results) { });
 * @return {object}
 */
exports.getCache = function(image, callback) {
	let fileName = (options.compressed) ? md5(image) + "_min" : md5(image); 

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

exports.flushCache = function(callback) {
	fs.readdir(options.dir, function(error, files) {
		let targetFiles = [];

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
						deleted: targetFiles.length,
						totalFiles: files.length,
						dir: options.dir
					});
				}
			});
		}
	});
};

var unlinkCache = function(path, callback) {
	fs.unlinkSync(path);

	callback("deleted");
}
