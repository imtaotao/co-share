require('./global.css')
require('./lib/flexible.js')
const Grass = require('@Grass')
const Root = require('@comp/root/index')

// 语法高亮指令
Grass.directive('lighlight', dom => {
  dom.querySelectorAll('code').forEach(block => {
    hljs.highlightBlock(block)
  })
})

// 添加过滤的 code
Grass.mixin({
  filterCode (code) {
    let firstLine = null
    codes = code.split('\n').map(line => {
      if (!line) return ''
      for (let i = 0, j = 0; i < line.length; i++) {
        if (line[i] !== ' ') {
          if (typeof firstLine === 'number') {
            j = j > firstLine ? firstLine : j
          } else {
            firstLine = j || 0
          }
          return line.slice(j, line.length).replace('template.', 'template') || ''
        }
        j++
      }
    })
    return codes.join('\n')
  }
})

// 初始化组件
Root.$mount(document.getElementById('root'))

// 初始化 ppt
const Impress = impress()
Impress.init()

// 如果 liberty 没有语法报错，删除 loading 信息
const loading = document.getElementById('loading')
if (loading) {
  loading.parentNode.removeChild(loading)
}

module.exports = Impress