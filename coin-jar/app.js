(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve2) => call.then(() => resolve2({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve2, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve2(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor/filesystem/dist/esm/definitions.js
  var Directory, Encoding;
  var init_definitions = __esm({
    "node_modules/@capacitor/filesystem/dist/esm/definitions.js"() {
      (function(Directory2) {
        Directory2["Documents"] = "DOCUMENTS";
        Directory2["Data"] = "DATA";
        Directory2["Library"] = "LIBRARY";
        Directory2["Cache"] = "CACHE";
        Directory2["External"] = "EXTERNAL";
        Directory2["ExternalStorage"] = "EXTERNAL_STORAGE";
        Directory2["ExternalCache"] = "EXTERNAL_CACHE";
        Directory2["LibraryNoCloud"] = "LIBRARY_NO_CLOUD";
        Directory2["Temporary"] = "TEMPORARY";
      })(Directory || (Directory = {}));
      (function(Encoding2) {
        Encoding2["UTF8"] = "utf8";
        Encoding2["ASCII"] = "ascii";
        Encoding2["UTF16"] = "utf16";
      })(Encoding || (Encoding = {}));
    }
  });

  // node_modules/@capacitor/filesystem/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    FilesystemWeb: () => FilesystemWeb
  });
  function resolve(path) {
    const posix = path.split("/").filter((item) => item !== ".");
    const newPosix = [];
    posix.forEach((item) => {
      if (item === ".." && newPosix.length > 0 && newPosix[newPosix.length - 1] !== "..") {
        newPosix.pop();
      } else {
        newPosix.push(item);
      }
    });
    return newPosix.join("/");
  }
  function isPathParent(parent, children) {
    parent = resolve(parent);
    children = resolve(children);
    const pathsA = parent.split("/");
    const pathsB = children.split("/");
    return parent !== children && pathsA.every((value, index) => value === pathsB[index]);
  }
  var FilesystemWeb;
  var init_web = __esm({
    "node_modules/@capacitor/filesystem/dist/esm/web.js"() {
      init_dist();
      init_definitions();
      FilesystemWeb = class _FilesystemWeb extends WebPlugin {
        constructor() {
          super(...arguments);
          this.DB_VERSION = 1;
          this.DB_NAME = "Disc";
          this._writeCmds = ["add", "put", "delete"];
          this.downloadFile = async (options) => {
            var _a, _b;
            const requestInit = buildRequestInit(options, options.webFetchExtra);
            const response = await fetch(options.url, requestInit);
            let blob;
            if (!options.progress)
              blob = await response.blob();
            else if (!(response === null || response === void 0 ? void 0 : response.body))
              blob = new Blob();
            else {
              const reader = response.body.getReader();
              let bytes = 0;
              const chunks = [];
              const contentType = response.headers.get("content-type");
              const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
              while (true) {
                const { done, value } = await reader.read();
                if (done)
                  break;
                chunks.push(value);
                bytes += (value === null || value === void 0 ? void 0 : value.length) || 0;
                const status = {
                  url: options.url,
                  bytes,
                  contentLength
                };
                this.notifyListeners("progress", status);
              }
              const allChunks = new Uint8Array(bytes);
              let position = 0;
              for (const chunk of chunks) {
                if (typeof chunk === "undefined")
                  continue;
                allChunks.set(chunk, position);
                position += chunk.length;
              }
              blob = new Blob([allChunks.buffer], { type: contentType || void 0 });
            }
            const result = await this.writeFile({
              path: options.path,
              directory: (_a = options.directory) !== null && _a !== void 0 ? _a : void 0,
              recursive: (_b = options.recursive) !== null && _b !== void 0 ? _b : false,
              data: blob
            });
            return { path: result.uri, blob };
          };
        }
        readFileInChunks(_options, _callback) {
          throw this.unavailable("Method not implemented.");
        }
        async initDb() {
          if (this._db !== void 0) {
            return this._db;
          }
          if (!("indexedDB" in window)) {
            throw this.unavailable("This browser doesn't support IndexedDB");
          }
          return new Promise((resolve2, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onupgradeneeded = _FilesystemWeb.doUpgrade;
            request.onsuccess = () => {
              this._db = request.result;
              resolve2(request.result);
            };
            request.onerror = () => reject(request.error);
            request.onblocked = () => {
              console.warn("db blocked");
            };
          });
        }
        static doUpgrade(event) {
          const eventTarget = event.target;
          const db = eventTarget.result;
          switch (event.oldVersion) {
            case 0:
            case 1:
            default: {
              if (db.objectStoreNames.contains("FileStorage")) {
                db.deleteObjectStore("FileStorage");
              }
              const store = db.createObjectStore("FileStorage", { keyPath: "path" });
              store.createIndex("by_folder", "folder");
            }
          }
        }
        async dbRequest(cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store = tx.objectStore("FileStorage");
              const req = store[cmd](...args);
              req.onsuccess = () => resolve2(req.result);
              req.onerror = () => reject(req.error);
            });
          });
        }
        async dbIndexRequest(indexName, cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store = tx.objectStore("FileStorage");
              const index = store.index(indexName);
              const req = index[cmd](...args);
              req.onsuccess = () => resolve2(req.result);
              req.onerror = () => reject(req.error);
            });
          });
        }
        getPath(directory, uriPath) {
          const cleanedUriPath = uriPath !== void 0 ? uriPath.replace(/^[/]+|[/]+$/g, "") : "";
          let fsPath = "";
          if (directory !== void 0)
            fsPath += "/" + directory;
          if (uriPath !== "")
            fsPath += "/" + cleanedUriPath;
          return fsPath;
        }
        async clear() {
          const conn = await this.initDb();
          const tx = conn.transaction(["FileStorage"], "readwrite");
          const store = tx.objectStore("FileStorage");
          store.clear();
        }
        /**
         * Read a file from disk
         * @param options options for the file read
         * @return a promise that resolves with the read file data result
         */
        async readFile(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (entry === void 0)
            throw Error("File does not exist.");
          return { data: entry.content ? entry.content : "" };
        }
        /**
         * Write a file to disk in the specified location on device
         * @param options options for the file write
         * @return a promise that resolves with the file write result
         */
        async writeFile(options) {
          const path = this.getPath(options.directory, options.path);
          let data = options.data;
          const encoding = options.encoding;
          const doRecursive = options.recursive;
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (occupiedEntry && occupiedEntry.type === "directory")
            throw Error("The supplied path is a directory.");
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const parentEntry = await this.dbRequest("get", [parentPath]);
          if (parentEntry === void 0) {
            const subDirIndex = parentPath.indexOf("/", 1);
            if (subDirIndex !== -1) {
              const parentArgPath = parentPath.substr(subDirIndex);
              await this.mkdir({
                path: parentArgPath,
                directory: options.directory,
                recursive: doRecursive
              });
            }
          }
          if (!encoding && !(data instanceof Blob)) {
            data = data.indexOf(",") >= 0 ? data.split(",")[1] : data;
            if (!this.isBase64String(data))
              throw Error("The supplied data is not valid base64 content.");
          }
          const now = Date.now();
          const pathObj = {
            path,
            folder: parentPath,
            type: "file",
            size: data instanceof Blob ? data.size : data.length,
            ctime: now,
            mtime: now,
            content: data
          };
          await this.dbRequest("put", [pathObj]);
          return {
            uri: pathObj.path
          };
        }
        /**
         * Append to a file on disk in the specified location on device
         * @param options options for the file append
         * @return a promise that resolves with the file write result
         */
        async appendFile(options) {
          const path = this.getPath(options.directory, options.path);
          let data = options.data;
          const encoding = options.encoding;
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const now = Date.now();
          let ctime = now;
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (occupiedEntry && occupiedEntry.type === "directory")
            throw Error("The supplied path is a directory.");
          const parentEntry = await this.dbRequest("get", [parentPath]);
          if (parentEntry === void 0) {
            const subDirIndex = parentPath.indexOf("/", 1);
            if (subDirIndex !== -1) {
              const parentArgPath = parentPath.substr(subDirIndex);
              await this.mkdir({
                path: parentArgPath,
                directory: options.directory,
                recursive: true
              });
            }
          }
          if (!encoding && !this.isBase64String(data))
            throw Error("The supplied data is not valid base64 content.");
          if (occupiedEntry !== void 0) {
            if (occupiedEntry.content instanceof Blob) {
              throw Error("The occupied entry contains a Blob object which cannot be appended to.");
            }
            if (occupiedEntry.content !== void 0 && !encoding) {
              data = btoa(atob(occupiedEntry.content) + atob(data));
            } else {
              data = occupiedEntry.content + data;
            }
            ctime = occupiedEntry.ctime;
          }
          const pathObj = {
            path,
            folder: parentPath,
            type: "file",
            size: data.length,
            ctime,
            mtime: now,
            content: data
          };
          await this.dbRequest("put", [pathObj]);
        }
        /**
         * Delete a file from disk
         * @param options options for the file delete
         * @return a promise that resolves with the deleted file data result
         */
        async deleteFile(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (entry === void 0)
            throw Error("File does not exist.");
          const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
          if (entries.length !== 0)
            throw Error("Folder is not empty.");
          await this.dbRequest("delete", [path]);
        }
        /**
         * Create a directory.
         * @param options options for the mkdir
         * @return a promise that resolves with the mkdir result
         */
        async mkdir(options) {
          const path = this.getPath(options.directory, options.path);
          const doRecursive = options.recursive;
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const depth = (path.match(/\//g) || []).length;
          const parentEntry = await this.dbRequest("get", [parentPath]);
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (depth === 1)
            throw Error("Cannot create Root directory");
          if (occupiedEntry !== void 0)
            throw Error("Current directory does already exist.");
          if (!doRecursive && depth !== 2 && parentEntry === void 0)
            throw Error("Parent directory must exist");
          if (doRecursive && depth !== 2 && parentEntry === void 0) {
            const parentArgPath = parentPath.substr(parentPath.indexOf("/", 1));
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: doRecursive
            });
          }
          const now = Date.now();
          const pathObj = {
            path,
            folder: parentPath,
            type: "directory",
            size: 0,
            ctime: now,
            mtime: now
          };
          await this.dbRequest("put", [pathObj]);
        }
        /**
         * Remove a directory
         * @param options the options for the directory remove
         */
        async rmdir(options) {
          const { path, directory, recursive } = options;
          const fullPath = this.getPath(directory, path);
          const entry = await this.dbRequest("get", [fullPath]);
          if (entry === void 0)
            throw Error("Folder does not exist.");
          if (entry.type !== "directory")
            throw Error("Requested path is not a directory");
          const readDirResult = await this.readdir({ path, directory });
          if (readDirResult.files.length !== 0 && !recursive)
            throw Error("Folder is not empty");
          for (const entry2 of readDirResult.files) {
            const entryPath = `${path}/${entry2.name}`;
            const entryObj = await this.stat({ path: entryPath, directory });
            if (entryObj.type === "file") {
              await this.deleteFile({ path: entryPath, directory });
            } else {
              await this.rmdir({ path: entryPath, directory, recursive });
            }
          }
          await this.dbRequest("delete", [fullPath]);
        }
        /**
         * Return a list of files from the directory (not recursive)
         * @param options the options for the readdir operation
         * @return a promise that resolves with the readdir directory listing result
         */
        async readdir(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (options.path !== "" && entry === void 0)
            throw Error("Folder does not exist.");
          const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
          const files = await Promise.all(entries.map(async (e) => {
            let subEntry = await this.dbRequest("get", [e]);
            if (subEntry === void 0) {
              subEntry = await this.dbRequest("get", [e + "/"]);
            }
            return {
              name: e.substring(path.length + 1),
              type: subEntry.type,
              size: subEntry.size,
              ctime: subEntry.ctime,
              mtime: subEntry.mtime,
              uri: subEntry.path
            };
          }));
          return { files };
        }
        /**
         * Return full File URI for a path and directory
         * @param options the options for the stat operation
         * @return a promise that resolves with the file stat result
         */
        async getUri(options) {
          const path = this.getPath(options.directory, options.path);
          let entry = await this.dbRequest("get", [path]);
          if (entry === void 0) {
            entry = await this.dbRequest("get", [path + "/"]);
          }
          return {
            uri: (entry === null || entry === void 0 ? void 0 : entry.path) || path
          };
        }
        /**
         * Return data about a file
         * @param options the options for the stat operation
         * @return a promise that resolves with the file stat result
         */
        async stat(options) {
          const path = this.getPath(options.directory, options.path);
          let entry = await this.dbRequest("get", [path]);
          if (entry === void 0) {
            entry = await this.dbRequest("get", [path + "/"]);
          }
          if (entry === void 0)
            throw Error("Entry does not exist.");
          return {
            name: entry.path.substring(path.length + 1),
            type: entry.type,
            size: entry.size,
            ctime: entry.ctime,
            mtime: entry.mtime,
            uri: entry.path
          };
        }
        /**
         * Rename a file or directory
         * @param options the options for the rename operation
         * @return a promise that resolves with the rename result
         */
        async rename(options) {
          await this._copy(options, true);
          return;
        }
        /**
         * Copy a file or directory
         * @param options the options for the copy operation
         * @return a promise that resolves with the copy result
         */
        async copy(options) {
          return this._copy(options, false);
        }
        async requestPermissions() {
          return { publicStorage: "granted" };
        }
        async checkPermissions() {
          return { publicStorage: "granted" };
        }
        /**
         * Function that can perform a copy or a rename
         * @param options the options for the rename operation
         * @param doRename whether to perform a rename or copy operation
         * @return a promise that resolves with the result
         */
        async _copy(options, doRename = false) {
          let { toDirectory } = options;
          const { to, from, directory: fromDirectory } = options;
          if (!to || !from) {
            throw Error("Both to and from must be provided");
          }
          if (!toDirectory) {
            toDirectory = fromDirectory;
          }
          const fromPath = this.getPath(fromDirectory, from);
          const toPath = this.getPath(toDirectory, to);
          if (fromPath === toPath) {
            return {
              uri: toPath
            };
          }
          if (isPathParent(fromPath, toPath)) {
            throw Error("To path cannot contain the from path");
          }
          let toObj;
          try {
            toObj = await this.stat({
              path: to,
              directory: toDirectory
            });
          } catch (e) {
            const toPathComponents = to.split("/");
            toPathComponents.pop();
            const toPath2 = toPathComponents.join("/");
            if (toPathComponents.length > 0) {
              const toParentDirectory = await this.stat({
                path: toPath2,
                directory: toDirectory
              });
              if (toParentDirectory.type !== "directory") {
                throw new Error("Parent directory of the to path is a file");
              }
            }
          }
          if (toObj && toObj.type === "directory") {
            throw new Error("Cannot overwrite a directory with a file");
          }
          const fromObj = await this.stat({
            path: from,
            directory: fromDirectory
          });
          const updateTime = async (path, ctime2, mtime) => {
            const fullPath = this.getPath(toDirectory, path);
            const entry = await this.dbRequest("get", [fullPath]);
            entry.ctime = ctime2;
            entry.mtime = mtime;
            await this.dbRequest("put", [entry]);
          };
          const ctime = fromObj.ctime ? fromObj.ctime : Date.now();
          switch (fromObj.type) {
            // The "from" object is a file
            case "file": {
              const file = await this.readFile({
                path: from,
                directory: fromDirectory
              });
              if (doRename) {
                await this.deleteFile({
                  path: from,
                  directory: fromDirectory
                });
              }
              let encoding;
              if (!(file.data instanceof Blob) && !this.isBase64String(file.data)) {
                encoding = Encoding.UTF8;
              }
              const writeResult = await this.writeFile({
                path: to,
                directory: toDirectory,
                data: file.data,
                encoding
              });
              if (doRename) {
                await updateTime(to, ctime, fromObj.mtime);
              }
              return writeResult;
            }
            case "directory": {
              if (toObj) {
                throw Error("Cannot move a directory over an existing object");
              }
              try {
                await this.mkdir({
                  path: to,
                  directory: toDirectory,
                  recursive: false
                });
                if (doRename) {
                  await updateTime(to, ctime, fromObj.mtime);
                }
              } catch (e) {
              }
              const contents = (await this.readdir({
                path: from,
                directory: fromDirectory
              })).files;
              for (const filename of contents) {
                await this._copy({
                  from: `${from}/${filename.name}`,
                  to: `${to}/${filename.name}`,
                  directory: fromDirectory,
                  toDirectory
                }, doRename);
              }
              if (doRename) {
                await this.rmdir({
                  path: from,
                  directory: fromDirectory
                });
              }
            }
          }
          return {
            uri: toPath
          };
        }
        isBase64String(str) {
          try {
            return btoa(atob(str)) == str;
          } catch (err) {
            return false;
          }
        }
      };
      FilesystemWeb._debug = true;
    }
  });

  // node_modules/@capacitor/share/dist/esm/web.js
  var web_exports2 = {};
  __export(web_exports2, {
    ShareWeb: () => ShareWeb
  });
  var ShareWeb;
  var init_web2 = __esm({
    "node_modules/@capacitor/share/dist/esm/web.js"() {
      init_dist();
      ShareWeb = class extends WebPlugin {
        async canShare() {
          if (typeof navigator === "undefined" || !navigator.share) {
            return { value: false };
          } else {
            return { value: true };
          }
        }
        async share(options) {
          if (typeof navigator === "undefined" || !navigator.share) {
            throw this.unavailable("Share API not available in this browser");
          }
          await navigator.share({
            title: options.title,
            text: options.text,
            url: options.url
          });
          return {};
        }
      };
    }
  });

  // app-entry.js
  init_dist();

  // node_modules/@capacitor/filesystem/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor/synapse/dist/synapse.mjs
  function s(t) {
    t.CapacitorUtils.Synapse = new Proxy(
      {},
      {
        get(e, n) {
          return new Proxy({}, {
            get(w, o) {
              return (c, p, r) => {
                const i = t.Capacitor.Plugins[n];
                if (i === void 0) {
                  r(new Error(`Capacitor plugin ${n} not found`));
                  return;
                }
                if (typeof i[o] != "function") {
                  r(new Error(`Method ${o} not found in Capacitor plugin ${n}`));
                  return;
                }
                (async () => {
                  try {
                    const a = await i[o](c);
                    p(a);
                  } catch (a) {
                    r(a);
                  }
                })();
              };
            }
          });
        }
      }
    );
  }
  function u(t) {
    t.CapacitorUtils.Synapse = new Proxy(
      {},
      {
        get(e, n) {
          return t.cordova.plugins[n];
        }
      }
    );
  }
  function f(t = false) {
    typeof window > "u" || (window.CapacitorUtils = window.CapacitorUtils || {}, window.Capacitor !== void 0 && !t ? s(window) : window.cordova !== void 0 && u(window));
  }

  // node_modules/@capacitor/filesystem/dist/esm/index.js
  init_definitions();
  var Filesystem = registerPlugin("Filesystem", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.FilesystemWeb())
  });
  f();

  // node_modules/@capacitor/share/dist/esm/index.js
  init_dist();
  var Share = registerPlugin("Share", {
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.ShareWeb())
  });

  // www/model.mjs
  var VERSION = 2;
  var COIN_VALUE = 500;
  var MAX_COINS = 1e6;
  var MAX_GOAL = 5e8;
  var MAX_ARCHIVES = 500;
  var MAX_ALL_ENTRIES = 1e5;
  var idPattern = /^[A-Za-z0-9_-]{8,70}$/;
  var isoDate = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));
  var generateId = () => globalThis.crypto?.randomUUID?.() ?? "cycle" + Date.now() + Math.random().toString(36).slice(2);
  function newState(goal = 5e4, sound = true) {
    return validateState({ version: VERSION, goal, entries: [], sound, archives: [] });
  }
  function checkEntries(entries, seen) {
    if (!Array.isArray(entries)) throw new Error("\u8CAF\u91D1\u306E\u8A18\u9332\u4EF6\u6570\u304C\u4E0D\u6B63\u3067\u3059");
    let coins = 0;
    const normalized = [];
    for (const item of entries) {
      if (!item || typeof item !== "object" || !Number.isSafeInteger(item.change) || ![-1, 1].includes(item.change) || typeof item.id !== "string" || !idPattern.test(item.id) || !isoDate(item.at) || seen.has(item.id)) throw new Error("\u8CAF\u91D1\u306E\u8A18\u9332\u306B\u4E0D\u6B63\u304C\u3042\u308A\u307E\u3059");
      seen.add(item.id);
      coins += item.change;
      if (coins < 0 || coins > MAX_COINS) throw new Error("\u8CAF\u91D1\u6B8B\u9AD8\u304C\u4E0D\u6B63\u3067\u3059");
      normalized.push({ id: item.id, at: item.at, change: item.change });
    }
    return { entries: normalized, coins };
  }
  function checkGoal(goal) {
    if (!Number.isSafeInteger(goal) || goal < COIN_VALUE || goal > MAX_GOAL || goal % COIN_VALUE !== 0)
      throw new Error("\u76EE\u6A19\u91D1\u984D\u304C\u4E0D\u6B63\u3067\u3059");
  }
  function balanceCoins(state2) {
    return state2.entries.reduce((n, item) => n + item.change, 0);
  }
  function stats(state2) {
    const coins = balanceCoins(state2), yen2 = coins * COIN_VALUE;
    return {
      coins,
      yen: yen2,
      goal: state2.goal,
      remainingYen: Math.max(0, state2.goal - yen2),
      remainingCoins: Math.ceil(Math.max(0, state2.goal - yen2) / COIN_VALUE),
      progress: Math.min(100, Math.round(yen2 / state2.goal * 100)),
      reached: yen2 >= state2.goal
    };
  }
  function validateState(input) {
    if (!input || typeof input !== "object" || input.version !== VERSION) throw new Error("\u4FDD\u5B58\u30C7\u30FC\u30BF\u306E\u30D0\u30FC\u30B8\u30E7\u30F3\u304C\u7570\u306A\u308A\u307E\u3059");
    checkGoal(input.goal);
    if (typeof input.sound !== "boolean") throw new Error("\u8A2D\u5B9A\u5024\u304C\u4E0D\u6B63\u3067\u3059");
    if (!Array.isArray(input.archives) || input.archives.length > MAX_ARCHIVES) throw new Error("\u904E\u53BB\u306E\u8CAF\u91D1\u4EF6\u6570\u304C\u4E0D\u6B63\u3067\u3059");
    const seen = /* @__PURE__ */ new Set(), cycleIds = /* @__PURE__ */ new Set();
    const current = checkEntries(input.entries, seen);
    const archives = input.archives.map((a) => {
      if (!a || typeof a !== "object" || typeof a.id !== "string" || !idPattern.test(a.id) || cycleIds.has(a.id) || !isoDate(a.endedAt))
        throw new Error("\u904E\u53BB\u306E\u8CAF\u91D1\u60C5\u5831\u304C\u4E0D\u6B63\u3067\u3059");
      cycleIds.add(a.id);
      checkGoal(a.goal);
      const checked = checkEntries(a.entries, seen);
      if (checked.entries.length === 0) throw new Error("\u7A7A\u306E\u8CAF\u91D1\u5C65\u6B74\u306F\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093");
      return { id: a.id, endedAt: a.endedAt, goal: a.goal, entries: checked.entries };
    });
    const count = current.entries.length + archives.reduce((n, a) => n + a.entries.length, 0);
    if (count > MAX_ALL_ENTRIES) throw new Error("\u8CAF\u91D1\u8A18\u9332\u306E\u4E0A\u9650\u3092\u8D85\u3048\u307E\u3057\u305F");
    return { version: VERSION, goal: input.goal, sound: input.sound, entries: current.entries, archives };
  }
  function record(state2, change, id = generateId(), at = (/* @__PURE__ */ new Date()).toISOString()) {
    if (![-1, 1].includes(change)) throw new Error("\u5909\u66F4\u679A\u6570\u304C\u4E0D\u6B63\u3067\u3059");
    const n = balanceCoins(state2) + change;
    if (n < 0) throw new Error("\u53D6\u308A\u51FA\u305B\u308B500\u5186\u7389\u304C\u3042\u308A\u307E\u305B\u3093");
    if (n > MAX_COINS) throw new Error("\u8A18\u9332\u306E\u4E0A\u9650\u3092\u8D85\u3048\u307E\u3057\u305F");
    return validateState({ ...state2, entries: [...state2.entries, { id, at, change }] });
  }
  function undo(state2) {
    if (state2.entries.length === 0) throw new Error("\u53D6\u308A\u6D88\u3059\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093");
    return validateState({ ...state2, entries: state2.entries.slice(0, -1) });
  }
  function setGoal(state2, yen2) {
    return validateState({ ...state2, goal: yen2 });
  }
  function setSound(state2, enabled) {
    return validateState({ ...state2, sound: Boolean(enabled) });
  }
  function startNewCycle(state2, id = generateId(), endedAt = (/* @__PURE__ */ new Date()).toISOString()) {
    const before = validateState(state2);
    if (before.entries.length === 0) throw new Error("\u307E\u3060\u8CAF\u91D1\u306E\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093");
    return validateState({
      ...before,
      entries: [],
      archives: [...before.archives, { id, endedAt, goal: before.goal, entries: before.entries }]
    });
  }
  function archiveStats(archive) {
    const coins = archive.entries.reduce((n, x) => n + x.change, 0);
    const yen2 = coins * COIN_VALUE;
    return { coins, yen: yen2, goal: archive.goal, reached: yen2 >= archive.goal, endedAt: archive.endedAt };
  }
  function migrateLegacy(input) {
    if (!input || typeof input !== "object" || input.version !== 1) return input;
    if ("archives" in input) throw new Error("\u65E7\u5F62\u5F0F\u306E\u30C7\u30FC\u30BF\u306B\u4E0D\u6B63\u304C\u3042\u308A\u307E\u3059");
    return { version: VERSION, goal: input.goal, sound: input.sound, entries: input.entries, archives: [] };
  }
  function fromJson(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("JSON\u30D5\u30A1\u30A4\u30EB\u3092\u8AAD\u307F\u53D6\u308C\u307E\u305B\u3093");
    }
    return validateState(migrateLegacy(parsed));
  }
  function toJson(state2) {
    return JSON.stringify(validateState(state2), null, 2);
  }

  // app-entry.js
  var STORAGE_KEY = "coinjar500.state.v1";
  var SOUND_STYLE_KEY = "coinjar500.soundStyle.v1";
  var SOUND_STYLES = /* @__PURE__ */ new Set(["original", "drop", "stack"]);
  var NORMAL_PIG = "./assets/piggy-body-neutral.webp";
  var HAPPY_PIG = "./assets/piggy-body.webp";
  var SAD_PIG = "./assets/piggy-body-sad.webp";
  var CELEBRATE_PIG = "./assets/piggy-body-celebrate.webp";
  var soundStyle = localStorage.getItem(SOUND_STYLE_KEY) ?? "original";
  if (!SOUND_STYLES.has(soundStyle)) throw new Error("\u4E0D\u6B63\u306A\u52B9\u679C\u97F3\u8A2D\u5B9A\u304C\u4FDD\u5B58\u3055\u308C\u3066\u3044\u307E\u3059");
  var native = Capacitor.isNativePlatform();
  var $ = (id) => document.getElementById(id);
  var yen = (n) => n.toLocaleString("ja-JP") + "\u5186";
  var toastTimer = 0;
  var actionToastTimer = 0;
  var animationTimer = 0;
  var state = null;
  var locked = false;
  function openDialog(which) {
    $(which + "-dialog").hidden = false;
    document.body.style.overflow = "hidden";
    if (which === "goal") {
      $("goal-input").value = String(state.goal);
      $("goal-input").focus();
    }
    if (which === "archives") renderArchives();
  }
  function closeDialog(which) {
    $(which + "-dialog").hidden = true;
    document.body.style.overflow = "";
  }
  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("visible"), 2400);
  }
  function actionToast(message) {
    const el = $("action-toast");
    el.textContent = message;
    el.classList.remove("visible");
    void el.offsetWidth;
    el.classList.add("visible");
    clearTimeout(actionToastTimer);
    actionToastTimer = setTimeout(() => el.classList.remove("visible"), 1550);
  }
  function initState() {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text === null) {
      state = newState();
      localStorage.setItem(STORAGE_KEY, toJson(state));
      return;
    }
    try {
      state = fromJson(text);
    } catch (e) {
      locked = true;
      state = newState();
      setTimeout(() => {
        toast("\u4FDD\u5B58\u30C7\u30FC\u30BF\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002\u8A2D\u5B9A\u304B\u3089\u5FA9\u5143\u3057\u3066\u304F\u3060\u3055\u3044");
        alert("\u4FDD\u5B58\u30C7\u30FC\u30BF\u306B\u554F\u984C\u304C\u3042\u308A\u307E\u3059\u3002\u4E0A\u66F8\u304D\u3057\u306A\u3044\u305F\u3081\u3001\u8CAF\u91D1\u64CD\u4F5C\u3092\u505C\u6B62\u3057\u3066\u3044\u307E\u3059\u3002\u8A2D\u5B9A\u304B\u3089\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u3092\u5FA9\u5143\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n" + e.message);
      }, 180);
    }
  }
  function save(next) {
    if (locked) throw new Error("\u4FDD\u5B58\u30C7\u30FC\u30BF\u3092\u5FA9\u5143\u3059\u308B\u307E\u3067\u5909\u66F4\u3067\u304D\u307E\u305B\u3093");
    const valid = validateState(next);
    localStorage.setItem(STORAGE_KEY, toJson(valid));
    state = valid;
  }
  function playOriginal(pitch = 1) {
    const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextImpl) return;
    const context = new AudioContextImpl();
    const osc = context.createOscillator(), gain = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(760 * pitch, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1180 * pitch, context.currentTime + 0.09);
    gain.gain.setValueAtTime(1e-4, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(1e-4, context.currentTime + 0.18);
    osc.connect(gain).connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.18);
    osc.onended = () => {
      void context.close();
    };
  }
  function playCoinSound(kind = "deposit", style = soundStyle, force = false) {
    if (!state?.sound && !force) return;
    try {
      if (style === "original") {
        playOriginal(kind === "withdraw" ? 0.72 : 1);
        return;
      }
      const file = kind === "withdraw" ? "coin-withdraw.wav" : style === "drop" ? "coin-drop.wav" : "coin-stack.wav";
      const audio = new Audio("./assets/" + file);
      audio.volume = 0.82;
      void audio.play().catch((e) => console.warn("Audio playback unavailable", e));
    } catch (e) {
      console.warn("Audio playback unavailable", e);
    }
  }
  function animatePig(kind) {
    const stage = $("art-stage");
    const image = $("piggy-art");
    clearTimeout(animationTimer);
    stage.classList.remove("action-deposit", "action-withdraw", "action-celebrate");
    image.src = kind === "withdraw" ? SAD_PIG : kind === "celebrate" ? CELEBRATE_PIG : HAPPY_PIG;
    void stage.offsetWidth;
    stage.classList.add("action-" + kind);
    animationTimer = setTimeout(() => {
      stage.classList.remove("action-deposit", "action-withdraw", "action-celebrate");
      image.src = NORMAL_PIG;
    }, kind === "celebrate" ? 1780 : kind === "withdraw" ? 1290 : 1180);
  }
  for (const src of [NORMAL_PIG, HAPPY_PIG, SAD_PIG, CELEBRATE_PIG]) {
    const preload = new Image();
    preload.src = src;
  }
  function updateSoundPicker() {
    for (const input of document.querySelectorAll('input[name="coin-sound"]')) {
      input.checked = input.value === soundStyle;
    }
    $("sound-picker").classList.toggle("is-muted", !state?.sound);
  }
  function renderHistory() {
    const list = $("history-list");
    list.replaceChildren();
    list.parentElement.querySelector(".history-more")?.remove();
    const entries = state.entries.slice(-8).reverse();
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "empty-history";
      empty.textContent = "\u306F\u3058\u3081\u306E500\u5186\u7389\u3092\u5165\u308C\u3066\u307F\u3088\u3046\uFF01";
      list.append(empty);
      return;
    }
    for (const entry of entries) {
      const row = document.createElement("div");
      row.className = "history-item";
      const symbol = document.createElement("div");
      symbol.className = "history-symbol" + (entry.change === -1 ? " out" : "");
      symbol.textContent = entry.change > 0 ? "+" : "\u2212";
      const caption = document.createElement("div");
      caption.className = "history-desc";
      caption.textContent = entry.change > 0 ? "500\u5186\u7389\u3092\u8CAF\u91D1" : "500\u5186\u7389\u3092\u53D6\u308A\u51FA\u3057";
      const date = document.createElement("div");
      date.className = "history-date";
      date.textContent = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(entry.at));
      caption.append(date);
      const sum = document.createElement("span");
      sum.className = "history-value" + (entry.change < 0 ? " out" : "");
      sum.textContent = (entry.change > 0 ? "+" : "\u2212") + "500\u5186";
      row.append(symbol, caption, sum);
      list.append(row);
    }
    if (state.entries.length > 8) {
      const more = document.createElement("span");
      more.className = "history-more";
      more.textContent = "\u6700\u8FD1\u306E8\u4EF6\u3092\u8868\u793A\u3057\u3066\u3044\u307E\u3059";
      list.after(more);
    } else {
      list.parentElement.querySelector(".history-more")?.remove();
    }
  }
  function renderArchives() {
    const list = $("archives-list");
    list.replaceChildren();
    if (state.archives.length === 0) {
      const empty = document.createElement("p");
      empty.className = "archive-empty";
      empty.textContent = "\u904E\u53BB\u306E\u8CAF\u91D1\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002";
      list.append(empty);
      return;
    }
    for (const cycle of [...state.archives].reverse()) {
      const a = archiveStats(cycle);
      const item = document.createElement("div");
      item.className = "archive-item";
      const title = document.createElement("strong");
      title.textContent = (a.reached ? "\u2713 \u76EE\u6A19\u9054\u6210\uFF01" : "\u9014\u4E2D\u3067\u7D42\u4E86") + "\u3000" + yen(a.yen);
      const meta = document.createElement("small");
      meta.textContent = "\u76EE\u6A19 " + yen(a.goal) + " \u30FB " + new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(new Date(a.endedAt)) + " \u30FB " + cycle.entries.length + "\u4EF6\u306E\u8A18\u9332";
      item.append(title, meta);
      list.append(item);
    }
  }
  function beginNewSavings() {
    try {
      if (locked) throw new Error("\u4FDD\u5B58\u30C7\u30FC\u30BF\u3092\u5FA9\u5143\u3057\u3066\u304F\u3060\u3055\u3044");
      if (state.entries.length === 0) {
        toast("\u307E\u3060\u8CAF\u91D1\u306E\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093");
        return;
      }
      const a = stats(state);
      const msg = "\u4ECA\u306E\u8CAF\u91D1\uFF08" + yen(a.yen) + "\uFF0F\u76EE\u6A19 " + yen(a.goal) + "\uFF09\u3092\u300C\u3053\u308C\u307E\u3067\u306E\u8CAF\u91D1\u300D\u306B\u4FDD\u5B58\u3057\u3066\u30010\u5186\u304B\u3089\u65B0\u3057\u304F\u59CB\u3081\u307E\u3059\u3002\n\n\u4EE5\u524D\u306E\u8A18\u9332\u306F\u8A2D\u5B9A\u304B\u3089\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002\u7D9A\u3051\u307E\u3059\u304B\uFF1F";
      if (!confirm(msg)) return;
      save(startNewCycle(state));
      $("art-stage").classList.remove("action-deposit", "action-withdraw", "action-celebrate");
      clearTimeout(animationTimer);
      $("piggy-art").src = NORMAL_PIG;
      $("history-panel").open = false;
      closeDialog("settings");
      render();
      toast("\u65B0\u3057\u3044\u8CAF\u91D1\u3092\u59CB\u3081\u307E\u3057\u305F\uFF01");
    } catch (e) {
      toast(e.message);
      console.error("Begin new savings", e);
    }
  }
  function render() {
    const s2 = stats(state);
    $("total-amount").textContent = s2.yen.toLocaleString("ja-JP");
    $("coin-count").textContent = "500\u5186\u7389 " + s2.coins.toLocaleString("ja-JP") + "\u679A";
    $("remaining-amount").textContent = s2.reached ? "\u76EE\u6A19\u9054\u6210\uFF01" : yen(s2.remainingYen);
    $("goal-amount").textContent = "\u76EE\u6A19 " + yen(state.goal);
    $("progress-percent").textContent = s2.progress + "%";
    $("progress-track").setAttribute("aria-valuenow", String(s2.progress));
    $("progress-fill").style.width = s2.progress + "%";
    $("start-again").hidden = !s2.reached || locked;
    $("reset-savings").disabled = state.entries.length === 0 || locked;
    $("archive-count").textContent = state.archives.length + "\u56DE \u203A";
    $("withdraw").disabled = s2.coins === 0 || locked;
    $("undo").disabled = state.entries.length === 0 || locked;
    $("deposit").disabled = locked;
    $("sound-toggle").checked = state.sound;
    updateSoundPicker();
    renderHistory();
  }
  function transact(change) {
    try {
      const before = stats(state);
      save(record(state, change));
      render();
      if (change === 1) {
        const reachedNow = !before.reached && stats(state).reached;
        playCoinSound("deposit");
        animatePig(reachedNow ? "celebrate" : "deposit");
        actionToast(reachedNow ? "\u304A\u3081\u3067\u3068\u3046\uFF01\u76EE\u6A19\u9054\u6210 \u2728" : "500\u5186\u3001\u3053\u3064\u3053\u3064\u8CAF\u91D1\uFF01");
        window.coinJarMonetization?.recordDeposit?.();
      } else {
        playCoinSound("withdraw");
        animatePig("withdraw");
        actionToast("500\u5186\u3092\u53D6\u308A\u51FA\u3057\u307E\u3057\u305F");
      }
    } catch (e) {
      toast(e.message);
      console.error("Transaction failed", e);
    }
  }
  $("history-panel").addEventListener("toggle", () => {
    const panel = $("history-panel");
    if (!panel.open || !document.documentElement.classList.contains("native-ad-visible")) return;
    requestAnimationFrame(() => {
      const rect = panel.getBoundingClientRect();
      const safeBottom = window.innerHeight - 110;
      const desiredTop = Math.max(88, safeBottom - Math.min(rect.height, 320));
      const scrollBy = Math.max(0, rect.top - desiredTop);
      if (scrollBy > 12) window.scrollBy({ top: scrollBy, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  });
  $("deposit").addEventListener("click", () => transact(1));
  $("withdraw").addEventListener("click", () => transact(-1));
  $("undo").addEventListener("click", () => {
    try {
      save(undo(state));
      render();
      toast("\u76F4\u524D\u306E\u8A18\u9332\u3092\u623B\u3057\u307E\u3057\u305F");
    } catch (e) {
      toast(e.message);
    }
  });
  $("open-settings").addEventListener("click", () => openDialog("settings"));
  $("change-goal").addEventListener("click", () => openDialog("goal"));
  $("start-again").addEventListener("click", beginNewSavings);
  $("reset-savings").addEventListener("click", beginNewSavings);
  $("archive-open").addEventListener("click", () => {
    closeDialog("settings");
    openDialog("archives");
  });
  document.querySelectorAll("[data-close]").forEach((x) => x.addEventListener("click", () => closeDialog(x.dataset.close)));
  document.querySelectorAll("[data-goal]").forEach((x) => x.addEventListener("click", () => {
    $("goal-input").value = x.dataset.goal;
  }));
  $("save-goal").addEventListener("click", () => {
    const amount = Number($("goal-input").value);
    if (!Number.isSafeInteger(amount) || amount % 500 !== 0 || amount < 500 || amount > 5e8) {
      toast("500\u5186\u5358\u4F4D\u3067\u76EE\u6A19\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
      return;
    }
    try {
      save(setGoal(state, amount));
      render();
      closeDialog("goal");
      toast("\u76EE\u6A19\u91D1\u984D\u3092\u5909\u66F4\u3057\u307E\u3057\u305F");
    } catch (e) {
      toast(e.message);
    }
  });
  $("sound-toggle").addEventListener("change", (e) => {
    try {
      save(setSound(state, e.target.checked));
      render();
    } catch (err) {
      toast(err.message);
      render();
    }
  });
  document.querySelectorAll('input[name="coin-sound"]').forEach((input) => input.addEventListener("change", () => {
    if (!SOUND_STYLES.has(input.value)) throw new Error("\u4E0D\u660E\u306A\u52B9\u679C\u97F3");
    localStorage.setItem(SOUND_STYLE_KEY, input.value);
    soundStyle = input.value;
    updateSoundPicker();
    playCoinSound("deposit", soundStyle, true);
  }));
  document.querySelectorAll("[data-preview]").forEach((button) => button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    playCoinSound("deposit", button.dataset.preview, true);
  }));
  $("export").addEventListener("click", async () => {
    try {
      if (locked) throw new Error("\u4FDD\u5B58\u30C7\u30FC\u30BF\u3092\u5FA9\u5143\u3057\u3066\u304F\u3060\u3055\u3044");
      const data = toJson(state);
      if (native) {
        await Filesystem.writeFile({ path: "coinjar500-backup.json", data, directory: Directory.Cache, encoding: Encoding.UTF8 });
        const uri = await Filesystem.getUri({ path: "coinjar500-backup.json", directory: Directory.Cache });
        await Share.share({ title: "\u3053\u3064\u3053\u3064500\u5186\u8CAF\u91D1\u306E\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7", url: uri.uri, dialogTitle: "\u8A18\u9332\u30D5\u30A1\u30A4\u30EB\u3092\u4FDD\u5B58" });
      } else {
        const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "coinjar500-backup.json";
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 2e3);
      }
      toast("\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u3092\u6E96\u5099\u3057\u307E\u3057\u305F");
    } catch (e) {
      console.error(e);
      toast("\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\uFF1A" + e.message);
    }
  });
  $("import").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 5e6) throw new Error("\u30D5\u30A1\u30A4\u30EB\u304C\u5927\u304D\u3059\u304E\u307E\u3059");
      const validated = fromJson(await file.text());
      if (!confirm("\u73FE\u5728\u306E\u8CAF\u91D1\u8A18\u9332\u3092\u3001\u9078\u3093\u3060\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u3067\u7F6E\u304D\u63DB\u3048\u307E\u3059\u3002\u3088\u308D\u3057\u3044\u3067\u3059\u304B\uFF1F")) return;
      localStorage.setItem(STORAGE_KEY, toJson(validated));
      state = validated;
      locked = false;
      render();
      closeDialog("settings");
      toast("\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u3092\u5FA9\u5143\u3057\u307E\u3057\u305F");
    } catch (err) {
      toast("\u5FA9\u5143\u3067\u304D\u307E\u305B\u3093\uFF1A" + err.message);
    }
  });
  $("ad-privacy-options").addEventListener("click", () => window.coinJarMonetization?.privacyOptions?.() ?? toast("iPhone\u30A2\u30D7\u30EA\u3067\u8A2D\u5B9A\u3067\u304D\u307E\u3059"));
  $("privacy-info").addEventListener("click", () => {
    closeDialog("settings");
    openDialog("privacy");
  });
  $("purchase").addEventListener("click", () => window.coinJarMonetization?.purchase?.() ?? toast("\u30A2\u30D7\u30EA\u5185\u3067\u8CFC\u5165\u3067\u304D\u307E\u3059"));
  $("restore-purchase").addEventListener("click", () => window.coinJarMonetization?.restore?.() ?? toast("iPhone\u30A2\u30D7\u30EA\u3067\u5FA9\u5143\u3067\u304D\u307E\u3059"));
  function syncPurchaseUI() {
    const state2 = window.coinJarMonetization?.status?.() || "web-preview";
    $("purchase-status").textContent = {
      "purchased": "\u5E83\u544A\u524A\u9664\u306F\u8CFC\u5165\u6E08\u307F\u3067\u3059",
      "ready": "\u8CFC\u5165\u53EF\u80FD\u3067\u3059",
      "available": "\u8CFC\u5165\u53EF\u80FD\u3067\u3059",
      "loading": "App Store\u306B\u63A5\u7D9A\u3057\u3066\u3044\u307E\u3059",
      "web-preview": "\u5E83\u544A\u524A\u9664\u306FiPhone\u7248\u3067\u8CFC\u5165\u3067\u304D\u307E\u3059",
      "blocked": "\u5E83\u544A\u524A\u9664\u306E\u8CB7\u3044\u5207\u308A\u306F\u6E96\u5099\u4E2D\u3067\u3059\uFF08\u5E83\u544A\u30C6\u30B9\u30C8\u7248\uFF09"
    }[state2] ?? (state2.startsWith("error: ") ? "App Store\u63A5\u7D9A\u30A8\u30E9\u30FC: " + state2.slice(7) : "\u5546\u54C1\u60C5\u5831\u3092\u78BA\u8A8D\u4E2D\u3067\u3059");
    $("purchase").disabled = state2 === "purchased" || state2 === "blocked";
    $("restore-purchase").disabled = state2 === "blocked";
    const adDebug = $("ad-test-status");
    if (adDebug) adDebug.textContent = window.coinJarMonetization?.adStatus?.() || "\u5E83\u544A\u72B6\u614B\u3092\u78BA\u8A8D\u4E2D";
    $("purchase").textContent = state2 === "purchased" ? "\u2713 \u5E83\u544A\u306F\u975E\u8868\u793A\u3067\u3059" : state2 === "blocked" ? "\u8CB7\u3044\u5207\u308A\u306F\u6E96\u5099\u4E2D" : "\u2726 \u5E83\u544A\u3092\u6C38\u4E45\u306B\u524A\u9664\uFF08480\u5186\uFF09";
  }
  window.addEventListener("coinjar-monetization-updated", syncPurchaseUI);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      for (const name of ["goal", "settings", "archives", "privacy"]) if (!$(name + "-dialog").hidden) closeDialog(name);
    }
  });
  try {
    initState();
    render();
    syncPurchaseUI();
  } catch (e) {
    console.error(e);
    alert("\u30A2\u30D7\u30EA\u306E\u4FDD\u5B58\u9818\u57DF\u3092\u4F7F\u7528\u3067\u304D\u307E\u305B\u3093\u3002\u7AEF\u672B\u306E\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    $("deposit").disabled = true;
  }
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
