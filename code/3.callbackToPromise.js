getData(function (a) {
  getMoreData(a, function (b) {
    getMoreData(b, function (c) {
      getMoreData(c, function (d) {
        // ...
      })
    })
  })
})

// 如果是 promise，这将 callback 变成了一种扁平化的结构。相对于 callback 更加友好
getData()
  .then(getMoreData)
  .then(getMoreData)
  .then(getMoreData)
  .then(function (d) {
    // ...
  })

// 疑问：promise 和 其他方案的竞争，为什么是 promise 胜出了