const ret = (async function () {
  const a = await 1
  const b = await a + 1
  const c = await b + 1
  const d = await c + 1
  return d
})()
ret.then(v => console.log(v))

// demo
function demo () {
  const fn = v => {
    return new Promise(resolve => setTimeout(() => resolve(v + 1), 200))
  }

  const ret = (async function () {
    const a = await fn(1)
    const b = await fn(a)
    const c = await fn(b)
    const d = await fn(c)
    return d
  })()
  ret.then(v => console.log(v))
}

function demoTwo () {
  const ret = (async function () {
    try {
      throw 'err'
    } catch (err) {
      console.log(err)
      throw 'err'
    }
  })()

  ret.catch(err => console.log(err))
}

demo()
demoTwo()

// 疑问：原生的 async 函数是否真的用到了 promise（真的用到了，看下面的 demo）