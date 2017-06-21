# image-cache
Powerful image cache for NodeJS

## What is image-cache?
`image-cache` is nodejs module for cache image and serve with base64 format. `image-cache` using 
Asynchronous calls for best Performance.

## How to install image-cache?
to install `image-cache` on your project, you can using NPM and Yarn with following command,  

### NPM
```bash
npm install --save image-cache 
```

### Yarn
```bash
yarn add image-cache
```

## Using image-cache
Start using `image-cache` 

```javascript
var imageCache = require('image-cache');
```

create a root folder for the cache file, default root folder is `cache/`, but you can change it using `setOptions` method.
```bash
~# mkdir cache/
```

## API

### Set Options
is function to replace options from `default options`. this function not returning something.
for using this function, add this code after define all variable.

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
| `compressed` | `boolean` | true | compressing cache output with zlib compressing, maybe can make your prosessing cache litle bit longer. for example without compressing is 6-7ms when using compressing is 150-185ms, but your cache file is litle bit smaller than without compressing |


### Get Cache
Get Cache with single line code

#### Example
```javascript
imageCache.getCache(url, function(error, image) {
	console.log(image);

	// do something with image
});
```
#### API Callback
| Key          | Data Type    | Description    |
| :------------- | :----------- | :------------- | 
| `image` | `object` | as callback cache data |
| `image.error`  | `boolean`   | is a callback data error |
| `image.url`    | `string`   | image source url before transform to base64 format |
| `image.hashFile` | `string` | filename cache |
| `image.timestamp` | `integer` | timestamp when cache created |
| `image.compressed` | `boolean` | is that cache compressed |
| `image.data` | `string` | base64 code, ugly text from your beauty images |



### Set Cache
Set new Cache, write cache files into `options.dir` Directory.

#### Example
```javascript
let images = ['https://eladnava.com/content/images/2015/11/js-6.jpg'];
imageCache.setCache(images, function(error) {
	console.log(error);
});
```

#### API Callback
| Key          | Data Type    | Description    |
| :------------- | :----------- | :------------- | 
| `error` | `object` | this error came from `fs.writeFile`  |


### Flush Cache
Delete all cache files on your directory. this code will be delete all cache on `options.dir` with extension name same as `options.extname`. 

#### Example
```javascript
imageCache.flushCache(function(error, results) {
	if (error) {
		console.log(error);
	} else {
		console.log(results);
	}
});
```

#### API
