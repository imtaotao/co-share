(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Liberty = factory());
}(this, function () { 'use strict';

  function assertPath(path) {
    if (typeof path !== 'string') {
      throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
    }
  }
  function normalizeStringPosix(path, allowAboveRoot) {
    var res = '';
    var lastSegmentLength = 0;
    var lastSlash = -1;
    var dots = 0;
    var code;
    for (var i = 0; i <= path.length; ++i) {
      if (i < path.length) {
      code = path.charCodeAt(i);
      } else if (code === 47 )
        break;
      else
        code = 47 ;
      if (code === 47 ) {
        if (lastSlash === i - 1 || dots === 1) ; else if (lastSlash !== i - 1 && dots === 2) {
          if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46  || res.charCodeAt(res.length - 2) !== 46 ) {
            if (res.length > 2) {
              var lastSlashIndex = res.lastIndexOf('/');
              if (lastSlashIndex !== res.length - 1) {
                if (lastSlashIndex === -1) {
                  res = '';
                  lastSegmentLength = 0;
                } else {
                  res = res.slice(0, lastSlashIndex);
                  lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
                }
                lastSlash = i;
                dots = 0;
                continue;
              }
            } else if (res.length === 2 || res.length === 1) {
              res = '';
              lastSegmentLength = 0;
              lastSlash = i;
              dots = 0;
              continue;
            }
          }
          if (allowAboveRoot) {
            if (res.length > 0)
              res += '/..';
            else
              res = '..';
            lastSegmentLength = 2;
          }
        } else {
          if (res.length > 0)
            res += '/' + path.slice(lastSlash + 1, i);
          else
            res = path.slice(lastSlash + 1, i);
          lastSegmentLength = i - lastSlash - 1;
        }
        lastSlash = i;
        dots = 0;
      } else if (code === 46  && dots !== -1) {
        ++dots;
      } else {
        dots = -1;
      }
    }
    return res;
  }
  var posix = {
    normalize: function normalize(path) {
      assertPath(path);
      if (path.length === 0) return '.';
      var isAbsolute = path.charCodeAt(0) === 47 ;
      var trailingSeparator = path.charCodeAt(path.length - 1) === 47 ;
      path = normalizeStringPosix(path, !isAbsolute);
      if (path.length === 0 && !isAbsolute) path = '.';
      if (path.length > 0 && trailingSeparator) path += '/';
      if (isAbsolute) return '/' + path;
      return path;
    },
    isAbsolute: function isAbsolute(path) {
      assertPath(path);
      return path.length > 0 && path.charCodeAt(0) === 47 ;
    },
    join: function join() {
      if (arguments.length === 0)
        return '.';
      var joined;
      for (var i = 0; i < arguments.length; ++i) {
        var arg = arguments[i];
        assertPath(arg);
        if (arg.length > 0) {
          if (joined === undefined)
            joined = arg;
          else
            joined += '/' + arg;
        }
      }
      if (joined === undefined)
        return '.';
      return posix.normalize(joined);
    },
    dirname: function dirname(path) {
      assertPath(path);
      if (path.length === 0) return '.';
      var code = path.charCodeAt(0);
      var hasRoot = code === 47 ;
      var end = -1;
      var matchedSlash = true;
      for (var i = path.length - 1; i >= 1; --i) {
        code = path.charCodeAt(i);
        if (code === 47 ) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
          matchedSlash = false;
        }
      }
      if (end === -1) return hasRoot ? '/' : '.';
      if (hasRoot && end === 1) return '//';
      return path.slice(0, end);
    },
    extname: function extname(path) {
      assertPath(path);
      var startDot = -1;
      var startPart = 0;
      var end = -1;
      var matchedSlash = true;
      var preDotState = 0;
      for (var i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 ) {
            if (!matchedSlash) {
              startPart = i + 1;
              break;
            }
            continue;
          }
        if (end === -1) {
          matchedSlash = false;
          end = i + 1;
        }
        if (code === 46 ) {
            if (startDot === -1)
              startDot = i;
            else if (preDotState !== 1)
              preDotState = 1;
        } else if (startDot !== -1) {
          preDotState = -1;
        }
      }
      if (startDot === -1 || end === -1 ||
          preDotState === 0 ||
          preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return '';
      }
      return path.slice(startDot, end);
    },
    sep: '/',
    delimiter: ':',
    win32: null,
    posix: null
  };

  function genMappings (source) {
    const lines = source.split('\n');
    const code = l => `AA${l}A`;
    return code('D') + ';' + lines.map(() => code('C')).join(';')
  }
  function sourcemap (resource, responseURL) {
    const content = JSON.stringify({
      version: 3,
      sources: [responseURL],
      mappings: genMappings(resource),
    });
    return `//@ sourceMappingURL=data:application/json;base64,${btoa(content)}`
  }

  var config = {
    alias: {},
    hooks: {},
    init: false,
    exname: '.js',
    sourcemap: true,
    staticOptimize: true,
  };

  class Cache {
    constructor () {
      this.Modules = new Map();
    }
    cache (path, Module, update) {
      if (update || !this.has(path)) {
        this.Modules.set(path, Module);
      }
    }
    has (path) {
      return this.Modules.has(path)
    }
    get (path) {
      return this.Modules.get(path) || null
    }
    clear (path) {
      return this.Modules.delete(path)
    }
    clearAll () {
      return this.Modules.clear()
    }
  }
  var cacheModule = new Cache();
  const resourceCache = new Cache();
  const responseURLModules = new Cache();

  function request (url, envPath, isAsync) {
    const getCache = xhr => {
      const responseURL = xhr.responseURL;
      if (responseURLModules.has(responseURL)) {
        xhr.abort();
        return {
          responseURL,
          resource: null,
          haveCache: true,
        }
      }
      if (!isAsync) {
        console.warn(`The module [${url}] is requested by synchronization, please avoid using this method\n\n --> from [${envPath}]\n`);
      }
      return null
    };
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, isAsync);
    xhr.send();
    if (isAsync) {
      return new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
          const cache = getCache(xhr);
          cache && resolve({ target: cache });
        };
        xhr.onload = resolve;
        xhr.onerror = reject;
      })
    }
    return getCache(xhr) || xhr
  }
  function dealWithResponse (url, xhr, envPath) {
    if (xhr.haveCache) return xhr
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        if (typeof xhr.response === 'string') {
          return {
            resource: xhr.response,
            responseURL: xhr.responseURL,
          }
        }
      } else if (xhr.status === 404) {
        throw Error(`Module [${url}] not found.\n\n --> from [${envPath}]\n`)
      }
    }
  }
  async function asyncRequest (url, envPath) {
    const { target: xhr } = await request(url, envPath, true);
    return dealWithResponse(url, xhr, envPath)
  }
  function syncRequest (url, envPath) {
    const xhr = request(url, envPath, false);
    return dealWithResponse(url, xhr, envPath)
  }

  const PROTOCOL = /\w+:\/\/?/;
  const readOnly = (obj, key, value) => {
    Object.defineProperty(obj, key, {
      value: value,
      writable: false,
    });
  };
  const readOnlyMap = obj => {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key];
        val && typeof val === 'object'
          ? readOnly(newObj, key, readOnlyMap(val))
          : readOnly(newObj, key, val);
      }
    }
    return newObj
  };
  const getLegalName = name => {
    return name in window
      ? getLegalName(name + '1')
      : name
  };
  const PREFIX_RE = /(@[^\/]+)(\/.+)*/;
  const applyAlias = (path, alias, envPath) => {
    return path.replace(PREFIX_RE, ($1, $2, $3 = '') => {
      const prefix = $2.slice(1, $2.length);
      const aliasStr = alias[prefix];
      if (typeof aliasStr !== 'string') {
        throw Error(`Alias [${prefix}] does not exist.\n\n ---> from ${envPath} \n` )
      }
      return PROTOCOL.test(aliasStr)
        ? aliasStr + $3
        : posix.join(aliasStr, $3)
    })
  };
  const getParentConfig = (envPath, responseURL) => {
    const dirname = posix.dirname(responseURL);
    const envDir = (new URL(dirname)).pathname;
    return { envDir, envPath, dirname }
  };
  const realPath = (path, {envPath, envDir}, config) => {
    const alias = config.alias;
    if (alias && path[0] === '@') {
      path = applyAlias(path, alias, envPath);
    }
    if (path === '.' || path === './') path = envPath;
    let exname = posix.extname(path);
    if (!exname) {
      path += config.exname;
      exname = config.exname;
    }
    if (!posix.isAbsolute(path) && !PROTOCOL.test(path)) {
      path = posix.join(envDir, path);
    }
    return { path, exname }
  };

  function getFilePaths (codeStr, set, processPath) {
    let res;
    const paths = [];
    codeStr = ' ' + codeStr.replace(/[^:]\/\/.*|\/\*[\w\W]*?\*\//g, '');
    const REG = /[^\w\.](require[\n\s]*)\(\s*\n*['"]([^'"]+)['"]\n*\s*\);*/g;
    while (res = REG.exec(codeStr)) {
      if (res[2]) {
        const path = processPath(res[2]).path;
        if (!paths.includes(path) && !set.has(path)) {
          paths.push(path);
        }
      }
    }
    return paths
  }
  function getFileResult (envPath, paths) {
    return Promise.all(paths.map(async path => {
      if (!cacheModule.has(path) && !resourceCache.has(path)){
        const content = await asyncRequest(path, envPath);
        if (!content.haveCache) {
          return { path, content }
        }
      }
    }))
  }
  async function deepTraversal (paths, envPath, config, set = new Set()) {
    paths.forEach(v => set.add(v));
    const files = await getFileResult(envPath, paths);
    const children = files.map((fileInfo) => {
      if (!fileInfo) return null
      const { path, content } = fileInfo;
      const parentConfig = getParentConfig(path, content.responseURL);
      resourceCache.cache(path, content);
      const paths = getFilePaths(content.resource, set,
        childPath => realPath(childPath, parentConfig, config));
      return paths.length > 0
        ? deepTraversal(paths, parentConfig.envPath, config, set)
        : null
    });
    return Promise.all(children).then(() => set)
  }
  function staticOptimize (entrance, parentConfig, config) {
    const paths = realPath(entrance, parentConfig, config);
    return deepTraversal([paths.path], parentConfig.envPath, config)
  }

  class Plugins {
    constructor (type) {
      this.type = type;
      this.plugins = new Set();
    }
    add (fn) {
      this.plugins.add(fn);
    }
    forEach (params) {
      let res = params;
      for (const plugin of this.plugins.values()) {
        res.resource = plugin(res);
      }
      return res
    }
  }
  const map = {
    allPlugins: new Map(),
    add (type, fn) {
      if (typeof type === 'string' && typeof fn === 'function') {
        if (!this.allPlugins.has(type)) {
          const pluginClass = new Plugins(type);
          pluginClass.add(fn);
          this.allPlugins.set(type, pluginClass);
        } else {
          this.allPlugins.get(type).add(fn);
        }
      } else {
        throw TypeError('The "parameter" does not meet the requirements')
      }
    },
    get (type = '*') {
      return this.allPlugins.get(type)
    },
    run (type, params) {
      const plugins = this.allPlugins.get(type);
      if (plugins) {
        return plugins.forEach(params)
      }
      return params
    }
  };
  function addDefaultPlugins () {
    map.add('*', opts => opts.resource);
    map.add('.js', jsPlugin);
  }

  let isStart = false;
  function init (opts = {}) {
    if (this.config && this.config.init) {
      throw new Error('Can\'t repeat init.')
    }
    opts.init = true;
    readOnly(this, 'config',
      readOnlyMap(Object.assign(config, opts))
    );
    return entrance => {
      if (isStart) throw Error('Can\'t repeat start.')
      if (!entrance || (!posix.isAbsolute(entrance) && !PROTOCOL.test(entrance))) {
        throw Error('The startup path must be an absolute path.')
      }
      const parentConfig = {
        envPath: entrance,
        envDir: posix.dirname(entrance) || '/',
      };
      const start = () => {
        if (isStart) throw Error('Can\'t repeat start.')
        isStart = true;
        importModule(entrance, parentConfig, this.config, true);
      };
      readOnly(this.config, 'entrance', entrance);
      addDefaultPlugins();
      if (this.config.staticOptimize) {
        staticOptimize(entrance, parentConfig, this.config)
        .then(set => {
          typeof this.config.hooks.ready === 'function'
            ? this.config.hooks.ready(set, start)
            : start();
        });
      } else {
        start();
      }
    }
  }
  function addPlugin (exname, fn) {
    if (this.config && this.config.init) {
      throw Error('Unable to add plugin after initialization.')
    } else {
      if (typeof exname === 'string') {
        const types = exname.split(' ');
        if (types.length) {
          if (types.length === 1) {
            map.add(types[0], fn);
          } else {
            for (const type of types) {
              map.add(type, fn);
            }
          }
        }
      }
    }
  }
  async function ready (paths = [], entrance) {
    const config = this.config;
    if (!config || !config.init) {
      throw Error('This method must be called after initialization.')
    }
    if (isStart) {
      throw Error('Static resources must be loaded before the module is loaded.')
    }
    await Promise.all(paths.map(p => {
      const isProtocolUrl = PROTOCOL.test(p);
      if (!isProtocolUrl) p = posix.normalize(p);
      if (!posix.isAbsolute(p) && !isProtocolUrl) {
        throw Error(`The path [${p}] must be an absolute path.\n\n ---> from [ready method]\n`)
      }
      return resourceCache.has(p)
        ? null
        : asyncRequest(p, 'ready method').then(resource => {
            resourceCache.cache(p, resource);
          })
    }));
    return entrance
  }
  function importAll (paths, parentInfo, config) {
    if (Array.isArray(paths)) {
      return paths.length === 0
        ? Promise.resolve([])
        : Promise.all(paths.map(path => importModule(path, parentInfo, config, true)))
    }
    throw Error(`Paths [${paths}] must be an array.\n\n ---> from [${parentInfo.envPath}]\n`)
  }
  function importModule (path, parentInfo, config, isAsync) {
    const envPath = parentInfo.envPath;
    if (!path || typeof path !== 'string') {
      throw TypeError(`Require path [${path}] must be a string. \n\n ---> from [${envPath}]\n`)
    }
    const pathOpts = realPath(path, parentInfo, config);
    if (cacheModule.has(pathOpts.path)) {
      const Module = cacheModule.get(pathOpts.path);
      const result = getModuleResult(Module);
      return !isAsync
        ? result
        : Promise.resolve(result)
    }
    return isAsync
      ? getModuleForAsync(pathOpts, config, parentInfo)
      : getModuleForSync(pathOpts, config, envPath)
  }
  async function getModuleForAsync ({path, exname}, config, parentInfo) {
    let staticFile = null;
    if (resourceCache.has(path)) {
      staticFile = resourceCache.get(path);
    } else {
      await staticOptimize(path, parentInfo, config);
      staticFile = resourceCache.get(path);
    }
    return genModule(path, exname, config, staticFile)
  }
  function getModuleForSync ({path, exname}, config, envPath) {
    const staticFile = resourceCache.has(path)
      ? resourceCache.get(path)
      : syncRequest(path, envPath);
    return genModule(path, exname, config, staticFile)
  }
  function getModuleResult (Module) {
    return Module && typeof Module === 'object' && Module.__rustleModule
      ? Module.exports
      : Module
  }
  function genModule (path, exname, config, staticFile) {
    const Module = processResource(path, exname, config, staticFile);
    resourceCache.clear(path);
    return Module
  }
  function processResource (path, exname, config, {resource, responseURL}) {
    const Module = responseURLModules.has(responseURL)
      ? responseURLModules.get(responseURL)
      : runPlugins(exname, {
          path,
          exname,
          config,
          resource,
          responseURL,
        });
    cacheModule.cache(path, Module);
    responseURLModules.cache(responseURL, Module);
    return getModuleResult(Module)
  }
  function runPlugins (type, opts) {
    opts = map.run('*', opts);
    return map.run(type, opts).resource
  }

  function run (scriptCode, rigisterObject, windowModuleName) {
    const node = document.createElement('script');
    node.text = scriptCode;
    node.style.display = 'none';
    window[windowModuleName] = rigisterObject;
    document.body.append(node);
    document.body.removeChild(node);
    delete window[windowModuleName];
  }
  function getRegisterParams (config, path, responseURL) {
    const Module = { exports: {} };
    const parentInfo = getParentConfig(path, responseURL);
    readOnly(Module, '__rustleModule', true);
    const require = path => importModule(path, parentInfo, config, false);
    require.async = path => importModule(path, parentInfo, config, true);
    require.all = paths => importAll(paths, parentInfo, config);
    return {
      Module,
      require,
      dirname: parentInfo.dirname,
    }
  }
  function generateObject (config, path, responseURL) {
    const { dirname, Module, require } = getRegisterParams(config, path, responseURL);
    return {
      require,
      module: Module,
      __dirname: dirname,
      exports: Module.exports,
      __filename: responseURL,
    }
  }
  function generateScriptCode (basecode, path, responseURL, parmas, config) {
    const randomId = Math.floor(Math.random() * 10000);
    const moduleName = getLegalName('__rustleModuleObject') + randomId;
    let scriptCode =
      `(function ${getLegalName(path.replace(/[@#\/\.:-]/g, '_'))} (${parmas.join(',')}) {` +
      `\n${basecode}` +
      `\n}).call(undefined, window.${moduleName}.${parmas.join(`,window.${moduleName}.`)});`;
     if (config.sourcemap) {
      scriptCode += `\n${sourcemap(scriptCode, responseURL)}`;
    }
    return { moduleName, scriptCode }
  }
  function runInThisContext (code, path, responseURL, config) {
    const rigisterObject = generateObject(config, path, responseURL);
    const Module = rigisterObject.module;
    const parmas = Object.keys(rigisterObject);
    const { moduleName, scriptCode } = generateScriptCode(code, path, responseURL, parmas, config);
    cacheModule.cache(path, Module);
    responseURLModules.cache(responseURL, Module);
    run(scriptCode, rigisterObject, moduleName);
    cacheModule.clear(path);
    responseURLModules.clear(responseURL);
    return Module
  }
  function jsPlugin ({resource, path, config, responseURL}) {
    return runInThisContext(resource, path, responseURL, config)
  }

  var index = {
    init,
    path: posix,
    ready,
    addPlugin,
    plugins: {
      jsPlugin,
    }
  };

  return index;

}));
