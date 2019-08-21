getData(function (a) {
  getMoreData(a, function (b) {
    getMoreData(b, function (c) {
      getMoreData(c, function (d) {
        // ...
      })
    })
  })
})

// 需要合理的封装和简化，这需要开发人员自身的水平和认知决定
function fn (a, cb) {
  getMoreData(a, function (b) {
    getMoreData(b, function (c) {
      getMoreData(c, function (d) {
        cb(d)
      })
    })
  })
}

// 通过层层封装，抽象出模块和通用的类来保证代码是浅层
getData(function (a) {
  fn(a, function (d) {
    // ...
  })
})

// 疑问：有什么办法不依靠开发人员的水平来维护 callback hell