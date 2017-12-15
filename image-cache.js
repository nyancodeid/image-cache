const Core = require('./lib/core');
const _ = require('underscore');
const path = require('path');
const fs = require('fs');

/**
 * image-cache - Image Cache Async with Base64
 * @author Ryan Aunur Rassyid <Indonesia><ryandevstudio@gmail.com> 
 */

/* imageCache class
 * imageCache extends from Core
 */
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

	store(images, callback) {
		if (_.isFunction(callback)) {

			this.storeCacheChild(images, callback);
		} else {
			
			return new Promise((resolve, reject) => {
				this.storeCacheChild(images, function(err, results) {
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

		if (this.equal(files.length, 0)) {
			throw new Error({
				message: `ERR_EMPTY: ${this.options.dir} is empty folder`,
				code: `ERR_EMPTY`
			});
		} else {
			for (let $index in files) {
				let file = files[$index];

				if (this.equal(path.extname(file), this.options.extname)) {
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