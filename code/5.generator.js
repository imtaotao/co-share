// 代码演变历程
// callback -> promise -> generator
// 不同演变进程下的代码写法，我们可以看到是以越来越同步的写法进行

const getData = cb => {
  return new Promise(resolve => {
    cb && cb(1)
    resolve(1)
  })
}
const getMoreData = (v, cb) => {
  cb && cb(v + 1)
  return v + 1
}

// 1. callback
getData(function (a) {
  getMoreData(a, function (b) {
    getMoreData(b, function (c) {
      getMoreData(c, function (d) {
        console.log('callback', d)
      })
    })
  })
})

// 2. promise
getData()
  .then(getMoreData)
  .then(getMoreData)
  .then(getMoreData)
  .then(function (d) {
    console.log('promise', d)
  })

// 3. generator
const gen = (function * () {
  const a = yield 1
  const b = yield a + 1
  const c = yield b + 1
  const d = yield c + 1
  return d
})()

const a = gen.next()
const b = gen.next(a.value)
const c = gen.next(b.value)
const d = gen.next(c.value)
console.log('generator', d.value)

// 可以看到使用 generato 函数已经做到语法上的同步了，但是 generator 函数需要手动调用 next
// 疑问：我们可不可以把手动调用的过程封装为一个函数，让他自动执行