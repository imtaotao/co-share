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

// 初始化组件
Root.$mount(document.getElementById('root'))

// 初始化 ppt
const Impress = impress()
Impress.init()

// 如果 liberty 没有语法报错，删除不支持的信息
const notSupport = document.getElementById('notSupport')
if (notSupport) {
  notSupport.parentNode.removeChild(notSupport)
}

module.exports = Impress