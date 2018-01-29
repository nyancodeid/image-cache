# image-cache
[![Build Status](https://travis-ci.org/nyancodeid/image-cache.svg?branch=master)](https://travis-ci.org/nyancodeid/image-cache) [![npm version](https://badge.fury.io/js/image-cache.svg)](https://badge.fury.io/js/image-cache)  

Powerful image cache for NodeJS

## What is image-cache?
`image-cache` is nodejs module for cache image and serve with base64 format. `image-cache` using 
Asynchronous calls for best Performance.

## New
- Compressed options default is `false`
- Library Core now using Javascript Classes
- New syntax and function
- Now `image-cache` using [google proxy cache](https://gist.github.com/coolaj86/2b2c14b1745028f49207) for best caching.

## Installation
to install `image-cache` on your project, you can use NPM and Yarn with the following command, 

### NPM
```bash
npm install --save image-cache 
```

### Yarn
```bash
yarn add image-cache
```

## Usage
Start using `image-cache` 

```javascript
const imageCache = require('image-cache');
```

## API

### setOptions
is a function to replace options from `default options`. this function not returning something.
for using this function, add this code after defining all variable.

```javascript
imageCache.setOptions({
   compressed: false

   // write your custom options here
});
```
#### API 
| Key          | Data Type    | Default Value    | Description |
| :------------- | :----------- | :------------- | :------------- |
| `dir` | `string` | `path.join(__dirname, 'cache/')` | directory root for cached files |
| `compressed` | `boolean` | false | compressing cache output with zlib compressing maybe can make your processing cache little bit longer. for example without compressing is 6-7ms when using compressing is 150-185ms, but your cache file is a litle bit smaller than without compressing |
| `extname` | `string` | `.cache` | file extension for your cache files |
| `googleCache` | `boolean` | `true` | using google cache proxy |

### isCached()
Check is your image already cached or not. this function need 2 params.

```javascript
imageCache.isCached(url, callback);
```

#### Params
| Key          | Data Type    |
| :------------- | :----------- |
| `url` | `string` | 
| `callback` | `function` | 

#### Example Using Callback
```javascript
imageCache.isCached(url, (exist) => {
   if (exist) {
      // do something with cached image
   }
});
```
#### Example Using Promise
```javascript
imageCache.isCached(url).then((exist) => {
   if (exist) {
      // do something with cached image
   }
});
```

### isCachedSync()
Check is your image is cached with Synchronous processing. return as `boolean`

#### Example

```javascript
var exists = imageCache.isCachedSync(url);
```
#### API
| Params         | Data Type    | Description    |
| :------------- | :----------- | :------------- | 
| `url` | `string` | url of your image |


### getCache
Deprecated

### get()
Get cached image

#### Example
```javascript
imageCache.get(url, (error, image) => {
   console.log(image);

   // do something with image
});
```
#### API Callback
| Key          | Data Type    | Description    |
| :------------- | :----------- | :------------- | 
| `image` | `object` | cache data object |
| `image.error`  | `boolean`   | cache data error indicator |
| `image.url`    | `string`   | image source url before transform to base64 format |
| `image.hashFile` | `string` | filename cache |
| `image.timestamp` | `integer` | timestamp when cache created |
| `image.compressed` | `boolean` | is that cache compressed |
| `image.data` | `string` | base64 code, ugly text from your beauty images |


### getCacheSync
Deprecated

### getSync
Get Cached image with Synchronous processing.

#### Example

```javascript
var image = imageCache.getSync('http://domain/path/to/image.png');
```

#### API
API return same like `.get()`

### setCache()
Deprecated

### store()
store new image want to cache, write cache files into `options.dir` Directory. set cache is working with multiple images (Array). 

```javascript
imageCache.store(images, callback);
```

#### Params
| Key          | Data Type    |
| :------------- | :----------- |
| `images` | `array`|`string` | 
| `callback` | `function` | 

#### Example Using Callback
```javascript
let images = 'https://eladnava.com/content/images/2015/11/js-6.jpg';
imageCache.store(images, function(error) {
   console.log(error);
});
```
#### Example Using Promise
```javascript
let images = 'https://eladnava.com/content/images/2015/11/js-6.jpg';
imageCache.store(images).then((result) {
    // do something when image stored
}).catch((e) => {
    console.log(e)
});
```

#### API Callback and Promise Catch
| Key          | Data Type    | Description    |
| :------------- | :----------- | :------------- | 
| `error` | `object` | this error came from `fs.writeFile`  |

### flushCache()
Deprecated

### flush()
Delete all cache files on your directory. this code will delete all cache on `options.dir` with extension name same as `options.extname`. 

#### Example Using Callback
```javascript
imageCache.flush(function(error, results) {
   if (error) {
      console.log(error);
   } else {
      console.log(results);
   }
});
```
#### Example Using Promise
```javascript
imageCache.flush().then((results) => {
    console.log(results);
}).then((error) => {
    console.log(error);
});
```

#### API Callback
| Key          | Data Type    | Description    |
| :------------- | :----------- | :------------- |
| `results` | `object` | details |
| `results.deleted` | `number` | total of deleted files |
| `results.totalFiles` | `number` | total files on directory |
| `results.dir` | `string` | Directory cache images |

### flushSync()
same like `flush` method, but using Synchronous processing.

#### Example

```javascript
var results = imageCache.flushSync();
```

#### API
same like `flush()`

| Key          | Data Type    | Description    |
| :------------- | :----------- | :------------- |
| `results.error` | `boolean` | error statement |
| `results.message` | `string` | error message |

### fetchImage()
Deprecated

### fetch()
`fetch()` is a function to store cache and get cache data in one time. `fetch()` using Async processing for best performace. `fetch()` check your cache file first, if your image is not available in cache folder then this function will get image and return your cache data.

#### Params
| Key          | Data Type    | Description    |
| :------------- | :----------- | :------------- | 
| `image` | `string` or `array` | image or array of images | 

#### Example

```javascript
var image = "http://path.to/image.jpg";

imageCache.fetch(image).then((images) => {
   images.forEach((image) => {
      console.log(image);

      // { ... }
   });
   console.log(images);

   // [ { ... } ]
}).catch((error) => {

});
```

#### API
| Key          | Data Type    | Description    |
| :------------- | :----------- | :------------- | 
| `images` | `array` | cache data array group |
| `image` | `object` | cache data object |
| `image.error`  | `boolean`   | cache data error indicator |
| `image.url`    | `string`   | image source url before transform to base64 format |
| `image.hashFile` | `string` | filename cache |
| `image.timestamp` | `integer` | timestamp when cache created |
| `image.compressed` | `boolean` | is that cache compressed |
| `image.data` | `string` | base64 code, ugly text from your beauty images |
| `image.cache` | `string` | cache status is "MISS" or "HIT" |

## What is MISS or HIT mean?

### MISS
when your image is not available in the cache folder, image will be grab from image URL then cached on cache folder.

### HIT
when your image is available in the cache folder, the image will be grab directly from cache folder.
