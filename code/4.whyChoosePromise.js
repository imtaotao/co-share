// 社区不止有 promise 一个概念
// 在 jQuery1.5 中就有了 deferred 的概念
// 为什么最后选择了 promise
// https://groups.google.com/forum/#!topic/bluebird-js/mUiX2-vXW2s
// es6 提出了 new Promise() 这种构建 promise 的方式，以下是俩 demo
// 1. promise 和 deferred 使用方式不同
// 2. deferred 的局限在哪里

const create = () => require('q').defer()

// 1. deferred 和 promise 效果是一样的
function demoOne () {
  // deferred promise 可以理解为订阅发布模式实现
  // 我们可以在 A 模块注册，在 B 模块触发
  const deferred = create()
  deferred.promise.then(v => console.log(v))
  setTimeout(() => deferred.resolve('tao'), 500)
  
  // promise 在构建时就立即进入到触发阶段，不够自由，但是可以把 resolve 拿出来
  // 你即使可以在其他模块引用 p 模块，但是此时的 promise 状态可能已经更改了
  new Promise(resolve => {
    setTimeout(() => resolve('tao'), 500)
  })
  .then(v => console.log(v))
}

// 2. 为什么最终还是选择了 promise
function demoTwo () {
  const deferred = create()
  deferred.promise.catch(reason => console.log(reason))// 不触发
  setTimeout(() => {
    throw 'err'

    // 必须用 try catch 然后通过 deferrd.reject 触发
    // try {
    //   throw 'err'
    // } catch (err) {
    //   deferred.reject(err)
    // }
  })

  // promise 由于是自执行，自动捕捉异常
  new Promise(() => { throw 'err' })
  .catch(reason => console.log(reason))
}

demoOne()
// demoTwo()

// 通过 promise 创建一个 deferred，可以替换上面的 q 创建的
function createDeferred () {
  let resolve, reject

  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return { promise, resolve, reject }
}

// 结论
// promise 首先应该是一个异步流程控制的解决方案，流程控制包括了正常的数据流和异常流程处理。（捕捉异常，线程安全）
// 而 deferred 的方式存在一个致命的缺陷
// 就是 promise 链的第一个promise（deferred.promise）的触发阶段抛出的异常是不交由 promise 自动处理的

// 疑问：但是 promise 的写法看起来还是不够同步，有什么办法呢？幸好我们有了 generator 函数