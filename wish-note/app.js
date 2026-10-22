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

  // node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js
  var AdmobConsentStatus;
  var init_consent_status_enum = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js"() {
      (function(AdmobConsentStatus2) {
        AdmobConsentStatus2["NOT_REQUIRED"] = "NOT_REQUIRED";
        AdmobConsentStatus2["OBTAINED"] = "OBTAINED";
        AdmobConsentStatus2["REQUIRED"] = "REQUIRED";
        AdmobConsentStatus2["UNKNOWN"] = "UNKNOWN";
      })(AdmobConsentStatus || (AdmobConsentStatus = {}));
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/consent/privacy-options-requirement-status.enum.js
  var PrivacyOptionsRequirementStatus;
  var init_privacy_options_requirement_status_enum = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/consent/privacy-options-requirement-status.enum.js"() {
      (function(PrivacyOptionsRequirementStatus2) {
        PrivacyOptionsRequirementStatus2["NOT_REQUIRED"] = "NOT_REQUIRED";
        PrivacyOptionsRequirementStatus2["REQUIRED"] = "REQUIRED";
        PrivacyOptionsRequirementStatus2["UNKNOWN"] = "UNKNOWN";
      })(PrivacyOptionsRequirementStatus || (PrivacyOptionsRequirementStatus = {}));
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    AdMobWeb: () => AdMobWeb
  });
  var AdMobWeb;
  var init_web = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/web.js"() {
      init_dist();
      init_consent_status_enum();
      init_privacy_options_requirement_status_enum();
      AdMobWeb = class extends WebPlugin {
        async initialize() {
          console.log("initialize");
        }
        async requestTrackingAuthorization() {
          console.log("requestTrackingAuthorization");
        }
        async trackingAuthorizationStatus() {
          return {
            status: "authorized"
          };
        }
        async requestConsentInfo(options) {
          console.log("requestConsentInfo", options);
          return {
            status: AdmobConsentStatus.REQUIRED,
            isConsentFormAvailable: true,
            canRequestAds: true,
            privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED
          };
        }
        async showPrivacyOptionsForm() {
          console.log("showPrivacyOptionsForm");
        }
        async showConsentForm() {
          console.log("showConsentForm");
          return {
            status: AdmobConsentStatus.REQUIRED,
            canRequestAds: true,
            privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED
          };
        }
        async resetConsentInfo() {
          console.log("resetConsentInfo");
        }
        async setApplicationMuted(options) {
          console.log("setApplicationMuted", options);
        }
        async setApplicationVolume(options) {
          console.log("setApplicationVolume", options);
        }
        async showBanner(options) {
          console.log("showBanner", options);
        }
        async hideBanner() {
          console.log("hideBanner");
        }
        async resumeBanner() {
          console.log("resumeBanner");
        }
        async removeBanner() {
          console.log("removeBanner");
        }
        async startNativeAdFeed() {
          throw new Error("Native ads are only available on iOS and Android");
        }
        async destroyNativeAdFeed(options) {
          console.log("destroyNativeAdFeed", options);
        }
        async loadNativeAd() {
          throw new Error("Native ads are only available on iOS and Android");
        }
        async updateNativeAdPlacements(options) {
          console.log("updateNativeAdPlacements", options);
        }
        async removeNativeAd(options) {
          console.log("removeNativeAd", options);
        }
        async prepareInterstitial(options) {
          console.log("prepareInterstitial", options);
          return {
            adUnitId: options.adId
          };
        }
        async showInterstitial(options) {
          console.log("showInterstitial", options);
        }
        async prepareRewardVideoAd(options) {
          console.log("prepareRewardVideoAd", options);
          return {
            adUnitId: options.adId
          };
        }
        async showRewardVideoAd(options) {
          console.log("showRewardVideoAd", options);
          return {
            type: "",
            amount: 0
          };
        }
        async prepareRewardInterstitialAd(options) {
          console.log("prepareRewardInterstitialAd", options);
          return {
            adUnitId: options.adId
          };
        }
        async showRewardInterstitialAd(options) {
          console.log("showRewardInterstitialAd", options);
          return {
            type: "",
            amount: 0
          };
        }
        async loadAppOpen(options) {
          console.log("loadAppOpen", options);
          return {
            adUnitId: options.adId
          };
        }
        async showAppOpen(options) {
          console.log("showAppOpen", options);
        }
        async isAppOpenLoaded() {
          return { value: false };
        }
        addListener(eventName, listenerFunc) {
          void listenerFunc;
          console.log("addListener", eventName);
          return Promise.resolve({ remove: () => Promise.resolve() });
        }
      };
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
  var web_exports2 = {};
  __export(web_exports2, {
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
  var init_web2 = __esm({
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
              const store2 = db.createObjectStore("FileStorage", { keyPath: "path" });
              store2.createIndex("by_folder", "folder");
            }
          }
        }
        async dbRequest(cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store2 = tx.objectStore("FileStorage");
              const req = store2[cmd](...args);
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
              const store2 = tx.objectStore("FileStorage");
              const index = store2.index(indexName);
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
          const store2 = tx.objectStore("FileStorage");
          store2.clear();
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

  // node_modules/@capacitor/local-notifications/dist/esm/web.js
  var web_exports3 = {};
  __export(web_exports3, {
    LocalNotificationsWeb: () => LocalNotificationsWeb
  });
  var LocalNotificationsWeb;
  var init_web3 = __esm({
    "node_modules/@capacitor/local-notifications/dist/esm/web.js"() {
      init_dist();
      LocalNotificationsWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.pending = [];
          this.deliveredNotifications = [];
          this.hasNotificationSupport = () => {
            if (!("Notification" in window) || !Notification.requestPermission) {
              return false;
            }
            if (Notification.permission !== "granted") {
              try {
                new Notification("");
              } catch (e) {
                if (e instanceof Error && e.name === "TypeError") {
                  return false;
                }
              }
            }
            return true;
          };
        }
        async getDeliveredNotifications() {
          const deliveredSchemas = [];
          for (const notification of this.deliveredNotifications) {
            const deliveredSchema = {
              title: notification.title,
              id: parseInt(notification.tag),
              body: notification.body
            };
            deliveredSchemas.push(deliveredSchema);
          }
          return {
            notifications: deliveredSchemas
          };
        }
        async removeDeliveredNotifications(delivered) {
          for (const toRemove of delivered.notifications) {
            const found = this.deliveredNotifications.find((n) => n.tag === String(toRemove.id));
            found === null || found === void 0 ? void 0 : found.close();
            this.deliveredNotifications = this.deliveredNotifications.filter(() => !found);
          }
        }
        async removeDeliveredNotificationsById(options) {
          for (const id of options.ids) {
            const found = this.deliveredNotifications.find((n) => n.tag === String(id));
            found === null || found === void 0 ? void 0 : found.close();
            this.deliveredNotifications = this.deliveredNotifications.filter((n) => n !== found);
          }
        }
        async removeAllDeliveredNotifications() {
          for (const notification of this.deliveredNotifications) {
            notification.close();
          }
          this.deliveredNotifications = [];
        }
        async getByIds(options) {
          const ids = options.ids.map((id) => String(id));
          const scheduled = this.pending.filter((n) => ids.includes(String(n.id)));
          const delivered = this.deliveredNotifications.filter((n) => ids.includes(n.tag)).map((n) => this.deliveredToSchema(n));
          return { notifications: [...scheduled, ...delivered] };
        }
        async getAll(options) {
          const scheduled = [...this.pending];
          const delivered = this.deliveredNotifications.map((n) => this.deliveredToSchema(n));
          if ((options === null || options === void 0 ? void 0 : options.state) === "SCHEDULED") {
            return { notifications: scheduled };
          }
          if ((options === null || options === void 0 ? void 0 : options.state) === "TRIGGERED") {
            return { notifications: delivered };
          }
          return { notifications: [...scheduled, ...delivered] };
        }
        deliveredToSchema(notification) {
          return {
            title: notification.title,
            id: parseInt(notification.tag),
            body: notification.body
          };
        }
        async createChannel() {
          throw this.unimplemented("Not implemented on web.");
        }
        async deleteChannel() {
          throw this.unimplemented("Not implemented on web.");
        }
        async listChannels() {
          throw this.unimplemented("Not implemented on web.");
        }
        async schedule(options) {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          for (const notification of options.notifications) {
            this.sendNotification(notification);
          }
          return {
            notifications: options.notifications.map((notification) => ({
              id: notification.id
            }))
          };
        }
        async update(options) {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const updated = [];
          for (const notification of options.notifications) {
            const index = this.pending.findIndex((n) => n.id === notification.id);
            if (index === -1) {
              continue;
            }
            this.pending.splice(index, 1);
            this.sendNotification(notification);
            updated.push(notification);
          }
          return {
            notifications: updated.map((notification) => ({ id: notification.id }))
          };
        }
        async getPending() {
          return {
            notifications: this.pending
          };
        }
        async cancelAll() {
          this.pending = [];
        }
        async registerActionTypes() {
          throw this.unimplemented("Not implemented on web.");
        }
        async cancel(pending) {
          this.pending = this.pending.filter((notification) => !pending.notifications.find((n) => n.id === notification.id));
        }
        async areEnabled() {
          const { display } = await this.checkPermissions();
          return {
            value: display === "granted"
          };
        }
        async changeExactNotificationSetting() {
          throw this.unimplemented("Not implemented on web.");
        }
        async checkExactNotificationSetting() {
          throw this.unimplemented("Not implemented on web.");
        }
        async requestPermissions() {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const display = this.transformNotificationPermission(await Notification.requestPermission());
          return { display };
        }
        async checkPermissions() {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const display = this.transformNotificationPermission(Notification.permission);
          return { display };
        }
        transformNotificationPermission(permission) {
          switch (permission) {
            case "granted":
              return "granted";
            case "denied":
              return "denied";
            default:
              return "prompt";
          }
        }
        sendPending() {
          var _a;
          const toRemove = [];
          const now = (/* @__PURE__ */ new Date()).getTime();
          for (const notification of this.pending) {
            if (((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) && notification.schedule.at.getTime() <= now) {
              this.buildNotification(notification);
              toRemove.push(notification);
            }
          }
          this.pending = this.pending.filter((notification) => !toRemove.find((n) => n === notification));
        }
        sendNotification(notification) {
          var _a;
          if ((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) {
            const diff = notification.schedule.at.getTime() - (/* @__PURE__ */ new Date()).getTime();
            this.pending.push(notification);
            setTimeout(() => {
              this.sendPending();
            }, diff);
            return;
          }
          this.buildNotification(notification);
        }
        buildNotification(notification) {
          const localNotification = new Notification(notification.title, {
            body: notification.body,
            tag: String(notification.id)
          });
          localNotification.addEventListener("click", this.onClick.bind(this, notification), false);
          localNotification.addEventListener("show", this.onShow.bind(this, notification), false);
          localNotification.addEventListener("close", () => {
            this.deliveredNotifications = this.deliveredNotifications.filter(() => !this);
          }, false);
          this.deliveredNotifications.push(localNotification);
          return localNotification;
        }
        onClick(notification) {
          const data = {
            actionId: "tap",
            notification
          };
          this.notifyListeners("localNotificationActionPerformed", data);
        }
        onShow(notification) {
          this.notifyListeners("localNotificationReceived", notification);
        }
      };
    }
  });

  // src/generated/app-config.mjs
  var app_config_default = {
    "schemaVersion": 1,
    "appId": "com.yuta.wishnote",
    "appName": "\u9858\u3044\u3092\u80B2\u3066\u308B-Wish Note-",
    "homeScreenName": "Wish Note",
    "storageNamespace": "a16-wish-note",
    "privacyPolicyUrl": "https://arakiyuuta0314-sketch.github.io/app-legal-pages/privacy/",
    "supportUrl": "https://arakiyuuta0314-sketch.github.io/",
    "contactEmail": "yuta.room.info@gmail.com",
    "ads": {
      "mode": "production",
      "appId": "ca-app-pub-2233916147865641~1536496765",
      "bannerId": "ca-app-pub-2233916147865641/7910333429",
      "interstitialId": "ca-app-pub-2233916147865641/1344925071",
      "minCompletedActions": 10,
      "cooldownMs": 24e5
    },
    "purchase": {
      "enabled": true,
      "removeAdsProductId": "com.yuta.wishnote.remove_ads"
    }
  };

  // src/lib/config.mjs
  var idPattern = /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9-]*){2,}$/;
  var adAppPattern = /^ca-app-pub-(\d{16})~\d{10}$/;
  var adUnitPattern = /^ca-app-pub-(\d{16})\/\d{10}$/;
  var isNonempty = (value) => typeof value === "string" && value.trim().length > 0;
  function invariant(ok, message) {
    if (!ok) throw new Error("Config: " + message);
  }
  function validateConfig(config, { release = false } = {}) {
    invariant(config && typeof config === "object" && !Array.isArray(config), "object required");
    invariant(config.schemaVersion === 1, "unsupported schemaVersion");
    invariant(isNonempty(config.appId) && idPattern.test(config.appId), "valid bundle ID required");
    invariant(isNonempty(config.appName), "appName required");
    invariant(isNonempty(config.homeScreenName) && config.homeScreenName.length <= 30, "homeScreenName (iPhone icon label) required, max 30 characters");
    invariant(typeof config.storageNamespace === "string" && /^[a-z0-9][a-z0-9-]{2,50}$/.test(config.storageNamespace), "storageNamespace requires 3-51 lowercase characters");
    for (const name of ["privacyPolicyUrl", "supportUrl"]) {
      invariant(isNonempty(config[name]) && /^https:\/\/[^/\s]+\/\S*$/.test(config[name]), name + " must be an HTTPS URL with path");
    }
    invariant(isNonempty(config.contactEmail) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(config.contactEmail), "contactEmail required");
    const ads = config.ads;
    invariant(ads && ["disabled", "test", "production"].includes(ads.mode), "ads.mode must be disabled, test or production");
    invariant(Number.isSafeInteger(ads.minCompletedActions) && ads.minCompletedActions > 0, "ads.minCompletedActions must be a positive integer");
    invariant(Number.isSafeInteger(ads.cooldownMs) && ads.cooldownMs >= 0, "ads.cooldownMs must be a nonnegative integer");
    if (ads.mode !== "disabled") {
      const app2 = adAppPattern.exec(ads.appId || "");
      const banner = adUnitPattern.exec(ads.bannerId || "");
      const interstitial = adUnitPattern.exec(ads.interstitialId || "");
      invariant(app2 && banner && interstitial, "three valid AdMob IDs required");
      invariant(app2[1] === banner[1] && app2[1] === interstitial[1], "AdMob publisher IDs do not match");
      invariant(ads.bannerId !== ads.interstitialId, "AdMob ad units must be distinct");
      if (ads.mode === "test") invariant(app2[1] === "3940256099942544", "test mode must use Google demo IDs");
      if (ads.mode === "production") invariant(app2[1] !== "3940256099942544", "Google demo IDs forbidden in production");
    }
    const purchase = config.purchase;
    invariant(purchase && typeof purchase.enabled === "boolean", "purchase.enabled boolean required");
    invariant(typeof purchase.removeAdsProductId === "string", "purchase.removeAdsProductId must be string");
    if (purchase.enabled) {
      invariant(isNonempty(purchase.removeAdsProductId) && purchase.removeAdsProductId.startsWith(config.appId + "."), "purchase product ID must use this app bundle ID");
    }
    if (release) {
      invariant(config.appId !== "com.example.starter", "template bundle ID forbidden for release");
      invariant(config.storageNamespace !== "app-starter", "template storage namespace forbidden for release");
      invariant(config.appName !== "App Starter", "template appName forbidden for release");
      invariant(ads.mode !== "test", "test ads forbidden for release; use production or disabled");
      invariant(!purchase.enabled || ads.mode === "production", "remove ads purchase requires production ads");
    }
    return config;
  }

  // src/lib/feedback.mjs
  function createFeedback({ doc = document, win = window, toastNode }) {
    if (!toastNode || !doc?.body || !win) throw new Error("Feedback: document, window and toast node are required");
    let toastTimer;
    let confirmationOpen = false;
    const notify = (message, { durationMs = 3e3 } = {}) => {
      if (typeof message !== "string" || !message.trim()) throw new Error("Feedback: non-empty message required");
      if (!Number.isSafeInteger(durationMs) || durationMs < 0) throw new Error("Feedback: invalid duration");
      toastNode.textContent = message;
      toastNode.hidden = false;
      if (toastTimer !== void 0) win.clearTimeout(toastTimer);
      toastTimer = durationMs ? win.setTimeout(() => {
        toastNode.hidden = true;
        toastTimer = void 0;
      }, durationMs) : void 0;
    };
    const confirmAction = ({ title = "\u78BA\u8A8D", message, acceptLabel = "\u7D9A\u3051\u308B", cancelLabel = "\u30AD\u30E3\u30F3\u30BB\u30EB", danger = false }) => {
      if (confirmationOpen) return Promise.reject(new Error("Feedback: a confirmation is already open"));
      if (typeof message !== "string" || !message.trim()) return Promise.reject(new Error("Feedback: confirmation message required"));
      confirmationOpen = true;
      return new Promise((resolve2) => {
        const previousFocus = doc.activeElement;
        const panel = doc.createElement("div");
        panel.className = "shared-confirm-backdrop";
        panel.innerHTML = '<section class="shared-confirm-panel" role="dialog" aria-modal="true" aria-labelledby="shared-confirm-title" aria-describedby="shared-confirm-message"><h2 id="shared-confirm-title"></h2><p id="shared-confirm-message"></p><div class="shared-confirm-actions"><button type="button" data-confirm-cancel></button><button type="button" data-confirm-accept></button></div></section>';
        panel.querySelector("#shared-confirm-title").textContent = title;
        panel.querySelector("#shared-confirm-message").textContent = message;
        const cancel = panel.querySelector("[data-confirm-cancel]");
        const accept = panel.querySelector("[data-confirm-accept]");
        cancel.textContent = cancelLabel;
        accept.textContent = acceptLabel;
        if (danger) accept.classList.add("danger");
        const hiddenPrior = [];
        for (const element of doc.body.children) {
          if (element !== panel) {
            hiddenPrior.push([element, element.inert]);
            element.inert = true;
          }
        }
        function finish(approved) {
          doc.removeEventListener("keydown", onKey, true);
          panel.remove();
          for (const [node, wasInert] of hiddenPrior) node.inert = wasInert;
          confirmationOpen = false;
          if (previousFocus?.isConnected && !previousFocus.inert) previousFocus.focus();
          resolve2(approved);
        }
        function onKey(event) {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopImmediatePropagation();
            finish(false);
            return;
          }
          if (event.key !== "Tab") return;
          const first = cancel, last = accept;
          if (event.shiftKey && doc.activeElement === first) {
            event.preventDefault();
            event.stopImmediatePropagation();
            last.focus();
          } else if (!event.shiftKey && doc.activeElement === last) {
            event.preventDefault();
            event.stopImmediatePropagation();
            first.focus();
          }
        }
        cancel.addEventListener("click", () => finish(false));
        accept.addEventListener("click", () => finish(true));
        panel.addEventListener("click", (event) => {
          if (event.target === panel) finish(false);
        });
        doc.body.appendChild(panel);
        doc.addEventListener("keydown", onKey, true);
        cancel.focus();
      });
    };
    async function withBusy(button, action) {
      if (!button || typeof action !== "function") throw new TypeError("Feedback: button and action required");
      if (button.dataset.sharedBusy === "true") return false;
      const wasDisabled = button.disabled, priorBusy = button.getAttribute("aria-busy");
      button.dataset.sharedBusy = "true";
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      try {
        return await action();
      } finally {
        delete button.dataset.sharedBusy;
        button.disabled = wasDisabled;
        if (priorBusy === null) button.removeAttribute("aria-busy");
        else button.setAttribute("aria-busy", priorBusy);
      }
    }
    return { notify, confirmAction, withBusy };
  }

  // src/lib/layout.mjs
  function createDeviceLayout({ root, bannerHeightPx = 50 }) {
    if (!root?.classList || !root?.style) throw new TypeError("Layout: root HTML element required");
    if (!Number.isSafeInteger(bannerHeightPx) || bannerHeightPx < 0 || bannerHeightPx > 200)
      throw new RangeError("Layout: banner height must be 0\u2013200 px");
    root.classList.add("app-viewport");
    root.style.setProperty("--app-banner-height", bannerHeightPx + "px");
    root.classList.add("native-ad-hidden");
    root.classList.remove("native-ad-visible");
    let visible = false;
    return {
      setBannerVisible(next) {
        if (typeof next !== "boolean") throw new TypeError("Layout: boolean expected");
        visible = next;
        root.classList.toggle("native-ad-visible", visible);
        root.classList.toggle("native-ad-hidden", !visible);
      },
      getBannerVisible() {
        return visible;
      },
      setBannerHeight(height) {
        if (!Number.isSafeInteger(height) || height < 0 || height > 200)
          throw new RangeError("Layout: invalid banner height");
        root.style.setProperty("--app-banner-height", height + "px");
      }
    };
  }

  // src/services/native-ports.mjs
  init_dist();

  // node_modules/@capacitor-community/admob/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-feed.js
  init_dist();

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-template.enum.js
  var NativeAdTemplate;
  (function(NativeAdTemplate2) {
    NativeAdTemplate2["Small"] = "small";
    NativeAdTemplate2["Medium"] = "medium";
  })(NativeAdTemplate || (NativeAdTemplate = {}));

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-feed.js
  var bridge;
  var configureNativeAdBridge = (adMobBridge) => {
    bridge = adMobBridge;
  };

  // node_modules/@capacitor-community/admob/dist/esm/definitions.js
  var MaxAdContentRating;
  (function(MaxAdContentRating2) {
    MaxAdContentRating2["General"] = "General";
    MaxAdContentRating2["ParentalGuidance"] = "ParentalGuidance";
    MaxAdContentRating2["Teen"] = "Teen";
    MaxAdContentRating2["MatureAudience"] = "MatureAudience";
  })(MaxAdContentRating || (MaxAdContentRating = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-plugin-events.enum.js
  var BannerAdPluginEvents;
  (function(BannerAdPluginEvents2) {
    BannerAdPluginEvents2["SizeChanged"] = "bannerAdSizeChanged";
    BannerAdPluginEvents2["Loaded"] = "bannerAdLoaded";
    BannerAdPluginEvents2["FailedToLoad"] = "bannerAdFailedToLoad";
    BannerAdPluginEvents2["Opened"] = "bannerAdOpened";
    BannerAdPluginEvents2["Closed"] = "bannerAdClosed";
    BannerAdPluginEvents2["AdImpression"] = "bannerAdImpression";
    BannerAdPluginEvents2["AdPaid"] = "bannerAdPaid";
  })(BannerAdPluginEvents || (BannerAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-position.enum.js
  var BannerAdPosition;
  (function(BannerAdPosition2) {
    BannerAdPosition2["TOP_CENTER"] = "TOP_CENTER";
    BannerAdPosition2["CENTER"] = "CENTER";
    BannerAdPosition2["BOTTOM_CENTER"] = "BOTTOM_CENTER";
  })(BannerAdPosition || (BannerAdPosition = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-size.enum.js
  var BannerAdSize;
  (function(BannerAdSize2) {
    BannerAdSize2["BANNER"] = "BANNER";
    BannerAdSize2["FULL_BANNER"] = "FULL_BANNER";
    BannerAdSize2["LARGE_BANNER"] = "LARGE_BANNER";
    BannerAdSize2["MEDIUM_RECTANGLE"] = "MEDIUM_RECTANGLE";
    BannerAdSize2["LEADERBOARD"] = "LEADERBOARD";
    BannerAdSize2["ADAPTIVE_BANNER"] = "ADAPTIVE_BANNER";
    BannerAdSize2["SMART_BANNER"] = "SMART_BANNER";
  })(BannerAdSize || (BannerAdSize = {}));

  // node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-ad-plugin-events.enum.js
  var InterstitialAdPluginEvents;
  (function(InterstitialAdPluginEvents2) {
    InterstitialAdPluginEvents2["Loaded"] = "interstitialAdLoaded";
    InterstitialAdPluginEvents2["FailedToLoad"] = "interstitialAdFailedToLoad";
    InterstitialAdPluginEvents2["Showed"] = "interstitialAdShowed";
    InterstitialAdPluginEvents2["FailedToShow"] = "interstitialAdFailedToShow";
    InterstitialAdPluginEvents2["Dismissed"] = "interstitialAdDismissed";
    InterstitialAdPluginEvents2["AdImpression"] = "interstitialAdImpression";
  })(InterstitialAdPluginEvents || (InterstitialAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-plugin-events.enum.js
  var RewardInterstitialAdPluginEvents;
  (function(RewardInterstitialAdPluginEvents2) {
    RewardInterstitialAdPluginEvents2["Loaded"] = "onRewardedInterstitialAdLoaded";
    RewardInterstitialAdPluginEvents2["FailedToLoad"] = "onRewardedInterstitialAdFailedToLoad";
    RewardInterstitialAdPluginEvents2["Showed"] = "onRewardedInterstitialAdShowed";
    RewardInterstitialAdPluginEvents2["FailedToShow"] = "onRewardedInterstitialAdFailedToShow";
    RewardInterstitialAdPluginEvents2["Dismissed"] = "onRewardedInterstitialAdDismissed";
    RewardInterstitialAdPluginEvents2["Rewarded"] = "onRewardedInterstitialAdReward";
    RewardInterstitialAdPluginEvents2["AdImpression"] = "onRewardedInterstitialAdImpression";
  })(RewardInterstitialAdPluginEvents || (RewardInterstitialAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-plugin-events.enum.js
  var RewardAdPluginEvents;
  (function(RewardAdPluginEvents2) {
    RewardAdPluginEvents2["adClicked"] = "onRewardedVideoAdClicked";
    RewardAdPluginEvents2["Loaded"] = "onRewardedVideoAdLoaded";
    RewardAdPluginEvents2["FailedToLoad"] = "onRewardedVideoAdFailedToLoad";
    RewardAdPluginEvents2["Showed"] = "onRewardedVideoAdShowed";
    RewardAdPluginEvents2["FailedToShow"] = "onRewardedVideoAdFailedToShow";
    RewardAdPluginEvents2["Dismissed"] = "onRewardedVideoAdDismissed";
    RewardAdPluginEvents2["Rewarded"] = "onRewardedVideoAdReward";
    RewardAdPluginEvents2["AdImpression"] = "onRewardedVideoAdImpression";
  })(RewardAdPluginEvents || (RewardAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/consent/index.js
  init_consent_status_enum();

  // node_modules/@capacitor-community/admob/dist/esm/consent/consent-debug-geography.enum.js
  var AdmobConsentDebugGeography;
  (function(AdmobConsentDebugGeography2) {
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["DISABLED"] = 0] = "DISABLED";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["EEA"] = 1] = "EEA";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["NOT_EEA"] = 2] = "NOT_EEA";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["US"] = 3] = "US";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["OTHER"] = 4] = "OTHER";
  })(AdmobConsentDebugGeography || (AdmobConsentDebugGeography = {}));

  // node_modules/@capacitor-community/admob/dist/esm/shared/ad-mob-revenue-data.interface.js
  var AdValuePrecision;
  (function(AdValuePrecision2) {
    AdValuePrecision2[AdValuePrecision2["Unknown"] = 0] = "Unknown";
    AdValuePrecision2[AdValuePrecision2["Estimated"] = 1] = "Estimated";
    AdValuePrecision2[AdValuePrecision2["PublisherProvided"] = 2] = "PublisherProvided";
    AdValuePrecision2[AdValuePrecision2["Precise"] = 3] = "Precise";
  })(AdValuePrecision || (AdValuePrecision = {}));

  // node_modules/@capacitor-community/admob/dist/esm/app-open/app-open-ad-plugin-events.enum.js
  var AppOpenAdPluginEvents;
  (function(AppOpenAdPluginEvents2) {
    AppOpenAdPluginEvents2["Loaded"] = "appOpenAdLoaded";
    AppOpenAdPluginEvents2["FailedToLoad"] = "appOpenAdFailedToLoad";
    AppOpenAdPluginEvents2["Opened"] = "appOpenAdOpened";
    AppOpenAdPluginEvents2["Closed"] = "appOpenAdClosed";
    AppOpenAdPluginEvents2["FailedToShow"] = "appOpenAdFailedToShow";
    AppOpenAdPluginEvents2["AdImpression"] = "appOpenAdImpression";
  })(AppOpenAdPluginEvents || (AppOpenAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-plugin-events.enum.js
  var NativeAdPluginEvents;
  (function(NativeAdPluginEvents2) {
    NativeAdPluginEvents2["Loaded"] = "nativeAdLoaded";
    NativeAdPluginEvents2["FailedToLoad"] = "nativeAdFailedToLoad";
    NativeAdPluginEvents2["Clicked"] = "nativeAdClicked";
    NativeAdPluginEvents2["AdImpression"] = "nativeAdImpression";
    NativeAdPluginEvents2["Opened"] = "nativeAdOpened";
    NativeAdPluginEvents2["Closed"] = "nativeAdClosed";
    NativeAdPluginEvents2["AdPaid"] = "nativeAdPaid";
  })(NativeAdPluginEvents || (NativeAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/index.js
  var nativeAdBridge = registerPlugin("AdMob", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.AdMobWeb())
  });
  var AdMob = nativeAdBridge;
  configureNativeAdBridge(nativeAdBridge);

  // node_modules/capacitor-plugin-cdv-purchase/dist/index.js
  init_dist();
  if (typeof window !== "undefined") {
    window.CdvPurchaseCapacitor = { installed: true };
  }
  var PurchasePlugin = registerPlugin("PurchasePlugin");
  var __awaiter = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var CdvPurchase;
  (function(CdvPurchase2) {
    const ERROR_CODES_BASE = 6777e3;
    (function(ErrorCode2) {
      ErrorCode2[ErrorCode2["SETUP"] = ERROR_CODES_BASE + 1] = "SETUP";
      ErrorCode2[ErrorCode2["LOAD"] = ERROR_CODES_BASE + 2] = "LOAD";
      ErrorCode2[ErrorCode2["PURCHASE"] = ERROR_CODES_BASE + 3] = "PURCHASE";
      ErrorCode2[ErrorCode2["LOAD_RECEIPTS"] = ERROR_CODES_BASE + 4] = "LOAD_RECEIPTS";
      ErrorCode2[ErrorCode2["CLIENT_INVALID"] = ERROR_CODES_BASE + 5] = "CLIENT_INVALID";
      ErrorCode2[ErrorCode2["PAYMENT_CANCELLED"] = ERROR_CODES_BASE + 6] = "PAYMENT_CANCELLED";
      ErrorCode2[ErrorCode2["PAYMENT_INVALID"] = ERROR_CODES_BASE + 7] = "PAYMENT_INVALID";
      ErrorCode2[ErrorCode2["PAYMENT_NOT_ALLOWED"] = ERROR_CODES_BASE + 8] = "PAYMENT_NOT_ALLOWED";
      ErrorCode2[ErrorCode2["UNKNOWN"] = ERROR_CODES_BASE + 10] = "UNKNOWN";
      ErrorCode2[ErrorCode2["REFRESH_RECEIPTS"] = ERROR_CODES_BASE + 11] = "REFRESH_RECEIPTS";
      ErrorCode2[ErrorCode2["INVALID_PRODUCT_ID"] = ERROR_CODES_BASE + 12] = "INVALID_PRODUCT_ID";
      ErrorCode2[ErrorCode2["FINISH"] = ERROR_CODES_BASE + 13] = "FINISH";
      ErrorCode2[ErrorCode2["COMMUNICATION"] = ERROR_CODES_BASE + 14] = "COMMUNICATION";
      ErrorCode2[ErrorCode2["SUBSCRIPTIONS_NOT_AVAILABLE"] = ERROR_CODES_BASE + 15] = "SUBSCRIPTIONS_NOT_AVAILABLE";
      ErrorCode2[ErrorCode2["MISSING_TOKEN"] = ERROR_CODES_BASE + 16] = "MISSING_TOKEN";
      ErrorCode2[ErrorCode2["VERIFICATION_FAILED"] = ERROR_CODES_BASE + 17] = "VERIFICATION_FAILED";
      ErrorCode2[ErrorCode2["BAD_RESPONSE"] = ERROR_CODES_BASE + 18] = "BAD_RESPONSE";
      ErrorCode2[ErrorCode2["REFRESH"] = ERROR_CODES_BASE + 19] = "REFRESH";
      ErrorCode2[ErrorCode2["PAYMENT_EXPIRED"] = ERROR_CODES_BASE + 20] = "PAYMENT_EXPIRED";
      ErrorCode2[ErrorCode2["DOWNLOAD"] = ERROR_CODES_BASE + 21] = "DOWNLOAD";
      ErrorCode2[ErrorCode2["SUBSCRIPTION_UPDATE_NOT_AVAILABLE"] = ERROR_CODES_BASE + 22] = "SUBSCRIPTION_UPDATE_NOT_AVAILABLE";
      ErrorCode2[ErrorCode2["PRODUCT_NOT_AVAILABLE"] = ERROR_CODES_BASE + 23] = "PRODUCT_NOT_AVAILABLE";
      ErrorCode2[ErrorCode2["CLOUD_SERVICE_PERMISSION_DENIED"] = ERROR_CODES_BASE + 24] = "CLOUD_SERVICE_PERMISSION_DENIED";
      ErrorCode2[ErrorCode2["CLOUD_SERVICE_NETWORK_CONNECTION_FAILED"] = ERROR_CODES_BASE + 25] = "CLOUD_SERVICE_NETWORK_CONNECTION_FAILED";
      ErrorCode2[ErrorCode2["CLOUD_SERVICE_REVOKED"] = ERROR_CODES_BASE + 26] = "CLOUD_SERVICE_REVOKED";
      ErrorCode2[ErrorCode2["PRIVACY_ACKNOWLEDGEMENT_REQUIRED"] = ERROR_CODES_BASE + 27] = "PRIVACY_ACKNOWLEDGEMENT_REQUIRED";
      ErrorCode2[ErrorCode2["UNAUTHORIZED_REQUEST_DATA"] = ERROR_CODES_BASE + 28] = "UNAUTHORIZED_REQUEST_DATA";
      ErrorCode2[ErrorCode2["INVALID_OFFER_IDENTIFIER"] = ERROR_CODES_BASE + 29] = "INVALID_OFFER_IDENTIFIER";
      ErrorCode2[ErrorCode2["INVALID_OFFER_PRICE"] = ERROR_CODES_BASE + 30] = "INVALID_OFFER_PRICE";
      ErrorCode2[ErrorCode2["INVALID_SIGNATURE"] = ERROR_CODES_BASE + 31] = "INVALID_SIGNATURE";
      ErrorCode2[ErrorCode2["MISSING_OFFER_PARAMS"] = ERROR_CODES_BASE + 32] = "MISSING_OFFER_PARAMS";
      ErrorCode2[ErrorCode2["STORE_BLOCKED"] = ERROR_CODES_BASE + 33] = "STORE_BLOCKED";
      ErrorCode2[ErrorCode2["VALIDATOR_SUBSCRIPTION_EXPIRED"] = 6778003] = "VALIDATOR_SUBSCRIPTION_EXPIRED";
    })(CdvPurchase2.ErrorCode || (CdvPurchase2.ErrorCode = {}));
    function storeError(code, message, platform, productId) {
      return { isError: true, code, message, platform, productId };
    }
    CdvPurchase2.storeError = storeError;
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    class Iaptic2 {
      constructor(config, store2) {
        this.config = config;
        if (!config.url) {
          config.url = "https://validator.iaptic.com";
        }
        this.store = store2 !== null && store2 !== void 0 ? store2 : CdvPurchase2.store;
        this.log = this.store.log.child("Iaptic");
      }
      /**
       * Provides a client token generated on iaptic's servers
       *
       * Can be passed to the Braintree Adapter at initialization.
       *
       * @example
       * store.initialize([
       *   {
       *     platform: Platform.BRAINTREE,
       *     options: {
       *       clientTokenProvider: iaptic.braintreeClientTokenProvider
       *     }
       *   }
       * ]);
       */
      get braintreeClientTokenProvider() {
        return (callback) => {
          this.log.info("Calling Braintree clientTokenProvider");
          CdvPurchase2.Utils.ajax(this.log, {
            url: `${this.config.url}/v3/braintree/client-token?appName=${this.config.appName}&apiKey=${this.config.apiKey}`,
            method: "POST",
            data: {
              applicationUsername: CdvPurchase2.store.getApplicationUsername(),
              customerId: CdvPurchase2.Braintree.customerId
            },
            success: (body) => {
              this.log.info("clientTokenProvider success: " + JSON.stringify(body));
              callback(body.clientToken);
            },
            error: (err) => {
              this.log.info("clientTokenProvider error: " + JSON.stringify(err));
              callback(CdvPurchase2.storeError(err, "ERROR " + err, CdvPurchase2.Platform.BRAINTREE, null));
            }
          });
        };
      }
      /**
       * Determine the eligibility of discounts based on the content of the application receipt.
       *
       * The secret sauce used here is to wait for validation of the application receipt.
       * The receipt validator will return the necessary data to determine eligibility.
       *
       * Receipt validation is expected to happen after loading product information, so the implementation here is to
       * wait for a validation response.
       */
      get appStoreDiscountEligibilityDeterminer() {
        let latestReceipt;
        this.log.debug("AppStore eligibility determiner is listening...");
        this.store.when().verified((receipt) => {
          if (receipt.platform === CdvPurchase2.Platform.APPLE_APPSTORE) {
            this.log.debug("Got a verified AppStore receipt.");
            latestReceipt = receipt;
          }
        }, "appStoreDiscountEligibilityDeterminer_listening");
        const determiner = (_appStoreReceipt, requests, callback) => {
          this.log.debug("AppStore eligibility determiner");
          if (latestReceipt) {
            this.log.debug("Using cached receipt");
            return callback(analyzeReceipt(latestReceipt, requests));
          }
          const onVerified = (receipt) => {
            if (receipt.platform === CdvPurchase2.Platform.APPLE_APPSTORE) {
              this.log.debug("Receipt is verified, let's analyze the content and respond.");
              this.store.off(onVerified);
              callback(analyzeReceipt(receipt, requests));
            }
          };
          this.log.debug("Waiting for receipt");
          this.store.when().verified(onVerified, "appStoreDiscountEligibilityDeterminer_waiting");
        };
        determiner.cacheReceipt = function(receipt) {
          latestReceipt = receipt;
        };
        return determiner;
        function analyzeReceipt(receipt, requests) {
          const ineligibleIntro = receipt.raw.ineligible_for_intro_price;
          return requests.map((request) => {
            var _a;
            if (request.discountType === "Introductory" && ineligibleIntro && ineligibleIntro.find((id) => request.productId === id)) {
              return false;
            } else if (request.discountType === "Subscription") {
              const matchingPurchase = (_a = receipt.raw.collection) === null || _a === void 0 ? void 0 : _a.find((purchase) => purchase.id === request.productId);
              return matchingPurchase ? true : false;
            } else {
              return true;
            }
          });
        }
      }
      /** Validator URL */
      get validator() {
        return `${this.config.url}/v1/validate?appName=${this.config.appName}&apiKey=${this.config.apiKey}`;
      }
    }
    CdvPurchase2.Iaptic = Iaptic2;
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    let LogLevel2;
    (function(LogLevel3) {
      LogLevel3[LogLevel3["QUIET"] = 0] = "QUIET";
      LogLevel3[LogLevel3["ERROR"] = 1] = "ERROR";
      LogLevel3[LogLevel3["WARNING"] = 2] = "WARNING";
      LogLevel3[LogLevel3["INFO"] = 3] = "INFO";
      LogLevel3[LogLevel3["DEBUG"] = 4] = "DEBUG";
    })(LogLevel2 = CdvPurchase2.LogLevel || (CdvPurchase2.LogLevel = {}));
    class Logger2 {
      /** @internal */
      constructor(store2, prefix = "") {
        this.prefix = "";
        this.store = store2;
        this.prefix = prefix || "CdvPurchase";
      }
      /**
       * Create a child logger, whose prefix will be this one's + the given string.
       *
       * @example
       * const log = store.log.child('AppStore')
       */
      child(prefix) {
        return new Logger2(this.store, this.prefix + "." + prefix);
      }
      /**
       * Logs an error message, only if `store.verbosity` >= store.ERROR
       */
      error(o) {
        log(this.store.verbosity, LogLevel2.ERROR, this.prefix, o);
        try {
          throw new Error(toString(o));
        } catch (e) {
          log(this.store.verbosity, LogLevel2.ERROR, this.prefix, e.stack);
        }
      }
      /**
       * Logs a warning message, only if `store.verbosity` >= store.WARNING
       */
      warn(o) {
        log(this.store.verbosity, LogLevel2.WARNING, this.prefix, o);
      }
      /**
       * Logs an info message, only if `store.verbosity` >= store.INFO
       */
      info(o) {
        log(this.store.verbosity, LogLevel2.INFO, this.prefix, o);
      }
      /**
       * Logs a debug message, only if `store.verbosity` >= store.DEBUG
       */
      debug(o) {
        log(this.store.verbosity, LogLevel2.DEBUG, this.prefix, o);
      }
      /**
       * Add warning logs on a console describing an exception.
       *
       * This method is mostly used when executing user registered callbacks.
       *
       * @param context - a string describing why the method was called
       * @param error - a javascript Error object thrown by an exception
       */
      logCallbackException(context, err) {
        this.warn("A callback in '" + context + "' failed with an exception.");
        if (typeof err === "string")
          this.warn("           " + err);
        else if (err) {
          const errAny = err;
          if (errAny.fileName)
            this.warn("           " + errAny.fileName + ":" + errAny.lineNumber);
          if (err.message)
            this.warn("           " + err.message);
          if (err.stack)
            this.warn("           " + err.stack);
        }
      }
    }
    Logger2.console = window.console;
    CdvPurchase2.Logger = Logger2;
    const LOG_LEVEL_STRING = ["QUIET", "ERROR", "WARNING", "INFO", "DEBUG"];
    function toString(o) {
      if (typeof o !== "string")
        o = JSON.stringify(o);
      return o;
    }
    function log(verbosity, level, prefix, o) {
      var maxLevel = verbosity === true ? 1 : verbosity;
      if (level > maxLevel)
        return;
      if (typeof o !== "string")
        o = JSON.stringify(o);
      const fullPrefix = prefix ? `[${prefix}] ` : "";
      const logStr = level === LogLevel2.ERROR ? ((str) => Logger2.console.error(str)) : level === LogLevel2.WARNING ? ((str) => Logger2.console.warn(str)) : ((str) => Logger2.console.log(str));
      if (LOG_LEVEL_STRING[level])
        logStr(`${fullPrefix}${LOG_LEVEL_STRING[level]}: ${o}`);
      else
        logStr(`${fullPrefix}${o}`);
    }
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      Utils.nonEnumerable = (target, name, desc) => {
        if (desc) {
          desc.enumerable = false;
          return desc;
        }
        Object.defineProperty(target, name, {
          set(value) {
            Object.defineProperty(this, name, {
              value,
              writable: true,
              configurable: true
            });
          },
          configurable: true
        });
      };
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    class Product {
      /** @internal */
      constructor(p, decorator) {
        this.className = "Product";
        this.title = "";
        this.description = "";
        this.platform = p.platform;
        this.type = p.type;
        this.id = p.id;
        this.group = p.group;
        this.offers = [];
        Object.defineProperty(this, "pricing", { enumerable: false, get: () => {
          var _a;
          return (_a = this.offers[0]) === null || _a === void 0 ? void 0 : _a.pricingPhases[0];
        } });
        Object.defineProperty(this, "canPurchase", { enumerable: false, get: () => decorator.canPurchase(this) });
        Object.defineProperty(this, "owned", { enumerable: false, get: () => decorator.owned(this) });
      }
      /**
       * Shortcut to offers[0].pricingPhases[0]
       *
       * Useful when you know products have a single offer and a single pricing phase.
       */
      get pricing() {
        var _a;
        return (_a = this.offers[0]) === null || _a === void 0 ? void 0 : _a.pricingPhases[0];
      }
      /**
       * Returns true if the product can be purchased.
       */
      get canPurchase() {
        return false;
      }
      /**
       * Returns true if the product is owned.
       *
       * Important: This value will be false when the app starts and will only become
       * true after purchase receipts have been loaded and validated. Without receipt validation,
       * it might remain false depending on the platform, make sure to store the ownership status
       * of non-consumable products in some way.
       */
      get owned() {
        return false;
      }
      /**
       * Find and return an offer for this product from its id
       *
       * If id isn't specified, returns the first offer.
       *
       * @param id - Identifier of the offer to return
       * @return An Offer or undefined if no match is found
       */
      getOffer(id = "") {
        if (!id)
          return this.offers[0];
        return this.offers.find((o) => o.id === id);
      }
      /**
       * Add an offer to this product.
       *
       * @internal
       */
      addOffer(offer) {
        if (this.getOffer(offer.id))
          return this;
        this.offers.push(offer);
        return this;
      }
    }
    CdvPurchase2.Product = Product;
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      function objectValues(obj) {
        const ret = [];
        for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
            ret.push(obj[key]);
          }
        }
        return ret;
      }
      Utils.objectValues = objectValues;
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      function platformName(platform) {
        switch (platform) {
          case CdvPurchase2.Platform.APPLE_APPSTORE:
            return "App Store";
          case CdvPurchase2.Platform.GOOGLE_PLAY:
            return "Google Play";
          case CdvPurchase2.Platform.WINDOWS_STORE:
            return "Windows Store";
          case CdvPurchase2.Platform.BRAINTREE:
            return "Braintree";
          case CdvPurchase2.Platform.TEST:
            return "Test";
          default:
            return platform;
        }
      }
      Utils.platformName = platformName;
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class ReceiptsToValidate {
        constructor() {
          this.array = [];
        }
        get length() {
          return this.array.length;
        }
        get() {
          return this.array.concat();
        }
        add(receipt) {
          if (!this.has(receipt))
            this.array.push(receipt);
        }
        clear() {
          while (this.array.length !== 0)
            this.array.pop();
        }
        has(receipt) {
          return !!this.array.find((el2) => el2 === receipt);
        }
      }
      Internal.ReceiptsToValidate = ReceiptsToValidate;
      class Validator {
        constructor(controller, log) {
          this.receiptsToValidate = new ReceiptsToValidate();
          this.verifiedReceipts = [];
          this.maxAttempts = 4;
          this.failedAttempts = /* @__PURE__ */ new Map();
          this.numRequests = 0;
          this.numResponses = 0;
          this.cache = {};
          this.controller = controller;
          this.log = log.child("Validator");
        }
        /**
         * Schedule a new validation if the failure is temporary and attempts remain.
         *
         * @return true if a retry was scheduled
         */
        scheduleRetry(receipt, payload) {
          var _a;
          if (payload.ok || !isRetriableError(payload)) {
            this.failedAttempts.delete(receipt);
            if (payload.ok && this.retry)
              this.retry.retryTimeout = this.retry.minTimeout;
            return false;
          }
          const attempts = ((_a = this.failedAttempts.get(receipt)) !== null && _a !== void 0 ? _a : 0) + 1;
          if (attempts >= this.maxAttempts) {
            this.log.warn(`Validation failed ${attempts} times, giving up: ${payload.message}`);
            this.failedAttempts.delete(receipt);
            return false;
          }
          this.failedAttempts.set(receipt, attempts);
          if (!this.retry)
            this.retry = new Internal.Retry();
          this.log.info(`Validation failed (${payload.message}), retry in ${this.retry.retryTimeout}ms (attempt ${attempts + 1}/${this.maxAttempts})`);
          this.retry.retry(() => {
            this.receiptsToValidate.add(receipt);
            this.run();
          });
          return true;
        }
        incrRequestsCounter() {
          this.numRequests = this.numRequests + 1 | 0;
          this.log.debug(`Validation requests=${this.numRequests} responses=${this.numResponses}`);
        }
        incrResponsesCounter() {
          this.numResponses = this.numResponses + 1 | 0;
          this.log.debug(`Validation requests=${this.numRequests} responses=${this.numResponses}`);
        }
        /** Add/update a verified receipt from the server response */
        addVerifiedReceipt(receipt, data) {
          for (const vr of this.verifiedReceipts) {
            if (vr.platform === receipt.platform && vr.id === data.id) {
              this.log.debug("Updating existing receipt.");
              vr.set(receipt, data);
              return vr;
            }
          }
          this.log.debug("Register a new verified receipt.");
          const newVR = new CdvPurchase2.VerifiedReceipt(receipt, data, this.controller);
          this.verifiedReceipts.push(newVR);
          return newVR;
        }
        /** Add a receipt to the validation queue. It'll get validated after a few milliseconds. */
        add(receiptOrTransaction) {
          this.log.debug("Schedule validation: " + JSON.stringify(receiptOrTransaction));
          const receipt = receiptOrTransaction instanceof CdvPurchase2.Transaction ? receiptOrTransaction.parentReceipt : receiptOrTransaction;
          if (!this.receiptsToValidate.has(receipt)) {
            this.incrRequestsCounter();
            this.receiptsToValidate.add(receipt);
          }
        }
        /** Run validation for all receipts in the queue */
        run() {
          const receipts = this.receiptsToValidate.get();
          this.receiptsToValidate.clear();
          const onResponse = (r) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { receipt, payload } = r;
            if (this.scheduleRetry(receipt, payload))
              return;
            this.incrResponsesCounter();
            try {
              const adapter = this.controller.adapters.find(receipt.platform);
              yield adapter === null || adapter === void 0 ? void 0 : adapter.handleReceiptValidationResponse(receipt, payload);
              if (payload.ok) {
                const vr = this.addVerifiedReceipt(receipt, payload.data);
                this.controller.verifiedCallbacks.trigger(vr, "payload_ok");
              } else if (payload.code === CdvPurchase2.ErrorCode.VALIDATOR_SUBSCRIPTION_EXPIRED) {
                const transactionId = (_a = receipt.lastTransaction()) === null || _a === void 0 ? void 0 : _a.transactionId;
                const vr = transactionId ? this.verifiedReceipts.find((r2) => {
                  var _a2;
                  return ((_a2 = r2.collection[0]) === null || _a2 === void 0 ? void 0 : _a2.transactionId) === transactionId;
                }) : void 0;
                if (vr) {
                  vr === null || vr === void 0 ? void 0 : vr.collection.forEach((col) => {
                    if (col.transactionId === transactionId)
                      col.isExpired = true;
                  });
                  this.controller.verifiedCallbacks.trigger(vr, "payload_expired");
                } else {
                  this.controller.unverifiedCallbacks.trigger({ receipt, payload, transient: false }, "no_verified_receipt");
                }
              } else {
                this.controller.unverifiedCallbacks.trigger({ receipt, payload, transient: isTransientError(payload) }, "validator_error");
              }
            } catch (err) {
              this.log.error("Exception probably caused by an invalid response from the validator." + err.message);
              this.controller.unverifiedCallbacks.trigger({ receipt, payload: {
                ok: false,
                code: CdvPurchase2.ErrorCode.VERIFICATION_FAILED,
                message: err.message
              }, transient: false }, "validator_exception");
            }
          });
          receipts.forEach((receipt) => this.runOnReceipt(receipt, onResponse));
        }
        runOnReceipt(receipt, callback) {
          var _a, _b;
          return __awaiter(this, void 0, void 0, function* () {
            if (receipt.platform === CdvPurchase2.Platform.TEST) {
              this.log.debug("Using Test Adapter mock verify function.");
              return CdvPurchase2.Test.Adapter.verify(receipt, callback);
            }
            if (!this.controller.validator) {
              this.incrResponsesCounter();
              callback({
                receipt,
                payload: {
                  ok: true,
                  data: {
                    id: ((_b = (_a = receipt.transactions) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.transactionId) || "unknown",
                    latest_receipt: true,
                    transaction: { type: "test" }
                    // dummy data
                  }
                }
              });
              return;
            }
            const body = yield this.buildRequestBody(receipt);
            if (!body) {
              this.incrResponsesCounter();
              return;
            }
            if (typeof this.controller.validator === "function")
              return this.runValidatorFunction(this.controller.validator, receipt, body, callback);
            const target = typeof this.controller.validator === "string" ? {
              url: this.controller.validator,
              timeout: 2e4
              // validation request will timeout after 20 seconds by default
            } : this.controller.validator;
            return this.runValidatorRequest(target, receipt, body, callback);
          });
        }
        runValidatorFunction(validator, receipt, body, callback) {
          try {
            validator(body, (payload) => callback({ receipt, payload }));
          } catch (error) {
            this.log.warn("user provided validator function failed with error: " + (error === null || error === void 0 ? void 0 : error.stack));
          }
        }
        buildRequestBody(receipt) {
          var _a, _b, _c;
          return __awaiter(this, void 0, void 0, function* () {
            const adapter = this.controller.adapters.find(receipt.platform);
            const body = yield adapter === null || adapter === void 0 ? void 0 : adapter.receiptValidationBody(receipt);
            if (!body)
              return;
            const rawUsername = this.controller.getApplicationUsername();
            body.additionalData = Object.assign(Object.assign({}, (_a = body.additionalData) !== null && _a !== void 0 ? _a : {}), { applicationUsername: rawUsername });
            if (!body.additionalData.applicationUsername)
              delete body.additionalData.applicationUsername;
            if (rawUsername) {
              const obfuscated = this.controller.obfuscateUsername(rawUsername, receipt.platform);
              if (obfuscated)
                body.additionalData.obfuscatedUsername = obfuscated;
            }
            body.device = Object.assign(Object.assign({}, (_b = body.device) !== null && _b !== void 0 ? _b : {}), yield CdvPurchase2.Validator.Internal.getDeviceInfo(this.controller));
            if (((_c = body.offers) === null || _c === void 0 ? void 0 : _c.length) === 1) {
              const offer = body.offers[0];
              if (offer.pricingPhases.length === 1) {
                const pricing = offer.pricingPhases[0];
                body.currency = pricing.currency;
                body.priceMicros = pricing.priceMicros;
              } else if (offer.pricingPhases.length === 2) {
                const pricing = offer.pricingPhases[1];
                body.currency = pricing.currency;
                body.priceMicros = pricing.priceMicros;
                const intro = offer.pricingPhases[0];
                body.introPriceMicros = intro.priceMicros;
              }
            }
            if (!this.shouldSendProducts()) {
              delete body.products;
            }
            return body;
          });
        }
        /** Check if the products array should be included in the validation request.
         *  Returns true at most once per day, tracked via localStorage. */
        shouldSendProducts() {
          var _a, _b;
          const STORAGE_KEY = "cdvpurchase_has_sent_products_in_validation";
          const ONE_DAY_MS = 864e5;
          try {
            const stored = (_a = window.localStorage) === null || _a === void 0 ? void 0 : _a.getItem(STORAGE_KEY);
            if (stored) {
              const lastSent = parseInt(stored, 10);
              if (!isNaN(lastSent) && Date.now() - lastSent < ONE_DAY_MS) {
                return false;
              }
            }
            (_b = window.localStorage) === null || _b === void 0 ? void 0 : _b.setItem(STORAGE_KEY, String(Date.now()));
            return true;
          } catch (_e) {
            return true;
          }
        }
        removeExpiredCache() {
          const now = +/* @__PURE__ */ new Date();
          const deleteList = [];
          for (const hash in this.cache) {
            if (this.cache[hash].expires < now) {
              deleteList.push(hash);
            }
          }
          for (const hash of deleteList) {
            delete this.cache[hash];
          }
        }
        runValidatorRequest(target, receipt, body, callback) {
          this.removeExpiredCache();
          const bodyTransactionHash = CdvPurchase2.Utils.md5(JSON.stringify(body.transaction));
          const cached = this.cache[bodyTransactionHash];
          if (cached) {
            this.log.debug("validator cache hit, using cached response");
            return callback({ receipt, payload: cached.payload });
          }
          CdvPurchase2.Utils.ajax(this.log.child("Ajax"), {
            url: target.url,
            method: "POST",
            customHeaders: target.headers,
            timeout: target.timeout,
            data: body,
            success: (response) => {
              var _a;
              this.log.debug("validator success, response: " + JSON.stringify(response));
              if (!isValidatorResponsePayload(response))
                return callback({
                  receipt,
                  payload: {
                    ok: false,
                    code: CdvPurchase2.ErrorCode.BAD_RESPONSE,
                    message: "Validator responded with invalid data",
                    data: { latest_receipt: (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.latest_receipt }
                  }
                });
              if (response.ok || !isTransientError(response)) {
                this.cache[bodyTransactionHash] = {
                  payload: response,
                  expires: +/* @__PURE__ */ new Date() + 12e4
                  // expires in 2 minutes
                };
              }
              callback({ receipt, payload: response });
            },
            error: (status, message, data) => {
              var fullMessage = "Error " + status + ": " + message;
              this.log.debug("validator failed, response: " + JSON.stringify(fullMessage));
              this.log.debug("body => " + JSON.stringify(data));
              callback({
                receipt,
                payload: {
                  ok: false,
                  message: fullMessage,
                  code: CdvPurchase2.ErrorCode.COMMUNICATION,
                  status,
                  data: {}
                }
              });
            }
          });
        }
      }
      Internal.Validator = Validator;
      const VALIDATOR_CONNECTION_FAILED = 6778002;
      function isTransientError(payload) {
        const status = payload.status;
        if (typeof status === "number" && status >= 500)
          return true;
        if (payload.code === VALIDATOR_CONNECTION_FAILED)
          return true;
        if (payload.code === CdvPurchase2.ErrorCode.COMMUNICATION) {
          if (typeof status !== "number" || status <= 0)
            return true;
          if (status === CdvPurchase2.Utils.Ajax.HTTP_REQUEST_TIMEOUT || status === 417)
            return true;
        }
        return false;
      }
      Internal.isTransientError = isTransientError;
      function isRetriableError(payload) {
        return isTransientError(payload) || payload.code === CdvPurchase2.ErrorCode.BAD_RESPONSE;
      }
      function isValidatorResponsePayload(payload) {
        if (!payload || typeof payload !== "object")
          return false;
        const p = payload;
        if (typeof p.ok !== "boolean")
          return false;
        if (p.ok === true) {
          const data = p.data;
          if (!data || typeof data !== "object")
            return false;
          if (typeof data.id !== "string")
            return false;
          if (!data.transaction || typeof data.transaction !== "object")
            return false;
        }
        return true;
      }
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class Adapters {
        constructor() {
          this.list = [];
        }
        /**
         * Register a custom adapter factory for a platform.
         *
         * Use this to add support for platforms not built into the library.
         *
         * @param platform - The platform identifier
         * @param factory - A function that creates an Adapter instance
         *
         * @example
         * ```typescript
         * CdvPurchase.Internal.Adapters.registerAdapter(
         *     'my-custom-platform' as CdvPurchase.Platform,
         *     (context, options) => new MyCustomAdapter(context, options)
         * );
         * ```
         */
        static registerAdapter(platform, factory) {
          this.adapterFactories[platform] = factory;
        }
        /**
         * Check if a custom adapter factory is registered for a platform.
         */
        static hasAdapterFactory(platform) {
          return platform in this.adapterFactories;
        }
        /**
         * Create an adapter instance using a registered factory.
         *
         * @returns The adapter instance, or undefined if no factory is registered.
         */
        static createAdapter(platform, context, options) {
          const factory = this.adapterFactories[platform];
          if (factory) {
            return factory(context, options);
          }
          return void 0;
        }
        add(log, adapters, context) {
          adapters.forEach((po) => {
            log.info("");
            if (this.find(po.platform))
              return;
            switch (po.platform) {
              case CdvPurchase2.Platform.APPLE_APPSTORE:
                return this.list.push(new CdvPurchase2.AppleAppStore.Adapter(context, po.options || {}));
              case CdvPurchase2.Platform.GOOGLE_PLAY:
                return this.list.push(new CdvPurchase2.GooglePlay.Adapter(context));
              case CdvPurchase2.Platform.BRAINTREE:
                if (!po.options) {
                  log.error("Options missing for Braintree initialization. Use {platform: Platform.BRAINTREE, options: {...}} in your call to store.initialize");
                }
                return this.list.push(new CdvPurchase2.Braintree.Adapter(context, po.options));
              case CdvPurchase2.Platform.TEST:
                return this.list.push(new CdvPurchase2.Test.Adapter(context));
              case CdvPurchase2.Platform.IAPTIC_JS:
                if (!po.options) {
                  log.error("Options missing for IapticJS initialization. Use {platform: Platform.IAPTIC_JS, options: {...}} in your call to store.initialize");
                }
                return this.list.push(new CdvPurchase2.IapticJS.Adapter(context, po.options));
              default:
                const dynamicAdapter = Adapters.createAdapter(po.platform, context, po.options || {});
                if (dynamicAdapter) {
                  return this.list.push(dynamicAdapter);
                }
                log.warn(`No adapter found for platform: ${po.platform}`);
                return;
            }
          });
        }
        /**
         * Initialize some platform adapters.
         */
        initialize(platforms, context) {
          return __awaiter(this, void 0, void 0, function* () {
            if (typeof platforms === "string") {
              platforms = [platforms];
            }
            const newPlatforms = platforms.map((p) => typeof p === "string" ? { platform: p } : p).filter((p) => !this.find(p.platform));
            const log = context.log.child("Adapters");
            log.info("Adding platforms: " + JSON.stringify(newPlatforms));
            this.add(log, newPlatforms, context);
            const products = context.registeredProducts.byPlatform();
            const result = yield Promise.all(newPlatforms.map((platformToInit) => __awaiter(this, void 0, void 0, function* () {
              var _a, _b, _c;
              const platformProducts = (_c = (_b = (_a = products.filter((p) => p.platform === platformToInit.platform)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.products) !== null && _c !== void 0 ? _c : [];
              const adapter = this.find(platformToInit.platform);
              if (!adapter)
                return;
              log.info(`${adapter.name} initializing...`);
              if (!adapter.isSupported) {
                log.info(`${adapter.name} is not supported.`);
                return;
              }
              const initResult = yield adapter.initialize();
              adapter.ready = true;
              log.info(`${adapter.name} initialized. ${initResult ? JSON.stringify(initResult) : ""}`);
              if (initResult === null || initResult === void 0 ? void 0 : initResult.code)
                return initResult;
              log.info(`${adapter.name} products: ${JSON.stringify(platformProducts)}`);
              const storefrontRefresh = context.storefronts.refreshWith(adapter).catch(() => {
              });
              let loadProductsResult = [];
              let loadReceiptsResult = [];
              if (platformProducts.length > 0) {
                if (adapter.supportsParallelLoading) {
                  [loadProductsResult, loadReceiptsResult] = yield Promise.all([
                    adapter.loadProducts(platformProducts),
                    adapter.loadReceipts()
                  ]);
                } else {
                  loadProductsResult = yield adapter.loadProducts(platformProducts);
                  loadReceiptsResult = yield adapter.loadReceipts();
                }
                log.info(`${adapter.name} products loaded: ${JSON.stringify(loadProductsResult)}`);
                const loadedProducts = loadProductsResult.filter((p) => p instanceof CdvPurchase2.Product);
                context.listener.productsUpdated(platformToInit.platform, loadedProducts);
                log.info(`${adapter.name} receipts loaded: ${JSON.stringify(loadReceiptsResult)}`);
              }
              yield storefrontRefresh;
              return loadProductsResult.filter((lr) => "code" in lr && "message" in lr)[0];
            })));
            return result.filter((err) => err);
          });
        }
        /**
         * Retrieve a platform adapter.
         */
        find(platform) {
          return this.list.filter((a) => a.id === platform)[0];
        }
        /**
         * Retrieve the first platform adapter in the ready state, if any.
         *
         * You can optionally force the platform adapter you are looking for.
         *
         * Useful for methods that accept an optional "platform" argument, so they either act
         * on the only active adapter or on the one selected by the user, if it's ready.
         */
        findReady(platform) {
          return this.list.filter((adapter) => (!platform || adapter.id === platform) && adapter.ready)[0];
        }
      }
      Adapters.adapterFactories = {};
      Internal.Adapters = Adapters;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      const DEFAULT_STOREFRONT_REFRESH_TIMEOUT_MS = 2e3;
      class Storefronts {
        constructor(logger) {
          this.values = {};
          this.callbacks = new Internal.Callbacks(logger, "storefrontUpdated()");
        }
        /**
         * Refresh the cached value for a given adapter.
         *
         * The returned promise:
         *   - resolves when the adapter responds within `timeoutMs`
         *   - rejects with a timeout error otherwise
         *
         * Regardless of timeout, if the adapter eventually yields a value,
         * the cache is silently updated and listeners are notified.
         * A failed or empty response never overwrites the cache.
         */
        refreshWith(adapter, timeoutMs = DEFAULT_STOREFRONT_REFRESH_TIMEOUT_MS) {
          return __awaiter(this, void 0, void 0, function* () {
            if (!adapter.getStorefront)
              return;
            const platform = adapter.id;
            const fetch2 = adapter.getStorefront().then((code) => {
              if (code)
                this.setValue(platform, code);
            }).catch(() => {
            });
            let timerId;
            const timeout = new Promise((_, reject) => {
              timerId = setTimeout(() => reject(new Error("storefront refresh timeout")), timeoutMs);
            });
            try {
              yield Promise.race([fetch2, timeout]);
            } finally {
              clearTimeout(timerId);
            }
          });
        }
        /**
         * Retrieve a storefront value.
         *
         * - With a platform: always returns `{ platform, countryCode }`,
         *   where `countryCode` may be undefined if nothing is cached.
         * - Without a platform: returns the first cached non-empty
         *   storefront, or `undefined` if nothing is cached.
         */
        getValueFor(platform) {
          if (platform) {
            return { platform, countryCode: this.values[platform] };
          }
          for (const p of Object.keys(this.values)) {
            if (this.values[p]) {
              return { platform: p, countryCode: this.values[p] };
            }
          }
          return void 0;
        }
        /** Register a change listener. */
        listen(cb, callbackName) {
          this.callbacks.push(cb, callbackName);
        }
        /** Remove a previously registered listener. */
        off(cb) {
          this.callbacks.remove(cb);
        }
        /** Update the cache and notify listeners on change. */
        setValue(platform, countryCode) {
          if (this.values[platform] === countryCode)
            return;
          this.values[platform] = countryCode;
          this.callbacks.trigger({ platform, countryCode }, "storefront_changed");
        }
      }
      Internal.Storefronts = Storefronts;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class StoreAdapterListener {
        constructor(delegate, log) {
          this.supportedPlatforms = [];
          this.platformWithReceiptsReady = [];
          this.lastTransactionState = {};
          this.subscriptionFirstTransactionId = {};
          this.lastCallTimeForState = {};
          this.updatedReceiptsToProcess = [];
          this.delegate = delegate;
          this.log = log.child("AdapterListener");
        }
        static makeTransactionToken(transaction2) {
          return transaction2.platform + "|" + transaction2.transactionId;
        }
        /**
         * Create a subscription dedup key from a transaction.
         *
         * StoreKit 2 can deliver the same subscription purchase event twice with
         * different `transactionId` but identical `originalTransactionId` and
         * `purchaseDate`. This key groups those duplicates together so only one
         * `approved`/`finished` event is surfaced per billing period.
         *
         * Returns `undefined` for non-subscription transactions (no `originalTransactionId`).
         */
        static makeSubscriptionKey(transaction2) {
          if (transaction2.platform !== CdvPurchase2.Platform.APPLE_APPSTORE)
            return void 0;
          const skTransaction = transaction2;
          if (!skTransaction.originalTransactionId)
            return void 0;
          if (!transaction2.purchaseDate)
            return void 0;
          return transaction2.platform + "|" + skTransaction.originalTransactionId + "|" + transaction2.purchaseDate.getTime();
        }
        /**
         * Set the list of supported platforms.
         *
         * Called by the store when it is initialized.
         */
        setSupportedPlatforms(platforms) {
          this.log.debug(`setSupportedPlatforms: ${platforms.join(",")} (${this.platformWithReceiptsReady.length} have their receipts ready)`);
          this.supportedPlatforms = platforms;
          if (this.supportedPlatforms.length === this.platformWithReceiptsReady.length) {
            this.log.debug("triggering receiptsReady()");
            this.delegate.receiptsReadyCallbacks.trigger(void 0, "adapterListener_setSupportedPlatforms");
          }
        }
        /**
         * Trigger the "receiptsReady" event when all platforms have reported that their receipts are ready.
         *
         * This function is used by adapters to report that their receipts are ready.
         * Once all adapters have reported their receipts, the "receiptsReady" event is triggered.
         *
         * @param platform The platform that has its receipts ready.
         */
        receiptsReady(platform) {
          if (this.supportedPlatforms.length > 0 && this.platformWithReceiptsReady.length === this.supportedPlatforms.length) {
            this.log.debug("receiptsReady: " + platform + "(skipping)");
            return;
          }
          if (this.platformWithReceiptsReady.indexOf(platform) < 0) {
            this.platformWithReceiptsReady.push(platform);
            this.log.debug(`receiptsReady: ${platform} (${this.platformWithReceiptsReady.length}/${this.supportedPlatforms.length})`);
            if (this.platformWithReceiptsReady.length === this.supportedPlatforms.length) {
              this.log.debug("triggering receiptsReady()");
              this.delegate.receiptsReadyCallbacks.trigger(void 0, "adapterListener_receiptsReady");
            }
          }
        }
        /**
         * Trigger the "updated" event for each product.
         */
        productsUpdated(platform, products) {
          products.forEach((product) => this.delegate.updatedCallbacks.trigger(product, "adapterListener_productsUpdated"));
        }
        /**
         * Triggers the "approved", "pending" and "finished" events for transactions.
         *
         * - "approved" is triggered only if it hasn't been called for the same transaction in the last 5 seconds.
         * - "finished" and "pending" are triggered only if the transaction state has changed.
         *
         * @param platform The platform that has its receipts updated.
         * @param receipts The receipts that have been updated.
         */
        receiptsUpdated(platform, receipts) {
          this.log.debug("receiptsUpdated: " + JSON.stringify(receipts.map((r) => ({
            platform: r.platform,
            transactions: r.transactions
          }))));
          for (const receipt of receipts) {
            if (this.updatedReceiptsToProcess.indexOf(receipt) < 0) {
              this.updatedReceiptsToProcess.push(receipt);
            }
          }
          if (this.updatedReceiptsProcessor !== void 0) {
            clearTimeout(this.updatedReceiptsProcessor);
          }
          this.updatedReceiptsProcessor = setTimeout(() => {
            this._processUpdatedReceipts();
          }, 500);
        }
        _processUpdatedReceipts() {
          this.log.debug("processing " + this.updatedReceiptsToProcess.length + " updated receipts");
          const now = +/* @__PURE__ */ new Date();
          const receipts = this.updatedReceiptsToProcess;
          this.updatedReceiptsToProcess = [];
          receipts.forEach((receipt) => {
            this.delegate.updatedReceiptCallbacks.trigger(receipt, "adapterListener_receiptsUpdated");
            receipt.transactions.forEach((transaction2) => {
              var _a;
              const transactionToken = StoreAdapterListener.makeTransactionToken(transaction2);
              const tokenWithState = transactionToken + "@" + transaction2.state;
              const lastState = this.lastTransactionState[transactionToken];
              const subscriptionKey = StoreAdapterListener.makeSubscriptionKey(transaction2);
              const isSubscriptionDuplicate = !!subscriptionKey && !!this.subscriptionFirstTransactionId[subscriptionKey] && this.subscriptionFirstTransactionId[subscriptionKey] !== transaction2.transactionId;
              if (subscriptionKey && !this.subscriptionFirstTransactionId[subscriptionKey]) {
                this.subscriptionFirstTransactionId[subscriptionKey] = transaction2.transactionId;
              }
              if (transaction2.state === CdvPurchase2.TransactionState.APPROVED) {
                if (isSubscriptionDuplicate) {
                  this.log.debug(`Auto-finishing subscription duplicate ${transactionToken}, already processed as ${this.subscriptionFirstTransactionId[subscriptionKey]}`);
                  this.delegate.finishDuplicate(transaction2);
                } else {
                  const dedupKey = subscriptionKey ? subscriptionKey + "@" + transaction2.state : tokenWithState;
                  const lastCalled = (_a = this.lastCallTimeForState[dedupKey]) !== null && _a !== void 0 ? _a : 0;
                  if (now - lastCalled > 6e4) {
                    this.lastCallTimeForState[dedupKey] = now;
                    this.delegate.approvedCallbacks.trigger(transaction2, "adapterListener_receiptsUpdated_approved");
                  } else {
                    this.log.debug(`Skipping ${tokenWithState}, because it has been last called ${lastCalled > 0 ? Math.round(now - lastCalled) + "ms ago (" + now + "-" + lastCalled + ")" : "never"}`);
                  }
                }
              } else if (lastState !== transaction2.state) {
                if (transaction2.state === CdvPurchase2.TransactionState.INITIATED) {
                  this.lastCallTimeForState[tokenWithState] = now;
                  this.delegate.initiatedCallbacks.trigger(transaction2, "adapterListener_receiptsUpdated_initiated");
                } else if (transaction2.state === CdvPurchase2.TransactionState.FINISHED) {
                  if (isSubscriptionDuplicate) {
                    this.log.debug(`Auto-finishing subscription duplicate ${transactionToken}, already processed as ${this.subscriptionFirstTransactionId[subscriptionKey]}`);
                    this.delegate.finishDuplicate(transaction2);
                  } else {
                    this.lastCallTimeForState[tokenWithState] = now;
                    this.delegate.finishedCallbacks.trigger(transaction2, "adapterListener_receiptsUpdated_finished");
                  }
                } else if (transaction2.state === CdvPurchase2.TransactionState.PENDING) {
                  this.lastCallTimeForState[tokenWithState] = now;
                  this.delegate.pendingCallbacks.trigger(transaction2, "adapterListener_receiptsUpdated_pending");
                }
              }
              if (isSubscriptionDuplicate) {
                this.lastTransactionState[transactionToken] = CdvPurchase2.TransactionState.FINISHED;
              } else {
                this.lastTransactionState[transactionToken] = transaction2.state;
              }
            });
          });
        }
      }
      Internal.StoreAdapterListener = StoreAdapterListener;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class Callbacks {
        /**
         * @param className - Type of callbacks (used to help with debugging)
         * @param finalStateMode - If true, newly registered callbacks will be called immediately when the event was already triggered.
         */
        constructor(logger, className, finalStateMode = false) {
          this.callbacks = [];
          this.numTriggers = 0;
          this.logger = logger;
          this.className = className;
          this.finalStateMode = finalStateMode;
        }
        /** Add a callback to the list */
        push(callback, callbackName) {
          if (this.finalStateMode && this.numTriggers > 0) {
            callback(this.lastTriggerArgument);
          } else {
            for (const existing of this.callbacks) {
              if (existing.callback === callback) {
                throw new Error("REGISTERING THE SAME CALLBACK TWICE? This is indicative of a bug in your integration.");
              }
            }
            this.callbacks.push({ callback, callbackName });
          }
        }
        /** Call all registered callbacks with the given value */
        trigger(value, reason) {
          this.lastTriggerArgument = value;
          this.numTriggers++;
          const callbacks = this.callbacks;
          if (this.finalStateMode) {
            this.callbacks = [];
          }
          callbacks.forEach((callback) => {
            CdvPurchase2.Utils.safeCall(this.logger, this.className, callback.callback, value, callback.callbackName, reason);
          });
        }
        /** Remove a callback from the list */
        remove(callback) {
          this.callbacks = this.callbacks.filter((el2) => el2.callback !== callback);
        }
      }
      Internal.Callbacks = Callbacks;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class ReadyCallbacks {
        constructor(logger) {
          this.isReady = false;
          this.readyCallbacks = [];
          this.logger = logger;
        }
        /** Register a callback to be called when the plugin is ready. */
        add(cb) {
          if (this.isReady)
            return setTimeout(cb, 0);
          this.readyCallbacks.push(cb);
        }
        /** Calls the ready callbacks */
        trigger(reason) {
          this.isReady = true;
          this.readyCallbacks.forEach((cb) => CdvPurchase2.Utils.safeCall(this.logger, "ready()", cb, void 0, void 0, reason));
          this.readyCallbacks = [];
        }
        remove(cb) {
          this.readyCallbacks = this.readyCallbacks.filter((el2) => el2 !== cb);
        }
      }
      Internal.ReadyCallbacks = ReadyCallbacks;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      function isValidRegisteredProduct(product) {
        if (typeof product !== "object")
          return false;
        return product.hasOwnProperty("platform") && product.hasOwnProperty("id") && product.hasOwnProperty("type");
      }
      class RegisteredProducts {
        constructor() {
          this.list = [];
        }
        find(platform, id) {
          return this.list.find((rp) => rp.platform === platform && rp.id === id);
        }
        add(product) {
          const errors = [];
          const products = Array.isArray(product) ? product : [product];
          const newProducts = products.filter((p) => !this.find(p.platform, p.id));
          for (const p of newProducts) {
            if (isValidRegisteredProduct(p)) {
              if (p.platform === CdvPurchase2.Platform.TEST && !CdvPurchase2.Test.testProductsArray.some((tp) => tp.id === p.id)) {
                CdvPurchase2.Test.registerTestProduct(p);
              }
              this.list.push(p);
            } else {
              errors.push(CdvPurchase2.storeError(CdvPurchase2.ErrorCode.LOAD, 'Invalid parameter to "register", expected "id", "type" and "platform". Got: ' + JSON.stringify(p), null, null));
            }
          }
          return errors;
        }
        byPlatform() {
          const byPlatform = {};
          this.list.forEach((p) => {
            byPlatform[p.platform] = (byPlatform[p.platform] || []).concat(p);
          });
          return Object.keys(byPlatform).map((platform) => ({
            platform,
            products: byPlatform[platform]
          }));
        }
      }
      Internal.RegisteredProducts = RegisteredProducts;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class TransactionStateMonitors {
        constructor(when) {
          this.monitors = [];
          this.isListening = false;
          this.when = when;
        }
        findMonitors(transaction2) {
          return this.monitors.filter((monitor) => monitor.transaction.platform === transaction2.platform && monitor.transaction.transactionId === transaction2.transactionId);
        }
        startListening() {
          if (this.isListening) {
            return;
          }
          this.isListening = true;
          this.when.approved((transaction2) => this.callOnChange(transaction2), "transactionStateMonitors_callOnChange").finished((transaction2) => this.callOnChange(transaction2), "transactionStateMonitors_callOnChange");
        }
        callOnChange(transaction2) {
          this.findMonitors(transaction2).forEach((monitor) => {
            if (monitor.lastChange !== transaction2.state) {
              monitor.lastChange = transaction2.state;
              monitor.onChange(transaction2.state);
            }
          });
        }
        /**
         * Start monitoring the provided transaction for state changes.
         */
        start(transaction2, onChange) {
          this.startListening();
          const monitorId = CdvPurchase2.Utils.uuidv4();
          this.monitors.push({ monitorId, transaction: transaction2, onChange, lastChange: transaction2.state });
          setTimeout(onChange, 0, transaction2.state);
          return {
            transaction: transaction2,
            stop: () => this.stop(monitorId)
          };
        }
        stop(monitorId) {
          this.monitors = this.monitors.filter((m) => m.monitorId !== monitorId);
        }
      }
      Internal.TransactionStateMonitors = TransactionStateMonitors;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class ReceiptsMonitor {
        constructor(controller) {
          this.hasCalledReceiptsVerified = false;
          this.controller = controller;
          this.log = controller.log.child("ReceiptsMonitor");
        }
        callReceiptsVerified() {
          if (this.hasCalledReceiptsVerified)
            return;
          this.hasCalledReceiptsVerified = true;
          this.log.info("receiptsVerified()");
          this.controller.when().receiptsReady(() => {
            setTimeout(() => {
              this.controller.receiptsVerified();
            }, 0);
          }, "receiptsMonitor_callReceiptsVerified");
        }
        launch() {
          const check = () => {
            this.log.debug(`check(${this.controller.numValidationResponses()}/${this.controller.numValidationRequests()})`);
            if (this.controller.numValidationRequests() === this.controller.numValidationResponses()) {
              if (this.intervalChecker !== void 0) {
                clearInterval(this.intervalChecker);
                this.intervalChecker = void 0;
              }
              this.controller.off(check);
              this.callReceiptsVerified();
            }
          };
          this.controller.when().verified(check, "receiptsMonitor_check").unverified(check, "receiptsMonitor_check").receiptsReady(() => {
            this.log.debug("receiptsReady...");
            if (!this.controller.hasLocalReceipts() || !this.controller.hasValidator()) {
              setTimeout(() => {
                check();
              }, 0);
            }
            this.intervalChecker = setInterval(() => {
              this.log.debug("keep checking every 10s...");
              check();
            }, 1e4);
          }, "receiptsMonitor_setup");
        }
      }
      Internal.ReceiptsMonitor = ReceiptsMonitor;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class ExpiryMonitor {
        constructor(controller, log) {
          this.activePurchases = {};
          this.notifiedPurchases = {};
          this.activeTransactions = {};
          this.notifiedTransactions = {};
          this.controller = controller;
          this.log = log.child("ExpiryMonitor");
        }
        stop() {
          if (this.interval) {
            clearInterval(this.interval);
            this.interval = void 0;
          }
        }
        launch() {
          this.log.info("Starting expiry monitoring");
          this.stop();
          this.interval = setInterval(() => {
            var _a, _b, _c, _d, _e, _f;
            const now = +/* @__PURE__ */ new Date();
            for (const receipt of this.controller.verifiedReceipts) {
              const gracePeriod = (_a = ExpiryMonitor.GRACE_PERIOD_MS[receipt.platform]) !== null && _a !== void 0 ? _a : ExpiryMonitor.GRACE_PERIOD_MS.DEFAULT;
              for (const purchase of receipt.collection) {
                if (purchase.expiryDate) {
                  const expiryDate = purchase.expiryDate + gracePeriod;
                  const transactionId = (_b = purchase.transactionId) !== null && _b !== void 0 ? _b : `${expiryDate}`;
                  if (expiryDate > now) {
                    this.activePurchases[transactionId] = true;
                  }
                  if (expiryDate < now && this.activePurchases[transactionId] && !this.notifiedPurchases[transactionId]) {
                    this.log.info(`Verified purchase expired: ${transactionId}`);
                    this.notifiedPurchases[transactionId] = true;
                    this.controller.onVerifiedPurchaseExpired(purchase, receipt);
                  }
                }
              }
            }
            for (const receipt of this.controller.localReceipts) {
              for (const transaction2 of receipt.transactions) {
                if (receipt.platform === "android-playstore" && !transaction2.expirationDate) {
                  const googleTransaction = transaction2;
                  if ((_c = googleTransaction.nativePurchase) === null || _c === void 0 ? void 0 : _c.autoRenewing) {
                    const transactionId = (_d = transaction2.transactionId) !== null && _d !== void 0 ? _d : `${now}`;
                    if (!this.activeTransactions[transactionId]) {
                      this.log.debug(`Tracking auto-renewing Google Play subscription without expiration: ${transactionId}`);
                      this.activeTransactions[transactionId] = true;
                    }
                  }
                }
                if (transaction2.expirationDate) {
                  const gracePeriod = (_e = ExpiryMonitor.GRACE_PERIOD_MS[receipt.platform]) !== null && _e !== void 0 ? _e : ExpiryMonitor.GRACE_PERIOD_MS.DEFAULT;
                  const expirationDate = +transaction2.expirationDate + gracePeriod;
                  const transactionId = (_f = transaction2.transactionId) !== null && _f !== void 0 ? _f : `${expirationDate}`;
                  if (expirationDate > now) {
                    this.activeTransactions[transactionId] = true;
                  }
                  if (expirationDate < now && this.activeTransactions[transactionId] && !this.notifiedTransactions[transactionId]) {
                    this.log.info(`Local transaction expired: ${transactionId}`);
                    this.notifiedTransactions[transactionId] = true;
                    this.controller.onTransactionExpired(transaction2);
                  }
                }
              }
            }
          }, ExpiryMonitor.INTERVAL_MS);
        }
      }
      ExpiryMonitor.INTERVAL_MS = 1e4;
      ExpiryMonitor.GRACE_PERIOD_MS = {
        DEFAULT: 6e4,
        "ios-appstore": 6e4,
        "android-playstore": 3e4
      };
      Internal.ExpiryMonitor = ExpiryMonitor;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      function md5toUUID(str) {
        if (!str)
          return "";
        const hash = Utils.md5(str);
        return hash.substring(0, 8) + "-" + hash.substring(8, 12) + "-3" + hash.substring(13, 16) + "-8" + hash.substring(17, 20) + "-" + hash.substring(20, 32);
      }
      Utils.md5toUUID = md5toUUID;
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    class OfflineEntitlements {
      constructor(store2, options = {}) {
        var _a, _b, _c, _d;
        this.cache = {};
        this.lastSeenTimestamp = 0;
        this.isReady = false;
        this.lastEventPerProduct = {};
        this.store = store2;
        this.storage = (_a = options.storage) !== null && _a !== void 0 ? _a : OfflineEntitlements.createLocalStorageAdapter();
        this.gracePeriodMs = (_b = options.gracePeriodMs) !== null && _b !== void 0 ? _b : OfflineEntitlements.DEFAULT_GRACE_PERIOD_MS;
        this.onExpiredOffline = (_c = options.onExpiredOffline) !== null && _c !== void 0 ? _c : "readonly";
        this.detectClockRollback = (_d = options.detectClockRollback) !== null && _d !== void 0 ? _d : false;
        this.eventCallbacks = new CdvPurchase2.Internal.Callbacks(store2.log, "OfflineEntitlements");
        this.store.when().verified((receipt) => {
          void this.onVerified(receipt);
        });
      }
      /** Wrap the global `localStorage` as an async `OfflineStorageAdapter`. */
      static createLocalStorageAdapter() {
        return {
          getItem: (key) => Promise.resolve(localStorage.getItem(key)),
          setItem: (key, value) => {
            localStorage.setItem(key, value);
            return Promise.resolve();
          },
          removeItem: (key) => {
            localStorage.removeItem(key);
            return Promise.resolve();
          }
        };
      }
      /** Load persisted entitlements from storage into the in-memory cache. Idempotent. */
      ready() {
        return __awaiter(this, void 0, void 0, function* () {
          if (this.isReady)
            return;
          yield this.loadFromStorage();
          this.isReady = true;
        });
      }
      /** Reload from storage and re-evaluate. Resolves when the reload is complete. Call after reconnecting or manually. */
      refresh() {
        return this.loadFromStorage();
      }
      /** Register a callback for {@link OfflineEntitlementEvent}s. */
      onEvent(callback) {
        this.eventCallbacks.push(callback);
      }
      /** Remove all persisted entitlements from storage and clear the in-memory cache. For user logout. */
      clear() {
        return __awaiter(this, void 0, void 0, function* () {
          this.cache = {};
          this.lastSeenTimestamp = 0;
          this.isReady = false;
          this.lastEventPerProduct = {};
          yield this.storage.removeItem(OfflineEntitlements.STORAGE_KEY);
        });
      }
      /**
       * Return `true` if the product is owned, using the persisted cache when
       * the in-memory `verifiedReceipts` don't grant ownership.
       *
       * Returns `false` for all products until `ready()` has resolved.
       */
      isOwned(productId) {
        if (!this.isReady) {
          this.store.log.warn('OfflineEntitlements.isOwned("' + productId + '") called before ready() \u2014 returning false. Call await offline.ready() at startup.');
          return false;
        }
        const online = CdvPurchase2.Internal.VerifiedReceipts.isOwned(this.store.verifiedReceipts, { id: productId });
        if (online)
          return true;
        const now = +/* @__PURE__ */ new Date();
        const persisted = this.findPersisted(productId);
        if (!persisted) {
          this.fireEvent("entitlement_missing", productId, "No persisted entitlement for this product.");
          return false;
        }
        if (persisted.expiryDate !== void 0 && persisted.expiryDate !== null) {
          if (this.detectClockRollback && this.lastSeenTimestamp > now) {
            this.fireEvent("clock_rollback", persisted.id, "Clock appears to have rolled back; denying offline entitlement.");
            return false;
          }
          if (persisted.isExpired) {
            this.fireEvent("expired", persisted.id, "Subscription is marked as expired.");
            return false;
          }
          if (now < persisted.expiryDate) {
            return true;
          }
          const renewalIntent = persisted.renewalIntent;
          if (renewalIntent === CdvPurchase2.RenewalIntent.RENEW && now < persisted.expiryDate + this.gracePeriodMs) {
            this.fireEvent("grace", persisted.id, "Subscription expired but within grace period.");
            return true;
          }
          if (renewalIntent === CdvPurchase2.RenewalIntent.LAPSE) {
            return false;
          }
          if (this.onExpiredOffline === "readonly") {
            this.fireEvent("readonly", persisted.id, "Subscription expired and grace period elapsed; granting readonly access.");
            return true;
          }
          return false;
        } else {
          return true;
        }
      }
      /**
       * Retrieve the persisted entitlement for a product, analogous to
       * `store.findInVerifiedReceipts()`.
       *
       * Returns the {@link PersistedPurchase} (with `expiryDate`,
       * `renewalIntent`, `lastRenewalDate`, etc.) if one has been cached,
       * or `undefined` if no offline entitlement exists for this product.
       *
       * Returns `undefined` for all products until `ready()` has resolved.
       *
       * @example
       * ```typescript
       * const entitlement = offline.find('premium');
       * if (entitlement?.expiryDate) {
       *     const daysLeft = Math.ceil((entitlement.expiryDate - Date.now()) / 86400000);
       *     showRenewalBanner(daysLeft);
       * }
       * ```
       */
      find(productId) {
        if (!this.isReady)
          return void 0;
        return this.findPersisted(productId);
      }
      /** Persist all `VerifiedPurchase`s in a verified receipt to storage. */
      onVerified(receipt) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          for (const purchase of receipt.collection) {
            if (purchase.isConsumed)
              continue;
            const platform = (_a = purchase.platform) !== null && _a !== void 0 ? _a : receipt.platform;
            const product = this.store.get(purchase.id, platform);
            if (product && product.type === CdvPurchase2.ProductType.CONSUMABLE)
              continue;
            const key = platform + ":" + purchase.id;
            this.cache[key] = {
              id: purchase.id,
              platform,
              expiryDate: purchase.expiryDate,
              isExpired: purchase.isExpired,
              renewalIntent: purchase.renewalIntent,
              lastRenewalDate: purchase.lastRenewalDate,
              purchaseDate: purchase.purchaseDate,
              cancelationReason: purchase.cancelationReason,
              isBillingRetryPeriod: purchase.isBillingRetryPeriod
            };
          }
          this.lastSeenTimestamp = +/* @__PURE__ */ new Date();
          yield this.saveToStorage();
        });
      }
      /** Find the persisted purchase for a productId across all platforms. */
      findPersisted(productId) {
        var _a, _b, _c, _d;
        let found;
        for (const key of Object.keys(this.cache)) {
          const entry = this.cache[key];
          if (entry.id === productId) {
            if (!found || ((_b = (_a = found.lastRenewalDate) !== null && _a !== void 0 ? _a : found.purchaseDate) !== null && _b !== void 0 ? _b : 0) < ((_d = (_c = entry.lastRenewalDate) !== null && _c !== void 0 ? _c : entry.purchaseDate) !== null && _d !== void 0 ? _d : 0)) {
              found = entry;
            }
          }
        }
        return found;
      }
      /** Load the persisted payload from storage into the in-memory cache. */
      loadFromStorage() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const raw = yield this.storage.getItem(OfflineEntitlements.STORAGE_KEY);
            if (!raw) {
              this.cache = {};
              this.lastSeenTimestamp = 0;
              return;
            }
            const parsed = JSON.parse(raw);
            if (parsed.schemaVersion !== OfflineEntitlements.SCHEMA_VERSION) {
              this.store.log.warn("OfflineEntitlements: schema version mismatch, ignoring cached data.");
              this.cache = {};
              this.lastSeenTimestamp = 0;
              return;
            }
            this.cache = (_a = parsed.receipts) !== null && _a !== void 0 ? _a : {};
            this.lastSeenTimestamp = (_b = parsed.lastSeenTimestamp) !== null && _b !== void 0 ? _b : 0;
          } catch (err) {
            this.store.log.warn("OfflineEntitlements: failed to load from storage: " + err.message);
            this.cache = {};
            this.lastSeenTimestamp = 0;
          }
        });
      }
      /** Serialize the in-memory cache to storage. */
      saveToStorage() {
        return __awaiter(this, void 0, void 0, function* () {
          const payload = {
            receipts: this.cache,
            lastSeenTimestamp: this.lastSeenTimestamp,
            schemaVersion: OfflineEntitlements.SCHEMA_VERSION
          };
          try {
            yield this.storage.setItem(OfflineEntitlements.STORAGE_KEY, JSON.stringify(payload));
          } catch (err) {
            this.store.log.warn("OfflineEntitlements: failed to save to storage: " + err.message);
          }
        });
      }
      /** Fire an event to all registered callbacks, deduplicating per productId. */
      fireEvent(type, productId, message) {
        if (this.lastEventPerProduct[productId] === type)
          return;
        this.lastEventPerProduct[productId] = type;
        this.eventCallbacks.trigger({ type, productId, message }, "offline_entitlements");
      }
    }
    OfflineEntitlements.STORAGE_KEY = "cdvpurchase.offline_entitlements";
    OfflineEntitlements.SCHEMA_VERSION = 1;
    OfflineEntitlements.DEFAULT_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1e3;
    CdvPurchase2.OfflineEntitlements = OfflineEntitlements;
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    CdvPurchase2.PLUGIN_VERSION = "13.19.1";
    class Store2 {
      constructor() {
        this.adapters = new CdvPurchase2.Internal.Adapters();
        this.registeredProducts = new CdvPurchase2.Internal.RegisteredProducts();
        this.log = new CdvPurchase2.Logger(this);
        this.verbosity = CdvPurchase2.LogLevel.ERROR;
        this._legacyObfuscatorNoticeEmitted = false;
        this._readyCallbacks = new CdvPurchase2.Internal.ReadyCallbacks(this.log);
        this.updatedCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "productUpdated()");
        this.updatedReceiptsCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "receiptUpdated()");
        this.initiatedCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "initiated()");
        this.approvedCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "approved()");
        this.finishedCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "finished()");
        this.pendingCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "pending()");
        this.verifiedCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "verified()");
        this.unverifiedCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "unverified()");
        this.receiptsReadyCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "receiptsReady()", true);
        this.receiptsVerifiedCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "receiptsVerified()", true);
        this.errorCallbacks = new CdvPurchase2.Internal.Callbacks(this.log, "error()");
        this._storefronts = new CdvPurchase2.Internal.Storefronts(this.log.child("Storefronts"));
        this.initializedHasBeenCalled = false;
        this.lastUpdate = 0;
        this.minTimeBetweenUpdates = 6e5;
        this.version = CdvPurchase2.PLUGIN_VERSION;
        const store2 = this;
        this.listener = new CdvPurchase2.Internal.StoreAdapterListener({
          updatedCallbacks: this.updatedCallbacks,
          updatedReceiptCallbacks: this.updatedReceiptsCallbacks,
          initiatedCallbacks: this.initiatedCallbacks,
          approvedCallbacks: this.approvedCallbacks,
          finishedCallbacks: this.finishedCallbacks,
          pendingCallbacks: this.pendingCallbacks,
          receiptsReadyCallbacks: this.receiptsReadyCallbacks,
          finishDuplicate: (transaction2) => {
            const adapter = this.adapters.findReady(transaction2.platform);
            if (adapter) {
              adapter.finish(transaction2);
            }
          }
        }, this.log);
        this.transactionStateMonitors = new CdvPurchase2.Internal.TransactionStateMonitors(this.when());
        this._validator = new CdvPurchase2.Internal.Validator({
          adapters: this.adapters,
          getApplicationUsername: this.getApplicationUsername.bind(this),
          obfuscateUsername: this.obfuscateUsername.bind(this),
          get localReceipts() {
            return store2.localReceipts;
          },
          get validator() {
            return store2.validator;
          },
          get validator_privacy_policy() {
            return store2.validator_privacy_policy;
          },
          verifiedCallbacks: this.verifiedCallbacks,
          unverifiedCallbacks: this.unverifiedCallbacks,
          finish: (receipt) => this.finish(receipt)
        }, this.log);
        new CdvPurchase2.Internal.ReceiptsMonitor({
          hasLocalReceipts: () => this.localReceipts.length > 0,
          hasValidator: () => !!this.validator,
          numValidationRequests: () => this._validator.numRequests,
          numValidationResponses: () => this._validator.numResponses,
          off: this.off.bind(this),
          when: this.when.bind(this),
          receiptsVerified: () => {
            store2.receiptsVerifiedCallbacks.trigger(void 0, "receipts_monitor_controller");
          },
          log: this.log
        }).launch();
        this.expiryMonitor = new CdvPurchase2.Internal.ExpiryMonitor({
          get localReceipts() {
            return store2.validator ? [] : store2.localReceipts;
          },
          get verifiedReceipts() {
            return store2.verifiedReceipts;
          },
          onTransactionExpired(transaction2) {
            var _a;
            store2.log.debug(`Local transaction expired (${transaction2.transactionId}), refreshing purchases`);
            if (!store2.validator) {
              const productId = (_a = transaction2.products[0]) === null || _a === void 0 ? void 0 : _a.id;
              if (productId && !store2.owned(productId)) {
                store2.updatedReceiptsCallbacks.trigger(transaction2.parentReceipt, "expiry_monitor_transaction_expired");
              }
            }
          },
          onVerifiedPurchaseExpired(verifiedPurchase, receipt) {
            store2.verify(receipt.sourceReceipt);
          }
        }, this.log);
        this.expiryMonitor.launch();
      }
      /**
       * Retrieve a platform adapter.
       *
       * The platform adapter has to have been initialized before.
       *
       * @see {@link initialize}
       */
      getAdapter(platform) {
        return this.adapters.find(platform);
      }
      /**
       * Get the application username as a string by either calling or returning {@link Store.applicationUsername}
      */
      getApplicationUsername() {
        if (this.applicationUsername instanceof Function)
          return this.applicationUsername();
        return this.applicationUsername;
      }
      /**
       * Obfuscate the application username according to the configured obfuscation strategy.
       *
       * See {@link Obfuscator} for the per-mode output format.
       *
       * @internal
       */
      obfuscateUsername(applicationUsername, platform) {
        var _a;
        if (!applicationUsername)
          return void 0;
        const obfuscator = (_a = this.obfuscator) !== null && _a !== void 0 ? _a : "legacy";
        if (typeof obfuscator === "function") {
          return obfuscator(applicationUsername, platform);
        }
        switch (obfuscator) {
          case "disabled":
            return applicationUsername;
          case "uuid":
            return CdvPurchase2.Utils.md5toUUID(applicationUsername);
          case "legacy":
          default:
            if (!this._legacyObfuscatorNoticeEmitted) {
              this._legacyObfuscatorNoticeEmitted = true;
              this.log.info('store.obfuscator defaults to "legacy" for backward compatibility. New integrations should set store.obfuscator = "uuid". See https://github.com/j3k0/cordova-plugin-purchase/issues/1665');
            }
            if (platform === CdvPurchase2.Platform.GOOGLE_PLAY) {
              return CdvPurchase2.Utils.md5(applicationUsername);
            }
            return CdvPurchase2.Utils.md5toUUID(applicationUsername);
        }
      }
      /**
       * Register a product.
       *
       * @example
       * store.register([{
       *       id: 'subscription1',
       *       type: ProductType.PAID_SUBSCRIPTION,
       *       platform: Platform.APPLE_APPSTORE,
       *   }, {
       *       id: 'subscription1',
       *       type: ProductType.PAID_SUBSCRIPTION,
       *       platform: Platform.GOOGLE_PLAY,
       *   }, {
       *       id: 'consumable1',
       *       type: ProductType.CONSUMABLE,
       *       platform: Platform.BRAINTREE,
       *   }]);
       *
       * // Can also be used in development to register test products
       * store.register([{
       *   id: 'my-custom-product',
       *   type: CdvPurchase.ProductType.CONSUMABLE,
       *   platform: CdvPurchase.Platform.TEST,
       *   title: '...',
       *   description: 'A custom test consumable product',
       *   pricing: {
       *     price: '$2.99',
       *     currency: 'USD',
       *     priceMicros: 2990000
       *   }
       * }]);
       */
      register(product) {
        const errors = this.registeredProducts.add(product);
        errors.forEach((error) => {
          CdvPurchase2.store.errorCallbacks.trigger(error, "register_error");
          this.log.error(error);
        });
      }
      /**
       * Call to initialize the in-app purchase plugin.
       *
       * @param platforms - List of payment platforms to initialize, default to Store.defaultPlatform().
       */
      initialize(platforms = [this.defaultPlatform()]) {
        return __awaiter(this, void 0, void 0, function* () {
          if (this.initializedHasBeenCalled) {
            this.log.warn("store.initialized() has been called already.");
            return [];
          }
          this.log.info("initialize(" + JSON.stringify(platforms) + ") v" + CdvPurchase2.PLUGIN_VERSION);
          this.initializedHasBeenCalled = true;
          this.lastUpdate = +/* @__PURE__ */ new Date();
          const store2 = this;
          const ret = this.adapters.initialize(platforms, {
            error: this.triggerError.bind(this),
            get verbosity() {
              return store2.verbosity;
            },
            getApplicationUsername() {
              return store2.getApplicationUsername();
            },
            obfuscateUsername: (username, platform) => store2.obfuscateUsername(username, platform),
            get obfuscator() {
              return store2.obfuscator;
            },
            get listener() {
              return store2.listener;
            },
            get log() {
              return store2.log;
            },
            get registeredProducts() {
              return store2.registeredProducts;
            },
            get storefronts() {
              return store2._storefronts;
            },
            apiDecorators: {
              canPurchase: this.canPurchase.bind(this),
              owned: this.owned.bind(this),
              finish: this.finish.bind(this),
              order: this.order.bind(this),
              verify: this.verify.bind(this)
            }
          });
          ret.then(() => {
            this._readyCallbacks.trigger("initialize_promise_resolved");
            this.listener.setSupportedPlatforms(this.adapters.list.filter((a) => a.isSupported).map((a) => a.id));
          });
          return ret;
        });
      }
      /**
       * @deprecated - use store.initialize(), store.update() or store.restorePurchases()
       */
      refresh() {
        throw new Error("use store.initialize() or store.update()");
      }
      /**
       * Call to refresh the price of products and status of purchases.
       */
      update() {
        return __awaiter(this, void 0, void 0, function* () {
          this.log.info("update()");
          if (!this._readyCallbacks.isReady) {
            this.log.warn("Do not call store.update() at startup! It is meant to reload the price of products (if needed) long after initialization.");
            return;
          }
          const now = +/* @__PURE__ */ new Date();
          if (this.lastUpdate > now - this.minTimeBetweenUpdates) {
            this.log.info("Skipping store.update() as the last call occurred less than store.minTimeBetweenUpdates millis ago.");
            return;
          }
          this.lastUpdate = now;
          for (const registration of this.registeredProducts.byPlatform()) {
            const adapter = this.adapters.findReady(registration.platform);
            const products = yield adapter === null || adapter === void 0 ? void 0 : adapter.loadProducts(registration.products);
            products === null || products === void 0 ? void 0 : products.forEach((p) => {
              if (p instanceof CdvPurchase2.Product)
                this.updatedCallbacks.trigger(p, "update_has_loaded_products");
            });
            if (adapter) {
              this._storefronts.refreshWith(adapter).catch(() => {
              });
            }
          }
        });
      }
      /**
       * Register a callback to be called when the plugin is ready.
       *
       * This happens when all the platforms are initialized and their products loaded.
       */
      ready(cb) {
        this._readyCallbacks.add(cb);
      }
      /** true if the plugin is initialized and ready */
      get isReady() {
        return this._readyCallbacks.isReady;
      }
      /**
       * Register event callbacks.
       *
       * Events overview:
       * - `productUpdated`: Called when product metadata is loaded from the store
       * - `receiptUpdated`: Called when local receipt information changes (ownership status change, for example)
       * - `verified`: Called after successful receipt validation (requires a receipt validator)
       *
       * @example
       * // Monitor ownership with receipt validation
       * store.when()
       *      .approved(transaction => transaction.verify())
       *      .verified(receipt => {
       *          if (store.owned("my-product")) {
       *              // Product is owned and verified
       *          }
       *      });
       *
       * @example
       * // Monitor ownership without receipt validation
       * store.when().receiptUpdated(receipt => {
       *   if (store.owned("my-product")) {
       *     // Product is owned according to local data
       *   }
       * });
       */
      when() {
        const ret = {
          productUpdated: (cb, callbackName) => (this.updatedCallbacks.push(cb, callbackName), ret),
          receiptUpdated: (cb, callbackName) => (this.updatedReceiptsCallbacks.push(cb, callbackName), ret),
          updated: (cb, callbackName) => (this.updatedCallbacks.push(cb, callbackName), this.updatedReceiptsCallbacks.push(cb, callbackName), ret),
          // owned: (cb: Callback<Product>) => (this.ownedCallbacks.push(cb), ret),
          approved: (cb, callbackName) => (this.approvedCallbacks.push(cb, callbackName), ret),
          initiated: (cb, callbackName) => (this.initiatedCallbacks.push(cb, callbackName), ret),
          pending: (cb, callbackName) => (this.pendingCallbacks.push(cb, callbackName), ret),
          finished: (cb, callbackName) => (this.finishedCallbacks.push(cb, callbackName), ret),
          verified: (cb, callbackName) => (this.verifiedCallbacks.push(cb, callbackName), ret),
          unverified: (cb, callbackName) => (this.unverifiedCallbacks.push(cb, callbackName), ret),
          receiptsReady: (cb, callbackName) => (this.receiptsReadyCallbacks.push(cb, callbackName), ret),
          receiptsVerified: (cb, callbackName) => (this.receiptsVerifiedCallbacks.push(cb, callbackName), ret),
          storefrontUpdated: (cb, callbackName) => (this._storefronts.listen(cb, callbackName), ret)
        };
        return ret;
      }
      /**
       * Remove a callback from any listener it might have been added to.
       */
      off(callback) {
        this.updatedCallbacks.remove(callback);
        this.updatedReceiptsCallbacks.remove(callback);
        this.approvedCallbacks.remove(callback);
        this.finishedCallbacks.remove(callback);
        this.pendingCallbacks.remove(callback);
        this.verifiedCallbacks.remove(callback);
        this.unverifiedCallbacks.remove(callback);
        this.receiptsReadyCallbacks.remove(callback);
        this.receiptsVerifiedCallbacks.remove(callback);
        this.errorCallbacks.remove(callback);
        this._readyCallbacks.remove(callback);
        this._storefronts.off(callback);
      }
      /**
       * Setup a function to be notified of changes to a transaction state.
       *
       * @param transaction The transaction to monitor.
       * @param onChange Function to be called when the transaction status changes.
       * @return A monitor which can be stopped with `monitor.stop()`
       *
       * @example
       * const monitor = store.monitor(transaction, state => {
       *   console.log('new state: ' + state);
       *   if (state === TransactionState.FINISHED)
       *     monitor.stop();
       * });
       */
      monitor(transaction2, onChange, callbackName) {
        return this.transactionStateMonitors.start(transaction2, CdvPurchase2.Utils.safeCallback(this.log, "monitor()", onChange, callbackName, "transactionStateMonitors_stateChanged"));
      }
      /**
       * List of all active products.
       *
       * Products are active if their details have been successfully loaded from the store.
       */
      get products() {
        return [].concat(...this.adapters.list.map((a) => a.products));
      }
      /**
       * Find a product from its id and platform
       *
       * @param productId Product identifier on the platform.
       * @param platform The product the product exists in. Can be omitted if you're only using a single payment platform.
       */
      get(productId, platform) {
        var _a;
        return (_a = this.adapters.findReady(platform)) === null || _a === void 0 ? void 0 : _a.products.find((p) => p.id === productId);
      }
      /**
       * List of all receipts present on the device.
       */
      get localReceipts() {
        return [].concat(...this.adapters.list.map((a) => a.receipts));
      }
      /** List of all transaction from the local receipts. */
      get localTransactions() {
        const ret = [];
        for (const receipt of this.localReceipts) {
          ret.push(...receipt.transactions);
        }
        return ret;
      }
      /**
       * List of receipts verified with the receipt validation service.
       *
       * Those receipt contains more information and are generally more up-to-date than the local ones.
       */
      get verifiedReceipts() {
        return this._validator.verifiedReceipts;
      }
      /**
       * List of all purchases from the verified receipts.
       */
      get verifiedPurchases() {
        return CdvPurchase2.Internal.VerifiedReceipts.getVerifiedPurchases(this.verifiedReceipts);
      }
      /**
       * Find the last verified purchase for a given product, from those verified by the receipt validator.
       */
      findInVerifiedReceipts(product) {
        return CdvPurchase2.Internal.VerifiedReceipts.find(this.verifiedReceipts, product);
      }
      /**
       * Find the latest transaction for a given product, from those reported by the device.
       */
      findInLocalReceipts(product) {
        return CdvPurchase2.Internal.LocalReceipts.find(this.localReceipts, product);
      }
      /** Return true if a product or offer can be purchased */
      canPurchase(offer) {
        const product = offer instanceof CdvPurchase2.Offer ? this.get(offer.productId, offer.platform) : offer;
        const adapter = this.adapters.findReady(offer.platform);
        if (!(adapter === null || adapter === void 0 ? void 0 : adapter.checkSupport("order")))
          return false;
        return CdvPurchase2.Internal.LocalReceipts.canPurchase(this.localReceipts, product);
      }
      /**
       * Return true if a product is owned
       *
       * Important: The value will be false when the app starts and will only become
       * true after purchase receipts have been loaded and validated. Without receipt validation,
       * it might remain false depending on the platform, make sure to store the ownership status
       * of non-consumable products in some way.
       *
       * @param product - The product object or identifier of the product.
       */
      owned(product) {
        return CdvPurchase2.Internal.owned({
          product: typeof product === "string" ? { id: product } : product,
          verifiedReceipts: this.validator ? this.verifiedReceipts : void 0,
          localReceipts: this.localReceipts
        });
      }
      /**
       * Place an order for a given offer.
       */
      order(offer, additionalData) {
        return __awaiter(this, void 0, void 0, function* () {
          this.log.info(`order(${offer.productId})`);
          const adapter = this.adapters.findReady(offer.platform);
          if (!adapter)
            return CdvPurchase2.storeError(CdvPurchase2.ErrorCode.PAYMENT_NOT_ALLOWED, "Adapter not found or not ready (" + offer.platform + ")", offer.platform, null);
          const ret = yield adapter.order(offer, additionalData || {});
          if (ret && "isError" in ret)
            CdvPurchase2.store.triggerError(ret);
          this._storefronts.refreshWith(adapter).catch(() => {
          });
          return ret;
        });
      }
      /**
       * Request a payment.
       *
       * A payment is a custom amount to charge the user. Make sure the selected payment platform
       * supports Payment Requests.
       *
       * @param paymentRequest Parameters of the payment request
       * @param additionalData Additional parameters
       */
      requestPayment(paymentRequest, additionalData) {
        var _a, _b, _c, _d, _e;
        const adapter = this.adapters.findReady(paymentRequest.platform);
        if (!adapter)
          return CdvPurchase2.PaymentRequestPromise.failed(CdvPurchase2.ErrorCode.PAYMENT_NOT_ALLOWED, "Adapter not found or not ready (" + paymentRequest.platform + ")", paymentRequest.platform, null);
        if (!paymentRequest.amountMicros) {
          paymentRequest.amountMicros = 0;
          for (const item of paymentRequest.items) {
            paymentRequest.amountMicros += (_b = (_a = item === null || item === void 0 ? void 0 : item.pricing) === null || _a === void 0 ? void 0 : _a.priceMicros) !== null && _b !== void 0 ? _b : 0;
          }
        }
        if (!paymentRequest.currency) {
          for (const item of paymentRequest.items) {
            if ((_c = item === null || item === void 0 ? void 0 : item.pricing) === null || _c === void 0 ? void 0 : _c.currency) {
              paymentRequest.currency = item.pricing.currency;
            }
          }
        } else {
          for (const item of paymentRequest.items) {
            if ((_d = item === null || item === void 0 ? void 0 : item.pricing) === null || _d === void 0 ? void 0 : _d.currency) {
              if (paymentRequest.currency !== item.pricing.currency) {
                return CdvPurchase2.PaymentRequestPromise.failed(CdvPurchase2.ErrorCode.PAYMENT_INVALID, "Currencies do not match", paymentRequest.platform, item.id);
              }
            } else if (item === null || item === void 0 ? void 0 : item.pricing) {
              item.pricing.currency = paymentRequest.currency;
            }
          }
        }
        if (paymentRequest.items.length === 1) {
          const item = paymentRequest.items[0];
          if (item && !item.pricing) {
            item.pricing = {
              priceMicros: (_e = paymentRequest.amountMicros) !== null && _e !== void 0 ? _e : 0,
              currency: paymentRequest.currency
            };
          }
        }
        const promise = new CdvPurchase2.PaymentRequestPromise();
        adapter.requestPayment(paymentRequest, additionalData).then((result) => {
          this._storefronts.refreshWith(adapter).catch(() => {
          });
          promise.trigger(result);
          if (result instanceof CdvPurchase2.Transaction) {
            const onStateChange = (state2) => {
              promise.trigger(result);
              if (result.state === CdvPurchase2.TransactionState.FINISHED)
                monitor.stop();
            };
            const monitor = this.monitor(result, onStateChange, "requestPayment_onStateChange");
          }
        });
        return promise;
      }
      /**
       * Returns true if a platform supports the requested functionality.
       *
       * @example
       * store.checkSupport(Platform.APPLE_APPSTORE, 'requestPayment');
       * // => false
       */
      checkSupport(platform, functionality) {
        const adapter = this.adapters.find(platform);
        if (!adapter)
          return false;
        return adapter.checkSupport(functionality);
      }
      /**
       * Verify a receipt or transacting with the receipt validation service.
       *
       * This will be called from the Receipt or Transaction objects using the API decorators.
       */
      verify(receiptOrTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
          this.log.info(`verify(${receiptOrTransaction.className})`);
          this._validator.add(receiptOrTransaction);
          setTimeout(() => this._validator.run(), 200);
        });
      }
      /**
       * Finalize a transaction.
       *
       * This will be called from the Receipt, Transaction or VerifiedReceipt objects using the API decorators.
       *
       * If the transaction has already been consumed or acknowledged according to the verification API,
       * the native platform's finish method will be skipped to avoid errors.
       */
      finish(receipt) {
        return __awaiter(this, void 0, void 0, function* () {
          this.log.info(`finish(${receipt.className})`);
          const transactions = receipt instanceof CdvPurchase2.VerifiedReceipt ? receipt.sourceReceipt.transactions : receipt instanceof CdvPurchase2.Receipt ? receipt.transactions : [receipt];
          transactions.forEach((transaction2) => {
            var _a;
            let skipNativeFinish = false;
            if (this.validator && receipt instanceof CdvPurchase2.VerifiedReceipt) {
              const verifiedPurchase = receipt.collection.find((p) => {
                return p.transactionId && p.transactionId === transaction2.transactionId;
              });
              if (verifiedPurchase) {
                if (verifiedPurchase.isAcknowledged === true) {
                  this.log.info(`Transaction ${transaction2.transactionId} already acknowledged according to verification API`);
                  transaction2.isAcknowledged = true;
                  skipNativeFinish = true;
                }
                if (verifiedPurchase.isConsumed === true) {
                  this.log.info(`Transaction ${transaction2.transactionId} already consumed according to verification API`);
                  transaction2.isConsumed = true;
                  skipNativeFinish = true;
                }
              }
            }
            const adapter = this.adapters.findReady(transaction2.platform);
            if ((adapter === null || adapter === void 0 ? void 0 : adapter.canSkipFinish) && skipNativeFinish && transaction2.state === CdvPurchase2.TransactionState.APPROVED) {
              transaction2.state = CdvPurchase2.TransactionState.FINISHED;
            } else {
              (_a = this.adapters.findReady(transaction2.platform)) === null || _a === void 0 ? void 0 : _a.finish(transaction2);
            }
          });
        });
      }
      /**
       * Replay the users transactions.
       *
       * This method exists to cover an Apple AppStore requirement.
       */
      restorePurchases() {
        return __awaiter(this, void 0, void 0, function* () {
          let error;
          for (const adapter of this.adapters.list) {
            if (adapter.ready) {
              error = error !== null && error !== void 0 ? error : yield adapter.restorePurchases();
              this._storefronts.refreshWith(adapter).catch(() => {
              });
            }
          }
          return error;
        });
      }
      /**
       * Open the subscription management interface for the selected platform.
       *
       * If platform is not specified, the first available platform will be used.
       *
       * @example
       * const activeSubscription: Purchase = // ...
       * store.manageSubscriptions(activeSubscription.platform);
       */
      manageSubscriptions(platform) {
        return __awaiter(this, void 0, void 0, function* () {
          this.log.info("manageSubscriptions()");
          const adapter = this.adapters.findReady(platform);
          if (!adapter)
            return CdvPurchase2.storeError(CdvPurchase2.ErrorCode.SETUP, "Found no adapter ready to handle 'manageSubscription'", platform !== null && platform !== void 0 ? platform : null, null);
          return adapter.manageSubscriptions();
        });
      }
      /**
       * Opens the billing methods page on AppStore, Play, Microsoft, ...
       *
       * From this page, the user can update their payment methods.
       *
       * If platform is not specified, the first available platform will be used.
       *
       * @example
       * if (purchase.isBillingRetryPeriod)
       *     store.manageBilling(purchase.platform);
       */
      manageBilling(platform) {
        return __awaiter(this, void 0, void 0, function* () {
          this.log.info("manageBilling()");
          const adapter = this.adapters.findReady(platform);
          if (!adapter)
            return CdvPurchase2.storeError(CdvPurchase2.ErrorCode.SETUP, "Found no adapter ready to handle 'manageBilling'", platform !== null && platform !== void 0 ? platform : null, null);
          return adapter.manageBilling();
        });
      }
      /**
       * Retrieve the billing country code from the platform's storefront.
       *
       * Returns a `Storefront` object with the platform and its ISO 3166-1
       * alpha-2 country code (e.g., "US", "FR"). The country code may be
       * undefined if the underlying fetch has not yet completed or failed —
       * the platform is still reported. Returns `undefined` only when no
       * matching adapter is ready.
       *
       * The cache is populated before the `storeReady` event fires (with a
       * best-effort timeout), and refreshed after orders and `restorePurchases()`.
       *
       * @param platform - Optional platform. If omitted, returns the first
       *                   cached non-empty storefront, or a `{ platform, countryCode: undefined }`
       *                   object for the first ready adapter.
       *
       * @example
       * const storefront = store.getStorefront();
       * if (storefront?.countryCode) {
       *     console.log(`Billing country: ${storefront.countryCode}`);
       * }
       */
      getStorefront(platform) {
        if (platform) {
          const adapter = this.adapters.findReady(platform);
          if (!adapter)
            return void 0;
          return this._storefronts.getValueFor(platform);
        }
        const cached = this._storefronts.getValueFor();
        if (cached)
          return cached;
        const firstReady = this.adapters.findReady();
        if (!firstReady)
          return void 0;
        return { platform: firstReady.id, countryCode: void 0 };
      }
      /**
       * The default payment platform to use depending on the OS.
       *
       * - on iOS: `APPLE_APPSTORE`
       * - on Android: `GOOGLE_PLAY`
       */
      defaultPlatform() {
        switch (CdvPurchase2.Utils.platformId()) {
          case "android":
            return CdvPurchase2.Platform.GOOGLE_PLAY;
          case "ios":
            return CdvPurchase2.Platform.APPLE_APPSTORE;
          default:
            return CdvPurchase2.Platform.TEST;
        }
      }
      /**
       * Register an error handler.
       *
       * @param error An error callback that takes the error as an argument
       *
       * @example
       * store.error(function(error) {
       *   console.error('CdvPurchase ERROR: ' + error.message);
       * });
       */
      error(error) {
        this.errorCallbacks.push(error);
      }
      /**
       * Trigger an error event.
       *
       * @internal
       */
      triggerError(error) {
        this.errorCallbacks.trigger(error, "triggerError");
      }
    }
    CdvPurchase2.Store = Store2;
  })(CdvPurchase || (CdvPurchase = {}));
  initCDVPurchase();
  function initCDVPurchase() {
    var _a;
    console.log("Create CdvPurchase...");
    const oldStore = (_a = window.CdvPurchase) === null || _a === void 0 ? void 0 : _a.store;
    window.CdvPurchase = CdvPurchase;
    if (oldStore) {
      window.CdvPurchase.store = oldStore;
    } else {
      window.CdvPurchase.store = new CdvPurchase.Store();
    }
    Object.assign(window.CdvPurchase.store, CdvPurchase.LogLevel, CdvPurchase.ProductType, CdvPurchase.ErrorCode, CdvPurchase.Platform);
  }
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(ProductType2) {
      ProductType2["CONSUMABLE"] = "consumable";
      ProductType2["NON_CONSUMABLE"] = "non consumable";
      ProductType2["FREE_SUBSCRIPTION"] = "free subscription";
      ProductType2["PAID_SUBSCRIPTION"] = "paid subscription";
      ProductType2["NON_RENEWING_SUBSCRIPTION"] = "non renewing subscription";
      ProductType2["APPLICATION"] = "application";
    })(CdvPurchase2.ProductType || (CdvPurchase2.ProductType = {}));
    (function(RecurrenceMode) {
      RecurrenceMode["NON_RECURRING"] = "NON_RECURRING";
      RecurrenceMode["FINITE_RECURRING"] = "FINITE_RECURRING";
      RecurrenceMode["INFINITE_RECURRING"] = "INFINITE_RECURRING";
    })(CdvPurchase2.RecurrenceMode || (CdvPurchase2.RecurrenceMode = {}));
    (function(PaymentMode) {
      PaymentMode["PAY_AS_YOU_GO"] = "PayAsYouGo";
      PaymentMode["UP_FRONT"] = "UpFront";
      PaymentMode["FREE_TRIAL"] = "FreeTrial";
    })(CdvPurchase2.PaymentMode || (CdvPurchase2.PaymentMode = {}));
    (function(Platform2) {
      Platform2["APPLE_APPSTORE"] = "ios-appstore";
      Platform2["GOOGLE_PLAY"] = "android-playstore";
      Platform2["WINDOWS_STORE"] = "windows-store-transaction";
      Platform2["BRAINTREE"] = "braintree";
      Platform2["TEST"] = "test";
      Platform2["IAPTIC_JS"] = "iaptic-js";
    })(CdvPurchase2.Platform || (CdvPurchase2.Platform = {}));
    (function(TransactionState) {
      TransactionState["INITIATED"] = "initiated";
      TransactionState["PENDING"] = "pending";
      TransactionState["APPROVED"] = "approved";
      TransactionState["CANCELLED"] = "cancelled";
      TransactionState["FINISHED"] = "finished";
      TransactionState["UNKNOWN_STATE"] = "";
    })(CdvPurchase2.TransactionState || (CdvPurchase2.TransactionState = {}));
    (function(RenewalIntent) {
      RenewalIntent["LAPSE"] = "Lapse";
      RenewalIntent["RENEW"] = "Renew";
    })(CdvPurchase2.RenewalIntent || (CdvPurchase2.RenewalIntent = {}));
    (function(PriceConsentStatus) {
      PriceConsentStatus["NOTIFIED"] = "Notified";
      PriceConsentStatus["AGREED"] = "Agreed";
    })(CdvPurchase2.PriceConsentStatus || (CdvPurchase2.PriceConsentStatus = {}));
    (function(CancelationReason) {
      CancelationReason["NOT_CANCELED"] = "";
      CancelationReason["DEVELOPER"] = "Developer";
      CancelationReason["SYSTEM"] = "System";
      CancelationReason["SYSTEM_REPLACED"] = "System.Replaced";
      CancelationReason["SYSTEM_PRODUCT_UNAVAILABLE"] = "System.ProductUnavailable";
      CancelationReason["SYSTEM_BILLING_ERROR"] = "System.BillingError";
      CancelationReason["SYSTEM_DELETED"] = "System.Deleted";
      CancelationReason["CUSTOMER"] = "Customer";
      CancelationReason["CUSTOMER_TECHNICAL_ISSUES"] = "Customer.TechnicalIssues";
      CancelationReason["CUSTOMER_PRICE_INCREASE"] = "Customer.PriceIncrease";
      CancelationReason["CUSTOMER_COST"] = "Customer.Cost";
      CancelationReason["CUSTOMER_FOUND_BETTER_APP"] = "Customer.FoundBetterApp";
      CancelationReason["CUSTOMER_NOT_USEFUL_ENOUGH"] = "Customer.NotUsefulEnough";
      CancelationReason["CUSTOMER_OTHER_REASON"] = "Customer.OtherReason";
      CancelationReason["UNKNOWN"] = "Unknown";
    })(CdvPurchase2.CancelationReason || (CdvPurchase2.CancelationReason = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    class Offer {
      /** @internal */
      constructor(options, decorator) {
        this.className = "Offer";
        this.id = options.id;
        this.pricingPhases = options.pricingPhases;
        Object.defineProperty(this, "productId", { enumerable: true, get: () => options.product.id });
        Object.defineProperty(this, "productType", { enumerable: true, get: () => options.product.type });
        Object.defineProperty(this, "productGroup", { enumerable: true, get: () => options.product.group });
        Object.defineProperty(this, "platform", { enumerable: true, get: () => options.product.platform });
        Object.defineProperty(this, "order", { enumerable: false, get: () => (additionalData) => decorator.order(this, additionalData) });
        Object.defineProperty(this, "canPurchase", { enumerable: false, get: () => decorator.canPurchase(this) });
      }
      /** Identifier of the product related to this offer */
      get productId() {
        return "";
      }
      /** Type of the product related to this offer */
      get productType() {
        return CdvPurchase2.ProductType.APPLICATION;
      }
      /** Group the product related to this offer is member of */
      get productGroup() {
        return void 0;
      }
      /** Platform this offer is available from */
      get platform() {
        return CdvPurchase2.Platform.TEST;
      }
      /**
       * Initiate a purchase of this offer.
       *
       * @example
       * store.get("my-product").getOffer().order();
       */
      order(additionalData) {
        return __awaiter(this, void 0, void 0, function* () {
          return;
        });
      }
      /**
       * true if the offer can be purchased.
       */
      get canPurchase() {
        return false;
      }
    }
    CdvPurchase2.Offer = Offer;
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    class PaymentRequestPromise {
      constructor() {
        this.failedCallbacks = new CdvPurchase2.Internal.PromiseLike();
        this.initiatedCallbacks = new CdvPurchase2.Internal.PromiseLike();
        this.approvedCallbacks = new CdvPurchase2.Internal.PromiseLike();
        this.finishedCallbacks = new CdvPurchase2.Internal.PromiseLike();
        this.cancelledCallback = new CdvPurchase2.Internal.PromiseLike();
      }
      failed(callback) {
        this.failedCallbacks.push(callback);
        return this;
      }
      initiated(callback) {
        this.initiatedCallbacks.push(callback);
        return this;
      }
      approved(callback) {
        this.approvedCallbacks.push(callback);
        return this;
      }
      finished(callback) {
        this.finishedCallbacks.push(callback);
        return this;
      }
      cancelled(callback) {
        this.cancelledCallback.push(callback);
        return this;
      }
      /** @internal */
      trigger(argument) {
        if (!argument) {
          this.cancelledCallback.resolve();
        } else if ("isError" in argument) {
          this.failedCallbacks.resolve(argument);
        } else {
          switch (argument.state) {
            case CdvPurchase2.TransactionState.INITIATED:
              this.initiatedCallbacks.resolve(argument);
              break;
            case CdvPurchase2.TransactionState.APPROVED:
              this.approvedCallbacks.resolve(argument);
              break;
            case CdvPurchase2.TransactionState.FINISHED:
              this.finishedCallbacks.resolve(argument);
              break;
          }
        }
        return this;
      }
      /**
       * Return a failed promise.
       *
       * @internal
       */
      static failed(code, message, platform, productId) {
        return new PaymentRequestPromise().trigger(CdvPurchase2.storeError(code, message, platform, productId));
      }
      /**
       * Return a failed promise.
       *
       * @internal
       */
      static cancelled() {
        return new PaymentRequestPromise().trigger();
      }
      /**
       * Return an initiated transaction.
       *
       * @internal
       */
      static initiated(transaction2) {
        return new PaymentRequestPromise().trigger(transaction2);
      }
    }
    CdvPurchase2.PaymentRequestPromise = PaymentRequestPromise;
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    class Receipt {
      /** @internal */
      constructor(platform, decorator) {
        this.className = "Receipt";
        this.transactions = [];
        this.platform = platform;
        Object.defineProperty(this, "verify", { "enumerable": false, get() {
          return () => decorator.verify(this);
        } });
        Object.defineProperty(this, "finish", { "enumerable": false, get() {
          return () => decorator.finish(this);
        } });
      }
      /** Verify a receipt */
      verify() {
        return __awaiter(this, void 0, void 0, function* () {
        });
      }
      /** Finish all transactions in a receipt */
      finish() {
        return __awaiter(this, void 0, void 0, function* () {
        });
      }
      /** Return true if the receipt contains the given transaction */
      hasTransaction(value) {
        return !!this.transactions.find((t) => t === value);
      }
      /** Return the last transaction in this receipt */
      lastTransaction() {
        return this.transactions[this.transactions.length - 1];
      }
    }
    CdvPurchase2.Receipt = Receipt;
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    class Transaction {
      /** @internal */
      constructor(platform, parentReceipt, decorator) {
        this.className = "Transaction";
        this.transactionId = "";
        this.state = CdvPurchase2.TransactionState.UNKNOWN_STATE;
        this.products = [];
        this.platform = platform;
        Object.defineProperty(this, "finish", { "enumerable": false, get() {
          return () => decorator.finish(this);
        } });
        Object.defineProperty(this, "verify", { "enumerable": false, get() {
          return () => decorator.verify(this);
        } });
        Object.defineProperty(this, "parentReceipt", { "enumerable": false, get() {
          return parentReceipt;
        } });
      }
      /**
       * Finish a transaction.
       *
       * When the application has delivered the product, it should finalizes the order.
       * Only after that, money will be transferred to your account.
       * This method ensures that no customers is charged for a product that couldn't be delivered.
       *
       * @example
       * store.when()
       *   .approved(transaction => transaction.verify())
       *   .verified(receipt => receipt.finish())
       */
      finish() {
        return __awaiter(this, void 0, void 0, function* () {
        });
      }
      // actual implementation in the constructor
      /**
       * Verify a transaction.
       *
       * This will trigger a call to the receipt validation service for the attached receipt.
       * Once the receipt has been verified, you can finish the transaction.
       *
       * @example
       * store.when()
       *   .approved(transaction => transaction.verify())
       *   .verified(receipt => receipt.finish())
       */
      verify() {
        return __awaiter(this, void 0, void 0, function* () {
        });
      }
      // actual implementation in the constructor
      /**
       * Return the receipt this transaction is part of.
       */
      get parentReceipt() {
        return {};
      }
      // actual implementation in the constructor
    }
    CdvPurchase2.Transaction = Transaction;
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class LocalReceipts {
        /**
         * Find the latest transaction for a given product, from those reported by the device.
         */
        static find(localReceipts, product) {
          var _a, _b;
          if (!product)
            return void 0;
          let found;
          for (const receipt of localReceipts) {
            if (product.platform && receipt.platform !== product.platform)
              continue;
            for (const transaction2 of receipt.transactions) {
              for (const trProducts of transaction2.products) {
                if (trProducts.id === product.id) {
                  if (!found || ((_a = transaction2.purchaseDate) !== null && _a !== void 0 ? _a : 0) < ((_b = found.purchaseDate) !== null && _b !== void 0 ? _b : 1))
                    found = transaction2;
                }
              }
            }
          }
          return found;
        }
        /** Return true if a product is owned */
        static isOwned(localReceipts, product) {
          if (!product)
            return false;
          const transaction2 = LocalReceipts.find(localReceipts, product);
          if (!transaction2)
            return false;
          if (transaction2.isConsumed)
            return false;
          if (transaction2.isPending)
            return false;
          if (transaction2.expirationDate)
            return transaction2.expirationDate.getTime() > +/* @__PURE__ */ new Date();
          return true;
        }
        static canPurchase(localReceipts, product) {
          if (!product)
            return false;
          const transaction2 = LocalReceipts.find(localReceipts, product);
          if (!transaction2)
            return true;
          if (transaction2.isConsumed)
            return true;
          if (transaction2.isPending)
            return false;
          if (transaction2.expirationDate)
            return transaction2.expirationDate.getTime() <= +/* @__PURE__ */ new Date();
          return false;
        }
      }
      Internal.LocalReceipts = LocalReceipts;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      function owned(options) {
        if (options.verifiedReceipts !== void 0) {
          return Internal.VerifiedReceipts.isOwned(options.verifiedReceipts, options.product);
        } else if (options.localReceipts !== void 0) {
          return Internal.LocalReceipts.isOwned(options.localReceipts, options.product);
        } else {
          return false;
        }
      }
      Internal.owned = owned;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class PromiseLike {
        constructor() {
          this.resolved = false;
          this.callbacks = [];
        }
        /** Add a callback to the list */
        push(callback) {
          if (this.resolved)
            setTimeout(callback, 0, this.resolvedArgument);
          else
            this.callbacks.push(callback);
        }
        /** Call all registered callbacks with the given value */
        resolve(value) {
          if (this.resolved)
            return;
          this.resolved = true;
          this.resolvedArgument = value;
          this.callbacks.forEach((cb) => setTimeout(cb, 0, value));
          this.callbacks = [];
        }
      }
      Internal.PromiseLike = PromiseLike;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class Retry {
        constructor(minTimeout = 5e3, maxTimeout = 12e4) {
          this.maxTimeout = 12e4;
          this.minTimeout = 5e3;
          this.retryTimeout = 5e3;
          this.retries = [];
          this.minTimeout = minTimeout;
          this.maxTimeout = maxTimeout;
          this.retryTimeout = minTimeout;
          document.addEventListener("online", () => {
            const a = this.retries;
            this.retries = [];
            this.retryTimeout = this.minTimeout;
            for (var i = 0; i < a.length; ++i) {
              clearTimeout(a[i].tid);
              a[i].fn.call(this);
            }
          }, false);
        }
        retry(fn) {
          var tid = setTimeout(() => {
            this.retries = this.retries.filter(function(o) {
              return tid !== o.tid;
            });
            fn();
          }, this.retryTimeout);
          this.retries.push({ tid, fn });
          this.retryTimeout *= 2;
          if (this.retryTimeout > this.maxTimeout)
            this.retryTimeout = this.maxTimeout;
        }
      }
      Internal.Retry = Retry;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Internal) {
      class VerifiedReceipts {
        /**
         * Find the last verified purchase for a given product, from those verified by the receipt validator.
         */
        static find(verifiedReceipts, product) {
          var _a, _b;
          if (!product)
            return void 0;
          let found;
          for (const receipt of verifiedReceipts) {
            if (product.platform && receipt.platform !== product.platform)
              continue;
            for (const purchase of receipt.collection) {
              if (purchase.id === product.id) {
                if (((_a = found === null || found === void 0 ? void 0 : found.purchaseDate) !== null && _a !== void 0 ? _a : 0) < ((_b = purchase.purchaseDate) !== null && _b !== void 0 ? _b : 1))
                  found = purchase;
              }
            }
          }
          return found;
        }
        /** Return true if a product is owned, based on the content of the list of verified receipts  */
        static isOwned(verifiedReceipts, product) {
          if (!product)
            return false;
          const purchase = VerifiedReceipts.find(verifiedReceipts, product);
          if (!purchase)
            return false;
          if (purchase === null || purchase === void 0 ? void 0 : purchase.isExpired)
            return false;
          if (purchase === null || purchase === void 0 ? void 0 : purchase.expiryDate) {
            return purchase.expiryDate > +/* @__PURE__ */ new Date();
          }
          return true;
        }
        static getVerifiedPurchases(verifiedReceipts) {
          var _a, _b, _c, _d;
          const indexed = {};
          for (const receipt of verifiedReceipts) {
            for (const purchase of receipt.collection) {
              const key = receipt.platform + ":" + purchase.id;
              const existing = indexed[key];
              if (!existing || existing && ((_b = (_a = existing.lastRenewalDate) !== null && _a !== void 0 ? _a : existing.purchaseDate) !== null && _b !== void 0 ? _b : 0) < ((_d = (_c = purchase.lastRenewalDate) !== null && _c !== void 0 ? _c : purchase.purchaseDate) !== null && _d !== void 0 ? _d : 0)) {
                indexed[key] = Object.assign(Object.assign({}, purchase), { platform: receipt.platform });
              }
            }
          }
          return Object.keys(indexed).map((key) => indexed[key]);
        }
      }
      Internal.VerifiedReceipts = VerifiedReceipts;
    })(CdvPurchase2.Internal || (CdvPurchase2.Internal = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(ApplePay) {
      (function(ContactField) {
        ContactField["Name"] = "name";
        ContactField["EmailAddress"] = "emailAddress";
        ContactField["PhoneNumber"] = "phoneNumber";
        ContactField["PostalAddress"] = "postalAddress";
        ContactField["PhoneticName"] = "phoneticName";
      })(ApplePay.ContactField || (ApplePay.ContactField = {}));
      (function(PaymentNetwork) {
        PaymentNetwork["Amex"] = "Amex";
        PaymentNetwork["Barcode"] = "Barcode";
        PaymentNetwork["CartesBancaires"] = "CartesBancaires";
        PaymentNetwork["ChinaUnionPay"] = "ChinaUnionPay";
        PaymentNetwork["Dankort"] = "Dankort";
        PaymentNetwork["Discover"] = "Discover";
        PaymentNetwork["Eftpos"] = "Eftpos";
        PaymentNetwork["Electron"] = "Electron";
        PaymentNetwork["Elo"] = "Elo";
        PaymentNetwork["Girocard"] = "Girocard";
        PaymentNetwork["IDCredit"] = "IDCredit";
        PaymentNetwork["Interac"] = "Interac";
        PaymentNetwork["JCB"] = "JCB";
        PaymentNetwork["Mada"] = "Mada";
        PaymentNetwork["Maestro"] = "Maestro";
        PaymentNetwork["MasterCard"] = "MasterCard";
        PaymentNetwork["Mir"] = "Mir";
        PaymentNetwork["Nanaco"] = "Nanaco";
        PaymentNetwork["PrivateLabel"] = "PrivateLabel";
        PaymentNetwork["QuicPay"] = "QuicPay";
        PaymentNetwork["Suica"] = "Suica";
        PaymentNetwork["Visa"] = "Visa";
        PaymentNetwork["VPay"] = "VPay";
        PaymentNetwork["Waon"] = "Waon";
      })(ApplePay.PaymentNetwork || (ApplePay.PaymentNetwork = {}));
      (function(MerchantCapability) {
        MerchantCapability["ThreeDS"] = "3DS";
        MerchantCapability["EMV"] = "EMV";
        MerchantCapability["Credit"] = "Credit";
        MerchantCapability["Debit"] = "Debit";
      })(ApplePay.MerchantCapability || (ApplePay.MerchantCapability = {}));
    })(CdvPurchase2.ApplePay || (CdvPurchase2.ApplePay = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(AppleAppStore) {
      function virtualTransactionId(productId) {
        return `virtual.${productId}`;
      }
      class Adapter {
        constructor(context, options) {
          var _a, _b;
          this.id = CdvPurchase2.Platform.APPLE_APPSTORE;
          this.name = "AppStore";
          this.ready = false;
          this._canMakePayments = false;
          this.forceReceiptReload = false;
          this._products = [];
          this.validProducts = {};
          this._paymentMonitor = () => {
          };
          this.supportsParallelLoading = true;
          this._appStoreReceiptLoading = false;
          this._appStoreReceiptCallbacks = [];
          this.context = context;
          this.log = context.log.child("AppleAppStore");
          const useCapacitor = AppleAppStore.CapacitorBridge.CapacitorNativeBridge.isAvailable();
          this.useSK2 = useCapacitor || AppleAppStore.SK2Bridge.SK2NativeBridge.isAvailable();
          if (useCapacitor) {
            this.log.info("Capacitor plugin detected, using Capacitor SK2 bridge");
            this.bridge = new AppleAppStore.CapacitorBridge.CapacitorNativeBridge();
          } else if (AppleAppStore.SK2Bridge.SK2NativeBridge.isAvailable()) {
            this.log.info("StoreKit 2 extension detected, using SK2 bridge");
            this.bridge = new AppleAppStore.SK2Bridge.SK2NativeBridge();
          } else {
            this.bridge = new AppleAppStore.Bridge.Bridge();
          }
          this.discountEligibilityDeterminer = options.discountEligibilityDeterminer;
          this.needAppReceipt = this.useSK2 ? false : (_a = options.needAppReceipt) !== null && _a !== void 0 ? _a : true;
          this.autoFinish = (_b = options.autoFinish) !== null && _b !== void 0 ? _b : false;
          this.pseudoReceipt = new CdvPurchase2.Receipt(CdvPurchase2.Platform.APPLE_APPSTORE, this.context.apiDecorators);
          this.receiptsUpdated = CdvPurchase2.Utils.createDebouncer(() => {
            this._receiptsUpdated();
          }, 300);
        }
        get products() {
          return this._products;
        }
        /**
         * Resolve the username string passed to the native bridge for a
         * purchase. SK1 + 'legacy' keeps the raw username for backward
         * compatibility; every other mode obfuscates through the
         * configured strategy. 'disabled' always returns the raw value.
         */
        resolveBridgeUsername() {
          var _a;
          const raw = this.context.getApplicationUsername();
          if (!raw)
            return void 0;
          const obfuscator = (_a = this.context.obfuscator) !== null && _a !== void 0 ? _a : "legacy";
          if (obfuscator === "disabled")
            return raw;
          if (obfuscator === "legacy" && !this.useSK2)
            return raw;
          return this.context.obfuscateUsername(raw, CdvPurchase2.Platform.APPLE_APPSTORE);
        }
        /** Find a given product from ID */
        getProduct(id) {
          return this._products.find((p) => p.id === id);
        }
        get receipts() {
          if (!this.isSupported)
            return [];
          return (this._receipt ? [this._receipt] : []).concat(this.pseudoReceipt ? this.pseudoReceipt : []);
        }
        addValidProducts(registerProducts, validProducts) {
          validProducts.forEach((vp) => {
            const rp = registerProducts.find((p) => p.id === vp.id);
            if (!rp)
              return;
            this.validProducts[vp.id] = Object.assign(Object.assign({}, vp), rp);
          });
        }
        /** Returns true on iOS, the only platform supported by this adapter */
        get isSupported() {
          return CdvPurchase2.Utils.platformId() === "ios";
        }
        upsertTransactionInProgress(productId, state2) {
          const transactionId = virtualTransactionId(productId);
          return new Promise((resolve2) => {
            const existing = this.pseudoReceipt.transactions.find((t) => t.transactionId === transactionId);
            if (existing) {
              existing.state = state2;
              existing.refresh(productId);
              resolve2(existing);
            } else {
              const tr = new AppleAppStore.SKTransaction(CdvPurchase2.Platform.APPLE_APPSTORE, this.pseudoReceipt, this.context.apiDecorators);
              tr.state = state2;
              tr.transactionId = transactionId;
              tr.refresh(productId);
              this.pseudoReceipt.transactions.push(tr);
              resolve2(tr);
            }
          });
        }
        /** Remove a transaction from the pseudo receipt */
        removeTransactionInProgress(productId) {
          const transactionId = virtualTransactionId(productId);
          this.pseudoReceipt.transactions = this.pseudoReceipt.transactions.filter((t) => t.transactionId !== transactionId);
        }
        /** Insert or update a transaction in the pseudo receipt, based on data collected from the native side */
        upsertTransaction(productId, transactionId, state2) {
          return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve2) => {
              this.initializeAppReceipt(() => {
                var _a;
                if (!this._receipt) {
                  this.log.warn("Application receipt unavailable, creating a fallback receipt to avoid blocking transactions");
                  this._receipt = new AppleAppStore.SKApplicationReceipt({
                    appStoreReceipt: "",
                    bundleIdentifier: "",
                    bundleShortVersion: "",
                    bundleNumericVersion: 0,
                    bundleSignature: ""
                  }, this.needAppReceipt, this.context.apiDecorators);
                }
                const existing = (_a = this._receipt) === null || _a === void 0 ? void 0 : _a.transactions.find((t) => t.transactionId === transactionId);
                if (existing) {
                  existing.state = state2;
                  existing.refresh(productId);
                  resolve2(existing);
                } else {
                  const tr = new AppleAppStore.SKTransaction(CdvPurchase2.Platform.APPLE_APPSTORE, this._receipt, this.context.apiDecorators);
                  tr.state = state2;
                  tr.transactionId = transactionId;
                  tr.refresh(productId);
                  this._receipt.transactions.push(tr);
                  resolve2(tr);
                }
              });
            });
          });
        }
        removeTransaction(transactionId) {
          if (this._receipt) {
            this._receipt.transactions = this._receipt.transactions.filter((t) => t.transactionId !== transactionId);
          }
        }
        /** Notify the store that the receipts have been updated */
        _receiptsUpdated() {
          if (this._receipt) {
            this.log.debug("receipt updated and ready.");
            this.context.listener.receiptsUpdated(CdvPurchase2.Platform.APPLE_APPSTORE, [this._receipt, this.pseudoReceipt]);
            this.context.listener.receiptsReady(CdvPurchase2.Platform.APPLE_APPSTORE);
          } else {
            this.log.debug("receipt updated.");
            this.context.listener.receiptsUpdated(CdvPurchase2.Platform.APPLE_APPSTORE, [this.pseudoReceipt]);
          }
        }
        setPaymentMonitor(fn) {
          this._paymentMonitor = fn;
        }
        callPaymentMonitor(status, code, message) {
          this._paymentMonitor(status);
        }
        initialize() {
          return new Promise((resolve2) => {
            this.log.info("bridge.init");
            const bridgeLogger = this.log.child("Bridge");
            this.bridge.init({
              autoFinish: this.autoFinish,
              debug: this.context.verbosity === CdvPurchase2.LogLevel.DEBUG,
              log: (msg) => bridgeLogger.debug(msg),
              error: (code, message, options) => {
                this.log.error("ERROR: " + code + " - " + message);
                if (code === CdvPurchase2.ErrorCode.PAYMENT_CANCELLED) {
                  this.callPaymentMonitor("cancelled", CdvPurchase2.ErrorCode.PAYMENT_CANCELLED, message);
                  return;
                } else {
                  this.context.error(appStoreError(code, message, (options === null || options === void 0 ? void 0 : options.productId) || null));
                }
              },
              ready: () => {
                this.log.info("ready");
              },
              purchased: (transactionIdentifier, productId, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity) => __awaiter(this, void 0, void 0, function* () {
                this.log.info("purchase: id:" + transactionIdentifier + " product:" + productId + " originalTransaction:" + originalTransactionIdentifier + " - date:" + transactionDate + " - discount:" + discountId + (jwsRepresentation ? " - jws:present" : "") + (quantity && quantity > 1 ? " - quantity:" + quantity : ""));
                const transaction2 = yield this.upsertTransaction(productId, transactionIdentifier, CdvPurchase2.TransactionState.APPROVED);
                transaction2.refresh(productId, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity);
                this.removeTransactionInProgress(productId);
                this.receiptsUpdated.call();
                this.callPaymentMonitor("purchased");
              }),
              purchaseEnqueued: (productId, quantity) => __awaiter(this, void 0, void 0, function* () {
                this.log.info("purchaseEnqueued: " + productId + " - " + quantity);
                yield this.upsertTransactionInProgress(productId, CdvPurchase2.TransactionState.INITIATED);
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.APPLE_APPSTORE, [this.pseudoReceipt]);
              }),
              purchaseFailed: (productId, code, message) => {
                this.log.info("purchaseFailed: " + productId + " - " + code + " - " + message);
                this.removeTransactionInProgress(productId);
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.APPLE_APPSTORE, [this.pseudoReceipt]);
                this.callPaymentMonitor("failed", code, message);
              },
              purchasing: (productId) => __awaiter(this, void 0, void 0, function* () {
                this.log.info("purchasing: " + productId);
                yield this.upsertTransactionInProgress(productId, CdvPurchase2.TransactionState.INITIATED);
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.APPLE_APPSTORE, [this.pseudoReceipt]);
              }),
              deferred: (productId) => __awaiter(this, void 0, void 0, function* () {
                this.log.info("deferred: " + productId);
                yield this.upsertTransactionInProgress(productId, CdvPurchase2.TransactionState.PENDING);
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.APPLE_APPSTORE, [this.pseudoReceipt]);
                this.callPaymentMonitor("deferred");
              }),
              finished: (transactionIdentifier, productId) => __awaiter(this, void 0, void 0, function* () {
                yield this.receiptsUpdated.wait();
                this.log.info("finish: " + transactionIdentifier + " - " + productId);
                this.removeTransactionInProgress(productId);
                const finishedTransaction = yield this.upsertTransaction(productId, transactionIdentifier, CdvPurchase2.TransactionState.FINISHED);
                finishedTransaction.isAcknowledged = true;
                this.receiptsUpdated.call();
              }),
              restored: (transactionIdentifier, productId, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity, isFinished) => __awaiter(this, void 0, void 0, function* () {
                this.log.info("restore: " + transactionIdentifier + " - " + productId);
                const transaction2 = yield this.upsertTransaction(productId, transactionIdentifier, CdvPurchase2.TransactionState.APPROVED);
                transaction2.refresh(productId, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity);
                if (isFinished !== void 0)
                  transaction2.isAcknowledged = isFinished;
                this.receiptsUpdated.call();
              }),
              receiptsRefreshed: (receipt) => {
                this.log.info("receiptsRefreshed");
                if (this._receipt)
                  this._receipt.refresh(receipt, this.needAppReceipt, this.context.apiDecorators);
              },
              restoreFailed: (errorCode) => {
                this.log.info("restoreFailed: " + errorCode);
                if (this.onRestoreCompleted) {
                  this.onRestoreCompleted(appStoreError(errorCode, "Restore purchases failed", null));
                  this.onRestoreCompleted = void 0;
                }
              },
              restoreCompleted: () => {
                this.log.info("restoreCompleted");
                if (this.onRestoreCompleted) {
                  this.onRestoreCompleted(void 0);
                  this.onRestoreCompleted = void 0;
                }
              }
            }, () => __awaiter(this, void 0, void 0, function* () {
              this.log.info("bridge.init done");
              yield this.canMakePayments();
              resolve2(void 0);
            }), (code, message) => {
              this.log.info("bridge.init failed: " + code + " - " + message);
              resolve2(appStoreError(code, message, null));
            });
          });
        }
        loadReceipts() {
          return __awaiter(this, void 0, void 0, function* () {
            if (this.bridge.pendingTransactionsReady) {
              yield this.bridge.pendingTransactionsReady;
              yield new Promise((r) => setTimeout(r, 0));
            }
            return new Promise((resolve2) => {
              this.initializeAppReceipt(() => {
                this.receiptsUpdated.call();
                if (this._receipt) {
                  resolve2([this._receipt, this.pseudoReceipt]);
                } else {
                  resolve2([this.pseudoReceipt]);
                }
              });
            });
          });
        }
        canMakePayments() {
          return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve2) => {
              this.bridge.canMakePayments(() => {
                this._canMakePayments = true;
                resolve2(true);
              }, (message) => {
                this.log.warn(`canMakePayments: ${message}`);
                this._canMakePayments = false;
                resolve2(false);
              });
            });
          });
        }
        /**
         * Create the application receipt
         */
        initializeAppReceipt(callback) {
          return __awaiter(this, void 0, void 0, function* () {
            if (this._receipt) {
              this.log.debug("initializeAppReceipt() => already initialized.");
              return callback(void 0);
            }
            this._appStoreReceiptCallbacks.push(callback);
            if (this._appStoreReceiptLoading) {
              this.log.debug("initializeAppReceipt() => already loading.");
              return;
            }
            this._appStoreReceiptLoading = true;
            const nativeData = yield this.loadAppStoreReceipt();
            const callCallbacks = (arg) => {
              const callbacks = this._appStoreReceiptCallbacks;
              this._appStoreReceiptCallbacks = [];
              callbacks.forEach((cb) => {
                cb(arg);
              });
            };
            if (!(nativeData === null || nativeData === void 0 ? void 0 : nativeData.appStoreReceipt)) {
              if (this.useSK2) {
                this.log.info("SK2 mode: no appStoreReceipt (expected), creating empty receipt");
                this._receipt = new AppleAppStore.SKApplicationReceipt(nativeData || {
                  appStoreReceipt: "",
                  bundleIdentifier: "",
                  bundleShortVersion: "",
                  bundleNumericVersion: 0,
                  bundleSignature: ""
                }, this.needAppReceipt, this.context.apiDecorators);
                this._appStoreReceiptLoading = false;
                callCallbacks(void 0);
                return;
              }
              this.log.warn("no appStoreReceipt");
              this._appStoreReceiptLoading = false;
              callCallbacks(appStoreError(CdvPurchase2.ErrorCode.REFRESH, "No appStoreReceipt", null));
              return;
            }
            this._receipt = new AppleAppStore.SKApplicationReceipt(nativeData, this.needAppReceipt, this.context.apiDecorators);
            this._appStoreReceiptLoading = false;
            callCallbacks(void 0);
          });
        }
        prepareReceipt(nativeData) {
          if (nativeData === null || nativeData === void 0 ? void 0 : nativeData.appStoreReceipt) {
            if (!this._receipt) {
              this._receipt = new AppleAppStore.SKApplicationReceipt(nativeData, this.needAppReceipt, this.context.apiDecorators);
            } else {
              this._receipt.refresh(nativeData, this.needAppReceipt, this.context.apiDecorators);
            }
          }
        }
        /** Promisified loading of the AppStore receipt */
        loadAppStoreReceipt() {
          return __awaiter(this, void 0, void 0, function* () {
            let resolved = false;
            return new Promise((resolve2) => {
              var _a;
              if (((_a = this.bridge.appStoreReceipt) === null || _a === void 0 ? void 0 : _a.appStoreReceipt) && !this.forceReceiptReload) {
                this.log.debug("using cached appstore receipt");
                return resolve2(this.bridge.appStoreReceipt);
              }
              this.log.debug("loading appstore receipt...");
              this.forceReceiptReload = false;
              this.bridge.loadReceipts((receipt) => {
                this.log.debug("appstore receipt loaded");
                if (!resolved)
                  resolve2(receipt);
                resolved = true;
              }, (code, message) => {
                this.log.warn("Failed to load appStoreReceipt: " + code + " - " + message);
                if (!resolved)
                  resolve2(void 0);
                resolved = true;
              });
              setTimeout(function() {
                if (!resolved)
                  resolve2(void 0);
                resolved = true;
              }, 5e3);
            }).then((result) => {
              this.context.listener.receiptsReady(CdvPurchase2.Platform.APPLE_APPSTORE);
              return result;
            }).catch((reason) => {
              this.context.listener.receiptsReady(CdvPurchase2.Platform.APPLE_APPSTORE);
              return reason;
            });
          });
        }
        loadEligibility(validProducts) {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.debug("load eligibility: " + JSON.stringify(validProducts));
            const { requests, nativeAnswers } = AppleAppStore.Internal.collectEligibilityRequests(validProducts);
            if (requests.length === 0) {
              return new AppleAppStore.Internal.DiscountEligibilities([], []);
            }
            const allNative = nativeAnswers.every((a) => a !== void 0);
            if (allNative) {
              this.log.debug("native eligibility answers cover all requests, skipping determiner.");
              return new AppleAppStore.Internal.DiscountEligibilities(requests, nativeAnswers);
            }
            if (!this.discountEligibilityDeterminer) {
              this.log.debug("No discount eligibility determiner; using native answers only where available.");
              const defaultForMissing = requests.map((r) => r.discountType === "Introductory");
              return new AppleAppStore.Internal.DiscountEligibilities(requests, AppleAppStore.Internal.mergeNativeEligibility(defaultForMissing, nativeAnswers));
            }
            const applicationReceipt = yield this.loadAppStoreReceipt();
            let response;
            if (!applicationReceipt || !applicationReceipt.appStoreReceipt) {
              this.log.debug("no receipt, assuming introductory price are available.");
              response = requests.map((r) => r.discountType === "Introductory");
            } else {
              this.log.debug("calling discount eligibility determiner.");
              response = yield this.callDiscountEligibilityDeterminer(applicationReceipt, requests);
              this.log.debug("response: " + JSON.stringify(response));
            }
            return new AppleAppStore.Internal.DiscountEligibilities(requests, AppleAppStore.Internal.mergeNativeEligibility(response, nativeAnswers));
          });
        }
        callDiscountEligibilityDeterminer(applicationReceipt, eligibilityRequests) {
          return new Promise((resolve2) => {
            if (!this.discountEligibilityDeterminer)
              return resolve2([]);
            this.discountEligibilityDeterminer(applicationReceipt, eligibilityRequests, resolve2);
          });
        }
        loadProducts(products) {
          return new Promise((resolve2) => {
            this.log.info("bridge.load");
            this.bridge.load(products.map((p) => p.id), (validProducts, invalidProducts) => __awaiter(this, void 0, void 0, function* () {
              this.log.info("bridge.loaded: " + JSON.stringify({ validProducts, invalidProducts }));
              this.addValidProducts(products, validProducts);
              const eligibilities = yield this.loadEligibility(validProducts);
              this.log.info("eligibilities ready: " + JSON.stringify(eligibilities));
              const ret = products.map((p) => {
                if (invalidProducts.indexOf(p.id) >= 0) {
                  this.log.debug(`${p.id} is invalid`);
                  return appStoreError(CdvPurchase2.ErrorCode.INVALID_PRODUCT_ID, "Product not found in AppStore. #400", p.id);
                } else {
                  const valid = validProducts.find((v) => v.id === p.id);
                  this.log.debug(`${p.id} is valid: ${JSON.stringify(valid)}`);
                  if (!valid)
                    return appStoreError(CdvPurchase2.ErrorCode.INVALID_PRODUCT_ID, "Product not found in AppStore. #404", p.id);
                  let product = this.getProduct(p.id);
                  if (product) {
                    this.log.debug("refreshing existing product");
                    product === null || product === void 0 ? void 0 : product.refresh(valid, this.context.apiDecorators, eligibilities);
                  } else {
                    this.log.debug("registering new product");
                    product = new AppleAppStore.SKProduct(valid, p, this.context.apiDecorators, eligibilities);
                    this._products.push(product);
                  }
                  return product;
                }
              });
              this.log.debug(`Products loaded: ${JSON.stringify(ret)}`);
              resolve2(ret);
            }), (code, message) => {
              return products.map((p) => appStoreError(code, message, null));
            });
          });
        }
        order(offer, additionalData) {
          return __awaiter(this, void 0, void 0, function* () {
            let resolved = false;
            return new Promise((resolve2) => {
              var _a, _b;
              const callResolve = (result) => {
                if (resolved)
                  return;
                this.setPaymentMonitor(() => {
                });
                resolved = true;
                resolve2(result);
              };
              this.log.info("order");
              const quantity = (_a = additionalData === null || additionalData === void 0 ? void 0 : additionalData.quantity) !== null && _a !== void 0 ? _a : 1;
              if (quantity < 1 || quantity > 10 || !Number.isInteger(quantity)) {
                return callResolve(appStoreError(CdvPurchase2.ErrorCode.PURCHASE, "Invalid quantity: must be an integer between 1 and 10", offer.productId));
              }
              const discountId = offer.id !== AppleAppStore.DEFAULT_OFFER_ID ? offer.id : void 0;
              const discount = (_b = additionalData === null || additionalData === void 0 ? void 0 : additionalData.appStore) === null || _b === void 0 ? void 0 : _b.discount;
              if (discountId && !discount) {
                return callResolve(appStoreError(CdvPurchase2.ErrorCode.MISSING_OFFER_PARAMS, "Missing additionalData.appStore.discount when ordering a discount offer", offer.productId));
              }
              if (discountId && (discount === null || discount === void 0 ? void 0 : discount.id) !== discountId) {
                return callResolve(appStoreError(CdvPurchase2.ErrorCode.INVALID_OFFER_IDENTIFIER, "Offer identifier does not match additionalData.appStore.discount.id", offer.productId));
              }
              this.setPaymentMonitor((status, code, message) => {
                this.log.info("order.paymentMonitor => " + status + " " + (code !== null && code !== void 0 ? code : "") + " " + (message !== null && message !== void 0 ? message : ""));
                if (resolved)
                  return;
                switch (status) {
                  case "cancelled":
                    callResolve(appStoreError(code !== null && code !== void 0 ? code : CdvPurchase2.ErrorCode.PAYMENT_CANCELLED, message !== null && message !== void 0 ? message : "The user cancelled the order.", offer.productId));
                    break;
                  case "failed":
                    setTimeout(() => {
                      callResolve(appStoreError(code !== null && code !== void 0 ? code : CdvPurchase2.ErrorCode.PURCHASE, message !== null && message !== void 0 ? message : "Purchase failed", offer.productId));
                    }, 500);
                    break;
                  case "purchased":
                  case "deferred":
                    callResolve(void 0);
                    break;
                }
              });
              const success = () => {
                this.log.info("order.success");
              };
              const error = () => {
                this.log.info("order.error");
                callResolve(appStoreError(CdvPurchase2.ErrorCode.PURCHASE, "Failed to place order", offer.productId));
              };
              this.forceReceiptReload = true;
              warnIfDeprecatedAdditionalUsername(this.log, additionalData);
              const username = this.resolveBridgeUsername();
              this.bridge.purchase(offer.productId, quantity, username, discount, success, error);
            });
          });
        }
        finish(transaction2) {
          return new Promise((resolve2) => {
            this.log.info("finish(" + transaction2.transactionId + ")");
            if (transaction2.transactionId === AppleAppStore.APPLICATION_VIRTUAL_TRANSACTION_ID || transaction2.transactionId === virtualTransactionId(transaction2.products[0].id)) {
              transaction2.state = CdvPurchase2.TransactionState.FINISHED;
              this.receiptsUpdated.call();
              return resolve2(void 0);
            }
            const wasAlreadyFinished = transaction2.state === CdvPurchase2.TransactionState.FINISHED;
            const success = () => {
              transaction2.state = CdvPurchase2.TransactionState.FINISHED;
              if (!wasAlreadyFinished) {
                this.receiptsUpdated.call();
              }
              resolve2(void 0);
            };
            const error = (msg) => {
              var _a, _b;
              if (msg === null || msg === void 0 ? void 0 : msg.includes("[#CdvPurchase:100]")) {
                transaction2.state = CdvPurchase2.TransactionState.FINISHED;
                resolve2(void 0);
              } else {
                resolve2(appStoreError(CdvPurchase2.ErrorCode.FINISH, "Failed to finish transaction", (_b = (_a = transaction2.products[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null));
              }
            };
            this.bridge.finish(transaction2.transactionId, success, error);
          });
        }
        refreshReceipt() {
          return new Promise((resolve2) => {
            const success = (receipt) => {
              resolve2(receipt);
            };
            const error = (code, message) => {
              resolve2(appStoreError(code, message, null));
            };
            this.bridge.refreshReceipts(success, error);
          });
        }
        receiptValidationBody(receipt) {
          var _a, _b;
          return __awaiter(this, void 0, void 0, function* () {
            if (receipt.platform !== CdvPurchase2.Platform.APPLE_APPSTORE)
              return;
            if (receipt !== this._receipt)
              return;
            const skReceipt = receipt;
            let applicationReceipt = skReceipt.nativeData;
            if (this.forceReceiptReload) {
              const nativeData = yield this.loadAppStoreReceipt();
              this.forceReceiptReload = false;
              if (nativeData) {
                applicationReceipt = nativeData;
                this.prepareReceipt(nativeData);
              }
            }
            if (!this.useSK2 && !skReceipt.nativeData.appStoreReceipt) {
              this.log.info("Cannot prepare the receipt validation body, because appStoreReceipt is missing. Refreshing...");
              const result = yield this.refreshReceipt();
              if (!result || "isError" in result) {
                this.log.warn("Failed to refresh receipt, cannot run receipt validation.");
                if (result)
                  this.log.error(result);
                return;
              }
              this.log.info("Receipt refreshed.");
              applicationReceipt = result;
            }
            const transaction2 = skReceipt.transactions.slice(-1)[0];
            const products = CdvPurchase2.Utils.objectValues(this.validProducts).map((vp) => new AppleAppStore.SKProduct(vp, vp, this.context.apiDecorators, { isEligible: () => true }));
            if (this.useSK2) {
              if (!(transaction2 === null || transaction2 === void 0 ? void 0 : transaction2.jwsRepresentation)) {
                this.log.warn("SK2 mode but no JWS on transaction, skipping validation");
                return void 0;
              }
              return {
                id: applicationReceipt.bundleIdentifier,
                type: CdvPurchase2.ProductType.APPLICATION,
                products,
                transaction: {
                  type: "apple-sk2",
                  id: (_b = (_a = transaction2 === null || transaction2 === void 0 ? void 0 : transaction2.products) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id,
                  jwsRepresentation: transaction2.jwsRepresentation
                }
              };
            }
            const txBody = {
              type: "ios-appstore",
              id: transaction2 === null || transaction2 === void 0 ? void 0 : transaction2.transactionId,
              appStoreReceipt: applicationReceipt.appStoreReceipt
            };
            return {
              id: applicationReceipt.bundleIdentifier,
              type: CdvPurchase2.ProductType.APPLICATION,
              products,
              transaction: txBody
            };
          });
        }
        handleReceiptValidationResponse(_receipt, response) {
          var _a, _b;
          return __awaiter(this, void 0, void 0, function* () {
            let localReceiptUpdated = false;
            if (response.ok) {
              const vTransaction = (_a = response.data) === null || _a === void 0 ? void 0 : _a.transaction;
              const isApple = (vTransaction === null || vTransaction === void 0 ? void 0 : vTransaction.type) === "ios-appstore" || (vTransaction === null || vTransaction === void 0 ? void 0 : vTransaction.type) === "apple-sk2";
              if (isApple && vTransaction && "original_application_version" in vTransaction) {
                (_b = this._receipt) === null || _b === void 0 ? void 0 : _b.transactions.forEach((t) => {
                  if (t.transactionId === AppleAppStore.APPLICATION_VIRTUAL_TRANSACTION_ID) {
                    if (vTransaction.original_purchase_date_ms) {
                      t.purchaseDate = new Date(parseInt(vTransaction.original_purchase_date_ms));
                      localReceiptUpdated = true;
                    }
                  }
                });
              }
            }
            if (localReceiptUpdated)
              this.context.listener.receiptsUpdated(CdvPurchase2.Platform.APPLE_APPSTORE, [_receipt]);
          });
        }
        requestPayment(payment, additionalData) {
          return __awaiter(this, void 0, void 0, function* () {
            return appStoreError(CdvPurchase2.ErrorCode.UNKNOWN, "requestPayment not supported", null);
          });
        }
        manageSubscriptions() {
          return __awaiter(this, void 0, void 0, function* () {
            this.bridge.manageSubscriptions();
            return;
          });
        }
        manageBilling() {
          return __awaiter(this, void 0, void 0, function* () {
            this.bridge.manageBilling();
            return;
          });
        }
        checkSupport(functionality) {
          if (functionality === "order")
            return this._canMakePayments;
          const supported = [
            "order",
            "orderQuantity",
            "manageBilling",
            "manageSubscriptions",
            "getStorefront"
          ];
          return supported.indexOf(functionality) >= 0;
        }
        restorePurchases() {
          return new Promise((resolve2) => {
            this.onRestoreCompleted = (error) => {
              this.onRestoreCompleted = void 0;
              this.bridge.refreshReceipts((obj) => {
                resolve2(error);
              }, (code, message) => {
                resolve2(error || appStoreError(code, message, null));
              });
            };
            this.forceReceiptReload = true;
            this.bridge.restore();
          });
        }
        presentCodeRedemptionSheet() {
          return new Promise((resolve2) => {
            this.bridge.presentCodeRedemptionSheet(resolve2);
          });
        }
        getStorefront() {
          return __awaiter(this, void 0, void 0, function* () {
            if (!this.bridge.getStorefront)
              return void 0;
            const countryCode = yield this.bridge.getStorefront();
            if (!countryCode)
              return void 0;
            return isoAlpha3ToAlpha2(countryCode) || countryCode;
          });
        }
      }
      AppleAppStore.Adapter = Adapter;
      const ISO_ALPHA3_TO_ALPHA2 = {
        AFG: "AF",
        ALB: "AL",
        DZA: "DZ",
        ASM: "AS",
        AND: "AD",
        AGO: "AO",
        AIA: "AI",
        ATA: "AQ",
        ATG: "AG",
        ARG: "AR",
        ARM: "AM",
        ABW: "AW",
        AUS: "AU",
        AUT: "AT",
        AZE: "AZ",
        BHS: "BS",
        BHR: "BH",
        BGD: "BD",
        BRB: "BB",
        BLR: "BY",
        BEL: "BE",
        BLZ: "BZ",
        BEN: "BJ",
        BMU: "BM",
        BTN: "BT",
        BOL: "BO",
        BES: "BQ",
        BIH: "BA",
        BWA: "BW",
        BVT: "BV",
        BRA: "BR",
        IOT: "IO",
        BRN: "BN",
        BGR: "BG",
        BFA: "BF",
        BDI: "BI",
        CPV: "CV",
        KHM: "KH",
        CMR: "CM",
        CAN: "CA",
        CYM: "KY",
        CAF: "CF",
        TCD: "TD",
        CHL: "CL",
        CHN: "CN",
        CXR: "CX",
        CCK: "CC",
        COL: "CO",
        COM: "KM",
        COG: "CG",
        COD: "CD",
        COK: "CK",
        CRI: "CR",
        CIV: "CI",
        HRV: "HR",
        CUB: "CU",
        CUW: "CW",
        CYP: "CY",
        CZE: "CZ",
        DNK: "DK",
        DJI: "DJ",
        DMA: "DM",
        DOM: "DO",
        ECU: "EC",
        EGY: "EG",
        SLV: "SV",
        GNQ: "GQ",
        ERI: "ER",
        EST: "EE",
        SWZ: "SZ",
        ETH: "ET",
        FLK: "FK",
        FRO: "FO",
        FJI: "FJ",
        FIN: "FI",
        FRA: "FR",
        GUF: "GF",
        PYF: "PF",
        ATF: "TF",
        GAB: "GA",
        GMB: "GM",
        GEO: "GE",
        DEU: "DE",
        GHA: "GH",
        GIB: "GI",
        GRC: "GR",
        GRL: "GL",
        GRD: "GD",
        GLP: "GP",
        GUM: "GU",
        GTM: "GT",
        GGY: "GG",
        GIN: "GN",
        GNB: "GW",
        GUY: "GY",
        HTI: "HT",
        HMD: "HM",
        VAT: "VA",
        HND: "HN",
        HKG: "HK",
        HUN: "HU",
        ISL: "IS",
        IND: "IN",
        IDN: "ID",
        IRN: "IR",
        IRQ: "IQ",
        IRL: "IE",
        IMN: "IM",
        ISR: "IL",
        ITA: "IT",
        JAM: "JM",
        JPN: "JP",
        JEY: "JE",
        JOR: "JO",
        KAZ: "KZ",
        KEN: "KE",
        KIR: "KI",
        PRK: "KP",
        KOR: "KR",
        KWT: "KW",
        KGZ: "KG",
        LAO: "LA",
        LVA: "LV",
        LBN: "LB",
        LSO: "LS",
        LBR: "LR",
        LBY: "LY",
        LIE: "LI",
        LTU: "LT",
        LUX: "LU",
        MAC: "MO",
        MDG: "MG",
        MWI: "MW",
        MYS: "MY",
        MDV: "MV",
        MLI: "ML",
        MLT: "MT",
        MHL: "MH",
        MTQ: "MQ",
        MRT: "MR",
        MUS: "MU",
        MYT: "YT",
        MEX: "MX",
        FSM: "FM",
        MDA: "MD",
        MCO: "MC",
        MNG: "MN",
        MNE: "ME",
        MSR: "MS",
        MAR: "MA",
        MOZ: "MZ",
        MMR: "MM",
        NAM: "NA",
        NRU: "NR",
        NPL: "NP",
        NLD: "NL",
        NCL: "NC",
        NZL: "NZ",
        NIC: "NI",
        NER: "NE",
        NGA: "NG",
        NIU: "NU",
        NFK: "NF",
        MKD: "MK",
        MNP: "MP",
        NOR: "NO",
        OMN: "OM",
        PAK: "PK",
        PLW: "PW",
        PSE: "PS",
        PAN: "PA",
        PNG: "PG",
        PRY: "PY",
        PER: "PE",
        PHL: "PH",
        PCN: "PN",
        POL: "PL",
        PRT: "PT",
        PRI: "PR",
        QAT: "QA",
        REU: "RE",
        ROU: "RO",
        RUS: "RU",
        RWA: "RW",
        BLM: "BL",
        SHN: "SH",
        KNA: "KN",
        LCA: "LC",
        MAF: "MF",
        SPM: "PM",
        VCT: "VC",
        WSM: "WS",
        SMR: "SM",
        STP: "ST",
        SAU: "SA",
        SEN: "SN",
        SRB: "RS",
        SYC: "SC",
        SLE: "SL",
        SGP: "SG",
        SXM: "SX",
        SVK: "SK",
        SVN: "SI",
        SLB: "SB",
        SOM: "SO",
        ZAF: "ZA",
        SGS: "GS",
        SSD: "SS",
        ESP: "ES",
        LKA: "LK",
        SDN: "SD",
        SUR: "SR",
        SJM: "SJ",
        SWE: "SE",
        CHE: "CH",
        SYR: "SY",
        TWN: "TW",
        TJK: "TJ",
        TZA: "TZ",
        THA: "TH",
        TLS: "TL",
        TGO: "TG",
        TKL: "TK",
        TON: "TO",
        TTO: "TT",
        TUN: "TN",
        TUR: "TR",
        TKM: "TM",
        TCA: "TC",
        TUV: "TV",
        UGA: "UG",
        UKR: "UA",
        ARE: "AE",
        GBR: "GB",
        USA: "US",
        UMI: "UM",
        URY: "UY",
        UZB: "UZ",
        VUT: "VU",
        VEN: "VE",
        VNM: "VN",
        VGB: "VG",
        VIR: "VI",
        WLF: "WF",
        ESH: "EH",
        YEM: "YE",
        ZMB: "ZM",
        ZWE: "ZW"
      };
      function isoAlpha3ToAlpha2(alpha3) {
        return ISO_ALPHA3_TO_ALPHA2[alpha3.toUpperCase()];
      }
      function appStoreError(code, message, productId) {
        return CdvPurchase2.storeError(code, message, CdvPurchase2.Platform.APPLE_APPSTORE, productId);
      }
      let deprecatedAdditionalUsernameNoticed = false;
      function warnIfDeprecatedAdditionalUsername(log, additionalData) {
        if (!additionalData || !additionalData["applicationUsername"])
          return;
        if (deprecatedAdditionalUsernameNoticed)
          return;
        deprecatedAdditionalUsernameNoticed = true;
        log.warn("additionalData.applicationUsername is deprecated and ignored. Set store.applicationUsername instead.");
      }
    })(CdvPurchase2.AppleAppStore || (CdvPurchase2.AppleAppStore = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(AppleAppStore) {
      (function(CapacitorBridge) {
        let log = function log2(msg) {
          console.log("StoreKit[capacitor]: " + msg);
        };
        const noop = (..._args) => {
        };
        class CapacitorNativeBridge {
          constructor() {
            this.appStoreReceipt = null;
            this.transactionsForProduct = {};
            this.isSK2 = true;
            this.pendingTransactionUpdates = [];
            this.initialized = false;
            this.needRestoreNotification = false;
            this.options = {
              error: noop,
              ready: noop,
              purchased: noop,
              purchaseEnqueued: noop,
              purchasing: noop,
              purchaseFailed: noop,
              deferred: noop,
              finished: noop,
              restored: noop,
              receiptsRefreshed: noop,
              restoreCompleted: noop,
              restoreFailed: noop
            };
          }
          /** Check if the Capacitor purchase plugin is available */
          static isAvailable() {
            const marker = window.CdvPurchaseCapacitor;
            return !!(marker && marker.installed);
          }
          get plugin() {
            var _a, _b;
            return (_b = (_a = window.Capacitor) === null || _a === void 0 ? void 0 : _a.Plugins) === null || _b === void 0 ? void 0 : _b.PurchasePlugin;
          }
          init(options, success, error) {
            if (options.log)
              log = options.log;
            this.options = Object.assign(Object.assign({}, this.options), options);
            const plugin = this.plugin;
            if (!plugin) {
              error(CdvPurchase2.ErrorCode.SETUP, "Capacitor PurchasePlugin not available");
              return;
            }
            plugin.addListener("transactionUpdated", (data) => {
              this.transactionUpdated(data.state, data.errorCode, data.errorText, data.transactionIdentifier, data.productId, data.transactionReceipt, data.originalTransactionIdentifier, data.transactionDate, data.discountId, data.expirationDate, data.jwsRepresentation, data.quantity, data.isFinished);
            });
            plugin.addListener("restoreCompleted", () => {
              this.restoreCompletedTransactionsFinished();
            });
            plugin.addListener("restoreFailed", (data) => {
              this.restoreCompletedTransactionsFailed(data.errorCode);
            });
            const initOpts = {};
            if (options.autoFinish !== void 0)
              initOpts.autoFinish = options.autoFinish;
            if (options.debug !== void 0)
              initOpts.debug = options.debug;
            plugin.init(initOpts).then(() => {
              this.initialized = true;
              const pending = this.pendingTransactionUpdates;
              this.pendingTransactionUpdates = [];
              for (const args of pending) {
                this.transactionUpdated(args.state, args.errorCode, args.errorText, args.transactionIdentifier, args.productId, args.transactionReceipt, args.originalTransactionIdentifier, args.transactionDate, args.discountId, args.expirationDate, args.jwsRepresentation, args.quantity, args.isFinished);
              }
              if (this.options.ready)
                this.options.ready();
              success();
            }).catch((err) => {
              error(CdvPurchase2.ErrorCode.SETUP, (err === null || err === void 0 ? void 0 : err.message) || "init failed");
            });
          }
          load(productIds, success, error) {
            this.plugin.load({ productIds }).then((result) => success(result.validProducts, result.invalidProductIds)).catch((err) => error(CdvPurchase2.ErrorCode.LOAD, (err === null || err === void 0 ? void 0 : err.message) || "load failed"));
          }
          purchase(productId, quantity, applicationUsername, discount, success, error) {
            this.plugin.purchase({ productId, quantity, applicationUsername, discount }).then(() => success()).catch(() => error());
          }
          finish(transactionId, success, error) {
            this.plugin.finish({ transactionId }).then(() => success()).catch((err) => error((err === null || err === void 0 ? void 0 : err.message) || "finish failed"));
          }
          canMakePayments(success, error) {
            this.plugin.canMakePayments().then((result) => {
              if (result.canMakePayments)
                success();
              else
                error("cannot make payments");
            }).catch((err) => error((err === null || err === void 0 ? void 0 : err.message) || "canMakePayments failed"));
          }
          restore(callback) {
            this.needRestoreNotification = true;
            this.plugin.restore().then(() => {
              if (callback)
                callback(true);
            }).catch(() => {
              if (callback)
                callback(false);
            });
          }
          manageSubscriptions(callback) {
            this.plugin.manageSubscriptions().then(() => {
              if (callback)
                callback(true);
            }).catch(() => {
              if (callback)
                callback(false);
            });
          }
          manageBilling(callback) {
            this.plugin.manageBilling().then(() => {
              if (callback)
                callback(true);
            }).catch(() => {
              if (callback)
                callback(false);
            });
          }
          presentCodeRedemptionSheet(callback) {
            this.plugin.presentCodeRedemptionSheet().then(() => {
              if (callback)
                callback(true);
            }).catch(() => {
              if (callback)
                callback(false);
            });
          }
          refreshReceipts(successCb, errorCb) {
            this.plugin.refreshReceipts().then((result) => {
              this.appStoreReceipt = result.receipt;
              if (this.options.receiptsRefreshed) {
                this.options.receiptsRefreshed(result.receipt);
              }
              successCb(result.receipt);
            }).catch((err) => errorCb(CdvPurchase2.ErrorCode.REFRESH_RECEIPTS, (err === null || err === void 0 ? void 0 : err.message) || "refreshReceipts failed"));
          }
          loadReceipts(callback, errorCb) {
            this.plugin.loadReceipts().then((result) => {
              this.appStoreReceipt = result.receipt;
              callback(result.receipt);
            }).catch((err) => errorCb(CdvPurchase2.ErrorCode.LOAD, (err === null || err === void 0 ? void 0 : err.message) || "loadReceipts failed"));
          }
          // Called when the native side sends a transaction update
          transactionUpdated(state2, errorCode, errorText, transactionIdentifier, productId, transactionReceipt, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity, isFinished) {
            if (!this.initialized) {
              this.pendingTransactionUpdates.push({
                state: state2,
                errorCode,
                errorText,
                transactionIdentifier,
                productId,
                transactionReceipt,
                originalTransactionIdentifier,
                transactionDate,
                discountId,
                expirationDate,
                jwsRepresentation,
                quantity,
                isFinished
              });
              return;
            }
            if (!this.transactionsForProduct[productId]) {
              this.transactionsForProduct[productId] = [];
            }
            if (transactionIdentifier && this.transactionsForProduct[productId].indexOf(transactionIdentifier) < 0) {
              this.transactionsForProduct[productId].push(transactionIdentifier);
            }
            switch (state2) {
              case "PaymentTransactionStatePurchasing":
                if (this.options.purchasing) {
                  this.options.purchasing(productId);
                }
                break;
              case "PaymentTransactionStatePurchased":
                if (this.options.purchased) {
                  this.options.purchased(transactionIdentifier, productId, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity);
                }
                break;
              case "PaymentTransactionStateFailed":
                if (this.options.purchaseFailed) {
                  this.options.purchaseFailed(productId, errorCode || 0, errorText || "Unknown error");
                }
                if (this.options.error) {
                  this.options.error(errorCode || 0, errorText || "Unknown error", { productId });
                }
                break;
              case "PaymentTransactionStateRestored":
                if (this.options.restored) {
                  this.options.restored(transactionIdentifier, productId, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity, isFinished);
                }
                break;
              case "PaymentTransactionStateDeferred":
                if (this.options.deferred) {
                  this.options.deferred(productId);
                }
                break;
              case "PaymentTransactionStateFinished":
                if (this.options.finished) {
                  this.options.finished(transactionIdentifier, productId);
                }
                break;
            }
          }
          restoreCompletedTransactionsFinished() {
            if (!this.needRestoreNotification)
              return;
            this.needRestoreNotification = false;
            if (this.options.restoreCompleted) {
              this.options.restoreCompleted();
            }
          }
          restoreCompletedTransactionsFailed(errorCode) {
            if (this.options.restoreFailed) {
              this.options.restoreFailed(errorCode);
            }
          }
          /** Retrieve the storefront country code from StoreKit */
          getStorefront() {
            return new Promise((resolve2) => {
              const plugin = this.plugin;
              if (!plugin) {
                log("getStorefront failed: plugin not available");
                resolve2(void 0);
                return;
              }
              plugin.getStorefront().then((result) => resolve2(result.countryCode || void 0)).catch((err) => {
                log("getStorefront failed: " + ((err === null || err === void 0 ? void 0 : err.message) || err));
                resolve2(void 0);
              });
            });
          }
        }
        CapacitorBridge.CapacitorNativeBridge = CapacitorNativeBridge;
      })(AppleAppStore.CapacitorBridge || (AppleAppStore.CapacitorBridge = {}));
    })(CdvPurchase2.AppleAppStore || (CdvPurchase2.AppleAppStore = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(AppleAppStore) {
      (function(SK2Bridge) {
        const noop = (args) => {
        };
        let log = noop;
        function exec(methodName, options, success, error) {
          window.cordova.exec(success, error, "StoreKit2Plugin", methodName, options);
        }
        function protectCall(callback, context, ...args) {
          if (!callback)
            return;
          try {
            callback.apply(this, args);
          } catch (err) {
            log("exception in " + context + ': "' + err + '"');
          }
        }
        class SK2NativeBridge {
          constructor() {
            this.transactionsForProduct = {};
            this.initialized = false;
            this.registeredProducts = [];
            this.needRestoreNotification = false;
            this.pendingUpdates = [];
            this.isSK2 = true;
            window.storekit2 = this;
            this.options = {
              error: noop,
              ready: noop,
              purchased: noop,
              purchaseEnqueued: noop,
              purchasing: noop,
              purchaseFailed: noop,
              deferred: noop,
              finished: noop,
              restored: noop,
              receiptsRefreshed: noop,
              restoreFailed: noop,
              restoreCompleted: noop
            };
          }
          /** Check if the SK2 extension plugin is installed */
          static isAvailable() {
            const marker = window.CdvPurchaseStoreKit2;
            return !!(marker && marker.installed);
          }
          init(options, success, error) {
            this.options = {
              error: options.error || noop,
              ready: options.ready || noop,
              purchased: options.purchased || noop,
              purchaseEnqueued: options.purchaseEnqueued || noop,
              purchasing: options.purchasing || noop,
              purchaseFailed: options.purchaseFailed || noop,
              deferred: options.deferred || noop,
              finished: options.finished || noop,
              restored: options.restored || noop,
              receiptsRefreshed: options.receiptsRefreshed || noop,
              restoreFailed: options.restoreFailed || noop,
              restoreCompleted: options.restoreCompleted || noop
            };
            if (options.debug) {
              exec("debug", [], noop, noop);
              log = options.log || function(msg) {
                console.log("[CdvPurchase.AppleAppStore.SK2Bridge] " + msg);
              };
            }
            if (options.autoFinish) {
              exec("autoFinish", [], noop, noop);
            }
            const setupOk = () => {
              log("setup ok");
              protectCall(this.options.ready, "options.ready");
              protectCall(success, "init.success");
              this.initialized = true;
              this.pendingTransactionsReady = new Promise((resolve2) => {
                this._pendingTransactionsResolve = resolve2;
              });
              setTimeout(() => this.processPendingTransactions(), 50);
            };
            const setupFailed = (err) => {
              log("setup failed");
              protectCall(error, "init.error", CdvPurchase2.ErrorCode.SETUP, "Setup failed: " + err);
            };
            exec("setup", [], setupOk, setupFailed);
          }
          processPendingTransactions() {
            log("processing pending transactions");
            exec("processPendingTransactions", [], () => {
              this.finalizeTransactionUpdates();
              if (this._pendingTransactionsResolve) {
                this._pendingTransactionsResolve();
                this._pendingTransactionsResolve = void 0;
              }
            }, void 0);
          }
          purchase(productId, quantity, applicationUsername, discount, success, error) {
            quantity = quantity | 0 || 1;
            const options = this.options;
            if (this.registeredProducts.indexOf(productId) < 0) {
              const msg = "Purchasing " + productId + " failed. Ensure the product was loaded first with load()!";
              log(msg);
              if (typeof options.error === "function") {
                protectCall(options.error, "options.error", CdvPurchase2.ErrorCode.PURCHASE, "Trying to purchase an unknown product.", { productId, quantity });
              }
              return;
            }
            const purchaseOk = () => {
              log("Purchase enqueued " + productId);
              if (typeof options.purchaseEnqueued === "function") {
                protectCall(options.purchaseEnqueued, "options.purchaseEnqueued", productId, quantity);
              }
              protectCall(success, "purchase.success");
            };
            const purchaseFailed = () => {
              const errMsg = "Purchase failed: " + productId;
              log(errMsg);
              if (typeof options.error === "function") {
                protectCall(options.error, "options.error", CdvPurchase2.ErrorCode.PURCHASE, errMsg, { productId, quantity });
              }
              protectCall(error, "purchase.error");
            };
            exec("purchase", [productId, quantity, applicationUsername, discount || {}], purchaseOk, purchaseFailed);
          }
          canMakePayments(success, error) {
            return exec("canMakePayments", [], success, error);
          }
          restore(callback) {
            this.needRestoreNotification = true;
            exec("restoreCompletedTransactions", [], callback, callback);
          }
          manageSubscriptions(callback) {
            exec("manageSubscriptions", [], callback, callback);
          }
          manageBilling(callback) {
            exec("manageBilling", [], callback, callback);
          }
          presentCodeRedemptionSheet(callback) {
            exec("presentCodeRedemptionSheet", [], callback, callback);
          }
          load(productIds, success, error) {
            const options = this.options;
            if (!productIds || !productIds.length) {
              protectCall(success, "load.success", [], []);
              return;
            }
            log("load " + JSON.stringify(productIds));
            const loadOk = (array) => {
              const valid = array[0];
              const invalid = array[1];
              log("load ok: { valid:" + JSON.stringify(valid) + " invalid:" + JSON.stringify(invalid) + " }");
              protectCall(success, "load.success", valid, invalid);
            };
            const loadFailed = (errMessage) => {
              log("load failed: " + errMessage);
              protectCall(options.error, "options.error", CdvPurchase2.ErrorCode.LOAD, "Load failed: " + errMessage);
              protectCall(error, "load.error", CdvPurchase2.ErrorCode.LOAD, "Load failed: " + errMessage);
            };
            this.registeredProducts = this.registeredProducts.concat(productIds);
            exec("load", [productIds], loadOk, loadFailed);
          }
          finish(transactionId, success, error) {
            exec("finishTransaction", [transactionId], success, error);
          }
          finalizeTransactionUpdates() {
            for (let i = 0; i < this.pendingUpdates.length; ++i) {
              const args = this.pendingUpdates[i];
              this.transactionUpdated(args.state, args.errorCode, args.errorText, args.transactionIdentifier, args.productId, args.transactionReceipt, args.originalTransactionIdentifier, args.transactionDate, args.discountId, args.expirationDate, args.jwsRepresentation, args.quantity);
            }
            this.pendingUpdates = [];
          }
          lastTransactionUpdated() {
          }
          /** Called from native. Same as SK1 but with extra SK2 fields. */
          transactionUpdated(state2, errorCode, errorText, transactionIdentifier, productId, transactionReceipt, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity) {
            if (!this.initialized) {
              this.pendingUpdates.push({
                state: state2,
                errorCode,
                errorText,
                transactionIdentifier,
                productId,
                transactionReceipt,
                originalTransactionIdentifier,
                transactionDate,
                discountId,
                expirationDate,
                jwsRepresentation,
                quantity
              });
              return;
            }
            log("transaction updated:" + transactionIdentifier + " state:" + state2 + " product:" + productId);
            if (productId && transactionIdentifier) {
              if (this.transactionsForProduct[productId]) {
                this.transactionsForProduct[productId].push(transactionIdentifier);
              } else {
                this.transactionsForProduct[productId] = [transactionIdentifier];
              }
            }
            switch (state2) {
              case "PaymentTransactionStatePurchasing":
                protectCall(this.options.purchasing, "options.purchasing", productId);
                return;
              case "PaymentTransactionStatePurchased":
                protectCall(this.options.purchased, "options.purchased", transactionIdentifier, productId, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity);
                return;
              case "PaymentTransactionStateDeferred":
                protectCall(this.options.deferred, "options.deferred", productId);
                return;
              case "PaymentTransactionStateFailed":
                protectCall(this.options.purchaseFailed, "options.purchaseFailed", productId, errorCode || CdvPurchase2.ErrorCode.UNKNOWN, errorText || "ERROR");
                protectCall(this.options.error, "options.error", errorCode || CdvPurchase2.ErrorCode.UNKNOWN, errorText || "ERROR", { productId });
                return;
              case "PaymentTransactionStateRestored":
                protectCall(this.options.restored, "options.restored", transactionIdentifier, productId, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity);
                return;
              case "PaymentTransactionStateFinished":
                protectCall(this.options.finished, "options.finished", transactionIdentifier, productId);
                return;
            }
          }
          restoreCompletedTransactionsFinished() {
            if (!this.needRestoreNotification)
              return;
            this.needRestoreNotification = false;
            protectCall(this.options.restoreCompleted, "options.restoreCompleted");
          }
          restoreCompletedTransactionsFailed(errorCode) {
            if (!this.needRestoreNotification)
              return;
            this.needRestoreNotification = false;
            protectCall(this.options.restoreFailed, "options.restoreFailed", errorCode);
          }
          parseReceiptArgs(args) {
            return {
              appStoreReceipt: args[0],
              bundleIdentifier: args[1],
              bundleShortVersion: args[2],
              bundleNumericVersion: args[3],
              bundleSignature: args[4]
            };
          }
          refreshReceipts(successCb, errorCb) {
            const loaded = (args) => {
              const data = this.parseReceiptArgs(args);
              this.appStoreReceipt = data;
              protectCall(this.options.receiptsRefreshed, "options.receiptsRefreshed", data);
              protectCall(successCb, "refreshReceipts.success", data);
            };
            const error = (errMessage) => {
              log("refresh receipt failed: " + errMessage);
              protectCall(errorCb, "refreshReceipts.error", CdvPurchase2.ErrorCode.REFRESH_RECEIPTS, "Failed to refresh receipt: " + errMessage);
            };
            this.appStoreReceipt = null;
            exec("appStoreRefreshReceipt", [], loaded, error);
          }
          /** Retrieve the storefront country code from StoreKit */
          getStorefront() {
            return new Promise((resolve2) => {
              window.cordova.exec((countryCode) => {
                resolve2(countryCode || void 0);
              }, (err) => {
                log("getStorefront failed: " + err);
                resolve2(void 0);
              }, "StoreKit2Plugin", "getStorefront", []);
            });
          }
          loadReceipts(callback, errorCb) {
            const loaded = (args) => {
              const data = this.parseReceiptArgs(args);
              this.appStoreReceipt = data;
              protectCall(callback, "loadReceipts.callback", data);
            };
            log("loading appStoreReceipt (SK2)");
            exec("appStoreReceipt", [], loaded, void 0);
          }
        }
        SK2Bridge.SK2NativeBridge = SK2NativeBridge;
      })(AppleAppStore.SK2Bridge || (AppleAppStore.SK2Bridge = {}));
    })(CdvPurchase2.AppleAppStore || (CdvPurchase2.AppleAppStore = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(AppleAppStore) {
      (function(Bridge_1) {
        const noop = (args) => {
        };
        let log = noop;
        function exec(methodName, options, success, error) {
          window.cordova.exec(success, error, "InAppPurchase", methodName, options);
        }
        function protectCall(callback, context, ...args) {
          if (!callback) {
            return;
          }
          try {
            callback.apply(this, args);
          } catch (err) {
            log("exception in " + context + ': "' + err + '"');
          }
        }
        class Bridge {
          constructor() {
            this.transactionsForProduct = {};
            this.initialized = false;
            this.registeredProducts = [];
            this.needRestoreNotification = false;
            this.pendingUpdates = [];
            this.onPurchased = false;
            this.onFailed = false;
            this.onRestored = false;
            window.storekit = this;
            this.options = {
              error: noop,
              ready: noop,
              purchased: noop,
              purchaseEnqueued: noop,
              purchasing: noop,
              purchaseFailed: noop,
              deferred: noop,
              finished: noop,
              restored: noop,
              receiptsRefreshed: noop,
              restoreFailed: noop,
              restoreCompleted: noop
            };
          }
          /**
           * Initialize the AppStore bridge.
           *
           * This calls the native "setup" method from the "InAppPurchase" Objective-C class.
           *
           * @param options Options for the bridge
           * @param success Called when the bridge is ready
           * @param error Called when the bridge failed to initialize
           */
          init(options, success, error) {
            this.options = {
              error: options.error || noop,
              ready: options.ready || noop,
              purchased: options.purchased || noop,
              purchaseEnqueued: options.purchaseEnqueued || noop,
              purchasing: options.purchasing || noop,
              purchaseFailed: options.purchaseFailed || noop,
              deferred: options.deferred || noop,
              finished: options.finished || noop,
              restored: options.restored || noop,
              receiptsRefreshed: options.receiptsRefreshed || noop,
              restoreFailed: options.restoreFailed || noop,
              restoreCompleted: options.restoreCompleted || noop
            };
            if (options.debug) {
              exec("debug", [], noop, noop);
              log = options.log || function(msg) {
                console.log("[CdvPurchase.AppAppStore.Bridge] " + msg);
              };
            }
            if (options.autoFinish) {
              exec("autoFinish", [], noop, noop);
            }
            const setupOk = () => {
              log("setup ok");
              protectCall(this.options.ready, "options.ready");
              protectCall(success, "init.success");
              this.initialized = true;
              this.pendingTransactionsReady = new Promise((resolve2) => {
                this._pendingTransactionsResolve = resolve2;
              });
              setTimeout(() => this.processPendingTransactions(), 50);
            };
            const setupFailed = (err) => {
              log("setup failed");
              protectCall(error, "init.error", CdvPurchase2.ErrorCode.SETUP, "Setup failed: " + err);
            };
            exec("setup", [], setupOk, setupFailed);
          }
          processPendingTransactions() {
            log("processing pending transactions");
            exec("processPendingTransactions", [], () => {
              this.finalizeTransactionUpdates();
              if (this._pendingTransactionsResolve) {
                this._pendingTransactionsResolve();
                this._pendingTransactionsResolve = void 0;
              }
            }, void 0);
          }
          /**
           * Makes an in-app purchase.
           *
           * @param {String} productId The product identifier. e.g. "com.example.MyApp.myproduct"
           * @param {int} quantity Quantity of product to purchase
           */
          purchase(productId, quantity, applicationUsername, discount, success, error) {
            quantity = quantity | 0 || 1;
            const options = this.options;
            if (this.registeredProducts.indexOf(productId) < 0) {
              const msg = "Purchasing " + productId + " failed.  Ensure the product was loaded first with Bridge.load(...)!";
              log(msg);
              if (typeof options.error === "function") {
                protectCall(options.error, "options.error", CdvPurchase2.ErrorCode.PURCHASE, "Trying to purchase a unknown product.", { productId, quantity });
              }
              return;
            }
            const purchaseOk = () => {
              log("Purchase enqueued " + productId);
              if (typeof options.purchaseEnqueued === "function") {
                protectCall(options.purchaseEnqueued, "options.purchaseEnqueued", productId, quantity);
              }
              protectCall(success, "purchase.success");
            };
            const purchaseFailed = () => {
              const errMsg = "Purchase failed: " + productId;
              log(errMsg);
              if (typeof options.error === "function") {
                protectCall(options.error, "options.error", CdvPurchase2.ErrorCode.PURCHASE, errMsg, { productId, quantity });
              }
              protectCall(error, "purchase.error");
            };
            exec("purchase", [productId, quantity, applicationUsername, discount || {}], purchaseOk, purchaseFailed);
          }
          /**
           * Checks if device/user is allowed to make in-app purchases
           */
          canMakePayments(success, error) {
            return exec("canMakePayments", [], success, error);
          }
          /**
           * Asks the payment queue to restore previously completed purchases.
           *
           * The restored transactions are passed to the onRestored callback, so make sure you define a handler for that first.
           */
          restore(callback) {
            this.needRestoreNotification = true;
            exec("restoreCompletedTransactions", [], callback, callback);
          }
          manageSubscriptions(callback) {
            exec("manageSubscriptions", [], callback, callback);
          }
          manageBilling(callback) {
            exec("manageBilling", [], callback, callback);
          }
          presentCodeRedemptionSheet(callback) {
            exec("presentCodeRedemptionSheet", [], callback, callback);
          }
          /**
           * Retrieves localized product data, including price (as localized
           * string), name, description of multiple products.
           *
           * @param {Array} productIds
           *   An array of product identifier strings.
           *
           * @param {Function} callback
           *   Called once with the result of the products request. Signature:
           *
           *     function(validProducts, invalidProductIds)
           *
           *   where validProducts receives an array of objects of the form:
           *
           *     {
           *       id: "<productId>",
           *       title: "<localised title>",
           *       description: "<localised escription>",
           *       price: "<localised price>"
           *     }
           *
           *  and invalidProductIds receives an array of product identifier
           *  strings which were rejected by the app store.
           */
          load(productIds, success, error) {
            const options = this.options;
            if (typeof productIds === "string") {
              productIds = [productIds];
            }
            if (!productIds) {
              protectCall(success, "load.success", [], []);
            } else if (!productIds.length) {
              protectCall(success, "load.success", [], []);
            } else {
              if (typeof productIds[0] !== "string") {
                const msg = "invalid productIds given to store.load: " + JSON.stringify(productIds);
                log(msg);
                protectCall(options.error, "options.error", CdvPurchase2.ErrorCode.LOAD, msg);
                protectCall(error, "load.error", CdvPurchase2.ErrorCode.LOAD, msg);
                return;
              }
              log("load " + JSON.stringify(productIds));
              const loadOk = (array) => {
                const valid = array[0];
                const invalid = array[1];
                log("load ok: { valid:" + JSON.stringify(valid) + " invalid:" + JSON.stringify(invalid) + " }");
                protectCall(success, "load.success", valid, invalid);
              };
              const loadFailed = (errMessage) => {
                log("load failed");
                log(errMessage);
                const message = "Load failed: " + errMessage;
                protectCall(options.error, "options.error", CdvPurchase2.ErrorCode.LOAD, message);
                protectCall(error, "load.error", CdvPurchase2.ErrorCode.LOAD, message);
              };
              this.registeredProducts = this.registeredProducts.concat(productIds);
              exec("load", [productIds], loadOk, loadFailed);
            }
          }
          /*
           * Finish an unfinished transaction.
           *
           * @param {String} transactionId
           *    Identifier of the transaction to finish.
           *
           * You have to call this method manually except when using the autoFinish option.
           */
          finish(transactionId, success, error) {
            exec("finishTransaction", [transactionId], success, error);
          }
          finalizeTransactionUpdates() {
            for (let i = 0; i < this.pendingUpdates.length; ++i) {
              const args = this.pendingUpdates[i];
              this.transactionUpdated(args.state, args.errorCode, args.errorText, args.transactionIdentifier, args.productId, args.transactionReceipt, args.originalTransactionIdentifier, args.transactionDate, args.discountId, args.quantity);
            }
            this.pendingUpdates = [];
          }
          lastTransactionUpdated() {
          }
          // This is called from native.
          //
          // Note that it may eventually be called before initialization... unfortunately.
          // In this case, we'll just keep pending updates in a list for later processing.
          transactionUpdated(state2, errorCode, errorText, transactionIdentifier, productId, transactionReceipt, originalTransactionIdentifier, transactionDate, discountId, quantity) {
            if (!this.initialized) {
              this.pendingUpdates.push({ state: state2, errorCode, errorText, transactionIdentifier, productId, transactionReceipt, originalTransactionIdentifier, transactionDate, discountId, quantity });
              return;
            }
            log("transaction updated:" + transactionIdentifier + " state:" + state2 + " product:" + productId);
            if (productId && transactionIdentifier) {
              if (this.transactionsForProduct[productId]) {
                this.transactionsForProduct[productId].push(transactionIdentifier);
              } else {
                this.transactionsForProduct[productId] = [transactionIdentifier];
              }
            }
            switch (state2) {
              case "PaymentTransactionStatePurchasing":
                protectCall(this.options.purchasing, "options.purchasing", productId);
                return;
              case "PaymentTransactionStatePurchased":
                protectCall(this.options.purchased, "options.purchase", transactionIdentifier, productId, originalTransactionIdentifier, transactionDate, discountId, void 0, void 0, quantity);
                return;
              case "PaymentTransactionStateDeferred":
                protectCall(this.options.deferred, "options.deferred", productId);
                return;
              case "PaymentTransactionStateFailed":
                protectCall(this.options.purchaseFailed, "options.purchaseFailed", productId, errorCode || CdvPurchase2.ErrorCode.UNKNOWN, errorText || "ERROR");
                protectCall(this.options.error, "options.error", errorCode || CdvPurchase2.ErrorCode.UNKNOWN, errorText || "ERROR", { productId });
                return;
              case "PaymentTransactionStateRestored":
                protectCall(this.options.restored, "options.restore", transactionIdentifier, productId, void 0, void 0, void 0, void 0, void 0, quantity);
                return;
              case "PaymentTransactionStateFinished":
                protectCall(this.options.finished, "options.finish", transactionIdentifier, productId);
                return;
            }
          }
          restoreCompletedTransactionsFinished() {
            if (!this.needRestoreNotification)
              return;
            this.needRestoreNotification = false;
            protectCall(this.options.restoreCompleted, "options.restoreCompleted");
          }
          restoreCompletedTransactionsFailed(errorCode) {
            if (!this.needRestoreNotification)
              return;
            this.needRestoreNotification = false;
            protectCall(this.options.restoreFailed, "options.restoreFailed", errorCode);
          }
          parseReceiptArgs(args) {
            const base64 = args[0];
            const bundleIdentifier = args[1];
            const bundleShortVersion = args[2];
            const bundleNumericVersion = args[3];
            const bundleSignature = args[4];
            log("infoPlist: " + bundleIdentifier + "," + bundleShortVersion + "," + bundleNumericVersion + "," + bundleSignature);
            return {
              appStoreReceipt: base64,
              bundleIdentifier,
              bundleShortVersion,
              bundleNumericVersion,
              bundleSignature
            };
          }
          refreshReceipts(successCb, errorCb) {
            const loaded = (args) => {
              const data = this.parseReceiptArgs(args);
              this.appStoreReceipt = data;
              protectCall(this.options.receiptsRefreshed, "options.receiptsRefreshed", data);
              protectCall(successCb, "refreshReceipts.success", data);
            };
            const error = (errMessage) => {
              log("refresh receipt failed: " + errMessage);
              if (errMessage.includes("(@AMSErrorDomain:100)")) {
                log('authentication failed, indicated by the string "(@AMSErrorDomain:100)"');
              }
              protectCall(this.options.error, "options.error", CdvPurchase2.ErrorCode.REFRESH_RECEIPTS, "Failed to refresh receipt: " + errMessage);
              protectCall(errorCb, "refreshReceipts.error", CdvPurchase2.ErrorCode.REFRESH_RECEIPTS, "Failed to refresh receipt: " + errMessage);
            };
            this.appStoreReceipt = null;
            log("refreshing appStoreReceipt");
            exec("appStoreRefreshReceipt", [], loaded, error);
          }
          /** Retrieve the storefront country code from StoreKit */
          getStorefront() {
            return new Promise((resolve2) => {
              exec("getStorefront", [], (countryCode) => {
                resolve2(countryCode || void 0);
              }, (err) => {
                log("getStorefront failed: " + err);
                resolve2(void 0);
              });
            });
          }
          loadReceipts(callback, errorCb) {
            const loaded = (args) => {
              const data = this.parseReceiptArgs(args);
              this.appStoreReceipt = data;
              protectCall(callback, "loadReceipts.callback", data);
            };
            const error = (errMessage) => {
            };
            log("loading appStoreReceipt");
            exec("appStoreReceipt", [], loaded, error);
          }
        }
        Bridge_1.Bridge = Bridge;
      })(AppleAppStore.Bridge || (AppleAppStore.Bridge = {}));
    })(CdvPurchase2.AppleAppStore || (CdvPurchase2.AppleAppStore = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(AppleAppStore) {
      (function(Internal) {
        class DiscountEligibilities {
          constructor(request, response) {
            this.request = request;
            this.response = response;
          }
          isEligible(productId, discountType, discountId) {
            var _a;
            for (let i = 0; i < this.request.length; ++i) {
              const req = this.request[i];
              if (req.productId === productId && req.discountId === discountId && req.discountType === discountType) {
                return (_a = this.response[i]) !== null && _a !== void 0 ? _a : false;
              }
            }
            return true;
          }
        }
        Internal.DiscountEligibilities = DiscountEligibilities;
        function collectEligibilityRequests(validProducts) {
          const requests = [];
          const nativeAnswers = [];
          validProducts.forEach((valid) => {
            var _a, _b, _c;
            (_a = valid.discounts) === null || _a === void 0 ? void 0 : _a.forEach((discount) => {
              requests.push({
                productId: valid.id,
                discountId: discount.id,
                discountType: discount.type
              });
              nativeAnswers.push(discount.type === "Introductory" ? valid.introPriceEligible : void 0);
            });
            if (((_c = (_b = valid.discounts) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) === 0 && valid.introPrice) {
              requests.push({
                productId: valid.id,
                discountId: "intro",
                discountType: "Introductory"
              });
              nativeAnswers.push(valid.introPriceEligible);
            }
          });
          return { requests, nativeAnswers };
        }
        Internal.collectEligibilityRequests = collectEligibilityRequests;
        function mergeNativeEligibility(determinerResponse, nativeAnswers) {
          return determinerResponse.map((r, i) => nativeAnswers[i] !== void 0 ? nativeAnswers[i] : r);
        }
        Internal.mergeNativeEligibility = mergeNativeEligibility;
      })(AppleAppStore.Internal || (AppleAppStore.Internal = {}));
    })(CdvPurchase2.AppleAppStore || (CdvPurchase2.AppleAppStore = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(AppleAppStore) {
      AppleAppStore.DEFAULT_OFFER_ID = "$";
      class SKOffer extends CdvPurchase2.Offer {
        constructor(options, decorator) {
          super(options, decorator);
          this.offerType = options.offerType;
        }
      }
      AppleAppStore.SKOffer = SKOffer;
      class SKProduct extends CdvPurchase2.Product {
        constructor(validProduct, p, decorator, eligibilities) {
          super(p, decorator);
          this.raw = validProduct;
          this.refresh(validProduct, decorator, eligibilities);
        }
        removeIneligibleDiscounts(eligibilities) {
          this.offers = this.offers.filter((offer) => {
            const skOffer = offer;
            if (skOffer.offerType === "Default")
              return true;
            return eligibilities.isEligible(this.id, skOffer.offerType, offer.id);
          });
        }
        refresh(valid, decorator, eligibilities) {
          var _a;
          this.raw = valid;
          this.title = valid.title;
          this.description = valid.description;
          this.countryCode = valid.countryCode;
          if (valid.group)
            this.group = valid.group;
          this.removeIneligibleDiscounts(eligibilities);
          const finalPhase = {
            price: valid.price,
            priceMicros: valid.priceMicros,
            currency: valid.currency,
            billingPeriod: formatBillingPeriod(valid.billingPeriod, valid.billingPeriodUnit),
            paymentMode: this.type === CdvPurchase2.ProductType.PAID_SUBSCRIPTION ? CdvPurchase2.PaymentMode.PAY_AS_YOU_GO : CdvPurchase2.PaymentMode.UP_FRONT,
            recurrenceMode: this.type === CdvPurchase2.ProductType.PAID_SUBSCRIPTION ? CdvPurchase2.RecurrenceMode.INFINITE_RECURRING : CdvPurchase2.RecurrenceMode.NON_RECURRING
          };
          (_a = valid.discounts) === null || _a === void 0 ? void 0 : _a.forEach((discount) => {
            if (eligibilities.isEligible(valid.id, discount.type, discount.id)) {
              const pricingPhases = [];
              const numCycles = discount.paymentMode === CdvPurchase2.PaymentMode.PAY_AS_YOU_GO ? discount.period : 1;
              const numPeriods = discount.paymentMode === CdvPurchase2.PaymentMode.PAY_AS_YOU_GO ? 1 : discount.period;
              const discountPhase = {
                price: discount.price,
                priceMicros: discount.priceMicros,
                currency: valid.currency,
                billingPeriod: formatBillingPeriod(numPeriods, discount.periodUnit),
                billingCycles: numCycles,
                paymentMode: discount.paymentMode,
                recurrenceMode: CdvPurchase2.RecurrenceMode.FINITE_RECURRING
              };
              pricingPhases.push(discountPhase);
              pricingPhases.push(finalPhase);
              this.addOffer(new SKOffer({ id: discount.id, product: this, pricingPhases, offerType: discount.type }, decorator));
            }
          });
          if (!hasIntroductoryOffer(this)) {
            const defaultPhases = [];
            if (valid.introPrice && valid.introPriceMicros !== void 0 && eligibilities.isEligible(valid.id, "Introductory", "intro")) {
              const introPrice = {
                price: valid.introPrice,
                priceMicros: valid.introPriceMicros,
                currency: valid.currency,
                billingPeriod: formatBillingPeriod(valid.introPricePeriod, valid.introPricePeriodUnit),
                paymentMode: valid.introPricePaymentMode,
                recurrenceMode: CdvPurchase2.RecurrenceMode.FINITE_RECURRING,
                billingCycles: 1
              };
              defaultPhases.push(introPrice);
            }
            defaultPhases.push(finalPhase);
            this.addOffer(new SKOffer({
              id: AppleAppStore.DEFAULT_OFFER_ID,
              product: this,
              pricingPhases: defaultPhases,
              offerType: "Default"
            }, decorator));
          }
          const defaultIndex = this.offers.findIndex((o) => o.id === AppleAppStore.DEFAULT_OFFER_ID);
          if (defaultIndex > 0) {
            const [defaultOffer] = this.offers.splice(defaultIndex, 1);
            this.offers.unshift(defaultOffer);
          }
          function hasIntroductoryOffer(product) {
            return product.offers.filter((offer) => {
              const skOffer = offer;
              return skOffer.offerType === "Introductory" || skOffer.offerType === "Default" && skOffer.pricingPhases.length > 1;
            }).length > 0;
          }
          function formatBillingPeriod(numPeriods, period) {
            if (numPeriods && period)
              return `P${numPeriods}${period[0]}`;
            else
              return void 0;
          }
        }
      }
      AppleAppStore.SKProduct = SKProduct;
    })(CdvPurchase2.AppleAppStore || (CdvPurchase2.AppleAppStore = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(AppleAppStore) {
      AppleAppStore.APPLICATION_VIRTUAL_TRANSACTION_ID = "appstore.application";
      class SKApplicationReceipt extends CdvPurchase2.Receipt {
        constructor(applicationReceipt, needApplicationReceipt, decorator) {
          super(CdvPurchase2.Platform.APPLE_APPSTORE, decorator);
          this.nativeData = applicationReceipt;
          this.refresh(this.nativeData, needApplicationReceipt, decorator);
        }
        refresh(nativeData, needApplicationReceipt, decorator) {
          this.nativeData = nativeData;
          if (needApplicationReceipt) {
            const existing = this.transactions.find((t2) => t2.transactionId === AppleAppStore.APPLICATION_VIRTUAL_TRANSACTION_ID);
            if (existing) {
              return;
            }
            const t = new CdvPurchase2.Transaction(CdvPurchase2.Platform.APPLE_APPSTORE, this, decorator);
            t.transactionId = AppleAppStore.APPLICATION_VIRTUAL_TRANSACTION_ID;
            t.state = CdvPurchase2.TransactionState.APPROVED;
            t.products.push({
              id: nativeData.bundleIdentifier
            });
            this.transactions.push(t);
          }
        }
      }
      AppleAppStore.SKApplicationReceipt = SKApplicationReceipt;
      class SKTransaction extends CdvPurchase2.Transaction {
        refresh(productId, originalTransactionIdentifier, transactionDate, discountId, expirationDateMs, jwsRepresentation, quantity) {
          if (productId)
            this.products = [{ id: productId, offerId: discountId }];
          if (originalTransactionIdentifier)
            this.originalTransactionId = originalTransactionIdentifier;
          if (transactionDate)
            this.purchaseDate = /* @__PURE__ */ new Date(+transactionDate);
          if (expirationDateMs)
            this.expirationDate = /* @__PURE__ */ new Date(+expirationDateMs);
          if (jwsRepresentation)
            this.jwsRepresentation = jwsRepresentation;
          if (quantity !== void 0)
            this.quantity = quantity;
        }
      }
      AppleAppStore.SKTransaction = SKTransaction;
    })(CdvPurchase2.AppleAppStore || (CdvPurchase2.AppleAppStore = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(AppleAppStore) {
      (function(VerifyReceipt) {
        (function(AppleExpirationIntent) {
          AppleExpirationIntent["CANCELED"] = "1";
          AppleExpirationIntent["BILLING_ERROR"] = "2";
          AppleExpirationIntent["PRICE_INCREASE"] = "3";
          AppleExpirationIntent["PRODUCT_NOT_AVAILABLE"] = "4";
          AppleExpirationIntent["UNKNOWN"] = "5";
        })(VerifyReceipt.AppleExpirationIntent || (VerifyReceipt.AppleExpirationIntent = {}));
      })(AppleAppStore.VerifyReceipt || (AppleAppStore.VerifyReceipt = {}));
    })(CdvPurchase2.AppleAppStore || (CdvPurchase2.AppleAppStore = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Braintree) {
      class BraintreeReceipt extends CdvPurchase2.Receipt {
        constructor(paymentRequest, dropInResult, decorator) {
          var _a, _b, _c;
          super(CdvPurchase2.Platform.BRAINTREE, decorator);
          const transaction2 = new CdvPurchase2.Transaction(CdvPurchase2.Platform.BRAINTREE, this, decorator);
          transaction2.purchaseDate = /* @__PURE__ */ new Date();
          transaction2.products = ((_a = paymentRequest.items) === null || _a === void 0 ? void 0 : _a.filter((p) => p).map((product) => ({ id: (product === null || product === void 0 ? void 0 : product.id) || "" }))) || [];
          transaction2.state = CdvPurchase2.TransactionState.APPROVED;
          transaction2.transactionId = (_c = (_b = dropInResult.paymentMethodNonce) === null || _b === void 0 ? void 0 : _b.nonce) !== null && _c !== void 0 ? _c : `UNKNOWN_${dropInResult.paymentMethodType}_${dropInResult.paymentDescription}`;
          this.transactions = [transaction2];
          this.dropInResult = dropInResult;
          this.paymentRequest = paymentRequest;
          this.refresh(paymentRequest, dropInResult, decorator);
        }
        refresh(paymentRequest, dropInResult, decorator) {
          var _a, _b;
          this.dropInResult = dropInResult;
          this.paymentRequest = paymentRequest;
          const transaction2 = new CdvPurchase2.Transaction(CdvPurchase2.Platform.BRAINTREE, this, decorator);
          transaction2.products = paymentRequest.items.filter((p) => p).map((product) => ({ id: (product === null || product === void 0 ? void 0 : product.id) || "" }));
          transaction2.state = CdvPurchase2.TransactionState.APPROVED;
          transaction2.transactionId = (_b = (_a = dropInResult.paymentMethodNonce) === null || _a === void 0 ? void 0 : _a.nonce) !== null && _b !== void 0 ? _b : `UNKNOWN_${dropInResult.paymentMethodType}_${dropInResult.paymentDescription}`;
          transaction2.amountMicros = paymentRequest.amountMicros;
          transaction2.currency = paymentRequest.currency;
          this.transactions = [transaction2];
        }
      }
      Braintree.BraintreeReceipt = BraintreeReceipt;
      class Adapter {
        constructor(context, options) {
          this.id = CdvPurchase2.Platform.BRAINTREE;
          this.name = "BrainTree";
          this.ready = false;
          this.products = [];
          this._receipts = [];
          this.supportsParallelLoading = false;
          this.context = context;
          this.log = context.log.child("Braintree");
          this.options = options;
        }
        get receipts() {
          return this._receipts;
        }
        get isSupported() {
          return Braintree.IosBridge.Bridge.isSupported() || Braintree.AndroidBridge.Bridge.isSupported();
        }
        /**
         * Initialize the Braintree Adapter.
         */
        initialize() {
          return new Promise((resolve2) => {
            this.log.info("initialize()");
            if (Braintree.IosBridge.Bridge.isSupported()) {
              this.log.info("instantiating ios bridge...");
              this.iosBridge = new Braintree.IosBridge.Bridge(this.log, (callback) => {
                if (this.options.tokenizationKey)
                  callback(this.options.tokenizationKey);
                else if (this.options.clientTokenProvider)
                  this.options.clientTokenProvider(callback);
                else
                  callback(braintreeError(CdvPurchase2.ErrorCode.CLIENT_INVALID, "Braintree iOS Bridge requires a clientTokenProvider or tokenizationKey"));
              }, this.options.applePay);
              this.iosBridge.initialize(this.context, resolve2);
            } else if (Braintree.AndroidBridge.Bridge.isSupported() && !this.androidBridge) {
              this.log.info("instantiating android bridge...");
              this.androidBridge = new Braintree.AndroidBridge.Bridge(this.log);
              this.log.info("calling android bridge -> initialize...");
              const auth = this.options.tokenizationKey ? this.options.tokenizationKey : this.options.clientTokenProvider ? this.options.clientTokenProvider : "";
              this.androidBridge.initialize(auth, resolve2);
            } else {
              this.log.info("platform not supported...");
              resolve2(void 0);
            }
            this.context.listener.receiptsReady(CdvPurchase2.Platform.BRAINTREE);
          });
        }
        loadProducts(products) {
          return __awaiter(this, void 0, void 0, function* () {
            return products.map((p) => braintreeError(CdvPurchase2.ErrorCode.PRODUCT_NOT_AVAILABLE, "N/A"));
          });
        }
        loadReceipts() {
          return __awaiter(this, void 0, void 0, function* () {
            this.context.listener.receiptsReady(CdvPurchase2.Platform.BRAINTREE);
            return [];
          });
        }
        order(offer) {
          return __awaiter(this, void 0, void 0, function* () {
            return braintreeError(CdvPurchase2.ErrorCode.UNKNOWN, "N/A: Not implemented with Braintree");
          });
        }
        finish(transaction2) {
          return __awaiter(this, void 0, void 0, function* () {
            transaction2.state = CdvPurchase2.TransactionState.FINISHED;
            this.context.listener.receiptsUpdated(CdvPurchase2.Platform.TEST, [transaction2.parentReceipt]);
            return;
          });
        }
        manageSubscriptions() {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info("N/A: manageSubscriptions() is not available with Braintree");
            return;
          });
        }
        manageBilling() {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info("N/A: manageBilling() is not available with Braintree");
            return;
          });
        }
        // async getNonce(paymentMethod: PaymentMethod): Promise<Nonce | IError> {
        //     return new Promise(resolve => {
        //         if (this.options.nonceProvider) {
        //             this.options.nonceProvider(paymentMethod, resolve);
        //         }
        //         else {
        //             resolve({
        //                 code: ErrorCode.UNAUTHORIZED_REQUEST_DATA,
        //                 message: 'Braintree requires a nonceProvider',
        //             });
        //         }
        //     });
        // }
        launchDropIn(paymentRequest, dropInRequest) {
          return __awaiter(this, void 0, void 0, function* () {
            if (this.androidBridge)
              return this.androidBridge.launchDropIn(dropInRequest);
            if (this.iosBridge)
              return this.iosBridge.launchDropIn(paymentRequest, dropInRequest);
            return braintreeError(CdvPurchase2.ErrorCode.PURCHASE, "Braintree is not available");
          });
        }
        requestPayment(paymentRequest, additionalData) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _j;
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info("requestPayment()" + JSON.stringify(paymentRequest));
            const dropInRequest = ((_a = additionalData === null || additionalData === void 0 ? void 0 : additionalData.braintree) === null || _a === void 0 ? void 0 : _a.dropInRequest) || {};
            if (!(yield Braintree.IosBridge.ApplePayPlugin.isSupported(this.log))) {
              this.log.info("Apple Pay is not supported.");
              dropInRequest.applePayDisabled = true;
            }
            if (this.options.googlePay || dropInRequest.googlePayRequest) {
              const googlePay = Object.assign(Object.assign({}, (_b = this.options.googlePay) !== null && _b !== void 0 ? _b : {}), (_c = dropInRequest.googlePayRequest) !== null && _c !== void 0 ? _c : {});
              if (!googlePay.transactionInfo) {
                googlePay.transactionInfo = {
                  currencyCode: (_d = paymentRequest.currency) !== null && _d !== void 0 ? _d : "",
                  totalPrice: ((_e = paymentRequest.amountMicros) !== null && _e !== void 0 ? _e : 0) / 1e6,
                  totalPriceStatus: Braintree.GooglePay.TotalPriceStatus.FINAL
                };
              }
              dropInRequest.googlePayRequest = googlePay;
            }
            if (this.options.threeDSecure || dropInRequest.threeDSecureRequest) {
              const threeDS = Object.assign(Object.assign({}, (_f = this.options.threeDSecure) !== null && _f !== void 0 ? _f : {}), (_g = dropInRequest.threeDSecureRequest) !== null && _g !== void 0 ? _g : {});
              if (!threeDS.amount) {
                threeDS.amount = asDecimalString((_h = paymentRequest.amountMicros) !== null && _h !== void 0 ? _h : 0);
              }
              if (!threeDS.billingAddress && paymentRequest.billingAddress) {
                threeDS.billingAddress = {
                  givenName: paymentRequest.billingAddress.givenName,
                  surname: paymentRequest.billingAddress.surname,
                  countryCodeAlpha2: paymentRequest.billingAddress.countryCode,
                  postalCode: paymentRequest.billingAddress.postalCode,
                  locality: paymentRequest.billingAddress.locality,
                  streetAddress: paymentRequest.billingAddress.streetAddress1,
                  extendedAddress: paymentRequest.billingAddress.streetAddress2,
                  line3: paymentRequest.billingAddress.streetAddress3,
                  phoneNumber: paymentRequest.billingAddress.phoneNumber,
                  region: paymentRequest.billingAddress.region
                };
              }
              if (!threeDS.email) {
                threeDS.email = paymentRequest.email;
              }
              dropInRequest.threeDSecureRequest = threeDS;
            }
            const response = yield this.launchDropIn(paymentRequest, dropInRequest);
            if (!dropInResponseIsOK(response))
              return dropInResponseError(this.log, response);
            const dropInResult = response;
            this.log.info("launchDropIn success: " + JSON.stringify({ paymentRequest, dropInResult }));
            if (!((_j = dropInResult.paymentMethodNonce) === null || _j === void 0 ? void 0 : _j.nonce)) {
              return braintreeError(CdvPurchase2.ErrorCode.BAD_RESPONSE, "launchDropIn returned no paymentMethodNonce");
            }
            let receipt = this._receipts.find((r) => {
              var _a2, _b2;
              return ((_a2 = r.dropInResult.paymentMethodNonce) === null || _a2 === void 0 ? void 0 : _a2.nonce) === ((_b2 = dropInResult.paymentMethodNonce) === null || _b2 === void 0 ? void 0 : _b2.nonce);
            });
            if (receipt) {
              receipt.refresh(paymentRequest, dropInResult, this.context.apiDecorators);
            } else {
              receipt = new BraintreeReceipt(paymentRequest, dropInResult, this.context.apiDecorators);
              this.receipts.push(receipt);
            }
            this.context.listener.receiptsUpdated(CdvPurchase2.Platform.BRAINTREE, [receipt]);
            return receipt.transactions[0];
          });
        }
        receiptValidationBody(receipt) {
          var _a, _b, _c, _d, _e;
          return __awaiter(this, void 0, void 0, function* () {
            if (!isBraintreeReceipt(receipt)) {
              this.log.error("Unexpected error, expecting a BraintreeReceipt: " + JSON.stringify(receipt));
              return;
            }
            this.log.info("create receiptValidationBody for: " + JSON.stringify(receipt));
            return {
              id: (_c = (_b = (_a = receipt.paymentRequest.items) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : "unknown",
              type: CdvPurchase2.ProductType.CONSUMABLE,
              priceMicros: receipt.paymentRequest.amountMicros,
              currency: receipt.paymentRequest.currency,
              products: [],
              transaction: {
                type: CdvPurchase2.Platform.BRAINTREE,
                deviceData: receipt.dropInResult.deviceData,
                id: "nonce",
                paymentMethodNonce: (_e = (_d = receipt.dropInResult.paymentMethodNonce) === null || _d === void 0 ? void 0 : _d.nonce) !== null && _e !== void 0 ? _e : "",
                paymentDescription: receipt.dropInResult.paymentDescription,
                paymentMethodType: receipt.dropInResult.paymentMethodType
              }
            };
          });
        }
        /**
         * Handle a response from a receipt validation process.
         *
         * @param receipt The receipt being validated.
         * @param response The response payload from the receipt validation process.
         * @returns A promise that resolves when the response has been handled.
         */
        handleReceiptValidationResponse(receipt, response) {
          var _a;
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info("receipt validation response: " + JSON.stringify(response));
            if ((response === null || response === void 0 ? void 0 : response.data) && "transaction" in response.data) {
              if (response.data.transaction.type === "braintree") {
                const lCustomerId = (_a = response.data.transaction.data.transaction) === null || _a === void 0 ? void 0 : _a.customer.id;
                if (lCustomerId && !Braintree.customerId) {
                  this.log.info("customerId updated: " + lCustomerId);
                  Braintree.customerId = lCustomerId;
                }
              }
            }
          });
        }
        checkSupport(functionality) {
          return functionality === "requestPayment";
        }
        restorePurchases() {
          return __awaiter(this, void 0, void 0, function* () {
            return void 0;
          });
        }
      }
      Braintree.Adapter = Adapter;
      function asDecimalString(amountMicros) {
        const amountCents = "" + amountMicros / 1e4;
        return (amountCents.slice(0, -2) || "0") + "." + (amountCents.slice(-2, -1) || "0") + (amountCents.slice(-1) || "0");
      }
      function isBraintreeReceipt(receipt) {
        return receipt.platform === CdvPurchase2.Platform.BRAINTREE;
      }
      const dropInResponseIsOK = (response) => {
        return !!response && !("code" in response && "message" in response);
      };
      const dropInResponseError = (log, response) => {
        if (!response) {
          log.warn("launchDropIn failed: no response");
          return braintreeError(CdvPurchase2.ErrorCode.BAD_RESPONSE, "Braintree failed to launch drop in");
        } else {
          if (response.code === CdvPurchase2.ErrorCode.PAYMENT_CANCELLED) {
            log.info("User cancelled the payment request");
            return void 0;
          }
          log.warn("launchDropIn failed: " + JSON.stringify(response));
          return response;
        }
      };
      function braintreeError(code, message) {
        return CdvPurchase2.storeError(code, message, CdvPurchase2.Platform.BRAINTREE, null);
      }
      Braintree.braintreeError = braintreeError;
    })(CdvPurchase2.Braintree || (CdvPurchase2.Braintree = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Braintree) {
      const PLUGIN_ID = "BraintreePlugin";
      (function(AndroidBridge) {
        class Bridge {
          constructor(log) {
            this.log = log.child("AndroidBridge");
          }
          /** Receive asynchronous messages from the native side */
          listener(msg) {
            this.log.debug("listener: " + JSON.stringify(msg));
            if (!msg || !msg.type) {
              return;
            }
            if (msg.type === "getClientToken") {
              this.getClientToken();
            } else if (msg.type === "ready") ;
          }
          // Braintree reported an error
          // private onError(message: string) {
          //     this.log.warn("Braintree reported an error: " + message);
          //     // TODO - bubble that up to the client
          // }
          /*
           * Initialize the braintree client.
           *
           * @param clientTokenProvider Provide clientTokens to the SDK when it needs them.
           */
          initialize(clientTokenProvider, callback) {
            try {
              if (typeof clientTokenProvider === "string") {
                const token = clientTokenProvider;
                this.clientTokenProvider = (callback2) => {
                  callback2(token);
                };
              } else {
                this.clientTokenProvider = clientTokenProvider;
              }
              this.log.info("exec.setListener()");
              const listener = this.listener.bind(this);
              window.cordova.exec(listener, null, PLUGIN_ID, "setListener", []);
              callback(void 0);
            } catch (err) {
              this.log.warn("initialization failed: " + (err === null || err === void 0 ? void 0 : err.message));
              callback(Braintree.braintreeError(CdvPurchase2.ErrorCode.SETUP, "Failed to initialize Braintree Android Bridge: " + (err === null || err === void 0 ? void 0 : err.message)));
            }
          }
          /**
           * Fetches a client token and sends it to the SDK.
           *
           * This method is called by the native side when the SDK requests a Client Token.
           */
          getClientToken() {
            this.log.info("getClientToken()");
            if (this.clientTokenProvider) {
              this.log.debug("clientTokenProvider set, calling.");
              this.clientTokenProvider((value) => {
                if (typeof value === "string") {
                  window.cordova.exec(null, null, PLUGIN_ID, "onClientTokenSuccess", [value]);
                } else {
                  window.cordova.exec(null, null, PLUGIN_ID, "onClientTokenFailure", [value.code, value.message]);
                }
              });
            } else {
              this.log.debug("clientTokenProvider not set, retrying later...");
              setTimeout(() => this.getClientToken(), 1e3);
            }
          }
          /** Returns true on Android, the only platform supported by this Braintree bridge */
          static isSupported() {
            return CdvPurchase2.Utils.platformId() === "android";
          }
          isApplePaySupported() {
            return __awaiter(this, void 0, void 0, function* () {
              return false;
            });
          }
          launchDropIn(dropInRequest) {
            return new Promise((resolve2) => {
              window.cordova.exec((result) => {
                this.log.info("dropInSuccess: " + JSON.stringify(result));
                resolve2(result);
              }, (err) => {
                this.log.info("dropInFailure: " + err);
                const errCode = err.split("|")[0];
                const errMessage = err.split("|").slice(1).join("");
                if (errCode === "UserCanceledException") {
                  resolve2(Braintree.braintreeError(CdvPurchase2.ErrorCode.PAYMENT_CANCELLED, errMessage));
                } else if (errCode === "AuthorizationException") {
                  resolve2(Braintree.braintreeError(CdvPurchase2.ErrorCode.UNAUTHORIZED_REQUEST_DATA, errMessage));
                } else {
                  resolve2(Braintree.braintreeError(CdvPurchase2.ErrorCode.UNKNOWN, err));
                }
              }, PLUGIN_ID, "launchDropIn", [dropInRequest]);
            });
          }
        }
        AndroidBridge.Bridge = Bridge;
      })(Braintree.AndroidBridge || (Braintree.AndroidBridge = {}));
    })(CdvPurchase2.Braintree || (CdvPurchase2.Braintree = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Braintree) {
      (function(IosBridge) {
        const PLUGIN_ID = "BraintreeApplePayPlugin";
        class ApplePayPlugin {
          /**
           * Retrieve the plugin definition.
           *
           * Useful to check if it is installed.
           */
          static get() {
            return window.CdvPurchaseBraintreeApplePay;
          }
          /**
           * Initiate a payment with Apple Pay.
           */
          static requestPayment(request) {
            return new Promise((resolve2) => {
              var _a;
              if (!((_a = ApplePayPlugin.get()) === null || _a === void 0 ? void 0 : _a.installed)) {
                return resolve2(Braintree.braintreeError(CdvPurchase2.ErrorCode.SETUP, "cordova-plugin-purchase-braintree-applepay does not appear to be installed."));
              } else {
                const success = (result) => {
                  resolve2(result);
                };
                const failure = (err) => {
                  const message = err !== null && err !== void 0 ? err : "payment request failed";
                  resolve2(Braintree.braintreeError(CdvPurchase2.ErrorCode.PURCHASE, "Braintree+ApplePay ERROR: " + message));
                };
                window.cordova.exec(success, failure, PLUGIN_ID, "presentDropInPaymentUI", [request]);
              }
            });
          }
          /**
           * Returns true if the device supports Apple Pay.
           *
           * This does not necessarily mean the user has a card setup already.
           */
          static isSupported(log) {
            return new Promise((resolve2) => {
              var _a;
              if (CdvPurchase2.Utils.platformId() !== "ios") {
                log.info("BraintreeApplePayPlugin is only available for ios.");
                return resolve2(false);
              }
              if (!((_a = ApplePayPlugin.get()) === null || _a === void 0 ? void 0 : _a.installed)) {
                log.info("BraintreeApplePayPlugin does not appear to be installed.");
                return resolve2(false);
              }
              try {
                window.cordova.exec((result) => {
                  resolve2(result);
                }, () => {
                  log.info("BraintreeApplePayPlugin is not available.");
                  resolve2(false);
                }, PLUGIN_ID, "isApplePaySupported", []);
              } catch (err) {
                log.info("BraintreeApplePayPlugin is not installed.");
                resolve2(false);
              }
            });
          }
        }
        IosBridge.ApplePayPlugin = ApplePayPlugin;
      })(Braintree.IosBridge || (Braintree.IosBridge = {}));
    })(CdvPurchase2.Braintree || (CdvPurchase2.Braintree = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Braintree) {
      (function(IosBridge) {
        class Bridge {
          constructor(log, clientTokenProvider, applePayOptions) {
            this.log = log.child("IosBridge");
            this.clientTokenProvider = clientTokenProvider;
            this.applePayOptions = applePayOptions;
          }
          initialize(verbosity, callback) {
            window.cordova.exec(null, null, "BraintreePlugin", "setVerbosity", [verbosity.verbosity]);
            window.cordova.exec((message) => this.log.debug("(Native) " + message), null, "BraintreePlugin", "setLogger", []);
            setTimeout(() => callback(void 0), 0);
          }
          continueDropInForApplePay(paymentRequest, DropInRequest, dropInResult) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            return __awaiter(this, void 0, void 0, function* () {
              const request = ((_b = (_a = this.applePayOptions) === null || _a === void 0 ? void 0 : _a.preparePaymentRequest) === null || _b === void 0 ? void 0 : _b.call(_a, paymentRequest)) || {
                merchantCapabilities: [CdvPurchase2.ApplePay.MerchantCapability.ThreeDS]
              };
              if (!request.paymentSummaryItems) {
                const items = paymentRequest.items.filter((p) => p).map((product, index) => {
                  var _a2, _b2, _c2;
                  return {
                    type: "final",
                    label: (product === null || product === void 0 ? void 0 : product.title) || (product === null || product === void 0 ? void 0 : product.id) || `Item #${index + 1}`,
                    amount: `${Math.round(((_c2 = (_b2 = (_a2 = product === null || product === void 0 ? void 0 : product.pricing) === null || _a2 === void 0 ? void 0 : _a2.priceMicros) !== null && _b2 !== void 0 ? _b2 : paymentRequest.amountMicros) !== null && _c2 !== void 0 ? _c2 : 0) / 1e4) / 100}`
                  };
                });
                const total = {
                  type: "final",
                  label: (_d = (_c = this.applePayOptions) === null || _c === void 0 ? void 0 : _c.companyName) !== null && _d !== void 0 ? _d : "Total",
                  amount: `${Math.round(((_e = paymentRequest.amountMicros) !== null && _e !== void 0 ? _e : 0) / 1e4) / 100}`
                };
                request.paymentSummaryItems = [...items, total];
              }
              const result = yield IosBridge.ApplePayPlugin.requestPayment(request);
              this.log.info("Result from Apple Pay: " + JSON.stringify(result));
              if ("isError" in result)
                return result;
              if (result.userCancelled) {
                return Braintree.braintreeError(CdvPurchase2.ErrorCode.PAYMENT_CANCELLED, "User cancelled the payment request");
              }
              return {
                paymentMethodNonce: {
                  isDefault: false,
                  nonce: (_g = (_f = result.applePayCardNonce) === null || _f === void 0 ? void 0 : _f.nonce) !== null && _g !== void 0 ? _g : "",
                  type: (_j = (_h = result.applePayCardNonce) === null || _h === void 0 ? void 0 : _h.type) !== null && _j !== void 0 ? _j : ""
                },
                paymentMethodType: dropInResult.paymentMethodType,
                deviceData: dropInResult.deviceData,
                paymentDescription: dropInResult.paymentDescription
              };
            });
          }
          launchDropIn(paymentRequest, dropInRequest) {
            return new Promise((resolve2) => __awaiter(this, void 0, void 0, function* () {
              const onSuccess = (result) => {
                this.log.info("dropInSuccess: " + JSON.stringify(result));
                if (result.paymentMethodType === Braintree.DropIn.PaymentMethod.APPLE_PAY) {
                  this.log.info("it's an ApplePay request, we have to process it.");
                  this.continueDropInForApplePay(paymentRequest, dropInRequest, result).then(resolve2);
                } else {
                  resolve2(result);
                }
              };
              const onError = (errorString) => {
                this.log.info("dropInFailure: " + errorString);
                const [errCode, errMessage] = errorString.split("|");
                if (errCode === "UserCanceledException") {
                  resolve2(Braintree.braintreeError(CdvPurchase2.ErrorCode.PAYMENT_CANCELLED, errMessage));
                } else {
                  resolve2(Braintree.braintreeError(CdvPurchase2.ErrorCode.UNKNOWN, "ERROR " + errCode + ": " + errMessage));
                }
              };
              this.clientTokenProvider((clientToken) => {
                if (typeof clientToken === "string")
                  window.cordova.exec(onSuccess, onError, "BraintreePlugin", "launchDropIn", [clientToken, dropInRequest]);
                else
                  resolve2(clientToken);
              });
            }));
          }
          braintreePlugin() {
            return window.CdvPurchaseBraintree;
          }
          static isSupported() {
            return CdvPurchase2.Utils.platformId() === "ios";
          }
        }
        IosBridge.Bridge = Bridge;
      })(Braintree.IosBridge || (Braintree.IosBridge = {}));
    })(CdvPurchase2.Braintree || (CdvPurchase2.Braintree = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Braintree) {
      (function(DropIn) {
        (function(CardFormFieldStatus) {
          CardFormFieldStatus[CardFormFieldStatus["DISABLED"] = 0] = "DISABLED";
          CardFormFieldStatus[CardFormFieldStatus["OPTIONAL"] = 1] = "OPTIONAL";
          CardFormFieldStatus[CardFormFieldStatus["REQUIRED"] = 2] = "REQUIRED";
        })(DropIn.CardFormFieldStatus || (DropIn.CardFormFieldStatus = {}));
      })(Braintree.DropIn || (Braintree.DropIn = {}));
    })(CdvPurchase2.Braintree || (CdvPurchase2.Braintree = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Braintree) {
      (function(DropIn) {
        (function(PaymentMethod) {
          PaymentMethod["GOOGLE_PAY"] = "GOOGLE_PAY";
          PaymentMethod["LASER"] = "LASER";
          PaymentMethod["UK_MAESTRO"] = "UK_MAESTRO";
          PaymentMethod["SWITCH"] = "SWITCH";
          PaymentMethod["SOLOR"] = "SOLO";
          PaymentMethod["APPLE_PAY"] = "APPLE_PAY";
          PaymentMethod["AMEX"] = "AMEX";
          PaymentMethod["DINERS_CLUB"] = "DINERS_CLUB";
          PaymentMethod["DISCOVER"] = "DISCOVER";
          PaymentMethod["JCB"] = "JCB";
          PaymentMethod["MAESTRO"] = "MAESTRO";
          PaymentMethod["MASTERCARD"] = "MASTERCARD";
          PaymentMethod["PAYPAL"] = "PAYPAL";
          PaymentMethod["VISA"] = "VISA";
          PaymentMethod["VENMO"] = "VENMO";
          PaymentMethod["UNIONPAY"] = "UNIONPAY";
          PaymentMethod["HIPER"] = "HIPER";
          PaymentMethod["HIPERCARD"] = "HIPERCARD";
          PaymentMethod["UNKNOWN"] = "UNKNOWN";
        })(DropIn.PaymentMethod || (DropIn.PaymentMethod = {}));
      })(Braintree.DropIn || (Braintree.DropIn = {}));
    })(CdvPurchase2.Braintree || (CdvPurchase2.Braintree = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Braintree) {
      (function(GooglePay) {
        (function(BillingAddressFormat) {
          BillingAddressFormat[BillingAddressFormat["MIN"] = 0] = "MIN";
          BillingAddressFormat[BillingAddressFormat["FULL"] = 1] = "FULL";
        })(GooglePay.BillingAddressFormat || (GooglePay.BillingAddressFormat = {}));
        (function(TotalPriceStatus) {
          TotalPriceStatus[TotalPriceStatus["NOT_CURRENTLY_KNOWN"] = 1] = "NOT_CURRENTLY_KNOWN";
          TotalPriceStatus[TotalPriceStatus["ESTIMATED"] = 2] = "ESTIMATED";
          TotalPriceStatus[TotalPriceStatus["FINAL"] = 3] = "FINAL";
        })(GooglePay.TotalPriceStatus || (GooglePay.TotalPriceStatus = {}));
      })(Braintree.GooglePay || (Braintree.GooglePay = {}));
    })(CdvPurchase2.Braintree || (CdvPurchase2.Braintree = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Braintree) {
      (function(ThreeDSecure) {
        (function(AccountType) {
          AccountType["UNSPECIFIED"] = "00";
          AccountType["CREDIT"] = "01";
          AccountType["DEBIT"] = "02";
        })(ThreeDSecure.AccountType || (ThreeDSecure.AccountType = {}));
        (function(ShippingMethod) {
          ShippingMethod[ShippingMethod["UNSPECIFIED"] = 0] = "UNSPECIFIED";
          ShippingMethod[ShippingMethod["SAME_DAY"] = 1] = "SAME_DAY";
          ShippingMethod[ShippingMethod["EXPEDITED"] = 2] = "EXPEDITED";
          ShippingMethod[ShippingMethod["PRIORITY"] = 3] = "PRIORITY";
          ShippingMethod[ShippingMethod["GROUND"] = 4] = "GROUND";
          ShippingMethod[ShippingMethod["ELECTRONIC_DELIVERY"] = 5] = "ELECTRONIC_DELIVERY";
          ShippingMethod[ShippingMethod["SHIP_TO_STORE"] = 6] = "SHIP_TO_STORE";
        })(ThreeDSecure.ShippingMethod || (ThreeDSecure.ShippingMethod = {}));
        (function(Version) {
          Version[Version["V1"] = 0] = "V1";
          Version[Version["V2"] = 1] = "V2";
        })(ThreeDSecure.Version || (ThreeDSecure.Version = {}));
      })(Braintree.ThreeDSecure || (Braintree.ThreeDSecure = {}));
    })(CdvPurchase2.Braintree || (CdvPurchase2.Braintree = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(GooglePlay) {
      class Transaction extends CdvPurchase2.Transaction {
        constructor(purchase, parentReceipt, decorator) {
          super(CdvPurchase2.Platform.GOOGLE_PLAY, parentReceipt, decorator);
          this.nativePurchase = purchase;
          this.refresh(purchase, true);
        }
        static toState(fromConstructor, state2, isAcknowledged, isConsumed) {
          switch (state2) {
            case GooglePlay.Bridge.PurchaseState.PENDING:
              return CdvPurchase2.TransactionState.INITIATED;
            case GooglePlay.Bridge.PurchaseState.PURCHASED:
              if (isConsumed)
                return CdvPurchase2.TransactionState.FINISHED;
              else if (isAcknowledged)
                return CdvPurchase2.TransactionState.APPROVED;
              else if (fromConstructor)
                return CdvPurchase2.TransactionState.INITIATED;
              else
                return CdvPurchase2.TransactionState.APPROVED;
            case GooglePlay.Bridge.PurchaseState.UNSPECIFIED_STATE:
              return CdvPurchase2.TransactionState.UNKNOWN_STATE;
          }
        }
        /**
         * Refresh the value in the transaction based on the native purchase update
         */
        refresh(purchase, fromConstructor) {
          var _a, _b;
          this.nativePurchase = purchase;
          this.transactionId = `${purchase.orderId || purchase.purchaseToken}`;
          this.purchaseId = `${purchase.purchaseToken}`;
          this.products = purchase.productIds.map((productId) => ({ id: productId }));
          if (purchase.purchaseTime)
            this.purchaseDate = new Date(purchase.purchaseTime);
          this.isPending = purchase.getPurchaseState === GooglePlay.Bridge.PurchaseState.PENDING;
          if (typeof purchase.acknowledged !== "undefined")
            this.isAcknowledged = purchase.acknowledged;
          if (typeof purchase.consumed !== "undefined")
            this.isConsumed = purchase.consumed;
          if (typeof purchase.autoRenewing !== "undefined")
            this.renewalIntent = purchase.autoRenewing ? CdvPurchase2.RenewalIntent.RENEW : CdvPurchase2.RenewalIntent.LAPSE;
          if (typeof purchase.quantity !== "undefined")
            this.quantity = purchase.quantity;
          if (purchase.expiryTimeMillis) {
            const expiryTime = parseInt(purchase.expiryTimeMillis, 10);
            if (!isNaN(expiryTime)) {
              this.expirationDate = new Date(expiryTime);
            }
          }
          this.state = Transaction.toState(fromConstructor !== null && fromConstructor !== void 0 ? fromConstructor : false, purchase.getPurchaseState, (_a = this.isAcknowledged) !== null && _a !== void 0 ? _a : false, (_b = this.isConsumed) !== null && _b !== void 0 ? _b : false);
        }
        removed() {
          if (this.renewalIntent) {
            this.expirationDate = new Date(Date.now() - CdvPurchase2.Internal.ExpiryMonitor.GRACE_PERIOD_MS[CdvPurchase2.Platform.GOOGLE_PLAY]);
          } else {
            this.isConsumed = true;
          }
          this.state = CdvPurchase2.TransactionState.CANCELLED;
        }
      }
      GooglePlay.Transaction = Transaction;
      class Receipt extends CdvPurchase2.Receipt {
        /** @internal */
        constructor(purchase, decorator) {
          super(CdvPurchase2.Platform.GOOGLE_PLAY, decorator);
          this.transactions = [new Transaction(purchase, this, decorator)];
          this.purchaseToken = purchase.purchaseToken;
          this.orderId = purchase.orderId;
        }
        /** Refresh the content of the purchase based on the native BridgePurchase */
        refreshPurchase(purchase) {
          var _a;
          (_a = this.transactions[0]) === null || _a === void 0 ? void 0 : _a.refresh(purchase);
          this.orderId = purchase.orderId;
        }
        removed() {
          this.transactions.forEach((t) => t === null || t === void 0 ? void 0 : t.removed());
        }
      }
      GooglePlay.Receipt = Receipt;
      class Adapter {
        constructor(context, autoRefreshIntervalMillis = 1e3 * 3600 * 24) {
          this.id = CdvPurchase2.Platform.GOOGLE_PLAY;
          this.name = "GooglePlay";
          this.ready = false;
          this.supportsParallelLoading = false;
          this.canSkipFinish = true;
          this._receipts = [];
          this.bridge = GooglePlay.Bridge.CapacitorBridge.isAvailable() ? new GooglePlay.Bridge.CapacitorBridge() : new GooglePlay.Bridge.Bridge();
          this.initialized = false;
          this.retry = new CdvPurchase2.Internal.Retry();
          this.autoRefreshIntervalMillis = 0;
          this.refreshSchedule = {};
          if (Adapter._instance)
            throw new Error("GooglePlay adapter already initialized");
          this._products = new GooglePlay.Products(context.apiDecorators);
          this.autoRefreshIntervalMillis = autoRefreshIntervalMillis;
          this.context = context;
          this.log = context.log.child("GooglePlay");
          Adapter._instance = this;
        }
        /** List of products managed by the GooglePlay adapter */
        get products() {
          return this._products.products;
        }
        get receipts() {
          return this._receipts;
        }
        /** Returns true on Android, the only platform supported by this adapter */
        get isSupported() {
          return CdvPurchase2.Utils.platformId() === "android";
        }
        initialize() {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info("Initialize");
            if (this.initializationPromise)
              return this.initializationPromise;
            return this.initializationPromise = new Promise((resolve2) => {
              const bridgeLogger = this.log.child("Bridge");
              const iabOptions = {
                onSetPurchases: this.onSetPurchases.bind(this),
                onPurchasesUpdated: this.onPurchasesUpdated.bind(this),
                onPurchaseConsumed: this.onPurchaseConsumed.bind(this),
                showLog: this.context.verbosity >= CdvPurchase2.LogLevel.DEBUG ? true : false,
                log: (msg) => bridgeLogger.info(msg)
              };
              const iabReady = () => {
                this.log.debug("Ready");
                if (this.autoRefreshIntervalMillis > 0) {
                  window.setInterval(() => this.getPurchases(), this.autoRefreshIntervalMillis);
                }
                resolve2(void 0);
              };
              const iabError = (err, code) => {
                this.initialized = false;
                if (Number(code) === CdvPurchase2.ErrorCode.STORE_BLOCKED) {
                  const error = playStoreError(CdvPurchase2.ErrorCode.STORE_BLOCKED, "Init failed - " + err, null);
                  this.context.error(error);
                  resolve2(error);
                  return;
                }
                this.context.error(playStoreError(CdvPurchase2.ErrorCode.SETUP, "Init failed - " + err, null));
                this.retry.retry(() => this.initialize());
              };
              this.bridge.init(iabReady, iabError, iabOptions);
            });
          });
        }
        /** Prepare the list of SKUs sorted by type */
        getSkusOf(products) {
          const inAppSkus = [];
          const subsSkus = [];
          for (const product of products) {
            if (product.type === CdvPurchase2.ProductType.PAID_SUBSCRIPTION)
              subsSkus.push(product.id);
            else
              inAppSkus.push(product.id);
          }
          return { inAppSkus, subsSkus };
        }
        /** @inheritdoc */
        loadReceipts() {
          return new Promise((resolve2) => {
            this.getPurchases().then((err) => {
              resolve2(this._receipts);
            });
          });
        }
        /** @inheritDoc */
        loadProducts(products) {
          return new Promise((resolve2) => {
            this.log.debug("Load: " + JSON.stringify(products));
            const iabLoaded = (validProducts) => {
              this.log.debug("Loaded: " + JSON.stringify(validProducts));
              if (!Array.isArray(validProducts)) {
                const message = `Invalid product list received: ${JSON.stringify(validProducts)}, retrying later...`;
                this.log.warn(message);
                this.retry.retry(go);
                this.context.error(playStoreError(CdvPurchase2.ErrorCode.LOAD, message, null));
                return;
              }
              const ret = products.map((registeredProduct) => {
                const validProduct = validProducts.find((vp) => vp.productId === registeredProduct.id);
                if (validProduct && validProduct.productId) {
                  return this._products.addProduct(registeredProduct, validProduct);
                } else {
                  return playStoreError(CdvPurchase2.ErrorCode.INVALID_PRODUCT_ID, `Product with id ${registeredProduct.id} not found.`, registeredProduct.id);
                }
              });
              resolve2(ret);
            };
            const go = () => {
              const { inAppSkus, subsSkus } = this.getSkusOf(products);
              this.log.debug("getAvailableProducts: " + JSON.stringify(inAppSkus) + " | " + JSON.stringify(subsSkus));
              this.bridge.getAvailableProducts(inAppSkus, subsSkus, iabLoaded, (err) => {
                this.retry.retry(go);
                this.context.error(playStoreError(CdvPurchase2.ErrorCode.LOAD, "Loading product info failed - " + err + " - retrying later...", null));
              });
            };
            go();
          });
        }
        /** @inheritDoc */
        finish(transaction2) {
          return new Promise((resolve2) => {
            const onSuccess = () => {
              if (transaction2.state !== CdvPurchase2.TransactionState.FINISHED) {
                transaction2.state = CdvPurchase2.TransactionState.FINISHED;
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.GOOGLE_PLAY, [transaction2.parentReceipt]);
              }
              resolve2(void 0);
            };
            const firstProduct = transaction2.products[0];
            if (!firstProduct)
              return resolve2(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish a transaction with no product", null));
            const product = this._products.getProduct(firstProduct.id);
            if (!product)
              return resolve2(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish transaction, unknown product " + firstProduct.id, firstProduct.id));
            const receipt = this._receipts.find((r) => r.hasTransaction(transaction2));
            if (!receipt)
              return resolve2(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish transaction, linked receipt not found.", product.id));
            if (!receipt.purchaseToken)
              return resolve2(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish transaction, linked receipt contains no purchaseToken.", product.id));
            const onFailure = (message, code) => resolve2(playStoreError(code || CdvPurchase2.ErrorCode.UNKNOWN, message, product.id));
            if (product.type === CdvPurchase2.ProductType.NON_RENEWING_SUBSCRIPTION || product.type === CdvPurchase2.ProductType.CONSUMABLE) {
              if (!transaction2.isConsumed)
                return this.bridge.consumePurchase(onSuccess, onFailure, receipt.purchaseToken);
            } else {
              if (!transaction2.isAcknowledged)
                return this.bridge.acknowledgePurchase(onSuccess, onFailure, receipt.purchaseToken);
            }
            resolve2(void 0);
          });
        }
        /** Called by the bridge when a purchase has been consumed */
        onPurchaseConsumed(purchase) {
          this.log.debug("onPurchaseConsumed: " + purchase.orderId);
          purchase.acknowledged = true;
          purchase.consumed = true;
          this.onPurchasesUpdated([purchase]);
        }
        /**
         * Schedule a purchase refresh for a subscription without expiration date
         */
        scheduleRefreshForSubscription(purchase) {
          if (!purchase.purchaseToken)
            return;
          const schedule = this.refreshSchedule[purchase.purchaseToken] || [];
          if (schedule.length === 0) {
            this.refreshSchedule[purchase.purchaseToken] = schedule;
          }
          let refreshIntervals = [Adapter.REFRESH_INTERVALS.SANDBOX, Adapter.REFRESH_INTERVALS.PRODUCTION];
          refreshIntervals.forEach((refreshInterval) => {
            const refreshTime = purchase.purchaseTime + refreshInterval;
            if (schedule.find((s2) => s2.refreshTime === refreshTime) || refreshTime < Date.now()) {
              return;
            }
            this.log.debug(`Scheduling refresh for purchase token ${purchase.purchaseToken} at ${new Date(refreshTime).toISOString()}`);
            const timeoutId = window.setTimeout(() => {
              this.log.debug(`Executing scheduled refresh for purchase token ${purchase.purchaseToken}`);
              delete this.refreshSchedule[purchase.purchaseToken];
              this.getPurchases().catch((err) => {
                this.log.warn(`Failed scheduled refresh: ${err}`);
              });
            }, refreshTime - Date.now());
            schedule.push({
              timeoutId,
              refreshTime
            });
          });
        }
        /**
         * Detect subscriptions that need scheduled refreshes
         */
        scheduleRefreshesForSubscriptions(purchases) {
          for (const purchase of purchases) {
            if (purchase.autoRenewing !== false)
              continue;
            const productId = purchase.productIds[0];
            const product = productId ? this._products.getProduct(productId) : void 0;
            if (!product || product.type !== CdvPurchase2.ProductType.PAID_SUBSCRIPTION)
              continue;
            if (!purchase.expiryTimeMillis) {
              this.scheduleRefreshForSubscription(purchase);
            }
          }
        }
        /**
         * Called when the platform reports some purchases
         */
        onSetPurchases(purchases) {
          this.log.debug("onSetPurchases: " + JSON.stringify(purchases));
          this.onPurchasesUpdated(purchases);
          this.context.listener.receiptsReady(CdvPurchase2.Platform.GOOGLE_PLAY);
          this.scheduleRefreshesForSubscriptions(purchases);
        }
        /**
         * Called when the platform reports updates for some purchases
         *
         * Notice that purchases can be removed from the array, we should handle that so they stop
         * being "owned" by the user.
         */
        onPurchasesUpdated(purchases) {
          this.log.debug("onPurchaseUpdated: " + purchases.map((p) => p.orderId).join(", "));
          const removedReceipts = this.receipts.filter((r) => !purchases.find((p) => p.purchaseToken === r.purchaseToken));
          if (removedReceipts.length > 0) {
            this.log.debug("Removed purchases: " + removedReceipts.map((r) => r.purchaseToken).join(", "));
            removedReceipts.forEach((receipt) => receipt.removed());
          }
          purchases.forEach((purchase) => {
            var _a;
            const existingReceipt = this.receipts.find((r) => r.purchaseToken === purchase.purchaseToken);
            if (existingReceipt) {
              const firstTransaction = existingReceipt.transactions[0];
              if (firstTransaction) {
                const firstProductId = (_a = firstTransaction.products[0]) === null || _a === void 0 ? void 0 : _a.id;
                if (firstProductId) {
                  const product = this._products.getProduct(firstProductId);
                  if (product && product.type === CdvPurchase2.ProductType.PAID_SUBSCRIPTION) {
                    if (purchase.getPurchaseState === GooglePlay.Bridge.PurchaseState.PURCHASED && purchase.expiryTimeMillis) {
                      const expiryTime = parseInt(purchase.expiryTimeMillis, 10);
                      if (!isNaN(expiryTime)) {
                        firstTransaction.expirationDate = new Date(expiryTime);
                        this.log.debug(`Updated expirationDate for ${firstProductId} to ${firstTransaction.expirationDate} (autoRenewing: ${purchase.autoRenewing})`);
                      }
                    }
                  }
                }
              }
              existingReceipt.refreshPurchase(purchase);
              this.context.listener.receiptsUpdated(CdvPurchase2.Platform.GOOGLE_PLAY, [existingReceipt]);
            } else {
              const newReceipt = new Receipt(purchase, this.context.apiDecorators);
              this.receipts.push(newReceipt);
              this.context.listener.receiptsUpdated(CdvPurchase2.Platform.GOOGLE_PLAY, [newReceipt]);
              if (newReceipt.transactions[0].state === CdvPurchase2.TransactionState.INITIATED && !newReceipt.transactions[0].isPending) {
                newReceipt.refreshPurchase(purchase);
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.GOOGLE_PLAY, [newReceipt]);
              }
            }
          });
        }
        onPriceChangeConfirmationResult(result) {
        }
        /** Refresh purchases from GooglePlay */
        getPurchases() {
          return new Promise((resolve2) => {
            this.log.debug("getPurchases");
            const success = () => {
              this.log.debug("getPurchases success");
              setTimeout(() => resolve2(void 0), 0);
            };
            const failure = (message, code) => {
              this.log.warn("getPurchases failed: " + message + " (" + code + ")");
              setTimeout(() => resolve2(playStoreError(code || CdvPurchase2.ErrorCode.UNKNOWN, message, null)), 0);
            };
            this.bridge.getPurchases(success, failure);
          });
        }
        /** @inheritDoc */
        order(offer, additionalData) {
          return __awaiter(this, void 0, void 0, function* () {
            warnIfDeprecatedAdditionalUsername(this.log, additionalData);
            additionalData = withObfuscatedAccountId(additionalData, this.context);
            return new Promise((resolve2) => {
              this.log.info("Order - " + JSON.stringify(offer));
              const buySuccess = () => resolve2(void 0);
              const buyFailed = (message, code) => {
                this.log.warn("Order failed: " + JSON.stringify({ message, code }));
                if (Number(code) === CdvPurchase2.ErrorCode.STORE_BLOCKED) {
                  resolve2(playStoreError(CdvPurchase2.ErrorCode.STORE_BLOCKED, message, offer.productId));
                  return;
                }
                resolve2(playStoreError(code !== null && code !== void 0 ? code : CdvPurchase2.ErrorCode.UNKNOWN, message, offer.productId));
              };
              if (offer.productType === CdvPurchase2.ProductType.PAID_SUBSCRIPTION) {
                const idAndToken = "token" in offer ? offer.productId + "@" + offer.token : offer.productId;
                const oldPurchaseToken = this.findOldPurchaseToken(offer.productId, offer.productGroup);
                if (oldPurchaseToken) {
                  if (!additionalData.googlePlay)
                    additionalData.googlePlay = { oldPurchaseToken };
                  else if (!additionalData.googlePlay.oldPurchaseToken) {
                    additionalData.googlePlay.oldPurchaseToken = oldPurchaseToken;
                  }
                }
                this.bridge.subscribe(buySuccess, buyFailed, idAndToken, additionalData);
              } else {
                const idAndToken = "token" in offer && offer.token ? offer.productId + "@" + offer.token : offer.productId;
                this.bridge.buy(buySuccess, buyFailed, idAndToken, additionalData);
              }
            });
          });
        }
        /**
         * Find a purchaseToken for an owned product in the same group as the requested one.
         *
         * @param productId - The product identifier to request matching purchaseToken for.
         * @param productGroup - The group of the product to request matching purchaseToken for.
         *
         * @return A purchaseToken, undefined if none have been found.
         */
        findOldPurchaseToken(productId, productGroup) {
          if (!productGroup)
            return void 0;
          const oldReceipt = this._receipts.find((r) => {
            return !!r.transactions.find((t) => {
              return !!t.products.find((p) => {
                const product = this._products.getProduct(p.id);
                if (!product)
                  return false;
                if (!CdvPurchase2.Internal.LocalReceipts.isOwned([r], product))
                  return false;
                return p.id === productId || productGroup && product.group === productGroup;
              });
            });
          });
          return oldReceipt === null || oldReceipt === void 0 ? void 0 : oldReceipt.purchaseToken;
        }
        /**
         * Prepare for receipt validation
         */
        receiptValidationBody(receipt) {
          var _a;
          return __awaiter(this, void 0, void 0, function* () {
            const transaction2 = receipt.transactions[0];
            if (!transaction2)
              return;
            const productId = (_a = transaction2.products[0]) === null || _a === void 0 ? void 0 : _a.id;
            if (!productId)
              return;
            const product = this._products.getProduct(productId);
            if (!product)
              return;
            const purchase = transaction2.nativePurchase;
            return {
              id: productId,
              type: product.type,
              offers: product.offers,
              products: this._products.products,
              transaction: {
                type: CdvPurchase2.Platform.GOOGLE_PLAY,
                id: receipt.transactions[0].transactionId,
                purchaseToken: purchase.purchaseToken,
                signature: purchase.signature,
                receipt: purchase.receipt
              }
            };
          });
        }
        handleReceiptValidationResponse(receipt, response) {
          var _a;
          return __awaiter(this, void 0, void 0, function* () {
            if (response === null || response === void 0 ? void 0 : response.ok) {
              const transaction2 = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.transaction;
              if ((transaction2 === null || transaction2 === void 0 ? void 0 : transaction2.type) !== CdvPurchase2.Platform.GOOGLE_PLAY)
                return;
              switch (transaction2.kind) {
              }
            }
            return;
          });
        }
        requestPayment(payment, additionalData) {
          return __awaiter(this, void 0, void 0, function* () {
            return playStoreError(CdvPurchase2.ErrorCode.UNKNOWN, "requestPayment not supported", null);
          });
        }
        manageSubscriptions() {
          return __awaiter(this, void 0, void 0, function* () {
            this.bridge.manageSubscriptions();
            return;
          });
        }
        manageBilling() {
          return __awaiter(this, void 0, void 0, function* () {
            this.bridge.manageBilling();
            return;
          });
        }
        getStorefront() {
          return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve2) => {
              this.bridge.getStorefront((countryCode) => {
                resolve2(countryCode || void 0);
              }, (message) => {
                this.log.warn("getStorefront failed: " + message);
                resolve2(void 0);
              });
            });
          });
        }
        checkSupport(functionality) {
          const supported = [
            "order",
            "manageBilling",
            "manageSubscriptions",
            "getStorefront"
          ];
          return supported.indexOf(functionality) >= 0;
        }
        restorePurchases() {
          return new Promise((resolve2) => {
            this.bridge.getPurchases(() => resolve2(void 0), (message, code) => {
              this.log.warn("getPurchases() failed: " + (code !== null && code !== void 0 ? code : "ERROR") + ": " + message);
              resolve2(playStoreError(code !== null && code !== void 0 ? code : CdvPurchase2.ErrorCode.UNKNOWN, message, null));
            });
          });
        }
      }
      Adapter.trimProductTitles = true;
      Adapter.REFRESH_INTERVALS = {
        SANDBOX: 6 * 60 * 1e3,
        PRODUCTION: 7 * 24 * 60 * 60 * 1e3 + 10 * 60 * 1e3
        // 7 days + 10 minutes for production
      };
      GooglePlay.Adapter = Adapter;
      let deprecatedAdditionalUsernameNoticed = false;
      function warnIfDeprecatedAdditionalUsername(log, additionalData) {
        if (!additionalData || !additionalData["applicationUsername"])
          return;
        if (deprecatedAdditionalUsernameNoticed)
          return;
        deprecatedAdditionalUsernameNoticed = true;
        log.warn("additionalData.applicationUsername is deprecated and ignored. Set store.applicationUsername instead.");
      }
      function withObfuscatedAccountId(additionalData, context) {
        var _a;
        const next = Object.assign({}, additionalData !== null && additionalData !== void 0 ? additionalData : {});
        next.googlePlay = Object.assign({}, (_a = additionalData === null || additionalData === void 0 ? void 0 : additionalData.googlePlay) !== null && _a !== void 0 ? _a : {});
        if (!next.googlePlay.accountId) {
          const username = context.getApplicationUsername();
          if (username) {
            next.googlePlay.accountId = context.obfuscateUsername(username, CdvPurchase2.Platform.GOOGLE_PLAY);
          }
        }
        return next;
      }
      function playStoreError(code, message, productId) {
        return CdvPurchase2.storeError(code, message, CdvPurchase2.Platform.GOOGLE_PLAY, productId);
      }
    })(CdvPurchase2.GooglePlay || (CdvPurchase2.GooglePlay = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(GooglePlay) {
      (function(Bridge) {
        let log = function log2(msg) {
          console.log("InAppBilling[capacitor]: " + msg);
        };
        class CapacitorBridge {
          constructor() {
            this.options = {};
          }
          /** Check if the Capacitor purchase plugin is available */
          static isAvailable() {
            const marker = window.CdvPurchaseCapacitor;
            return !!(marker && marker.installed);
          }
          get plugin() {
            var _a, _b;
            return (_b = (_a = window.Capacitor) === null || _a === void 0 ? void 0 : _a.Plugins) === null || _b === void 0 ? void 0 : _b.PurchasePlugin;
          }
          init(success, fail, options) {
            if (!options)
              options = {};
            if (options.log)
              log = options.log;
            this.options = {
              showLog: options.showLog !== false,
              onPurchaseConsumed: options.onPurchaseConsumed,
              onPurchasesUpdated: options.onPurchasesUpdated,
              onSetPurchases: options.onSetPurchases,
              onPriceChangeConfirmationResult: options.onPriceChangeConfirmationResult
            };
            if (this.options.showLog) {
              log("init");
            }
            const plugin = this.plugin;
            if (!plugin) {
              fail("Capacitor PurchasePlugin not available");
              return;
            }
            plugin.addListener("setPurchases", (data) => {
              if (this.options.onSetPurchases) {
                this.options.onSetPurchases(data.purchases);
              }
            });
            plugin.addListener("purchasesUpdated", (data) => {
              if (this.options.onPurchasesUpdated) {
                this.options.onPurchasesUpdated(data.purchases);
              }
            });
            plugin.addListener("purchaseConsumed", (data) => {
              if (this.options.onPurchaseConsumed) {
                this.options.onPurchaseConsumed(data.purchase);
              }
            });
            plugin.addListener("priceChangeConfirmationResult", (data) => {
              if (this.options.onPriceChangeConfirmationResult) {
                this.options.onPriceChangeConfirmationResult(data.result);
              }
            });
            plugin.init().then(() => success()).catch((err) => fail((err === null || err === void 0 ? void 0 : err.message) || "init failed", err === null || err === void 0 ? void 0 : err.code));
          }
          load(success, fail, skus, inAppSkus, subsSkus) {
            if (this.options.showLog) {
              log("load " + JSON.stringify(skus));
            }
            this.plugin.getAvailableProducts({ inAppSkus, subsSkus }).then(() => success()).catch((err) => fail((err === null || err === void 0 ? void 0 : err.message) || "load failed", err === null || err === void 0 ? void 0 : err.code));
          }
          getPurchases(success, fail) {
            if (this.options.showLog) {
              log("getPurchases()");
            }
            this.plugin.getPurchases().then(() => success()).catch((err) => fail((err === null || err === void 0 ? void 0 : err.message) || "getPurchases failed", err === null || err === void 0 ? void 0 : err.code));
          }
          buy(success, fail, productId, additionalData) {
            if (this.options.showLog) {
              log("buy()");
            }
            this.plugin.buy({
              productId,
              additionalData: extendAdditionalData(additionalData)
            }).then(() => success()).catch((err) => fail((err === null || err === void 0 ? void 0 : err.message) || "buy failed", err === null || err === void 0 ? void 0 : err.code));
          }
          subscribe(success, fail, productId, additionalData) {
            if (this.options.showLog) {
              log("subscribe()");
            }
            this.plugin.subscribe({
              productId,
              additionalData: extendAdditionalData(additionalData)
            }).then(() => success()).catch((err) => fail((err === null || err === void 0 ? void 0 : err.message) || "subscribe failed", err === null || err === void 0 ? void 0 : err.code));
          }
          consumePurchase(success, fail, purchaseToken) {
            if (this.options.showLog) {
              log("consumePurchase()");
            }
            this.plugin.consumePurchase({ purchaseToken }).then(() => success()).catch((err) => fail((err === null || err === void 0 ? void 0 : err.message) || "consumePurchase failed", err === null || err === void 0 ? void 0 : err.code));
          }
          acknowledgePurchase(success, fail, purchaseToken) {
            if (this.options.showLog) {
              log("acknowledgePurchase()");
            }
            this.plugin.acknowledgePurchase({ purchaseToken }).then(() => success()).catch((err) => fail((err === null || err === void 0 ? void 0 : err.message) || "acknowledgePurchase failed", err === null || err === void 0 ? void 0 : err.code));
          }
          getAvailableProducts(inAppSkus, subsSkus, success, fail) {
            if (this.options.showLog) {
              log("getAvailableProducts()");
            }
            this.plugin.getAvailableProducts({ inAppSkus, subsSkus }).then((result) => success(result.products)).catch((err) => fail((err === null || err === void 0 ? void 0 : err.message) || "getAvailableProducts failed", err === null || err === void 0 ? void 0 : err.code));
          }
          manageSubscriptions() {
            this.plugin.manageSubscriptions();
          }
          manageBilling() {
            this.plugin.manageBilling();
          }
          launchPriceChangeConfirmationFlow(productId) {
            this.plugin.launchPriceChangeConfirmationFlow({ productId });
          }
          getStorefront(success, fail) {
            if (this.options.showLog) {
              log("getStorefront()");
            }
            this.plugin.getStorefront().then((result) => success(result.countryCode)).catch((err) => fail((err === null || err === void 0 ? void 0 : err.message) || "getStorefront failed", err === null || err === void 0 ? void 0 : err.code));
          }
        }
        Bridge.CapacitorBridge = CapacitorBridge;
        function ensureObject(obj) {
          return !!obj && obj.constructor === Object ? obj : {};
        }
        function extendAdditionalData(ad) {
          return ensureObject(ad === null || ad === void 0 ? void 0 : ad.googlePlay);
        }
      })(GooglePlay.Bridge || (GooglePlay.Bridge = {}));
    })(CdvPurchase2.GooglePlay || (CdvPurchase2.GooglePlay = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(GooglePlay) {
      (function(Bridge) {
        (function(RecurrenceMode) {
          RecurrenceMode["FINITE_RECURRING"] = "FINITE_RECURRING";
          RecurrenceMode["INFINITE_RECURRING"] = "INFINITE_RECURRING";
          RecurrenceMode["NON_RECURRING"] = "NON_RECURRING";
        })(Bridge.RecurrenceMode || (Bridge.RecurrenceMode = {}));
      })(GooglePlay.Bridge || (GooglePlay.Bridge = {}));
    })(CdvPurchase2.GooglePlay || (CdvPurchase2.GooglePlay = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(GooglePlay) {
      (function(ProrationMode) {
        ProrationMode["IMMEDIATE_WITH_TIME_PRORATION"] = "IMMEDIATE_WITH_TIME_PRORATION";
        ProrationMode["IMMEDIATE_AND_CHARGE_PRORATED_PRICE"] = "IMMEDIATE_AND_CHARGE_PRORATED_PRICE";
        ProrationMode["IMMEDIATE_WITHOUT_PRORATION"] = "IMMEDIATE_WITHOUT_PRORATION";
        ProrationMode["DEFERRED"] = "DEFERRED";
        ProrationMode["IMMEDIATE_AND_CHARGE_FULL_PRICE"] = "IMMEDIATE_AND_CHARGE_FULL_PRICE";
      })(GooglePlay.ProrationMode || (GooglePlay.ProrationMode = {}));
      (function(ReplacementMode) {
        ReplacementMode["WITH_TIME_PRORATION"] = "IMMEDIATE_WITH_TIME_PRORATION";
        ReplacementMode["CHARGE_PRORATED_PRICE"] = "IMMEDIATE_AND_CHARGE_PRORATED_PRICE";
        ReplacementMode["WITHOUT_PRORATION"] = "IMMEDIATE_WITHOUT_PRORATION";
        ReplacementMode["DEFERRED"] = "DEFERRED";
        ReplacementMode["CHARGE_FULL_PRICE"] = "IMMEDIATE_AND_CHARGE_FULL_PRICE";
      })(GooglePlay.ReplacementMode || (GooglePlay.ReplacementMode = {}));
      (function(Bridge_2) {
        let log = function log2(msg) {
          console.log("InAppBilling[js]: " + msg);
        };
        (function(PurchaseState) {
          PurchaseState[PurchaseState["UNSPECIFIED_STATE"] = 0] = "UNSPECIFIED_STATE";
          PurchaseState[PurchaseState["PURCHASED"] = 1] = "PURCHASED";
          PurchaseState[PurchaseState["PENDING"] = 2] = "PENDING";
        })(Bridge_2.PurchaseState || (Bridge_2.PurchaseState = {}));
        class Bridge {
          constructor() {
            this.options = {};
          }
          init(success, fail, options) {
            if (!options)
              options = {};
            if (options.log)
              log = options.log;
            this.options = {
              showLog: options.showLog !== false,
              onPurchaseConsumed: options.onPurchaseConsumed,
              onPurchasesUpdated: options.onPurchasesUpdated,
              onSetPurchases: options.onSetPurchases
            };
            if (this.options.showLog) {
              log("setup ok");
            }
            const listener = this.listener.bind(this);
            window.cordova.exec(listener, function(err) {
            }, "InAppBillingPlugin", "setListener", []);
            window.cordova.exec(success, errorCb(fail), "InAppBillingPlugin", "init", []);
          }
          load(success, fail, skus, inAppSkus, subsSkus) {
            if (typeof skus !== "undefined") {
              if (typeof skus === "string") {
                skus = [skus];
              }
              if (skus.length > 0) {
                if (typeof skus[0] !== "string") {
                  var msg = "invalid productIds: " + JSON.stringify(skus);
                  if (this.options.showLog) {
                    log(msg);
                  }
                  fail(msg, CdvPurchase2.ErrorCode.INVALID_PRODUCT_ID);
                  return;
                }
                if (this.options.showLog) {
                  log("load " + JSON.stringify(skus));
                }
              }
            }
            window.cordova.exec(success, errorCb(fail), "InAppBillingPlugin", "load", [skus, inAppSkus, subsSkus]);
          }
          listener(msg) {
            if (this.options.showLog) {
              log("listener: " + JSON.stringify(msg));
            }
            if (!msg || !msg.type) {
              return;
            }
            if (msg.type === "setPurchases" && this.options.onSetPurchases) {
              this.options.onSetPurchases(msg.data.purchases);
            }
            if (msg.type === "purchasesUpdated" && this.options.onPurchasesUpdated) {
              this.options.onPurchasesUpdated(msg.data.purchases);
            }
            if (msg.type === "purchaseConsumed" && this.options.onPurchaseConsumed) {
              this.options.onPurchaseConsumed(msg.data.purchase);
            }
            if (msg.type === "onPriceChangeConfirmationResultOK" && this.options.onPriceChangeConfirmationResult) {
              this.options.onPriceChangeConfirmationResult("OK");
            }
            if (msg.type === "onPriceChangeConfirmationResultUserCanceled" && this.options.onPriceChangeConfirmationResult) {
              this.options.onPriceChangeConfirmationResult("UserCanceled");
            }
            if (msg.type === "onPriceChangeConfirmationResultUnknownSku" && this.options.onPriceChangeConfirmationResult) {
              this.options.onPriceChangeConfirmationResult("UnknownProduct");
            }
          }
          getPurchases(success, fail) {
            if (this.options.showLog) {
              log("getPurchases()");
            }
            return window.cordova.exec(success, errorCb(fail), "InAppBillingPlugin", "getPurchases", ["null"]);
          }
          buy(success, fail, productId, additionalData) {
            if (this.options.showLog) {
              log("buy()");
            }
            return window.cordova.exec(success, errorCb(fail), "InAppBillingPlugin", "buy", [
              productId,
              extendAdditionalData(additionalData)
            ]);
          }
          subscribe(success, fail, productId, additionalData) {
            var _a;
            if (this.options.showLog) {
              log("subscribe()");
            }
            if (((_a = additionalData.googlePlay) === null || _a === void 0 ? void 0 : _a.oldPurchaseToken) && this.options.showLog) {
              log("subscribe() -> upgrading from an old purchase");
            }
            return window.cordova.exec(success, errorCb(fail), "InAppBillingPlugin", "subscribe", [
              productId,
              extendAdditionalData(additionalData)
            ]);
          }
          consumePurchase(success, fail, purchaseToken) {
            if (this.options.showLog) {
              log("consumePurchase()");
            }
            return window.cordova.exec(success, errorCb(fail), "InAppBillingPlugin", "consumePurchase", [purchaseToken]);
          }
          acknowledgePurchase(success, fail, purchaseToken) {
            if (this.options.showLog) {
              log("acknowledgePurchase()");
            }
            return window.cordova.exec(success, errorCb(fail), "InAppBillingPlugin", "acknowledgePurchase", [purchaseToken]);
          }
          getAvailableProducts(inAppSkus, subsSkus, success, fail) {
            if (this.options.showLog) {
              log("getAvailableProducts()");
            }
            return window.cordova.exec(success, errorCb(fail), "InAppBillingPlugin", "getAvailableProducts", [inAppSkus, subsSkus]);
          }
          manageSubscriptions() {
            return window.cordova.exec(function() {
            }, function() {
            }, "InAppBillingPlugin", "manageSubscriptions", []);
          }
          manageBilling() {
            return window.cordova.exec(function() {
            }, function() {
            }, "InAppBillingPlugin", "manageBilling", []);
          }
          getStorefront(success, fail) {
            if (this.options.showLog) {
              log("getStorefront()");
            }
            return window.cordova.exec(success, errorCb(fail), "InAppBillingPlugin", "getStorefront", []);
          }
          launchPriceChangeConfirmationFlow(productId) {
            return window.cordova.exec(function() {
            }, function() {
            }, "InAppBillingPlugin", "launchPriceChangeConfirmationFlow", [productId]);
          }
        }
        Bridge_2.Bridge = Bridge;
        function errorCb(fail) {
          return function(error) {
            if (!fail)
              return;
            const tokens = typeof error === "string" ? error.split("|") : [];
            if (tokens.length > 1 && /^[-+]?(\d+)$/.test(tokens[0])) {
              var code = tokens[0];
              var message = tokens[1];
              fail(message, +code);
            } else {
              fail(error);
            }
          };
        }
        function ensureObject(obj) {
          return !!obj && obj.constructor === Object ? obj : {};
        }
        function extendAdditionalData(ad) {
          return ensureObject(ad === null || ad === void 0 ? void 0 : ad.googlePlay);
        }
      })(GooglePlay.Bridge || (GooglePlay.Bridge = {}));
    })(CdvPurchase2.GooglePlay || (CdvPurchase2.GooglePlay = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(GooglePlay) {
      class GProduct extends CdvPurchase2.Product {
      }
      GooglePlay.GProduct = GProduct;
      class InAppOffer extends CdvPurchase2.Offer {
        constructor(options, decorator) {
          super(options, decorator);
          this.type = "inapp";
          this.token = options.token;
        }
      }
      GooglePlay.InAppOffer = InAppOffer;
      class SubscriptionOffer extends CdvPurchase2.Offer {
        constructor(options, decorator) {
          super(options, decorator);
          this.type = "subs";
          this.tags = options.tags;
          this.token = options.token;
        }
      }
      GooglePlay.SubscriptionOffer = SubscriptionOffer;
      class Products {
        constructor(decorator) {
          this.products = [];
          this.offers = [];
          this.decorator = decorator;
        }
        getProduct(id) {
          return this.products.find((p) => p.id === id);
        }
        getOffer(id) {
          return this.offers.find((p) => p.id === id);
        }
        /**  */
        addProduct(registeredProduct, vp) {
          const existingProduct = this.getProduct(registeredProduct.id);
          const p = existingProduct !== null && existingProduct !== void 0 ? existingProduct : new GProduct(registeredProduct, this.decorator);
          p.title = vp.title || vp.name || p.title;
          if (GooglePlay.Adapter.trimProductTitles)
            p.title = p.title.replace(/ \(.*\)$/, "");
          p.description = vp.description || p.description;
          if ("product_format" in vp && vp.product_format === "v12.0") {
            if (vp.product_type === "subs")
              this.onSubsV12Loaded(p, vp);
            else
              this.onInAppLoaded(p, vp);
          } else {
            this.onInAppLoaded(p, vp);
          }
          if (!existingProduct) {
            this.products.push(p);
          }
          return p;
        }
        onSubsV12Loaded(product, vp) {
          vp.offers.forEach((productOffer) => {
            const lastPhase = productOffer.pricing_phases.slice(-1)[0];
            if ((lastPhase === null || lastPhase === void 0 ? void 0 : lastPhase.recurrence_mode) === CdvPurchase2.RecurrenceMode.FINITE_RECURRING) {
              const baseOffer = findBasePlan(productOffer.base_plan_id);
              if (baseOffer && baseOffer !== productOffer) {
                productOffer.pricing_phases.push(...baseOffer.pricing_phases);
              }
            }
            const offer = this.iabSubsOfferV12Loaded(product, vp, productOffer);
            product.addOffer(offer);
          });
          function findBasePlan(basePlanId) {
            if (!basePlanId)
              return null;
            for (const offer of vp.offers) {
              if (offer.base_plan_id === basePlanId && !offer.offer_id) {
                return offer;
              }
            }
            return null;
          }
          return product;
        }
        makeOfferId(productId, productOffer) {
          if (productOffer.base_plan_id) {
            if (productOffer.offer_id) {
              return productId + "@" + productOffer.base_plan_id + "@" + productOffer.offer_id;
            }
            return productId + "@" + productOffer.base_plan_id;
          }
          return productId + "@" + productOffer.token;
        }
        iabSubsOfferV12Loaded(product, vp, productOffer) {
          const offerId = this.makeOfferId(vp.productId, productOffer);
          const existingOffer = this.getOffer(offerId);
          const pricingPhases = productOffer.pricing_phases.map((p) => this.toPricingPhase(p));
          if (existingOffer) {
            existingOffer.pricingPhases = pricingPhases;
            return existingOffer;
          } else {
            const offer = new SubscriptionOffer({ id: offerId, product, pricingPhases, token: productOffer.token, tags: productOffer.tags }, this.decorator);
            this.offers.push(offer);
            return offer;
          }
        }
        /*
                    private iabSubsV11Loaded(p: Product, vp: SubscriptionV11): Product {
                        // console.log('iabSubsV11Loaded: ' + JSON.stringify(vp));
                        var p = store.products.byId[vp.productId];
                        var attributes = {
                            state: store.VALID,
                            title: vp.name || trimTitle(vp.title),
                            description: vp.description,
                        };
                        var currency = vp.price_currency_code || "";
                        var price = vp.formatted_price || vp.price;
                        var priceMicros = vp.price_amount_micros;
                        var subscriptionPeriod = vp.subscriptionPeriod ? vp.subscriptionPeriod : "";
                        var introPriceSubscriptionPeriod = vp.introductoryPricePeriod ? vp.introductoryPricePeriod : "";
                        var introPriceNumberOfPeriods = vp.introductoryPriceCycles ? vp.introductoryPriceCycles : 0;
                        var introPricePeriodUnit = normalizeISOPeriodUnit(introPriceSubscriptionPeriod);
                        var introPricePeriodCount = normalizeISOPeriodCount(introPriceSubscriptionPeriod);
                        var introPricePeriod = (introPriceNumberOfPeriods || 1) * (introPricePeriodCount || 1);
                        var introPriceMicros = vp.introductoryPriceAmountMicros ? vp.introductoryPriceAmountMicros : "";
                        var introPrice = vp.introductoryPrice ? vp.introductoryPrice : "";
                        var introPricePaymentMode;
        
                        if (vp.freeTrialPeriod) {
                            introPricePaymentMode = 'FreeTrial';
                            try {
                                introPricePeriodUnit = normalizeISOPeriodUnit(vp.freeTrialPeriod);
                                introPricePeriodCount = normalizeISOPeriodCount(vp.freeTrialPeriod);
                                introPricePeriod = introPricePeriodCount;
                            }
                            catch (e) {
                                store.log.warn('Failed to parse free trial period: ' + vp.freeTrialPeriod);
                            }
                        }
                        else if (vp.introductoryPrice) {
                            if (vp.introductoryPrice < vp.price && subscriptionPeriod === introPriceSubscriptionPeriod) {
                                introPricePaymentMode = 'PayAsYouGo';
                            }
                            else if (introPriceNumberOfPeriods === 1) {
                                introPricePaymentMode = 'UpFront';
                            }
                        }
        
                        if (!introPricePaymentMode) {
                            introPricePeriod = null;
                            introPricePeriodUnit = null;
                        }
        
                        var parsedSubscriptionPeriod = {};
                        if (subscriptionPeriod) {
                            parsedSubscriptionPeriod.unit = normalizeISOPeriodUnit(subscriptionPeriod);
                            parsedSubscriptionPeriod.count = normalizeISOPeriodCount(subscriptionPeriod);
                        }
        
                        var trialPeriod = vp.trial_period || null;
                        var trialPeriodUnit = vp.trial_period_unit || null;
                        var billingPeriod = parsedSubscriptionPeriod.count || vp.billing_period || null;
                        var billingPeriodUnit = parsedSubscriptionPeriod.unit || vp.billing_period_unit || null;
        
                        var pricingPhases = [];
                        if (trialPeriod) {
                            pricingPhases.push({
                                paymentMode: 'FreeTrial',
                                recurrenceMode: store.FINITE_RECURRING,
                                period: vp.freeTrialPeriod || toISO8601Duration(trialPeriodUnit, trialPeriod),
                                cycles: 1,
                                price: null,
                                priceMicros: 0,
                                currency: currency,
                            });
                        }
                        else if (introPricePeriod) {
                            pricingPhases.push({
                                paymentMode: 'PayAsYouGo',
                                recurrenceMode: store.FINITE_RECURRING,
                                period: vp.introPriceSubscriptionPeriod || toISO8601Duration(introPricePeriodUnit, introPricePeriodCount),
                                cycles: vp.introductoryPriceCycles || 1,
                                price: null, // formatted price not available
                                priceMicros: introPriceMicros,
                                currency: currency,
                            });
                        }
        
                        pricingPhases.push({
                            paymentMode: 'PayAsYouGo',
                            recurrenceMode: store.INFINITE_RECURRING,
                            period: vp.subscriptionPeriod || toISO8601Duration(billingPeriodUnit, billingPeriod), // ISO8601 duration
                            cycles: 0,
                            price: price,
                            priceMicros: priceMicros,
                            currency: currency,
                        });
                        attributes.pricingPhases = pricingPhases;
        
                        if (store.compatibility > 0 && store.compatibility < 11.999) {
                            Object.assign(attributes, {
                                price: price,
                                priceMicros: priceMicros,
                                currency: currency,
                                trialPeriod: trialPeriod,
                                trialPeriodUnit: trialPeriodUnit,
                                billingPeriod: billingPeriod,
                                billingPeriodUnit: billingPeriodUnit,
                                introPrice: introPrice,
                                introPriceMicros: introPriceMicros,
                                introPricePeriod: introPricePeriod,
                                introPricePeriodUnit: introPricePeriodUnit,
                                introPricePaymentMode: introPricePaymentMode,
                            });
                        }
        
                        if (store.compatibility > 0 && store.compatibility < 9.999) {
                            Object.assign(attributes, {
                                introPriceNumberOfPeriods: introPricePeriod,
                                introPriceSubscriptionPeriod: introPricePeriodUnit,
                            });
                        }
        
                        p.set(attributes);
                        p.trigger("loaded");
                    }
                    */
        onInAppLoaded(p, vp) {
          var _a, _b, _c, _d;
          if (vp.offers && vp.offers.length > 0) {
            vp.offers.forEach((productOffer) => {
              const offerId = productOffer.offer_id ? vp.productId + "@" + productOffer.offer_id : vp.productId;
              const pricingPhases2 = [{
                price: productOffer.formatted_price,
                priceMicros: productOffer.price_amount_micros,
                currency: productOffer.price_currency_code,
                recurrenceMode: CdvPurchase2.RecurrenceMode.NON_RECURRING
              }];
              const existingOffer2 = this.getOffer(offerId);
              if (existingOffer2) {
                existingOffer2.pricingPhases = pricingPhases2;
              } else {
                const offer = new InAppOffer({ id: offerId, product: p, pricingPhases: pricingPhases2, token: productOffer.offer_token }, this.decorator);
                this.offers.push(offer);
                p.addOffer(offer);
              }
            });
            return p;
          }
          const existingOffer = this.getOffer(vp.productId);
          const pricingPhases = [{
            price: (_b = (_a = vp.formatted_price) !== null && _a !== void 0 ? _a : vp.price) !== null && _b !== void 0 ? _b : `${((_c = vp.price_amount_micros) !== null && _c !== void 0 ? _c : 0) / 1e6} ${vp.price_currency_code}`,
            priceMicros: (_d = vp.price_amount_micros) !== null && _d !== void 0 ? _d : 0,
            currency: vp.price_currency_code,
            recurrenceMode: CdvPurchase2.RecurrenceMode.NON_RECURRING
          }];
          if (existingOffer) {
            existingOffer.pricingPhases = pricingPhases;
            p.offers = [existingOffer];
          } else {
            const newOffer = new InAppOffer({ id: vp.productId, product: p, pricingPhases }, this.decorator);
            this.offers.push(newOffer);
            p.offers = [newOffer];
          }
          return p;
        }
        toPaymentMode(phase) {
          return phase.price_amount_micros === 0 ? CdvPurchase2.PaymentMode.FREE_TRIAL : phase.recurrence_mode === GooglePlay.Bridge.RecurrenceMode.NON_RECURRING ? CdvPurchase2.PaymentMode.UP_FRONT : CdvPurchase2.PaymentMode.PAY_AS_YOU_GO;
        }
        toRecurrenceMode(mode) {
          switch (mode) {
            case GooglePlay.Bridge.RecurrenceMode.FINITE_RECURRING:
              return CdvPurchase2.RecurrenceMode.FINITE_RECURRING;
            case GooglePlay.Bridge.RecurrenceMode.INFINITE_RECURRING:
              return CdvPurchase2.RecurrenceMode.INFINITE_RECURRING;
            case GooglePlay.Bridge.RecurrenceMode.NON_RECURRING:
              return CdvPurchase2.RecurrenceMode.NON_RECURRING;
          }
        }
        toPricingPhase(phase) {
          return {
            price: phase.formatted_price,
            priceMicros: phase.price_amount_micros,
            currency: phase.price_currency_code,
            billingPeriod: phase.billing_period,
            billingCycles: phase.billing_cycle_count,
            recurrenceMode: this.toRecurrenceMode(phase.recurrence_mode),
            paymentMode: this.toPaymentMode(phase)
          };
        }
      }
      GooglePlay.Products = Products;
    })(CdvPurchase2.GooglePlay || (CdvPurchase2.GooglePlay = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(GooglePlay) {
      (function(PublisherAPI) {
        (function(GoogleErrorReason) {
          GoogleErrorReason["SUBSCRIPTION_NO_LONGER_AVAILABLE"] = "subscriptionPurchaseNoLongerAvailable";
          GoogleErrorReason["PURCHASE_TOKEN_NO_LONGER_VALID"] = "purchaseTokenNoLongerValid";
        })(PublisherAPI.GoogleErrorReason || (PublisherAPI.GoogleErrorReason = {}));
        (function(ErrorCode2) {
          ErrorCode2[ErrorCode2["GONE"] = 410] = "GONE";
        })(PublisherAPI.ErrorCode || (PublisherAPI.ErrorCode = {}));
      })(GooglePlay.PublisherAPI || (GooglePlay.PublisherAPI = {}));
    })(CdvPurchase2.GooglePlay || (CdvPurchase2.GooglePlay = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      const HEX2STR = "0123456789abcdef".split("");
      function toHexString(r) {
        for (var n = "", e = 0; e < 4; e++)
          n += HEX2STR[r >> 8 * e + 4 & 15] + HEX2STR[r >> 8 * e & 15];
        return n;
      }
      function hexStringFromArray(array) {
        const out = [];
        for (var arrayLength = array.length, i = 0; i < arrayLength; i++)
          out.push(toHexString(array[i]));
        return out.join("");
      }
      function add32(r, n) {
        return r + n & 4294967295;
      }
      function complexShift(r, n, e, t, o, u2, shiftFunction) {
        function shiftAdd32(op0, op1, v1) {
          return add32(op0 << op1 | op0 >>> 32 - op1, v1);
        }
        function add32x4(i0, i1, j0, j1) {
          return add32(add32(i1, i0), add32(j0, j1));
        }
        return shiftAdd32(add32x4(r, n, t, u2), o, e);
      }
      var step1Function = function(shiftFunction, n, e, t, o, u2, f2, a) {
        return complexShift(e & t | ~e & o, n, e, u2, f2, a);
      };
      var step2Function = function(shiftFunction, n, e, t, o, u2, f2, a) {
        return complexShift(e & o | t & ~o, n, e, u2, f2, a);
      };
      var step3Function = function(shiftFunction, n, e, t, o, u2, f2, a) {
        return complexShift(e ^ t ^ o, n, e, u2, f2, a);
      };
      var step4Function = function(shiftFunction, n, e, t, o, u2, f2, a) {
        return complexShift(t ^ (e | ~o), n, e, u2, f2, a);
      };
      function hashStep(inOutVec4, strAsInts, shiftFunction) {
        if (!shiftFunction)
          shiftFunction = add32;
        let v0 = inOutVec4[0];
        let v1 = inOutVec4[1];
        let v2 = inOutVec4[2];
        let v3 = inOutVec4[3];
        var step1 = step1Function.bind(null, shiftFunction);
        v0 = step1(v0, v1, v2, v3, strAsInts[0], 7, -680876936);
        v3 = step1(v3, v0, v1, v2, strAsInts[1], 12, -389564586);
        v2 = step1(v2, v3, v0, v1, strAsInts[2], 17, 606105819);
        v1 = step1(v1, v2, v3, v0, strAsInts[3], 22, -1044525330);
        v0 = step1(v0, v1, v2, v3, strAsInts[4], 7, -176418897);
        v3 = step1(v3, v0, v1, v2, strAsInts[5], 12, 1200080426);
        v2 = step1(v2, v3, v0, v1, strAsInts[6], 17, -1473231341);
        v1 = step1(v1, v2, v3, v0, strAsInts[7], 22, -45705983);
        v0 = step1(v0, v1, v2, v3, strAsInts[8], 7, 1770035416);
        v3 = step1(v3, v0, v1, v2, strAsInts[9], 12, -1958414417);
        v2 = step1(v2, v3, v0, v1, strAsInts[10], 17, -42063);
        v1 = step1(v1, v2, v3, v0, strAsInts[11], 22, -1990404162);
        v0 = step1(v0, v1, v2, v3, strAsInts[12], 7, 1804603682);
        v3 = step1(v3, v0, v1, v2, strAsInts[13], 12, -40341101);
        v2 = step1(v2, v3, v0, v1, strAsInts[14], 17, -1502002290);
        v1 = step1(v1, v2, v3, v0, strAsInts[15], 22, 1236535329);
        var step2 = step2Function.bind(null, shiftFunction);
        v0 = step2(v0, v1, v2, v3, strAsInts[1], 5, -165796510);
        v3 = step2(v3, v0, v1, v2, strAsInts[6], 9, -1069501632);
        v2 = step2(v2, v3, v0, v1, strAsInts[11], 14, 643717713);
        v1 = step2(v1, v2, v3, v0, strAsInts[0], 20, -373897302);
        v0 = step2(v0, v1, v2, v3, strAsInts[5], 5, -701558691);
        v3 = step2(v3, v0, v1, v2, strAsInts[10], 9, 38016083);
        v2 = step2(v2, v3, v0, v1, strAsInts[15], 14, -660478335);
        v1 = step2(v1, v2, v3, v0, strAsInts[4], 20, -405537848);
        v0 = step2(v0, v1, v2, v3, strAsInts[9], 5, 568446438);
        v3 = step2(v3, v0, v1, v2, strAsInts[14], 9, -1019803690);
        v2 = step2(v2, v3, v0, v1, strAsInts[3], 14, -187363961);
        v1 = step2(v1, v2, v3, v0, strAsInts[8], 20, 1163531501);
        v0 = step2(v0, v1, v2, v3, strAsInts[13], 5, -1444681467);
        v3 = step2(v3, v0, v1, v2, strAsInts[2], 9, -51403784);
        v2 = step2(v2, v3, v0, v1, strAsInts[7], 14, 1735328473);
        v1 = step2(v1, v2, v3, v0, strAsInts[12], 20, -1926607734);
        var step3 = step3Function.bind(null, shiftFunction);
        v0 = step3(v0, v1, v2, v3, strAsInts[5], 4, -378558);
        v3 = step3(v3, v0, v1, v2, strAsInts[8], 11, -2022574463);
        v2 = step3(v2, v3, v0, v1, strAsInts[11], 16, 1839030562);
        v1 = step3(v1, v2, v3, v0, strAsInts[14], 23, -35309556);
        v0 = step3(v0, v1, v2, v3, strAsInts[1], 4, -1530992060);
        v3 = step3(v3, v0, v1, v2, strAsInts[4], 11, 1272893353);
        v2 = step3(v2, v3, v0, v1, strAsInts[7], 16, -155497632);
        v1 = step3(v1, v2, v3, v0, strAsInts[10], 23, -1094730640);
        v0 = step3(v0, v1, v2, v3, strAsInts[13], 4, 681279174);
        v3 = step3(v3, v0, v1, v2, strAsInts[0], 11, -358537222);
        v2 = step3(v2, v3, v0, v1, strAsInts[3], 16, -722521979);
        v1 = step3(v1, v2, v3, v0, strAsInts[6], 23, 76029189);
        v0 = step3(v0, v1, v2, v3, strAsInts[9], 4, -640364487);
        v3 = step3(v3, v0, v1, v2, strAsInts[12], 11, -421815835);
        v2 = step3(v2, v3, v0, v1, strAsInts[15], 16, 530742520);
        v1 = step3(v1, v2, v3, v0, strAsInts[2], 23, -995338651);
        var step4 = step4Function.bind(null, shiftFunction);
        v0 = step4(v0, v1, v2, v3, strAsInts[0], 6, -198630844);
        v3 = step4(v3, v0, v1, v2, strAsInts[7], 10, 1126891415);
        v2 = step4(v2, v3, v0, v1, strAsInts[14], 15, -1416354905);
        v1 = step4(v1, v2, v3, v0, strAsInts[5], 21, -57434055);
        v0 = step4(v0, v1, v2, v3, strAsInts[12], 6, 1700485571);
        v3 = step4(v3, v0, v1, v2, strAsInts[3], 10, -1894986606);
        v2 = step4(v2, v3, v0, v1, strAsInts[10], 15, -1051523);
        v1 = step4(v1, v2, v3, v0, strAsInts[1], 21, -2054922799);
        v0 = step4(v0, v1, v2, v3, strAsInts[8], 6, 1873313359);
        v3 = step4(v3, v0, v1, v2, strAsInts[15], 10, -30611744);
        v2 = step4(v2, v3, v0, v1, strAsInts[6], 15, -1560198380);
        v1 = step4(v1, v2, v3, v0, strAsInts[13], 21, 1309151649);
        v0 = step4(v0, v1, v2, v3, strAsInts[4], 6, -145523070);
        v3 = step4(v3, v0, v1, v2, strAsInts[11], 10, -1120210379);
        v2 = step4(v2, v3, v0, v1, strAsInts[2], 15, 718787259);
        v1 = step4(v1, v2, v3, v0, strAsInts[9], 21, -343485551);
        inOutVec4[0] = shiftFunction(v0, inOutVec4[0]);
        inOutVec4[1] = shiftFunction(v1, inOutVec4[1]);
        inOutVec4[2] = shiftFunction(v2, inOutVec4[2]);
        inOutVec4[3] = shiftFunction(v3, inOutVec4[3]);
      }
      function stringToIntArray(r) {
        for (var ret = [], e = 0; e < 64; e += 4)
          ret[e >> 2] = r.charCodeAt(e) + (r.charCodeAt(e + 1) << 8) + (r.charCodeAt(e + 2) << 16) + (r.charCodeAt(e + 3) << 24);
        return ret;
      }
      function computeMD5(str, shiftFunction) {
        let lastCharIndex;
        const strLength = str.length;
        const vec4 = [1732584193, -271733879, -1732584194, 271733878];
        for (lastCharIndex = 64; lastCharIndex <= strLength; lastCharIndex += 64)
          hashStep(vec4, stringToIntArray(str.substring(lastCharIndex - 64, lastCharIndex)), shiftFunction);
        const vec16 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const reminderLength = (str = str.substring(lastCharIndex - 64)).length;
        let vec16Index;
        for (vec16Index = 0; vec16Index < reminderLength; vec16Index++)
          vec16[vec16Index >> 2] |= str.charCodeAt(vec16Index) << (vec16Index % 4 << 3);
        vec16[vec16Index >> 2] |= 128 << (vec16Index % 4 << 3);
        if (vec16Index > 55) {
          hashStep(vec4, vec16, shiftFunction);
          for (vec16Index = 16; vec16Index--; )
            vec16[vec16Index] = 0;
        }
        vec16[14] = 8 * strLength;
        hashStep(vec4, vec16, shiftFunction);
        return vec4;
      }
      function md5(str) {
        if (!str)
          return "";
        let shiftFunction;
        if ("5d41402abc4b2a76b9719d911017c592" !== hexStringFromArray(computeMD5("hello")))
          shiftFunction = function(r, n) {
            const e = (65535 & r) + (65535 & n);
            return (r >> 16) + (n >> 16) + (e >> 16) << 16 | 65535 & e;
          };
        return hexStringFromArray(computeMD5(str, shiftFunction));
      }
      Utils.md5 = md5;
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(IapticJS) {
      class Receipt extends CdvPurchase2.Receipt {
        constructor(purchases, accessToken, context) {
          super(CdvPurchase2.Platform.IAPTIC_JS, context.apiDecorators);
          Object.defineProperty(this, "context", { "enumerable": false, "writable": true, value: context });
          this.purchases = purchases;
          this.accessToken = accessToken;
          this.transactions = purchases.map((p) => new Transaction(this, p, context.apiDecorators));
        }
        // Add a refresh method if needed to update based on new purchase data
        refresh(purchases) {
          this.purchases = purchases;
          this.transactions = purchases.map((p) => {
            const existing = this.transactions.find((t) => t.purchase.purchaseId === p.purchaseId);
            if (existing) {
              existing.refresh(p);
              return existing;
            }
            return new Transaction(this, p, this.context.apiDecorators);
          });
        }
      }
      IapticJS.Receipt = Receipt;
      class Transaction extends CdvPurchase2.Transaction {
        constructor(receipt, purchase, decorator) {
          super(CdvPurchase2.Platform.IAPTIC_JS, receipt, decorator);
          this.purchase = purchase;
          this.refresh(purchase);
        }
        refresh(purchase) {
          this.purchase = purchase;
          const platformPrefix = purchase.platform ? `${purchase.platform}:` : "stripe:";
          const productId = purchase.productId.startsWith(platformPrefix) ? purchase.productId : `${platformPrefix}${purchase.productId}`;
          this.products = [{ id: productId }];
          this.transactionId = purchase.transactionId;
          this.purchaseId = purchase.purchaseId;
          this.purchaseDate = new Date(purchase.purchaseDate);
          this.expirationDate = purchase.expirationDate ? new Date(purchase.expirationDate) : void 0;
          this.lastRenewalDate = purchase.lastRenewalDate ? new Date(purchase.lastRenewalDate) : void 0;
          this.renewalIntent = purchase.renewalIntent === "Renew" ? CdvPurchase2.RenewalIntent.RENEW : CdvPurchase2.RenewalIntent.LAPSE;
          this.state = CdvPurchase2.TransactionState.APPROVED;
          this.isAcknowledged = true;
          this.amountMicros = purchase.amountMicros;
          this.currency = purchase.currency;
        }
      }
      IapticJS.Transaction = Transaction;
      class Adapter {
        constructor(context, options) {
          this.id = CdvPurchase2.Platform.IAPTIC_JS;
          this.name = "IapticJS";
          this.ready = false;
          this.products = [];
          this._receipts = [];
          this.supportsParallelLoading = false;
          this.context = context;
          this.log = context.log.child("IapticJS");
          this.options = options;
          this.backendAdapterType = options.type;
        }
        get receipts() {
          return this._receipts;
        }
        upsertProduct(product) {
          this.log.debug(`upsertProduct(${product.id})`);
          const existingIndex = this.products.findIndex((p) => p.id === product.id);
          if (existingIndex >= 0) {
            this.products[existingIndex] = product;
          } else {
            this.products.push(product);
          }
        }
        get isSupported() {
          return typeof window.IapticJS !== "undefined" && typeof window.IapticJS.createAdapter === "function";
        }
        initialize() {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info("initialize()");
            if (!this.isSupported) {
              const msg = "iaptic-js SDK is not available. Please ensure it is loaded.";
              this.log.warn(msg);
              return iapticJsError(CdvPurchase2.ErrorCode.SETUP, msg, null);
            }
            try {
              this.log.info(`Creating iaptic-js adapter with options: ${JSON.stringify(this.options)}`);
              this.iapticAdapterInstance = window.IapticJS.createAdapter(this.options);
              this.ready = true;
              yield this.loadReceipts();
              this.log.info("IapticJS Adapter Initialized");
              this.context.listener.receiptsReady(CdvPurchase2.Platform.IAPTIC_JS);
              return void 0;
            } catch (err) {
              this.ready = false;
              const message = (err === null || err === void 0 ? void 0 : err.message) || "Failed to initialize IapticJS adapter";
              this.log.error("Initialization failed: " + message);
              return iapticJsError(CdvPurchase2.ErrorCode.SETUP, message, null);
            }
          });
        }
        loadProducts(products) {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info(`loadProducts() for ${products.length} registered products`);
            if (!this.ready || !this.iapticAdapterInstance) {
              return products.map((p) => iapticJsError(CdvPurchase2.ErrorCode.SETUP, "Adapter not initialized", p.id));
            }
            try {
              const iapticProducts = yield this.iapticAdapterInstance.getProducts();
              this.log.debug("Fetched products from iaptic-js: " + JSON.stringify(iapticProducts.map((p) => p.id)));
              const results = products.map((registeredProduct) => {
                var _a;
                const iapticProduct = iapticProducts.find((p) => {
                  const iapticIdWithoutPrefix = p.id.includes(":") ? p.id.split(":", 2)[1] : p.id;
                  const registeredIdWithoutPrefix = registeredProduct.id.includes(":") ? registeredProduct.id.split(":", 2)[1] : registeredProduct.id;
                  return iapticIdWithoutPrefix === registeredIdWithoutPrefix;
                });
                if (!iapticProduct) {
                  this.log.warn(`Registered product ID "${registeredProduct.id}" not found in fetched iaptic-js products.`);
                  return iapticJsError(CdvPurchase2.ErrorCode.PRODUCT_NOT_AVAILABLE, `Product ${registeredProduct.id} not found via iaptic-js`, registeredProduct.id);
                }
                const platformProductId = `${CdvPurchase2.Platform.IAPTIC_JS}:${iapticProduct.id.split(":").pop()}`;
                let product = this.products.find((p) => p.id === platformProductId);
                if (!product) {
                  product = new CdvPurchase2.Product(Object.assign(Object.assign({}, registeredProduct), { platform: CdvPurchase2.Platform.IAPTIC_JS, id: platformProductId }), this.context.apiDecorators);
                  this.upsertProduct(product);
                }
                product.title = iapticProduct.title;
                product.description = (_a = iapticProduct.description) !== null && _a !== void 0 ? _a : "";
                product.offers = [];
                iapticProduct.offers.forEach((o) => {
                  const offerPlatformPrefix = o.platform ? `${o.platform}:` : "stripe:";
                  const offerIdWithoutPrefix = o.id.includes(":") ? o.id.split(":", 2)[1] : o.id;
                  const fullOfferId = `${offerPlatformPrefix}${offerIdWithoutPrefix}`;
                  const offer = new CdvPurchase2.Offer({
                    id: fullOfferId,
                    product,
                    pricingPhases: o.pricingPhases.map((pp) => ({
                      priceMicros: pp.priceMicros,
                      currency: pp.currency,
                      billingPeriod: pp.billingPeriod,
                      paymentMode: pp.paymentMode,
                      recurrenceMode: pp.recurrenceMode,
                      price: window.IapticJS.Utils.formatCurrency(pp.priceMicros, pp.currency)
                      // Use Utils for formatting
                    }))
                  }, this.context.apiDecorators);
                  product.addOffer(offer);
                });
                this.log.debug(`Processed product ${product.id} with ${product.offers.length} offers.`);
                return product;
              });
              this.context.listener.productsUpdated(CdvPurchase2.Platform.IAPTIC_JS, this.products);
              return results;
            } catch (err) {
              this.log.error("Failed to load products: " + err.message);
              return products.map((p) => iapticJsError(CdvPurchase2.ErrorCode.LOAD, err.message || "Failed to load products", p.id));
            }
          });
        }
        loadReceipts() {
          var _a, _b;
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info("loadReceipts()");
            if (!this.ready || !this.iapticAdapterInstance) {
              this.log.warn("Adapter not ready, skipping loadReceipts.");
              return this._receipts;
            }
            try {
              const accessToken = this.iapticAdapterInstance.getAccessToken();
              if (!accessToken) {
                this.log.info("No stored access token found.");
                if (this._receipts.length > 0) {
                  this._receipts = [];
                  this.context.listener.receiptsUpdated(CdvPurchase2.Platform.IAPTIC_JS, []);
                }
                return this._receipts;
              }
              this.log.info("Fetching purchases with stored access token.");
              const purchases = yield this.iapticAdapterInstance.getPurchases(accessToken);
              const currentToken = (_a = this.iapticAdapterInstance.getAccessToken()) !== null && _a !== void 0 ? _a : accessToken;
              if (purchases.length > 0) {
                let receipt = this._receipts.find((r) => r.accessToken === currentToken);
                if (!receipt) {
                  this.log.info(`Creating new receipt for token hash ${currentToken.substring(0, 10)}...`);
                  receipt = new Receipt(purchases, currentToken, this.context);
                  this._receipts = [receipt];
                } else {
                  this.log.info(`Refreshing existing receipt for token hash ${currentToken.substring(0, 10)}...`);
                  receipt.refresh(purchases);
                }
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.IAPTIC_JS, [receipt]);
              } else {
                if (this._receipts.length > 0) {
                  this.log.info("No purchases found for token, clearing local receipts.");
                  this._receipts = [];
                  this.context.listener.receiptsUpdated(CdvPurchase2.Platform.IAPTIC_JS, []);
                }
              }
              this.context.listener.receiptsReady(CdvPurchase2.Platform.IAPTIC_JS);
              return this._receipts;
            } catch (err) {
              this.log.warn("Failed to load receipts: " + err.message);
              if ((_b = err.message) === null || _b === void 0 ? void 0 : _b.includes("Invalid access token")) {
                this.log.warn("Invalid access token detected, clearing stored data.");
                this.iapticAdapterInstance.clearStoredData();
                this._receipts = [];
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.IAPTIC_JS, []);
              }
              this.context.listener.receiptsReady(CdvPurchase2.Platform.IAPTIC_JS);
              return [];
            }
          });
        }
        order(offer, additionalData) {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info(`order() - Offer ID: ${offer.id}`);
            if (!this.ready || !this.iapticAdapterInstance) {
              return iapticJsError(CdvPurchase2.ErrorCode.SETUP, "Adapter not initialized", offer.productId);
            }
            try {
              yield this.iapticAdapterInstance.order({
                offerId: offer.id,
                applicationUsername: (additionalData === null || additionalData === void 0 ? void 0 : additionalData.applicationUsername) || this.context.getApplicationUsername() || "",
                successUrl: window.location.href,
                cancelUrl: window.location.href,
                accessToken: this.iapticAdapterInstance.getAccessToken()
                // Pass existing token
              });
              this.log.info(`Order initiated for offer ${offer.id}. User will be redirected.`);
              return void 0;
            } catch (err) {
              this.log.error("Order failed: " + err.message);
              return iapticJsError(CdvPurchase2.ErrorCode.PURCHASE, err.message || "Failed to initiate order", offer.productId);
            }
          });
        }
        finish(transaction2) {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info(`finish(${transaction2.transactionId}) - No-op for IapticJS/Stripe`);
            transaction2.state = CdvPurchase2.TransactionState.FINISHED;
            const parentReceipt = this._receipts.find((r) => r.transactions.indexOf(transaction2) >= 0);
            if (parentReceipt) {
              this.context.listener.receiptsUpdated(CdvPurchase2.Platform.IAPTIC_JS, [parentReceipt]);
            }
            return void 0;
          });
        }
        receiptValidationBody(receipt) {
          var _a, _b, _c;
          return __awaiter(this, void 0, void 0, function* () {
            if (receipt.platform !== CdvPurchase2.Platform.IAPTIC_JS)
              return void 0;
            this.log.info(`receiptValidationBody for IapticJS - AccessToken: ${receipt.accessToken ? "present" : "missing"}`);
            if (!receipt.accessToken) {
              this.log.warn("Cannot prepare validation body: IapticJS receipt is missing accessToken.");
              return void 0;
            }
            const firstPurchase = receipt.purchases[0];
            const product = firstPurchase ? this.context.registeredProducts.find(CdvPurchase2.Platform.IAPTIC_JS, firstPurchase.productId) : void 0;
            const productIdForBody = (_b = (_a = product === null || product === void 0 ? void 0 : product.id) !== null && _a !== void 0 ? _a : firstPurchase === null || firstPurchase === void 0 ? void 0 : firstPurchase.productId) !== null && _b !== void 0 ? _b : "unknown-product";
            const productTypeForBody = (_c = product === null || product === void 0 ? void 0 : product.type) !== null && _c !== void 0 ? _c : firstPurchase ? CdvPurchase2.ProductType.PAID_SUBSCRIPTION : CdvPurchase2.ProductType.CONSUMABLE;
            return {
              id: productIdForBody,
              type: productTypeForBody,
              products: this.products.map((p) => ({
                id: p.id,
                type: p.type,
                offers: p.offers.map((o) => ({ id: o.id, pricingPhases: o.pricingPhases }))
              })),
              transaction: {
                type: "iaptic",
                adapter: this.backendAdapterType,
                accessToken: receipt.accessToken
              }
            };
          });
        }
        handleReceiptValidationResponse(receipt, response) {
          var _a, _b;
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info("handleReceiptValidationResponse for IapticJS");
            if (response.ok) {
              (_a = response.data) === null || _a === void 0 ? void 0 : _a.transaction;
              const collection = (_b = response.data) === null || _b === void 0 ? void 0 : _b.collection;
              if (collection) {
                const purchases = collection.map((vp) => {
                  var _a2;
                  return {
                    purchaseId: vp.purchaseId,
                    transactionId: vp.transactionId,
                    productId: vp.id,
                    platform: "stripe",
                    purchaseDate: vp.purchaseDate ? new Date(vp.purchaseDate).toISOString() : "",
                    lastRenewalDate: vp.lastRenewalDate ? new Date(vp.lastRenewalDate).toISOString() : "",
                    expirationDate: vp.expiryDate ? new Date(vp.expiryDate).toISOString() : "",
                    renewalIntent: vp.renewalIntent === CdvPurchase2.RenewalIntent.RENEW ? "Renew" : "Cancel",
                    isTrialPeriod: (_a2 = vp.isTrialPeriod) !== null && _a2 !== void 0 ? _a2 : false,
                    amountMicros: 0,
                    currency: ""
                    // Not typically in VerifiedPurchase
                  };
                });
                receipt.refresh(purchases);
              } else {
                receipt.refresh([]);
              }
              this.context.listener.receiptsUpdated(CdvPurchase2.Platform.IAPTIC_JS, [receipt]);
            } else {
              this.log.warn(`Receipt validation failed: ${response.message} (Code: ${response.code})`);
              if (response.code === CdvPurchase2.ErrorCode.COMMUNICATION) {
                this.log.info("Clearing potentially invalid access token due to validation failure.");
                this.iapticAdapterInstance.clearStoredData();
                this._receipts = this._receipts.filter((r) => r !== receipt);
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.IAPTIC_JS, []);
              }
            }
          });
        }
        requestPayment(payment, additionalData) {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.warn("requestPayment is not directly supported for IapticJS/Stripe. Use order().");
            return iapticJsError(CdvPurchase2.ErrorCode.UNKNOWN, "requestPayment not supported, use order() instead", null);
          });
        }
        manageSubscriptions() {
          return __awaiter(this, void 0, void 0, function* () {
            if (!this.ready || !this.iapticAdapterInstance) {
              return iapticJsError(CdvPurchase2.ErrorCode.SETUP, "Adapter not initialized", null);
            }
            try {
              yield this.iapticAdapterInstance.redirectToCustomerPortal({
                returnUrl: window.location.href
              });
              return void 0;
            } catch (err) {
              this.log.error("Failed to redirect to customer portal: " + err.message);
              return iapticJsError(CdvPurchase2.ErrorCode.UNKNOWN, err.message || "Failed to open subscription management", null);
            }
          });
        }
        manageBilling() {
          return __awaiter(this, void 0, void 0, function* () {
            return this.manageSubscriptions();
          });
        }
        checkSupport(functionality) {
          const supported = ["order", "manageSubscriptions", "manageBilling"];
          return supported.indexOf(functionality) !== -1;
        }
        restorePurchases() {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info("restorePurchases() - calling loadReceipts()");
            if (!this.ready || !this.iapticAdapterInstance) {
              return iapticJsError(CdvPurchase2.ErrorCode.SETUP, "Adapter not initialized", null);
            }
            try {
              yield this.loadReceipts();
              return void 0;
            } catch (err) {
              this.log.error("Restore purchases failed during loadReceipts: " + err.message);
              return iapticJsError(CdvPurchase2.ErrorCode.REFRESH, err.message || "Failed to restore purchases", null);
            }
          });
        }
      }
      IapticJS.Adapter = Adapter;
      function iapticJsError(code, message, productId) {
        return CdvPurchase2.storeError(code, message, CdvPurchase2.Platform.IAPTIC_JS, productId);
      }
    })(CdvPurchase2.IapticJS || (CdvPurchase2.IapticJS = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Test) {
      const platform = CdvPurchase2.Platform.TEST;
      let verifiedPurchases = [];
      function updateVerifiedPurchases(tr) {
        tr.products.forEach((p) => {
          var _a, _b, _c, _d;
          const existing = verifiedPurchases.find((v) => p.id === v.id);
          const attributes = {
            id: p.id,
            purchaseDate: (_a = tr.purchaseDate) === null || _a === void 0 ? void 0 : _a.getTime(),
            expiryDate: (_b = tr.expirationDate) === null || _b === void 0 ? void 0 : _b.getTime(),
            lastRenewalDate: (_c = tr.lastRenewalDate) === null || _c === void 0 ? void 0 : _c.getTime(),
            renewalIntent: tr.renewalIntent,
            renewalIntentChangeDate: (_d = tr.renewalIntentChangeDate) === null || _d === void 0 ? void 0 : _d.getTime()
          };
          if (existing) {
            Object.assign(existing, attributes);
          } else {
            verifiedPurchases.push(attributes);
          }
        });
      }
      class Adapter {
        constructor(context) {
          this.id = CdvPurchase2.Platform.TEST;
          this.name = "Test";
          this.ready = false;
          this.products = [];
          this.receipts = [];
          this.supportsParallelLoading = true;
          this.context = context;
          this.log = context.log.child("Test");
        }
        get isSupported() {
          return true;
        }
        initialize() {
          return __awaiter(this, void 0, void 0, function* () {
            return;
          });
        }
        loadReceipts() {
          return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve2) => {
              setTimeout(() => {
                this.context.listener.receiptsReady(CdvPurchase2.Platform.TEST);
                resolve2(this.receipts);
              }, 600);
            });
          });
        }
        loadProducts(products) {
          return __awaiter(this, void 0, void 0, function* () {
            return products.map((registerProduct) => {
              const isCustomProduct = !!Test.customTestProducts[registerProduct.id];
              const isBuiltInProduct = !!Test.testProductsArray.find((p) => p.id === registerProduct.id && p.type === registerProduct.type);
              if (!isCustomProduct && !isBuiltInProduct) {
                return testStoreError(CdvPurchase2.ErrorCode.PRODUCT_NOT_AVAILABLE, "This product is not available", registerProduct.id);
              }
              const existingProduct = this.products.find((p) => p.id === registerProduct.id);
              if (existingProduct)
                return existingProduct;
              if (registerProduct.id === Test.testProducts.PAID_SUBSCRIPTION_ACTIVE.id) {
                setTimeout(() => {
                  this.reportActiveSubscription();
                }, 500);
              }
              const product = Test.initTestProduct(registerProduct.id, this.context.apiDecorators);
              if (!product)
                return testStoreError(CdvPurchase2.ErrorCode.PRODUCT_NOT_AVAILABLE, "Could not load this product", registerProduct.id);
              this.products.push(product);
              this.context.listener.productsUpdated(CdvPurchase2.Platform.TEST, [product]);
              return product;
            });
          });
        }
        order(offer) {
          return __awaiter(this, void 0, void 0, function* () {
            if (offer.id.indexOf("-fail-") > 0) {
              return testStoreError(CdvPurchase2.ErrorCode.PURCHASE, "Purchase failed.", offer.productId);
            }
            const product = this.products.find((p) => p.id === offer.productId);
            if (!CdvPurchase2.Internal.LocalReceipts.canPurchase(this.receipts, product)) {
              return testStoreError(CdvPurchase2.ErrorCode.PURCHASE, "Product already owned", offer.productId);
            }
            const response = prompt(`Do you want to purchase ${offer.productId} for ${offer.pricingPhases[0].price}?
Enter "Y" to confirm.
Enter "E" to fail with an error.Anything else to cancel.`);
            if ((response === null || response === void 0 ? void 0 : response.toUpperCase()) === "E")
              return testStoreError(CdvPurchase2.ErrorCode.PURCHASE, "Purchase failed", offer.productId);
            if ((response === null || response === void 0 ? void 0 : response.toUpperCase()) !== "Y")
              return testStoreError(CdvPurchase2.ErrorCode.PAYMENT_CANCELLED, "Purchase flow has been cancelled by the user", offer.productId);
            const receipt = new CdvPurchase2.Receipt(platform, this.context.apiDecorators);
            const tr = new CdvPurchase2.Transaction(platform, receipt, this.context.apiDecorators);
            receipt.transactions = [tr];
            tr.products = [{
              id: offer.productId,
              offerId: offer.id
            }];
            tr.state = CdvPurchase2.TransactionState.APPROVED;
            tr.purchaseDate = /* @__PURE__ */ new Date();
            tr.transactionId = offer.productId + "-" + (/* @__PURE__ */ new Date()).getTime();
            tr.isAcknowledged = false;
            if (offer.productType === CdvPurchase2.ProductType.PAID_SUBSCRIPTION) {
              tr.expirationDate = /* @__PURE__ */ new Date(+/* @__PURE__ */ new Date() + 6048e5);
              tr.renewalIntent = CdvPurchase2.RenewalIntent.RENEW;
            }
            updateVerifiedPurchases(tr);
            this.receipts.push(receipt);
            this.context.listener.receiptsUpdated(CdvPurchase2.Platform.TEST, [receipt]);
          });
        }
        finish(transaction2) {
          return new Promise((resolve2) => {
            setTimeout(() => {
              transaction2.state = CdvPurchase2.TransactionState.FINISHED;
              transaction2.isAcknowledged = true;
              updateVerifiedPurchases(transaction2);
              const product = this.products.find((p) => transaction2.products[0].id === p.id);
              if ((product === null || product === void 0 ? void 0 : product.type) === CdvPurchase2.ProductType.CONSUMABLE)
                transaction2.isConsumed = true;
              const receipts = this.receipts.filter((r) => r.hasTransaction(transaction2));
              this.context.listener.receiptsUpdated(platform, receipts);
              resolve2(void 0);
            }, 500);
          });
        }
        receiptValidationBody(receipt) {
          return __awaiter(this, void 0, void 0, function* () {
            return;
          });
        }
        handleReceiptValidationResponse(receipt, response) {
          return __awaiter(this, void 0, void 0, function* () {
            return;
          });
        }
        /**
         * This function simulates a payment process by prompting the user to confirm the payment.
         *
         * It creates a `Receipt` and `Transaction` object and returns the `Transaction` object if the user enters "Y" in the prompt.
         *
         * @param paymentRequest - An object containing information about the payment, such as the amount and currency.
         * @param additionalData - Additional data to be included in the receipt.
         *
         * @returns A promise that resolves to either an error object (if the user enters "E" in the prompt),
         * a `Transaction` object (if the user confirms the payment), or `undefined` (if the user does not confirm the payment).
         *
         * @example
         *
         * const paymentRequest = {
         *   amountMicros: 1000000,
         *   currency: "USD",
         *   items: [{ id: "product-1" }, { id: "product-2" }]
         * };
         * const result = await requestPayment(paymentRequest);
         * if (result?.isError) {
         *   console.error(`Error: ${result.message}`);
         * } else if (result) {
         *   console.log(`Transaction approved: ${result.transactionId}`);
         * } else {
         *   console.log("Payment cancelled by user");
         * }
         */
        requestPayment(paymentRequest, additionalData) {
          var _a;
          return __awaiter(this, void 0, void 0, function* () {
            yield CdvPurchase2.Utils.asyncDelay(100);
            const response = prompt(`Mock payment of ${((_a = paymentRequest.amountMicros) !== null && _a !== void 0 ? _a : 0) / 1e6} ${paymentRequest.currency}. Enter "Y" to confirm. Enter "E" to trigger an error.`);
            if ((response === null || response === void 0 ? void 0 : response.toUpperCase()) === "E")
              return testStoreError(CdvPurchase2.ErrorCode.PAYMENT_NOT_ALLOWED, "Payment not allowed", null);
            if ((response === null || response === void 0 ? void 0 : response.toUpperCase()) !== "Y")
              return;
            const receipt = new CdvPurchase2.Receipt(platform, this.context.apiDecorators);
            const transaction2 = new CdvPurchase2.Transaction(CdvPurchase2.Platform.TEST, receipt, this.context.apiDecorators);
            transaction2.purchaseDate = /* @__PURE__ */ new Date();
            transaction2.products = paymentRequest.items.filter((p) => p).map((product) => ({ id: (product === null || product === void 0 ? void 0 : product.id) || "" })), transaction2.state = CdvPurchase2.TransactionState.APPROVED;
            transaction2.transactionId = "payment-" + (/* @__PURE__ */ new Date()).getTime();
            transaction2.amountMicros = paymentRequest.amountMicros;
            transaction2.currency = paymentRequest.currency;
            receipt.transactions = [transaction2];
            this.receipts.push(receipt);
            setTimeout(() => {
              this.context.listener.receiptsUpdated(platform, [receipt]);
            }, 400);
            return transaction2;
          });
        }
        manageSubscriptions() {
          return __awaiter(this, void 0, void 0, function* () {
            alert("Pseudo subscription management interface. Close it when you are done.");
            return;
          });
        }
        manageBilling() {
          return __awaiter(this, void 0, void 0, function* () {
            alert("Pseudo billing management interface. Close it when you are done.");
            return;
          });
        }
        reportActiveSubscription() {
          if (this.receipts.find((r) => r.transactions[0].transactionId === transactionId(1))) {
            return;
          }
          const RENEWS_EVERY_MS = 2 * 6e4;
          const receipt = new CdvPurchase2.Receipt(platform, this.context.apiDecorators);
          const makeTransaction = (n) => {
            var _a, _b;
            const tr = new CdvPurchase2.Transaction(platform, receipt, this.context.apiDecorators);
            tr.products = [{
              id: Test.testProducts.PAID_SUBSCRIPTION_ACTIVE.id,
              offerId: Test.testProducts.PAID_SUBSCRIPTION_ACTIVE.extra.offerId
            }];
            tr.state = CdvPurchase2.TransactionState.APPROVED;
            tr.transactionId = transactionId(n);
            tr.isAcknowledged = n == 1;
            tr.renewalIntent = CdvPurchase2.RenewalIntent.RENEW;
            const firstPurchase = +(((_b = (_a = receipt === null || receipt === void 0 ? void 0 : receipt.transactions) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.purchaseDate) || /* @__PURE__ */ new Date());
            tr.purchaseDate = new Date(firstPurchase);
            tr.lastRenewalDate = new Date(firstPurchase + RENEWS_EVERY_MS * (n - 1));
            tr.expirationDate = new Date(firstPurchase + RENEWS_EVERY_MS * n);
            updateVerifiedPurchases(tr);
            return tr;
          };
          receipt.transactions.push(makeTransaction(1));
          this.receipts.push(receipt);
          this.context.listener.receiptsUpdated(CdvPurchase2.Platform.TEST, [receipt]);
          function transactionId(n) {
            return "test-active-subscription-transaction-" + n;
          }
          let transactionNumber = 1;
          setInterval(() => {
            this.log.info("auto-renewing the mock subscription");
            transactionNumber += 1;
            receipt.transactions.push(makeTransaction(transactionNumber));
            this.context.listener.receiptsUpdated(CdvPurchase2.Platform.TEST, [receipt]);
          }, RENEWS_EVERY_MS);
        }
        static verify(receipt, callback) {
          setTimeout(() => {
            var _a, _b;
            callback({
              receipt,
              payload: {
                ok: true,
                data: {
                  id: (_b = (_a = receipt.transactions[0]) === null || _a === void 0 ? void 0 : _a.products[0]) === null || _b === void 0 ? void 0 : _b.id,
                  latest_receipt: true,
                  transaction: { type: "test" },
                  collection: verifiedPurchases
                }
              }
            });
          }, 500);
        }
        checkSupport(functionality) {
          return true;
        }
        restorePurchases() {
          return __awaiter(this, void 0, void 0, function* () {
            return void 0;
          });
        }
        getStorefront() {
          return __awaiter(this, void 0, void 0, function* () {
            return "US";
          });
        }
      }
      Test.Adapter = Adapter;
      function testStoreError(code, message, productId) {
        return CdvPurchase2.storeError(code, message, CdvPurchase2.Platform.TEST, productId);
      }
    })(CdvPurchase2.Test || (CdvPurchase2.Test = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Test) {
      const platform = CdvPurchase2.Platform.TEST;
      Test.customTestProducts = {};
      Test.testProducts = {
        /**
         * A valid consumable product.
         *
         * - id: "test-consumable"
         * - type: ProductType.CONSUMABLE
         */
        CONSUMABLE: {
          platform,
          id: "test-consumable",
          type: CdvPurchase2.ProductType.CONSUMABLE
        },
        /**
         * A consumable product for which the purchase will always fail.
         *
         * - id: "test-consumable-fail"
         * - type: ProductType.CONSUMABLE
         */
        CONSUMABLE_FAILING: {
          platform,
          id: "test-consumable-fail",
          type: CdvPurchase2.ProductType.CONSUMABLE
        },
        /**
         * A valid non-consumable product.
         *
         * - id: "test-non-consumable"
         * - type: ProductType.NON_CONSUMABLE
         */
        NON_CONSUMABLE: {
          platform,
          id: "test-non-consumable",
          type: CdvPurchase2.ProductType.NON_CONSUMABLE
        },
        /**
         * A paid-subscription that auto-renews for the duration of the session.
         *
         * This subscription has a free trial period, that renews every week, 3 times.
         * It then costs $4.99 per month.
         *
         * - id: "test-subscription"
         * - type: ProductType.PAID_SUBSCRIPTION
         */
        PAID_SUBSCRIPTION: {
          platform,
          id: "test-subscription",
          type: CdvPurchase2.ProductType.PAID_SUBSCRIPTION
        },
        /**
         * A paid-subscription that is already active when the app starts.
         *
         * It behaves as if the user subscribed on a different device. It will renew forever.
         *
         * - id: "test-subscription-active"
         * - type: ProductType.PAID_SUBSCRIPTION
         */
        PAID_SUBSCRIPTION_ACTIVE: {
          platform,
          id: "test-subscription-active",
          type: CdvPurchase2.ProductType.PAID_SUBSCRIPTION,
          /** @internal */
          extra: {
            offerId: "test-paid-subscription-active-offer1"
          }
        }
      };
      Test.testProductsArray = CdvPurchase2.Utils.objectValues(Test.testProducts);
      const defaultPricingPhaseConfig = {
        [CdvPurchase2.ProductType.CONSUMABLE]: [{
          price: "$1.99",
          currency: "USD",
          priceMicros: 199e4,
          paymentMode: CdvPurchase2.PaymentMode.UP_FRONT,
          recurrenceMode: CdvPurchase2.RecurrenceMode.NON_RECURRING
        }],
        [CdvPurchase2.ProductType.NON_CONSUMABLE]: [{
          price: "$4.99",
          currency: "USD",
          priceMicros: 499e4,
          paymentMode: CdvPurchase2.PaymentMode.UP_FRONT,
          recurrenceMode: CdvPurchase2.RecurrenceMode.NON_RECURRING
        }],
        [CdvPurchase2.ProductType.PAID_SUBSCRIPTION]: [{
          price: "$9.99",
          currency: "USD",
          priceMicros: 999e4,
          paymentMode: CdvPurchase2.PaymentMode.PAY_AS_YOU_GO,
          recurrenceMode: CdvPurchase2.RecurrenceMode.INFINITE_RECURRING,
          billingPeriod: "P1M"
        }]
      };
      function registerTestProduct(config) {
        if (!config.id)
          throw new Error("Product ID is required");
        if (config.type === void 0)
          throw new Error("Product type is required");
        const metadata = {
          title: config.title || `Test ${config.type}`,
          description: config.description || `A test ${config.type} product`,
          offerId: config.offerId || `${config.id}-offer1`,
          pricing: config.pricing || defaultPricingPhaseConfig[config.type]
        };
        const productConfig = {
          platform,
          id: config.id,
          type: config.type,
          customMetadata: metadata
        };
        Test.customTestProducts[config.id] = productConfig;
        return productConfig;
      }
      Test.registerTestProduct = registerTestProduct;
      function initTestProduct(productId, decorator) {
        if (Test.customTestProducts[productId]) {
          const customConfig = Test.customTestProducts[productId];
          const product2 = new CdvPurchase2.Product({
            platform,
            id: customConfig.id,
            type: customConfig.type
          }, decorator);
          if (customConfig.customMetadata) {
            product2.title = customConfig.customMetadata.title;
            product2.description = customConfig.customMetadata.description;
            const offerId = customConfig.customMetadata.offerId;
            let pricingPhases = [];
            if (Array.isArray(customConfig.customMetadata.pricing)) {
              pricingPhases = customConfig.customMetadata.pricing;
            } else if (customConfig.customMetadata.pricing) {
              const pricing = customConfig.customMetadata.pricing;
              pricingPhases = [{
                price: pricing.price,
                currency: pricing.currency,
                priceMicros: pricing.priceMicros,
                paymentMode: customConfig.type === CdvPurchase2.ProductType.PAID_SUBSCRIPTION ? CdvPurchase2.PaymentMode.PAY_AS_YOU_GO : CdvPurchase2.PaymentMode.UP_FRONT,
                recurrenceMode: customConfig.type === CdvPurchase2.ProductType.PAID_SUBSCRIPTION ? CdvPurchase2.RecurrenceMode.INFINITE_RECURRING : CdvPurchase2.RecurrenceMode.NON_RECURRING,
                billingPeriod: customConfig.type === CdvPurchase2.ProductType.PAID_SUBSCRIPTION ? "P1M" : void 0
              }];
            }
            product2.addOffer(new CdvPurchase2.Offer({
              id: offerId,
              product: product2,
              pricingPhases
            }, decorator));
          }
          return product2;
        }
        const key = Object.keys(Test.testProducts).find((key2) => Test.testProducts[key2] && Test.testProducts[key2].id === productId);
        if (!key)
          return;
        const product = new CdvPurchase2.Product(Test.testProducts[key], decorator);
        switch (key) {
          case "CONSUMABLE":
            product.title = "Test Consumable";
            product.description = "A consumable product that you can purchase";
            product.addOffer(new CdvPurchase2.Offer({
              id: "test-consumable-offer1",
              pricingPhases: [{
                price: "$4.99",
                currency: "USD",
                priceMicros: 499e4,
                paymentMode: CdvPurchase2.PaymentMode.UP_FRONT,
                recurrenceMode: CdvPurchase2.RecurrenceMode.NON_RECURRING
              }],
              product
            }, decorator));
            break;
          case "CONSUMABLE_FAILING":
            product.title = "Failing Consumable";
            product.description = "A consumable product that cannot be purchased";
            product.addOffer(new CdvPurchase2.Offer({
              id: "test-consumable-fail-offer1",
              pricingPhases: [{
                price: "$1.99",
                currency: "USD",
                priceMicros: 199e4,
                paymentMode: CdvPurchase2.PaymentMode.UP_FRONT,
                recurrenceMode: CdvPurchase2.RecurrenceMode.NON_RECURRING
              }],
              product
            }, decorator));
            break;
          case "NON_CONSUMABLE":
            product.title = "Non Consumable";
            product.description = "A non consumable product";
            product.addOffer(new CdvPurchase2.Offer({
              id: "test-non-consumable-offer1",
              pricingPhases: [{
                price: "$9.99",
                currency: "USD",
                priceMicros: 999e4,
                paymentMode: CdvPurchase2.PaymentMode.UP_FRONT,
                recurrenceMode: CdvPurchase2.RecurrenceMode.NON_RECURRING
              }],
              product
            }, decorator));
            break;
          case "PAID_SUBSCRIPTION":
            product.title = "A subscription product";
            product.description = "An auto-renewing paid subscription with a trial period";
            product.addOffer(new CdvPurchase2.Offer({
              id: "test-paid-subscription-offer1",
              product,
              pricingPhases: [{
                price: "$0.00",
                currency: "USD",
                priceMicros: 0,
                paymentMode: CdvPurchase2.PaymentMode.FREE_TRIAL,
                recurrenceMode: CdvPurchase2.RecurrenceMode.FINITE_RECURRING,
                billingCycles: 3,
                billingPeriod: "P1W"
              }, {
                price: "$4.99",
                currency: "USD",
                priceMicros: 499e4,
                paymentMode: CdvPurchase2.PaymentMode.PAY_AS_YOU_GO,
                recurrenceMode: CdvPurchase2.RecurrenceMode.INFINITE_RECURRING,
                billingPeriod: "P1M"
              }]
            }, decorator));
            break;
          case "PAID_SUBSCRIPTION_ACTIVE":
            product.title = "An owned subscription product";
            product.description = "An active paid subscription";
            product.addOffer(new CdvPurchase2.Offer({
              id: Test.testProducts.PAID_SUBSCRIPTION_ACTIVE.extra.offerId,
              product,
              pricingPhases: [{
                price: "$19.99",
                currency: "USD",
                priceMicros: 1999e4,
                paymentMode: CdvPurchase2.PaymentMode.PAY_AS_YOU_GO,
                recurrenceMode: CdvPurchase2.RecurrenceMode.INFINITE_RECURRING,
                billingPeriod: "P1Y"
              }]
            }, decorator));
            break;
          default:
            const unhandledSwitchCase = key;
            throw new Error(`Unhandled enum case: ${unhandledSwitchCase}`);
        }
        return product;
      }
      Test.initTestProduct = initTestProduct;
    })(CdvPurchase2.Test || (CdvPurchase2.Test = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(WindowsStore) {
      class Adapter {
        constructor() {
          this.id = CdvPurchase2.Platform.WINDOWS_STORE;
          this.name = "WindowsStore";
          this.ready = false;
          this.supportsParallelLoading = false;
          this.products = [];
          this.receipts = [];
        }
        initialize() {
          return __awaiter(this, void 0, void 0, function* () {
            return;
          });
        }
        get isSupported() {
          return false;
        }
        loadProducts(products) {
          return __awaiter(this, void 0, void 0, function* () {
            return products.map((p) => windowsStoreError(CdvPurchase2.ErrorCode.PRODUCT_NOT_AVAILABLE, "TODO", p.id));
          });
        }
        loadReceipts() {
          return __awaiter(this, void 0, void 0, function* () {
            return [];
          });
        }
        order(offer) {
          return __awaiter(this, void 0, void 0, function* () {
            return windowsStoreError(CdvPurchase2.ErrorCode.UNKNOWN, "TODO: Not implemented", offer.productId);
          });
        }
        finish(transaction2) {
          return __awaiter(this, void 0, void 0, function* () {
            return windowsStoreError(CdvPurchase2.ErrorCode.UNKNOWN, "TODO: Not implemented", null);
          });
        }
        handleReceiptValidationResponse(receipt, response) {
          return __awaiter(this, void 0, void 0, function* () {
            return;
          });
        }
        receiptValidationBody(receipt) {
          return __awaiter(this, void 0, void 0, function* () {
            return;
          });
        }
        requestPayment(payment, additionalData) {
          return __awaiter(this, void 0, void 0, function* () {
            return windowsStoreError(CdvPurchase2.ErrorCode.UNKNOWN, "requestPayment not supported", null);
          });
        }
        manageSubscriptions() {
          return __awaiter(this, void 0, void 0, function* () {
            return windowsStoreError(CdvPurchase2.ErrorCode.UNKNOWN, "manageSubscriptions not supported", null);
          });
        }
        manageBilling() {
          return __awaiter(this, void 0, void 0, function* () {
            return windowsStoreError(CdvPurchase2.ErrorCode.UNKNOWN, "manageBilling not supported", null);
          });
        }
        checkSupport(functionality) {
          return false;
        }
        restorePurchases() {
          return __awaiter(this, void 0, void 0, function* () {
            return void 0;
          });
        }
      }
      WindowsStore.Adapter = Adapter;
      function windowsStoreError(code, message, productId) {
        return CdvPurchase2.storeError(code, message, CdvPurchase2.Platform.WINDOWS_STORE, productId);
      }
    })(CdvPurchase2.WindowsStore || (CdvPurchase2.WindowsStore = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      let Ajax;
      (function(Ajax2) {
        Ajax2.HTTP_REQUEST_TIMEOUT = 408;
      })(Ajax = Utils.Ajax || (Utils.Ajax = {}));
      function ajax(log, options) {
        if (typeof window !== "undefined" && window.cordova && window.cordova.plugin && window.cordova.plugin.http) {
          return ajaxWithHttpPlugin(log, options);
        }
        var doneCb = function() {
        };
        var xhr = new XMLHttpRequest();
        if (options.timeout) {
          xhr.timeout = options.timeout;
          xhr.ontimeout = function() {
            log.warn("ajax -> request to " + options.url + " timeout");
            Utils.callExternal(log, "ajax.error", options.error, Ajax.HTTP_REQUEST_TIMEOUT, "Timeout");
          };
        }
        xhr.open(options.method || "POST", options.url, true);
        xhr.onreadystatechange = function() {
          try {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                Utils.callExternal(log, "ajax.success", options.success, JSON.parse(xhr.responseText));
              } else {
                log.warn("ajax -> request to " + options.url + " failed with status " + xhr.status + " (" + xhr.statusText + ")");
                Utils.callExternal(log, "ajax.error", options.error, xhr.status, xhr.statusText);
              }
            }
          } catch (e) {
            log.warn("ajax -> request to " + options.url + " failed with an exception: " + e.message);
            if (options.error)
              options.error(417, e.message, null);
          }
          if (xhr.readyState === 4)
            Utils.callExternal(log, "ajax.done", doneCb);
        };
        const customHeaders = options.customHeaders;
        if (customHeaders) {
          Object.keys(customHeaders).forEach(function(header) {
            log.debug("ajax -> adding custom header: " + header);
            xhr.setRequestHeader(header, customHeaders[header]);
          });
        }
        xhr.setRequestHeader("Accept", "application/json");
        log.debug("ajax -> send request to " + options.url);
        if (options.data) {
          xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
          xhr.send(JSON.stringify(options.data));
        } else {
          xhr.send();
        }
        return {
          done: function(cb) {
            doneCb = cb;
            return this;
          }
        };
      }
      Utils.ajax = ajax;
      function ajaxWithHttpPlugin(log, options) {
        let doneCb = function() {
        };
        const ajaxOptions = {
          method: (options.method || "get").toLowerCase(),
          data: options.data,
          serializer: "json"
          // responseType: 'json',
        };
        if (options.customHeaders) {
          log.debug("ajax[http] -> adding custom headers: " + JSON.stringify(options.customHeaders));
          ajaxOptions.headers = options.customHeaders;
        }
        log.debug("ajax[http] -> send request to " + options.url);
        const ajaxDone = (response) => {
          try {
            if (response.status == 200) {
              Utils.callExternal(log, "ajax.success", options.success, JSON.parse(response.data));
            } else {
              log.warn("ajax[http] -> request to " + options.url + " failed with status " + response.status + " (" + response.error + ")");
              Utils.callExternal(log, "ajax.error", options.error, response.status, response.error);
            }
          } catch (e) {
            log.warn("ajax[http] -> request to " + options.url + " failed with an exception: " + e.message);
            if (options.error)
              Utils.callExternal(log, "ajax.error", options.error, 417, e.message);
          }
          Utils.callExternal(log, "ajax.done", doneCb);
        };
        window.cordova.plugin.http.sendRequest(options.url, ajaxOptions, ajaxDone, ajaxDone);
        return {
          done: function(cb) {
            doneCb = cb;
            return this;
          }
        };
      }
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      function callExternal(log, name, callback, ...args) {
        try {
          const args2 = Array.prototype.slice.call(arguments, 3);
          if (callback)
            callback.apply(CdvPurchase2.store, args2);
        } catch (e) {
          log.logCallbackException(name, e);
        }
      }
      Utils.callExternal = callExternal;
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      function delay(fn, milliseconds) {
        return setTimeout(fn, milliseconds);
      }
      Utils.delay = delay;
      function debounce(fn, milliseconds) {
        return createDebouncer(fn, milliseconds).call;
      }
      Utils.debounce = debounce;
      function createDebouncer(fn, milliseconds) {
        let timeout = null;
        let waiting = [];
        const later = function(context, args) {
          const toCall = waiting;
          waiting = [];
          timeout = null;
          fn();
          toCall.forEach((fn2) => fn2());
        };
        const debounced = function() {
          if (timeout)
            window.clearTimeout(timeout);
          timeout = setTimeout(later, milliseconds);
        };
        return {
          call: debounced,
          wait: () => new Promise((resolve2) => {
            if (timeout)
              waiting.push(resolve2);
            else
              resolve2();
          })
        };
      }
      Utils.createDebouncer = createDebouncer;
      function asyncDelay(milliseconds) {
        return new Promise((resolve2) => setTimeout(resolve2, milliseconds));
      }
      Utils.asyncDelay = asyncDelay;
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      function formatBillingCycleEN(pricingPhase) {
        switch (fixedRecurrenceMode(pricingPhase)) {
          case CdvPurchase2.RecurrenceMode.FINITE_RECURRING:
            return `${pricingPhase.billingCycles}x ${Utils.formatDurationEN(pricingPhase.billingPeriod)}`;
          case CdvPurchase2.RecurrenceMode.NON_RECURRING:
            return "for " + Utils.formatDurationEN(pricingPhase.billingPeriod);
          default:
            return "every " + Utils.formatDurationEN(pricingPhase.billingPeriod, { omitOne: true });
        }
      }
      Utils.formatBillingCycleEN = formatBillingCycleEN;
      function fixedRecurrenceMode(pricingPhase) {
        var _a;
        const cycles = (_a = pricingPhase.billingCycles) !== null && _a !== void 0 ? _a : 0;
        if (pricingPhase.recurrenceMode === CdvPurchase2.RecurrenceMode.FINITE_RECURRING) {
          if (cycles == 1)
            return CdvPurchase2.RecurrenceMode.NON_RECURRING;
          if (cycles <= 0)
            return CdvPurchase2.RecurrenceMode.INFINITE_RECURRING;
        }
        return pricingPhase.recurrenceMode;
      }
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      function formatDurationEN(iso, options) {
        if (!iso)
          return "";
        const l = iso.length;
        const n = iso.slice(1, l - 1);
        if (n === "1") {
          if (options === null || options === void 0 ? void 0 : options.omitOne) {
            return { "D": "day", "W": "week", "M": "month", "Y": "year" }[iso[l - 1]] || iso[l - 1];
          } else {
            return { "D": "1 day", "W": "1 week", "M": "1 month", "Y": "1 year" }[iso[l - 1]] || iso[l - 1];
          }
        } else {
          const u2 = { "D": "days", "W": "weeks", "M": "months", "Y": "years" }[iso[l - 1]] || iso[l - 1];
          return `${n} ${u2}`;
        }
      }
      Utils.formatDurationEN = formatDurationEN;
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      function platformId() {
        var _a, _b, _c;
        if ((_a = window.cordova) === null || _a === void 0 ? void 0 : _a.platformId)
          return (_b = window.cordova) === null || _b === void 0 ? void 0 : _b.platformId;
        if ((_c = window.Capacitor) === null || _c === void 0 ? void 0 : _c.getPlatform)
          return window.Capacitor.getPlatform();
        return "web";
      }
      Utils.platformId = platformId;
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      function safeCallback(logger, className, callback, callbackName, reason) {
        return function(value) {
          safeCall(logger, className, callback, value, callbackName, reason);
        };
      }
      Utils.safeCallback = safeCallback;
      function safeCall(logger, className, callback, value, callbackName, reason) {
        if (!callback) {
          return;
        }
        if (!callbackName) {
          callbackName = callback.name || "#" + Utils.md5(callback.toString());
        }
        setTimeout(() => {
          try {
            logger.debug(`Calling callback: type=${className} name=${callbackName} reason=${reason}`);
            callback(value);
          } catch (error) {
            logger.error(`Error in callback: type=${className} name=${callbackName} reason=${reason}`);
            logger.debug(callback.toString());
            const errorAsError = error;
            if ("message" in errorAsError)
              logger.error(errorAsError.message);
            if ("fileName" in error)
              logger.error("in " + error.fileName + ":" + error.lineNumber);
            if ("stack" in errorAsError)
              logger.error(errorAsError.stack);
          }
        }, 0);
      }
      Utils.safeCall = safeCall;
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Utils) {
      function getCryptoExtension() {
        return window.crypto || window.msCrypto;
      }
      function uuidv4() {
        return ("10000000-1000-4000-8000" + -1e11).replace(/[018]/g, function(c) {
          return (c ^ getCryptoExtension().getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
        });
      }
      Utils.uuidv4 = uuidv4;
    })(CdvPurchase2.Utils || (CdvPurchase2.Utils = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Validator) {
      (function(Internal) {
        function isArray(arg) {
          return Object.prototype.toString.call(arg) === "[object Array]";
        }
        function isObject2(arg) {
          return Object.prototype.toString.call(arg) === "[object Object]";
        }
        function getPrivacyPolicy(store2) {
          if (typeof store2.validator_privacy_policy === "string")
            return store2.validator_privacy_policy.split(",");
          else if (isArray(store2.validator_privacy_policy))
            return store2.validator_privacy_policy;
          else
            return ["analytics", "support", "fraud"];
        }
        function getCapacitorDevice(includeId) {
          var _a, _b, _c;
          return __awaiter(this, void 0, void 0, function* () {
            const capacitorDevice = (_b = (_a = window.Capacitor) === null || _a === void 0 ? void 0 : _a.Plugins) === null || _b === void 0 ? void 0 : _b.Device;
            if (!capacitorDevice)
              return {};
            const device = {};
            try {
              const info = yield capacitorDevice.getInfo();
              if (isObject2(info)) {
                device.model = info.model;
                device.platform = info.operatingSystem === "ios" ? "iOS" : info.operatingSystem === "android" ? "Android" : info.operatingSystem;
                device.version = info.osVersion;
                device.manufacturer = info.manufacturer;
                device.isVirtual = info.isVirtual;
              }
            } catch (e) {
            }
            if (includeId) {
              try {
                const id = yield capacitorDevice.getId();
                device.uuid = (_c = id === null || id === void 0 ? void 0 : id.identifier) !== null && _c !== void 0 ? _c : id === null || id === void 0 ? void 0 : id.uuid;
              } catch (e) {
              }
            }
            return device;
          });
        }
        function getDeviceInfo(store2) {
          return __awaiter(this, void 0, void 0, function* () {
            const privacyPolicy = getPrivacyPolicy(store2);
            function allowed(policy) {
              return privacyPolicy.indexOf(policy) >= 0;
            }
            const ret = {
              plugin: "cordova-plugin-purchase/" + CdvPurchase2.PLUGIN_VERSION
            };
            const wdw = window;
            const device = isObject2(wdw.device) ? wdw.device : yield getCapacitorDevice(allowed("tracking") || allowed("fraud"));
            if (allowed("analytics") || allowed("support")) {
              const ionic = wdw.Ionic || wdw.ionic;
              if (ionic && ionic.version)
                ret.ionic = ionic.version;
              if (device.cordova)
                ret.cordova = device.cordova;
              if (device.model)
                ret.model = device.model;
              if (device.platform)
                ret.platform = device.platform;
              if (device.version)
                ret.version = device.version;
              if (device.manufacturer)
                ret.manufacturer = device.manufacturer;
            }
            if (allowed("tracking")) {
              if (device.serial)
                ret.serial = device.serial;
              if (device.uuid)
                ret.uuid = device.uuid;
            }
            if (device.isVirtual)
              ret.isVirtual = device.isVirtual;
            if (allowed("fraud")) {
              var fingerprint = "";
              if (device.serial)
                fingerprint = "serial:" + device.serial;
              else if (device.uuid)
                fingerprint = "uuid:" + device.uuid;
              else {
                if (device.model)
                  fingerprint += "/" + device.model;
                if (device.manufacturer)
                  fingerprint += "/" + device.manufacturer;
              }
              if (fingerprint)
                ret.fingerprint = CdvPurchase2.Utils.md5(fingerprint);
            }
            return ret;
          });
        }
        Internal.getDeviceInfo = getDeviceInfo;
      })(Validator.Internal || (Validator.Internal = {}));
    })(CdvPurchase2.Validator || (CdvPurchase2.Validator = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    (function(Validator) {
      /* @__PURE__ */ (function(Request) {
      })(Validator.Request || (Validator.Request = {}));
    })(CdvPurchase2.Validator || (CdvPurchase2.Validator = {}));
  })(CdvPurchase || (CdvPurchase = {}));
  var CdvPurchase;
  (function(CdvPurchase2) {
    class VerifiedReceipt {
      /**
       * @internal
       */
      constructor(receipt, response, decorator) {
        var _a;
        this.className = "VerifiedReceipt";
        this.id = response.id;
        this.sourceReceipt = receipt;
        this.collection = (_a = response.collection) !== null && _a !== void 0 ? _a : [];
        this.latestReceipt = response.latest_receipt;
        this.nativeTransactions = [response.transaction];
        this.warning = response.warning;
        this.validationDate = response.date ? new Date(response.date) : /* @__PURE__ */ new Date();
        Object.defineProperty(this, "raw", { "enumerable": false, get() {
          return response;
        } });
        Object.defineProperty(this, "finish", { "enumerable": false, get() {
          return () => decorator.finish(this);
        } });
      }
      /** Platform this receipt originated from */
      get platform() {
        return this.sourceReceipt.platform;
      }
      /** Get raw response data from the receipt validation request */
      get raw() {
        return {};
      }
      // actual implementation as "defineProperty" in constructor.
      /**
       * Update the receipt content
       *
       * @internal
       */
      set(receipt, response) {
        var _a;
        this.id = response.id;
        this.sourceReceipt = receipt;
        this.collection = (_a = response.collection) !== null && _a !== void 0 ? _a : [];
        this.latestReceipt = response.latest_receipt;
        this.nativeTransactions = [response.transaction];
        this.warning = response.warning;
      }
      /** Finish all transactions in the receipt */
      finish() {
        return __awaiter(this, void 0, void 0, function* () {
        });
      }
    }
    CdvPurchase2.VerifiedReceipt = VerifiedReceipt;
  })(CdvPurchase || (CdvPurchase = {}));
  var store = CdvPurchase.store;
  var Store = CdvPurchase.Store;
  var ProductType = CdvPurchase.ProductType;
  var Platform = CdvPurchase.Platform;
  var LogLevel = CdvPurchase.LogLevel;
  var ErrorCode = CdvPurchase.ErrorCode;
  var Logger = CdvPurchase.Logger;
  var Iaptic = CdvPurchase.Iaptic;

  // src/services/native-ports.mjs
  function createNativePorts() {
    const native = Capacitor.getPlatform() === "ios";
    return {
      native,
      ads: {
        requestConsentInfo: () => AdMob.requestConsentInfo(),
        showConsentForm: () => AdMob.showConsentForm(),
        initialize: (config) => AdMob.initialize(config),
        showBanner: (config) => AdMob.showBanner(config),
        hideBanner: () => AdMob.hideBanner(),
        prepareInterstitial: (config) => AdMob.prepareInterstitial(config),
        showInterstitial: () => AdMob.showInterstitial(),
        showPrivacyOptionsForm: () => AdMob.showPrivacyOptionsForm(),
        async requestTrackingIfNeeded() {
          try {
            const res = await AdMob.trackingAuthorizationStatus();
            if (res.status === "notDetermined") await AdMob.requestTrackingAuthorization();
          } catch (err) {
            console.warn("[Starter] ATT unavailable; proceed without IDFA permission", err);
          }
        }
      },
      purchase: {
        async initialize(id, onOwned, onPrice = () => {
        }) {
          store.register([{ id, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE }]);
          store.when().productUpdated((product) => {
            if (product.id === id && product.pricing?.price) onPrice(product.pricing.price);
          });
          store.when().approved(async (transaction2) => {
            if (!transaction2.products?.some((product) => product.id === id)) return;
            await onOwned();
            try {
              await transaction2.finish();
            } catch (err) {
              console.error("[Starter] Failed to finish StoreKit transaction", err);
            }
          });
          let confirmReady;
          const receiptsReady = new Promise((resolve2) => {
            confirmReady = resolve2;
          });
          store.when().receiptsReady(() => {
            if (store.owned(id)) void onOwned();
            confirmReady();
          });
          store.when().receiptUpdated(() => {
            if (store.owned(id)) void onOwned();
          });
          store.error((error) => console.error("[Starter] StoreKit error", error));
          const errors = await store.initialize([Platform.APPLE_APPSTORE]);
          if (errors?.length) throw new Error(errors.map((e) => e.message || String(e)).join("; "));
          let timeout;
          try {
            await Promise.race([receiptsReady, new Promise((_, reject) => {
              timeout = setTimeout(() => reject(new Error("StoreKit receipt readiness timed out")), 15e3);
            })]);
          } finally {
            clearTimeout(timeout);
          }
        },
        owned: (id) => Boolean(store.owned(id)),
        displayPrice: (id) => store.get(id, Platform.APPLE_APPSTORE)?.pricing?.price ?? null,
        async order(id) {
          const offer = store.get(id, Platform.APPLE_APPSTORE)?.getOffer?.();
          if (!offer) throw new Error("App Store Connect\u306E\u5546\u54C1\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093");
          const error = await store.order(offer);
          if (error) throw new Error(error.message || String(error));
        },
        async restore() {
          const error = await store.restorePurchases();
          if (error) throw new Error(error.message || String(error));
        }
      }
    };
  }

  // src/lib/storage.mjs
  function createJsonStore({ store: store2, key, createInitial, validate }) {
    if (!store2 || typeof store2.getItem !== "function" || typeof store2.setItem !== "function") throw new TypeError("Storage API required");
    if (!key || typeof key !== "string") throw new TypeError("Unique storage key required");
    if (typeof createInitial !== "function" || typeof validate !== "function") throw new TypeError("Store schema and initializer required");
    const parse = (raw) => {
      let value;
      try {
        value = JSON.parse(raw);
      } catch {
        throw new Error("Saved data is not valid JSON: " + key);
      }
      validate(value);
      return value;
    };
    return {
      read() {
        const raw = store2.getItem(key);
        return raw === null ? createInitial() : parse(raw);
      },
      write(value) {
        validate(value);
        const serialized = JSON.stringify(value);
        store2.setItem(key, serialized);
        return value;
      },
      importJson(raw) {
        const value = parse(raw);
        this.write(value);
        return value;
      },
      exportJson() {
        return JSON.stringify(this.read(), null, 2);
      },
      clear() {
        store2.removeItem(key);
      }
    };
  }

  // src/lib/ad-policy.mjs
  function isAdBreakAllowed({ events, lastShown, now, minCompletedActions, cooldownMs }) {
    if (![events, lastShown, now, minCompletedActions, cooldownMs].every(Number.isFinite)) throw new Error("Ad frequency values must be numeric");
    if (![events, minCompletedActions, cooldownMs].every(Number.isSafeInteger) || events < 0 || minCompletedActions < 1 || cooldownMs < 0) throw new Error("Invalid ad frequency settings");
    if (lastShown < 0 || now < lastShown) return false;
    return events >= minCompletedActions && now - lastShown >= cooldownMs;
  }
  function createFrequencyTracker({ store: store2, key, now, minCompletedActions, cooldownMs }) {
    if (typeof now !== "function") throw new Error("Clock required");
    const initial = () => ({ version: 1, events: 0, lastShown: now() });
    function validate(v) {
      if (!v || v.version !== 1 || !Number.isSafeInteger(v.events) || v.events < 0 || v.events > 1e8 || !Number.isFinite(v.lastShown) || v.lastShown < 0) throw new Error("Invalid ad frequency state");
    }
    const model = createTrackerStore(store2, key, initial, validate);
    return {
      recordCommittedAction() {
        const v = model.read();
        const next = { ...v, events: Math.min(1e8, v.events + 1) };
        model.write(next);
        return next;
      },
      eligible() {
        const v = model.read();
        return isAdBreakAllowed({ ...v, now: now(), minCompletedActions, cooldownMs });
      },
      markShown() {
        model.write({ version: 1, events: 0, lastShown: now() });
      },
      inspect: () => model.read()
    };
  }
  function createTrackerStore(store2, key, createInitial, validate) {
    return createJsonStore({ store: store2, key, createInitial, validate });
  }

  // src/services/monetization.mjs
  function createMonetization({ config, localStorage: localStorage2, ports: ports2, now = Date.now, onStatus = () => {
  } }) {
    const native = Boolean(ports2.native);
    const ads = config.ads;
    const purchase = config.purchase;
    const tracker = createFrequencyTracker({
      store: localStorage2,
      key: config.storageNamespace + ".adFrequency.v1",
      now,
      minCompletedActions: ads.minCompletedActions,
      cooldownMs: ads.cooldownMs
    });
    let owned = false, adsReady = false, prepared = false, presenting = false, purchaseReady = false, started = false, privacyOptionsRequired = false;
    const report = (category, value) => onStatus(category, value);
    const hideAds = async () => {
      prepared = false;
      if (native) await ports2.ads.hideBanner();
      report("ads", "\u975E\u8868\u793A");
    };
    const unlock = async () => {
      if (owned) return;
      owned = true;
      await hideAds();
      report("purchase", "\u8CFC\u5165\u6E08\u307F\uFF08StoreKit\u78BA\u8A8D\u6E08\u307F\uFF09");
    };
    async function initPurchase() {
      if (!native || !purchase.enabled) {
        report("purchase", "\u672A\u8A2D\u5B9A");
        return;
      }
      report("purchase", "App Store\u3092\u78BA\u8A8D\u4E2D");
      try {
        await ports2.purchase.initialize(purchase.removeAdsProductId, async () => {
          await unlock();
        }, (price) => report("purchasePrice", price));
        purchaseReady = true;
        const displayPrice = ports2.purchase.displayPrice?.(purchase.removeAdsProductId);
        if (displayPrice) report("purchasePrice", displayPrice);
        if (ports2.purchase.owned(purchase.removeAdsProductId)) await unlock();
        else report("purchase", "\u8CFC\u5165\u53EF\u80FD");
      } catch (err) {
        report("purchase", "\u521D\u671F\u5316\u30A8\u30E9\u30FC: " + err.message);
        throw err;
      }
    }
    async function prepare() {
      if (!adsReady || owned || prepared) return;
      await ports2.ads.prepareInterstitial({ adId: ads.interstitialId, isTesting: ads.mode === "test" });
      prepared = true;
    }
    async function initAds() {
      if (!native || ads.mode === "disabled" || owned) {
        report("ads", owned ? "\u8CFC\u5165\u6E08\u307F\u30FB\u5E83\u544A\u306A\u3057" : native ? "\u5E83\u544A\u6A5F\u80FD\u30AA\u30D5" : "\u30D6\u30E9\u30A6\u30B6\u30D7\u30EC\u30D3\u30E5\u30FC\u30FB\u5E83\u544A\u306A\u3057");
        return;
      }
      report("ads", "\u540C\u610F\u72B6\u614B\u3092\u78BA\u8A8D\u4E2D");
      let consent = await ports2.ads.requestConsentInfo();
      if (consent.status === "REQUIRED" && consent.isConsentFormAvailable) consent = await ports2.ads.showConsentForm();
      privacyOptionsRequired = consent.privacyOptionsRequirementStatus === "REQUIRED";
      report("privacyOptions", privacyOptionsRequired);
      if (!consent.canRequestAds) {
        report("ads", "\u5E83\u544A\u30EA\u30AF\u30A8\u30B9\u30C8\u4E0D\u53EF\u30FB\u540C\u610F\u8A2D\u5B9A\u3092\u78BA\u8A8D");
        return;
      }
      if (ports2.ads.requestTrackingIfNeeded) await ports2.ads.requestTrackingIfNeeded();
      await ports2.ads.initialize({ initializeForTesting: ads.mode === "test" });
      adsReady = true;
      try {
        await prepare();
      } catch (e) {
        report("ads", "\u5168\u753B\u9762\u5E83\u544A\u6E96\u5099\u5931\u6557: " + e.message);
      }
      if (owned) return hideAds();
      try {
        await ports2.ads.showBanner({ adId: ads.bannerId, adSize: "BANNER", position: "BOTTOM_CENTER", margin: 0, isTesting: ads.mode === "test" });
        if (owned) return hideAds();
        report("ads", "\u30D0\u30CA\u30FC\u8868\u793A\u4E2D");
      } catch (err) {
        report("ads", "\u30D0\u30CA\u30FC\u8868\u793A\u5931\u6557: " + err.message);
      }
    }
    return {
      async initialize() {
        if (started) throw new Error("Monetization initialized more than once");
        started = true;
        if (!native) {
          report("ads", "\u30D6\u30E9\u30A6\u30B6\u30D7\u30EC\u30D3\u30E5\u30FC\u30FB\u5E83\u544A\u306A\u3057");
          report("purchase", "iOS\u5C02\u7528");
          return;
        }
        try {
          await initPurchase();
        } catch (err) {
          report("purchase", "\u8CFC\u5165\u72B6\u614B\u672A\u78BA\u5B9A: " + err.message);
          report("ads", "\u8CFC\u5165\u5C65\u6B74\u306E\u78BA\u8A8D\u304C\u3067\u304D\u306A\u3044\u305F\u3081\u5E83\u544A\u3092\u505C\u6B62");
          throw err;
        }
        try {
          await initAds();
        } catch (err) {
          report("ads", "\u5E83\u544A\u521D\u671F\u5316\u5931\u6557: " + err.message);
          throw err;
        }
      },
      async recordCommittedAction() {
        if (!native || !adsReady || owned || presenting) return false;
        tracker.recordCommittedAction();
        if (!tracker.eligible()) return false;
        if (!prepared) {
          try {
            await prepare();
          } catch (err) {
            report("ads", "\u5168\u753B\u9762\u5E83\u544A\u6E96\u5099\u5931\u6557: " + err.message);
          }
          return false;
        }
        presenting = true;
        try {
          if (owned) return false;
          await ports2.ads.showInterstitial();
          tracker.markShown();
          report("ads", "\u5168\u753B\u9762\u5E83\u544A\u3092\u8868\u793A");
          return true;
        } catch (err) {
          report("ads", "\u5168\u753B\u9762\u5E83\u544A\u8868\u793A\u5931\u6557: " + err.message);
          return false;
        } finally {
          prepared = false;
          presenting = false;
          if (!owned) {
            try {
              await prepare();
            } catch (err) {
              report("ads", "\u5168\u753B\u9762\u5E83\u544A\u518D\u6E96\u5099\u5931\u6557: " + err.message);
            }
          }
        }
      },
      async privacyOptions() {
        if (!native || ads.mode === "disabled") throw new Error("\u5E83\u544A\u306E\u540C\u610F\u8A2D\u5B9A\u306F\u3053\u306E\u74B0\u5883\u3067\u306F\u5229\u7528\u3067\u304D\u307E\u305B\u3093");
        if (!privacyOptionsRequired) return false;
        await ports2.ads.showPrivacyOptionsForm();
        return true;
      },
      async buyRemoveAds() {
        if (!purchase.enabled) throw new Error("\u30A2\u30D7\u30EA\u5185\u8AB2\u91D1\u306F\u672A\u8A2D\u5B9A\u3067\u3059");
        if (!native) throw new Error("\u8CFC\u5165\u306FiPhone\u30A2\u30D7\u30EA\u3067\u306E\u307F\u5229\u7528\u3067\u304D\u307E\u3059");
        if (owned) return;
        if (!purchaseReady) throw new Error("App Store\u8CFC\u5165\u6A5F\u80FD\u306F\u307E\u3060\u5229\u7528\u3067\u304D\u307E\u305B\u3093");
        await ports2.purchase.order(purchase.removeAdsProductId);
      },
      async restore() {
        if (!purchase.enabled) throw new Error("\u30A2\u30D7\u30EA\u5185\u8AB2\u91D1\u306F\u672A\u8A2D\u5B9A\u3067\u3059");
        if (!native || !purchaseReady) throw new Error("\u8CFC\u5165\u306E\u5FA9\u5143\u306FiPhone\u30A2\u30D7\u30EA\u3067\u306E\u307F\u5229\u7528\u3067\u304D\u307E\u3059");
        await ports2.purchase.restore();
        if (ports2.purchase.owned(purchase.removeAdsProductId)) await unlock();
      },
      status: () => ({ native, owned, adsReady, purchaseReady, frequency: tracker.inspect() })
    };
  }

  // src/a16/features/backgrounds/catalog.json
  var catalog_default = {
    schemaVersion: 1,
    default: "BG-D01",
    status: "review-only",
    items: [
      {
        id: "BG-D01",
        period: "day",
        src: "assets/backgrounds/BG-D01.jpg",
        tone: "dark",
        status: "review-only",
        width: 830,
        height: 1798
      },
      {
        id: "BG-D02",
        period: "day",
        src: "assets/backgrounds/BG-D02.jpg",
        tone: "dark",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-D03",
        period: "day",
        src: "assets/backgrounds/BG-D03.jpg",
        tone: "white",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-D04",
        period: "day",
        src: "assets/backgrounds/BG-D04.jpg",
        tone: "dark",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-D05",
        period: "day",
        src: "assets/backgrounds/BG-D05.jpg",
        tone: "dark",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-D06",
        period: "day",
        src: "assets/backgrounds/BG-D06.jpg",
        tone: "dark",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-D07",
        period: "day",
        src: "assets/backgrounds/BG-D07.jpg",
        tone: "dark",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-D08",
        period: "day",
        src: "assets/backgrounds/BG-D08.jpg",
        tone: "dark",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-E01",
        period: "evening",
        src: "assets/backgrounds/BG-E01.jpg",
        tone: "dark",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-E02",
        period: "evening",
        src: "assets/backgrounds/BG-E02.jpg",
        tone: "dark",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-E03",
        period: "evening",
        src: "assets/backgrounds/BG-E03.jpg",
        tone: "dark",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-E04",
        period: "evening",
        src: "assets/backgrounds/BG-E04.jpg",
        tone: "dark",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-E05",
        period: "evening",
        src: "assets/backgrounds/BG-E05.jpg",
        tone: "dark",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-E06",
        period: "evening",
        src: "assets/backgrounds/BG-E06.jpg",
        tone: "white",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-E07",
        period: "evening",
        src: "assets/backgrounds/BG-E07.jpg",
        tone: "dark",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-E08",
        period: "evening",
        src: "assets/backgrounds/BG-E08.jpg",
        tone: "dark",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-M01",
        period: "morning",
        src: "assets/backgrounds/BG-M01.jpg",
        tone: "dark",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-M02",
        period: "morning",
        src: "assets/backgrounds/BG-M02.jpg",
        tone: "dark",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-M03",
        period: "morning",
        src: "assets/backgrounds/BG-M03.jpg",
        tone: "white",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-M04",
        period: "morning",
        src: "assets/backgrounds/BG-M04.jpg",
        tone: "white",
        status: "review-only",
        width: 841,
        height: 1822
      },
      {
        id: "BG-M05",
        period: "morning",
        src: "assets/backgrounds/BG-M05.jpg",
        tone: "dark",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-M06",
        period: "morning",
        src: "assets/backgrounds/BG-M06.jpg",
        tone: "white",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-M07",
        period: "morning",
        src: "assets/backgrounds/BG-M07.jpg",
        tone: "dark",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-M08",
        period: "morning",
        src: "assets/backgrounds/BG-M08.jpg",
        tone: "dark",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-N01",
        period: "night",
        src: "assets/backgrounds/BG-N01.jpg",
        tone: "white",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-N02",
        period: "night",
        src: "assets/backgrounds/BG-N02.jpg",
        tone: "white",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-N03",
        period: "night",
        src: "assets/backgrounds/BG-N03.jpg",
        tone: "white",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-N04",
        period: "night",
        src: "assets/backgrounds/BG-N04.jpg",
        tone: "white",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-N05",
        period: "night",
        src: "assets/backgrounds/BG-N05.jpg",
        tone: "white",
        status: "review-only",
        width: 831,
        height: 1800
      },
      {
        id: "BG-N06",
        period: "night",
        src: "assets/backgrounds/BG-N06.jpg",
        tone: "white",
        status: "review-only",
        width: 851,
        height: 1843
      },
      {
        id: "BG-N07",
        period: "night",
        src: "assets/backgrounds/BG-N07.jpg",
        tone: "white",
        status: "review-only",
        width: 852,
        height: 1846
      },
      {
        id: "BG-N08",
        period: "night",
        src: "assets/backgrounds/BG-N08.jpg",
        tone: "white",
        status: "review-only",
        width: 851,
        height: 1843
      }
    ]
  };

  // src/lib/migration.mjs
  function createVersionedStore({ store: store2, key, currentVersion, validators, migrations = {}, createInitial }) {
    if (!store2 || !["getItem", "setItem", "removeItem"].every((x) => typeof store2[x] === "function"))
      throw new TypeError("Migration: Storage API required");
    if (typeof key !== "string" || !/^[A-Za-z0-9_.-]{3,160}$/.test(key))
      throw new Error("Migration: valid namespaced storage key required");
    if (!Number.isSafeInteger(currentVersion) || currentVersion < 1) throw new Error("Migration: invalid current version");
    if (!validators || typeof validators !== "object" || typeof validators[currentVersion] !== "function" || typeof createInitial !== "function") throw new Error("Migration: validators and initializer required");
    const check = (state2, version) => {
      if (!state2 || typeof state2 !== "object" || Array.isArray(state2) || state2.version !== version)
        throw new Error("Migration: expected version " + version);
      if (typeof validators[version] !== "function") throw new Error("Migration: missing validator for v" + version);
      validators[version](state2);
    };
    const parse = (raw) => {
      let state2;
      try {
        state2 = JSON.parse(raw);
      } catch {
        throw new Error("Migration: malformed stored JSON: " + key);
      }
      if (!Number.isSafeInteger(state2?.version) || state2.version < 1) throw new Error("Migration: missing/invalid version");
      return state2;
    };
    function evaluate(raw) {
      let state2 = parse(raw);
      if (state2.version > currentVersion) throw new Error("Migration: future version " + state2.version + " is not supported");
      const originalVersion = state2.version;
      check(state2, originalVersion);
      while (state2.version < currentVersion) {
        const from = state2.version, step = migrations[from];
        if (typeof step !== "function") throw new Error("Migration: no explicit migration from v" + from);
        let output = step(structuredClone(state2));
        if (output?.version !== from + 1) throw new Error("Migration: step " + from + " must produce v" + (from + 1));
        check(output, from + 1);
        state2 = output;
      }
      return { state: state2, originalVersion, changed: originalVersion !== currentVersion };
    }
    function migrateAndCommit(raw) {
      const result = evaluate(raw);
      if (!result.changed) return result.state;
      const backupKey = key + ".before-v" + result.originalVersion + "-to-v" + currentVersion;
      const existingBackup = store2.getItem(backupKey);
      if (existingBackup !== null && existingBackup !== raw)
        throw new Error("Migration: existing rollback backup differs, refusing overwrite");
      if (existingBackup === null) store2.setItem(backupKey, raw);
      store2.setItem(key, JSON.stringify(result.state));
      return result.state;
    }
    return {
      read() {
        const raw = store2.getItem(key);
        if (raw === null) {
          const initial = createInitial();
          check(initial, currentVersion);
          return initial;
        }
        return migrateAndCommit(raw);
      },
      previewMigration() {
        const raw = store2.getItem(key);
        if (raw === null) {
          const initial = createInitial();
          check(initial, currentVersion);
          return { from: null, to: currentVersion, changed: false, state: initial };
        }
        const result = evaluate(raw);
        return { from: result.originalVersion, to: currentVersion, changed: result.changed, state: result.state };
      },
      write(state2) {
        check(state2, currentVersion);
        store2.setItem(key, JSON.stringify(state2));
        return state2;
      },
      importJson(raw) {
        const state2 = parse(raw);
        check(state2, currentVersion);
        this.write(state2);
        return state2;
      },
      exportJson() {
        return JSON.stringify(this.read(), null, 2);
      },
      clear() {
        store2.removeItem(key);
      },
      backupKeyFor(version) {
        return key + ".before-v" + version + "-to-v" + currentVersion;
      }
    };
  }

  // src/a16/domain/model.mjs
  var DURATIONS = Object.freeze([5, 10, 15, 20, 30]);
  var TEXT_LIMIT = 500;
  var NOTE_LIMIT = 500;
  var DEFAULT_WISH_LAYOUT = Object.freeze({ fontSize: 23, width: 92, x: 50, y: 45 });
  function validWishLayout(layout2) {
    return isObject(layout2) && Number.isInteger(layout2.fontSize) && layout2.fontSize >= 16 && layout2.fontSize <= 40 && Number.isInteger(layout2.width) && layout2.width >= 70 && layout2.width <= 96 && Number.isInteger(layout2.x) && layout2.x >= 12 && layout2.x <= 88 && Number.isInteger(layout2.y) && layout2.y >= 15 && layout2.y <= 78;
  }
  var isObject = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
  var required = (condition, message) => {
    if (!condition) throw new Error("A16: " + message);
  };
  var validIso = (x) => typeof x === "string" && !Number.isNaN(Date.parse(x)) && new Date(x).toISOString() === x;
  var dateValid = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = /* @__PURE__ */ new Date(value + "T00:00:00.000Z");
    return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value;
  };
  var validTime = (x) => typeof x === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(x);
  var textLimit = TEXT_LIMIT;
  function createInitialState() {
    return { version: 3, wishes: [], activeWishId: null, totalCompletedSessions: 0, preferences: {
      durationSeconds: 15,
      reminderEnabled: false,
      reminderTime: "21:00"
    } };
  }
  function validateStructure(state2, version) {
    required(isObject(state2) && state2.version === version, "unsupported state version");
    required(Array.isArray(state2.wishes) && state2.wishes.length <= 1e4, "invalid wishes array");
    required(Number.isSafeInteger(state2.totalCompletedSessions) && state2.totalCompletedSessions >= 0, "invalid total count");
    required(isObject(state2.preferences), "missing preferences");
    required(DURATIONS.includes(state2.preferences.durationSeconds), "invalid duration");
    required(typeof state2.preferences.reminderEnabled === "boolean", "invalid reminder flag");
    required(validTime(state2.preferences.reminderTime), "invalid reminder time");
    const ids = /* @__PURE__ */ new Set();
    let currentSum = 0;
    for (const wish of state2.wishes) {
      required(isObject(wish) && typeof wish.id === "string" && /^[a-f0-9-]{16,64}$/i.test(wish.id), "invalid wish ID");
      required(!ids.has(wish.id), "duplicate wish ID");
      ids.add(wish.id);
      required(typeof wish.text === "string" && wish.text.trim() === wish.text && wish.text.length > 0 && wish.text.length <= TEXT_LIMIT, "invalid wish text");
      required(validIso(wish.createdAt) && validIso(wish.updatedAt), "invalid timestamps");
      required(wish.updatedAt >= wish.createdAt, "update date earlier than creation");
      required(Number.isSafeInteger(wish.completedCount) && wish.completedCount >= 0, "invalid completed count");
      required(wish.firstCompletedAt === null || validIso(wish.firstCompletedAt), "invalid start date");
      required(wish.lastCompletedAt === null || validIso(wish.lastCompletedAt), "invalid last date");
      required(wish.completedCount === 0 && wish.firstCompletedAt === null && wish.lastCompletedAt === null || wish.completedCount > 0 && wish.firstCompletedAt !== null && wish.lastCompletedAt !== null, "inconsistent completion dates");
      required(wish.firstCompletedAt === null || wish.firstCompletedAt <= wish.lastCompletedAt, "inverted completion dates");
      required(wish.lastCompletedSessionId === null || typeof wish.lastCompletedSessionId === "string" && /^[a-f0-9-]{16,64}$/i.test(wish.lastCompletedSessionId), "invalid completed session ID");
      required(wish.completedCount === 0 === (wish.lastCompletedSessionId === null), "inconsistent session ID");
      required(wish.achievedDate === null || dateValid(wish.achievedDate), "invalid achieved date");
      required(typeof wish.achievementNote === "string" && wish.achievementNote.length <= NOTE_LIMIT, "invalid achievement note");
      required(typeof wish.backgroundId === "string" && /^BG-[MDEN]0[1-8]$/.test(wish.backgroundId), "invalid background ID");
      required(typeof wish.randomBackground === "boolean", "invalid random background setting");
      required(wish.textColor === void 0 || /^#[0-9a-fA-F]{6}$/.test(wish.textColor), "invalid text color");
      if (version >= 2) {
        required(wish.photoId === null || typeof wish.photoId === "string" && /^[a-f0-9-]{16,64}$/i.test(wish.photoId), "invalid photo ID");
        required(wish.photoId === null || wish.randomBackground === false, "personal photo cannot be random");
      }
      if (version >= 3) required(validWishLayout(wish.textLayout), "invalid wish text layout");
      currentSum += wish.completedCount;
      required(Number.isSafeInteger(currentSum), "completed count overflow");
    }
    required(state2.totalCompletedSessions >= currentSum, "global count lower than wish count");
    required(state2.activeWishId === null || ids.has(state2.activeWishId), "active wish missing");
    required(state2.wishes.length !== 0 || state2.activeWishId === null, "active wish must be null");
    return state2;
  }
  var validateStateV1 = (state2) => validateStructure(state2, 1);
  var validateStateV2 = (state2) => validateStructure(state2, 2);
  var validateState = (state2) => validateStructure(state2, 3);
  function migrateV1toV2(state2) {
    validateStateV1(state2);
    return { ...state2, version: 2, wishes: state2.wishes.map((w) => ({ ...w, photoId: null })) };
  }
  function migrateV2toV3(state2) {
    validateStateV2(state2);
    return { ...state2, version: 3, wishes: state2.wishes.map((w) => ({ ...w, textLayout: { ...DEFAULT_WISH_LAYOUT } })) };
  }
  function changeState(state2, modifier) {
    validateState(state2);
    const next = modifier(state2);
    validateState(next);
    return next;
  }
  function findIndex(state2, id) {
    const i = state2.wishes.findIndex((w) => w.id === id);
    required(i !== -1, "wish not found");
    return i;
  }
  function createWish(state2, { id, text, now }) {
    required(typeof text === "string" && text.trim().length > 0 && text.trim().length <= TEXT_LIMIT, "enter a wish of 1\u2013500 characters");
    required(validIso(now), "invalid timestamp");
    required(typeof id === "string" && /^[a-f0-9-]{16,64}$/i.test(id), "invalid UUID");
    return changeState(state2, (s2) => {
      required(!s2.wishes.some((w) => w.id === id), "duplicate wish");
      const wish = {
        id,
        text: text.trim(),
        createdAt: now,
        updatedAt: now,
        completedCount: 0,
        firstCompletedAt: null,
        lastCompletedAt: null,
        lastCompletedSessionId: null,
        achievedDate: null,
        achievementNote: "",
        backgroundId: "BG-D01",
        randomBackground: false,
        photoId: null,
        textLayout: { ...DEFAULT_WISH_LAYOUT }
      };
      return { ...s2, wishes: [...s2.wishes, wish], activeWishId: id };
    });
  }
  function updateWish(state2, { id, text, now }) {
    required(typeof text === "string" && text.trim().length > 0 && text.trim().length <= TEXT_LIMIT, "enter a wish of 1\u2013500 characters");
    required(validIso(now), "invalid timestamp");
    return changeState(state2, (s2) => {
      const i = findIndex(s2, id);
      required(now >= s2.wishes[i].updatedAt, "editing time precedes previous update");
      const wishes = s2.wishes.slice();
      wishes[i] = { ...wishes[i], text: text.trim(), updatedAt: now };
      return { ...s2, wishes };
    });
  }
  function setWishTextColor(state2, { id, textColor }) {
    required(/^#[0-9a-fA-F]{6}$/.test(textColor), "invalid text color");
    return changeState(state2, (s2) => {
      const i = findIndex(s2, id);
      const wishes = s2.wishes.slice();
      wishes[i] = { ...wishes[i], textColor };
      return { ...s2, wishes };
    });
  }
  function removeWish(state2, id) {
    return changeState(state2, (s2) => {
      findIndex(s2, id);
      const wishes = s2.wishes.filter((w) => w.id !== id);
      return { ...s2, wishes, activeWishId: s2.activeWishId === id ? wishes.at(-1)?.id ?? null : s2.activeWishId };
    });
  }
  function selectWish(state2, id) {
    return changeState(state2, (s2) => {
      findIndex(s2, id);
      return { ...s2, activeWishId: id };
    });
  }
  function completeSession(state2, { id, now, sessionId }) {
    required(validIso(now), "invalid completion timestamp");
    required(typeof sessionId === "string" && /^[a-f0-9-]{16,64}$/i.test(sessionId), "invalid session ID");
    return changeState(state2, (s2) => {
      const i = findIndex(s2, id);
      const w = s2.wishes[i];
      if (w.lastCompletedSessionId === sessionId) return s2;
      required(w.achievedDate === null, "cannot record a completed wish");
      required(now >= w.createdAt && (w.lastCompletedAt === null || now >= w.lastCompletedAt), "completion precedes last event");
      required(s2.totalCompletedSessions < Number.MAX_SAFE_INTEGER && w.completedCount < Number.MAX_SAFE_INTEGER, "completed count overflow");
      const wishes = s2.wishes.slice();
      wishes[i] = { ...w, completedCount: w.completedCount + 1, firstCompletedAt: w.firstCompletedAt ?? now, lastCompletedAt: now, lastCompletedSessionId: sessionId };
      return { ...s2, wishes, totalCompletedSessions: s2.totalCompletedSessions + 1 };
    });
  }
  function setAchievement(state2, { id, date, note }) {
    required(date === null || dateValid(date), "enter a valid achievement date");
    required(typeof note === "string" && note.length <= NOTE_LIMIT, "achievement note must be at most 500 characters");
    return changeState(state2, (s2) => {
      const i = findIndex(s2, id);
      const wishes = s2.wishes.slice();
      wishes[i] = { ...wishes[i], achievedDate: date, achievementNote: date === null ? "" : note.trim() };
      return { ...s2, wishes };
    });
  }
  function setDuration(state2, seconds) {
    required(DURATIONS.includes(seconds), "unsupported duration");
    return changeState(state2, (s2) => ({ ...s2, preferences: { ...s2.preferences, durationSeconds: seconds } }));
  }
  function setReminderTime(state2, time) {
    required(validTime(time), "invalid reminder time");
    return changeState(state2, (s2) => ({ ...s2, preferences: { ...s2.preferences, reminderTime: time } }));
  }
  function currentWish(state2) {
    validateState(state2);
    return state2.wishes.find((w) => w.id === state2.activeWishId) ?? null;
  }
  function setWishBackground(state2, { id, backgroundId, randomBackground }) {
    required(typeof backgroundId === "string" && /^BG-[MDEN]0[1-8]$/.test(backgroundId), "invalid background ID");
    required(typeof randomBackground === "boolean", "invalid random background flag");
    return changeState(state2, (s2) => {
      const i = findIndex(s2, id), wishes = s2.wishes.slice();
      wishes[i] = { ...wishes[i], backgroundId, randomBackground, photoId: null };
      return { ...s2, wishes };
    });
  }
  function setWishTextLayout(state2, { id, layout: layout2 }) {
    required(validWishLayout(layout2), "invalid wish text layout");
    return changeState(state2, (s2) => {
      const i = findIndex(s2, id), wishes = s2.wishes.slice();
      wishes[i] = { ...wishes[i], textLayout: { fontSize: layout2.fontSize, width: layout2.width, x: layout2.x, y: layout2.y } };
      return { ...s2, wishes };
    });
  }
  function setWishPhoto(state2, { id, photoId }) {
    required(typeof photoId === "string" && /^[a-f0-9-]{16,64}$/i.test(photoId), "invalid photo ID");
    return changeState(state2, (s2) => {
      const i = findIndex(s2, id), wishes = s2.wishes.slice();
      wishes[i] = { ...wishes[i], photoId, randomBackground: false };
      return { ...s2, wishes };
    });
  }
  function setReminderEnabled(state2, enabled) {
    required(typeof enabled === "boolean", "invalid reminder toggle");
    return changeState(state2, (s2) => ({ ...s2, preferences: { ...s2.preferences, reminderEnabled: enabled } }));
  }

  // src/a16/adapters/repository.mjs
  function createWishRepository({ storage, namespace }) {
    if (typeof namespace !== "string" || !/^[a-z0-9-]+$/.test(namespace)) throw new Error("A16: invalid storage namespace");
    const repo2 = createVersionedStore({ store: storage, key: namespace + ".wishes.v1", currentVersion: 3, validators: { 1: validateStateV1, 2: validateStateV2, 3: validateState }, migrations: { 1: migrateV1toV2, 2: migrateV2toV3 }, createInitial: createInitialState });
    return {
      read: () => repo2.read(),
      update: (transformation) => {
        if (typeof transformation !== "function") throw new Error("A16: transformation required");
        const current = repo2.read();
        const next = transformation(current);
        validateState(next);
        repo2.write(next);
        return next;
      },
      exportJson: () => repo2.exportJson(),
      previewMigration: () => repo2.previewMigration()
    };
  }

  // src/a16/features/backgrounds/photo-store.mjs
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
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.FilesystemWeb())
  });
  f();

  // src/a16/features/backgrounds/photo-store.mjs
  var PHOTO_ID = /^[a-f0-9-]{16,64}$/i;
  var DB = "a16-local-photo-files";
  function database(indexedDBFactory) {
    if (!indexedDBFactory) throw new Error("\u3053\u306E\u74B0\u5883\u3067\u306F\u5199\u771F\u306E\u4FDD\u5B58\u9818\u57DF\u3092\u5229\u7528\u3067\u304D\u307E\u305B\u3093");
    return new Promise((resolve2, reject) => {
      const req = indexedDBFactory.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos");
      };
      req.onsuccess = () => resolve2(req.result);
      req.onerror = () => reject(req.error ?? new Error("\u5199\u771F\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3092\u958B\u3051\u307E\u305B\u3093"));
      req.onblocked = () => reject(new Error("\u5199\u771F\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u304C\u4ED6\u306E\u753B\u9762\u3067\u4F7F\u7528\u3055\u308C\u3066\u3044\u307E\u3059"));
    });
  }
  async function transaction(factory, operation, mode = "readonly", value = null, key = null) {
    const db = await database(factory);
    try {
      return await new Promise((resolve2, reject) => {
        const tx = db.transaction("photos", mode);
        const store2 = tx.objectStore("photos");
        const req = operation === "put" ? store2.put(value, key) : operation === "delete" ? store2.delete(key) : store2.get(key);
        let result;
        req.onsuccess = () => {
          result = req.result;
        };
        req.onerror = () => reject(req.error ?? new Error("\u5199\u771F\u306E\u8AAD\u307F\u66F8\u304D\u306B\u5931\u6557\u3057\u307E\u3057\u305F"));
        tx.oncomplete = () => resolve2(result);
        tx.onerror = () => reject(tx.error ?? new Error("\u5199\u771F\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F"));
        tx.onabort = () => reject(tx.error ?? new Error("\u5199\u771F\u306E\u4FDD\u5B58\u3092\u4E2D\u65AD\u3057\u307E\u3057\u305F"));
      });
    } finally {
      db.close();
    }
  }
  function blobToBase64(blob) {
    return new Promise((resolve2, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve2(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(reader.error ?? new Error("\u5199\u771F\u306E\u5909\u63DB\u306B\u5931\u6557\u3057\u307E\u3057\u305F"));
      reader.readAsDataURL(blob);
    });
  }
  async function normalizePhoto(file, { maxLength = 2600, maxBytes = 2e7 } = {}) {
    if (!(file instanceof Blob)) throw new Error("\u5199\u771F\u30D5\u30A1\u30A4\u30EB\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044");
    if (file.size === 0 || file.size > maxBytes) throw new Error("\u5199\u771F\u306E\u5BB9\u91CF\u304C\u5927\u304D\u3059\u304E\u307E\u3059\uFF08\u4E0A\u965020MB\uFF09");
    if (!file.type.startsWith("image/")) throw new Error("\u753B\u50CF\u30D5\u30A1\u30A4\u30EB\u306E\u307F\u5229\u7528\u3067\u304D\u307E\u3059");
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.decoding = "async";
      image.src = objectUrl;
      await image.decode().catch(() => {
        throw new Error("\u3053\u306E\u753B\u50CF\u5F62\u5F0F\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\uFF08JPEG\u3084PNG\u3067\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\uFF09");
      });
      if (image.naturalWidth < 1 || image.naturalHeight < 1) throw new Error("\u753B\u50CF\u306E\u30B5\u30A4\u30BA\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093");
      const scale = Math.min(1, maxLength / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("\u753B\u50CF\u51E6\u7406\u3092\u5229\u7528\u3067\u304D\u307E\u305B\u3093");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const result = await new Promise((resolve2, reject) => canvas.toBlob((blob) => blob ? resolve2(blob) : reject(new Error("JPEG\u5909\u63DB\u306B\u5931\u6557\u3057\u307E\u3057\u305F")), "image/jpeg", 0.9));
      if (result.size > 8e6) throw new Error("\u5199\u771F\u306E\u4FDD\u5B58\u30B5\u30A4\u30BA\u304C\u5927\u304D\u3059\u304E\u307E\u3059");
      return result;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
  function createPhotoStore({
    native = Capacitor.isNativePlatform(),
    filesystem = Filesystem,
    indexedDBFactory = globalThis.indexedDB
  } = {}) {
    const urls = /* @__PURE__ */ new Map();
    const pathFor = (id) => {
      if (typeof id !== "string" || !PHOTO_ID.test(id)) throw new Error("A16: invalid photo ID");
      return "wish-photos/" + id + ".jpg";
    };
    const deleteCached = (id) => {
      const url = urls.get(id);
      if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
      urls.delete(id);
    };
    return {
      async put(id, blob) {
        const path = pathFor(id);
        if (!(blob instanceof Blob) || blob.type !== "image/jpeg") throw new Error("\u5199\u771F\u306FJPEG\u5F62\u5F0F\u3067\u4FDD\u5B58\u3057\u3066\u304F\u3060\u3055\u3044");
        if (native) {
          const data = await blobToBase64(blob);
          await filesystem.writeFile({ path, data, directory: Directory.Data, recursive: true });
        } else await transaction(indexedDBFactory, "put", "readwrite", blob, id);
        deleteCached(id);
      },
      async url(id) {
        pathFor(id);
        if (urls.has(id)) return urls.get(id);
        let url;
        if (native) {
          const result = await filesystem.readFile({ path: pathFor(id), directory: Directory.Data });
          if (typeof result.data !== "string") throw new Error("\u4FDD\u5B58\u3057\u305F\u5199\u771F\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093");
          url = "data:image/jpeg;base64," + result.data;
        } else {
          const blob = await transaction(indexedDBFactory, "get", "readonly", null, id);
          if (!(blob instanceof Blob)) throw new Error("\u5199\u771F\u30C7\u30FC\u30BF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002\u5143\u306E\u5199\u771F\u3092\u518D\u767B\u9332\u3057\u3066\u304F\u3060\u3055\u3044");
          url = URL.createObjectURL(blob);
        }
        urls.set(id, url);
        return url;
      },
      async remove(id) {
        const path = pathFor(id);
        if (native) await filesystem.deleteFile({ path, directory: Directory.Data });
        else await transaction(indexedDBFactory, "delete", "readwrite", null, id);
        deleteCached(id);
      },
      clearCache() {
        for (const id of urls.keys()) deleteCached(id);
      }
    };
  }

  // src/a16/features/reminders/daily-reminder.mjs
  init_dist();

  // node_modules/@capacitor/local-notifications/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor/local-notifications/dist/esm/definitions.js
  var Weekday;
  (function(Weekday2) {
    Weekday2[Weekday2["Sunday"] = 1] = "Sunday";
    Weekday2[Weekday2["Monday"] = 2] = "Monday";
    Weekday2[Weekday2["Tuesday"] = 3] = "Tuesday";
    Weekday2[Weekday2["Wednesday"] = 4] = "Wednesday";
    Weekday2[Weekday2["Thursday"] = 5] = "Thursday";
    Weekday2[Weekday2["Friday"] = 6] = "Friday";
    Weekday2[Weekday2["Saturday"] = 7] = "Saturday";
  })(Weekday || (Weekday = {}));

  // node_modules/@capacitor/local-notifications/dist/esm/index.js
  var LocalNotifications = registerPlugin("LocalNotifications", {
    web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.LocalNotificationsWeb())
  });

  // src/a16/features/reminders/daily-reminder.mjs
  var REMINDER_ID = 16016;
  var goodTime = (time) => typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  function notificationFor(time) {
    if (!goodTime(time)) throw new Error("A16: invalid reminder time");
    const [hour, minute] = time.split(":").map(Number);
    return {
      id: REMINDER_ID,
      title: "\u9858\u3044\u3092\u80B2\u3066\u308B\u30CE\u30FC\u30C8",
      body: "\u5F15\u304D\u5BC4\u305B\u306E\u6642\u9593\u3067\u3059\u3002",
      schedule: { on: { hour, minute, second: 0 } }
    };
  }
  function createDailyReminder({
    native = Capacitor.isNativePlatform(),
    plugin = LocalNotifications
  } = {}) {
    const ensureNative = () => {
      if (!native) throw new Error("\u901A\u77E5\u306E\u8A2D\u5B9A\u306FiPhone\u30A2\u30D7\u30EA\u3067\u5229\u7528\u3067\u304D\u307E\u3059\u3002\u30D6\u30E9\u30A6\u30B6\u304B\u3089\u306F\u914D\u4FE1\u3067\u304D\u307E\u305B\u3093\u3002");
    };
    const pending = async () => {
      ensureNative();
      const result = await plugin.getPending();
      return result.notifications.find((n) => n.id === REMINDER_ID) ?? null;
    };
    async function permission() {
      ensureNative();
      let status = await plugin.checkPermissions();
      if (status.display !== "granted") status = await plugin.requestPermissions();
      if (status.display !== "granted") throw new Error("\u901A\u77E5\u304C\u8A31\u53EF\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002iPhone\u306E\u8A2D\u5B9A\u304B\u3089\u901A\u77E5\u3092\u8A31\u53EF\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    async function disable() {
      ensureNative();
      await plugin.cancel({ notifications: [{ id: REMINDER_ID }] });
    }
    async function enable(time, { previousTime = null, previousEnabled = false } = {}) {
      ensureNative();
      const payload = notificationFor(time);
      await permission();
      if (previousEnabled && previousTime === time && await pending()) return;
      if (previousEnabled) await disable();
      try {
        await plugin.schedule({ notifications: [payload] });
        if (!await pending()) throw new Error("\u901A\u77E5\u304C\u767B\u9332\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F");
      } catch (error) {
        if (previousEnabled && previousTime && goodTime(previousTime)) {
          try {
            await plugin.schedule({ notifications: [notificationFor(previousTime)] });
          } catch (rollbackError) {
            throw new Error("\u901A\u77E5\u5909\u66F4\u306B\u5931\u6557\u3057\u3001\u4EE5\u524D\u306E\u8A2D\u5B9A\u3082\u5FA9\u5143\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F: " + rollbackError.message, { cause: error });
          }
        }
        throw error;
      }
    }
    return { native, enable, disable, pending, permission };
  }

  // src/a16/ui/effects/ripple.mjs
  var VERTEX = [
    "attribute vec2 a_pos;",
    "void main(){gl_Position=vec4(a_pos,0.0,1.0);}"
  ].join("\n");
  var FRAGMENT = [
    "precision mediump float;",
    "uniform sampler2D u_image;",
    "uniform vec2 u_resolution;",
    "uniform vec2 u_origin;",
    "uniform vec2 u_crop;",
    "uniform float u_radius;",
    "uniform float u_age;",
    "uniform float u_fade;",
    "void main(){",
    "  vec2 topUv=vec2(gl_FragCoord.x/u_resolution.x,1.0-gl_FragCoord.y/u_resolution.y);",
    "  vec2 delta=(topUv-u_origin)*u_resolution;",
    "  float distancePx=length(delta);",
    "  float dist=distancePx-u_radius;",
    // Layered waves bend the photograph; no painted circle or hard outline.
    "  float crest=exp(-pow(dist/28.0,2.0));",
    "  float wake=exp(-pow((dist+37.0)/53.0,2.0));",
    "  float wave=sin(dist*0.20+u_age*0.55)*crest + sin(dist*0.105+0.8)*wake*0.36;",
    "  float distort=(wave*6.4 + wake*0.75)*u_fade;",
    "  vec2 offset=distancePx>0.5?normalize(delta)*distort/u_resolution:vec2(0.0);",
    "  vec2 uv=(topUv+offset-0.5)*u_crop+0.5;",
    "  vec2 textureUv=vec2(uv.x,1.0-uv.y);",
    "  vec3 sampleColor=texture2D(u_image,clamp(textureUv,0.002,0.998)).rgb;",
    "  // The original scenery stays visible everywhere outside the traveling ring.",
    "  float gleam=crest*0.006*u_fade;",
    "  float shade=(0.035 + 0.025*topUv.y);",
    "  vec3 color=sampleColor*(1.0-shade)+vec3(gleam*0.8,gleam,gleam);",
    "  float alpha=clamp((crest*0.44+wake*0.15)*u_fade,0.0,0.58);",
    "  gl_FragColor=vec4(color,alpha);",
    "}"
  ].join("\n");
  function cropForCover(viewWidth, viewHeight, imageWidth, imageHeight) {
    if ([viewWidth, viewHeight, imageWidth, imageHeight].some((v) => !Number.isFinite(v) || v <= 0))
      throw new Error("A16: invalid dimensions for scenery");
    const viewAspect = viewWidth / viewHeight, imageAspect = imageWidth / imageHeight;
    return viewAspect > imageAspect ? { x: 1, y: imageAspect / viewAspect } : { x: viewAspect / imageAspect, y: 1 };
  }
  function rippleFrame(ageMs, minDimension) {
    if (!Number.isFinite(ageMs) || ageMs < 0 || !Number.isFinite(minDimension) || minDimension <= 0)
      throw new Error("A16: invalid ripple animation state");
    const progress = Math.min(1, ageMs / 2300);
    return {
      radius: 8 + 0.81 * minDimension * Math.pow(progress, 0.82),
      fade: Math.pow(1 - progress, 1.35),
      active: progress < 1
    };
  }
  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("A16 ripple shader: " + error);
    }
    return shader;
  }
  function initializeGL(canvas) {
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
    if (!gl) return null;
    const program = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX), fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("A16 ripple shader link: " + gl.getProgramInfoLog(program));
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const location = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {};
    for (const key of ["u_image", "u_resolution", "u_origin", "u_crop", "u_radius", "u_age", "u_fade"]) {
      uniforms[key] = gl.getUniformLocation(program, key);
    }
    gl.uniform1i(uniforms.u_image, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return { gl, program, buffer, texture, uniforms };
  }
  function createSceneryRipple({ canvas, field, host, motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)") } = {}) {
    if (!(canvas instanceof HTMLCanvasElement) || !field || !host) throw new Error("A16: ripple elements missing");
    let currentHost = host;
    let renderer = null;
    try {
      renderer = initializeGL(canvas);
    } catch (error) {
      console.warn("[A16] GPU ripple unavailable, using lightweight ripple", error);
    }
    const { gl } = renderer ?? {};
    let image = null, textureReady = false, imageEpoch = 0, ripples = [], frameHandle = null, disposed = false;
    const reduce = () => motionQuery.matches;
    const rect = () => currentHost.getBoundingClientRect();
    function setHost(nextHost) {
      if (!nextHost || typeof nextHost.getBoundingClientRect !== "function") throw new Error("A16: invalid ripple host");
      if (currentHost === nextHost) return;
      clear();
      nextHost.prepend(canvas, field);
      currentHost = nextHost;
    }
    function resize() {
      if (!gl) return;
      const r = rect(), factor = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(r.width * factor)), height = Math.max(1, Math.round(r.height * factor));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }
    function load(url) {
      if (typeof url !== "string" || !url) throw new Error("A16: invalid scenery URL");
      const request = ++imageEpoch;
      textureReady = false;
      if (frameHandle !== null) {
        cancelAnimationFrame(frameHandle);
        frameHandle = null;
      }
      ripples = [];
      field.replaceChildren();
      if (gl) gl.clear(gl.COLOR_BUFFER_BIT);
      const candidate = new Image();
      candidate.decoding = "async";
      candidate.onload = () => {
        if (disposed || request !== imageEpoch) return;
        image = candidate;
        if (!gl) return;
        resize();
        try {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, renderer.texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, candidate);
          textureReady = true;
        } catch (error) {
          console.warn("[A16] Could not upload scenery to ripple GPU", error);
        }
      };
      candidate.onerror = () => {
        if (request === imageEpoch) console.warn("[A16] Ripple texture could not load; the background remains visible");
      };
      candidate.src = url;
    }
    function draw(now) {
      frameHandle = null;
      if (disposed || !gl || !textureReady || !image || !ripples.length) return;
      resize();
      const u2 = renderer.uniforms;
      const width = canvas.width, height = canvas.height;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(renderer.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, renderer.texture);
      gl.uniform2f(u2.u_resolution, width, height);
      const crop = cropForCover(width, height, image.naturalWidth, image.naturalHeight);
      gl.uniform2f(u2.u_crop, crop.x, crop.y);
      const active = [];
      for (const ripple2 of ripples) {
        const age = Math.max(0, now - ripple2.at);
        const frame = rippleFrame(age, Math.min(width, height));
        if (!frame.active) continue;
        active.push(ripple2);
        gl.uniform2f(u2.u_origin, ripple2.x, ripple2.y);
        gl.uniform1f(u2.u_radius, frame.radius);
        gl.uniform1f(u2.u_age, age / 1e3);
        gl.uniform1f(u2.u_fade, frame.fade);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      ripples = active;
      if (ripples.length) frameHandle = requestAnimationFrame(draw);
      else gl.clear(gl.COLOR_BUFFER_BIT);
    }
    function pulse(clientX, clientY) {
      if (disposed || reduce()) return false;
      const b = rect();
      if (!b.width || !b.height) return false;
      const x = (clientX - b.left) / b.width, y = (clientY - b.top) / b.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return false;
      canvas.dataset.ripplePulses = String(Number(canvas.dataset.ripplePulses || 0) + 1);
      if (!gl || !textureReady) {
        const ring = document.createElement("span");
        ring.className = "a16-ambient-ripple";
        ring.style.left = x * 100 + "%";
        ring.style.top = y * 100 + "%";
        field.append(ring);
        while (field.childElementCount > 6) field.firstElementChild.remove();
        ring.addEventListener("animationend", () => ring.remove(), { once: true });
        setTimeout(() => ring.remove(), 2500);
      }
      ripples.push({ x, y, at: performance.now() });
      if (ripples.length > 4) ripples.shift();
      if (gl && textureReady && frameHandle === null) {
        frameHandle = requestAnimationFrame(draw);
      }
      return true;
    }
    function clear() {
      ripples = [];
      field.replaceChildren();
      if (frameHandle !== null) {
        cancelAnimationFrame(frameHandle);
        frameHandle = null;
      }
      if (gl) gl.clear(gl.COLOR_BUFFER_BIT);
    }
    function destroy() {
      disposed = true;
      imageEpoch++;
      clear();
      image = null;
      if (gl) {
        gl.deleteTexture(renderer.texture);
        gl.deleteBuffer(renderer.buffer);
        gl.deleteProgram(renderer.program);
      }
    }
    return { load, pulse, clear, setHost, destroy, get gpuAvailable() {
      return !!gl && textureReady;
    } };
  }

  // src/a16/ui/effects/scene-dip.mjs
  function createSceneDip({ node, reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, duration = 2100 } = {}) {
    if (!node || !Number.isFinite(duration) || duration < 0) throw new Error("A16: invalid scene dip");
    let active = false, timers = [], generation = 0;
    const sleep = (ms) => new Promise((resolve2) => {
      const timer = setTimeout(() => {
        timers = timers.filter((t) => t !== timer);
        resolve2();
      }, ms);
      timers.push(timer);
    });
    return {
      get active() {
        return active;
      },
      async run(swap) {
        if (typeof swap !== "function") throw new Error("A16: transition callback required");
        if (active) return false;
        if (reduced() || duration === 0) {
          swap();
          return true;
        }
        active = true;
        const token = ++generation;
        node.style.setProperty("--a16-dip-duration", duration + "ms");
        node.classList.remove("a16-dip-active");
        void node.offsetWidth;
        node.classList.add("a16-dip-active");
        try {
          await sleep(Math.round(duration * 0.49));
          if (token !== generation) return false;
          swap();
          await sleep(Math.ceil(duration * 0.51));
          return true;
        } finally {
          if (token === generation) {
            node.classList.remove("a16-dip-active");
            active = false;
          }
        }
      }
    };
  }

  // src/main.mjs
  validateConfig(app_config_default);
  var el = (id) => document.getElementById(id);
  var app = el("app");
  var feedback = createFeedback({ toastNode: el("toast") });
  var layout = createDeviceLayout({ root: document.documentElement });
  var ports = createNativePorts();
  document.documentElement.classList.toggle("a16-native", ports.native);
  layout.setBannerVisible(false);
  if (ports.native) layout.setBannerHeight(0);
  var adStatus = el("ad-status");
  var monetization = createMonetization({
    config: app_config_default,
    localStorage: window.localStorage,
    ports,
    onStatus(category, value) {
      if (category === "privacyOptions") {
        el("ads-privacy-button").hidden = !ports.native || app_config_default.ads.mode === "disabled" || value !== true;
        return;
      }
      if (category === "purchasePrice") {
        el("remove-ads-price").textContent = value || "App Store\u3067\u78BA\u8A8D";
        return;
      }
      if (category === "purchase") {
        const owned = value.startsWith("\u8CFC\u5165\u6E08\u307F");
        const ready = value === "\u8CFC\u5165\u53EF\u80FD";
        el("purchase-status").textContent = value;
        el("remove-ads-button").disabled = !ready;
        el("restore-purchases-button").disabled = !(ready || owned);
        if (owned) el("remove-ads-price").textContent = "\u8CFC\u5165\u6E08\u307F";
        else if (!ready) el("remove-ads-price").textContent = "\u78BA\u8A8D\u4E2D";
        else if (el("remove-ads-price").textContent === "\u78BA\u8A8D\u4E2D") {
          el("remove-ads-price").textContent = ports.purchase.displayPrice?.(app_config_default.purchase.removeAdsProductId) || "App Store\u3067\u78BA\u8A8D";
        }
        return;
      }
      if (category !== "ads") return;
      const shown = value === "\u30D0\u30CA\u30FC\u8868\u793A\u4E2D";
      const hidden = value === "\u975E\u8868\u793A" || value === "\u8CFC\u5165\u6E08\u307F\u30FB\u5E83\u544A\u306A\u3057" || value === "\u5E83\u544A\u6A5F\u80FD\u30AA\u30D5" || value === "\u30D6\u30E9\u30A6\u30B6\u30D7\u30EC\u30D3\u30E5\u30FC\u30FB\u5E83\u544A\u306A\u3057" || value.startsWith("\u30D0\u30CA\u30FC\u8868\u793A\u5931\u6557") || value.startsWith("\u5E83\u544A\u30EA\u30AF\u30A8\u30B9\u30C8\u4E0D\u53EF") || value.startsWith("\u5E83\u544A\u521D\u671F\u5316\u5931\u6557") || value.startsWith("\u8CFC\u5165\u5C65\u6B74\u306E\u78BA\u8A8D\u304C\u3067\u304D\u306A\u3044");
      if (shown || hidden) {
        layout.setBannerVisible(shown);
        if (ports.native) layout.setBannerHeight(shown ? 50 : 0);
      }
      if (adStatus) adStatus.textContent = value;
    }
  });
  var backgrounds = catalog_default.items;
  var bgFor = (id) => backgrounds.find((b) => b.id === id);
  if (backgrounds.length !== 32 || !bgFor("BG-D01")) throw new Error("A16: background catalog incomplete");
  var repo = createWishRepository({ storage: window.localStorage, namespace: app_config_default.storageNamespace });
  var photos = createPhotoStore();
  var reminders = createDailyReminder();
  var ripple = createSceneryRipple({ canvas: el("sky-ripple-canvas"), field: el("sky-ripple-field"), host: document.querySelector('[data-screen="home"]') });
  var sceneDip = createSceneDip({ node: el("scene-dip") });
  var paintEpoch = 0;
  var photoPreviewUrl = null;
  var formBusy = false;
  var draftLayout = { ...DEFAULT_WISH_LAYOUT };
  var guideKey = app_config_default.storageNamespace + ".onboarding.v1";
  var menuSideKey = app_config_default.storageNamespace + ":menu-side";
  var menuSide = () => window.localStorage.getItem(menuSideKey) === "right" ? "right" : "left";
  function applyMenuSide() {
    document.querySelector("[data-screen=home]").dataset.menuSide = menuSide();
    el("menu-side").value = menuSide();
  }
  var randomSceneKey = null;
  var randomSceneImage = null;
  function advanceRandomScene(wish) {
    if (!wish?.randomBackground || wish.photoId) return;
    const key = wish.id + ":" + wish.backgroundId;
    if (randomSceneKey !== key) {
      randomSceneKey = key;
      randomSceneImage = null;
    }
    const candidates = backgrounds.filter((item) => item.id !== randomSceneImage?.id);
    randomSceneImage = candidates[Math.floor(Math.random() * candidates.length)];
  }
  var state;
  var screen = "home";
  var detailId = null;
  var editId = null;
  var editorReturnScreen = "home";
  var guideReturnScreen = "home";
  var session = null;
  var interval = null;
  var reportTimer = null;
  var sessionCompletedPendingAd = false;
  var purchaseBusy = false;
  async function runPurchaseAction(type) {
    if (purchaseBusy) return;
    purchaseBusy = true;
    el("remove-ads-button").disabled = true;
    el("restore-purchases-button").disabled = true;
    try {
      if (type === "buy") {
        await monetization.buyRemoveAds();
        if (!monetization.status().owned) feedback.notify("App Store\u3067\u8CFC\u5165\u72B6\u6CC1\u3092\u78BA\u8A8D\u3057\u3066\u3044\u307E\u3059");
      } else if (type === "restore") {
        await monetization.restore();
        feedback.notify(monetization.status().owned ? "\u8CFC\u5165\u6E08\u307F\u306E\u5E83\u544A\u524A\u9664\u3092\u5FA9\u5143\u3057\u307E\u3057\u305F" : "\u5FA9\u5143\u51E6\u7406\u304C\u7D42\u4E86\u3057\u307E\u3057\u305F\u3002\u8CFC\u5165\u60C5\u5831\u3092\u78BA\u8A8D\u3057\u3066\u3044\u307E\u3059");
      } else throw new Error("A16: unknown purchase action");
    } finally {
      purchaseBusy = false;
      const s2 = monetization.status();
      el("remove-ads-button").disabled = !s2.purchaseReady || s2.owned;
      el("restore-purchases-button").disabled = !s2.purchaseReady;
    }
  }
  function showError(error) {
    console.error("[A16]", error);
    const node = el("error");
    node.textContent = "\u51E6\u7406\u3092\u5B8C\u4E86\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\uFF1A" + error.message;
    node.hidden = false;
    window.clearTimeout(reportTimer);
    reportTimer = window.setTimeout(() => node.hidden = true, 6500);
  }
  var run = (fn) => (...args) => {
    try {
      const result = fn(...args);
      return result?.then ? result.catch(showError) : result;
    } catch (err) {
      showError(err);
      return void 0;
    }
  };
  var nativeAdsInitialized = false;
  function startNativeAds() {
    if (!ports.native || nativeAdsInitialized) return;
    nativeAdsInitialized = true;
    run(() => monetization.initialize())();
  }
  function dateLabel(iso) {
    if (!iso) return "\u2014";
    const d = new Date(iso);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  }
  function localDay() {
    const now = /* @__PURE__ */ new Date();
    return String(now.getFullYear()) + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }
  var lookup = (id) => state.wishes.find((x) => x.id === id) ?? null;
  function paintBackground(wish) {
    const epoch = ++paintEpoch;
    const base = wish ? bgFor(wish.backgroundId) : bgFor("BG-D01");
    if (!base) throw new Error("A16: background missing");
    const key = wish?.randomBackground ? wish.id + ":" + wish.backgroundId : null;
    if (key !== randomSceneKey) {
      randomSceneKey = key;
      randomSceneImage = key ? backgrounds[Math.floor(Math.random() * backgrounds.length)] : null;
    }
    const chosen = randomSceneImage ?? base;
    const apply = (url, tone) => {
      if (epoch !== paintEpoch) return;
      const homeScene = bgFor("BG-N01");
      if (!homeScene) throw new Error("A16: fixed night home scene missing");
      for (const node of document.querySelectorAll(".scenic")) {
        const isHome = node.dataset.screen === "home";
        node.style.setProperty("--scene-url", 'url("' + (isHome ? homeScene.src : url) + '")');
        node.dataset.tone = isHome ? homeScene.tone : tone;
      }
      ripple.load(screen === "home" ? homeScene.src : url);
    };
    if (wish?.photoId) {
      photos.url(wish.photoId).then((url) => apply(url, "photo")).catch(showError);
    } else apply(chosen.src, chosen.tone);
  }
  function resetPhotoPreview() {
    if (photoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(photoPreviewUrl);
    photoPreviewUrl = null;
    el("photo-preview").hidden = true;
    el("photo-preview").removeAttribute("src");
  }
  function updateBackgroundKind() {
    const personal = el("background-kind").value === "photo";
    el("personal-photo").hidden = !personal;
    el("built-in-backgrounds").hidden = personal;
    placementPreviewBackground();
  }
  function showStoredPhoto(id) {
    const token = editId;
    photos.url(id).then((url) => {
      if (token !== editId || el("background-kind").value !== "photo") return;
      el("photo-preview").src = url;
      el("photo-preview").hidden = false;
      placementPreviewBackground();
    }).catch(showError);
  }
  function renderReminder() {
    el("reminder-enabled").checked = state.preferences.reminderEnabled;
    el("reminder-enabled").disabled = !reminders.native;
    el("reminder-status").textContent = reminders.native ? state.preferences.reminderEnabled ? "\u6BCE\u65E5 " + state.preferences.reminderTime + " \u306B\u901A\u77E5\u3092\u8A2D\u5B9A\u3057\u3066\u3044\u307E\u3059\u3002\u901A\u77E5\u306E\u8A31\u53EF\u306FiPhone\u306E\u8A2D\u5B9A\u3067\u3082\u5909\u66F4\u3067\u304D\u307E\u3059\u3002" : "\u6642\u523B\u3092\u9078\u3073\u3001\u901A\u77E5\u3092ON\u306B\u3059\u308B\u3068\u8A31\u53EF\u3092\u78BA\u8A8D\u3057\u307E\u3059\u3002" : "\u30D6\u30E9\u30A6\u30B6\u8A66\u4F5C\u3067\u306F\u901A\u77E5\u306F\u5C4A\u304D\u307E\u305B\u3093\u3002\u6642\u523B\u306F\u4FDD\u5B58\u3067\u304D\u307E\u3059\u3002\u5B9F\u969B\u306E\u901A\u77E5\u306FiPhone\u30A2\u30D7\u30EA\u3067\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
  }
  function placementPreviewBackground() {
    const stage = el("wish-placement-preview");
    const kind = el("background-kind").value;
    const img = kind === "photo" ? photoPreviewUrl || (el("photo-preview").hidden ? null : el("photo-preview").src) : bgFor(el("background-id").value)?.src;
    stage.style.backgroundImage = img ? 'linear-gradient(180deg,rgba(3,17,38,.08),rgba(3,17,38,.38)),url("' + img + '")' : "linear-gradient(180deg,#17385b,#0b213c)";
  }
  function clampPosition(node, frame, layout2, preview = false) {
    const outer = frame.getBoundingClientRect();
    if (!outer.width || !outer.height) return;
    const bounds = node.getBoundingClientRect();
    const selection = document.createRange();
    selection.selectNodeContents(node);
    const ink = selection.getBoundingClientRect();
    const halfWidth = Math.min(ink.width / 2, outer.width / 2 - 7);
    const halfHeight = Math.min(bounds.height / 2, outer.height / 2 - 7);
    node.style.left = Math.round(Math.min(Math.max(outer.width * layout2.x / 100, halfWidth + 7), outer.width - halfWidth - 7)) + "px";
    node.style.top = Math.round(Math.min(Math.max(outer.height * layout2.y / 100, halfHeight + 7), outer.height - halfHeight - 7)) + "px";
  }
  function renderPlacementPreview() {
    const text = el("wish-placement-text"), frame = el("wish-placement-stage");
    text.textContent = el("wish-text").value || "\u3053\u3053\u306B\u9858\u3044\u304C\u8868\u793A\u3055\u308C\u307E\u3059";
    text.style.color = el("wish-color").value;
    const scale = frame.clientWidth / window.innerWidth;
    text.style.fontSize = Math.max(9, Math.round(draftLayout.fontSize * scale * 10) / 10) + "px";
    text.style.width = draftLayout.width + "%";
    text.style.lineHeight = "1.75";
    text.style.left = draftLayout.x + "%";
    text.style.top = draftLayout.y + "%";
    clampPosition(text, frame, draftLayout, true);
    el("wish-font-size").value = String(draftLayout.fontSize);
    el("wish-font-size-value").textContent = draftLayout.fontSize + "px";
    el("wish-text-width").value = String(draftLayout.width);
    el("wish-text-width-value").textContent = draftLayout.width + "%";
    const active = draftLayout.y < 35 ? "top" : draftLayout.y > 60 ? "bottom" : "center";
    document.querySelectorAll("[data-position-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.positionPreset === active)));
  }
  function positionSessionText(wish) {
    const frame = el("wish-position"), text = el("session-words"), host = document.querySelector("[data-screen=session]");
    const layout2 = wish.textLayout;
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    const banner = 50, usable = Math.max(260, height - banner);
    frame.style.width = layout2.width + "%";
    text.style.fontSize = layout2.fontSize + "px";
    text.style.lineHeight = "1.9";
    frame.style.left = layout2.x * width / 100 + "px";
    frame.style.top = layout2.y * usable / 100 + "px";
    const textHeight = text.getBoundingClientRect().height;
    const inkRange = document.createRange();
    inkRange.selectNodeContents(text);
    const inkWidth = inkRange.getBoundingClientRect().width;
    const horizontal = Math.min(Math.max(layout2.x * width / 100, inkWidth / 2 + 10), width - inkWidth / 2 - 10);
    const vertical = Math.min(Math.max(layout2.y * usable / 100, textHeight / 2 + 50), usable - textHeight / 2 - 12);
    frame.style.left = horizontal + "px";
    frame.style.top = vertical + "px";
  }
  function updateBgPreview() {
    const item = bgFor(el("background-id").value);
    if (!item) throw new Error("A16: invalid selected background");
    el("background-preview").src = item.src;
    el("background-preview").alt = item.id + " \u306E\u80CC\u666F\u5019\u88DC";
    placementPreviewBackground();
    renderPlacementPreview();
  }
  function initializeBackgroundPicker() {
    const labels = { morning: "\u671D", day: "\u663C", evening: "\u5915", night: "\u591C" };
    const select = el("background-id");
    select.replaceChildren();
    for (const period of ["morning", "day", "evening", "night"]) {
      const group = document.createElement("optgroup");
      group.label = labels[period];
      for (const item of backgrounds.filter((x) => x.period === period)) {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = labels[period] + " " + item.id.split("-")[1].slice(1);
        group.append(option);
      }
      select.append(group);
    }
    select.value = "BG-D01";
    updateBgPreview();
  }
  function hasReadGuide() {
    return window.localStorage.getItem(guideKey) === "completed";
  }
  function finishGuide() {
    window.localStorage.setItem(guideKey, "completed");
  }
  function openGuide(returnTo = "settings") {
    if (returnTo !== "home" && returnTo !== "settings") throw new Error("A16: invalid guide return screen");
    guideReturnScreen = returnTo;
    el("guide-start").textContent = state.wishes.length ? "\u30DB\u30FC\u30E0\u3078\u9032\u3080" : "\u9858\u3044\u3092\u767B\u9332\u3059\u308B";
    el("guide-exit").textContent = returnTo === "settings" ? "\u8A2D\u5B9A\u306B\u623B\u308B" : "\u3042\u3068\u3067";
    setScreen("guide");
  }
  function leaveGuide(start = false) {
    const firstTime = !hasReadGuide();
    finishGuide();
    startNativeAds();
    if (start && state.wishes.length === 0) {
      setScreen("home");
      newEditor();
      return;
    }
    setScreen(start ? "home" : guideReturnScreen);
    if (firstTime && screen === "home") document.querySelector("[data-screen=home]").classList.add("a16-entrance");
  }
  function commit(fn) {
    state = repo.update(fn);
    render();
  }
  function setScreen(name) {
    if (session && name !== "session") throw new Error("A16: cancel session before navigating away");
    screen = name;
    if (name === "home" || name === "session") ripple.setHost(document.querySelector('[data-screen="' + name + '"]'));
    else ripple.clear();
    if (name === "home") document.querySelector("[data-screen=home]").classList.remove("a16-entrance");
    paintBackground(name === "detail" || name === "achievement" || name === "editor" && editId ? lookup(detailId) : currentWish(state));
    document.querySelectorAll("[data-screen]").forEach((node) => {
      node.hidden = node.dataset.screen !== name;
    });
    if (name === "session") positionSessionText(currentWish(state));
    app.classList.toggle("session-active", name === "session");
    if (name === "achievement") el("achieved-date").focus({ preventScroll: true });
    const active = document.querySelector('[data-screen="' + name + '"]');
    if (active) active.scrollTop = 0;
  }
  function renderList() {
    const container = el("wish-list");
    container.replaceChildren();
    if (state.wishes.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent = "\u9858\u3044\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002\n\u65B0\u3057\u3044\u9858\u3044\u3092\u66F8\u3044\u3066\u307F\u307E\u3057\u3087\u3046\u3002";
      const button = document.createElement("button");
      button.className = "white-cta";
      button.dataset.action = "new";
      button.textContent = "\u9858\u3044\u3092\u767B\u9332";
      container.append(empty, button);
      return;
    }
    for (const wish of [...state.wishes].reverse()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wish-tile";
      if (wish.id === state.activeWishId) button.classList.add("active-tile");
      button.dataset.action = "view";
      button.dataset.id = wish.id;
      const bg = bgFor(wish.backgroundId);
      if (bg) button.style.backgroundImage = 'linear-gradient(110deg,rgba(17,35,53,.70),rgba(15,37,62,.40)),url("' + bg.src + '")';
      if (wish.photoId) {
        photos.url(wish.photoId).then((url) => {
          if (button.isConnected) button.style.backgroundImage = 'linear-gradient(110deg,rgba(17,35,53,.70),rgba(15,37,62,.40)),url("' + url + '")';
        }).catch(showError);
      }
      const text = document.createElement("span");
      text.className = "tile-text";
      text.textContent = wish.text;
      const sub = document.createElement("span");
      sub.className = "tile-sub";
      sub.textContent = (wish.id === state.activeWishId ? "\u9078\u629E\u4E2D \u30FB " : "") + (wish.achievedDate ? "\u53F6\u3063\u305F\u65E5 " + wish.achievedDate : "\u5F15\u304D\u5BC4\u305B " + wish.completedCount + "\u56DE");
      button.append(text, sub);
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "wish-list-edit";
      edit.dataset.action = "edit-wish";
      edit.dataset.id = wish.id;
      edit.textContent = "\u7DE8\u96C6";
      edit.setAttribute("aria-label", "\u9858\u3044\u3092\u7DE8\u96C6");
      const row = document.createElement("div");
      row.className = "wish-index-row";
      row.append(button, edit);
      container.append(row);
    }
  }
  function recordStat(label, value) {
    const box = document.createElement("div"), l = document.createElement("div"), v = document.createElement("div");
    l.className = "stat-label";
    v.className = "stat-value";
    l.textContent = label;
    v.textContent = value;
    box.append(l, v);
    return box;
  }
  function renderDetail() {
    const wish = lookup(detailId);
    if (!wish) return;
    el("detail-wish").textContent = wish.text;
    document.querySelector("[data-screen=detail]").style.setProperty("--a16-selected-text-color", wish.textColor ?? "#ffffff");
    const s2 = el("detail-stats");
    s2.replaceChildren(
      recordStat("\u5F15\u304D\u5BC4\u305B\u56DE\u6570", wish.completedCount + "\u56DE"),
      recordStat("\u5F15\u304D\u5BC4\u305B\u958B\u59CB", dateLabel(wish.firstCompletedAt)),
      recordStat("\u6700\u5F8C\u306B\u5F15\u304D\u5BC4\u305B\u305F\u65E5", dateLabel(wish.lastCompletedAt)),
      recordStat("\u767B\u9332\u65E5", dateLabel(wish.createdAt))
    );
    const achieved = el("achievement-info");
    achieved.replaceChildren();
    if (wish.achievedDate) {
      const h = document.createElement("p");
      h.className = "achieved-label";
      h.textContent = "\u9858\u3044\u304C\u53F6\u3044\u307E\u3057\u305F\u3000" + wish.achievedDate;
      achieved.append(h);
      if (wish.achievementNote) {
        const p = document.createElement("p");
        p.className = "stat-value";
        p.textContent = wish.achievementNote;
        achieved.append(p);
      }
    }
    el("unachieve-button").hidden = !wish.achievedDate;
    document.querySelector('[data-action="select"]').textContent = state.activeWishId === wish.id ? "\u9078\u629E\u4E2D\u306E\u9858\u3044" : "\u3053\u306E\u9858\u3044\u3092\u9078\u3076";
    document.querySelector('[data-action="achievement"]').textContent = wish.achievedDate ? "\u53F6\u3063\u305F\u65E5\u306E\u7DE8\u96C6" : "\u53F6\u3063\u305F\u65E5\u3092\u767B\u9332";
  }
  function render() {
    validateState(state);
    const selected = currentWish(state);
    applyMenuSide();
    el("duration").value = String(state.preferences.durationSeconds);
    el("reminder-time").value = state.preferences.reminderTime;
    renderReminder();
    el("privacy-link").href = app_config_default.privacyPolicyUrl;
    el("support-link").href = app_config_default.supportUrl;
    el("contact-link").href = "mailto:" + app_config_default.contactEmail;
    el("ads-privacy-button").hidden = true;
    renderList();
    renderDetail();
    paintBackground(selected);
  }
  function newEditor(id = null) {
    if (id && !lookup(id)) throw new Error("A16: wish not found");
    resetPhotoPreview();
    el("photo-input").value = "";
    if (id) detailId = id;
    editorReturnScreen = id ? "detail" : screen === "list" ? "list" : "home";
    editId = id;
    el("editor-title").textContent = id ? "\u9858\u3044\u306E\u7DE8\u96C6" : "\u65B0\u3057\u3044\u9858\u3044";
    el("wish-text").value = id ? lookup(id).text : "";
    el("wish-color").value = id ? lookup(id).textColor ?? "#ffffff" : "#ffffff";
    draftLayout = { ...id ? lookup(id).textLayout : DEFAULT_WISH_LAYOUT };
    el("background-id").value = id ? lookup(id).backgroundId : "BG-D01";
    el("random-bg").checked = id ? lookup(id).randomBackground : false;
    el("background-kind").value = id && lookup(id).photoId ? "photo" : "built-in";
    updateBackgroundKind();
    if (id && lookup(id).photoId) showStoredPhoto(lookup(id).photoId);
    updateBgPreview();
    updateCharCount();
    updateColorPreview();
    setScreen("editor");
    renderPlacementPreview();
  }
  function updateColorPreview() {
    el("wish-text").style.removeProperty("color");
    renderPlacementPreview();
  }
  function updateCharCount() {
    el("wish-char-count").textContent = el("wish-text").value.length + " / " + textLimit + "\u6587\u5B57";
    renderPlacementPreview();
  }
  async function begin() {
    const selected = currentWish(state);
    if (!selected) {
      newEditor();
      return;
    }
    if (selected.achievedDate) {
      detailId = selected.id;
      setScreen("detail");
      showError(new Error("\u53F6\u3063\u305F\u9858\u3044\u3067\u3059\u3002\u5225\u306E\u9858\u3044\u3092\u9078\u3076\u304B\u3001\u9054\u6210\u8A18\u9332\u3092\u53D6\u308A\u6D88\u3057\u3066\u304F\u3060\u3055\u3044\u3002"));
      return;
    }
    if (session || sceneDip.active) return;
    el("toast").hidden = true;
    const duration = state.preferences.durationSeconds;
    const id = crypto.randomUUID();
    session = { sessionId: id, wishId: selected.id, endsAt: null };
    const words = el("session-words");
    words.textContent = selected.text;
    words.classList.toggle("long-words", selected.text.length > 110);
    document.querySelector("[data-screen=session]").style.setProperty("--a16-selected-text-color", selected.textColor ?? "#ffffff");
    document.querySelector("[data-action=return-session]").hidden = true;
    words.classList.toggle("long-words", selected.text.length > 110);
    el("session-seconds").textContent = String(duration);
    words.style.opacity = "0";
    const play = document.querySelector(".execute-icon");
    const bounds = play.getBoundingClientRect();
    ripple.pulse(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    await sceneDip.run(() => {
      if (!session || session.sessionId !== id) return;
      advanceRandomScene(selected);
      setScreen("session");
    });
    if (!session || session.sessionId !== id || screen !== "session") return;
    session.endsAt = performance.now() + duration * 1e3;
    words.style.removeProperty("opacity");
    words.style.setProperty("--a16-wish-duration", duration * 1e3 + "ms");
    words.classList.remove("is-animating");
    void words.offsetWidth;
    words.classList.add("is-animating");
    interval = window.setInterval(run(() => {
      if (!session || session.endsAt === null) return;
      const remaining = Math.max(0, Math.ceil((session.endsAt - performance.now()) / 1e3));
      el("session-seconds").textContent = String(remaining);
      if (remaining === 0) return finishSession();
    }), 100);
  }
  function stopTimer() {
    if (interval !== null) {
      window.clearInterval(interval);
      interval = null;
    }
  }
  function cancelSession() {
    if (!session) return;
    sessionCompletedPendingAd = false;
    stopTimer();
    session = null;
    el("session-words").classList.remove("is-animating");
    setScreen("home");
  }
  async function finishSession() {
    if (!session) return;
    const completed = session;
    stopTimer();
    session = null;
    try {
      commit((s2) => completeSession(s2, { id: completed.wishId, now: (/* @__PURE__ */ new Date()).toISOString(), sessionId: completed.sessionId }));
    } catch (error) {
      el("session-words").classList.remove("is-animating");
      setScreen("home");
      throw error;
    }
    el("session-words").classList.remove("is-animating");
    el("session-words").style.opacity = "1";
    sessionCompletedPendingAd = true;
    document.querySelector("[data-action=return-session]").hidden = false;
  }
  function openAchievement() {
    const wish = lookup(detailId);
    if (!wish) throw new Error("A16: wish not found");
    el("achieved-date").value = wish.achievedDate ?? localDay();
    el("achievement-note").value = wish.achievementNote;
    setScreen("achievement");
  }
  function goDetail(id) {
    if (!lookup(id)) throw new Error("A16: wish not found");
    detailId = id;
    renderDetail();
    setScreen("detail");
  }
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger || trigger.disabled) return;
    run(async () => {
      const action = trigger.dataset.action;
      if (action === "home") setScreen("home");
      else if (action === "list") setScreen("list");
      else if (action === "settings") setScreen("settings");
      else if (action === "guide-open") openGuide("settings");
      else if (action === "guide-exit") leaveGuide(false);
      else if (action === "guide-start") leaveGuide(true);
      else if (action === "new") newEditor();
      else if (action === "view") goDetail(trigger.dataset.id);
      else if (action === "detail") setScreen("detail");
      else if (action === "edit") newEditor(detailId);
      else if (action === "edit-wish") newEditor(trigger.dataset.id);
      else if (action === "back-editor") {
        resetPhotoPreview();
        setScreen(editorReturnScreen);
      } else if (action === "begin") await begin();
      else if (action === "cancel-session") cancelSession();
      else if (action === "return-session") {
        const completed = sessionCompletedPendingAd;
        sessionCompletedPendingAd = false;
        setScreen("home");
        if (completed) await monetization.recordCommittedAction();
      } else if (action === "ads-privacy") await monetization.privacyOptions();
      else if (action === "buy-remove-ads") await runPurchaseAction("buy");
      else if (action === "restore-purchase") await runPurchaseAction("restore");
      else if (action === "select") {
        commit((s2) => selectWish(s2, detailId));
        setScreen("home");
      } else if (action === "achievement") openAchievement();
      else if (action === "delete") {
        const wish = lookup(detailId);
        if (!wish) throw new Error("A16: wish not found");
        if (await feedback.confirmAction({ title: "\u9858\u3044\u306E\u524A\u9664", message: "\u3053\u306E\u9858\u3044\u3068\u8A18\u9332\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\n\u5143\u306B\u623B\u305B\u307E\u305B\u3093\u3002", danger: true, acceptLabel: "\u524A\u9664\u3059\u308B" })) {
          const oldPhoto = wish.photoId;
          commit((s2) => removeWish(s2, detailId));
          detailId = null;
          setScreen("list");
          feedback.notify("\u9858\u3044\u3092\u524A\u9664\u3057\u307E\u3057\u305F");
          if (oldPhoto) await photos.remove(oldPhoto).catch(showError);
        }
      } else if (action === "unachieve") {
        if (await feedback.confirmAction({ title: "\u6210\u5C31\u8A18\u9332\u306E\u53D6\u308A\u6D88\u3057", message: "\u300C\u53F6\u3063\u305F\u300D\u8A18\u9332\u3092\u53D6\u308A\u6D88\u3057\u307E\u3059\u304B\uFF1F", danger: true, acceptLabel: "\u53D6\u308A\u6D88\u3059" })) {
          commit((s2) => setAchievement(s2, { id: detailId, date: null, note: "" }));
          setScreen("detail");
          feedback.notify("\u8A18\u9332\u3092\u53D6\u308A\u6D88\u3057\u307E\u3057\u305F");
        }
      }
    })();
  });
  document.querySelector('[data-screen="home"]').addEventListener("pointerdown", (event) => {
    if (screen !== "home" || event.button !== 0 || !event.isPrimary || sceneDip.active) return;
    if (event.target.closest('button,a,input,textarea,select,[role="button"]')) return;
    ripple.pulse(event.clientX, event.clientY);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && session) cancelSession();
  });
  el("menu-side").addEventListener("change", () => {
    const side = el("menu-side").value;
    if (!["left", "right"].includes(side)) throw new Error("A16: invalid menu side");
    window.localStorage.setItem(menuSideKey, side);
    applyMenuSide();
  });
  el("wish-text").addEventListener("input", updateCharCount);
  el("wish-color").addEventListener("input", updateColorPreview);
  el("wish-font-size").addEventListener("input", () => {
    draftLayout.fontSize = Number(el("wish-font-size").value);
    renderPlacementPreview();
  });
  el("wish-text-width").addEventListener("input", () => {
    draftLayout.width = Number(el("wish-text-width").value);
    renderPlacementPreview();
  });
  document.querySelectorAll("[data-position-preset]").forEach((button) => button.addEventListener("click", () => {
    draftLayout.x = 50;
    draftLayout.y = { top: 24, center: 45, bottom: 70 }[button.dataset.positionPreset];
    renderPlacementPreview();
  }));
  el("wish-position-reset").addEventListener("click", () => {
    draftLayout.x = 50;
    draftLayout.y = 45;
    renderPlacementPreview();
  });
  var placementStage = el("wish-placement-stage");
  var draggingPlacement = null;
  var dragPosition = (event) => {
    const rect = placementStage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    draftLayout.x = Math.min(88, Math.max(12, Math.round((event.clientX - rect.left) * 100 / rect.width)));
    draftLayout.y = Math.min(78, Math.max(15, Math.round((event.clientY - rect.top) * 100 / rect.height)));
    renderPlacementPreview();
  };
  placementStage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    draggingPlacement = event.pointerId;
    placementStage.setPointerCapture(event.pointerId);
    dragPosition(event);
  });
  placementStage.addEventListener("pointermove", (event) => {
    if (event.pointerId === draggingPlacement) dragPosition(event);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    placementStage.addEventListener(type, (event) => {
      if (event.pointerId === draggingPlacement) draggingPlacement = null;
    });
  }
  window.addEventListener("resize", () => {
    if (screen === "session" && currentWish(state)) positionSessionText(currentWish(state));
    if (screen === "editor") renderPlacementPreview();
  });
  document.querySelector("[data-screen=session]").addEventListener("pointerdown", (event) => {
    if (screen !== "session" || event.button !== 0 || !event.isPrimary || sceneDip.active) return;
    if (event.target.closest('button,a,input,textarea,select,[role="button"]')) return;
    ripple.pulse(event.clientX, event.clientY);
  });
  el("background-id").addEventListener("change", () => run(updateBgPreview)());
  el("background-kind").addEventListener("change", () => run(() => {
    updateBackgroundKind();
    resetPhotoPreview();
    if (el("background-kind").value === "photo" && editId && lookup(editId)?.photoId) showStoredPhoto(lookup(editId).photoId);
  })());
  el("photo-input").addEventListener("change", () => run(() => {
    resetPhotoPreview();
    const file = el("photo-input").files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2e7) throw new Error("20MB\u4EE5\u4E0B\u306E\u5199\u771F\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044");
    photoPreviewUrl = URL.createObjectURL(file);
    el("photo-preview").src = photoPreviewUrl;
    el("photo-preview").hidden = false;
    placementPreviewBackground();
  })());
  el("wish-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (formBusy) return;
    run(async () => {
      formBusy = true;
      const submit = el("wish-form").querySelector('[type="submit"]');
      const headerSubmit = document.querySelector(".wish-editor .editor-header-save");
      submit.disabled = true;
      headerSubmit.disabled = true;
      let newPhotoId = null, saved = false;
      try {
        const id = editId ?? crypto.randomUUID(), oldWish = editId ? lookup(editId) : null;
        const kind = el("background-kind").value;
        const text = el("wish-text").value;
        const file = el("photo-input").files[0] ?? null;
        let photoId = kind === "photo" ? oldWish?.photoId ?? null : null;
        if (kind === "photo" && file) {
          const jpeg = await normalizePhoto(file);
          newPhotoId = crypto.randomUUID();
          await photos.put(newPhotoId, jpeg);
          photoId = newPhotoId;
        }
        if (kind === "photo" && !photoId) throw new Error("\u81EA\u5206\u306E\u5199\u771F\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044");
        const stamp = (/* @__PURE__ */ new Date()).toISOString();
        commit((s2) => {
          let next = oldWish ? updateWish(s2, { id, text, now: stamp }) : createWish(s2, { id, text, now: stamp });
          next = setWishTextColor(next, { id, textColor: el("wish-color").value });
          next = setWishTextLayout(next, { id, layout: draftLayout });
          next = setWishBackground(next, { id, backgroundId: el("background-id").value, randomBackground: kind === "built-in" && el("random-bg").checked });
          if (photoId) next = setWishPhoto(next, { id, photoId });
          return next;
        });
        saved = true;
        resetPhotoPreview();
        if (oldWish?.photoId && oldWish.photoId !== photoId) await photos.remove(oldWish.photoId).catch(showError);
        if (oldWish) {
          detailId = id;
          setScreen("detail");
          feedback.notify("\u9858\u3044\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F");
        } else {
          setScreen("home");
          feedback.notify("\u9858\u3044\u3092\u767B\u9332\u3057\u307E\u3057\u305F");
        }
        await monetization.recordCommittedAction();
      } catch (error) {
        if (newPhotoId && !saved) await photos.remove(newPhotoId).catch(showError);
        throw error;
      } finally {
        submit.disabled = false;
        headerSubmit.disabled = false;
        formBusy = false;
      }
    })();
  });
  el("achievement-form").addEventListener("submit", (event) => {
    event.preventDefault();
    run(() => {
      commit((s2) => setAchievement(s2, { id: detailId, date: el("achieved-date").value, note: el("achievement-note").value }));
      setScreen("detail");
      feedback.notify("\u53F6\u3063\u305F\u65E5\u3092\u8A18\u9332\u3057\u307E\u3057\u305F");
      return monetization.recordCommittedAction();
    })();
  });
  el("duration").addEventListener("change", () => run(() => commit((s2) => setDuration(s2, Number(el("duration").value))))());
  var reminderBusy = false;
  el("reminder-enabled").addEventListener("change", () => run(async () => {
    if (reminderBusy) return;
    reminderBusy = true;
    el("reminder-enabled").disabled = true;
    const previous = state.preferences;
    try {
      if (el("reminder-enabled").checked) {
        await reminders.enable(previous.reminderTime, { previousEnabled: false });
        try {
          commit((s2) => setReminderEnabled(s2, true));
        } catch (error) {
          await reminders.disable().catch(showError);
          throw error;
        }
        feedback.notify("\u6BCE\u65E5\u306E\u901A\u77E5\u3092\u8A2D\u5B9A\u3057\u307E\u3057\u305F");
      } else {
        await reminders.disable();
        try {
          commit((s2) => setReminderEnabled(s2, false));
        } catch (error) {
          await reminders.enable(previous.reminderTime, { previousEnabled: false }).catch(showError);
          throw error;
        }
        feedback.notify("\u6BCE\u65E5\u306E\u901A\u77E5\u3092\u505C\u6B62\u3057\u307E\u3057\u305F");
      }
    } finally {
      reminderBusy = false;
      renderReminder();
    }
  })());
  el("reminder-time").addEventListener("change", () => run(async () => {
    if (reminderBusy) return;
    reminderBusy = true;
    const old = state.preferences.reminderTime, newTime = el("reminder-time").value;
    el("reminder-time").disabled = true;
    try {
      if (state.preferences.reminderEnabled) {
        await reminders.enable(newTime, { previousTime: old, previousEnabled: true });
        try {
          commit((s2) => setReminderTime(s2, newTime));
        } catch (error) {
          await reminders.enable(old, { previousTime: newTime, previousEnabled: true }).catch(showError);
          throw error;
        }
        feedback.notify("\u901A\u77E5\u6642\u523B\u3092\u5909\u66F4\u3057\u307E\u3057\u305F");
      } else {
        commit((s2) => setReminderTime(s2, newTime));
      }
    } catch (error) {
      el("reminder-time").value = old;
      throw error;
    } finally {
      reminderBusy = false;
      el("reminder-time").disabled = false;
    }
  })());
  try {
    initializeBackgroundPicker();
    state = repo.read();
    render();
    if (hasReadGuide()) setScreen("home");
    else openGuide("home");
  } catch (err) {
    console.error("[A16] Cannot read saved data", err);
    document.querySelectorAll("button,select,textarea,input").forEach((x) => x.disabled = true);
    showError(new Error("\u4FDD\u5B58\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3002\u30C7\u30FC\u30BF\u306F\u6D88\u53BB\u3057\u3066\u3044\u307E\u305B\u3093\u3002\u8A73\u7D30\uFF1A" + err.message));
  }
  if (screen === "home") document.querySelector("[data-screen=home]").classList.add("a16-entrance");
  if (hasReadGuide()) startNativeAds();
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
