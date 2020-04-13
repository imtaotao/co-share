const GrassPlugin = (function () {
  function loader (source) {
    source = source.trim()
    if (/^\/\/\s*#no\s+compile\s*\n/.test(source)) {
      return source
    }
  
    const result = handleSource(source)
    // if no template and script，it's not grass file
    if (!result || (!result.script && !result.template)) {
      return source
    }
    return conversion(result) || source
  }
  
  function handleSource (source) {
    if (!source) return null
  
    const template = getTagContent(/<\s*template(\s*[^<>]*|\s*)>([\s\S]+)<\/\s*template\s*>/, source)
    const script = getTagContent(/<\s*script(\s*[^<>]*|\s*)>([\s\S]+)<\/\s*script\s*>/, source)
  
    return {
      script,
      template,
      options: null,
    }
  }
  
  function getTagContent (reg, source) {
    const res = source.match(reg)
    if (res) {
      return {
        content: res[2].trim(),
        options: getTagOptions(res[1].trim())
      }
    }
    return null
  }
  
  function getTagOptions (str) {
    const options = Object.create(null)
    if (!str) return options
  
    let result, i = 0
    const reg = /\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))/g
  
    while (result = reg.exec(str)) {
      const name = result[1]
      const val = result[3] || result[4] || result[5]
    
      if (name && val !== undefined) {
        options[name] = val
      }
      if (++i > 2) break
    }
  
    return options
  }

  function conversion (file) {
    return !file.template
      ? onlyScript(file)
      : !file.script
          ? onlyTemplate(file)
          : completeFormat(file)
  }
  
  function completeFormat (file) {
    let newCode
    const scrCode = file.script.content
    const tempStr = file.template.content.replace(/`/g, '\\`')
    const string = `\`${tempStr}\`\n`
    const method = `template () { return \`${tempStr}\`; }\n`
  
    newCode = replaceMethod(scrCode, method)
    newCode = replaceString(newCode, string)

    return newCode
  }
  
  function onlyTemplate (file) {
    const options = file.template.options
    const tempStr = file.template.content.replace(/`/g, '\\`')
  
    let method = options.name
      ? `function ${options.name}()`
      : 'function ()'
  
    method += ` { return \`${tempStr}\`; }`
    return `module.exports = ${method}`
  }
  
  function onlyScript (file) {
    return file.script.content
  }
  
  function replaceMethod (code, method) {
    // "//#temp method" or "//#temp"
    return code.replace(/\/\/\s*#temp(\s+method)?\s*\n/g, method)
  }
  
  function replaceString(code, string) {
    // "//#temp string" or "/*#temp string*/"
    const newCode = code.replace(/\/\/\s*#temp\s+string?\s*\n/g, string)
    return newCode.replace(/\/\*\s*#temp\s+string?\s*\*\//g, string)
  }

  return res => loader(res.resource)
})()
