var imageCache = require('./image-cache')
var path = require('path')

imageCache.setOptions({
  dir: path.join(__dirname, 'cache/'),
  compressed: false
})

var images = [
  'https://4.bp.blogspot.com/-QcLPmwZh-VI/WU5rEVtx9WI/AAAAAAAAfWo/Rs9IBKIuqbc94LlWVjoXNSM_HN-6dQpdgCLcBGAs/s400/%255BHorribleSubs%255D%2BYu-Gi-Oh%2521%2BVRAINS%2B-%2B07%2B720p-muxed_001_1409.png',
  'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&url=https://lh3.googleusercontent.com/-AUpXPK4IOi4/AAAAAAAAAAI/AAAAAAAAAAA/AI6yGXxcuACwUIVtH8VfdOlCD8KQjDDZSw/s32-c-mo/photo.jpg'
]
var image = 'https://4.bp.blogspot.com/-QcLPmwZh-VI/WU5rEVtx9WI/AAAAAAAAfWo/Rs9IBKIuqbc94LlWVjoXNSM_HN-6dQpdgCLcBGAs/s400/%255BHorribleSubs%255D%2BYu-Gi-Oh%2521%2BVRAINS%2B-%2B07%2B720p-muxed_001_1409.png'

// Async
imageCache.isCached(image, function (exists) {
  if (exists) {
    imageCache.get(image, function (error, result) {
      if (error) throw error
      console.log(result.hashFile)
    })
  }
})
imageCache.fetch(image).then((results) => {
  console.log(results)
})
imageCache.fetch(images).then((results) => {
  console.log(results)
})
imageCache.flush(function (error, results) {
  if (error) {
    console.log(error)
  } else {
    console.log(results)
  }
})

// Sync
var isCached = imageCache.isCachedSync(image)

if (isCached) {
  let imageData = imageCache.getSync(image)

  console.log(imageData.url)
}
try {
  imageCache.flushSync()
} catch (error) {
  console.log(error)
}
