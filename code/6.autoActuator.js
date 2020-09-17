// 一个 generator 自执行器
// 我们把这个自执行函数封装为 co

function co (fn, ...args) {
  return new Promise((resolve, reject) => {
    // 处理 generator 函数
    const gen = fn(...args)

    // 自动执行下一步
    const next = result => {
      let value = result.value
      if (result.done) return resolve(value)

      // 如果是 generator 函数
      if (value && value.constructor && value.constructor.name === 'GeneratorFunction') {
        value = co(value)
      }

      // 就算 value 是 promise，也包裹起来
      Promise.resolve(value).then(onFulfilled, onRejected)
    }

    const onFulfilled = res => {
      let result
      try {
        result = gen.next(res)
        next(result)
      } catch (err) {
        return reject(err)
      }
    }

    const onRejected = err => {
      let result
      try {
        result = gen.throw(err)
        next(result)
      } catch (e) {
        return reject(e)
      }
    }
    
    onFulfilled()
  })
}

// ---- test ----
const ret = co(function * () {
  const a = yield 1
  const b = yield a + 1
  const c = yield b + 1
  const d = yield c + 1
  return d
})
ret.then(v => console.log(v))

// demo
function demo () {
  const fn = v => {
    return new Promise(resolve => {
      setTimeout(() => resolve(v), 200)
    })
  }

  const ret = co(function * () {
    const a = yield fn(1)
    const b = yield fn(a + 1)
    const c = yield fn(b + 1)
    const d = yield fn(c + 1)
    return d
  })
  ret.then(v => console.log(v))
}

function demoTwo () {
  const ret = co(function * () {
    try {
      throw 'err'
    } catch (err) {
      console.log(err)
      throw 'err'
    }
  })

  ret.catch(err => console.log(err))
}

demo()
demoTwo()

// 疑问：generator 函数和 promise 能不能封装一下，做成一个新的语法糖（肯定是可以的）