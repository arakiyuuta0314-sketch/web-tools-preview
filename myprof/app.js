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
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h2) => h2.name === pluginName);
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
              const store3 = db.createObjectStore("FileStorage", { keyPath: "path" });
              store3.createIndex("by_folder", "folder");
            }
          }
        }
        async dbRequest(cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store3 = tx.objectStore("FileStorage");
              const req = store3[cmd](...args);
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
              const store3 = tx.objectStore("FileStorage");
              const index = store3.index(indexName);
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
          const store3 = tx.objectStore("FileStorage");
          store3.clear();
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
  var web_exports3 = {};
  __export(web_exports3, {
    ShareWeb: () => ShareWeb
  });
  var ShareWeb;
  var init_web3 = __esm({
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

  // src/generated/app-config.mjs
  var app_config_default = {
    "schemaVersion": 1,
    "appId": "com.yuta.watashinenpyo",
    "appName": "\u30DE\u30A4\u30D7\u30ED\u30D5",
    "storageNamespace": "watashi-nenpyo",
    "privacyPolicyUrl": "https://arakiyuuta0314-sketch.github.io/app-legal-pages/privacy/",
    "supportUrl": "https://arakiyuuta0314-sketch.github.io/",
    "contactEmail": "yuta.room.info@gmail.com",
    "ads": {
      "mode": "test",
      "appId": "ca-app-pub-3940256099942544~1458002511",
      "bannerId": "ca-app-pub-3940256099942544/2934735716",
      "interstitialId": "ca-app-pub-3940256099942544/4411468910",
      "nativeId": "ca-app-pub-3940256099942544/3986624511",
      "interstitialActiveMinutes": 40,
      "nativePlacement": "additional-card-footer",
      "minCompletedActions": 10,
      "cooldownMs": 6e5
    },
    "purchase": {
      "enabled": true,
      "removeAdsProductId": "com.yuta.watashinenpyo.remove_ads"
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
    invariant(typeof config.storageNamespace === "string" && /^[a-z0-9][a-z0-9-]{2,50}$/.test(config.storageNamespace), "storageNamespace requires 3-51 lowercase characters");
    for (const name of ["privacyPolicyUrl", "supportUrl"]) {
      invariant(isNonempty(config[name]) && /^https:\/\/[^/\s]+\/\S*$/.test(config[name]), name + " must be an HTTPS URL with path");
    }
    invariant(isNonempty(config.contactEmail) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(config.contactEmail), "contactEmail required");
    const ads2 = config.ads;
    invariant(ads2 && ["disabled", "test", "production"].includes(ads2.mode), "ads.mode must be disabled, test or production");
    invariant(Number.isSafeInteger(ads2.minCompletedActions) && ads2.minCompletedActions > 0, "ads.minCompletedActions must be a positive integer");
    invariant(Number.isSafeInteger(ads2.cooldownMs) && ads2.cooldownMs >= 0, "ads.cooldownMs must be a nonnegative integer");
    if (ads2.mode !== "disabled") {
      const app = adAppPattern.exec(ads2.appId || "");
      const banner = adUnitPattern.exec(ads2.bannerId || "");
      const interstitial = adUnitPattern.exec(ads2.interstitialId || "");
      invariant(app && banner && interstitial, "three valid AdMob IDs required");
      invariant(app[1] === banner[1] && app[1] === interstitial[1], "AdMob publisher IDs do not match");
      invariant(ads2.bannerId !== ads2.interstitialId, "AdMob ad units must be distinct");
      if (ads2.mode === "production" || typeof ads2.nativeId === "string" && ads2.nativeId.length) {
        const native = adUnitPattern.exec(ads2.nativeId || "");
        invariant(native, "valid native AdMob ID required");
        invariant(app[1] === native[1], "native AdMob publisher ID does not match");
        invariant(ads2.nativeId !== ads2.bannerId && ads2.nativeId !== ads2.interstitialId, "native AdMob unit must be distinct");
      }
      if (ads2.mode === "test") invariant(app[1] === "3940256099942544", "test mode must use Google demo IDs");
      if (ads2.mode === "production") invariant(app[1] !== "3940256099942544", "Google demo IDs forbidden in production");
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
      invariant(ads2.mode !== "test", "test ads forbidden for release; use production or disabled");
      invariant(!purchase.enabled || ads2.mode === "production", "remove ads purchase requires production ads");
    }
    return config;
  }

  // src/lib/migration.mjs
  function createVersionedStore({ store: store3, key, currentVersion, validators, migrations = {}, createInitial }) {
    if (!store3 || !["getItem", "setItem", "removeItem"].every((x) => typeof store3[x] === "function"))
      throw new TypeError("Migration: Storage API required");
    if (typeof key !== "string" || !/^[A-Za-z0-9_.-]{3,160}$/.test(key))
      throw new Error("Migration: valid namespaced storage key required");
    if (!Number.isSafeInteger(currentVersion) || currentVersion < 1) throw new Error("Migration: invalid current version");
    if (!validators || typeof validators !== "object" || typeof validators[currentVersion] !== "function" || typeof createInitial !== "function") throw new Error("Migration: validators and initializer required");
    const check = (state, version) => {
      if (!state || typeof state !== "object" || Array.isArray(state) || state.version !== version)
        throw new Error("Migration: expected version " + version);
      if (typeof validators[version] !== "function") throw new Error("Migration: missing validator for v" + version);
      validators[version](state);
    };
    const parse = (raw) => {
      let state;
      try {
        state = JSON.parse(raw);
      } catch {
        throw new Error("Migration: malformed stored JSON: " + key);
      }
      if (!Number.isSafeInteger(state?.version) || state.version < 1) throw new Error("Migration: missing/invalid version");
      return state;
    };
    function evaluate(raw) {
      let state = parse(raw);
      if (state.version > currentVersion) throw new Error("Migration: future version " + state.version + " is not supported");
      const originalVersion = state.version;
      check(state, originalVersion);
      while (state.version < currentVersion) {
        const from = state.version, step = migrations[from];
        if (typeof step !== "function") throw new Error("Migration: no explicit migration from v" + from);
        let output = step(structuredClone(state));
        if (output?.version !== from + 1) throw new Error("Migration: step " + from + " must produce v" + (from + 1));
        check(output, from + 1);
        state = output;
      }
      return { state, originalVersion, changed: originalVersion !== currentVersion };
    }
    function migrateAndCommit(raw) {
      const result = evaluate(raw);
      if (!result.changed) return result.state;
      const backupKey = key + ".before-v" + result.originalVersion + "-to-v" + currentVersion;
      const existingBackup = store3.getItem(backupKey);
      if (existingBackup !== null && existingBackup !== raw)
        throw new Error("Migration: existing rollback backup differs, refusing overwrite");
      if (existingBackup === null) store3.setItem(backupKey, raw);
      store3.setItem(key, JSON.stringify(result.state));
      return result.state;
    }
    return {
      read() {
        const raw = store3.getItem(key);
        if (raw === null) {
          const initial = createInitial();
          check(initial, currentVersion);
          return initial;
        }
        return migrateAndCommit(raw);
      },
      previewMigration() {
        const raw = store3.getItem(key);
        if (raw === null) {
          const initial = createInitial();
          check(initial, currentVersion);
          return { from: null, to: currentVersion, changed: false, state: initial };
        }
        const result = evaluate(raw);
        return { from: result.originalVersion, to: currentVersion, changed: result.changed, state: result.state };
      },
      write(state) {
        check(state, currentVersion);
        store3.setItem(key, JSON.stringify(state));
        return state;
      },
      importJson(raw) {
        const state = parse(raw);
        check(state, currentVersion);
        this.write(state);
        return state;
      },
      exportJson() {
        return JSON.stringify(this.read(), null, 2);
      },
      clear() {
        store3.removeItem(key);
      },
      backupKeyFor(version) {
        return key + ".before-v" + version + "-to-v" + currentVersion;
      }
    };
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

  // src/lib/feedback.mjs
  function createFeedback({ doc = document, win = window, toastNode }) {
    if (!toastNode || !doc?.body || !win) throw new Error("Feedback: document, window and toast node are required");
    let toastTimer;
    let confirmationOpen = false;
    const notify2 = (message, { durationMs = 3e3 } = {}) => {
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
    return { notify: notify2, confirmAction, withBusy };
  }

  // src/services/native-ports.mjs
  init_dist();

  // node_modules/@capacitor-community/admob/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-feed.js
  init_dist();

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-element.js
  var NATIVE_AD_ELEMENT_NAME = "capacitor-admob-native";
  var defineNativeAdElement = (findFeed) => {
    const runtime = globalThis;
    runtime.__capacitorAdMobNativeFeedLookup = findFeed;
    if (typeof customElements === "undefined" || customElements.get(NATIVE_AD_ELEMENT_NAME)) {
      return;
    }
    customElements.define(NATIVE_AD_ELEMENT_NAME, class extends HTMLElement {
      static get observedAttributes() {
        return ["feed-id", "slot-key"];
      }
      connectedCallback() {
        this.connectToFeed();
      }
      disconnectedCallback() {
        this.disconnectFromFeed();
      }
      attributeChangedCallback() {
        if (!this.isConnected) {
          return;
        }
        this.disconnectFromFeed();
        this.connectToFeed();
      }
      connectToFeed() {
        var _a, _b, _c;
        const feedId = (_a = this.getAttribute("feed-id")) === null || _a === void 0 ? void 0 : _a.trim();
        const slotKey = (_b = this.getAttribute("slot-key")) === null || _b === void 0 ? void 0 : _b.trim();
        const feed = feedId ? (_c = runtime.__capacitorAdMobNativeFeedLookup) === null || _c === void 0 ? void 0 : _c.call(runtime, feedId) : void 0;
        if (!feed || !slotKey) {
          return;
        }
        try {
          feed.attach(slotKey, this);
          this.attachedFeed = feed;
        } catch (error) {
          this.dispatchEvent(new CustomEvent("nativeAdError", { bubbles: true, detail: error }));
        }
      }
      disconnectFromFeed() {
        var _a;
        (_a = this.attachedFeed) === null || _a === void 0 ? void 0 : _a.detach(this);
        this.attachedFeed = void 0;
      }
    });
  };
  var connectNativeAdElements = () => {
    document.querySelectorAll(NATIVE_AD_ELEMENT_NAME).forEach((element) => {
      var _a, _b;
      return (_b = (_a = element).connectToFeed) === null || _b === void 0 ? void 0 : _b.call(_a);
    });
  };

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-geometry.js
  var intersectRects = (left, right) => {
    const x = Math.max(left.x, right.x);
    const y = Math.max(left.y, right.y);
    const maxX = Math.min(left.x + left.width, right.x + right.width);
    const maxY = Math.min(left.y + left.height, right.y + right.height);
    return {
      x,
      y,
      width: Math.max(0, maxX - x),
      height: Math.max(0, maxY - y)
    };
  };
  var toNativeRect = (rect) => ({
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height
  });
  var clipsDescendants = (element) => {
    const style = window.getComputedStyle(element);
    return [style.overflow, style.overflowX, style.overflowY].some((value) => ["auto", "hidden", "scroll", "clip"].includes(value));
  };
  function* nativeAdAncestors(element) {
    var _a, _b;
    let current = element;
    while (current) {
      const root = current.getRootNode();
      current = (_b = (_a = current.assignedSlot) !== null && _a !== void 0 ? _a : current.parentElement) !== null && _b !== void 0 ? _b : root instanceof ShadowRoot ? root.host : null;
      if (current)
        yield current;
    }
  }
  var measureNativeAdSlot = (element, scrollElement) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const style = window.getComputedStyle(element);
    const domRect = element.getBoundingClientRect();
    if (!element.isConnected || style.display === "none" || style.visibility === "hidden" || Number.parseFloat(style.opacity || "1") === 0 || domRect.width <= 0 || domRect.height <= 0) {
      return void 0;
    }
    const rect = toNativeRect(domRect);
    let clipRect = scrollElement ? rect : {
      x: (_b = (_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.offsetLeft) !== null && _b !== void 0 ? _b : 0,
      y: (_d = (_c = window.visualViewport) === null || _c === void 0 ? void 0 : _c.offsetTop) !== null && _d !== void 0 ? _d : 0,
      width: (_f = (_e = window.visualViewport) === null || _e === void 0 ? void 0 : _e.width) !== null && _f !== void 0 ? _f : window.innerWidth,
      height: (_h = (_g = window.visualViewport) === null || _g === void 0 ? void 0 : _g.height) !== null && _h !== void 0 ? _h : window.innerHeight
    };
    let foundScrollElement = !scrollElement;
    for (const ancestor of nativeAdAncestors(element)) {
      if (ancestor === scrollElement) {
        foundScrollElement = true;
        break;
      }
      if (clipsDescendants(ancestor)) {
        clipRect = intersectRects(clipRect, toNativeRect(ancestor.getBoundingClientRect()));
      }
    }
    clipRect = intersectRects(rect, clipRect);
    if (!foundScrollElement || clipRect.width <= 0 || clipRect.height <= 0)
      return void 0;
    if (scrollElement) {
      const origin = scrollElement.getBoundingClientRect();
      const translate = (value) => Object.assign(Object.assign({}, value), { x: value.x - origin.left + scrollElement.scrollLeft, y: value.y - origin.top + scrollElement.scrollTop });
      return { rect: translate(rect), clipRect: translate(clipRect) };
    }
    return { rect, clipRect };
  };
  var measureNativeAdScrollContainer = (element) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const rect = toNativeRect(element.getBoundingClientRect());
    let clipRect = intersectRects(rect, {
      x: (_b = (_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.offsetLeft) !== null && _b !== void 0 ? _b : 0,
      y: (_d = (_c = window.visualViewport) === null || _c === void 0 ? void 0 : _c.offsetTop) !== null && _d !== void 0 ? _d : 0,
      width: (_f = (_e = window.visualViewport) === null || _e === void 0 ? void 0 : _e.width) !== null && _f !== void 0 ? _f : window.innerWidth,
      height: (_h = (_g = window.visualViewport) === null || _g === void 0 ? void 0 : _g.height) !== null && _h !== void 0 ? _h : window.innerHeight
    });
    for (const ancestor of nativeAdAncestors(element)) {
      if (clipsDescendants(ancestor)) {
        clipRect = intersectRects(clipRect, toNativeRect(ancestor.getBoundingClientRect()));
      }
    }
    return { rect, clipRect, contentWidth: element.scrollWidth, contentHeight: element.scrollHeight };
  };

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-template.enum.js
  var NativeAdTemplate;
  (function(NativeAdTemplate2) {
    NativeAdTemplate2["Small"] = "small";
    NativeAdTemplate2["Medium"] = "medium";
  })(NativeAdTemplate || (NativeAdTemplate = {}));

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-feed.js
  var SCROLL_SETTLE_MS = 120;
  var MAX_NATIVE_ADS = 3;
  var MAX_ACTIVE_FEEDS = 2;
  var MIN_SMALL_SLOT_WIDTH = 120;
  var MIN_MEDIUM_SLOT_WIDTH = 144;
  var MIN_MEDIUM_SLOT_HEIGHT = 300;
  var MIN_SMALL_SLOT_HEIGHT = 120;
  var TEMPLATE_ATTRIBUTE = "data-capacitor-admob-template";
  var applySlotDefaults = (element, template) => {
    const root = element.getRootNode();
    const container = root instanceof ShadowRoot ? root : element.ownerDocument.head;
    if (!container.querySelector("style[data-capacitor-admob-defaults]")) {
      const style = element.ownerDocument.createElement("style");
      style.setAttribute("data-capacitor-admob-defaults", "");
      const defaults = `
      :where([${TEMPLATE_ATTRIBUTE}]) { display: block; height: 320px; }
      :where([${TEMPLATE_ATTRIBUTE}="small"]) { height: 120px; }
    `;
      style.textContent = "CSSLayerBlockRule" in globalThis ? `@layer capacitor-admob-defaults { ${defaults} }` : defaults;
      container.prepend(style);
    }
    element.setAttribute(TEMPLATE_ATTRIBUTE, template);
  };
  var bridge;
  var sessionSequence = 0;
  var feeds = /* @__PURE__ */ new Map();
  var createSessionId = () => {
    var _a, _b, _c;
    return (_c = (_b = (_a = globalThis.crypto) === null || _a === void 0 ? void 0 : _a.randomUUID) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : `${Date.now()}-${++sessionSequence}-${Math.random().toString(36).slice(2)}`;
  };
  var NativeAdFeed = class _NativeAdFeed {
    constructor(options) {
      var _a;
      this.sessionId = createSessionId();
      this.slots = /* @__PURE__ */ new Map();
      this.elementSlots = /* @__PURE__ */ new Map();
      this.scrollRoots = /* @__PURE__ */ new Set();
      this.destroyed = false;
      this.nativeStarted = false;
      this.paused = false;
      this.layoutInvalidated = false;
      this.lastPlacementWasDirect = false;
      this.placementAcknowledgementRequired = false;
      this.operationTask = Promise.resolve();
      this.updateDirty = false;
      this.placementSequence = 0;
      this.listenerHandles = /* @__PURE__ */ new Set();
      this.handleViewportMotion = (event) => {
        if (this.destroyed) {
          return;
        }
        if (!(this.nativeScrollElement && event instanceof Event && ["scroll", "touchmove", "wheel"].includes(event.type))) {
          this.schedulePlacementUpdate();
        }
        this.scheduleEvaluation();
      };
      this.handleVisibilityChange = () => {
        if (this.destroyed) {
          return;
        }
        if (document.hidden) {
          this.layoutInvalidated = true;
          void this.requestPlacementUpdate();
          return;
        }
        this.scheduleEvaluation();
      };
      const id = options.feedId.trim();
      if (!id) {
        throw new Error("Native ad feed id must not be empty");
      }
      if (feeds.has(id)) {
        throw new Error(`Native ad feed id already exists: ${id}`);
      }
      if (feeds.size >= MAX_ACTIVE_FEEDS) {
        throw new Error(`At most ${MAX_ACTIVE_FEEDS} native ad feeds can be active`);
      }
      this.options = Object.assign(Object.assign({}, options), { feedId: id });
      this.nativeScrollElement = Capacitor.getPlatform() === "ios" ? options.scrollElement : void 0;
      if (typeof IntersectionObserver !== "undefined") {
        this.intersectionObserver = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            const slotKey = this.elementSlots.get(entry.target);
            const state = slotKey ? this.slots.get(slotKey) : void 0;
            if (state) {
              state.intersecting = entry.isIntersecting;
            }
          }
          this.schedulePlacementUpdate();
          this.scheduleEvaluation();
        });
      }
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(this.handleViewportMotion);
        if (this.nativeScrollElement)
          this.resizeObserver.observe(this.nativeScrollElement);
      }
      document.addEventListener("scroll", this.handleViewportMotion, true);
      document.addEventListener("touchmove", this.handleViewportMotion, { capture: true, passive: true });
      document.addEventListener("wheel", this.handleViewportMotion, { capture: true, passive: true });
      window.addEventListener("resize", this.handleViewportMotion, { passive: true });
      (_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.addEventListener("resize", this.handleViewportMotion, { passive: true });
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      document.addEventListener("load", this.handleViewportMotion, true);
      feeds.set(id, this);
    }
    static async create(options) {
      var _a;
      if (!bridge) {
        throw new Error("AdMob native ad bridge is not configured");
      }
      if (typeof document === "undefined" || typeof window === "undefined") {
        throw new Error("NativeAdFeed can only be created in a browser environment");
      }
      if (options.isTesting !== true && !((_a = options.adId) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new Error("adId is required unless isTesting is true");
      }
      const feed = new _NativeAdFeed(options);
      try {
        await bridge.startNativeAdFeed({ feedId: feed.feedId, sessionId: feed.sessionId });
        feed.nativeStarted = true;
        defineNativeAdElement((feedId) => feeds.get(feedId));
        connectNativeAdElements();
        return feed;
      } catch (error) {
        await feed.destroy();
        throw error;
      }
    }
    get feedId() {
      return this.options.feedId;
    }
    async addListener(eventName, listener) {
      this.assertActive();
      if (!bridge) {
        throw new Error("AdMob native ad bridge is not configured");
      }
      const nativeHandle = await bridge.addListener(eventName, (event) => {
        if (event.feedId === this.options.feedId && event.sessionId === this.sessionId) {
          const filteredListener = listener;
          filteredListener(event);
        }
      });
      if (this.destroyed) {
        await nativeHandle.remove();
        this.assertActive();
      }
      let removed = false;
      const handle = {
        remove: async () => {
          if (removed) {
            return;
          }
          removed = true;
          this.listenerHandles.delete(handle);
          await nativeHandle.remove();
        }
      };
      this.listenerHandles.add(handle);
      return handle;
    }
    attach(slotKey, element) {
      var _a, _b, _c;
      this.assertActive();
      const normalizedKey = slotKey.trim();
      if (!normalizedKey) {
        throw new Error("Native ad slotKey must not be empty");
      }
      const previousKey = this.elementSlots.get(element);
      if (previousKey === normalizedKey) {
        return;
      }
      if (previousKey && previousKey !== normalizedKey) {
        this.detach(element);
      }
      const existing = this.slots.get(normalizedKey);
      if ((existing === null || existing === void 0 ? void 0 : existing.element) && existing.element !== element) {
        throw new Error(`Native ad slotKey is already attached: ${normalizedKey}`);
      }
      const state = existing !== null && existing !== void 0 ? existing : {
        slotKey: normalizedKey,
        generation: 0,
        intersecting: !this.intersectionObserver,
        status: "idle",
        lastUsed: Date.now(),
        loadVersion: 0
      };
      applySlotDefaults(element, (_a = this.options.template) !== null && _a !== void 0 ? _a : NativeAdTemplate.Medium);
      state.element = element;
      state.generation += 1;
      state.lastUsed = Date.now();
      this.slots.set(normalizedKey, state);
      this.elementSlots.set(element, normalizedKey);
      this.updateScrollRoots();
      (_b = this.intersectionObserver) === null || _b === void 0 ? void 0 : _b.observe(element);
      (_c = this.resizeObserver) === null || _c === void 0 ? void 0 : _c.observe(element);
      this.scheduleEvaluation();
    }
    detach(element) {
      var _a, _b;
      const slotKey = this.elementSlots.get(element);
      if (!slotKey) {
        return;
      }
      const state = this.slots.get(slotKey);
      if ((state === null || state === void 0 ? void 0 : state.element) === element) {
        state.element = void 0;
        state.intersecting = false;
        state.generation += 1;
        state.lastUsed = Date.now();
      }
      (_a = this.intersectionObserver) === null || _a === void 0 ? void 0 : _a.unobserve(element);
      (_b = this.resizeObserver) === null || _b === void 0 ? void 0 : _b.unobserve(element);
      this.elementSlots.delete(element);
      this.updateScrollRoots();
      void this.requestPlacementUpdate();
      this.scheduleEvaluation();
    }
    async reload(slotKey) {
      this.assertActive();
      const normalizedKey = slotKey.trim();
      const state = this.slots.get(normalizedKey);
      if (!state) {
        throw new Error(`Native ad slotKey is not registered: ${normalizedKey}`);
      }
      await this.runOperation(async () => {
        await this.removeStateAd(state);
        const protectedStates = new Set(this.getVisibleStates());
        protectedStates.add(state);
        await this.evictUnusedAds(protectedStates);
        if ([...this.slots.values()].filter((slot) => this.occupiesNativeAd(slot)).length >= MAX_NATIVE_ADS) {
          throw new Error("Native ad capacity is currently in use by visible slots");
        }
        await this.loadState(state);
      });
    }
    /** Immediately hides this feed's overlays until {@link resume} is called. */
    async pause() {
      this.assertActive();
      this.paused = true;
      this.layoutInvalidated = true;
      if (!await this.requestPlacementUpdate()) {
        throw new Error("Failed to hide native ad placements");
      }
    }
    /** Re-evaluates slots and restores eligible overlays after the viewport settles. */
    resume() {
      this.assertActive();
      this.paused = false;
      this.scheduleEvaluation();
    }
    /** Hides stale overlays and remeasures after an application-driven layout change. */
    async invalidateLayout() {
      this.assertActive();
      this.layoutInvalidated = true;
      this.scheduleEvaluation();
      if (!await this.requestPlacementUpdate()) {
        throw new Error("Failed to hide native ad placements");
      }
    }
    async destroy() {
      var _a, _b, _c;
      if (!this.destroyed) {
        this.destroyed = true;
        feeds.delete(this.options.feedId);
        document.removeEventListener("scroll", this.handleViewportMotion, true);
        for (const root of this.scrollRoots) {
          root.removeEventListener("scroll", this.handleViewportMotion, true);
        }
        this.scrollRoots.clear();
        document.removeEventListener("touchmove", this.handleViewportMotion, true);
        document.removeEventListener("wheel", this.handleViewportMotion, true);
        window.removeEventListener("resize", this.handleViewportMotion);
        (_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.removeEventListener("resize", this.handleViewportMotion);
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        document.removeEventListener("load", this.handleViewportMotion, true);
        if (this.settleTimer) {
          clearTimeout(this.settleTimer);
        }
        if (this.placementFrame !== void 0) {
          cancelAnimationFrame(this.placementFrame);
          this.placementFrame = void 0;
        }
        (_b = this.intersectionObserver) === null || _b === void 0 ? void 0 : _b.disconnect();
        (_c = this.resizeObserver) === null || _c === void 0 ? void 0 : _c.disconnect();
      }
      if (this.destroyTask) {
        return this.destroyTask;
      }
      this.destroyTask = this.destroyResources();
      try {
        await this.destroyTask;
      } finally {
        this.destroyTask = void 0;
      }
    }
    schedulePlacementUpdate() {
      if (this.destroyed || this.placementFrame !== void 0) {
        return;
      }
      this.placementFrame = requestAnimationFrame(() => {
        this.placementFrame = void 0;
        void this.requestPlacementUpdate(true);
      });
    }
    updateScrollRoots() {
      const roots = /* @__PURE__ */ new Set();
      for (const element of this.elementSlots.keys()) {
        for (const ancestor of [element, ...nativeAdAncestors(element)]) {
          const root = ancestor.getRootNode();
          if (root instanceof ShadowRoot)
            roots.add(root);
        }
      }
      for (const root of this.scrollRoots) {
        if (!roots.has(root)) {
          root.removeEventListener("scroll", this.handleViewportMotion, true);
          this.scrollRoots.delete(root);
        }
      }
      for (const root of roots) {
        if (!this.scrollRoots.has(root)) {
          root.addEventListener("scroll", this.handleViewportMotion, true);
          this.scrollRoots.add(root);
        }
      }
    }
    scheduleEvaluation() {
      if (this.destroyed) {
        return;
      }
      if (this.settleTimer) {
        clearTimeout(this.settleTimer);
      }
      this.settleTimer = setTimeout(() => {
        this.layoutInvalidated = false;
        void this.runOperation(() => this.evaluate());
      }, SCROLL_SETTLE_MS);
    }
    async evaluate() {
      if (this.destroyed || this.paused || document.hidden) {
        return;
      }
      const visibleStates = this.getVisibleStates();
      for (const state of visibleStates) {
        state.lastUsed = Date.now();
      }
      await this.evictUnusedAds(new Set(visibleStates));
      const occupied = [...this.slots.values()].filter((state) => this.occupiesNativeAd(state)).length;
      const loadable = visibleStates.filter((state) => state.status === "idle").slice(0, Math.max(0, MAX_NATIVE_ADS - occupied));
      await Promise.allSettled(loadable.map((state) => this.loadState(state)));
      void this.requestPlacementUpdate();
    }
    async loadState(state) {
      var _a;
      if (state.status !== "idle" || !bridge) {
        return;
      }
      state.status = "loading";
      const loadVersion = ++state.loadVersion;
      try {
        await bridge.loadNativeAd({
          feedId: this.options.feedId,
          sessionId: this.sessionId,
          slotKey: state.slotKey,
          template: (_a = this.options.template) !== null && _a !== void 0 ? _a : NativeAdTemplate.Medium,
          style: this.options.style,
          adId: this.options.adId,
          isTesting: this.options.isTesting,
          npa: this.options.npa
        });
        if (state.loadVersion === loadVersion) {
          state.status = "loaded";
          state.lastUsed = Date.now();
        }
      } catch (error) {
        if (state.loadVersion === loadVersion) {
          state.status = "failed";
        }
        throw error;
      }
    }
    async evictUnusedAds(visibleStates) {
      const occupied = [...this.slots.values()].filter((state) => this.occupiesNativeAd(state));
      const requestedLoads = [...visibleStates].filter((state) => state.status === "idle").length;
      const evictionCount = Math.max(0, occupied.length + Math.min(requestedLoads, MAX_NATIVE_ADS) - MAX_NATIVE_ADS);
      const evicted = occupied.filter((state) => !visibleStates.has(state)).sort((left, right) => left.lastUsed - right.lastUsed).slice(0, evictionCount);
      await Promise.allSettled(evicted.map((state) => this.removeStateAd(state)));
      const detached = [...this.slots.values()].filter((state) => !state.element && !this.occupiesNativeAd(state)).sort((left, right) => right.lastUsed - left.lastUsed);
      for (const state of detached.slice(MAX_NATIVE_ADS)) {
        this.slots.delete(state.slotKey);
      }
    }
    occupiesNativeAd(state) {
      return ["loading", "loaded", "removing", "removeFailed"].includes(state.status);
    }
    getVisibleStates() {
      return [...this.slots.values()].filter((state) => {
        const measured = state.element && state.intersecting ? measureNativeAdSlot(state.element) : void 0;
        return Boolean(measured && this.isSupportedSize(measured));
      });
    }
    isSupportedSize(measured) {
      var _a, _b;
      const minimumHeight = ((_a = this.options.template) !== null && _a !== void 0 ? _a : NativeAdTemplate.Medium) === NativeAdTemplate.Small ? MIN_SMALL_SLOT_HEIGHT : MIN_MEDIUM_SLOT_HEIGHT;
      const minimumWidth = ((_b = this.options.template) !== null && _b !== void 0 ? _b : NativeAdTemplate.Medium) === NativeAdTemplate.Small ? MIN_SMALL_SLOT_WIDTH : MIN_MEDIUM_SLOT_WIDTH;
      return measured.rect.width >= minimumWidth && measured.rect.height >= minimumHeight;
    }
    async removeStateAd(state) {
      if (state.status === "removing") {
        return;
      }
      if (!bridge || state.status === "idle" || state.status === "failed") {
        state.status = "idle";
        return;
      }
      state.status = "removing";
      const removeVersion = ++state.loadVersion;
      await this.requestPlacementUpdate();
      try {
        await bridge.removeNativeAd({
          feedId: this.options.feedId,
          sessionId: this.sessionId,
          slotKey: state.slotKey
        });
        if (state.loadVersion === removeVersion) {
          state.status = "idle";
        }
      } catch (error) {
        if (state.loadVersion === removeVersion) {
          state.status = "removeFailed";
        }
        throw error;
      }
    }
    runOperation(operation) {
      const result = this.operationTask.then(operation);
      this.operationTask = result.catch(() => void 0);
      return result;
    }
    async destroyResources() {
      await Promise.all([
        ...[...this.listenerHandles].map((handle) => handle.remove()),
        ...this.nativeStarted && bridge ? [bridge.destroyNativeAdFeed({ feedId: this.options.feedId, sessionId: this.sessionId })] : []
      ]);
      this.nativeStarted = false;
      this.listenerHandles.clear();
      this.slots.clear();
      this.elementSlots.clear();
    }
    requestPlacementUpdate(allowDirect = false) {
      this.updateDirty = true;
      this.placementAcknowledgementRequired || (this.placementAcknowledgementRequired = !allowDirect);
      if (!this.placementUpdateTask) {
        this.placementUpdateTask = Promise.resolve().then(() => this.flushPlacementUpdates());
      }
      return this.placementUpdateTask;
    }
    async flushPlacementUpdates() {
      if (!bridge || this.destroyed) {
        return true;
      }
      try {
        while (this.updateDirty && !this.destroyed) {
          this.updateDirty = false;
          const allowDirect = !this.placementAcknowledgementRequired;
          this.placementAcknowledgementRequired = false;
          const placements = [...this.slots.values()].filter((state) => state.status === "loaded").map((state) => {
            const measured = state.element ? measureNativeAdSlot(state.element, this.nativeScrollElement) : void 0;
            const visible = Boolean(!this.paused && !this.layoutInvalidated && measured && this.isSupportedSize(measured) && !document.hidden);
            return {
              feedId: this.options.feedId,
              slotKey: state.slotKey,
              generation: state.generation,
              visible,
              rect: measured === null || measured === void 0 ? void 0 : measured.rect,
              clipRect: measured === null || measured === void 0 ? void 0 : measured.clipRect
            };
          });
          const scrollContainer = this.nativeScrollElement ? measureNativeAdScrollContainer(this.nativeScrollElement) : void 0;
          const serializedPlacements = JSON.stringify({ placements, scrollContainer });
          if (serializedPlacements === this.lastPlacements && (allowDirect || !this.lastPlacementWasDirect)) {
            continue;
          }
          try {
            const batch = Object.assign({ feedId: this.options.feedId, sessionId: this.sessionId, sequence: ++this.placementSequence, placements }, scrollContainer ? { scrollContainer } : {});
            const channel = Capacitor.getPlatform() === "android" ? window.capacitorAdMobPlacements : void 0;
            let sentDirectly = false;
            if (allowDirect && channel) {
              try {
                channel.postMessage(JSON.stringify(batch));
                sentDirectly = true;
              } catch (_a) {
              }
            }
            if (!sentDirectly)
              await bridge.updateNativeAdPlacements(batch);
            this.lastPlacementWasDirect = sentDirectly;
            this.lastPlacements = serializedPlacements;
          } catch (_b) {
            this.lastPlacements = void 0;
            this.updateDirty = true;
            return false;
          }
        }
        return true;
      } catch (_c) {
        this.updateDirty = true;
        return false;
      } finally {
        this.placementUpdateTask = void 0;
      }
    }
    assertActive() {
      if (this.destroyed) {
        throw new Error(`Native ad feed has been destroyed: ${this.options.feedId}`);
      }
    }
  };
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
      constructor(config, store3) {
        this.config = config;
        if (!config.url) {
          config.url = "https://validator.iaptic.com";
        }
        this.store = store3 !== null && store3 !== void 0 ? store3 : CdvPurchase2.store;
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
      constructor(store3, prefix = "") {
        this.prefix = "";
        this.store = store3;
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
          return !!this.array.find((el) => el === receipt);
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
        static makeTransactionToken(transaction) {
          return transaction.platform + "|" + transaction.transactionId;
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
        static makeSubscriptionKey(transaction) {
          if (transaction.platform !== CdvPurchase2.Platform.APPLE_APPSTORE)
            return void 0;
          const skTransaction = transaction;
          if (!skTransaction.originalTransactionId)
            return void 0;
          if (!transaction.purchaseDate)
            return void 0;
          return transaction.platform + "|" + skTransaction.originalTransactionId + "|" + transaction.purchaseDate.getTime();
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
            receipt.transactions.forEach((transaction) => {
              var _a;
              const transactionToken = StoreAdapterListener.makeTransactionToken(transaction);
              const tokenWithState = transactionToken + "@" + transaction.state;
              const lastState = this.lastTransactionState[transactionToken];
              const subscriptionKey = StoreAdapterListener.makeSubscriptionKey(transaction);
              const isSubscriptionDuplicate = !!subscriptionKey && !!this.subscriptionFirstTransactionId[subscriptionKey] && this.subscriptionFirstTransactionId[subscriptionKey] !== transaction.transactionId;
              if (subscriptionKey && !this.subscriptionFirstTransactionId[subscriptionKey]) {
                this.subscriptionFirstTransactionId[subscriptionKey] = transaction.transactionId;
              }
              if (transaction.state === CdvPurchase2.TransactionState.APPROVED) {
                if (isSubscriptionDuplicate) {
                  this.log.debug(`Auto-finishing subscription duplicate ${transactionToken}, already processed as ${this.subscriptionFirstTransactionId[subscriptionKey]}`);
                  this.delegate.finishDuplicate(transaction);
                } else {
                  const dedupKey = subscriptionKey ? subscriptionKey + "@" + transaction.state : tokenWithState;
                  const lastCalled = (_a = this.lastCallTimeForState[dedupKey]) !== null && _a !== void 0 ? _a : 0;
                  if (now - lastCalled > 6e4) {
                    this.lastCallTimeForState[dedupKey] = now;
                    this.delegate.approvedCallbacks.trigger(transaction, "adapterListener_receiptsUpdated_approved");
                  } else {
                    this.log.debug(`Skipping ${tokenWithState}, because it has been last called ${lastCalled > 0 ? Math.round(now - lastCalled) + "ms ago (" + now + "-" + lastCalled + ")" : "never"}`);
                  }
                }
              } else if (lastState !== transaction.state) {
                if (transaction.state === CdvPurchase2.TransactionState.INITIATED) {
                  this.lastCallTimeForState[tokenWithState] = now;
                  this.delegate.initiatedCallbacks.trigger(transaction, "adapterListener_receiptsUpdated_initiated");
                } else if (transaction.state === CdvPurchase2.TransactionState.FINISHED) {
                  if (isSubscriptionDuplicate) {
                    this.log.debug(`Auto-finishing subscription duplicate ${transactionToken}, already processed as ${this.subscriptionFirstTransactionId[subscriptionKey]}`);
                    this.delegate.finishDuplicate(transaction);
                  } else {
                    this.lastCallTimeForState[tokenWithState] = now;
                    this.delegate.finishedCallbacks.trigger(transaction, "adapterListener_receiptsUpdated_finished");
                  }
                } else if (transaction.state === CdvPurchase2.TransactionState.PENDING) {
                  this.lastCallTimeForState[tokenWithState] = now;
                  this.delegate.pendingCallbacks.trigger(transaction, "adapterListener_receiptsUpdated_pending");
                }
              }
              if (isSubscriptionDuplicate) {
                this.lastTransactionState[transactionToken] = CdvPurchase2.TransactionState.FINISHED;
              } else {
                this.lastTransactionState[transactionToken] = transaction.state;
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
          this.callbacks = this.callbacks.filter((el) => el.callback !== callback);
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
          this.readyCallbacks = this.readyCallbacks.filter((el) => el !== cb);
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
        findMonitors(transaction) {
          return this.monitors.filter((monitor) => monitor.transaction.platform === transaction.platform && monitor.transaction.transactionId === transaction.transactionId);
        }
        startListening() {
          if (this.isListening) {
            return;
          }
          this.isListening = true;
          this.when.approved((transaction) => this.callOnChange(transaction), "transactionStateMonitors_callOnChange").finished((transaction) => this.callOnChange(transaction), "transactionStateMonitors_callOnChange");
        }
        callOnChange(transaction) {
          this.findMonitors(transaction).forEach((monitor) => {
            if (monitor.lastChange !== transaction.state) {
              monitor.lastChange = transaction.state;
              monitor.onChange(transaction.state);
            }
          });
        }
        /**
         * Start monitoring the provided transaction for state changes.
         */
        start(transaction, onChange) {
          this.startListening();
          const monitorId = CdvPurchase2.Utils.uuidv4();
          this.monitors.push({ monitorId, transaction, onChange, lastChange: transaction.state });
          setTimeout(onChange, 0, transaction.state);
          return {
            transaction,
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
              for (const transaction of receipt.transactions) {
                if (receipt.platform === "android-playstore" && !transaction.expirationDate) {
                  const googleTransaction = transaction;
                  if ((_c = googleTransaction.nativePurchase) === null || _c === void 0 ? void 0 : _c.autoRenewing) {
                    const transactionId = (_d = transaction.transactionId) !== null && _d !== void 0 ? _d : `${now}`;
                    if (!this.activeTransactions[transactionId]) {
                      this.log.debug(`Tracking auto-renewing Google Play subscription without expiration: ${transactionId}`);
                      this.activeTransactions[transactionId] = true;
                    }
                  }
                }
                if (transaction.expirationDate) {
                  const gracePeriod = (_e = ExpiryMonitor.GRACE_PERIOD_MS[receipt.platform]) !== null && _e !== void 0 ? _e : ExpiryMonitor.GRACE_PERIOD_MS.DEFAULT;
                  const expirationDate = +transaction.expirationDate + gracePeriod;
                  const transactionId = (_f = transaction.transactionId) !== null && _f !== void 0 ? _f : `${expirationDate}`;
                  if (expirationDate > now) {
                    this.activeTransactions[transactionId] = true;
                  }
                  if (expirationDate < now && this.activeTransactions[transactionId] && !this.notifiedTransactions[transactionId]) {
                    this.log.info(`Local transaction expired: ${transactionId}`);
                    this.notifiedTransactions[transactionId] = true;
                    this.controller.onTransactionExpired(transaction);
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
      constructor(store3, options = {}) {
        var _a, _b, _c, _d;
        this.cache = {};
        this.lastSeenTimestamp = 0;
        this.isReady = false;
        this.lastEventPerProduct = {};
        this.store = store3;
        this.storage = (_a = options.storage) !== null && _a !== void 0 ? _a : OfflineEntitlements.createLocalStorageAdapter();
        this.gracePeriodMs = (_b = options.gracePeriodMs) !== null && _b !== void 0 ? _b : OfflineEntitlements.DEFAULT_GRACE_PERIOD_MS;
        this.onExpiredOffline = (_c = options.onExpiredOffline) !== null && _c !== void 0 ? _c : "readonly";
        this.detectClockRollback = (_d = options.detectClockRollback) !== null && _d !== void 0 ? _d : false;
        this.eventCallbacks = new CdvPurchase2.Internal.Callbacks(store3.log, "OfflineEntitlements");
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
        const store3 = this;
        this.listener = new CdvPurchase2.Internal.StoreAdapterListener({
          updatedCallbacks: this.updatedCallbacks,
          updatedReceiptCallbacks: this.updatedReceiptsCallbacks,
          initiatedCallbacks: this.initiatedCallbacks,
          approvedCallbacks: this.approvedCallbacks,
          finishedCallbacks: this.finishedCallbacks,
          pendingCallbacks: this.pendingCallbacks,
          receiptsReadyCallbacks: this.receiptsReadyCallbacks,
          finishDuplicate: (transaction) => {
            const adapter = this.adapters.findReady(transaction.platform);
            if (adapter) {
              adapter.finish(transaction);
            }
          }
        }, this.log);
        this.transactionStateMonitors = new CdvPurchase2.Internal.TransactionStateMonitors(this.when());
        this._validator = new CdvPurchase2.Internal.Validator({
          adapters: this.adapters,
          getApplicationUsername: this.getApplicationUsername.bind(this),
          obfuscateUsername: this.obfuscateUsername.bind(this),
          get localReceipts() {
            return store3.localReceipts;
          },
          get validator() {
            return store3.validator;
          },
          get validator_privacy_policy() {
            return store3.validator_privacy_policy;
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
            store3.receiptsVerifiedCallbacks.trigger(void 0, "receipts_monitor_controller");
          },
          log: this.log
        }).launch();
        this.expiryMonitor = new CdvPurchase2.Internal.ExpiryMonitor({
          get localReceipts() {
            return store3.validator ? [] : store3.localReceipts;
          },
          get verifiedReceipts() {
            return store3.verifiedReceipts;
          },
          onTransactionExpired(transaction) {
            var _a;
            store3.log.debug(`Local transaction expired (${transaction.transactionId}), refreshing purchases`);
            if (!store3.validator) {
              const productId = (_a = transaction.products[0]) === null || _a === void 0 ? void 0 : _a.id;
              if (productId && !store3.owned(productId)) {
                store3.updatedReceiptsCallbacks.trigger(transaction.parentReceipt, "expiry_monitor_transaction_expired");
              }
            }
          },
          onVerifiedPurchaseExpired(verifiedPurchase, receipt) {
            store3.verify(receipt.sourceReceipt);
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
          const store3 = this;
          const ret = this.adapters.initialize(platforms, {
            error: this.triggerError.bind(this),
            get verbosity() {
              return store3.verbosity;
            },
            getApplicationUsername() {
              return store3.getApplicationUsername();
            },
            obfuscateUsername: (username, platform) => store3.obfuscateUsername(username, platform),
            get obfuscator() {
              return store3.obfuscator;
            },
            get listener() {
              return store3.listener;
            },
            get log() {
              return store3.log;
            },
            get registeredProducts() {
              return store3.registeredProducts;
            },
            get storefronts() {
              return store3._storefronts;
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
      monitor(transaction, onChange, callbackName) {
        return this.transactionStateMonitors.start(transaction, CdvPurchase2.Utils.safeCallback(this.log, "monitor()", onChange, callbackName, "transactionStateMonitors_stateChanged"));
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
            const onStateChange = (state) => {
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
          transactions.forEach((transaction) => {
            var _a;
            let skipNativeFinish = false;
            if (this.validator && receipt instanceof CdvPurchase2.VerifiedReceipt) {
              const verifiedPurchase = receipt.collection.find((p) => {
                return p.transactionId && p.transactionId === transaction.transactionId;
              });
              if (verifiedPurchase) {
                if (verifiedPurchase.isAcknowledged === true) {
                  this.log.info(`Transaction ${transaction.transactionId} already acknowledged according to verification API`);
                  transaction.isAcknowledged = true;
                  skipNativeFinish = true;
                }
                if (verifiedPurchase.isConsumed === true) {
                  this.log.info(`Transaction ${transaction.transactionId} already consumed according to verification API`);
                  transaction.isConsumed = true;
                  skipNativeFinish = true;
                }
              }
            }
            const adapter = this.adapters.findReady(transaction.platform);
            if ((adapter === null || adapter === void 0 ? void 0 : adapter.canSkipFinish) && skipNativeFinish && transaction.state === CdvPurchase2.TransactionState.APPROVED) {
              transaction.state = CdvPurchase2.TransactionState.FINISHED;
            } else {
              (_a = this.adapters.findReady(transaction.platform)) === null || _a === void 0 ? void 0 : _a.finish(transaction);
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
      static initiated(transaction) {
        return new PaymentRequestPromise().trigger(transaction);
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
            for (const transaction of receipt.transactions) {
              for (const trProducts of transaction.products) {
                if (trProducts.id === product.id) {
                  if (!found || ((_a = transaction.purchaseDate) !== null && _a !== void 0 ? _a : 0) < ((_b = found.purchaseDate) !== null && _b !== void 0 ? _b : 1))
                    found = transaction;
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
          const transaction = LocalReceipts.find(localReceipts, product);
          if (!transaction)
            return false;
          if (transaction.isConsumed)
            return false;
          if (transaction.isPending)
            return false;
          if (transaction.expirationDate)
            return transaction.expirationDate.getTime() > +/* @__PURE__ */ new Date();
          return true;
        }
        static canPurchase(localReceipts, product) {
          if (!product)
            return false;
          const transaction = LocalReceipts.find(localReceipts, product);
          if (!transaction)
            return true;
          if (transaction.isConsumed)
            return true;
          if (transaction.isPending)
            return false;
          if (transaction.expirationDate)
            return transaction.expirationDate.getTime() <= +/* @__PURE__ */ new Date();
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
        upsertTransactionInProgress(productId, state) {
          const transactionId = virtualTransactionId(productId);
          return new Promise((resolve2) => {
            const existing = this.pseudoReceipt.transactions.find((t) => t.transactionId === transactionId);
            if (existing) {
              existing.state = state;
              existing.refresh(productId);
              resolve2(existing);
            } else {
              const tr = new AppleAppStore.SKTransaction(CdvPurchase2.Platform.APPLE_APPSTORE, this.pseudoReceipt, this.context.apiDecorators);
              tr.state = state;
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
        upsertTransaction(productId, transactionId, state) {
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
                  existing.state = state;
                  existing.refresh(productId);
                  resolve2(existing);
                } else {
                  const tr = new AppleAppStore.SKTransaction(CdvPurchase2.Platform.APPLE_APPSTORE, this._receipt, this.context.apiDecorators);
                  tr.state = state;
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
                const transaction = yield this.upsertTransaction(productId, transactionIdentifier, CdvPurchase2.TransactionState.APPROVED);
                transaction.refresh(productId, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity);
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
                const transaction = yield this.upsertTransaction(productId, transactionIdentifier, CdvPurchase2.TransactionState.APPROVED);
                transaction.refresh(productId, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity);
                if (isFinished !== void 0)
                  transaction.isAcknowledged = isFinished;
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
        finish(transaction) {
          return new Promise((resolve2) => {
            this.log.info("finish(" + transaction.transactionId + ")");
            if (transaction.transactionId === AppleAppStore.APPLICATION_VIRTUAL_TRANSACTION_ID || transaction.transactionId === virtualTransactionId(transaction.products[0].id)) {
              transaction.state = CdvPurchase2.TransactionState.FINISHED;
              this.receiptsUpdated.call();
              return resolve2(void 0);
            }
            const wasAlreadyFinished = transaction.state === CdvPurchase2.TransactionState.FINISHED;
            const success = () => {
              transaction.state = CdvPurchase2.TransactionState.FINISHED;
              if (!wasAlreadyFinished) {
                this.receiptsUpdated.call();
              }
              resolve2(void 0);
            };
            const error = (msg) => {
              var _a, _b;
              if (msg === null || msg === void 0 ? void 0 : msg.includes("[#CdvPurchase:100]")) {
                transaction.state = CdvPurchase2.TransactionState.FINISHED;
                resolve2(void 0);
              } else {
                resolve2(appStoreError(CdvPurchase2.ErrorCode.FINISH, "Failed to finish transaction", (_b = (_a = transaction.products[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null));
              }
            };
            this.bridge.finish(transaction.transactionId, success, error);
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
            const transaction = skReceipt.transactions.slice(-1)[0];
            const products = CdvPurchase2.Utils.objectValues(this.validProducts).map((vp) => new AppleAppStore.SKProduct(vp, vp, this.context.apiDecorators, { isEligible: () => true }));
            if (this.useSK2) {
              if (!(transaction === null || transaction === void 0 ? void 0 : transaction.jwsRepresentation)) {
                this.log.warn("SK2 mode but no JWS on transaction, skipping validation");
                return void 0;
              }
              return {
                id: applicationReceipt.bundleIdentifier,
                type: CdvPurchase2.ProductType.APPLICATION,
                products,
                transaction: {
                  type: "apple-sk2",
                  id: (_b = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.products) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id,
                  jwsRepresentation: transaction.jwsRepresentation
                }
              };
            }
            const txBody = {
              type: "ios-appstore",
              id: transaction === null || transaction === void 0 ? void 0 : transaction.transactionId,
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
          transactionUpdated(state, errorCode, errorText, transactionIdentifier, productId, transactionReceipt, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity, isFinished) {
            if (!this.initialized) {
              this.pendingTransactionUpdates.push({
                state,
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
            switch (state) {
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
          transactionUpdated(state, errorCode, errorText, transactionIdentifier, productId, transactionReceipt, originalTransactionIdentifier, transactionDate, discountId, expirationDate, jwsRepresentation, quantity) {
            if (!this.initialized) {
              this.pendingUpdates.push({
                state,
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
            log("transaction updated:" + transactionIdentifier + " state:" + state + " product:" + productId);
            if (productId && transactionIdentifier) {
              if (this.transactionsForProduct[productId]) {
                this.transactionsForProduct[productId].push(transactionIdentifier);
              } else {
                this.transactionsForProduct[productId] = [transactionIdentifier];
              }
            }
            switch (state) {
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
          transactionUpdated(state, errorCode, errorText, transactionIdentifier, productId, transactionReceipt, originalTransactionIdentifier, transactionDate, discountId, quantity) {
            if (!this.initialized) {
              this.pendingUpdates.push({ state, errorCode, errorText, transactionIdentifier, productId, transactionReceipt, originalTransactionIdentifier, transactionDate, discountId, quantity });
              return;
            }
            log("transaction updated:" + transactionIdentifier + " state:" + state + " product:" + productId);
            if (productId && transactionIdentifier) {
              if (this.transactionsForProduct[productId]) {
                this.transactionsForProduct[productId].push(transactionIdentifier);
              } else {
                this.transactionsForProduct[productId] = [transactionIdentifier];
              }
            }
            switch (state) {
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
          const transaction = new CdvPurchase2.Transaction(CdvPurchase2.Platform.BRAINTREE, this, decorator);
          transaction.purchaseDate = /* @__PURE__ */ new Date();
          transaction.products = ((_a = paymentRequest.items) === null || _a === void 0 ? void 0 : _a.filter((p) => p).map((product) => ({ id: (product === null || product === void 0 ? void 0 : product.id) || "" }))) || [];
          transaction.state = CdvPurchase2.TransactionState.APPROVED;
          transaction.transactionId = (_c = (_b = dropInResult.paymentMethodNonce) === null || _b === void 0 ? void 0 : _b.nonce) !== null && _c !== void 0 ? _c : `UNKNOWN_${dropInResult.paymentMethodType}_${dropInResult.paymentDescription}`;
          this.transactions = [transaction];
          this.dropInResult = dropInResult;
          this.paymentRequest = paymentRequest;
          this.refresh(paymentRequest, dropInResult, decorator);
        }
        refresh(paymentRequest, dropInResult, decorator) {
          var _a, _b;
          this.dropInResult = dropInResult;
          this.paymentRequest = paymentRequest;
          const transaction = new CdvPurchase2.Transaction(CdvPurchase2.Platform.BRAINTREE, this, decorator);
          transaction.products = paymentRequest.items.filter((p) => p).map((product) => ({ id: (product === null || product === void 0 ? void 0 : product.id) || "" }));
          transaction.state = CdvPurchase2.TransactionState.APPROVED;
          transaction.transactionId = (_b = (_a = dropInResult.paymentMethodNonce) === null || _a === void 0 ? void 0 : _a.nonce) !== null && _b !== void 0 ? _b : `UNKNOWN_${dropInResult.paymentMethodType}_${dropInResult.paymentDescription}`;
          transaction.amountMicros = paymentRequest.amountMicros;
          transaction.currency = paymentRequest.currency;
          this.transactions = [transaction];
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
        finish(transaction) {
          return __awaiter(this, void 0, void 0, function* () {
            transaction.state = CdvPurchase2.TransactionState.FINISHED;
            this.context.listener.receiptsUpdated(CdvPurchase2.Platform.TEST, [transaction.parentReceipt]);
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
        static toState(fromConstructor, state, isAcknowledged, isConsumed) {
          switch (state) {
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
                this.retry.retry(go2);
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
            const go2 = () => {
              const { inAppSkus, subsSkus } = this.getSkusOf(products);
              this.log.debug("getAvailableProducts: " + JSON.stringify(inAppSkus) + " | " + JSON.stringify(subsSkus));
              this.bridge.getAvailableProducts(inAppSkus, subsSkus, iabLoaded, (err) => {
                this.retry.retry(go2);
                this.context.error(playStoreError(CdvPurchase2.ErrorCode.LOAD, "Loading product info failed - " + err + " - retrying later...", null));
              });
            };
            go2();
          });
        }
        /** @inheritDoc */
        finish(transaction) {
          return new Promise((resolve2) => {
            const onSuccess = () => {
              if (transaction.state !== CdvPurchase2.TransactionState.FINISHED) {
                transaction.state = CdvPurchase2.TransactionState.FINISHED;
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.GOOGLE_PLAY, [transaction.parentReceipt]);
              }
              resolve2(void 0);
            };
            const firstProduct = transaction.products[0];
            if (!firstProduct)
              return resolve2(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish a transaction with no product", null));
            const product = this._products.getProduct(firstProduct.id);
            if (!product)
              return resolve2(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish transaction, unknown product " + firstProduct.id, firstProduct.id));
            const receipt = this._receipts.find((r) => r.hasTransaction(transaction));
            if (!receipt)
              return resolve2(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish transaction, linked receipt not found.", product.id));
            if (!receipt.purchaseToken)
              return resolve2(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish transaction, linked receipt contains no purchaseToken.", product.id));
            const onFailure = (message, code) => resolve2(playStoreError(code || CdvPurchase2.ErrorCode.UNKNOWN, message, product.id));
            if (product.type === CdvPurchase2.ProductType.NON_RENEWING_SUBSCRIPTION || product.type === CdvPurchase2.ProductType.CONSUMABLE) {
              if (!transaction.isConsumed)
                return this.bridge.consumePurchase(onSuccess, onFailure, receipt.purchaseToken);
            } else {
              if (!transaction.isAcknowledged)
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
            const transaction = receipt.transactions[0];
            if (!transaction)
              return;
            const productId = (_a = transaction.products[0]) === null || _a === void 0 ? void 0 : _a.id;
            if (!productId)
              return;
            const product = this._products.getProduct(productId);
            if (!product)
              return;
            const purchase = transaction.nativePurchase;
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
              const transaction = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.transaction;
              if ((transaction === null || transaction === void 0 ? void 0 : transaction.type) !== CdvPurchase2.Platform.GOOGLE_PLAY)
                return;
              switch (transaction.kind) {
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
        finish(transaction) {
          return __awaiter(this, void 0, void 0, function* () {
            this.log.info(`finish(${transaction.transactionId}) - No-op for IapticJS/Stripe`);
            transaction.state = CdvPurchase2.TransactionState.FINISHED;
            const parentReceipt = this._receipts.find((r) => r.transactions.indexOf(transaction) >= 0);
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
        finish(transaction) {
          return new Promise((resolve2) => {
            setTimeout(() => {
              transaction.state = CdvPurchase2.TransactionState.FINISHED;
              transaction.isAcknowledged = true;
              updateVerifiedPurchases(transaction);
              const product = this.products.find((p) => transaction.products[0].id === p.id);
              if ((product === null || product === void 0 ? void 0 : product.type) === CdvPurchase2.ProductType.CONSUMABLE)
                transaction.isConsumed = true;
              const receipts = this.receipts.filter((r) => r.hasTransaction(transaction));
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
            const transaction = new CdvPurchase2.Transaction(CdvPurchase2.Platform.TEST, receipt, this.context.apiDecorators);
            transaction.purchaseDate = /* @__PURE__ */ new Date();
            transaction.products = paymentRequest.items.filter((p) => p).map((product) => ({ id: (product === null || product === void 0 ? void 0 : product.id) || "" })), transaction.state = CdvPurchase2.TransactionState.APPROVED;
            transaction.transactionId = "payment-" + (/* @__PURE__ */ new Date()).getTime();
            transaction.amountMicros = paymentRequest.amountMicros;
            transaction.currency = paymentRequest.currency;
            receipt.transactions = [transaction];
            this.receipts.push(receipt);
            setTimeout(() => {
              this.context.listener.receiptsUpdated(platform, [receipt]);
            }, 400);
            return transaction;
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
        finish(transaction) {
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
        function isObject(arg) {
          return Object.prototype.toString.call(arg) === "[object Object]";
        }
        function getPrivacyPolicy(store3) {
          if (typeof store3.validator_privacy_policy === "string")
            return store3.validator_privacy_policy.split(",");
          else if (isArray(store3.validator_privacy_policy))
            return store3.validator_privacy_policy;
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
              if (isObject(info)) {
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
        function getDeviceInfo(store3) {
          return __awaiter(this, void 0, void 0, function* () {
            const privacyPolicy = getPrivacyPolicy(store3);
            function allowed(policy) {
              return privacyPolicy.indexOf(policy) >= 0;
            }
            const ret = {
              plugin: "cordova-plugin-purchase/" + CdvPurchase2.PLUGIN_VERSION
            };
            const wdw = window;
            const device = isObject(wdw.device) ? wdw.device : yield getCapacitorDevice(allowed("tracking") || allowed("fraud"));
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
        onInterstitialDismissed: (cb) => AdMob.addListener(InterstitialAdPluginEvents.Dismissed, cb),
        onInterstitialFailed: (cb) => AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, cb),
        createNativeFeed: (settings) => NativeAdFeed.create({ ...settings, template: NativeAdTemplate.Small }),
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
        async initialize(id, onOwned) {
          store.register([{ id, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE }]);
          store.when().approved(async (transaction) => {
            if (!transaction.products?.some((product) => product.id === id)) return;
            await onOwned();
            try {
              await transaction.finish();
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

  // src/lib/gestures.mjs
  function attachHorizontalSwipe(target, { onSwipe, minDistance = 48, dominance = 1.5 } = {}) {
    if (!target?.addEventListener || typeof onSwipe !== "function") throw new TypeError("Swipe: target and callback required");
    if (!(minDistance > 0) || !(dominance > 1)) throw new Error("Swipe: invalid thresholds");
    const active = /* @__PURE__ */ new Set();
    let start = null, multitouch = false, suppressUntil = 0;
    const down = (e) => {
      if (e.pointerType === "mouse" || e.button !== 0) return;
      active.add(e.pointerId);
      if (active.size !== 1) {
        start = null;
        multitouch = true;
        return;
      }
      if (!multitouch) start = { id: e.pointerId, x: e.clientX, y: e.clientY };
    };
    const up = (e) => {
      if (!active.has(e.pointerId)) return;
      active.delete(e.pointerId);
      if (start && start.id === e.pointerId && !multitouch) {
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) >= minDistance && Math.abs(dx) > Math.abs(dy) * dominance) {
          suppressUntil = Date.now() + 700;
          onSwipe(dx < 0 ? "left" : "right");
        }
      }
      start = null;
      if (!active.size) multitouch = false;
    };
    const cancel = (e) => {
      active.delete(e.pointerId);
      start = null;
      if (!active.size) multitouch = false;
    };
    const click = (e) => {
      if (Date.now() < suppressUntil) {
        e.preventDefault();
        e.stopImmediatePropagation();
        suppressUntil = 0;
      }
    };
    target.addEventListener("pointerdown", down);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", cancel);
    target.addEventListener("click", click, true);
    return () => {
      target.removeEventListener("pointerdown", down);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", cancel);
      target.removeEventListener("click", click, true);
    };
  }

  // src/services/nenpyo-ads.mjs
  var MIN_ACTIVE_MS = 40 * 60 * 1e3;
  var PREFETCH_MS = 30 * 60 * 1e3;
  function createNENMonetization({
    config,
    ports,
    layout: layout2,
    onStatus = () => {
    },
    onInlineVisible = () => {
    },
    now = () => Date.now(),
    schedule = (fn) => {
      const handle = setInterval(fn, 6e4);
      handle.unref?.();
      return () => clearInterval(handle);
    }
  }) {
    const native = Boolean(ports.native), status = (kind, v) => onStatus(kind, v);
    let purchaseReady = false, owned = false, adsReady = false, started = false;
    let bannerVisible = false, modalOpen = false, inlineWanted = false, inlineFeed = null, inlineDisplayed = false;
    let interstitialReady = false, preparing = false, interstitialShowing = false;
    let currentActivity = 0, activeStarted = now(), foreground = true;
    let nextAllowedActive = MIN_ACTIVE_MS, stopSchedule = () => {
    }, listeners = [];
    let bannerQueue = Promise.resolve(), inlineQueue = Promise.resolve();
    const activeMs = () => currentActivity + (foreground ? Math.max(0, now() - activeStarted) : 0);
    function setForeground(value) {
      if (typeof value !== "boolean") throw Error("Foreground status must be boolean");
      if (value === foreground) return;
      currentActivity = activeMs();
      foreground = value;
      activeStarted = now();
      if (!value && inlineFeed) {
        void inlineFeed.pause().catch((e) => console.error("[MyProf native ad pause]", e));
      } else if (value) void syncInline();
    }
    async function updateBanner() {
      if (!native) return;
      if (owned || modalOpen || interstitialShowing || !adsReady) {
        if (bannerVisible) {
          await ports.ads.hideBanner();
          bannerVisible = false;
        }
        layout2.setBannerVisible(false);
        status("ads", modalOpen ? "\u7DE8\u96C6\u4E2D\u306F\u5E83\u544A\u3092\u975E\u8868\u793A" : "\u975E\u8868\u793A");
        return;
      }
      if (bannerVisible) {
        layout2.setBannerVisible(true);
        return;
      }
      try {
        await ports.ads.showBanner({ adId: config.ads.bannerId, adSize: "BANNER", position: "BOTTOM_CENTER", margin: 0, isTesting: config.ads.mode === "test" });
        bannerVisible = true;
        layout2.setBannerVisible(true);
        status("ads", "\u30D0\u30CA\u30FC\u8868\u793A\u4E2D");
      } catch (e) {
        layout2.setBannerVisible(false);
        status("ads", "\u30D0\u30CA\u30FC\u8868\u793A\u5931\u6557: " + e.message);
        throw e;
      }
    }
    function syncBanner() {
      const task = bannerQueue.then(updateBanner, updateBanner);
      bannerQueue = task.catch((e) => console.error("[MyProf banner synchronization]", e));
      return task;
    }
    async function updateInline() {
      if (!native) return;
      const allowed = adsReady && !owned && inlineWanted && !modalOpen && !interstitialShowing && foreground;
      if (!allowed) {
        if (inlineFeed) await inlineFeed.pause();
        inlineDisplayed = false;
        onInlineVisible(false);
        return;
      }
      if (!inlineFeed) {
        const settings = {
          feedId: "myprof-extra-cards",
          template: "small",
          isTesting: config.ads.mode === "test",
          style: { backgroundColor: "#ffffff", cornerRadius: 12, headlineColor: "#233f31", callToActionBackgroundColor: "#4f8b69" }
        };
        if (!config.ads.nativeId) throw Error("\u30A4\u30F3\u30E9\u30A4\u30F3\u5E83\u544A\u30E6\u30CB\u30C3\u30C8ID\u304C\u672A\u8A2D\u5B9A\u3067\u3059");
        settings.adId = config.ads.nativeId;
        inlineFeed = await ports.ads.createNativeFeed(settings);
      }
      inlineDisplayed = true;
      onInlineVisible(true);
      inlineFeed.resume();
      await inlineFeed.invalidateLayout();
    }
    function syncInline() {
      const task = inlineQueue.then(updateInline, updateInline);
      inlineQueue = task.catch((e) => {
        inlineDisplayed = false;
        onInlineVisible(false);
        console.error("[MyProf native ad]", e);
      });
      return task;
    }
    async function ownedChange() {
      owned = true;
      stopSchedule();
      interstitialReady = false;
      await syncInline();
      if (inlineFeed) {
        await inlineFeed.destroy();
        inlineFeed = null;
      }
      await syncBanner();
      status("purchase", "\u8CFC\u5165\u6E08\u307F");
    }
    async function initPurchase() {
      if (!native || !config.purchase.enabled) {
        status("purchase", "\u672A\u8A2D\u5B9A");
        return;
      }
      await ports.purchase.initialize(config.purchase.removeAdsProductId, ownedChange);
      purchaseReady = true;
      if (ports.purchase.owned(config.purchase.removeAdsProductId)) await ownedChange();
      else status("purchase", "\u8CFC\u5165\u53EF\u80FD");
    }
    async function prepareIfNeeded() {
      if (!adsReady || owned || !foreground || interstitialReady || preparing || interstitialShowing) return;
      if (activeMs() < nextAllowedActive - (MIN_ACTIVE_MS - PREFETCH_MS)) return;
      preparing = true;
      try {
        await ports.ads.prepareInterstitial({ adId: config.ads.interstitialId, isTesting: config.ads.mode === "test" });
        if (!owned) interstitialReady = true;
      } catch (e) {
        console.warn("[MyProf interstitial preload]", e);
      } finally {
        preparing = false;
      }
    }
    async function finishInterstitial() {
      interstitialShowing = false;
      await syncInline();
      await syncBanner();
    }
    return {
      async initialize() {
        if (started) throw Error("\u5E83\u544A\u6A5F\u80FD\u306E\u4E8C\u91CD\u521D\u671F\u5316");
        started = true;
        if (!native) {
          status("purchase", "iOS\u5C02\u7528");
          status("ads", "\u30D6\u30E9\u30A6\u30B6\u8868\u793A\uFF08\u5E83\u544A\u306A\u3057\uFF09");
          return;
        }
        try {
          await initPurchase();
        } catch (e) {
          status("purchase", "\u8CFC\u5165\u78BA\u8A8D\u30A8\u30E9\u30FC");
          status("ads", "\u8CFC\u5165\u72B6\u614B\u672A\u78BA\u8A8D\u306E\u305F\u3081\u505C\u6B62");
          throw e;
        }
        if (owned || config.ads.mode === "disabled") {
          status("ads", owned ? "\u8CFC\u5165\u6E08\u307F\u30FB\u5E83\u544A\u306A\u3057" : "\u5E83\u544A\u6A5F\u80FD\u30AA\u30D5");
          return;
        }
        try {
          let consent = await ports.ads.requestConsentInfo();
          if (consent.status === "REQUIRED" && consent.isConsentFormAvailable) consent = await ports.ads.showConsentForm();
          if (!consent.canRequestAds) {
            status("ads", "\u540C\u610F\u72B6\u614B\u306B\u3088\u308A\u5E83\u544A\u306A\u3057");
            return;
          }
          if (ports.ads.requestTrackingIfNeeded) await ports.ads.requestTrackingIfNeeded();
          await ports.ads.initialize({ initializeForTesting: config.ads.mode === "test" });
          adsReady = true;
          listeners.push(await ports.ads.onInterstitialDismissed(() => {
            void finishInterstitial().catch((e) => console.error("[MyProf ad dismissal]", e));
          }));
          listeners.push(await ports.ads.onInterstitialFailed(() => {
            void finishInterstitial().catch((e) => console.error("[MyProf ad failure]", e));
          }));
          stopSchedule = schedule(() => {
            void prepareIfNeeded();
          });
          await syncBanner();
          await syncInline();
        } catch (e) {
          status("ads", "\u5E83\u544A\u521D\u671F\u5316\u5931\u6557");
          throw e;
        }
      },
      async setModalOpen(value) {
        if (typeof value !== "boolean") throw Error("Modal state must be boolean");
        modalOpen = value;
        await syncInline();
        await syncBanner();
      },
      async setInlineVisible(value) {
        if (typeof value !== "boolean") throw Error("Inline visibility must be boolean");
        inlineWanted = value;
        await syncInline();
      },
      async onNaturalBreak(reason) {
        if (!["card-save", "section-change"].includes(reason)) throw Error("Unknown ad break");
        if (!native || owned || !adsReady || modalOpen || !foreground || interstitialShowing) return false;
        const ready = interstitialReady;
        if (!ready || activeMs() < nextAllowedActive) {
          void prepareIfNeeded();
          return false;
        }
        interstitialReady = false;
        interstitialShowing = true;
        nextAllowedActive = activeMs() + MIN_ACTIVE_MS;
        try {
          await syncInline();
          await syncBanner();
          await ports.ads.showInterstitial();
          return true;
        } catch (e) {
          await finishInterstitial();
          console.warn("[MyProf interstitial skipped]", e);
          return false;
        }
      },
      setForeground,
      async checkPrefetch() {
        await prepareIfNeeded();
      },
      async buyRemoveAds() {
        if (!native || !config.purchase.enabled || !purchaseReady) throw Error("App Store\u306E\u5E83\u544A\u524A\u9664\u306F\u516C\u958B\u6E96\u5099\u4E2D\u3067\u3059");
        if (!owned) await ports.purchase.order(config.purchase.removeAdsProductId);
      },
      async restore() {
        if (!native || !config.purchase.enabled || !purchaseReady) throw Error("\u8CFC\u5165\u5FA9\u5143\u306FApp Store\u516C\u958B\u5F8C\u306B\u5229\u7528\u3067\u304D\u307E\u3059");
        await ports.purchase.restore();
        if (ports.purchase.owned(config.purchase.removeAdsProductId)) await ownedChange();
      },
      async privacyOptions() {
        if (!native || config.ads.mode === "disabled") throw Error("iPhone\u7248\u306E\u5E83\u544A\u8A2D\u5B9A\u304B\u3089\u5229\u7528\u3067\u304D\u307E\u3059");
        await ports.ads.showPrivacyOptionsForm();
      },
      snapshot: () => ({ owned, adsReady, bannerVisible, modalOpen, inlineWanted, inlineDisplayed, interstitialReady, interstitialShowing, activeMs: activeMs(), nextAllowedActive })
    };
  }

  // src/lib/profile.mjs
  var DEFAULT_PROFILE = () => ({
    version: 1,
    name: "",
    nickname: "",
    birthDate: "",
    bloodType: "",
    birthplace: "",
    postalCode: "",
    prefecture: "",
    city: "",
    street: "",
    building: "",
    emails: [],
    notes: "",
    avatarIcon: "\u{1F33F}",
    avatarPhoto: "",
    backgroundColor: "#eff6f0",
    backgroundPhoto: "",
    educationSeeded: false,
    events: []
  });
  var ICONS = ["\u{1F33F}", "\u{1F408}", "\u{1F338}", "\u2B50", "\u{1F340}", "\u{1F43B}", "\u{1F319}", "\u{1F98A}", "\u{1F43C}", "\u{1F430}", "\u2600\uFE0F", "\u{1F98B}"];
  var BG_COLORS = ["#eff6f0", "#eaf2fb", "#fceee9", "#fbf3db", "#f3eefa", "#eff5f4", "#f7f0ec", "#283947"];
  function isDate(v) {
    if (typeof v !== "string" || !/^\d{4}-\d\d-\d\d$/.test(v)) return false;
    const [y, m, d] = v.split("-").map(Number), n = new Date(Date.UTC(y, m - 1, d));
    return y >= 1900 && y <= 2100 && n.getUTCFullYear() === y && n.getUTCMonth() === m - 1 && n.getUTCDate() === d;
  }
  function validateProfile(x) {
    if (!x || typeof x !== "object" || Array.isArray(x) || x.version !== 1) throw Error("\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u5F62\u5F0F\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    for (const key of ["name", "nickname", "birthDate", "bloodType", "birthplace", "postalCode", "prefecture", "city", "street", "building", "notes", "avatarIcon", "avatarPhoto", "backgroundColor", "backgroundPhoto"])
      if (typeof x[key] !== "string") throw Error("\u9805\u76EE\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093: " + key);
    if (x.birthDate && !isDate(x.birthDate)) throw Error("\u751F\u5E74\u6708\u65E5\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    if (!Array.isArray(x.emails) || x.emails.length > 30 || !x.emails.every((e) => e && typeof e.id === "string" && typeof e.label === "string" && typeof e.address === "string" && e.label.length <= 60 && e.address.length <= 320)) throw Error("\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u306E\u30C7\u30FC\u30BF\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    if (!Array.isArray(x.events) || x.events.length > 300 || !x.events.every((e) => e && typeof e.id === "string" && typeof e.title === "string" && e.title.length <= 150 && isDate(e.date) && typeof e.note === "string" && e.note.length <= 2e3 && (e.category === void 0 || ["education", "work", "life"].includes(e.category)))) throw Error("\u5E74\u8868\u30C7\u30FC\u30BF\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    if (typeof x.educationSeeded !== "boolean") throw Error("\u5E74\u8868\u306E\u521D\u671F\u5316\u72B6\u614B\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    if (x.avatarPhoto.length > 35e4 || x.backgroundPhoto.length > 13e5) throw Error("\u753B\u50CF\u304C\u5927\u304D\u3059\u304E\u307E\u3059");
    for (const field of ["avatarPhoto", "backgroundPhoto"]) {
      if (x[field] && !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(x[field])) throw Error("\u753B\u50CF\u5F62\u5F0F\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    }
    if (!/^#[a-fA-F0-9]{6}$/.test(x.backgroundColor)) throw Error("\u80CC\u666F\u8272\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    return x;
  }
  function makeId() {
    return globalThis.crypto?.randomUUID?.() ?? "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }
  function homeAddress(p) {
    return [p.prefecture, p.city, p.street].filter(Boolean).join("") + (p.building ? (p.prefecture || p.city || p.street ? " " : "") + p.building : "");
  }
  function ageAt(birthday, on) {
    if (!isDate(birthday) || !isDate(on)) return null;
    const [by, bm, bd] = birthday.split("-").map(Number), [y, m, d] = on.split("-").map(Number);
    return y - by - (m < bm || m === bm && d < bd ? 1 : 0);
  }
  function todayLocal(d = /* @__PURE__ */ new Date()) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function japaneseEra(date) {
    if (!isDate(date)) return date;
    const eras = [["2019-05-01", "\u4EE4\u548C", 2018], ["1989-01-08", "\u5E73\u6210", 1988], ["1926-12-25", "\u662D\u548C", 1925], ["1912-07-30", "\u5927\u6B63", 1911], ["1868-01-25", "\u660E\u6CBB", 1867]];
    const e = eras.find((x) => date >= x[0]);
    if (!e) return "\u897F\u66A6" + date.slice(0, 4) + "\u5E74";
    const n = Number(date.slice(0, 4)) - e[2];
    return e[1] + (n === 1 ? "\u5143" : n) + "\u5E74";
  }
  function lifeFacts(birth, at = todayLocal()) {
    if (!isDate(birth)) return null;
    const [y, m, d] = birth.split("-").map(Number), nowY = Number(at.slice(0, 4));
    let nextY = at.slice(5) >= birth.slice(5) ? nowY + 1 : nowY;
    let nextDate = nextY + birth.slice(4);
    if (!isDate(nextDate)) nextDate = nextY + "-02-28";
    const days = at.slice(5) === birth.slice(5) ? 0 : Math.round((Date.parse(nextDate + "T00:00:00Z") - Date.parse(at + "T00:00:00Z")) / 864e5);
    const animals = "\u5B50\u4E11\u5BC5\u536F\u8FB0\u5DF3\u5348\u672A\u7533\u9149\u620C\u4EA5";
    const zodiac = ["\u3084\u304E\u5EA7", "\u307F\u305A\u304C\u3081\u5EA7", "\u3046\u304A\u5EA7", "\u304A\u3072\u3064\u3058\u5EA7", "\u304A\u3046\u3057\u5EA7", "\u3075\u305F\u3054\u5EA7", "\u304B\u306B\u5EA7", "\u3057\u3057\u5EA7", "\u304A\u3068\u3081\u5EA7", "\u3066\u3093\u3073\u3093\u5EA7", "\u3055\u305D\u308A\u5EA7", "\u3044\u3066\u5EA7"];
    const md = m * 100 + d;
    const signBoundaries = [[120, 1], [219, 2], [321, 3], [420, 4], [521, 5], [621, 6], [723, 7], [823, 8], [923, 9], [1023, 10], [1122, 11], [1222, 0]];
    let z = 0;
    for (const [day, index] of signBoundaries) if (md >= day) z = index;
    const week = ["\u65E5\u66DC\u65E5", "\u6708\u66DC\u65E5", "\u706B\u66DC\u65E5", "\u6C34\u66DC\u65E5", "\u6728\u66DC\u65E5", "\u91D1\u66DC\u65E5", "\u571F\u66DC\u65E5"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    const lived = Math.round((Date.parse(at + "T00:00:00Z") - Date.parse(birth + "T00:00:00Z")) / 864e5);
    return { full: ageAt(birth, at), count: nowY - y + 1, turning: nowY - y, animal: animals[(y - 4) % 12], sign: zodiac[z], week, daysUntil: days, lived, bornEra: japaneseEra(birth) };
  }
  function schoolSuggestions(birth) {
    if (!isDate(birth)) return [];
    const [y, m, d] = birth.split("-").map(Number), entry = y + (m < 4 || m === 4 && d <= 1 ? 6 : 7);
    return [
      ["\u5C0F\u5B66\u6821\u5165\u5B66", entry, "04-01"],
      ["\u5C0F\u5B66\u6821\u5352\u696D", entry + 6, "03-31"],
      ["\u4E2D\u5B66\u6821\u5165\u5B66", entry + 6, "04-01"],
      ["\u4E2D\u5B66\u6821\u5352\u696D", entry + 9, "03-31"],
      ["\u9AD8\u6821\u5165\u5B66", entry + 9, "04-01"],
      ["\u9AD8\u6821\u5352\u696D", entry + 12, "03-31"],
      ["\u5927\u5B66\u5165\u5B66\uFF084\u5E74\u5236\u306E\u4F8B\uFF09", entry + 12, "04-01"],
      ["\u5927\u5B66\u5352\u696D\uFF084\u5E74\u5236\u306E\u4F8B\uFF09", entry + 16, "03-31"]
    ].map(([title, year, md]) => ({ title, date: year + "-" + md, note: "\u6A19\u6E96\u7684\u306A\u9032\u5B66\u306E\u5834\u5408\u306E\u76EE\u5B89\u3002\u81EA\u7531\u306B\u7DE8\u96C6\u30FB\u524A\u9664\u3067\u304D\u307E\u3059\u3002", category: "education" }));
  }
  function milestoneYears(birth, at = todayLocal()) {
    if (!isDate(birth)) return [];
    const y = Number(birth.slice(0, 4)), current = Number(at.slice(0, 4));
    return [["30\u6B73", 30], ["40\u6B73", 40], ["\u9084\u66A6", 60], ["\u53E4\u5E0C", 70], ["\u559C\u5BFF", 77], ["\u5098\u5BFF", 80], ["\u7C73\u5BFF", 88], ["\u5352\u5BFF", 90], ["\u767D\u5BFF", 99], ["\u767E\u5BFF", 100]].map(([title, a]) => ({ title, year: y + a })).filter((x) => x.year >= current).slice(0, 5);
  }
  function upcomingYakudoshi(birth, from = todayLocal()) {
    if (!isDate(birth) || !isDate(from)) return [];
    const y = Number(birth.slice(0, 4)), todayYear = Number(from.slice(0, 4));
    return Object.entries({ \u7537\u6027: [25, 42, 61], \u5973\u6027: [19, 33, 37, 61] }).map(([label, targets]) => {
      const possibilities = targets.flatMap((t) => [{ year: y + t - 2, phase: "\u524D\u5384" }, { year: y + t - 1, phase: "\u672C\u5384" }, { year: y + t, phase: "\u5F8C\u5384" }]).filter((x) => x.year >= todayYear).sort((a, b) => a.year - b.year);
      return { label, next: possibilities[0] ?? null };
    });
  }
  function reconcileEducationDates(previous, birthDate, createId = makeId) {
    validateProfile(previous);
    if (!isDate(birthDate)) throw Error("\u6B63\u3057\u3044\u751F\u5E74\u6708\u65E5\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044");
    if (typeof createId !== "function") throw Error("ID\u751F\u6210\u95A2\u6570\u304C\u5FC5\u8981\u3067\u3059");
    if (!previous.educationSeeded) {
      const generated = schoolSuggestions(birthDate).map((x) => ({ ...x, id: createId() }));
      return { educationSeeded: true, events: [...previous.events, ...generated], updated: generated.length };
    }
    if (previous.birthDate === birthDate || !isDate(previous.birthDate))
      return { educationSeeded: previous.educationSeeded, events: previous.events.map((e) => ({ ...e })), updated: 0 };
    const before = schoolSuggestions(previous.birthDate), after = schoolSuggestions(birthDate);
    const changes = new Map(before.map((s2, i) => [JSON.stringify([s2.title, s2.date, s2.note]), after[i]]));
    let updated = 0;
    const events = previous.events.map((e) => {
      const replacement = changes.get(JSON.stringify([e.title, e.date, e.note]));
      if (!replacement || e.date === replacement.date) return { ...e };
      updated++;
      return { ...e, date: replacement.date };
    });
    return { educationSeeded: true, events, updated };
  }

  // node_modules/astronomy-engine/esm/astronomy.js
  var C_AUDAY = 173.1446326846693;
  var KM_PER_AU = 14959787069098932e-8;
  var DEG2RAD = 0.017453292519943295;
  var RAD2DEG = 57.29577951308232;
  var DAYS_PER_TROPICAL_YEAR = 365.24217;
  var J2000 = /* @__PURE__ */ new Date("2000-01-01T12:00:00Z");
  var PI2 = 2 * Math.PI;
  var ARC = 3600 * (180 / Math.PI);
  var ASEC2RAD = 484813681109536e-20;
  var ASEC180 = 180 * 60 * 60;
  var ASEC360 = 2 * ASEC180;
  var AU_PER_PARSEC = ASEC180 / Math.PI;
  var SUN_MAG_1AU = -0.17 - 5 * Math.log10(AU_PER_PARSEC);
  var MEAN_SYNODIC_MONTH = 29.530588;
  var SECONDS_PER_DAY = 24 * 3600;
  var MILLIS_PER_DAY = SECONDS_PER_DAY * 1e3;
  var SUN_RADIUS_KM = 695700;
  var SUN_RADIUS_AU = SUN_RADIUS_KM / KM_PER_AU;
  var EARTH_FLATTENING = 0.996647180302104;
  var EARTH_FLATTENING_SQUARED = EARTH_FLATTENING * EARTH_FLATTENING;
  var EARTH_EQUATORIAL_RADIUS_KM = 6378.1366;
  var EARTH_EQUATORIAL_RADIUS_AU = EARTH_EQUATORIAL_RADIUS_KM / KM_PER_AU;
  var EARTH_POLAR_RADIUS_KM = EARTH_EQUATORIAL_RADIUS_KM * EARTH_FLATTENING;
  var EARTH_MEAN_RADIUS_KM = 6371;
  var EARTH_ATMOSPHERE_KM = 88;
  var EARTH_ECLIPSE_RADIUS_KM = EARTH_MEAN_RADIUS_KM + EARTH_ATMOSPHERE_KM;
  var MOON_EQUATORIAL_RADIUS_KM = 1738.1;
  var MOON_EQUATORIAL_RADIUS_AU = MOON_EQUATORIAL_RADIUS_KM / KM_PER_AU;
  var MOON_POLAR_RADIUS_KM = 1736;
  var MOON_POLAR_RADIUS_AU = MOON_POLAR_RADIUS_KM / KM_PER_AU;
  var REFRACTION_NEAR_HORIZON = 34 / 60;
  var EARTH_MOON_MASS_RATIO = 81.30056;
  var SUN_GM = 2959122082855911e-19;
  var EARTH_GM = 8887692390113509e-25;
  var JUPITER_GM = 2825345909524226e-22;
  var SATURN_GM = 8459715185680659e-23;
  var URANUS_GM = 1292024916781969e-23;
  var NEPTUNE_GM = 1524358900784276e-23;
  var MOON_GM = EARTH_GM / EARTH_MOON_MASS_RATIO;
  function VerifyBoolean(b) {
    if (b !== true && b !== false) {
      console.trace();
      throw `Value is not boolean: ${b}`;
    }
    return b;
  }
  function VerifyNumber(x) {
    if (!Number.isFinite(x)) {
      console.trace();
      throw `Value is not a finite number: ${x}`;
    }
    return x;
  }
  function Frac(x) {
    return x - Math.floor(x);
  }
  var Body;
  (function(Body2) {
    Body2["Sun"] = "Sun";
    Body2["Moon"] = "Moon";
    Body2["Mercury"] = "Mercury";
    Body2["Venus"] = "Venus";
    Body2["Earth"] = "Earth";
    Body2["Mars"] = "Mars";
    Body2["Jupiter"] = "Jupiter";
    Body2["Saturn"] = "Saturn";
    Body2["Uranus"] = "Uranus";
    Body2["Neptune"] = "Neptune";
    Body2["Pluto"] = "Pluto";
    Body2["SSB"] = "SSB";
    Body2["EMB"] = "EMB";
    Body2["Star1"] = "Star1";
    Body2["Star2"] = "Star2";
    Body2["Star3"] = "Star3";
    Body2["Star4"] = "Star4";
    Body2["Star5"] = "Star5";
    Body2["Star6"] = "Star6";
    Body2["Star7"] = "Star7";
    Body2["Star8"] = "Star8";
  })(Body || (Body = {}));
  var StarList = [
    Body.Star1,
    Body.Star2,
    Body.Star3,
    Body.Star4,
    Body.Star5,
    Body.Star6,
    Body.Star7,
    Body.Star8
  ];
  var StarTable = [
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 }
  ];
  function GetStar(body) {
    const index = StarList.indexOf(body);
    return index >= 0 ? StarTable[index] : null;
  }
  function UserDefinedStar(body) {
    const star = GetStar(body);
    return star && star.dist > 0 ? star : null;
  }
  var PrecessDirection;
  (function(PrecessDirection2) {
    PrecessDirection2[PrecessDirection2["From2000"] = 0] = "From2000";
    PrecessDirection2[PrecessDirection2["Into2000"] = 1] = "Into2000";
  })(PrecessDirection || (PrecessDirection = {}));
  var vsop = {
    Mercury: [
      [
        [
          [4.40250710144, 0, 0],
          [0.40989414977, 1.48302034195, 26087.9031415742],
          [0.050462942, 4.47785489551, 52175.8062831484],
          [0.00855346844, 1.16520322459, 78263.70942472259],
          [0.00165590362, 4.11969163423, 104351.61256629678],
          [34561897e-11, 0.77930768443, 130439.51570787099],
          [7583476e-11, 3.71348404924, 156527.41884944518]
        ],
        [
          [26087.90313685529, 0, 0],
          [0.01131199811, 6.21874197797, 26087.9031415742],
          [0.00292242298, 3.04449355541, 52175.8062831484],
          [75775081e-11, 6.08568821653, 78263.70942472259],
          [19676525e-11, 2.80965111777, 104351.61256629678]
        ]
      ],
      [
        [
          [0.11737528961, 1.98357498767, 26087.9031415742],
          [0.02388076996, 5.03738959686, 52175.8062831484],
          [0.01222839532, 3.14159265359, 0],
          [0.0054325181, 1.79644363964, 78263.70942472259],
          [0.0012977877, 4.83232503958, 104351.61256629678],
          [31866927e-11, 1.58088495658, 130439.51570787099],
          [7963301e-11, 4.60972126127, 156527.41884944518]
        ],
        [
          [0.00274646065, 3.95008450011, 26087.9031415742],
          [99737713e-11, 3.14159265359, 0]
        ]
      ],
      [
        [
          [0.39528271651, 0, 0],
          [0.07834131818, 6.19233722598, 26087.9031415742],
          [0.00795525558, 2.95989690104, 52175.8062831484],
          [0.00121281764, 6.01064153797, 78263.70942472259],
          [21921969e-11, 2.77820093972, 104351.61256629678],
          [4354065e-11, 5.82894543774, 130439.51570787099]
        ],
        [
          [0.0021734774, 4.65617158665, 26087.9031415742],
          [44141826e-11, 1.42385544001, 52175.8062831484]
        ]
      ]
    ],
    Venus: [
      [
        [
          [3.17614666774, 0, 0],
          [0.01353968419, 5.59313319619, 10213.285546211],
          [89891645e-11, 5.30650047764, 20426.571092422],
          [5477194e-11, 4.41630661466, 7860.4193924392],
          [3455741e-11, 2.6996444782, 11790.6290886588],
          [2372061e-11, 2.99377542079, 3930.2096962196],
          [1317168e-11, 5.18668228402, 26.2983197998],
          [1664146e-11, 4.25018630147, 1577.3435424478],
          [1438387e-11, 4.15745084182, 9683.5945811164],
          [1200521e-11, 6.15357116043, 30639.856638633]
        ],
        [
          [10213.28554621638, 0, 0],
          [95617813e-11, 2.4640651111, 10213.285546211],
          [7787201e-11, 0.6247848222, 20426.571092422]
        ]
      ],
      [
        [
          [0.05923638472, 0.26702775812, 10213.285546211],
          [40107978e-11, 1.14737178112, 20426.571092422],
          [32814918e-11, 3.14159265359, 0]
        ],
        [
          [0.00287821243, 1.88964962838, 10213.285546211]
        ]
      ],
      [
        [
          [0.72334820891, 0, 0],
          [0.00489824182, 4.02151831717, 10213.285546211],
          [1658058e-11, 4.90206728031, 20426.571092422],
          [1378043e-11, 1.12846591367, 11790.6290886588],
          [1632096e-11, 2.84548795207, 7860.4193924392],
          [498395e-11, 2.58682193892, 9683.5945811164],
          [221985e-11, 2.01346696541, 19367.1891622328],
          [237454e-11, 2.55136053886, 15720.8387848784]
        ],
        [
          [34551041e-11, 0.89198706276, 10213.285546211]
        ]
      ]
    ],
    Earth: [
      [
        [
          [1.75347045673, 0, 0],
          [0.03341656453, 4.66925680415, 6283.0758499914],
          [34894275e-11, 4.62610242189, 12566.1516999828],
          [3417572e-11, 2.82886579754, 3.523118349],
          [3497056e-11, 2.74411783405, 5753.3848848968],
          [3135899e-11, 3.62767041756, 77713.7714681205],
          [2676218e-11, 4.41808345438, 7860.4193924392],
          [2342691e-11, 6.13516214446, 3930.2096962196],
          [1273165e-11, 2.03709657878, 529.6909650946],
          [1324294e-11, 0.74246341673, 11506.7697697936],
          [901854e-11, 2.04505446477, 26.2983197998],
          [1199167e-11, 1.10962946234, 1577.3435424478],
          [857223e-11, 3.50849152283, 398.1490034082],
          [779786e-11, 1.17882681962, 5223.6939198022],
          [99025e-10, 5.23268072088, 5884.9268465832],
          [753141e-11, 2.53339052847, 5507.5532386674],
          [505267e-11, 4.58292599973, 18849.2275499742],
          [492392e-11, 4.20505711826, 775.522611324],
          [356672e-11, 2.91954114478, 0.0673103028],
          [284125e-11, 1.89869240932, 796.2980068164],
          [242879e-11, 0.34481445893, 5486.777843175],
          [317087e-11, 5.84901948512, 11790.6290886588],
          [271112e-11, 0.31486255375, 10977.078804699],
          [206217e-11, 4.80646631478, 2544.3144198834],
          [205478e-11, 1.86953770281, 5573.1428014331],
          [202318e-11, 2.45767790232, 6069.7767545534],
          [126225e-11, 1.08295459501, 20.7753954924],
          [155516e-11, 0.83306084617, 213.299095438]
        ],
        [
          [6283.0758499914, 0, 0],
          [0.00206058863, 2.67823455808, 6283.0758499914],
          [4303419e-11, 2.63512233481, 12566.1516999828]
        ],
        [
          [8721859e-11, 1.07253635559, 6283.0758499914]
        ]
      ],
      [
        [],
        [
          [0.00227777722, 3.4137662053, 6283.0758499914],
          [3805678e-11, 3.37063423795, 12566.1516999828]
        ]
      ],
      [
        [
          [1.00013988784, 0, 0],
          [0.01670699632, 3.09846350258, 6283.0758499914],
          [13956024e-11, 3.05524609456, 12566.1516999828],
          [308372e-10, 5.19846674381, 77713.7714681205],
          [1628463e-11, 1.17387558054, 5753.3848848968],
          [1575572e-11, 2.84685214877, 7860.4193924392],
          [924799e-11, 5.45292236722, 11506.7697697936],
          [542439e-11, 4.56409151453, 3930.2096962196],
          [47211e-10, 3.66100022149, 5884.9268465832],
          [85831e-11, 1.27079125277, 161000.6857376741],
          [57056e-11, 2.01374292245, 83996.84731811189],
          [55736e-11, 5.2415979917, 71430.69561812909],
          [174844e-11, 3.01193636733, 18849.2275499742],
          [243181e-11, 4.2734953079, 11790.6290886588]
        ],
        [
          [0.00103018607, 1.10748968172, 6283.0758499914],
          [1721238e-11, 1.06442300386, 12566.1516999828]
        ],
        [
          [4359385e-11, 5.78455133808, 6283.0758499914]
        ]
      ]
    ],
    Mars: [
      [
        [
          [6.20347711581, 0, 0],
          [0.18656368093, 5.0503710027, 3340.6124266998],
          [0.01108216816, 5.40099836344, 6681.2248533996],
          [91798406e-11, 5.75478744667, 10021.8372800994],
          [27744987e-11, 5.97049513147, 3.523118349],
          [10610235e-11, 2.93958560338, 2281.2304965106],
          [12315897e-11, 0.84956094002, 2810.9214616052],
          [8926784e-11, 4.15697846427, 0.0172536522],
          [8715691e-11, 6.11005153139, 13362.4497067992],
          [6797556e-11, 0.36462229657, 398.1490034082],
          [7774872e-11, 3.33968761376, 5621.8429232104],
          [3575078e-11, 1.6618650571, 2544.3144198834],
          [4161108e-11, 0.22814971327, 2942.4634232916],
          [3075252e-11, 0.85696614132, 191.4482661116],
          [2628117e-11, 0.64806124465, 3337.0893083508],
          [2937546e-11, 6.07893711402, 0.0673103028],
          [2389414e-11, 5.03896442664, 796.2980068164],
          [2579844e-11, 0.02996736156, 3344.1355450488],
          [1528141e-11, 1.14979301996, 6151.533888305],
          [1798806e-11, 0.65634057445, 529.6909650946],
          [1264357e-11, 3.62275122593, 5092.1519581158],
          [1286228e-11, 3.06796065034, 2146.1654164752],
          [1546404e-11, 2.91579701718, 1751.539531416],
          [1024902e-11, 3.69334099279, 8962.4553499102],
          [891566e-11, 0.18293837498, 16703.062133499],
          [858759e-11, 2.4009381194, 2914.0142358238],
          [832715e-11, 2.46418619474, 3340.5951730476],
          [83272e-10, 4.49495782139, 3340.629680352],
          [712902e-11, 3.66335473479, 1059.3819301892],
          [748723e-11, 3.82248614017, 155.4203994342],
          [723861e-11, 0.67497311481, 3738.761430108],
          [635548e-11, 2.92182225127, 8432.7643848156],
          [655162e-11, 0.48864064125, 3127.3133312618],
          [550474e-11, 3.81001042328, 0.9803210682],
          [55275e-10, 4.47479317037, 1748.016413067],
          [425966e-11, 0.55364317304, 6283.0758499914],
          [415131e-11, 0.49662285038, 213.299095438],
          [472167e-11, 3.62547124025, 1194.4470102246],
          [306551e-11, 0.38052848348, 6684.7479717486],
          [312141e-11, 0.99853944405, 6677.7017350506],
          [293198e-11, 4.22131299634, 20.7753954924],
          [302375e-11, 4.48618007156, 3532.0606928114],
          [274027e-11, 0.54222167059, 3340.545116397],
          [281079e-11, 5.88163521788, 1349.8674096588],
          [231183e-11, 1.28242156993, 3870.3033917944],
          [283602e-11, 5.7688543494, 3149.1641605882],
          [236117e-11, 5.75503217933, 3333.498879699],
          [274033e-11, 0.13372524985, 3340.6797370026],
          [299395e-11, 2.78323740866, 6254.6266625236]
        ],
        [
          [3340.61242700512, 0, 0],
          [0.01457554523, 3.60433733236, 3340.6124266998],
          [0.00168414711, 3.92318567804, 6681.2248533996],
          [20622975e-11, 4.26108844583, 10021.8372800994],
          [3452392e-11, 4.7321039319, 3.523118349],
          [2586332e-11, 4.60670058555, 13362.4497067992],
          [841535e-11, 4.45864030426, 2281.2304965106]
        ],
        [
          [58152577e-11, 2.04961712429, 3340.6124266998],
          [13459579e-11, 2.45738706163, 6681.2248533996]
        ]
      ],
      [
        [
          [0.03197134986, 3.76832042431, 3340.6124266998],
          [0.00298033234, 4.10616996305, 6681.2248533996],
          [0.00289104742, 0, 0],
          [31365539e-11, 4.4465105309, 10021.8372800994],
          [34841e-9, 4.7881254926, 13362.4497067992]
        ],
        [
          [0.00217310991, 6.04472194776, 3340.6124266998],
          [20976948e-11, 3.14159265359, 0],
          [12834709e-11, 1.60810667915, 6681.2248533996]
        ]
      ],
      [
        [
          [1.53033488271, 0, 0],
          [0.1418495316, 3.47971283528, 3340.6124266998],
          [0.00660776362, 3.81783443019, 6681.2248533996],
          [46179117e-11, 4.15595316782, 10021.8372800994],
          [8109733e-11, 5.55958416318, 2810.9214616052],
          [7485318e-11, 1.77239078402, 5621.8429232104],
          [5523191e-11, 1.3643630377, 2281.2304965106],
          [382516e-10, 4.49407183687, 13362.4497067992],
          [2306537e-11, 0.09081579001, 2544.3144198834],
          [1999396e-11, 5.36059617709, 3337.0893083508],
          [2484394e-11, 4.9254563992, 2942.4634232916],
          [1960195e-11, 4.74249437639, 3344.1355450488],
          [1167119e-11, 2.11260868341, 5092.1519581158],
          [1102816e-11, 5.00908403998, 398.1490034082],
          [899066e-11, 4.40791133207, 529.6909650946],
          [992252e-11, 5.83861961952, 6151.533888305],
          [807354e-11, 2.10217065501, 1059.3819301892],
          [797915e-11, 3.44839203899, 796.2980068164],
          [740975e-11, 1.49906336885, 2146.1654164752]
        ],
        [
          [0.01107433345, 2.03250524857, 3340.6124266998],
          [0.00103175887, 2.37071847807, 6681.2248533996],
          [128772e-9, 0, 0],
          [1081588e-10, 2.70888095665, 10021.8372800994]
        ],
        [
          [44242249e-11, 0.47930604954, 3340.6124266998],
          [8138042e-11, 0.86998389204, 6681.2248533996]
        ]
      ]
    ],
    Jupiter: [
      [
        [
          [0.59954691494, 0, 0],
          [0.09695898719, 5.06191793158, 529.6909650946],
          [0.00573610142, 1.44406205629, 7.1135470008],
          [0.00306389205, 5.41734730184, 1059.3819301892],
          [97178296e-11, 4.14264726552, 632.7837393132],
          [72903078e-11, 3.64042916389, 522.5774180938],
          [64263975e-11, 3.41145165351, 103.0927742186],
          [39806064e-11, 2.29376740788, 419.4846438752],
          [38857767e-11, 1.27231755835, 316.3918696566],
          [27964629e-11, 1.7845459182, 536.8045120954],
          [1358973e-10, 5.7748104079, 1589.0728952838],
          [8246349e-11, 3.5822792584, 206.1855484372],
          [8768704e-11, 3.63000308199, 949.1756089698],
          [7368042e-11, 5.0810119427, 735.8765135318],
          [626315e-10, 0.02497628807, 213.299095438],
          [6114062e-11, 4.51319998626, 1162.4747044078],
          [4905396e-11, 1.32084470588, 110.2063212194],
          [5305285e-11, 1.30671216791, 14.2270940016],
          [5305441e-11, 4.18625634012, 1052.2683831884],
          [4647248e-11, 4.69958103684, 3.9321532631],
          [3045023e-11, 4.31676431084, 426.598190876],
          [2609999e-11, 1.56667394063, 846.0828347512],
          [2028191e-11, 1.06376530715, 3.1813937377],
          [1764763e-11, 2.14148655117, 1066.49547719],
          [1722972e-11, 3.88036268267, 1265.5674786264],
          [1920945e-11, 0.97168196472, 639.897286314],
          [1633223e-11, 3.58201833555, 515.463871093],
          [1431999e-11, 4.29685556046, 625.6701923124],
          [973272e-11, 4.09764549134, 95.9792272178]
        ],
        [
          [529.69096508814, 0, 0],
          [0.00489503243, 4.2208293947, 529.6909650946],
          [0.00228917222, 6.02646855621, 7.1135470008],
          [30099479e-11, 4.54540782858, 1059.3819301892],
          [2072092e-10, 5.45943156902, 522.5774180938],
          [12103653e-11, 0.16994816098, 536.8045120954],
          [6067987e-11, 4.42422292017, 103.0927742186],
          [5433968e-11, 3.98480737746, 419.4846438752],
          [4237744e-11, 5.89008707199, 14.2270940016]
        ],
        [
          [47233601e-11, 4.32148536482, 7.1135470008],
          [30649436e-11, 2.929777887, 529.6909650946],
          [14837605e-11, 3.14159265359, 0]
        ]
      ],
      [
        [
          [0.02268615702, 3.55852606721, 529.6909650946],
          [0.00109971634, 3.90809347197, 1059.3819301892],
          [0.00110090358, 0, 0],
          [8101428e-11, 3.60509572885, 522.5774180938],
          [6043996e-11, 4.25883108339, 1589.0728952838],
          [6437782e-11, 0.30627119215, 536.8045120954]
        ],
        [
          [78203446e-11, 1.52377859742, 529.6909650946]
        ]
      ],
      [
        [
          [5.20887429326, 0, 0],
          [0.25209327119, 3.49108639871, 529.6909650946],
          [0.00610599976, 3.84115365948, 1059.3819301892],
          [0.00282029458, 2.57419881293, 632.7837393132],
          [0.00187647346, 2.07590383214, 522.5774180938],
          [86792905e-11, 0.71001145545, 419.4846438752],
          [72062974e-11, 0.21465724607, 536.8045120954],
          [65517248e-11, 5.9799588479, 316.3918696566],
          [29134542e-11, 1.67759379655, 103.0927742186],
          [30135335e-11, 2.16132003734, 949.1756089698],
          [23453271e-11, 3.54023522184, 735.8765135318],
          [22283743e-11, 4.19362594399, 1589.0728952838],
          [23947298e-11, 0.2745803748, 7.1135470008],
          [13032614e-11, 2.96042965363, 1162.4747044078],
          [970336e-10, 1.90669633585, 206.1855484372],
          [12749023e-11, 2.71550286592, 1052.2683831884],
          [7057931e-11, 2.18184839926, 1265.5674786264],
          [6137703e-11, 6.26418240033, 846.0828347512],
          [2616976e-11, 2.00994012876, 1581.959348283]
        ],
        [
          [0.0127180152, 2.64937512894, 529.6909650946],
          [61661816e-11, 3.00076460387, 1059.3819301892],
          [53443713e-11, 3.89717383175, 522.5774180938],
          [31185171e-11, 4.88276958012, 536.8045120954],
          [41390269e-11, 0, 0]
        ]
      ]
    ],
    Saturn: [
      [
        [
          [0.87401354025, 0, 0],
          [0.11107659762, 3.96205090159, 213.299095438],
          [0.01414150957, 4.58581516874, 7.1135470008],
          [0.00398379389, 0.52112032699, 206.1855484372],
          [0.00350769243, 3.30329907896, 426.598190876],
          [0.00206816305, 0.24658372002, 103.0927742186],
          [792713e-9, 3.84007056878, 220.4126424388],
          [23990355e-11, 4.66976924553, 110.2063212194],
          [16573588e-11, 0.43719228296, 419.4846438752],
          [14906995e-11, 5.76903183869, 316.3918696566],
          [1582029e-10, 0.93809155235, 632.7837393132],
          [14609559e-11, 1.56518472, 3.9321532631],
          [13160301e-11, 4.44891291899, 14.2270940016],
          [15053543e-11, 2.71669915667, 639.897286314],
          [13005299e-11, 5.98119023644, 11.0457002639],
          [10725067e-11, 3.12939523827, 202.2533951741],
          [5863206e-11, 0.23656938524, 529.6909650946],
          [5227757e-11, 4.20783365759, 3.1813937377],
          [6126317e-11, 1.76328667907, 277.0349937414],
          [5019687e-11, 3.17787728405, 433.7117378768],
          [459255e-10, 0.61977744975, 199.0720014364],
          [4005867e-11, 2.24479718502, 63.7358983034],
          [2953796e-11, 0.98280366998, 95.9792272178],
          [387367e-10, 3.22283226966, 138.5174968707],
          [2461186e-11, 2.03163875071, 735.8765135318],
          [3269484e-11, 0.77492638211, 949.1756089698],
          [1758145e-11, 3.2658010994, 522.5774180938],
          [1640172e-11, 5.5050445305, 846.0828347512],
          [1391327e-11, 4.02333150505, 323.5054166574],
          [1580648e-11, 4.37265307169, 309.2783226558],
          [1123498e-11, 2.83726798446, 415.5524906121],
          [1017275e-11, 3.71700135395, 227.5261894396],
          [848642e-11, 3.1915017083, 209.3669421749]
        ],
        [
          [213.2990952169, 0, 0],
          [0.01297370862, 1.82834923978, 213.299095438],
          [0.00564345393, 2.88499717272, 7.1135470008],
          [93734369e-11, 1.06311793502, 426.598190876],
          [0.00107674962, 2.27769131009, 206.1855484372],
          [40244455e-11, 2.04108104671, 220.4126424388],
          [19941774e-11, 1.2795439047, 103.0927742186],
          [10511678e-11, 2.7488034213, 14.2270940016],
          [6416106e-11, 0.38238295041, 639.897286314],
          [4848994e-11, 2.43037610229, 419.4846438752],
          [4056892e-11, 2.92133209468, 110.2063212194],
          [3768635e-11, 3.6496533078, 3.9321532631]
        ],
        [
          [0.0011644133, 1.17988132879, 7.1135470008],
          [91841837e-11, 0.0732519584, 213.299095438],
          [36661728e-11, 0, 0],
          [15274496e-11, 4.06493179167, 206.1855484372]
        ]
      ],
      [
        [
          [0.04330678039, 3.60284428399, 213.299095438],
          [0.00240348302, 2.85238489373, 426.598190876],
          [84745939e-11, 0, 0],
          [30863357e-11, 3.48441504555, 220.4126424388],
          [34116062e-11, 0.57297307557, 206.1855484372],
          [1473407e-10, 2.11846596715, 639.897286314],
          [9916667e-11, 5.79003188904, 419.4846438752],
          [6993564e-11, 4.7360468972, 7.1135470008],
          [4807588e-11, 5.43305312061, 316.3918696566]
        ],
        [
          [0.00198927992, 4.93901017903, 213.299095438],
          [36947916e-11, 3.14159265359, 0],
          [17966989e-11, 0.5197943111, 426.598190876]
        ]
      ],
      [
        [
          [9.55758135486, 0, 0],
          [0.52921382865, 2.39226219573, 213.299095438],
          [0.01873679867, 5.2354960466, 206.1855484372],
          [0.01464663929, 1.64763042902, 426.598190876],
          [0.00821891141, 5.93520042303, 316.3918696566],
          [0.00547506923, 5.0153261898, 103.0927742186],
          [0.0037168465, 2.27114821115, 220.4126424388],
          [0.00361778765, 3.13904301847, 7.1135470008],
          [0.00140617506, 5.70406606781, 632.7837393132],
          [0.00108974848, 3.29313390175, 110.2063212194],
          [69006962e-11, 5.94099540992, 419.4846438752],
          [61053367e-11, 0.94037691801, 639.897286314],
          [48913294e-11, 1.55733638681, 202.2533951741],
          [34143772e-11, 0.19519102597, 277.0349937414],
          [32401773e-11, 5.47084567016, 949.1756089698],
          [20936596e-11, 0.46349251129, 735.8765135318],
          [9796004e-11, 5.20477537945, 1265.5674786264],
          [11993338e-11, 5.98050967385, 846.0828347512],
          [208393e-9, 1.52102476129, 433.7117378768],
          [15298404e-11, 3.0594381494, 529.6909650946],
          [6465823e-11, 0.17732249942, 1052.2683831884],
          [11380257e-11, 1.7310542704, 522.5774180938],
          [3419618e-11, 4.94550542171, 1581.959348283]
        ],
        [
          [0.0618298134, 0.2584351148, 213.299095438],
          [0.00506577242, 0.71114625261, 206.1855484372],
          [0.00341394029, 5.79635741658, 426.598190876],
          [0.00188491195, 0.47215589652, 220.4126424388],
          [0.00186261486, 3.14159265359, 0],
          [0.00143891146, 1.40744822888, 7.1135470008]
        ],
        [
          [0.00436902572, 4.78671677509, 213.299095438]
        ]
      ]
    ],
    Uranus: [
      [
        [
          [5.48129294297, 0, 0],
          [0.09260408234, 0.89106421507, 74.7815985673],
          [0.01504247898, 3.6271926092, 1.4844727083],
          [0.00365981674, 1.89962179044, 73.297125859],
          [0.00272328168, 3.35823706307, 149.5631971346],
          [70328461e-11, 5.39254450063, 63.7358983034],
          [68892678e-11, 6.09292483287, 76.2660712756],
          [61998615e-11, 2.26952066061, 2.9689454166],
          [61950719e-11, 2.85098872691, 11.0457002639],
          [2646877e-10, 3.14152083966, 71.8126531507],
          [25710476e-11, 6.11379840493, 454.9093665273],
          [2107885e-10, 4.36059339067, 148.0787244263],
          [17818647e-11, 1.74436930289, 36.6485629295],
          [14613507e-11, 4.73732166022, 3.9321532631],
          [11162509e-11, 5.8268179635, 224.3447957019],
          [1099791e-10, 0.48865004018, 138.5174968707],
          [9527478e-11, 2.95516862826, 35.1640902212],
          [7545601e-11, 5.236265824, 109.9456887885],
          [4220241e-11, 3.23328220918, 70.8494453042],
          [40519e-9, 2.277550173, 151.0476698429],
          [3354596e-11, 1.0654900738, 4.4534181249],
          [2926718e-11, 4.62903718891, 9.5612275556],
          [349034e-10, 5.48306144511, 146.594251718],
          [3144069e-11, 4.75199570434, 77.7505439839],
          [2922333e-11, 5.35235361027, 85.8272988312],
          [2272788e-11, 4.36600400036, 70.3281804424],
          [2051219e-11, 1.51773566586, 0.1118745846],
          [2148602e-11, 0.60745949945, 38.1330356378],
          [1991643e-11, 4.92437588682, 277.0349937414],
          [1376226e-11, 2.04283539351, 65.2203710117],
          [1666902e-11, 3.62744066769, 380.12776796],
          [1284107e-11, 3.11347961505, 202.2533951741],
          [1150429e-11, 0.93343589092, 3.1813937377],
          [1533221e-11, 2.58594681212, 52.6901980395],
          [1281604e-11, 0.54271272721, 222.8603229936],
          [1372139e-11, 4.19641530878, 111.4301614968],
          [1221029e-11, 0.1990065003, 108.4612160802],
          [946181e-11, 1.19253165736, 127.4717966068],
          [1150989e-11, 4.17898916639, 33.6796175129]
        ],
        [
          [74.7815986091, 0, 0],
          [0.00154332863, 5.24158770553, 74.7815985673],
          [24456474e-11, 1.71260334156, 1.4844727083],
          [9258442e-11, 0.4282973235, 11.0457002639],
          [8265977e-11, 1.50218091379, 63.7358983034],
          [915016e-10, 1.41213765216, 149.5631971346]
        ]
      ],
      [
        [
          [0.01346277648, 2.61877810547, 74.7815985673],
          [623414e-9, 5.08111189648, 149.5631971346],
          [61601196e-11, 3.14159265359, 0],
          [9963722e-11, 1.61603805646, 76.2660712756],
          [992616e-10, 0.57630380333, 73.297125859]
        ],
        [
          [34101978e-11, 0.01321929936, 74.7815985673]
        ]
      ],
      [
        [
          [19.21264847206, 0, 0],
          [0.88784984413, 5.60377527014, 74.7815985673],
          [0.03440836062, 0.32836099706, 73.297125859],
          [0.0205565386, 1.7829515933, 149.5631971346],
          [0.0064932241, 4.52247285911, 76.2660712756],
          [0.00602247865, 3.86003823674, 63.7358983034],
          [0.00496404167, 1.40139935333, 454.9093665273],
          [0.00338525369, 1.58002770318, 138.5174968707],
          [0.00243509114, 1.57086606044, 71.8126531507],
          [0.00190522303, 1.99809394714, 1.4844727083],
          [0.00161858838, 2.79137786799, 148.0787244263],
          [0.00143706183, 1.38368544947, 11.0457002639],
          [93192405e-11, 0.17437220467, 36.6485629295],
          [71424548e-11, 4.24509236074, 224.3447957019],
          [89806014e-11, 3.66105364565, 109.9456887885],
          [39009723e-11, 1.66971401684, 70.8494453042],
          [46677296e-11, 1.39976401694, 35.1640902212],
          [39025624e-11, 3.36234773834, 277.0349937414],
          [36755274e-11, 3.88649278513, 146.594251718],
          [30348723e-11, 0.70100838798, 151.0476698429],
          [29156413e-11, 3.180563367, 77.7505439839],
          [22637073e-11, 0.72518687029, 529.6909650946],
          [11959076e-11, 1.7504339214, 984.6003316219],
          [25620756e-11, 5.25656086672, 380.12776796]
        ],
        [
          [0.01479896629, 3.67205697578, 74.7815985673]
        ]
      ]
    ],
    Neptune: [
      [
        [
          [5.31188633046, 0, 0],
          [0.0179847553, 2.9010127389, 38.1330356378],
          [0.01019727652, 0.48580922867, 1.4844727083],
          [0.00124531845, 4.83008090676, 36.6485629295],
          [42064466e-11, 5.41054993053, 2.9689454166],
          [37714584e-11, 6.09221808686, 35.1640902212],
          [33784738e-11, 1.24488874087, 76.2660712756],
          [16482741e-11, 7727998e-11, 491.5579294568],
          [9198584e-11, 4.93747051954, 39.6175083461],
          [899425e-10, 0.27462171806, 175.1660598002]
        ],
        [
          [38.13303563957, 0, 0],
          [16604172e-11, 4.86323329249, 1.4844727083],
          [15744045e-11, 2.27887427527, 38.1330356378]
        ]
      ],
      [
        [
          [0.03088622933, 1.44104372644, 38.1330356378],
          [27780087e-11, 5.91271884599, 76.2660712756],
          [27623609e-11, 0, 0],
          [15355489e-11, 2.52123799551, 36.6485629295],
          [15448133e-11, 3.50877079215, 39.6175083461]
        ]
      ],
      [
        [
          [30.07013205828, 0, 0],
          [0.27062259632, 1.32999459377, 38.1330356378],
          [0.01691764014, 3.25186135653, 36.6485629295],
          [0.00807830553, 5.18592878704, 1.4844727083],
          [0.0053776051, 4.52113935896, 35.1640902212],
          [0.00495725141, 1.5710564165, 491.5579294568],
          [0.00274571975, 1.84552258866, 175.1660598002],
          [1201232e-10, 1.92059384991, 1021.2488945514],
          [0.00121801746, 5.79754470298, 76.2660712756],
          [0.00100896068, 0.3770272493, 73.297125859],
          [0.00135134092, 3.37220609835, 39.6175083461],
          [7571796e-11, 1.07149207335, 388.4651552382]
        ]
      ]
    ]
  };
  function DeltaT_EspenakMeeus(ut) {
    var u2, u22, u3, u4, u5, u6, u7;
    const y = 2e3 + (ut - 14) / DAYS_PER_TROPICAL_YEAR;
    if (y < -500) {
      u2 = (y - 1820) / 100;
      return -20 + 32 * u2 * u2;
    }
    if (y < 500) {
      u2 = y / 100;
      u22 = u2 * u2;
      u3 = u2 * u22;
      u4 = u22 * u22;
      u5 = u22 * u3;
      u6 = u3 * u3;
      return 10583.6 - 1014.41 * u2 + 33.78311 * u22 - 5.952053 * u3 - 0.1798452 * u4 + 0.022174192 * u5 + 0.0090316521 * u6;
    }
    if (y < 1600) {
      u2 = (y - 1e3) / 100;
      u22 = u2 * u2;
      u3 = u2 * u22;
      u4 = u22 * u22;
      u5 = u22 * u3;
      u6 = u3 * u3;
      return 1574.2 - 556.01 * u2 + 71.23472 * u22 + 0.319781 * u3 - 0.8503463 * u4 - 5050998e-9 * u5 + 0.0083572073 * u6;
    }
    if (y < 1700) {
      u2 = y - 1600;
      u22 = u2 * u2;
      u3 = u2 * u22;
      return 120 - 0.9808 * u2 - 0.01532 * u22 + u3 / 7129;
    }
    if (y < 1800) {
      u2 = y - 1700;
      u22 = u2 * u2;
      u3 = u2 * u22;
      u4 = u22 * u22;
      return 8.83 + 0.1603 * u2 - 59285e-7 * u22 + 13336e-8 * u3 - u4 / 1174e3;
    }
    if (y < 1860) {
      u2 = y - 1800;
      u22 = u2 * u2;
      u3 = u2 * u22;
      u4 = u22 * u22;
      u5 = u22 * u3;
      u6 = u3 * u3;
      u7 = u3 * u4;
      return 13.72 - 0.332447 * u2 + 68612e-7 * u22 + 41116e-7 * u3 - 37436e-8 * u4 + 121272e-10 * u5 - 1699e-10 * u6 + 875e-12 * u7;
    }
    if (y < 1900) {
      u2 = y - 1860;
      u22 = u2 * u2;
      u3 = u2 * u22;
      u4 = u22 * u22;
      u5 = u22 * u3;
      return 7.62 + 0.5737 * u2 - 0.251754 * u22 + 0.01680668 * u3 - 4473624e-10 * u4 + u5 / 233174;
    }
    if (y < 1920) {
      u2 = y - 1900;
      u22 = u2 * u2;
      u3 = u2 * u22;
      u4 = u22 * u22;
      return -2.79 + 1.494119 * u2 - 0.0598939 * u22 + 61966e-7 * u3 - 197e-6 * u4;
    }
    if (y < 1941) {
      u2 = y - 1920;
      u22 = u2 * u2;
      u3 = u2 * u22;
      return 21.2 + 0.84493 * u2 - 0.0761 * u22 + 20936e-7 * u3;
    }
    if (y < 1961) {
      u2 = y - 1950;
      u22 = u2 * u2;
      u3 = u2 * u22;
      return 29.07 + 0.407 * u2 - u22 / 233 + u3 / 2547;
    }
    if (y < 1986) {
      u2 = y - 1975;
      u22 = u2 * u2;
      u3 = u2 * u22;
      return 45.45 + 1.067 * u2 - u22 / 260 - u3 / 718;
    }
    if (y < 2005) {
      u2 = y - 2e3;
      u22 = u2 * u2;
      u3 = u2 * u22;
      u4 = u22 * u22;
      u5 = u22 * u3;
      return 63.86 + 0.3345 * u2 - 0.060374 * u22 + 17275e-7 * u3 + 651814e-9 * u4 + 2373599e-11 * u5;
    }
    if (y < 2050) {
      u2 = y - 2e3;
      return 62.92 + 0.32217 * u2 + 5589e-6 * u2 * u2;
    }
    if (y < 2150) {
      u2 = (y - 1820) / 100;
      return -20 + 32 * u2 * u2 - 0.5628 * (2150 - y);
    }
    u2 = (y - 1820) / 100;
    return -20 + 32 * u2 * u2;
  }
  var DeltaT = DeltaT_EspenakMeeus;
  function TerrestrialTime(ut) {
    return ut + DeltaT(ut) / 86400;
  }
  var AstroTime = class _AstroTime {
    /**
     * @param {FlexibleDateTime} date
     *      A JavaScript Date object, a numeric UTC value expressed in J2000 days, or another AstroTime object.
     */
    constructor(date) {
      if (date instanceof _AstroTime) {
        this.date = date.date;
        this.ut = date.ut;
        this.tt = date.tt;
        return;
      }
      const MillisPerDay = 1e3 * 3600 * 24;
      if (date instanceof Date && Number.isFinite(date.getTime())) {
        this.date = date;
        this.ut = (date.getTime() - J2000.getTime()) / MillisPerDay;
        this.tt = TerrestrialTime(this.ut);
        return;
      }
      if (Number.isFinite(date)) {
        this.date = new Date(J2000.getTime() + date * MillisPerDay);
        this.ut = date;
        this.tt = TerrestrialTime(this.ut);
        return;
      }
      throw "Argument must be a Date object, an AstroTime object, or a numeric UTC Julian date.";
    }
    /**
     * @brief Creates an `AstroTime` value from a Terrestrial Time (TT) day value.
     *
     * This function can be used in rare cases where a time must be based
     * on Terrestrial Time (TT) rather than Universal Time (UT).
     * Most developers will want to invoke `new AstroTime(ut)` with a universal time
     * instead of this function, because usually time is based on civil time adjusted
     * by leap seconds to match the Earth's rotation, rather than the uniformly
     * flowing TT used to calculate solar system dynamics. In rare cases
     * where the caller already knows TT, this function is provided to create
     * an `AstroTime` value that can be passed to Astronomy Engine functions.
     *
     * @param {number} tt
     *      The number of days since the J2000 epoch as expressed in Terrestrial Time.
     *
     * @returns {AstroTime}
     *      An `AstroTime` object for the specified terrestrial time.
     */
    static FromTerrestrialTime(tt) {
      let time = new _AstroTime(tt);
      for (; ; ) {
        const err = tt - time.tt;
        if (Math.abs(err) < 1e-12)
          return time;
        time = time.AddDays(err);
      }
    }
    /**
     * Formats an `AstroTime` object as an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
     * date/time string in UTC, to millisecond resolution.
     * Example: `2018-08-17T17:22:04.050Z`
     * @returns {string}
     */
    toString() {
      return this.date.toISOString();
    }
    /**
     * Returns a new `AstroTime` object adjusted by the floating point number of days.
     * Does NOT modify the original `AstroTime` object.
     *
     * @param {number} days
     *      The floating point number of days by which to adjust the given date and time.
     *      Positive values adjust the date toward the future, and
     *      negative values adjust the date toward the past.
     *
     * @returns {AstroTime}
     */
    AddDays(days) {
      return new _AstroTime(this.ut + days);
    }
  };
  function InterpolateTime(time1, time2, fraction) {
    return new AstroTime(time1.ut + fraction * (time2.ut - time1.ut));
  }
  function MakeTime(date) {
    if (date instanceof AstroTime) {
      return date;
    }
    return new AstroTime(date);
  }
  function iau2000b(time) {
    function mod2(x) {
      return x % ASEC360 * ASEC2RAD;
    }
    const t = time.tt / 36525;
    const elp = mod2(128710479305e-5 + t * 1295965810481e-4);
    const f2 = mod2(335779.526232 + t * 17395272628478e-4);
    const d = mod2(107226070369e-5 + t * 1602961601209e-3);
    const om = mod2(450160.398036 - t * 69628905431e-4);
    let sarg = Math.sin(om);
    let carg = Math.cos(om);
    let dp = (-172064161 - 174666 * t) * sarg + 33386 * carg;
    let de = (92052331 + 9086 * t) * carg + 15377 * sarg;
    let arg = 2 * (f2 - d + om);
    sarg = Math.sin(arg);
    carg = Math.cos(arg);
    dp += (-13170906 - 1675 * t) * sarg - 13696 * carg;
    de += (5730336 - 3015 * t) * carg - 4587 * sarg;
    arg = 2 * (f2 + om);
    sarg = Math.sin(arg);
    carg = Math.cos(arg);
    dp += (-2276413 - 234 * t) * sarg + 2796 * carg;
    de += (978459 - 485 * t) * carg + 1374 * sarg;
    arg = 2 * om;
    sarg = Math.sin(arg);
    carg = Math.cos(arg);
    dp += (2074554 + 207 * t) * sarg - 698 * carg;
    de += (-897492 + 470 * t) * carg - 291 * sarg;
    sarg = Math.sin(elp);
    carg = Math.cos(elp);
    dp += (1475877 - 3633 * t) * sarg + 11817 * carg;
    de += (73871 - 184 * t) * carg - 1924 * sarg;
    return {
      dpsi: -135e-6 + dp * 1e-7,
      deps: 388e-6 + de * 1e-7
    };
  }
  function mean_obliq(time) {
    var t = time.tt / 36525;
    var asec = ((((-434e-10 * t - 576e-9) * t + 20034e-7) * t - 1831e-7) * t - 46.836769) * t + 84381.406;
    return asec / 3600;
  }
  var cache_e_tilt;
  function e_tilt(time) {
    if (!cache_e_tilt || Math.abs(cache_e_tilt.tt - time.tt) > 1e-6) {
      const nut = iau2000b(time);
      const mean_ob = mean_obliq(time);
      const true_ob = mean_ob + nut.deps / 3600;
      cache_e_tilt = {
        tt: time.tt,
        dpsi: nut.dpsi,
        deps: nut.deps,
        ee: nut.dpsi * Math.cos(mean_ob * DEG2RAD) / 15,
        mobl: mean_ob,
        tobl: true_ob
      };
    }
    return cache_e_tilt;
  }
  function obl_ecl2equ_vec(oblDegrees, pos) {
    const obl = oblDegrees * DEG2RAD;
    const cos_obl = Math.cos(obl);
    const sin_obl = Math.sin(obl);
    return [
      pos[0],
      pos[1] * cos_obl - pos[2] * sin_obl,
      pos[1] * sin_obl + pos[2] * cos_obl
    ];
  }
  function ecl2equ_vec(time, pos) {
    return obl_ecl2equ_vec(mean_obliq(time), pos);
  }
  var CalcMoonCount = 0;
  function CalcMoon(time) {
    ++CalcMoonCount;
    const T = time.tt / 36525;
    function DeclareArray1(xmin, xmax) {
      const array = [];
      let i;
      for (i = 0; i <= xmax - xmin; ++i) {
        array.push(0);
      }
      return { min: xmin, array };
    }
    function DeclareArray2(xmin, xmax, ymin, ymax) {
      const array = [];
      for (let i = 0; i <= xmax - xmin; ++i) {
        array.push(DeclareArray1(ymin, ymax));
      }
      return { min: xmin, array };
    }
    function ArrayGet2(a, x, y) {
      const m = a.array[x - a.min];
      return m.array[y - m.min];
    }
    function ArraySet2(a, x, y, v) {
      const m = a.array[x - a.min];
      m.array[y - m.min] = v;
    }
    let S, MAX, ARG, FAC, I, J, T2, DGAM, DLAM, N, GAM1C, SINPI, L0, L, LS, F, D, DL0, DL, DLS, DF, DD, DS;
    let coArray = DeclareArray2(-6, 6, 1, 4);
    let siArray = DeclareArray2(-6, 6, 1, 4);
    function CO(x, y) {
      return ArrayGet2(coArray, x, y);
    }
    function SI(x, y) {
      return ArrayGet2(siArray, x, y);
    }
    function SetCO(x, y, v) {
      return ArraySet2(coArray, x, y, v);
    }
    function SetSI(x, y, v) {
      return ArraySet2(siArray, x, y, v);
    }
    function AddThe(c1, s1, c2, s2, func) {
      func(c1 * c2 - s1 * s2, s1 * c2 + c1 * s2);
    }
    function Sine(phi) {
      return Math.sin(PI2 * phi);
    }
    T2 = T * T;
    DLAM = 0;
    DS = 0;
    GAM1C = 0;
    SINPI = 3422.7;
    var S1 = Sine(0.19833 + 0.05611 * T);
    var S2 = Sine(0.27869 + 0.04508 * T);
    var S3 = Sine(0.16827 - 0.36903 * T);
    var S4 = Sine(0.34734 - 5.37261 * T);
    var S5 = Sine(0.10498 - 5.37899 * T);
    var S6 = Sine(0.42681 - 0.41855 * T);
    var S7 = Sine(0.14943 - 5.37511 * T);
    DL0 = 0.84 * S1 + 0.31 * S2 + 14.27 * S3 + 7.26 * S4 + 0.28 * S5 + 0.24 * S6;
    DL = 2.94 * S1 + 0.31 * S2 + 14.27 * S3 + 9.34 * S4 + 1.12 * S5 + 0.83 * S6;
    DLS = -6.4 * S1 - 1.89 * S6;
    DF = 0.21 * S1 + 0.31 * S2 + 14.27 * S3 - 88.7 * S4 - 15.3 * S5 + 0.24 * S6 - 1.86 * S7;
    DD = DL0 - DLS;
    DGAM = -3332e-9 * Sine(0.59734 - 5.37261 * T) - 539e-9 * Sine(0.35498 - 5.37899 * T) - 64e-9 * Sine(0.39943 - 5.37511 * T);
    L0 = PI2 * Frac(0.60643382 + 1336.85522467 * T - 313e-8 * T2) + DL0 / ARC;
    L = PI2 * Frac(0.37489701 + 1325.55240982 * T + 2565e-8 * T2) + DL / ARC;
    LS = PI2 * Frac(0.99312619 + 99.99735956 * T - 44e-8 * T2) + DLS / ARC;
    F = PI2 * Frac(0.25909118 + 1342.2278298 * T - 892e-8 * T2) + DF / ARC;
    D = PI2 * Frac(0.82736186 + 1236.85308708 * T - 397e-8 * T2) + DD / ARC;
    for (I = 1; I <= 4; ++I) {
      switch (I) {
        case 1:
          ARG = L;
          MAX = 4;
          FAC = 1.000002208;
          break;
        case 2:
          ARG = LS;
          MAX = 3;
          FAC = 0.997504612 - 2495388e-9 * T;
          break;
        case 3:
          ARG = F;
          MAX = 4;
          FAC = 1.000002708 + 139.978 * DGAM;
          break;
        case 4:
          ARG = D;
          MAX = 6;
          FAC = 1;
          break;
        default:
          throw `Internal error: I = ${I}`;
      }
      SetCO(0, I, 1);
      SetCO(1, I, Math.cos(ARG) * FAC);
      SetSI(0, I, 0);
      SetSI(1, I, Math.sin(ARG) * FAC);
      for (J = 2; J <= MAX; ++J) {
        AddThe(CO(J - 1, I), SI(J - 1, I), CO(1, I), SI(1, I), (c, s2) => (SetCO(J, I, c), SetSI(J, I, s2)));
      }
      for (J = 1; J <= MAX; ++J) {
        SetCO(-J, I, CO(J, I));
        SetSI(-J, I, -SI(J, I));
      }
    }
    function Term(p, q, r, s2) {
      var result = { x: 1, y: 0 };
      var I2 = [0, p, q, r, s2];
      for (var k = 1; k <= 4; ++k)
        if (I2[k] !== 0)
          AddThe(result.x, result.y, CO(I2[k], k), SI(I2[k], k), (c, s3) => (result.x = c, result.y = s3));
      return result;
    }
    function AddSol(coeffl, coeffs, coeffg, coeffp, p, q, r, s2) {
      var result = Term(p, q, r, s2);
      DLAM += coeffl * result.y;
      DS += coeffs * result.y;
      GAM1C += coeffg * result.x;
      SINPI += coeffp * result.x;
    }
    AddSol(13.902, 14.06, -1e-3, 0.2607, 0, 0, 0, 4);
    AddSol(0.403, -4.01, 0.394, 23e-4, 0, 0, 0, 3);
    AddSol(2369.912, 2373.36, 0.601, 28.2333, 0, 0, 0, 2);
    AddSol(-125.154, -112.79, -0.725, -0.9781, 0, 0, 0, 1);
    AddSol(1.979, 6.98, -0.445, 0.0433, 1, 0, 0, 4);
    AddSol(191.953, 192.72, 0.029, 3.0861, 1, 0, 0, 2);
    AddSol(-8.466, -13.51, 0.455, -0.1093, 1, 0, 0, 1);
    AddSol(22639.5, 22609.07, 0.079, 186.5398, 1, 0, 0, 0);
    AddSol(18.609, 3.59, -0.094, 0.0118, 1, 0, 0, -1);
    AddSol(-4586.465, -4578.13, -0.077, 34.3117, 1, 0, 0, -2);
    AddSol(3.215, 5.44, 0.192, -0.0386, 1, 0, 0, -3);
    AddSol(-38.428, -38.64, 1e-3, 0.6008, 1, 0, 0, -4);
    AddSol(-0.393, -1.43, -0.092, 86e-4, 1, 0, 0, -6);
    AddSol(-0.289, -1.59, 0.123, -53e-4, 0, 1, 0, 4);
    AddSol(-24.42, -25.1, 0.04, -0.3, 0, 1, 0, 2);
    AddSol(18.023, 17.93, 7e-3, 0.1494, 0, 1, 0, 1);
    AddSol(-668.146, -126.98, -1.302, -0.3997, 0, 1, 0, 0);
    AddSol(0.56, 0.32, -1e-3, -37e-4, 0, 1, 0, -1);
    AddSol(-165.145, -165.06, 0.054, 1.9178, 0, 1, 0, -2);
    AddSol(-1.877, -6.46, -0.416, 0.0339, 0, 1, 0, -4);
    AddSol(0.213, 1.02, -0.074, 54e-4, 2, 0, 0, 4);
    AddSol(14.387, 14.78, -0.017, 0.2833, 2, 0, 0, 2);
    AddSol(-0.586, -1.2, 0.054, -0.01, 2, 0, 0, 1);
    AddSol(769.016, 767.96, 0.107, 10.1657, 2, 0, 0, 0);
    AddSol(1.75, 2.01, -0.018, 0.0155, 2, 0, 0, -1);
    AddSol(-211.656, -152.53, 5.679, -0.3039, 2, 0, 0, -2);
    AddSol(1.225, 0.91, -0.03, -88e-4, 2, 0, 0, -3);
    AddSol(-30.773, -34.07, -0.308, 0.3722, 2, 0, 0, -4);
    AddSol(-0.57, -1.4, -0.074, 0.0109, 2, 0, 0, -6);
    AddSol(-2.921, -11.75, 0.787, -0.0484, 1, 1, 0, 2);
    AddSol(1.267, 1.52, -0.022, 0.0164, 1, 1, 0, 1);
    AddSol(-109.673, -115.18, 0.461, -0.949, 1, 1, 0, 0);
    AddSol(-205.962, -182.36, 2.056, 1.4437, 1, 1, 0, -2);
    AddSol(0.233, 0.36, 0.012, -25e-4, 1, 1, 0, -3);
    AddSol(-4.391, -9.66, -0.471, 0.0673, 1, 1, 0, -4);
    AddSol(0.283, 1.53, -0.111, 6e-3, 1, -1, 0, 4);
    AddSol(14.577, 31.7, -1.54, 0.2302, 1, -1, 0, 2);
    AddSol(147.687, 138.76, 0.679, 1.1528, 1, -1, 0, 0);
    AddSol(-1.089, 0.55, 0.021, 0, 1, -1, 0, -1);
    AddSol(28.475, 23.59, -0.443, -0.2257, 1, -1, 0, -2);
    AddSol(-0.276, -0.38, -6e-3, -36e-4, 1, -1, 0, -3);
    AddSol(0.636, 2.27, 0.146, -0.0102, 1, -1, 0, -4);
    AddSol(-0.189, -1.68, 0.131, -28e-4, 0, 2, 0, 2);
    AddSol(-7.486, -0.66, -0.037, -86e-4, 0, 2, 0, 0);
    AddSol(-8.096, -16.35, -0.74, 0.0918, 0, 2, 0, -2);
    AddSol(-5.741, -0.04, 0, -9e-4, 0, 0, 2, 2);
    AddSol(0.255, 0, 0, 0, 0, 0, 2, 1);
    AddSol(-411.608, -0.2, 0, -0.0124, 0, 0, 2, 0);
    AddSol(0.584, 0.84, 0, 71e-4, 0, 0, 2, -1);
    AddSol(-55.173, -52.14, 0, -0.1052, 0, 0, 2, -2);
    AddSol(0.254, 0.25, 0, -17e-4, 0, 0, 2, -3);
    AddSol(0.025, -1.67, 0, 31e-4, 0, 0, 2, -4);
    AddSol(1.06, 2.96, -0.166, 0.0243, 3, 0, 0, 2);
    AddSol(36.124, 50.64, -1.3, 0.6215, 3, 0, 0, 0);
    AddSol(-13.193, -16.4, 0.258, -0.1187, 3, 0, 0, -2);
    AddSol(-1.187, -0.74, 0.042, 74e-4, 3, 0, 0, -4);
    AddSol(-0.293, -0.31, -2e-3, 46e-4, 3, 0, 0, -6);
    AddSol(-0.29, -1.45, 0.116, -51e-4, 2, 1, 0, 2);
    AddSol(-7.649, -10.56, 0.259, -0.1038, 2, 1, 0, 0);
    AddSol(-8.627, -7.59, 0.078, -0.0192, 2, 1, 0, -2);
    AddSol(-2.74, -2.54, 0.022, 0.0324, 2, 1, 0, -4);
    AddSol(1.181, 3.32, -0.212, 0.0213, 2, -1, 0, 2);
    AddSol(9.703, 11.67, -0.151, 0.1268, 2, -1, 0, 0);
    AddSol(-0.352, -0.37, 1e-3, -28e-4, 2, -1, 0, -1);
    AddSol(-2.494, -1.17, -3e-3, -17e-4, 2, -1, 0, -2);
    AddSol(0.36, 0.2, -0.012, -43e-4, 2, -1, 0, -4);
    AddSol(-1.167, -1.25, 8e-3, -0.0106, 1, 2, 0, 0);
    AddSol(-7.412, -6.12, 0.117, 0.0484, 1, 2, 0, -2);
    AddSol(-0.311, -0.65, -0.032, 44e-4, 1, 2, 0, -4);
    AddSol(0.757, 1.82, -0.105, 0.0112, 1, -2, 0, 2);
    AddSol(2.58, 2.32, 0.027, 0.0196, 1, -2, 0, 0);
    AddSol(2.533, 2.4, -0.014, -0.0212, 1, -2, 0, -2);
    AddSol(-0.344, -0.57, -0.025, 36e-4, 0, 3, 0, -2);
    AddSol(-0.992, -0.02, 0, 0, 1, 0, 2, 2);
    AddSol(-45.099, -0.02, 0, -1e-3, 1, 0, 2, 0);
    AddSol(-0.179, -9.52, 0, -0.0833, 1, 0, 2, -2);
    AddSol(-0.301, -0.33, 0, 14e-4, 1, 0, 2, -4);
    AddSol(-6.382, -3.37, 0, -0.0481, 1, 0, -2, 2);
    AddSol(39.528, 85.13, 0, -0.7136, 1, 0, -2, 0);
    AddSol(9.366, 0.71, 0, -0.0112, 1, 0, -2, -2);
    AddSol(0.202, 0.02, 0, 0, 1, 0, -2, -4);
    AddSol(0.415, 0.1, 0, 13e-4, 0, 1, 2, 0);
    AddSol(-2.152, -2.26, 0, -66e-4, 0, 1, 2, -2);
    AddSol(-1.44, -1.3, 0, 14e-4, 0, 1, -2, 2);
    AddSol(0.384, -0.04, 0, 0, 0, 1, -2, -2);
    AddSol(1.938, 3.6, -0.145, 0.0401, 4, 0, 0, 0);
    AddSol(-0.952, -1.58, 0.052, -0.013, 4, 0, 0, -2);
    AddSol(-0.551, -0.94, 0.032, -97e-4, 3, 1, 0, 0);
    AddSol(-0.482, -0.57, 5e-3, -45e-4, 3, 1, 0, -2);
    AddSol(0.681, 0.96, -0.026, 0.0115, 3, -1, 0, 0);
    AddSol(-0.297, -0.27, 2e-3, -9e-4, 2, 2, 0, -2);
    AddSol(0.254, 0.21, -3e-3, 0, 2, -2, 0, -2);
    AddSol(-0.25, -0.22, 4e-3, 14e-4, 1, 3, 0, -2);
    AddSol(-3.996, 0, 0, 4e-4, 2, 0, 2, 0);
    AddSol(0.557, -0.75, 0, -9e-3, 2, 0, 2, -2);
    AddSol(-0.459, -0.38, 0, -53e-4, 2, 0, -2, 2);
    AddSol(-1.298, 0.74, 0, 4e-4, 2, 0, -2, 0);
    AddSol(0.538, 1.14, 0, -0.0141, 2, 0, -2, -2);
    AddSol(0.263, 0.02, 0, 0, 1, 1, 2, 0);
    AddSol(0.426, 0.07, 0, -6e-4, 1, 1, -2, -2);
    AddSol(-0.304, 0.03, 0, 3e-4, 1, -1, 2, 0);
    AddSol(-0.372, -0.19, 0, -27e-4, 1, -1, -2, 2);
    AddSol(0.418, 0, 0, 0, 0, 0, 4, 0);
    AddSol(-0.33, -0.04, 0, 0, 3, 0, 2, 0);
    function ADDN(coeffn, p, q, r, s2) {
      return coeffn * Term(p, q, r, s2).y;
    }
    N = 0;
    N += ADDN(-526.069, 0, 0, 1, -2);
    N += ADDN(-3.352, 0, 0, 1, -4);
    N += ADDN(44.297, 1, 0, 1, -2);
    N += ADDN(-6, 1, 0, 1, -4);
    N += ADDN(20.599, -1, 0, 1, 0);
    N += ADDN(-30.598, -1, 0, 1, -2);
    N += ADDN(-24.649, -2, 0, 1, 0);
    N += ADDN(-2, -2, 0, 1, -2);
    N += ADDN(-22.571, 0, 1, 1, -2);
    N += ADDN(10.985, 0, -1, 1, -2);
    DLAM += 0.82 * Sine(0.7736 - 62.5512 * T) + 0.31 * Sine(0.0466 - 125.1025 * T) + 0.35 * Sine(0.5785 - 25.1042 * T) + 0.66 * Sine(0.4591 + 1335.8075 * T) + 0.64 * Sine(0.313 - 91.568 * T) + 1.14 * Sine(0.148 + 1331.2898 * T) + 0.21 * Sine(0.5918 + 1056.5859 * T) + 0.44 * Sine(0.5784 + 1322.8595 * T) + 0.24 * Sine(0.2275 - 5.7374 * T) + 0.28 * Sine(0.2965 + 2.6929 * T) + 0.33 * Sine(0.3132 + 6.3368 * T);
    S = F + DS / ARC;
    let lat_seconds = (1.000002708 + 139.978 * DGAM) * (18518.511 + 1.189 + GAM1C) * Math.sin(S) - 6.24 * Math.sin(3 * S) + N;
    return {
      geo_eclip_lon: PI2 * Frac((L0 + DLAM / ARC) / PI2),
      geo_eclip_lat: Math.PI / (180 * 3600) * lat_seconds,
      distance_au: ARC * EARTH_EQUATORIAL_RADIUS_AU / (0.999953253 * SINPI)
    };
  }
  function rotate(rot, vec) {
    return [
      rot.rot[0][0] * vec[0] + rot.rot[1][0] * vec[1] + rot.rot[2][0] * vec[2],
      rot.rot[0][1] * vec[0] + rot.rot[1][1] * vec[1] + rot.rot[2][1] * vec[2],
      rot.rot[0][2] * vec[0] + rot.rot[1][2] * vec[1] + rot.rot[2][2] * vec[2]
    ];
  }
  function precession(pos, time, dir) {
    const r = precession_rot(time, dir);
    return rotate(r, pos);
  }
  function precession_rot(time, dir) {
    const t = time.tt / 36525;
    let eps0 = 84381.406;
    let psia = ((((-951e-10 * t + 132851e-9) * t - 114045e-8) * t - 1.0790069) * t + 5038.481507) * t;
    let omegaa = ((((3337e-10 * t - 467e-9) * t - 772503e-8) * t + 0.0512623) * t - 0.025754) * t + eps0;
    let chia = ((((-56e-9 * t + 170663e-9) * t - 121197e-8) * t - 2.3814292) * t + 10.556403) * t;
    eps0 *= ASEC2RAD;
    psia *= ASEC2RAD;
    omegaa *= ASEC2RAD;
    chia *= ASEC2RAD;
    const sa = Math.sin(eps0);
    const ca = Math.cos(eps0);
    const sb = Math.sin(-psia);
    const cb = Math.cos(-psia);
    const sc = Math.sin(-omegaa);
    const cc = Math.cos(-omegaa);
    const sd = Math.sin(chia);
    const cd = Math.cos(chia);
    const xx = cd * cb - sb * sd * cc;
    const yx = cd * sb * ca + sd * cc * cb * ca - sa * sd * sc;
    const zx = cd * sb * sa + sd * cc * cb * sa + ca * sd * sc;
    const xy = -sd * cb - sb * cd * cc;
    const yy = -sd * sb * ca + cd * cc * cb * ca - sa * cd * sc;
    const zy = -sd * sb * sa + cd * cc * cb * sa + ca * cd * sc;
    const xz = sb * sc;
    const yz = -sc * cb * ca - sa * cc;
    const zz = -sc * cb * sa + cc * ca;
    if (dir === PrecessDirection.Into2000) {
      return new RotationMatrix([
        [xx, yx, zx],
        [xy, yy, zy],
        [xz, yz, zz]
      ]);
    }
    if (dir === PrecessDirection.From2000) {
      return new RotationMatrix([
        [xx, xy, xz],
        [yx, yy, yz],
        [zx, zy, zz]
      ]);
    }
    throw "Invalid precess direction";
  }
  function nutation(pos, time, dir) {
    const r = nutation_rot(time, dir);
    return rotate(r, pos);
  }
  function nutation_rot(time, dir) {
    const tilt = e_tilt(time);
    const oblm = tilt.mobl * DEG2RAD;
    const oblt = tilt.tobl * DEG2RAD;
    const psi = tilt.dpsi * ASEC2RAD;
    const cobm = Math.cos(oblm);
    const sobm = Math.sin(oblm);
    const cobt = Math.cos(oblt);
    const sobt = Math.sin(oblt);
    const cpsi = Math.cos(psi);
    const spsi = Math.sin(psi);
    const xx = cpsi;
    const yx = -spsi * cobm;
    const zx = -spsi * sobm;
    const xy = spsi * cobt;
    const yy = cpsi * cobm * cobt + sobm * sobt;
    const zy = cpsi * sobm * cobt - cobm * sobt;
    const xz = spsi * sobt;
    const yz = cpsi * cobm * sobt - sobm * cobt;
    const zz = cpsi * sobm * sobt + cobm * cobt;
    if (dir === PrecessDirection.From2000) {
      return new RotationMatrix([
        [xx, xy, xz],
        [yx, yy, yz],
        [zx, zy, zz]
      ]);
    }
    if (dir === PrecessDirection.Into2000) {
      return new RotationMatrix([
        [xx, yx, zx],
        [xy, yy, zy],
        [xz, yz, zz]
      ]);
    }
    throw "Invalid precess direction";
  }
  function gyration(pos, time, dir) {
    return dir === PrecessDirection.Into2000 ? precession(nutation(pos, time, dir), time, dir) : nutation(precession(pos, time, dir), time, dir);
  }
  var Vector = class {
    constructor(x, y, z, t) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.t = t;
    }
    /**
     * Returns the length of the vector in astronomical units (AU).
     * @returns {number}
     */
    Length() {
      return Math.hypot(this.x, this.y, this.z);
    }
  };
  var StateVector = class {
    constructor(x, y, z, vx, vy, vz, t) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.vx = vx;
      this.vy = vy;
      this.vz = vz;
      this.t = t;
    }
  };
  var Spherical = class {
    constructor(lat, lon, dist) {
      this.lat = VerifyNumber(lat);
      this.lon = VerifyNumber(lon);
      this.dist = VerifyNumber(dist);
    }
  };
  var RotationMatrix = class {
    constructor(rot) {
      this.rot = rot;
    }
  };
  var EclipticCoordinates = class {
    constructor(vec, elat, elon) {
      this.vec = vec;
      this.elat = VerifyNumber(elat);
      this.elon = VerifyNumber(elon);
    }
  };
  function SunPosition(date) {
    const time = MakeTime(date).AddDays(-1 / C_AUDAY);
    const earth2000 = CalcVsop(vsop.Earth, time);
    const sun2000 = [-earth2000.x, -earth2000.y, -earth2000.z];
    const [gx, gy, gz] = gyration(sun2000, time, PrecessDirection.From2000);
    const true_obliq = DEG2RAD * e_tilt(time).tobl;
    const cos_ob = Math.cos(true_obliq);
    const sin_ob = Math.sin(true_obliq);
    const vec = new Vector(gx, gy, gz, time);
    const sun_ecliptic = RotateEquatorialToEcliptic(vec, cos_ob, sin_ob);
    return sun_ecliptic;
  }
  function RotateEquatorialToEcliptic(equ, cos_ob, sin_ob) {
    const ex = equ.x;
    const ey = equ.y * cos_ob + equ.z * sin_ob;
    const ez = -equ.y * sin_ob + equ.z * cos_ob;
    const xyproj = Math.hypot(ex, ey);
    let elon = 0;
    if (xyproj > 0) {
      elon = RAD2DEG * Math.atan2(ey, ex);
      if (elon < 0)
        elon += 360;
    }
    let elat = RAD2DEG * Math.atan2(ez, xyproj);
    let ecl = new Vector(ex, ey, ez, equ.t);
    return new EclipticCoordinates(ecl, elat, elon);
  }
  function Ecliptic(eqj) {
    const et = e_tilt(eqj.t);
    const eqj_pos = [eqj.x, eqj.y, eqj.z];
    const mean_pos = precession(eqj_pos, eqj.t, PrecessDirection.From2000);
    const [x, y, z] = nutation(mean_pos, eqj.t, PrecessDirection.From2000);
    const eqd = new Vector(x, y, z, eqj.t);
    const tobl = et.tobl * DEG2RAD;
    return RotateEquatorialToEcliptic(eqd, Math.cos(tobl), Math.sin(tobl));
  }
  function GeoMoon(date) {
    const time = MakeTime(date);
    const moon = CalcMoon(time);
    const dist_cos_lat = moon.distance_au * Math.cos(moon.geo_eclip_lat);
    const gepos = [
      dist_cos_lat * Math.cos(moon.geo_eclip_lon),
      dist_cos_lat * Math.sin(moon.geo_eclip_lon),
      moon.distance_au * Math.sin(moon.geo_eclip_lat)
    ];
    const mpos1 = ecl2equ_vec(time, gepos);
    const mpos2 = precession(mpos1, time, PrecessDirection.Into2000);
    return new Vector(mpos2[0], mpos2[1], mpos2[2], time);
  }
  function GeoMoonState(date) {
    const time = MakeTime(date);
    const dt = 1e-5;
    const t1 = time.AddDays(-dt);
    const t2 = time.AddDays(+dt);
    const r1 = GeoMoon(t1);
    const r2 = GeoMoon(t2);
    return new StateVector((r1.x + r2.x) / 2, (r1.y + r2.y) / 2, (r1.z + r2.z) / 2, (r2.x - r1.x) / (2 * dt), (r2.y - r1.y) / (2 * dt), (r2.z - r1.z) / (2 * dt), time);
  }
  function GeoEmbState(date) {
    const time = MakeTime(date);
    const s2 = GeoMoonState(time);
    const d = 1 + EARTH_MOON_MASS_RATIO;
    return new StateVector(s2.x / d, s2.y / d, s2.z / d, s2.vx / d, s2.vy / d, s2.vz / d, time);
  }
  function VsopFormula(formula, t, clamp_angle) {
    let tpower = 1;
    let coord = 0;
    for (let series of formula) {
      let sum = 0;
      for (let [ampl, phas, freq] of series)
        sum += ampl * Math.cos(phas + t * freq);
      let incr = tpower * sum;
      if (clamp_angle)
        incr %= PI2;
      coord += incr;
      tpower *= t;
    }
    return coord;
  }
  function VsopDeriv(formula, t) {
    let tpower = 1;
    let dpower = 0;
    let deriv = 0;
    let s2 = 0;
    for (let series of formula) {
      let sin_sum = 0;
      let cos_sum = 0;
      for (let [ampl, phas, freq] of series) {
        let angle = phas + t * freq;
        sin_sum += ampl * freq * Math.sin(angle);
        if (s2 > 0)
          cos_sum += ampl * Math.cos(angle);
      }
      deriv += s2 * dpower * cos_sum - tpower * sin_sum;
      dpower = tpower;
      tpower *= t;
      ++s2;
    }
    return deriv;
  }
  var DAYS_PER_MILLENNIUM = 365250;
  var LON_INDEX = 0;
  var LAT_INDEX = 1;
  var RAD_INDEX = 2;
  function VsopRotate(eclip) {
    return new TerseVector(eclip[0] + 44036e-11 * eclip[1] - 190919e-12 * eclip[2], -479966e-12 * eclip[0] + 0.917482137087 * eclip[1] - 0.397776982902 * eclip[2], 0.397776982902 * eclip[1] + 0.917482137087 * eclip[2]);
  }
  function VsopSphereToRect(lon, lat, radius) {
    const r_coslat = radius * Math.cos(lat);
    const coslon = Math.cos(lon);
    const sinlon = Math.sin(lon);
    return [
      r_coslat * coslon,
      r_coslat * sinlon,
      radius * Math.sin(lat)
    ];
  }
  function CalcVsop(model, time) {
    const t = time.tt / DAYS_PER_MILLENNIUM;
    const lon = VsopFormula(model[LON_INDEX], t, true);
    const lat = VsopFormula(model[LAT_INDEX], t, false);
    const rad = VsopFormula(model[RAD_INDEX], t, false);
    const eclip = VsopSphereToRect(lon, lat, rad);
    return VsopRotate(eclip).ToAstroVector(time);
  }
  function CalcVsopPosVel(model, tt) {
    const t = tt / DAYS_PER_MILLENNIUM;
    const lon = VsopFormula(model[LON_INDEX], t, true);
    const lat = VsopFormula(model[LAT_INDEX], t, false);
    const rad = VsopFormula(model[RAD_INDEX], t, false);
    const dlon_dt = VsopDeriv(model[LON_INDEX], t);
    const dlat_dt = VsopDeriv(model[LAT_INDEX], t);
    const drad_dt = VsopDeriv(model[RAD_INDEX], t);
    const coslon = Math.cos(lon);
    const sinlon = Math.sin(lon);
    const coslat = Math.cos(lat);
    const sinlat = Math.sin(lat);
    const vx = +(drad_dt * coslat * coslon) - rad * sinlat * coslon * dlat_dt - rad * coslat * sinlon * dlon_dt;
    const vy = +(drad_dt * coslat * sinlon) - rad * sinlat * sinlon * dlat_dt + rad * coslat * coslon * dlon_dt;
    const vz = +(drad_dt * sinlat) + rad * coslat * dlat_dt;
    const eclip_pos = VsopSphereToRect(lon, lat, rad);
    const eclip_vel = [
      vx / DAYS_PER_MILLENNIUM,
      vy / DAYS_PER_MILLENNIUM,
      vz / DAYS_PER_MILLENNIUM
    ];
    const equ_pos = VsopRotate(eclip_pos);
    const equ_vel = VsopRotate(eclip_vel);
    return new body_state_t(tt, equ_pos, equ_vel);
  }
  function AdjustBarycenter(ssb, time, body, pmass) {
    const shift = pmass / (pmass + SUN_GM);
    const planet = CalcVsop(vsop[body], time);
    ssb.x += shift * planet.x;
    ssb.y += shift * planet.y;
    ssb.z += shift * planet.z;
  }
  function CalcSolarSystemBarycenter(time) {
    const ssb = new Vector(0, 0, 0, time);
    AdjustBarycenter(ssb, time, Body.Jupiter, JUPITER_GM);
    AdjustBarycenter(ssb, time, Body.Saturn, SATURN_GM);
    AdjustBarycenter(ssb, time, Body.Uranus, URANUS_GM);
    AdjustBarycenter(ssb, time, Body.Neptune, NEPTUNE_GM);
    return ssb;
  }
  var PLUTO_NUM_STATES = 51;
  var PLUTO_TIME_STEP = 29200;
  var PLUTO_DT = 146;
  var PLUTO_NSTEPS = 201;
  var PlutoStateTable = [
    [-73e4, [-26.118207232108, -14.376168177825, 3.384402515299], [0.0016339372163656, -0.0027861699588508, -0.0013585880229445]],
    [-700800, [41.974905202127, -0.448502952929, -12.770351505989], [73458569351457e-17, 0.0022785014891658, 48619778602049e-17]],
    [-671600, [14.706930780744, 44.269110540027, 9.353698474772], [-0.00210001479998, 22295915939915e-17, 70143443551414e-17]],
    [-642400, [-29.441003929957, -6.43016153057, 6.858481011305], [84495803960544e-17, -0.0030783914758711, -0.0012106305981192]],
    [-613200, [39.444396946234, -6.557989760571, -13.913760296463], [0.0011480029005873, 0.0022400006880665, 35168075922288e-17]],
    [-584e3, [20.2303809507, 43.266966657189, 7.382966091923], [-0.0019754081700585, 53457141292226e-17, 75929169129793e-17]],
    [-554800, [-30.65832536462, 2.093818874552, 9.880531138071], [61010603013347e-18, -0.0031326500935382, -99346125151067e-17]],
    [-525600, [35.737703251673, -12.587706024764, -14.677847247563], [0.0015802939375649, 0.0021347678412429, 19074436384343e-17]],
    [-496400, [25.466295188546, 41.367478338417, 5.216476873382], [-0.0018054401046468, 8328308359951e-16, 80260156912107e-17]],
    [-467200, [-29.847174904071, 10.636426313081, 12.297904180106], [-63257063052907e-17, -0.0029969577578221, -74476074151596e-17]],
    [-438e3, [30.774692107687, -18.236637015304, -14.945535879896], [0.0020113162005465, 0.0019353827024189, -20937793168297e-19]],
    [-408800, [30.243153324028, 38.656267888503, 2.938501750218], [-0.0016052508674468, 0.0011183495337525, 83333973416824e-17]],
    [-379600, [-27.288984772533, 18.643162147874, 14.023633623329], [-0.0011856388898191, -0.0027170609282181, -49015526126399e-17]],
    [-350400, [24.519605196774, -23.245756064727, -14.626862367368], [0.0024322321483154, 0.0016062008146048, -23369181613312e-17]],
    [-321200, [34.505274805875, 35.125338586954, 0.557361475637], [-0.0013824391637782, 0.0013833397561817, 84823598806262e-17]],
    [-292e3, [-23.275363915119, 25.818514298769, 15.055381588598], [-0.0016062295460975, -0.0023395961498533, -24377362639479e-17]],
    [-262800, [17.050384798092, -27.180376290126, -13.608963321694], [0.0028175521080578, 0.0011358749093955, -49548725258825e-17]],
    [-233600, [38.093671910285, 30.880588383337, -1.843688067413], [-0.0011317697153459, 0.0016128814698472, 84177586176055e-17]],
    [-204400, [-18.197852930878, 31.932869934309, 15.438294826279], [-0.0019117272501813, -0.0019146495909842, -19657304369835e-18]],
    [-175200, [8.528924039997, -29.618422200048, -11.805400994258], [0.0031034370787005, 5139363329243e-16, -77293066202546e-17]],
    [-146e3, [40.94685725864, 25.904973592021, -4.256336240499], [-83652705194051e-17, 0.0018129497136404, 8156422827306e-16]],
    [-116800, [-12.326958895325, 36.881883446292, 15.217158258711], [-0.0021166103705038, -0.001481442003599, 17401209844705e-17]],
    [-87600, [-0.633258375909, -30.018759794709, -9.17193287495], [0.0032016994581737, -25279858672148e-17, -0.0010411088271861]],
    [-58400, [42.936048423883, 20.344685584452, -6.588027007912], [-50525450073192e-17, 0.0019910074335507, 77440196540269e-17]],
    [-29200, [-5.975910552974, 40.61180995846, 14.470131723673], [-0.0022184202156107, -0.0010562361130164, 33652250216211e-17]],
    [0, [-9.875369580774, -27.978926224737, -5.753711824704], [0.0030287533248818, -0.0011276087003636, -0.0012651326732361]],
    [29200, [43.958831986165, 14.214147973292, -8.808306227163], [-14717608981871e-17, 0.0021404187242141, 71486567806614e-17]],
    [58400, [0.67813676352, 43.094461639362, 13.243238780721], [-0.0022358226110718, -63233636090933e-17, 47664798895648e-17]],
    [87600, [-18.282602096834, -23.30503958666, -1.766620508028], [0.0025567245263557, -0.0019902940754171, -0.0013943491701082]],
    [116800, [43.873338744526, 7.700705617215, -10.814273666425], [23174803055677e-17, 0.0022402163127924, 62988756452032e-17]],
    [146e3, [7.392949027906, 44.382678951534, 11.629500214854], [-0.002193281545383, -21751799585364e-17, 59556516201114e-17]],
    [175200, [-24.981690229261, -16.204012851426, 2.466457544298], [0.001819398914958, -0.0026765419531201, -0.0013848283502247]],
    [204400, [42.530187039511, 0.845935508021, -12.554907527683], [65059779150669e-17, 0.0022725657282262, 51133743202822e-17]],
    [233600, [13.999526486822, 44.462363044894, 9.669418486465], [-0.0021079296569252, 17533423831993e-17, 69128485798076e-17]],
    [262800, [-29.184024803031, -7.371243995762, 6.493275957928], [93581363109681e-17, -0.0030610357109184, -0.0012364201089345]],
    [292e3, [39.831980671753, -6.078405766765, -13.909815358656], [0.0011117769689167, 0.0022362097830152, 36230548231153e-17]],
    [321200, [20.294955108476, 43.417190420251, 7.450091985932], [-0.0019742157451535, 53102050468554e-17, 75938408813008e-17]],
    [350400, [-30.66999230216, 2.318743558955, 9.973480913858], [45605107450676e-18, -0.0031308219926928, -99066533301924e-17]],
    [379600, [35.626122155983, -12.897647509224, -14.777586508444], [0.0016015684949743, 0.0021171931182284, 18002516202204e-17]],
    [408800, [26.133186148561, 41.232139187599, 5.00640132622], [-0.0017857704419579, 86046232702817e-17, 80614690298954e-17]],
    [438e3, [-29.57674022923, 11.863535943587, 12.631323039872], [-72292830060955e-17, -0.0029587820140709, -708242964503e-15]],
    [467200, [29.910805787391, -19.159019294, -15.013363865194], [0.0020871080437997, 0.0018848372554514, -38528655083926e-18]],
    [496400, [31.375957451819, 38.050372720763, 2.433138343754], [-0.0015546055556611, 0.0011699815465629, 83565439266001e-17]],
    [525600, [-26.360071336928, 20.662505904952, 14.414696258958], [-0.0013142373118349, -0.0026236647854842, -42542017598193e-17]],
    [554800, [22.599441488648, -24.508879898306, -14.484045731468], [0.0025454108304806, 0.0014917058755191, -30243665086079e-17]],
    [584e3, [35.877864013014, 33.894226366071, -0.224524636277], [-0.0012941245730845, 0.0014560427668319, 84762160640137e-17]],
    [613200, [-21.538149762417, 28.204068269761, 15.321973799534], [-0.001731211740901, -0.0021939631314577, -1631691327518e-16]],
    [642400, [13.971521374415, -28.339941764789, -13.083792871886], [0.0029334630526035, 91860931752944e-17, -59939422488627e-17]],
    [671600, [39.526942044143, 28.93989736011, -2.872799527539], [-0.0010068481658095, 0.001702113288809, 83578230511981e-17]],
    [700800, [-15.576200701394, 34.399412961275, 15.466033737854], [-0.0020098814612884, -0.0017191109825989, 70414782780416e-18]],
    [73e4, [4.24325283709, -30.118201690825, -10.707441231349], [0.0031725847067411, 1609846120227e-16, -90672150593868e-17]]
  ];
  var TerseVector = class _TerseVector {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    clone() {
      return new _TerseVector(this.x, this.y, this.z);
    }
    ToAstroVector(t) {
      return new Vector(this.x, this.y, this.z, t);
    }
    static zero() {
      return new _TerseVector(0, 0, 0);
    }
    quadrature() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    add(other) {
      return new _TerseVector(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    sub(other) {
      return new _TerseVector(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    incr(other) {
      this.x += other.x;
      this.y += other.y;
      this.z += other.z;
    }
    decr(other) {
      this.x -= other.x;
      this.y -= other.y;
      this.z -= other.z;
    }
    mul(scalar) {
      return new _TerseVector(scalar * this.x, scalar * this.y, scalar * this.z);
    }
    div(scalar) {
      return new _TerseVector(this.x / scalar, this.y / scalar, this.z / scalar);
    }
    mean(other) {
      return new _TerseVector((this.x + other.x) / 2, (this.y + other.y) / 2, (this.z + other.z) / 2);
    }
    neg() {
      return new _TerseVector(-this.x, -this.y, -this.z);
    }
  };
  var body_state_t = class _body_state_t {
    constructor(tt, r, v) {
      this.tt = tt;
      this.r = r;
      this.v = v;
    }
    clone() {
      return new _body_state_t(this.tt, this.r, this.v);
    }
    sub(other) {
      return new _body_state_t(this.tt, this.r.sub(other.r), this.v.sub(other.v));
    }
  };
  function BodyStateFromTable(entry) {
    let [tt, [rx, ry, rz], [vx, vy, vz]] = entry;
    return new body_state_t(tt, new TerseVector(rx, ry, rz), new TerseVector(vx, vy, vz));
  }
  function AdjustBarycenterPosVel(ssb, tt, body, planet_gm) {
    const shift = planet_gm / (planet_gm + SUN_GM);
    const planet = CalcVsopPosVel(vsop[body], tt);
    ssb.r.incr(planet.r.mul(shift));
    ssb.v.incr(planet.v.mul(shift));
    return planet;
  }
  function AccelerationIncrement(small_pos, gm, major_pos) {
    const delta = major_pos.sub(small_pos);
    const r2 = delta.quadrature();
    return delta.mul(gm / (r2 * Math.sqrt(r2)));
  }
  var major_bodies_t = class {
    constructor(tt) {
      let ssb = new body_state_t(tt, new TerseVector(0, 0, 0), new TerseVector(0, 0, 0));
      this.Jupiter = AdjustBarycenterPosVel(ssb, tt, Body.Jupiter, JUPITER_GM);
      this.Saturn = AdjustBarycenterPosVel(ssb, tt, Body.Saturn, SATURN_GM);
      this.Uranus = AdjustBarycenterPosVel(ssb, tt, Body.Uranus, URANUS_GM);
      this.Neptune = AdjustBarycenterPosVel(ssb, tt, Body.Neptune, NEPTUNE_GM);
      this.Jupiter.r.decr(ssb.r);
      this.Jupiter.v.decr(ssb.v);
      this.Saturn.r.decr(ssb.r);
      this.Saturn.v.decr(ssb.v);
      this.Uranus.r.decr(ssb.r);
      this.Uranus.v.decr(ssb.v);
      this.Neptune.r.decr(ssb.r);
      this.Neptune.v.decr(ssb.v);
      this.Sun = new body_state_t(tt, ssb.r.mul(-1), ssb.v.mul(-1));
    }
    Acceleration(pos) {
      let acc = AccelerationIncrement(pos, SUN_GM, this.Sun.r);
      acc.incr(AccelerationIncrement(pos, JUPITER_GM, this.Jupiter.r));
      acc.incr(AccelerationIncrement(pos, SATURN_GM, this.Saturn.r));
      acc.incr(AccelerationIncrement(pos, URANUS_GM, this.Uranus.r));
      acc.incr(AccelerationIncrement(pos, NEPTUNE_GM, this.Neptune.r));
      return acc;
    }
  };
  var body_grav_calc_t = class _body_grav_calc_t {
    constructor(tt, r, v, a) {
      this.tt = tt;
      this.r = r;
      this.v = v;
      this.a = a;
    }
    clone() {
      return new _body_grav_calc_t(this.tt, this.r.clone(), this.v.clone(), this.a.clone());
    }
  };
  var grav_sim_t = class {
    constructor(bary, grav) {
      this.bary = bary;
      this.grav = grav;
    }
  };
  function UpdatePosition(dt, r, v, a) {
    return new TerseVector(r.x + dt * (v.x + dt * a.x / 2), r.y + dt * (v.y + dt * a.y / 2), r.z + dt * (v.z + dt * a.z / 2));
  }
  function UpdateVelocity(dt, v, a) {
    return new TerseVector(v.x + dt * a.x, v.y + dt * a.y, v.z + dt * a.z);
  }
  function GravSim(tt2, calc1) {
    const dt = tt2 - calc1.tt;
    const bary2 = new major_bodies_t(tt2);
    const approx_pos = UpdatePosition(dt, calc1.r, calc1.v, calc1.a);
    const mean_acc = bary2.Acceleration(approx_pos).mean(calc1.a);
    const pos = UpdatePosition(dt, calc1.r, calc1.v, mean_acc);
    const vel = calc1.v.add(mean_acc.mul(dt));
    const acc = bary2.Acceleration(pos);
    const grav = new body_grav_calc_t(tt2, pos, vel, acc);
    return new grav_sim_t(bary2, grav);
  }
  var pluto_cache = [];
  function ClampIndex(frac, nsteps) {
    const index = Math.floor(frac);
    if (index < 0)
      return 0;
    if (index >= nsteps)
      return nsteps - 1;
    return index;
  }
  function GravFromState(entry) {
    const state = BodyStateFromTable(entry);
    const bary = new major_bodies_t(state.tt);
    const r = state.r.add(bary.Sun.r);
    const v = state.v.add(bary.Sun.v);
    const a = bary.Acceleration(r);
    const grav = new body_grav_calc_t(state.tt, r, v, a);
    return new grav_sim_t(bary, grav);
  }
  function GetSegment(cache, tt) {
    const t0 = PlutoStateTable[0][0];
    if (tt < t0 || tt > PlutoStateTable[PLUTO_NUM_STATES - 1][0]) {
      return null;
    }
    const seg_index = ClampIndex((tt - t0) / PLUTO_TIME_STEP, PLUTO_NUM_STATES - 1);
    if (!cache[seg_index]) {
      const seg = cache[seg_index] = [];
      seg[0] = GravFromState(PlutoStateTable[seg_index]).grav;
      seg[PLUTO_NSTEPS - 1] = GravFromState(PlutoStateTable[seg_index + 1]).grav;
      let i;
      let step_tt = seg[0].tt;
      for (i = 1; i < PLUTO_NSTEPS - 1; ++i)
        seg[i] = GravSim(step_tt += PLUTO_DT, seg[i - 1]).grav;
      step_tt = seg[PLUTO_NSTEPS - 1].tt;
      var reverse = [];
      reverse[PLUTO_NSTEPS - 1] = seg[PLUTO_NSTEPS - 1];
      for (i = PLUTO_NSTEPS - 2; i > 0; --i)
        reverse[i] = GravSim(step_tt -= PLUTO_DT, reverse[i + 1]).grav;
      for (i = PLUTO_NSTEPS - 2; i > 0; --i) {
        const ramp = i / (PLUTO_NSTEPS - 1);
        seg[i].r = seg[i].r.mul(1 - ramp).add(reverse[i].r.mul(ramp));
        seg[i].v = seg[i].v.mul(1 - ramp).add(reverse[i].v.mul(ramp));
        seg[i].a = seg[i].a.mul(1 - ramp).add(reverse[i].a.mul(ramp));
      }
    }
    return cache[seg_index];
  }
  function CalcPlutoOneWay(entry, target_tt, dt) {
    let sim = GravFromState(entry);
    const n = Math.ceil((target_tt - sim.grav.tt) / dt);
    for (let i = 0; i < n; ++i)
      sim = GravSim(i + 1 === n ? target_tt : sim.grav.tt + dt, sim.grav);
    return sim;
  }
  function CalcPluto(time, helio) {
    let r, v, bary;
    const seg = GetSegment(pluto_cache, time.tt);
    if (!seg) {
      let sim;
      if (time.tt < PlutoStateTable[0][0])
        sim = CalcPlutoOneWay(PlutoStateTable[0], time.tt, -PLUTO_DT);
      else
        sim = CalcPlutoOneWay(PlutoStateTable[PLUTO_NUM_STATES - 1], time.tt, +PLUTO_DT);
      r = sim.grav.r;
      v = sim.grav.v;
      bary = sim.bary;
    } else {
      const left = ClampIndex((time.tt - seg[0].tt) / PLUTO_DT, PLUTO_NSTEPS - 1);
      const s1 = seg[left];
      const s2 = seg[left + 1];
      const acc = s1.a.mean(s2.a);
      const ra = UpdatePosition(time.tt - s1.tt, s1.r, s1.v, acc);
      const va = UpdateVelocity(time.tt - s1.tt, s1.v, acc);
      const rb = UpdatePosition(time.tt - s2.tt, s2.r, s2.v, acc);
      const vb = UpdateVelocity(time.tt - s2.tt, s2.v, acc);
      const ramp = (time.tt - s1.tt) / PLUTO_DT;
      r = ra.mul(1 - ramp).add(rb.mul(ramp));
      v = va.mul(1 - ramp).add(vb.mul(ramp));
    }
    if (helio) {
      if (!bary)
        bary = new major_bodies_t(time.tt);
      r = r.sub(bary.Sun.r);
      v = v.sub(bary.Sun.v);
    }
    return new StateVector(r.x, r.y, r.z, v.x, v.y, v.z, time);
  }
  var Rotation_JUP_EQJ = new RotationMatrix([
    [0.999432765338654, -0.0336771074697641, 0],
    [0.0303959428906285, 0.902057912352809, 0.430543388542295],
    [-0.0144994559663353, -0.430299169409101, 0.902569881273754]
  ]);
  function HelioVector(body, date) {
    var time = MakeTime(date);
    if (body in vsop)
      return CalcVsop(vsop[body], time);
    if (body === Body.Pluto) {
      const p = CalcPluto(time, true);
      return new Vector(p.x, p.y, p.z, time);
    }
    if (body === Body.Sun)
      return new Vector(0, 0, 0, time);
    if (body === Body.Moon) {
      var e = CalcVsop(vsop.Earth, time);
      var m = GeoMoon(time);
      return new Vector(e.x + m.x, e.y + m.y, e.z + m.z, time);
    }
    if (body === Body.EMB) {
      const e2 = CalcVsop(vsop.Earth, time);
      const m2 = GeoMoon(time);
      const denom = 1 + EARTH_MOON_MASS_RATIO;
      return new Vector(e2.x + m2.x / denom, e2.y + m2.y / denom, e2.z + m2.z / denom, time);
    }
    if (body === Body.SSB)
      return CalcSolarSystemBarycenter(time);
    const star = UserDefinedStar(body);
    if (star) {
      const sphere = new Spherical(star.dec, 15 * star.ra, star.dist);
      return VectorFromSphere(sphere, time);
    }
    throw `HelioVector: Unknown body "${body}"`;
  }
  function CorrectLightTravel(func, time) {
    let ltime = time;
    let dt = 0;
    for (let iter = 0; iter < 10; ++iter) {
      const pos = func(ltime);
      const lt = pos.Length() / C_AUDAY;
      if (lt > 1)
        throw `Object is too distant for light-travel solver.`;
      const ltime2 = time.AddDays(-lt);
      dt = Math.abs(ltime2.tt - ltime.tt);
      if (dt < 1e-9)
        return pos;
      ltime = ltime2;
    }
    throw `Light-travel time solver did not converge: dt = ${dt}`;
  }
  var BodyPosition = class {
    constructor(observerBody, targetBody, aberration, observerPos) {
      this.observerBody = observerBody;
      this.targetBody = targetBody;
      this.aberration = aberration;
      this.observerPos = observerPos;
    }
    Position(time) {
      if (this.aberration) {
        this.observerPos = HelioVector(this.observerBody, time);
      } else {
      }
      const targetPos = HelioVector(this.targetBody, time);
      return new Vector(targetPos.x - this.observerPos.x, targetPos.y - this.observerPos.y, targetPos.z - this.observerPos.z, time);
    }
  };
  function BackdatePosition(date, observerBody, targetBody, aberration) {
    VerifyBoolean(aberration);
    const time = MakeTime(date);
    if (UserDefinedStar(targetBody)) {
      const tvec = HelioVector(targetBody, time);
      if (aberration) {
        const ostate = HelioState(observerBody, time);
        const rvec = new Vector(tvec.x - ostate.x, tvec.y - ostate.y, tvec.z - ostate.z, time);
        const s2 = C_AUDAY / rvec.Length();
        return new Vector(rvec.x + ostate.vx / s2, rvec.y + ostate.vy / s2, rvec.z + ostate.vz / s2, time);
      }
      const ovec = HelioVector(observerBody, time);
      return new Vector(tvec.x - ovec.x, tvec.y - ovec.y, tvec.z - ovec.z, time);
    }
    let observerPos;
    if (aberration) {
      observerPos = new Vector(0, 0, 0, time);
    } else {
      observerPos = HelioVector(observerBody, time);
    }
    const bpos = new BodyPosition(observerBody, targetBody, aberration, observerPos);
    return CorrectLightTravel((t) => bpos.Position(t), time);
  }
  function GeoVector(body, date, aberration) {
    VerifyBoolean(aberration);
    const time = MakeTime(date);
    switch (body) {
      case Body.Earth:
        return new Vector(0, 0, 0, time);
      case Body.Moon:
        return GeoMoon(time);
      default:
        const vec = BackdatePosition(time, Body.Earth, body, aberration);
        vec.t = time;
        return vec;
    }
  }
  function ExportState(terse, time) {
    return new StateVector(terse.r.x, terse.r.y, terse.r.z, terse.v.x, terse.v.y, terse.v.z, time);
  }
  function HelioState(body, date) {
    const time = MakeTime(date);
    switch (body) {
      case Body.Sun:
        return new StateVector(0, 0, 0, 0, 0, 0, time);
      case Body.SSB:
        const bary = new major_bodies_t(time.tt);
        return new StateVector(-bary.Sun.r.x, -bary.Sun.r.y, -bary.Sun.r.z, -bary.Sun.v.x, -bary.Sun.v.y, -bary.Sun.v.z, time);
      case Body.Mercury:
      case Body.Venus:
      case Body.Earth:
      case Body.Mars:
      case Body.Jupiter:
      case Body.Saturn:
      case Body.Uranus:
      case Body.Neptune:
        const planet = CalcVsopPosVel(vsop[body], time.tt);
        return ExportState(planet, time);
      case Body.Pluto:
        return CalcPluto(time, true);
      case Body.Moon:
      case Body.EMB:
        const earth = CalcVsopPosVel(vsop.Earth, time.tt);
        const state = body == Body.Moon ? GeoMoonState(time) : GeoEmbState(time);
        return new StateVector(state.x + earth.r.x, state.y + earth.r.y, state.z + earth.r.z, state.vx + earth.v.x, state.vy + earth.v.y, state.vz + earth.v.z, time);
      default:
        if (UserDefinedStar(body)) {
          const vec = HelioVector(body, time);
          return new StateVector(vec.x, vec.y, vec.z, 0, 0, 0, time);
        }
        throw `HelioState: Unsupported body "${body}"`;
    }
  }
  function QuadInterp(tm, dt, fa, fm, fb) {
    let Q = (fb + fa) / 2 - fm;
    let R = (fb - fa) / 2;
    let S = fm;
    let x;
    if (Q == 0) {
      if (R == 0) {
        return null;
      }
      x = -S / R;
      if (x < -1 || x > 1)
        return null;
    } else {
      let u2 = R * R - 4 * Q * S;
      if (u2 <= 0)
        return null;
      let ru = Math.sqrt(u2);
      let x1 = (-R + ru) / (2 * Q);
      let x2 = (-R - ru) / (2 * Q);
      if (-1 <= x1 && x1 <= 1) {
        if (-1 <= x2 && x2 <= 1)
          return null;
        x = x1;
      } else if (-1 <= x2 && x2 <= 1) {
        x = x2;
      } else {
        return null;
      }
    }
    let t = tm + x * dt;
    let df_dt = (2 * Q * x + R) / dt;
    return { t, df_dt };
  }
  function Search(f2, t1, t2, options) {
    const dt_tolerance_seconds = VerifyNumber(options && options.dt_tolerance_seconds || 1);
    const dt_days = Math.abs(dt_tolerance_seconds / SECONDS_PER_DAY);
    let f1 = options && options.init_f1 || f2(t1);
    let f22 = options && options.init_f2 || f2(t2);
    let fmid = NaN;
    let iter = 0;
    let iter_limit = options && options.iter_limit || 20;
    let calc_fmid = true;
    while (true) {
      if (++iter > iter_limit)
        throw `Excessive iteration in Search()`;
      let tmid = InterpolateTime(t1, t2, 0.5);
      let dt = tmid.ut - t1.ut;
      if (Math.abs(dt) < dt_days) {
        return tmid;
      }
      if (calc_fmid)
        fmid = f2(tmid);
      else
        calc_fmid = true;
      let q = QuadInterp(tmid.ut, t2.ut - tmid.ut, f1, fmid, f22);
      if (q) {
        let tq = MakeTime(q.t);
        let fq = f2(tq);
        if (q.df_dt !== 0) {
          if (Math.abs(fq / q.df_dt) < dt_days) {
            return tq;
          }
          let dt_guess = 1.2 * Math.abs(fq / q.df_dt);
          if (dt_guess < dt / 10) {
            let tleft = tq.AddDays(-dt_guess);
            let tright = tq.AddDays(+dt_guess);
            if ((tleft.ut - t1.ut) * (tleft.ut - t2.ut) < 0) {
              if ((tright.ut - t1.ut) * (tright.ut - t2.ut) < 0) {
                let fleft = f2(tleft);
                let fright = f2(tright);
                if (fleft < 0 && fright >= 0) {
                  f1 = fleft;
                  f22 = fright;
                  t1 = tleft;
                  t2 = tright;
                  fmid = fq;
                  calc_fmid = false;
                  continue;
                }
              }
            }
          }
        }
      }
      if (f1 < 0 && fmid >= 0) {
        t2 = tmid;
        f22 = fmid;
        continue;
      }
      if (fmid < 0 && f22 >= 0) {
        t1 = tmid;
        f1 = fmid;
        continue;
      }
      return null;
    }
  }
  function LongitudeOffset(diff) {
    let offset = diff;
    while (offset <= -180)
      offset += 360;
    while (offset > 180)
      offset -= 360;
    return offset;
  }
  function NormalizeLongitude(lon) {
    while (lon < 0)
      lon += 360;
    while (lon >= 360)
      lon -= 360;
    return lon;
  }
  function SearchSunLongitude(targetLon, dateStart, limitDays) {
    function sun_offset(t) {
      let pos = SunPosition(t);
      return LongitudeOffset(pos.elon - targetLon);
    }
    VerifyNumber(targetLon);
    VerifyNumber(limitDays);
    let t1 = MakeTime(dateStart);
    let t2 = t1.AddDays(limitDays);
    return Search(sun_offset, t1, t2, { dt_tolerance_seconds: 0.01 });
  }
  function PairLongitude(body1, body2, date) {
    if (body1 === Body.Earth || body2 === Body.Earth)
      throw "The Earth does not have a longitude as seen from itself.";
    const time = MakeTime(date);
    const vector1 = GeoVector(body1, time, false);
    const eclip1 = Ecliptic(vector1);
    const vector2 = GeoVector(body2, time, false);
    const eclip2 = Ecliptic(vector2);
    return NormalizeLongitude(eclip1.elon - eclip2.elon);
  }
  function MoonPhase(date) {
    return PairLongitude(Body.Moon, Body.Sun, date);
  }
  function SearchMoonPhase(targetLon, dateStart, limitDays) {
    function moon_offset(t) {
      let mlon = MoonPhase(t);
      return LongitudeOffset(mlon - targetLon);
    }
    VerifyNumber(targetLon);
    VerifyNumber(limitDays);
    const uncertainty = 1.5;
    const ta = MakeTime(dateStart);
    let ya = moon_offset(ta);
    let est_dt, dt1, dt2;
    if (limitDays < 0) {
      if (ya < 0)
        ya += 360;
      est_dt = -(MEAN_SYNODIC_MONTH * ya) / 360;
      dt2 = est_dt + uncertainty;
      if (dt2 < limitDays)
        return null;
      dt1 = Math.max(limitDays, est_dt - uncertainty);
    } else {
      if (ya > 0)
        ya -= 360;
      est_dt = -(MEAN_SYNODIC_MONTH * ya) / 360;
      dt1 = est_dt - uncertainty;
      if (dt1 > limitDays)
        return null;
      dt2 = Math.min(limitDays, est_dt + uncertainty);
    }
    const t1 = ta.AddDays(dt1);
    const t2 = ta.AddDays(dt2);
    return Search(moon_offset, t1, t2, { dt_tolerance_seconds: 0.1 });
  }
  var ApsisKind;
  (function(ApsisKind2) {
    ApsisKind2[ApsisKind2["Pericenter"] = 0] = "Pericenter";
    ApsisKind2[ApsisKind2["Apocenter"] = 1] = "Apocenter";
  })(ApsisKind || (ApsisKind = {}));
  function VectorFromSphere(sphere, time) {
    time = MakeTime(time);
    const radlat = sphere.lat * DEG2RAD;
    const radlon = sphere.lon * DEG2RAD;
    const rcoslat = sphere.dist * Math.cos(radlat);
    return new Vector(rcoslat * Math.cos(radlon), rcoslat * Math.sin(radlon), sphere.dist * Math.sin(radlat), time);
  }
  var EclipseKind;
  (function(EclipseKind2) {
    EclipseKind2["Penumbral"] = "penumbral";
    EclipseKind2["Partial"] = "partial";
    EclipseKind2["Annular"] = "annular";
    EclipseKind2["Total"] = "total";
  })(EclipseKind || (EclipseKind = {}));
  var NodeEventKind;
  (function(NodeEventKind2) {
    NodeEventKind2[NodeEventKind2["Invalid"] = 0] = "Invalid";
    NodeEventKind2[NodeEventKind2["Ascending"] = 1] = "Ascending";
    NodeEventKind2[NodeEventKind2["Descending"] = -1] = "Descending";
  })(NodeEventKind || (NodeEventKind = {}));

  // src/lib/birth-calendar.mjs
  var JST_MS = 9 * 36e5;
  var DAY_MS = 864e5;
  var STEMS = ["\u7532", "\u4E59", "\u4E19", "\u4E01", "\u620A", "\u5DF1", "\u5E9A", "\u8F9B", "\u58EC", "\u7678"];
  var BRANCHES = ["\u5B50", "\u4E11", "\u5BC5", "\u536F", "\u8FB0", "\u5DF3", "\u5348", "\u672A", "\u7533", "\u9149", "\u620C", "\u4EA5"];
  var STARS = ["\u4E00\u767D\u6C34\u661F", "\u4E8C\u9ED2\u571F\u661F", "\u4E09\u78A7\u6728\u661F", "\u56DB\u7DD1\u6728\u661F", "\u4E94\u9EC4\u571F\u661F", "\u516D\u767D\u91D1\u661F", "\u4E03\u8D64\u91D1\u661F", "\u516B\u767D\u571F\u661F", "\u4E5D\u7D2B\u706B\u661F"];
  var TERMS = [
    ["\u5C0F\u5BD2", 285, 1, 5],
    ["\u5927\u5BD2", 300, 1, 20],
    ["\u7ACB\u6625", 315, 2, 4],
    ["\u96E8\u6C34", 330, 2, 19],
    ["\u5553\u87C4", 345, 3, 5],
    ["\u6625\u5206", 0, 3, 20],
    ["\u6E05\u660E", 15, 4, 5],
    ["\u7A40\u96E8", 30, 4, 20],
    ["\u7ACB\u590F", 45, 5, 5],
    ["\u5C0F\u6E80", 60, 5, 21],
    ["\u8292\u7A2E", 75, 6, 6],
    ["\u590F\u81F3", 90, 6, 21],
    ["\u5C0F\u6691", 105, 7, 7],
    ["\u5927\u6691", 120, 7, 23],
    ["\u7ACB\u79CB", 135, 8, 7],
    ["\u51E6\u6691", 150, 8, 23],
    ["\u767D\u9732", 165, 9, 7],
    ["\u79CB\u5206", 180, 9, 23],
    ["\u5BD2\u9732", 195, 10, 8],
    ["\u971C\u964D", 210, 10, 23],
    ["\u7ACB\u51AC", 225, 11, 7],
    ["\u5C0F\u96EA", 240, 11, 22],
    ["\u5927\u96EA", 255, 12, 7],
    ["\u51AC\u81F3", 270, 12, 22]
  ];
  var yearlyTerms = /* @__PURE__ */ new Map();
  var mod = (a, b) => (a % b + b) % b;
  var jstDay = (date) => new Date(date.getTime() + JST_MS).toISOString().slice(0, 10);
  var midnightUtc = (date) => Date.parse(date + "T00:00:00Z");
  function solarTermsForYear(year) {
    if (!Number.isSafeInteger(year) || year < 1899 || year > 2100) throw Error("\u5BFE\u5FDC\u3057\u3066\u3044\u306A\u3044\u66A6\u5E74\u3067\u3059");
    if (yearlyTerms.has(year)) return yearlyTerms.get(year);
    const results = TERMS.map(([name, longitude, month, day]) => {
      const start = new Date(Date.UTC(year, month - 1, day - 6));
      const found = SearchSunLongitude(longitude, start, 13);
      if (!found) throw Error("\u4E8C\u5341\u56DB\u7BC0\u6C17\u306E\u8A08\u7B97\u306B\u5931\u6557\u3057\u307E\u3057\u305F: " + year + " " + name);
      const at = found.date;
      if (at.getUTCFullYear() < year - 1 || at.getUTCFullYear() > year + 1) throw Error("\u7BC0\u6C17\u65E5\u6642\u304C\u4E0D\u6B63\u3067\u3059");
      return Object.freeze({ name, date: jstDay(at), jstTime: new Date(at.getTime() + JST_MS + 3e4).toISOString().slice(11, 16), utc: at.toISOString() });
    });
    if (results.some((x, i) => i > 0 && x.date < results[i - 1].date)) throw Error("\u7BC0\u6C17\u306E\u6642\u7CFB\u5217\u304C\u4E0D\u6B63\u3067\u3059");
    Object.freeze(results);
    yearlyTerms.set(year, results);
    return results;
  }
  function birthStarAndEto(birthday) {
    if (!isDate(birthday)) throw Error("\u6B63\u3057\u3044\u751F\u5E74\u6708\u65E5\u304C\u5FC5\u8981\u3067\u3059");
    const year = Number(birthday.slice(0, 4));
    const risshun = solarTermsForYear(year).find((x) => x.name === "\u7ACB\u6625");
    const boundary = birthday === risshun.date;
    const effectiveYear = birthday < risshun.date ? year - 1 : year;
    const stars = (y) => STARS[mod(2008 - y, 9)];
    const eto = (y) => {
      const step = mod(y - 1984, 60);
      return STEMS[step % 10] + BRANCHES[step % 12];
    };
    return {
      boundary,
      risshunDate: risshun.date,
      risshunTime: risshun.jstTime,
      effectiveYear: boundary ? null : effectiveYear,
      star: boundary ? "\u8981\u78BA\u8A8D" : stars(effectiveYear),
      eto: boundary ? "\u8981\u78BA\u8A8D" : eto(effectiveYear),
      alternatives: boundary ? [{ year: year - 1, star: stars(year - 1), eto: eto(year - 1) }, { year, star: stars(year), eto: eto(year) }] : []
    };
  }
  function birthSolarTerm(birthday) {
    if (!isDate(birthday)) throw Error("\u6B63\u3057\u3044\u751F\u5E74\u6708\u65E5\u304C\u5FC5\u8981\u3067\u3059");
    const year = Number(birthday.slice(0, 4));
    const all = [...solarTermsForYear(year - 1), ...solarTermsForYear(year)];
    const idx = all.findLastIndex((x) => x.date <= birthday);
    if (idx < 0) throw Error("\u7BC0\u6C17\u3092\u7279\u5B9A\u3067\u304D\u307E\u305B\u3093");
    const current = all[idx], previous = all[idx - 1];
    const boundary = birthday === current.date;
    return {
      name: boundary ? "\u7BC0\u5165\u308A\u5F53\u65E5" : current.name,
      boundary,
      current: current.name,
      previous: previous?.name ?? "",
      date: current.date,
      time: current.jstTime
    };
  }
  function birthMoon(birthday) {
    if (!isDate(birthday)) throw Error("\u6B63\u3057\u3044\u751F\u5E74\u6708\u65E5\u304C\u5FC5\u8981\u3067\u3059");
    const noon = new Date(Date.parse(birthday + "T03:00:00Z"));
    const lastNewMoon = SearchMoonPhase(0, noon, -32);
    if (!lastNewMoon || lastNewMoon.date > noon) throw Error("\u6708\u9F62\u306E\u8A08\u7B97\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    const age = (noon - lastNewMoon.date) / DAY_MS;
    if (!(age >= 0 && age < 31)) throw Error("\u6708\u9F62\u304C\u4E0D\u6B63\u3067\u3059");
    const phase = MoonPhase(noon);
    const names = ["\u65B0\u6708\u306B\u8FD1\u3044", "\u6E80\u3061\u59CB\u3081", "\u4E0A\u5F26\u306B\u8FD1\u3044", "\u6E80\u3061\u3066\u3044\u304F\u6708", "\u6E80\u6708\u306B\u8FD1\u3044", "\u6B20\u3051\u59CB\u3081", "\u4E0B\u5F26\u306B\u8FD1\u3044", "\u7D30\u3044\u6708"];
    const index = Math.floor(mod(phase + 22.5, 360) / 45) % 8;
    return { age: Math.round(age * 10) / 10, label: names[index], reference: "\u65E5\u672C\u6642\u9593\u30FB\u6B63\u5348\u57FA\u6E96\u306E\u76EE\u5B89" };
  }
  function nextDayMilestone(birthday, at = todayLocal()) {
    if (!isDate(birthday) || !isDate(at)) throw Error("\u6B63\u3057\u3044\u65E5\u4ED8\u304C\u5FC5\u8981\u3067\u3059");
    const born = midnightUtc(birthday), now = midnightUtc(at);
    if (now < born) throw Error("\u8A95\u751F\u524D\u306E\u65E5\u4ED8\u306F\u5BFE\u8C61\u5916\u3067\u3059");
    const todayDay = Math.round((now - born) / DAY_MS) + 1;
    const milestone = Math.ceil(todayDay / 1e3) * 1e3;
    const goalDate = new Date(born + (milestone - 1) * DAY_MS).toISOString().slice(0, 10);
    return { milestone, date: goalDate, remaining: milestone - todayDay, currentDay: todayDay };
  }
  function birthCalendarFacts(birthday, at = todayLocal()) {
    return {
      star: birthStarAndEto(birthday),
      term: birthSolarTerm(birthday),
      moon: birthMoon(birthday),
      milestone: nextDayMilestone(birthday, at)
    };
  }

  // src/lib/custom-cards.mjs
  var CARD_SIZES = { square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], wide: [1200, 675] };
  var CARD_PRESETS = {
    minimal: { label: "\u30B7\u30F3\u30D7\u30EB", bg: "#f3f8f4", ink: "#225c48", accent: "#5a9982" },
    business: { label: "\u30D3\u30B8\u30CD\u30B9", bg: "#e8f0f5", ink: "#15384b", accent: "#5586a9" },
    natural: { label: "\u30CA\u30C1\u30E5\u30E9\u30EB", bg: "#f7f2e7", ink: "#59674c", accent: "#a3b58a" },
    cute: { label: "\u304B\u308F\u3044\u3044", bg: "#fff0f5", ink: "#a44d7c", accent: "#eaa1c1" },
    pop: { label: "\u30DD\u30C3\u30D7", bg: "#fff1bd", ink: "#513d8b", accent: "#e4865e" },
    retro: { label: "\u30EC\u30C8\u30ED", bg: "#eee1ca", ink: "#624631", accent: "#b7804c" },
    dark: { label: "\u30C0\u30FC\u30AF", bg: "#202f42", ink: "#ffffff", accent: "#8ebdca" },
    gaming: { label: "\u30B2\u30FC\u30E0\u30FBSNS", bg: "#171935", ink: "#f7edff", accent: "#ba80ff" }
  };
  var color = (x) => typeof x === "string" && /^#[0-9a-fA-F]{6}$/.test(x);
  var finite = (x, min, max) => typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
  var newLayer = (type, overrides = {}) => ({
    id: crypto.randomUUID(),
    type,
    x: 0.12,
    y: 0.36,
    w: 0.76,
    h: 0.16,
    text: "",
    fill: "#255943",
    fontSize: 72,
    fontFamily: "sans-serif",
    weight: "700",
    align: "center",
    opacity: 1,
    rotation: 0,
    hidden: false,
    locked: false,
    assetId: "",
    radius: 0.16,
    imageScale: 1,
    imageX: 0,
    imageY: 0,
    ...overrides
  });
  function makeCard(title = "\u65B0\u3057\u3044\u30AB\u30FC\u30C9", preset = "minimal", size = "square") {
    if (!CARD_PRESETS[preset] || !CARD_SIZES[size]) throw Error("\u30AB\u30FC\u30C9\u8A2D\u5B9A\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    const style = CARD_PRESETS[preset];
    const L = (type, values) => newLayer(type, values);
    const label = (text, x, y, w, h2, fs, align = "center", weight = "700", family = "sans-serif") => L("text", { text, x, y, w, h: h2, fontSize: fs, fill: style.ink, align, weight, fontFamily: family });
    let layers;
    switch (preset) {
      case "minimal":
        layers = [
          L("line", { x: 0.15, y: 0.25, w: 0.7, h: 0.015, fill: style.accent }),
          label("MY PROFILE", 0.13, 0.32, 0.74, 0.12, 58),
          label("\u3042\u306A\u305F\u3089\u3057\u3044\u4E00\u679A", 0.13, 0.53, 0.74, 0.1, 34, "center", "500"),
          L("ellipse", { x: 0.45, y: 0.77, w: 0.1, h: 0.1, fill: style.accent, opacity: 0.5 })
        ];
        break;
      case "business":
        layers = [
          L("shape", { x: 0.08, y: 0.1, w: 0.045, h: 0.8, fill: style.accent, radius: 0 }),
          label("PROFILE", 0.19, 0.22, 0.72, 0.14, 85, "left", "800"),
          label("\u81EA\u5206\u3089\u3057\u3044\u81EA\u5DF1\u7D39\u4ECB", 0.19, 0.49, 0.7, 0.16, 36, "left", "500"),
          L("line", { x: 0.19, y: 0.71, w: 0.61, h: 0.012, fill: style.ink, opacity: 0.35 })
        ];
        break;
      case "natural":
        layers = [
          L("ellipse", { x: -0.15, y: 0.58, w: 0.53, h: 0.52, fill: style.accent, opacity: 0.42 }),
          L("ellipse", { x: 0.67, y: -0.14, w: 0.45, h: 0.43, fill: "#ffffff", opacity: 0.52 }),
          label("hello,", 0.12, 0.32, 0.76, 0.2, 112, "left", "700", "serif"),
          label("\u597D\u304D\u306A\u3053\u3068\u3092\u3001\u597D\u304D\u306A\u3060\u3051\u3002", 0.14, 0.58, 0.7, 0.14, 32, "left", "500")
        ];
        break;
      case "cute":
        layers = [
          L("ellipse", { x: 0.05, y: 0.13, w: 0.28, h: 0.24, fill: "#ffffff", opacity: 0.65 }),
          L("ellipse", { x: 0.72, y: 0.69, w: 0.25, h: 0.26, fill: style.accent, opacity: 0.48 }),
          L("sticker", { x: 0.62, y: 0.14, w: 0.21, h: 0.18, text: "\u{1F338}" }),
          label("Nice to meet you!", 0.09, 0.37, 0.82, 0.18, 69, "center", "800"),
          label("\u308F\u305F\u3057\u306E\u597D\u304D\u304C\u8A70\u307E\u3063\u305F\u30AB\u30FC\u30C9", 0.1, 0.63, 0.8, 0.16, 34, "center", "500")
        ];
        break;
      case "pop":
        layers = [
          L("shape", { x: 0.07, y: 0.14, w: 0.86, h: 0.23, fill: style.accent, rotation: -8, radius: 0.04 }),
          L("ellipse", { x: 0.67, y: 0.6, w: 0.42, h: 0.4, fill: "#ffffff", opacity: 0.68 }),
          label("THIS IS ME!", 0.1, 0.29, 0.8, 0.24, 115, "center", "800"),
          label("\u81EA\u7531\u306B\u81EA\u5206\u3092\u7D39\u4ECB\u3057\u3088\u3046", 0.12, 0.63, 0.76, 0.16, 35, "center", "700")
        ];
        break;
      case "retro":
        layers = [
          L("shape", { x: 0.05, y: 0.07, w: 0.9, h: 0.86, fill: style.ink, opacity: 0.11, radius: 0 }),
          L("shape", { x: 0.075, y: 0.095, w: 0.85, h: 0.81, fill: style.bg, radius: 0 }),
          L("ellipse", { x: 0.4, y: 0.21, w: 0.2, h: 0.2, fill: style.accent, opacity: 0.75 }),
          label("MY STORY", 0.12, 0.43, 0.76, 0.18, 82, "center", "700", "serif"),
          label("PROFILE \xB7 JOURNAL", 0.2, 0.69, 0.6, 0.1, 29, "center", "500", "serif")
        ];
        break;
      case "dark":
        layers = [
          L("shape", { x: 0, y: 0, w: 0.12, h: 1, fill: style.accent, opacity: 0.27, radius: 0 }),
          L("line", { x: 0.18, y: 0.3, w: 0.64, h: 8e-3, fill: style.accent }),
          label("WHO AM I?", 0.18, 0.37, 0.64, 0.21, 95, "left", "800"),
          label("ABOUT ME", 0.18, 0.65, 0.64, 0.1, 37, "left", "500")
        ];
        break;
      default:
        layers = [
          L("shape", { x: 0.05, y: 0.08, w: 0.9, h: 0.1, fill: style.accent, opacity: 0.5, rotation: -4, radius: 0.1 }),
          L("ellipse", { x: 0.68, y: 0.62, w: 0.38, h: 0.38, fill: style.accent, opacity: 0.28 }),
          label("PLAYER ONE", 0.09, 0.33, 0.82, 0.22, 99, "center", "800"),
          label("\u81EA\u5206\u3089\u3057\u304F\u3001\u3064\u306A\u304C\u308D\u3046\u3002", 0.13, 0.65, 0.74, 0.12, 31, "center", "600")
        ];
    }
    return { version: 1, id: crypto.randomUUID(), title, preset, size, bg: style.bg, bg2: style.accent, backgroundMode: "gradient", faces: [{ id: "front", layers }], updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  function validateCard(card) {
    if (!card || card.version !== 1 || typeof card.id !== "string" || !card.id || typeof card.title !== "string" || card.title.length > 60 || !CARD_PRESETS[card.preset] || !CARD_SIZES[card.size] || !color(card.bg) || card.bg2 !== void 0 && !color(card.bg2) || card.backgroundMode !== void 0 && !["solid", "gradient"].includes(card.backgroundMode) || !Array.isArray(card.faces) || card.faces.length < 1 || card.faces.length > 2 || card.faces[0]?.id !== "front" || card.faces[1] && card.faces[1].id !== "back" || !card.faces.every((face) => Array.isArray(face.layers) && face.layers.length <= 100 && (face.backgroundAssetId === void 0 || typeof face.backgroundAssetId === "string" && /^[A-Za-z0-9_-]{6,120}$/.test(face.backgroundAssetId)) && (face.backgroundScale === void 0 || finite(face.backgroundScale, 1, 5)) && (face.backgroundX === void 0 || finite(face.backgroundX, -1, 1)) && (face.backgroundY === void 0 || finite(face.backgroundY, -1, 1))))
      throw Error("\u30AB\u30B9\u30BF\u30E0\u30AB\u30FC\u30C9\u306E\u5F62\u5F0F\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    const ids = /* @__PURE__ */ new Set();
    for (const face of card.faces) for (const a of face.layers) {
      if (!a || typeof a.id !== "string" || !a.id || ids.has(a.id) || !["text", "shape", "ellipse", "line", "sticker", "image"].includes(a.type) || ![a.x, a.y, a.w, a.h].every((v) => finite(v, -2, 3)) || a.w <= 0 || a.h <= 0 || !finite(a.opacity, 0, 1) || !finite(a.rotation, -360, 360) || !finite(a.fontSize, 8, 400) || !finite(a.radius, 0, 0.5) || a.imageScale !== void 0 && !finite(a.imageScale, 1, 5) || a.imageX !== void 0 && !finite(a.imageX, -1, 1) || a.imageY !== void 0 && !finite(a.imageY, -1, 1) || !color(a.fill) || typeof a.text !== "string" || a.text.length > 1200 || !["sans-serif", "serif", "monospace"].includes(a.fontFamily) || !["400", "500", "600", "700", "800"].includes(a.weight) || !["left", "center", "right"].includes(a.align) || typeof a.hidden !== "boolean" || typeof a.locked !== "boolean" || typeof a.assetId !== "string" || a.assetId.length > 120)
        throw Error("\u30AB\u30B9\u30BF\u30E0\u30AB\u30FC\u30C9\u306E\u30EC\u30A4\u30E4\u30FC\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
      ids.add(a.id);
    }
    return card;
  }
  function validateCards(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.cards) || data.cards.length > 200) throw Error("\u30AB\u30FC\u30C9\u4E00\u89A7\u5F62\u5F0F\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    const seen = /* @__PURE__ */ new Set();
    for (const card of data.cards) {
      validateCard(card);
      if (seen.has(card.id)) throw Error("\u30AB\u30FC\u30C9ID\u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059");
      seen.add(card.id);
    }
    return data;
  }
  function createCardsStore(storage, key) {
    if (!storage || typeof key !== "string") throw Error("\u30AB\u30FC\u30C9\u4FDD\u5B58\u5834\u6240\u304C\u5FC5\u8981\u3067\u3059");
    const read = () => {
      const raw = storage.getItem(key);
      return validateCards(raw === null ? { version: 1, cards: [] } : JSON.parse(raw));
    };
    const write = (data) => {
      validateCards(data);
      storage.setItem(key, JSON.stringify(data));
      return data;
    };
    return { read, write, clear: () => storage.removeItem(key) };
  }
  function duplicateCard(source) {
    validateCard(source);
    const copy2 = structuredClone(source);
    copy2.id = crypto.randomUUID();
    copy2.title = (source.title + " \u306E\u30B3\u30D4\u30FC").slice(0, 60);
    for (const face of copy2.faces) for (const layer of face.layers) layer.id = crypto.randomUUID();
    copy2.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return copy2;
  }
  function cardAssetIds(card) {
    return card.faces.flatMap((face) => [
      ...face.backgroundAssetId ? [face.backgroundAssetId] : [],
      ...face.layers.map((layer) => layer.assetId).filter(Boolean)
    ]);
  }
  function removeCardAssets(cards, removedId) {
    const removed = cards.find((c) => c.id === removedId);
    if (!removed) return [];
    const assets = new Set(cardAssetIds(removed));
    const others = new Set(cards.filter((c) => c.id !== removedId).flatMap(cardAssetIds));
    return [...assets].filter((id) => !others.has(id));
  }

  // src/services/card-art.mjs
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

  // node_modules/@capacitor/share/dist/esm/index.js
  init_dist();
  var Share = registerPlugin("Share", {
    web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.ShareWeb())
  });

  // src/services/card-art.mjs
  var keyFor = (id) => "img-" + id + ".jpg";
  function createCardAssets() {
    const native = Capacitor.getPlatform() === "ios";
    async function db() {
      return new Promise((resolve2, reject) => {
        const request = indexedDB.open("myprof-card-images-v1", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("assets");
        request.onsuccess = () => resolve2(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    async function webRequest(mode, fn) {
      const conn = await db();
      try {
        return await new Promise((resolve2, reject) => {
          const tx = conn.transaction("assets", mode), store3 = tx.objectStore("assets");
          const req = fn(store3);
          req.onsuccess = () => resolve2(req.result);
          req.onerror = () => reject(req.error);
          tx.onabort = () => reject(tx.error);
        });
      } finally {
        conn.close();
      }
    }
    return {
      async put(data) {
        if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length > 25e5) throw Error("\u753B\u50CF\u5F62\u5F0F\u307E\u305F\u306F\u30B5\u30A4\u30BA\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
        const id = crypto.randomUUID();
        if (native) await Filesystem.writeFile({ path: keyFor(id), directory: Directory.Data, data: data.split(",")[1] });
        else await webRequest("readwrite", (s2) => s2.put(data, id));
        return id;
      },
      async get(id) {
        if (!/^[\w-]{6,120}$/.test(id)) throw Error("\u753B\u50CFID\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
        if (native) {
          const r = await Filesystem.readFile({ path: keyFor(id), directory: Directory.Data });
          return "data:image/jpeg;base64," + r.data;
        }
        const data = await webRequest("readonly", (s2) => s2.get(id));
        if (!data) throw Error("\u30AB\u30FC\u30C9\u753B\u50CF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
        return data;
      },
      async remove(id) {
        if (!/^[\w-]{6,120}$/.test(id)) throw Error("\u753B\u50CFID\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
        if (native) {
          await Filesystem.deleteFile({ path: keyFor(id), directory: Directory.Data });
          return;
        }
        await webRequest("readwrite", (s2) => s2.delete(id));
      }
    };
  }
  function rounded(ctx, x, y, w, h2, r) {
    r = Math.max(0, Math.min(r, w / 2, h2 / 2));
    ctx.beginPath();
    ctx.roundRect(x, y, w, h2, r);
  }
  function fitText(ctx, value, maxWidth, fontSize, weight, family) {
    let n = fontSize;
    ctx.font = weight + " " + n + "px " + family;
    while (ctx.measureText(value).width > maxWidth && n > 14) {
      n -= 2;
      ctx.font = weight + " " + n + "px " + family;
    }
  }
  async function imageFor(id, assets, cache) {
    if (!cache.has(id)) {
      const src = await assets.get(id);
      const img = new Image();
      await new Promise((resolve2, reject) => {
        img.onload = resolve2;
        img.onerror = () => reject(Error("\u753B\u50CF\u3092\u8868\u793A\u3067\u304D\u307E\u305B\u3093"));
        img.src = src;
      });
      cache.set(id, img);
    }
    return cache.get(id);
  }
  async function renderCardFace(canvas, card, faceId, assets, { cache = /* @__PURE__ */ new Map() } = {}) {
    validateCard(card);
    const [w, h2] = CARD_SIZES[card.size];
    canvas.width = w;
    canvas.height = h2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("\u63CF\u753B\u30AD\u30E3\u30F3\u30D0\u30B9\u3092\u4F5C\u6210\u3067\u304D\u307E\u305B\u3093");
    if (card.backgroundMode === "gradient") {
      const gradient = ctx.createLinearGradient(0, 0, w, h2);
      gradient.addColorStop(0, card.bg);
      gradient.addColorStop(1, card.bg2 || card.bg);
      ctx.fillStyle = gradient;
    } else ctx.fillStyle = card.bg;
    ctx.fillRect(0, 0, w, h2);
    const face = card.faces.find((x) => x.id === faceId);
    if (!face) throw Error("\u30AB\u30FC\u30C9\u306E\u9762\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    if (face.backgroundAssetId) {
      const img = await imageFor(face.backgroundAssetId, assets, cache);
      const z = Math.max(w / img.width, h2 / img.height) * (face.backgroundScale || 1);
      const iw = img.width * z, ih = img.height * z;
      ctx.drawImage(img, (w - iw) / 2 + (face.backgroundX || 0) * w, (h2 - ih) / 2 + (face.backgroundY || 0) * h2, iw, ih);
    }
    for (const a of face.layers) {
      if (a.hidden) continue;
      const x = a.x * w, y = a.y * h2, lw = a.w * w, lh = a.h * h2;
      ctx.save();
      ctx.globalAlpha = a.opacity;
      ctx.translate(x + lw / 2, y + lh / 2);
      ctx.rotate(a.rotation * Math.PI / 180);
      ctx.translate(-lw / 2, -lh / 2);
      ctx.fillStyle = a.fill;
      if (a.type === "shape") {
        rounded(ctx, 0, 0, lw, lh, a.radius * Math.min(lw, lh));
        ctx.fill();
      }
      if (a.type === "ellipse") {
        ctx.beginPath();
        ctx.ellipse(lw / 2, lh / 2, lw / 2, lh / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (a.type === "line") {
        ctx.strokeStyle = a.fill;
        ctx.lineWidth = Math.max(3, lw * 0.012);
        ctx.beginPath();
        ctx.moveTo(0, lh / 2);
        ctx.lineTo(lw, lh / 2);
        ctx.stroke();
      }
      if (a.type === "sticker") {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = Math.round(Math.min(lw, lh) * 0.85) + "px sans-serif";
        ctx.fillText(a.text || "\u2728", lw / 2, lh / 2);
      }
      if (a.type === "text") {
        const base = a.fontSize * (w / 1080);
        ctx.textBaseline = "top";
        ctx.textAlign = a.align;
        const anchor = a.align === "left" ? 0 : a.align === "right" ? lw : lw / 2;
        const lines = a.text.split("\n");
        let top = 0;
        for (const line of lines) {
          fitText(ctx, line, lw, base, a.weight, a.fontFamily);
          const height = Number(ctx.font.match(/[0-9]+px/)?.[0].replace("px", "") || base) * 1.2;
          if (top + height > lh + 10) break;
          ctx.fillText(line, anchor, top, lw);
          top += height;
        }
      }
      if (a.type === "image" && a.assetId) {
        const img = await imageFor(a.assetId, assets, cache);
        ctx.save();
        rounded(ctx, 0, 0, lw, lh, a.radius * Math.min(lw, lh));
        ctx.clip();
        const z = Math.max(lw / img.width, lh / img.height) * (a.imageScale || 1), sw = img.width * z, sh = img.height * z;
        ctx.drawImage(img, (lw - sw) / 2 + (a.imageX || 0) * lw, (lh - sh) / 2 + (a.imageY || 0) * lh, sw, sh);
        ctx.restore();
      }
      ctx.restore();
    }
    return canvas;
  }
  async function cardPng(card, face, assets) {
    const canvas = document.createElement("canvas");
    await renderCardFace(canvas, card, face, assets);
    return canvas.toDataURL("image/png");
  }
  function safeFilename(name) {
    const cleaned = name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim().slice(0, 45);
    return (cleaned || "myprof-card") + ".png";
  }
  async function deliverCardPng(dataUrl, title, { share = false } = {}) {
    if (!/^data:image\/png;base64,/.test(dataUrl)) throw Error("PNG\u753B\u50CF\u304C\u3042\u308A\u307E\u305B\u3093");
    const filename = safeFilename(title);
    if (Capacitor.getPlatform() === "ios") {
      const { uri } = await Filesystem.writeFile({ path: filename, directory: Directory.Cache, data: dataUrl.split(",")[1] });
      const address = uri || (await Filesystem.getUri({ path: filename, directory: Directory.Cache })).uri;
      try {
        await Share.share({ title: filename, url: address, dialogTitle: share ? "\u30AB\u30FC\u30C9\u753B\u50CF\u3092\u5171\u6709" : "\u753B\u50CF\u3092\u4FDD\u5B58\u3059\u308B\u5834\u6240\u3092\u9078\u629E" });
      } finally {
        try {
          await Filesystem.deleteFile({ path: filename, directory: Directory.Cache });
        } catch (error) {
          console.warn("[MyProf] Cached PNG cleanup", error);
        }
      }
      return;
    }
    if (share && navigator.share) {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return;
      }
    }
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  // src/lib/card-templates.mjs
  var CARD_FIELD_SETS = {
    free: { label: "\u81EA\u7531\u7DE8\u96C6\uFF08\u9805\u76EE\u306A\u3057\uFF09", heading: "", fields: [] },
    basic: { label: "\u57FA\u672C\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB", heading: "ABOUT ME", fields: ["\u8868\u793A\u540D", "\u3072\u3068\u3053\u3068", "\u8DA3\u5473", "\u597D\u304D\u306A\u3053\u3068"] },
    social: { label: "X\u30FBInstagram\u306A\u3069\u306ESNS", heading: "SOCIAL PROFILE", fields: ["\u8868\u793A\u540D", "\u30A2\u30AB\u30A6\u30F3\u30C8\u540D", "\u597D\u304D\u306A\u3053\u3068", "\u3072\u3068\u3053\u3068"] },
    favorites: { label: "\u8DA3\u5473\u30FB\u63A8\u3057\u6D3B", heading: "MY FAVORITES", fields: ["\u30CB\u30C3\u30AF\u30CD\u30FC\u30E0", "\u8DA3\u5473", "\u597D\u304D\u306A\u4F5C\u54C1\u30FB\u63A8\u3057", "\u3072\u3068\u3053\u3068"] },
    business: { label: "\u4ED5\u4E8B\u30FB\u6D3B\u52D5\u7D39\u4ECB", heading: "WORK PROFILE", fields: ["\u6D3B\u52D5\u540D\u30FB\u304A\u540D\u524D", "\u80A9\u66F8\u304D", "\u5F97\u610F\u306A\u3053\u3068", "\u30E1\u30C3\u30BB\u30FC\u30B8"] },
    gaming: { label: "\u30B2\u30FC\u30E0\u4EF2\u9593", heading: "PLAYER CARD", fields: ["\u30D7\u30EC\u30A4\u30E4\u30FC\u540D", "\u597D\u304D\u306A\u30B2\u30FC\u30E0", "\u30D7\u30EC\u30A4\u30B9\u30BF\u30A4\u30EB", "\u3072\u3068\u3053\u3068"] }
  };
  var signature = (layer) => JSON.stringify([
    layer.type,
    layer.x,
    layer.y,
    layer.w,
    layer.h,
    layer.text,
    layer.fill,
    layer.opacity,
    layer.rotation,
    layer.radius,
    layer.hidden,
    layer.locked
  ]);
  var stockArt = (preset) => makeCard("template-preview", preset).faces[0].layers.filter((l) => l.type !== "text");
  function applyCardMood(card, preset) {
    validateCard(card);
    const from = CARD_PRESETS[card.preset], to = CARD_PRESETS[preset];
    if (!to) throw Error("\u30C7\u30B6\u30A4\u30F3\u306E\u96F0\u56F2\u6C17\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
    if (card.preset === preset) return card;
    const originalArt = new Set(stockArt(card.preset).map(signature));
    const front = card.faces[0];
    const retained = front.layers.filter((l) => !originalArt.has(signature(l)));
    const hadStockArt = retained.length < front.layers.length;
    const newArt = hadStockArt ? stockArt(preset) : [];
    if (retained.length + newArt.length > 100) throw Error("\u88C5\u98FE\u3092\u5909\u66F4\u3059\u308B\u7A7A\u304D\u304C\u3042\u308A\u307E\u305B\u3093");
    if (hadStockArt) front.layers = [...newArt, ...retained];
    for (const face of card.faces) for (const layer of face.layers) {
      if (layer.fill.toLowerCase() === from.ink.toLowerCase()) layer.fill = to.ink;
      else if (layer.fill.toLowerCase() === from.accent.toLowerCase()) layer.fill = to.accent;
    }
    card.preset = preset;
    card.bg = to.bg;
    card.bg2 = to.accent;
    return validateCard(card);
  }
  function insertCardFields(card, template = "basic", faceId = "front", { replaceStarterText = false } = {}) {
    validateCard(card);
    const preset = CARD_FIELD_SETS[template];
    const face = card.faces.find((f2) => f2.id === faceId);
    if (!preset || !face) throw Error("\u9805\u76EE\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u3092\u9078\u3073\u76F4\u3057\u3066\u304F\u3060\u3055\u3044");
    const style = CARD_PRESETS[card.preset];
    if (replaceStarterText) {
      face.layers = face.layers.filter((l) => l.type !== "text");
    }
    if (preset.fields.length === 0) return validateCard(card);
    const ink = style.ink;
    const items = [
      newLayer("text", { x: 0.12, y: 0.105, w: 0.76, h: 0.105, text: preset.heading, fill: ink, fontSize: 58, weight: "800", align: "left" }),
      ...preset.fields.flatMap((label, i) => {
        const y = 0.25 + i * 0.162;
        return [
          newLayer("text", { x: 0.12, y, w: 0.76, h: 0.052, text: label, fill: style.accent, fontSize: 26, weight: "700", align: "left" }),
          newLayer("text", { x: 0.12, y: y + 0.052, w: 0.76, h: 0.089, text: label + "\u3092\u5165\u529B", fill: ink, fontSize: 45, weight: "500", align: "left" })
        ];
      })
    ];
    if (face.layers.length + items.length > 100) throw Error("\u3053\u308C\u4EE5\u4E0A\u9805\u76EE\u3092\u8FFD\u52A0\u3067\u304D\u307E\u305B\u3093\u3002\u4E0D\u8981\u306A\u9805\u76EE\u3092\u524A\u9664\u3057\u3066\u304F\u3060\u3055\u3044");
    face.layers.push(...items);
    return validateCard(card);
  }
  function makeCardWithFields(card, template = "basic") {
    return insertCardFields(card, template, "front", { replaceStarterText: true });
  }

  // src/custom-cards-ui.mjs
  var h = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var $ = (id) => document.getElementById(id);
  var clone = (x) => structuredClone(x);
  var clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  var LABELS = { text: "\u6587\u5B57", shape: "\u56DB\u89D2", ellipse: "\u4E38", line: "\u7DDA", sticker: "\u30B9\u30C6\u30C3\u30AB\u30FC", image: "\u5199\u771F" };
  function chooseCardMarkup(card, displayFace = "front") {
    return '<div class="custom-card-top"><div><span class="eyebrow">MY CARD \xB7 ' + h(card.size.toUpperCase()) + "</span><h2>" + h(card.title) + '</h2><small>\u30AB\u30FC\u30C9\u3054\u3068\u306B\u516C\u958B\u3057\u305F\u3044\u60C5\u5831\u3092\u81EA\u7531\u306B\u8A2D\u5B9A\u3067\u304D\u307E\u3059</small></div></div><div class="custom-preview-wrap"><canvas id="custom-card-preview" aria-label="' + h(card.title) + "\u306E" + (displayFace === "back" ? "\u88CF\u9762" : "\u8868\u9762") + '\u30D7\u30EC\u30D3\u30E5\u30FC" role="img"></canvas></div>' + (card.faces.some((f2) => f2.id === "back") ? '<div class="custom-card-side-switch" role="group" aria-label="\u30AB\u30FC\u30C9\u306E\u8868\u3068\u88CF"><button type="button" data-custom="show-front" class="' + (displayFace === "front" ? "chosen" : "") + '">\u8868\u9762</button><button type="button" data-custom="show-back" class="' + (displayFace === "back" ? "chosen" : "") + '">\u88CF\u9762</button></div>' : "") + '<div class="custom-card-actions"><button class="primary-button" data-custom="edit">\u270E \u7DE8\u96C6\u3059\u308B</button><button class="secondary-button" data-custom="download">\u753B\u50CF\u3092\u4FDD\u5B58</button><button class="secondary-button" data-custom="share">\u5171\u6709\u3059\u308B</button></div><p class="help small">\u4FDD\u5B58\u30FB\u5171\u6709\u3059\u308B\u306E\u306F\u3053\u306E\u30AB\u30FC\u30C9\u306B\u8F09\u305B\u305F\u5185\u5BB9\u3060\u3051\u3067\u3059\u3002\u500B\u4EBA\u306E\u6A19\u6E96\u30AB\u30FC\u30C9\u306F\u5171\u6709\u5BFE\u8C61\u5916\u3067\u3059\u3002</p><div class="custom-card-management"><button data-custom="duplicate">\u30AB\u30FC\u30C9\u3092\u8907\u88FD</button><button data-custom="left">\u5DE6\u3078</button><button data-custom="right">\u53F3\u3078</button><button data-custom="delete">\u30AB\u30FC\u30C9\u524A\u9664</button></div>';
  }
  function createCustomCardsUI({ storage, namespace, notify: notify2, confirmAction, ads: ads2 }) {
    const store3 = createCardsStore(storage, namespace + ".cards.v1");
    const assets = createCardAssets();
    const purgeKey = namespace + ".cards.pending-purge.v1";
    async function finishPurging() {
      const raw = storage.getItem(purgeKey);
      if (!raw) return;
      const remaining = JSON.parse(raw);
      if (!Array.isArray(remaining)) throw Error("\u753B\u50CF\u524A\u9664\u51E6\u7406\u306E\u72B6\u614B\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093");
      for (const id of remaining.slice()) {
        try {
          await assets.remove(id);
          remaining.shift();
          storage.setItem(purgeKey, JSON.stringify(remaining));
        } catch (error) {
          console.warn("[MyProf] Image removal pending retry", error);
          return;
        }
      }
      storage.removeItem(purgeKey);
    }
    void finishPurging().catch((e) => console.error("[MyProf] Image purge resume", e));
    let all = store3.read(), selected = "personal", displayFace = "front", onChange = () => {
    };
    let draft = null, original = "", currentFace = "front", activeLayer = null, history = [], step = 0;
    let seq = 0, modal = null, lastFocus2 = null, previousOverflow = "", wasInert = false;
    let pointer = /* @__PURE__ */ new Map(), drag = null, zoom = 1, pinch = null;
    let exportPng = "", exportDocument = null, exportFace = "front";
    let temporaryImageIds = /* @__PURE__ */ new Set();
    const editorImageCache = /* @__PURE__ */ new Map();
    const selectedCard = () => all.cards.find((c) => c.id === selected) || null;
    const face = () => draft.faces.find((f2) => f2.id === currentFace);
    const layer = () => face()?.layers.find((l) => l.id === activeLayer);
    const saveList = (next) => {
      store3.write(next);
      all = next;
      onChange();
    };
    const resetHistory = () => {
      history = [JSON.stringify(draft)];
      step = 0;
    };
    function record() {
      validateCard(draft);
      history = history.slice(0, step + 1);
      history.push(JSON.stringify(draft));
      if (history.length > 50) history.shift();
      step = history.length - 1;
      updateEditor();
    }
    function modify(fn) {
      fn();
      draft.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      record();
    }
    function setModal(id) {
      if (modal) throw Error("\u4ED6\u306E\u30AB\u30FC\u30C9\u753B\u9762\u304C\u958B\u3044\u3066\u3044\u307E\u3059");
      lastFocus2 = document.activeElement;
      previousOverflow = document.body.style.overflow;
      wasInert = $("app-main").inert;
      modal = id;
      $(id).hidden = false;
      document.body.style.overflow = "hidden";
      $("app-main").inert = true;
      void ads2.setModalOpen(true).catch((e) => console.error(e));
      $(id).querySelector("[data-autofocus]")?.focus({ preventScroll: true });
    }
    function closeModal() {
      if (!modal) return;
      const node = $(modal);
      if (node.contains(document.activeElement)) document.activeElement.blur();
      node.hidden = true;
      modal = null;
      document.body.style.overflow = previousOverflow;
      $("app-main").inert = wasInert;
      void ads2.setModalOpen(false).catch((e) => console.error(e));
      if (lastFocus2?.isConnected) lastFocus2.focus({ preventScroll: true });
    }
    async function cleanDraftImages() {
      const active = new Set(all.cards.flatMap(cardAssetIds));
      for (const id of temporaryImageIds) if (!active.has(id)) {
        try {
          await assets.remove(id);
        } catch (error) {
          console.warn("[MyProf] Unused draft image cleanup", error);
        }
      }
      temporaryImageIds.clear();
    }
    async function closeEditor() {
      if (modal !== "custom-card-overlay") return;
      if (JSON.stringify(draft) !== original) {
        if (!await confirmAction({ title: "\u7DE8\u96C6\u5185\u5BB9\u306F\u672A\u4FDD\u5B58\u3067\u3059", message: "\u4FDD\u5B58\u305B\u305A\u306B\u30AB\u30FC\u30C9\u7DE8\u96C6\u3092\u9589\u3058\u307E\u3059\u304B\uFF1F", acceptLabel: "\u4FDD\u5B58\u305B\u305A\u306B\u9589\u3058\u308B", danger: true })) return;
      }
      closeModal();
      draft = null;
      editorImageCache.clear();
      await cleanDraftImages();
    }
    const api = {
      onChange(fn) {
        onChange = fn;
      },
      current() {
        return selected;
      },
      renderTabs() {
        const node = $("card-file-tabs");
        if (!node) return;
        node.innerHTML = '<div class="file-tabs-scroll" role="tablist" aria-label="\u30AB\u30FC\u30C9\u3092\u9078\u629E"><button class="file-tab ' + (selected === "personal" ? "active" : "") + '" data-card-select="personal" role="tab" aria-selected="' + (selected === "personal") + '">\u500B\u4EBA</button>' + all.cards.map((c) => '<button class="file-tab ' + (selected === c.id ? "active" : "") + '" role="tab" aria-selected="' + (selected === c.id) + '" data-card-select="' + h(c.id) + '" title="' + h(c.title) + '">' + h(c.title) + "</button>").join("") + '</div><button id="card-add" class="file-tab-add" type="button" aria-label="\u30AB\u30FC\u30C9\u3092\u8FFD\u52A0">\uFF0B</button>';
      },
      renderSelected(el) {
        const c = selectedCard();
        if (!c) return false;
        if (!c.faces.some((f2) => f2.id === displayFace)) displayFace = "front";
        el.innerHTML = chooseCardMarkup(c, displayFace);
        void renderCardFace($("custom-card-preview"), c, displayFace, assets).catch((e) => notify2("\u30AB\u30FC\u30C9\u3092\u8868\u793A\u3067\u304D\u307E\u305B\u3093: " + e.message));
        return true;
      },
      async clearAll() {
        const ids = new Set(all.cards.flatMap(cardAssetIds));
        storage.setItem(purgeKey, JSON.stringify([...ids]));
        store3.clear();
        all = { version: 1, cards: [] };
        selected = "personal";
        onChange();
        await finishPurging();
      }
    };
    function select(id) {
      if (id !== "personal" && !all.cards.some((c) => c.id === id)) throw Error("\u30AB\u30FC\u30C9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
      selected = id;
      displayFace = "front";
      onChange();
    }
    function previewTemplate() {
      const preset = $("card-create-preset").value, size = $("card-create-size").value;
      const preview = makeCardWithFields(makeCard("\u30D7\u30EC\u30D3\u30E5\u30FC", preset, size), $("card-create-fields").value);
      void renderCardFace($("card-create-preview"), preview, "front", assets).catch((error) => notify2(error.message));
    }
    function openCreate() {
      $("card-create-title").value = "";
      $("card-create-preset").value = "minimal";
      $("card-create-size").value = "square";
      $("card-create-fields").value = "basic";
      previewTemplate();
      setModal("custom-create-overlay");
    }
    function create() {
      const title = $("card-create-title").value.trim() || "\u65B0\u3057\u3044\u30AB\u30FC\u30C9";
      const card = makeCardWithFields(makeCard(title, $("card-create-preset").value, $("card-create-size").value), $("card-create-fields").value);
      saveList({ ...all, cards: [...all.cards, card] });
      closeModal();
      select(card.id);
      openEditor();
    }
    function openEditor() {
      const c = selectedCard();
      if (!c) return;
      draft = clone(c);
      original = JSON.stringify(draft);
      temporaryImageIds.clear();
      currentFace = "front";
      activeLayer = null;
      zoom = 1;
      editorImageCache.clear();
      resetHistory();
      setModal("custom-card-overlay");
      updateEditor();
    }
    async function saveDraft() {
      validateCard(draft);
      const previous = selectedCard();
      const oldAssets = previous ? new Set(cardAssetIds(previous)) : /* @__PURE__ */ new Set();
      const cards = all.cards.map((c) => c.id === draft.id ? clone(draft) : c);
      saveList({ ...all, cards });
      original = JSON.stringify(draft);
      closeModal();
      draft = null;
      editorImageCache.clear();
      await cleanDraftImages();
      const stillUsed = new Set(all.cards.flatMap(cardAssetIds));
      for (const id of oldAssets) if (!stillUsed.has(id)) {
        try {
          await assets.remove(id);
        } catch (error) {
          console.warn("[MyProf] Replaced background cleanup", error);
        }
      }
      notify2("\u30AB\u30FC\u30C9\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F");
      void ads2.onNaturalBreak?.("card-save").catch((error) => console.warn("[MyProf] ad break", error));
    }
    function movePosition(direction) {
      const card = selectedCard();
      const list = [...all.cards], i = list.findIndex((c) => c.id === card.id), j = i + (direction === "left" ? -1 : 1);
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      saveList({ ...all, cards: list });
    }
    async function deleteSelected() {
      const c = selectedCard();
      if (!c) return;
      if (!await confirmAction({ title: "\u30AB\u30FC\u30C9\u3092\u524A\u9664", message: "\u300C" + c.title + "\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u3002\u500B\u4EBA\u30AB\u30FC\u30C9\u3084\u4ED6\u306E\u30AB\u30FC\u30C9\u306F\u524A\u9664\u3055\u308C\u307E\u305B\u3093\u3002", danger: true, acceptLabel: "\u524A\u9664\u3059\u308B" })) return;
      const garbage = removeCardAssets(all.cards, c.id), remaining = all.cards.filter((x) => x.id !== c.id);
      saveList({ ...all, cards: remaining });
      selected = "personal";
      onChange();
      for (const id of garbage) try {
        await assets.remove(id);
      } catch (e) {
        console.warn("Unused card image cleanup", e);
      }
      notify2("\u30AB\u30FC\u30C9\u3092\u524A\u9664\u3057\u307E\u3057\u305F");
    }
    function duplicate() {
      const c = selectedCard();
      if (!c) return;
      const copy2 = duplicateCard(c);
      saveList({ ...all, cards: [...all.cards, copy2] });
      select(copy2.id);
      notify2("\u30AB\u30FC\u30C9\u3092\u8907\u88FD\u3057\u307E\u3057\u305F");
    }
    function addFace() {
      if (draft.faces.some((f2) => f2.id === "back")) {
        currentFace = "back";
        updateEditor();
        return;
      }
      modify(() => {
        draft.faces.push({ id: "back", layers: [] });
        currentFace = "back";
        activeLayer = null;
      });
    }
    function removeFace() {
      if (currentFace !== "back") return;
      modify(() => {
        draft.faces = draft.faces.filter((f2) => f2.id !== "back");
        currentFace = "front";
        activeLayer = null;
      });
    }
    function addLayer(type, extras = {}) {
      const preset = CARD_PRESETS[draft.preset];
      const props = type === "text" ? { text: "\u6587\u5B57\u3092\u5165\u529B", fill: preset.ink, x: 0.1, y: 0.32, w: 0.8, h: 0.2 } : type === "sticker" ? { text: "\u2728", x: 0.37, y: 0.34, w: 0.26, h: 0.26 } : type === "ellipse" ? { w: 0.28, h: 0.22, x: 0.36, y: 0.36, fill: preset.accent } : type === "line" ? { w: 0.66, h: 0.05, x: 0.17, y: 0.5, fill: preset.accent } : type === "image" ? { x: 0.22, y: 0.2, w: 0.56, h: 0.5, radius: 0.2 } : { x: 0.2, y: 0.25, w: 0.6, h: 0.35, fill: preset.accent, radius: 0.1 };
      const l = newLayer(type, { ...props, ...extras });
      modify(() => {
        face().layers.push(l);
        activeLayer = l.id;
      });
    }
    async function importImage(file, { asBackground = false } = {}) {
      if (!file || !file.type.startsWith("image/") || file.size > 12 * 1024 * 1024) throw Error("12MB\u4EE5\u4E0B\u306E\u5199\u771F\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044");
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        await new Promise((resolve2, reject) => {
          img.onload = resolve2;
          img.onerror = () => reject(Error("\u753B\u50CF\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093"));
          img.src = url;
        });
        const z = Math.min(1, 1300 / img.width, 1300 / img.height);
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * z));
        c.height = Math.max(1, Math.round(img.height * z));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const encoded = c.toDataURL("image/jpeg", 0.78);
        const assetId = await assets.put(encoded);
        temporaryImageIds.add(assetId);
        if (asBackground) modify(() => {
          face().backgroundAssetId = assetId;
          face().backgroundScale = 1;
          face().backgroundX = 0;
          face().backgroundY = 0;
        });
        else addLayer("image", { assetId });
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    function deleteLayer() {
      const a = layer();
      if (!a) return;
      modify(() => {
        face().layers = face().layers.filter((l) => l.id !== a.id);
        activeLayer = null;
      });
    }
    function updateEditor() {
      if (!draft) return;
      $("card-editor-title").value = draft.title;
      $("card-editor-preset").value = draft.preset;
      const bgFace = face();
      $("card-remove-background").disabled = !bgFace.backgroundAssetId;
      $("card-background-adjust").hidden = !bgFace.backgroundAssetId;
      if (bgFace.backgroundAssetId) {
        $("card-background-scale").value = bgFace.backgroundScale ?? 1;
        $("card-background-x").value = bgFace.backgroundX ?? 0;
        $("card-background-y").value = bgFace.backgroundY ?? 0;
      }
      $("card-editor-bg").value = draft.bg;
      $("card-editor-bg2").value = draft.bg2 || draft.bg;
      $("card-editor-background-style").value = draft.backgroundMode || "solid";
      $("card-editor-size").value = draft.size;
      $("card-face-front").classList.toggle("chosen", currentFace === "front");
      $("card-face-back").classList.toggle("chosen", currentFace === "back");
      $("card-face-remove").disabled = currentFace !== "back";
      $("card-undo").disabled = step === 0;
      $("card-redo").disabled = step === history.length - 1;
      const a = layer();
      $("card-layers").innerHTML = face().layers.slice().reverse().map((x) => '<button class="card-layer-item ' + (activeLayer === x.id ? "active" : "") + '" data-layer-id="' + h(x.id) + '">' + (x.hidden ? "\u25EF " : "\u25CF ") + h(LABELS[x.type]) + " \xB7 " + h((x.text || "").slice(0, 14)) + (x.locked ? " \u{1F512}" : "") + "</button>").join("");
      $("card-properties").hidden = !a;
      const editText = Boolean(a && ["text", "sticker"].includes(a.type));
      $("card-quick-edit").hidden = !editText;
      if (editText) $("card-quick-text").value = a.text;
      if (a) {
        for (const prop of ["text", "x", "y", "w", "h", "rotation", "opacity", "fontSize", "fill", "fontFamily", "align", "weight", "radius", "imageScale", "imageX", "imageY"])
          if ($("card-prop-" + prop)) $("card-prop-" + prop).value = ["x", "y", "w", "h"].includes(prop) ? Math.round(a[prop] * 100) : prop === "opacity" ? Math.round(a.opacity * 100) : prop === "radius" ? Math.round(a.radius * 100) : a[prop];
        $("card-prop-text-row").hidden = !["text", "sticker"].includes(a.type);
        $("card-prop-fonts").hidden = a.type !== "text";
        $("card-prop-image").hidden = a.type !== "image";
        $("card-layer-visibility").textContent = a.hidden ? "\u8868\u793A\u3059\u308B" : "\u975E\u8868\u793A";
        $("card-layer-lock").textContent = a.locked ? "\u30ED\u30C3\u30AF\u89E3\u9664" : "\u30ED\u30C3\u30AF";
      }
      const node = $("card-editor-canvas");
      node.style.width = Math.round(100 * zoom) + "%";
      void drawEditor();
    }
    async function drawEditor() {
      if (!draft) return;
      const index = ++seq, shadow = document.createElement("canvas");
      try {
        await renderCardFace(shadow, draft, currentFace, assets, { cache: editorImageCache });
        if (index !== seq || !draft) return;
        const canvas = $("card-editor-canvas");
        canvas.width = shadow.width;
        canvas.height = shadow.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(shadow, 0, 0);
        const a = layer();
        if (a && !a.hidden) {
          ctx.save();
          ctx.translate((a.x + a.w / 2) * canvas.width, (a.y + a.h / 2) * canvas.height);
          ctx.rotate(a.rotation * Math.PI / 180);
          ctx.strokeStyle = "#f7b944";
          ctx.lineWidth = Math.max(3, canvas.width / 220);
          ctx.setLineDash([12, 8]);
          ctx.strokeRect(-a.w * canvas.width / 2, -a.h * canvas.height / 2, a.w * canvas.width, a.h * canvas.height);
          ctx.setLineDash([]);
          ctx.fillStyle = "#ffd36a";
          ctx.beginPath();
          ctx.arc(a.w * canvas.width / 2, a.h * canvas.height / 2, Math.max(10, canvas.width / 75), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } catch (e) {
        if (index === seq) notify2(e.message);
      }
    }
    function editProperty(prop, value) {
      if (!draft) return;
      const a = layer();
      if (!a) return;
      const numeric = ["x", "y", "w", "h", "opacity", "rotation", "fontSize", "radius"].includes(prop);
      let result = numeric ? Number(value) : value;
      if (["imageScale", "imageX", "imageY"].includes(prop)) result = Number(value);
      if (numeric && !Number.isFinite(result)) return;
      if (["x", "y", "w", "h"].includes(prop)) result = clamp(result / 100, -200, 300);
      if (prop === "opacity") result = clamp(result / 100, 0, 1);
      if (prop === "radius") result = clamp(result / 100, 0, 0.5);
      if (prop === "rotation") result = clamp(result, -360, 360);
      if (prop === "fontSize") result = clamp(result, 8, 400);
      if (prop === "imageScale") result = clamp(result, 1, 5);
      if (prop === "imageX" || prop === "imageY") result = clamp(result, -1, 1);
      if (["w", "h"].includes(prop)) result = Math.max(0.01, result);
      modify(() => {
        a[prop] = result;
      });
    }
    function arrange(type) {
      const a = layer();
      if (!a) return;
      modify(() => {
        const list = face().layers, index = list.indexOf(a);
        if (type === "front" && index < list.length - 1) {
          list.splice(index, 1);
          list.push(a);
        }
        if (type === "back" && index > 0) {
          list.splice(index, 1);
          list.unshift(a);
        }
        if (type === "duplicate") {
          const b = clone(a);
          b.id = crypto.randomUUID();
          b.x = clamp(b.x + 0.03, -2, 3);
          b.y = clamp(b.y + 0.03, -2, 3);
          list.push(b);
          activeLayer = b.id;
        }
        if (type === "center") {
          a.x = (1 - a.w) / 2;
        }
        if (type === "middle") {
          a.y = (1 - a.h) / 2;
        }
      });
    }
    function undoRedo(direction) {
      const next = step + direction;
      if (next < 0 || next >= history.length) return;
      step = next;
      draft = JSON.parse(history[step]);
      if (!draft.faces.some((x) => x.id === currentFace)) currentFace = "front";
      if (!layer()) activeLayer = null;
      updateEditor();
    }
    function previewCoords(e) {
      const rect = $("card-editor-canvas").getBoundingClientRect();
      return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
    }
    function detectLayer(point) {
      const list = face().layers;
      for (let i = list.length - 1; i >= 0; i--) {
        const a = list[i];
        if (!a.hidden && point.x >= a.x && point.x <= a.x + a.w && point.y >= a.y && point.y <= a.y + a.h) return a.id;
      }
      return null;
    }
    function touchStart(e) {
      if (!draft) return;
      const canvas = $("card-editor-canvas");
      canvas.setPointerCapture?.(e.pointerId);
      pointer.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointer.size >= 2) {
        drag = null;
        const pairs = [...pointer.values()];
        pinch = { distance: Math.hypot(pairs[0].x - pairs[1].x, pairs[0].y - pairs[1].y), zoom, mid: { x: (pairs[0].x + pairs[1].x) / 2, y: (pairs[0].y + pairs[1].y) / 2 } };
        return;
      }
      const point = previewCoords(e);
      const id = detectLayer(point);
      activeLayer = id;
      updateEditor();
      if (id && !layer().locked) {
        const a = layer();
        const resize = Math.abs(point.x - (a.x + a.w)) < 0.045 && Math.abs(point.y - (a.y + a.h)) < 0.045;
        drag = { id, from: point, x: a.x, y: a.y, w: a.w, h: a.h, resize, moved: false };
      }
    }
    function touchMove(e) {
      if (!pointer.has(e.pointerId) || !draft) return;
      pointer.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointer.size >= 2 && pinch) {
        const pairs = [...pointer.values()];
        const distance = Math.hypot(pairs[0].x - pairs[1].x, pairs[0].y - pairs[1].y);
        if (pinch.distance > 0) {
          zoom = clamp(pinch.zoom * distance / pinch.distance, 0.45, 2.6);
          $("card-editor-canvas").style.width = Math.round(zoom * 100) + "%";
          $("card-zoom-label").textContent = Math.round(zoom * 100) + "%";
        }
        const mid = { x: (pairs[0].x + pairs[1].x) / 2, y: (pairs[0].y + pairs[1].y) / 2 };
        $("card-canvas-viewport").scrollLeft -= mid.x - pinch.mid.x;
        $("card-canvas-viewport").scrollTop -= mid.y - pinch.mid.y;
        pinch.mid = mid;
        return;
      }
      if (!drag) return;
      const a = layer();
      if (!a || drag.id !== a.id) return;
      const point = previewCoords(e);
      if (Math.abs(point.x - drag.from.x) + Math.abs(point.y - drag.from.y) > 3e-3) drag.moved = true;
      if (drag.resize) {
        a.w = clamp(drag.w + point.x - drag.from.x, 0.02, 2.9);
        a.h = clamp(drag.h + point.y - drag.from.y, 0.02, 2.9);
      } else {
        a.x = clamp(drag.x + point.x - drag.from.x, -1, 1.9);
        a.y = clamp(drag.y + point.y - drag.from.y, -1, 1.9);
      }
      void drawEditor();
    }
    function touchEnd(e) {
      if (!pointer.has(e.pointerId)) return;
      pointer.delete(e.pointerId);
      if (drag?.moved && draft) {
        record();
      }
      drag = null;
      if (pointer.size < 2) pinch = null;
    }
    async function exportCard(share) {
      const c = selectedCard();
      if (!c) throw Error("\u500B\u4EBA\u30AB\u30FC\u30C9\u306E\u753B\u50CF\u4FDD\u5B58\u30FB\u5171\u6709\u306F\u3067\u304D\u307E\u305B\u3093");
      exportDocument = c;
      exportFace = "front";
      $("card-export-face").innerHTML = c.faces.map((f2) => '<option value="' + f2.id + '">' + (f2.id === "front" ? "\u8868\u9762" : "\u88CF\u9762") + "</option>").join("");
      exportPng = await cardPng(c, exportFace, assets);
      $("card-export-image").src = exportPng;
      $("card-export-description").textContent = "\u300C" + c.title + "\u300D\u306E\u753B\u50CF\u306B\u3001\u898B\u305B\u305F\u304F\u306A\u3044\u60C5\u5831\u304C\u542B\u307E\u308C\u3066\u3044\u306A\u3044\u304B\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
      $("card-export-share").hidden = !share;
      $("card-export-download").hidden = share;
      setModal("custom-export-overlay");
    }
    async function exported(share) {
      if (!exportPng || !exportDocument) throw Error("\u5171\u6709\u3059\u308B\u753B\u50CF\u304C\u3042\u308A\u307E\u305B\u3093");
      await deliverCardPng(exportPng, exportDocument.title, { share });
      closeModal();
      notify2(share ? "\u5171\u6709\u5148\u306E\u9078\u629E\u3092\u958B\u304D\u307E\u3057\u305F" : "\u753B\u50CF\u306E\u4FDD\u5B58\u5148\u3092\u9078\u629E\u3057\u307E\u3057\u305F");
    }
    function handleEditorButton(action) {
      if (action === "save") return void saveDraft().catch((e) => notify2(e.message));
      if (action === "close") return void closeEditor().catch((e) => notify2(e.message));
      if (action === "add-text") addLayer("text");
      if (action === "add-shape") addLayer("shape");
      if (action === "add-ellipse") addLayer("ellipse");
      if (action === "add-line") addLayer("line");
      if (action === "add-sticker") addLayer("sticker");
      if (action === "add-photo") $("card-photo-file").click();
      if (action === "focus-properties") {
        if (!layer()) return;
        $("card-properties").scrollIntoView({ block: "start", behavior: "smooth" });
        const first = $("card-prop-text-row").hidden ? $("card-prop-x") : $("card-prop-text");
        first.focus({ preventScroll: true });
      }
      if (action === "add-background-photo") $("card-background-file").click();
      if (action === "remove-background-photo" && face().backgroundAssetId) modify(() => {
        delete face().backgroundAssetId;
        delete face().backgroundScale;
        delete face().backgroundX;
        delete face().backgroundY;
      });
      if (action === "add-fields") {
        const set = $("card-editor-fields").value;
        if (set === "free") {
          notify2("\u8FFD\u52A0\u3059\u308B\u9805\u76EE\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044");
          return;
        }
        try {
          modify(() => {
            insertCardFields(draft, set, currentFace);
            activeLayer = null;
          });
          notify2("\u9805\u76EE\u3092\u914D\u7F6E\u3057\u307E\u3057\u305F");
        } catch (error) {
          notify2(error.message);
        }
      }
      if (action === "back-face") addFace();
      if (action === "front-face") {
        currentFace = "front";
        activeLayer = null;
        updateEditor();
      }
      if (action === "remove-face") removeFace();
      if (action === "delete-layer") deleteLayer();
      if (action === "layer-visibility" && layer()) modify(() => {
        layer().hidden = !layer().hidden;
      });
      if (action === "layer-lock" && layer()) modify(() => {
        layer().locked = !layer().locked;
      });
      if (["front", "back", "duplicate", "center", "middle"].includes(action)) arrange(action);
      if (action === "undo") undoRedo(-1);
      if (action === "redo") undoRedo(1);
      if (action === "fit") {
        zoom = 1;
        updateEditor();
        $("card-zoom-label").textContent = "100%";
      }
      if (action === "zoom-in" || action === "zoom-out") {
        zoom = clamp(zoom * (action === "zoom-in" ? 1.25 : 0.8), 0.45, 2.6);
        updateEditor();
        $("card-zoom-label").textContent = Math.round(zoom * 100) + "%";
      }
    }
    function arrangeAdvancedEditor() {
      const destination = $("card-advanced-extra-anchor");
      for (const [selector, title] of [
        [".custom-editor-quick-fields", "\u9805\u76EE\u30BB\u30C3\u30C8\u3092\u8FFD\u52A0\u3059\u308B"],
        [".custom-background-photo", "\u80CC\u666F\u5199\u771F\u3068\u4F4D\u7F6E\u3092\u8ABF\u6574\u3059\u308B"]
      ]) {
        const content = document.querySelector(selector);
        if (!content) throw Error("\u30AB\u30FC\u30C9\u7DE8\u96C6\u30D1\u30CD\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
        const group = document.createElement("details");
        group.className = "card-editor-more";
        const summary = document.createElement("summary");
        summary.textContent = title;
        group.append(summary, content);
        destination.append(group);
      }
    }
    function initialized() {
      arrangeAdvancedEditor();
      $("card-create-preset").innerHTML = Object.entries(CARD_PRESETS).map(([k, v]) => '<option value="' + k + '">' + h(v.label) + "</option>").join("");
      $("card-create-size").innerHTML = Object.keys(CARD_SIZES).map((k) => '<option value="' + k + '">' + { square: "\u6B63\u65B9\u5F62", portrait: "\u7E26\u9577", story: "\u30B9\u30C8\u30FC\u30EA\u30FC", wide: "\u6A2A\u9577" }[k] + "</option>").join("");
      $("card-editor-size").innerHTML = $("card-create-size").innerHTML;
      $("card-editor-preset").innerHTML = $("card-create-preset").innerHTML;
      const fieldOptions = Object.entries(CARD_FIELD_SETS).map(([key, val]) => '<option value="' + key + '">' + h(val.label) + "</option>").join("");
      $("card-create-fields").innerHTML = fieldOptions;
      $("card-editor-fields").innerHTML = fieldOptions;
      $("card-editor-fields").value = "basic";
      $("card-create-preset").addEventListener("change", previewTemplate);
      $("card-create-size").addEventListener("change", previewTemplate);
      $("card-create-fields").addEventListener("change", previewTemplate);
      $("card-create-form").addEventListener("submit", (e) => {
        e.preventDefault();
        try {
          create();
        } catch (err) {
          notify2(err.message);
        }
      });
      $("card-create-close").addEventListener("click", closeModal);
      $("card-create-scrim").addEventListener("click", closeModal);
      $("card-create-cancel").addEventListener("click", closeModal);
      $("card-export-close").addEventListener("click", closeModal);
      $("card-export-scrim").addEventListener("click", closeModal);
      $("card-export-download").addEventListener("click", () => exported(false).catch((e) => notify2(e.message)));
      $("card-export-share").addEventListener("click", () => exported(true).catch((e) => notify2(e.message)));
      document.addEventListener("click", (e) => {
        const suggested = e.target.closest("[data-card-purpose]");
        if (suggested) {
          $("card-create-title").value = suggested.dataset.cardPurpose;
          return;
        }
        const selectButton = e.target.closest("[data-card-select]");
        if (selectButton) {
          select(selectButton.dataset.cardSelect);
          return;
        }
        if (e.target.closest("#card-add")) {
          openCreate();
          return;
        }
        const command = e.target.closest("[data-custom]");
        if (command) {
          const action = command.dataset.custom;
          if (action === "edit") openEditor();
          if (action === "show-front" || action === "show-back") {
            displayFace = action === "show-back" ? "back" : "front";
            onChange();
          }
          if (action === "duplicate") duplicate();
          if (action === "left" || action === "right") movePosition(action);
          if (action === "delete") void deleteSelected().catch((err) => notify2(err.message));
          if (action === "download" || action === "share") void exportCard(action === "share").catch((err) => notify2(err.message));
          return;
        }
        const editorCommand = e.target.closest("[data-card-editor]");
        if (editorCommand) handleEditorButton(editorCommand.dataset.cardEditor);
        const layerButton = e.target.closest("[data-layer-id]");
        if (layerButton) {
          activeLayer = layerButton.dataset.layerId;
          updateEditor();
        }
      });
      $("card-editor-title").addEventListener("change", (e) => modify(() => {
        draft.title = e.target.value.trim().slice(0, 60) || "\u30AB\u30FC\u30C9";
      }));
      $("card-quick-text").addEventListener("input", (e) => {
        const target = layer();
        if (!target || !["text", "sticker"].includes(target.type)) return;
        target.text = e.target.value;
        void drawEditor();
      });
      $("card-quick-text").addEventListener("change", () => {
        if (!layer()) return;
        record();
      });
      $("card-editor-preset").addEventListener("change", (e) => modify(() => {
        applyCardMood(draft, e.target.value);
      }));
      $("card-editor-bg").addEventListener("change", (e) => modify(() => {
        draft.bg = e.target.value;
      }));
      $("card-editor-bg2").addEventListener("change", (e) => modify(() => {
        draft.bg2 = e.target.value;
      }));
      $("card-editor-background-style").addEventListener("change", (e) => modify(() => {
        draft.backgroundMode = e.target.value;
      }));
      $("card-export-face").addEventListener("change", async (e) => {
        try {
          exportFace = e.target.value;
          exportPng = await cardPng(exportDocument, exportFace, assets);
          $("card-export-image").src = exportPng;
        } catch (err) {
          notify2(err.message);
        }
      });
      $("card-editor-size").addEventListener("change", (e) => modify(() => {
        draft.size = e.target.value;
      }));
      for (const prop of ["text", "x", "y", "w", "h", "rotation", "opacity", "fontSize", "fill", "fontFamily", "align", "weight", "radius", "imageScale", "imageX", "imageY"]) {
        const el = $("card-prop-" + prop);
        if (el) el.addEventListener("change", (e) => editProperty(prop, e.target.value));
      }
      $("card-photo-file").addEventListener("change", async (e) => {
        try {
          if (e.target.files?.[0]) await importImage(e.target.files[0]);
        } catch (err) {
          notify2(err.message);
        }
        e.target.value = "";
      });
      $("card-background-file").addEventListener("change", async (e) => {
        try {
          if (e.target.files?.[0]) await importImage(e.target.files[0], { asBackground: true });
        } catch (err) {
          notify2(err.message);
        }
        e.target.value = "";
      });
      for (const [id, key, minimum, maximum] of [
        ["card-background-scale", "backgroundScale", 1, 5],
        ["card-background-x", "backgroundX", -1, 1],
        ["card-background-y", "backgroundY", -1, 1]
      ]) $("" + id).addEventListener("change", (e) => {
        const val = Number(e.target.value);
        if (!Number.isFinite(val)) return;
        modify(() => {
          face()[key] = clamp(val, minimum, maximum);
        });
      });
      $("card-editor-canvas").addEventListener("pointerdown", touchStart);
      $("card-editor-canvas").addEventListener("pointermove", touchMove);
      $("card-editor-canvas").addEventListener("pointerup", touchEnd);
      $("card-editor-canvas").addEventListener("pointercancel", touchEnd);
      document.addEventListener("keydown", (e) => {
        if (!modal) return;
        if (e.key === "Escape") {
          e.preventDefault();
          if (modal === "custom-card-overlay") void closeEditor().catch((err) => notify2(err.message));
          else closeModal();
        }
        if (modal !== "custom-card-overlay" || e.target.closest("input,textarea,select")) return;
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
          e.preventDefault();
          undoRedo(e.shiftKey ? 1 : -1);
        }
        if ((e.key === "Delete" || e.key === "Backspace") && layer()) {
          e.preventDefault();
          deleteLayer();
        }
      });
    }
    initialized();
    return api;
  }

  // src/main.mjs
  validateConfig(app_config_default);
  var $2 = (id) => document.getElementById(id);
  var escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var store2 = createVersionedStore({ store: localStorage, key: app_config_default.storageNamespace + ".profile.v1", currentVersion: 1, validators: { 1: validateProfile }, migrations: {}, createInitial: DEFAULT_PROFILE });
  var profile = store2.read();
  var layout = createDeviceLayout({ root: document.documentElement, bannerHeightPx: 50 });
  var feedback = createFeedback({ doc: document, win: window, toastNode: $2("toast") });
  var notify = (message) => feedback.notify(message);
  var nativePorts = createNativePorts();
  if (!nativePorts.native) document.documentElement.classList.add("preview-mode");
  var ads = createNENMonetization({ config: app_config_default, ports: nativePorts, layout, onInlineVisible: (visible) => {
    $2("custom-inline-ad").hidden = !visible;
  }, onStatus: (type, msg) => {
    if (type === "purchase") {
      const configured = app_config_default.purchase.enabled;
      const purchased = configured && msg === "\u8CFC\u5165\u6E08\u307F";
      const available = configured && nativePorts.native && (msg === "\u8CFC\u5165\u53EF\u80FD" || purchased);
      $2("purchase-label").textContent = configured ? "\u5E83\u544A\u3092\u6C38\u4E45\u306B\u524A\u9664" : "\u5E83\u544A\u524A\u9664\uFF08\u6E96\u5099\u4E2D\uFF09";
      $2("purchase-help").textContent = !configured ? "\u73FE\u5728\u3001\u8CFC\u5165\u6A5F\u80FD\u306F\u6E96\u5099\u4E2D\u3067\u3059\u3002" : !nativePorts.native ? "\u8CFC\u5165\u30FB\u5FA9\u5143\u306FiPhone\u30A2\u30D7\u30EA\u3067\u5229\u7528\u3067\u304D\u307E\u3059\u3002" : purchased ? "\u8CFC\u5165\u6E08\u307F\uFF1A\u30D0\u30CA\u30FC\u30FB\u30A4\u30F3\u30E9\u30A4\u30F3\u30FB\u5168\u753B\u9762\u5E83\u544A\u3092\u8868\u793A\u3057\u307E\u305B\u3093\u3002" : available ? "App Store\u306E\u8CB7\u3044\u5207\u308A\u8CFC\u5165\u3067\u3059\u3002\u8CFC\u5165\u5F8C\u306F\u5E83\u544A\u304C\u6C38\u4E45\u306B\u6D88\u3048\u307E\u3059\u3002" : msg === "\u8CFC\u5165\u78BA\u8A8D\u30A8\u30E9\u30FC" ? "\u8CFC\u5165\u60C5\u5831\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002\u6642\u9593\u3092\u304A\u3044\u3066\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002" : "App Store\u306E\u8CFC\u5165\u60C5\u5831\u3092\u78BA\u8A8D\u3057\u3066\u3044\u307E\u3059\u3002";
      $2("remove-ads").textContent = purchased ? "\u5E83\u544A\u524A\u9664\u6E08\u307F" : available ? "\u5E83\u544A\u3092\u6C38\u4E45\u306B\u524A\u9664" : "\u8CFC\u5165\u6E96\u5099\u4E2D";
      $2("remove-ads").disabled = !available || purchased;
      $2("restore").disabled = !available;
      $2("restore").textContent = available ? "\u8CFC\u5165\u3092\u5FA9\u5143" : "\u8CFC\u5165\u3092\u5FA9\u5143\uFF08\u6E96\u5099\u4E2D\uFF09";
    }
  } });
  $2("privacy-link").href = app_config_default.privacyPolicyUrl;
  $2("support-link").href = app_config_default.supportUrl;
  var customCards = createCustomCardsUI({ storage: localStorage, namespace: app_config_default.storageNamespace, notify, confirmAction: (args) => feedback.confirmAction(args), ads });
  customCards.onChange(() => render());
  function save(next) {
    validateProfile(next);
    store2.write(next);
    profile = next;
    render();
  }
  function textOrNone(x) {
    return x ? escapeHtml(x) : '<span class="fine">\u672A\u767B\u9332</span>';
  }
  function yearsOld(date) {
    if (!profile.birthDate) return "";
    const age = ageAt(profile.birthDate, date);
    return age === null ? "" : age + "\u6B73";
  }
  function eventSort(a, b) {
    return a.date.localeCompare(b.date) || a.title.localeCompare(b.title);
  }
  function imageForAvatar() {
    return profile.avatarPhoto ? '<img alt="" src="' + profile.avatarPhoto + '">' : escapeHtml(profile.avatarIcon);
  }
  function heroBackgroundStyle() {
    return profile.backgroundPhoto ? 'background-image:url("' + profile.backgroundPhoto + '")' : "background-color:" + profile.backgroundColor;
  }
  var cardSide = "front";
  function showHome() {
    const facts = lifeFacts(profile.birthDate), el = $2("screen-home");
    if (customCards.renderSelected(el)) return;
    if (!facts) {
      el.innerHTML = '<div class="welcome-card"><div class="welcome-sub">MY PROF \xB7 PERSONAL CARD</div><div class="welcome-illustration"><img src="./assets/app-icon.png" alt=""></div><h2>\u308F\u305F\u3057\u306E\u3053\u3068\u3001<br>1\u679A\u306E\u30AB\u30FC\u30C9\u306B\u3002</h2><p>\u751F\u5E74\u6708\u65E5\u3092\u5165\u308C\u308B\u3060\u3051\u3067\u3001\u3044\u307E\u306E\u5E74\u9F62\u304C\u5206\u304B\u308A\u307E\u3059\u3002\u540D\u524D\u3084\u5199\u771F\u306F\u5F8C\u304B\u3089\u3067OK\u3002</p><button class="primary-button" data-act="edit-profile">\u30DE\u30A4\u30AB\u30FC\u30C9\u3092\u3064\u304F\u308B \u2192</button></div>';
      return;
    }
    const birth = profile.birthDate.split("-").map(Number), today = todayLocal(), future = upcomingYakudoshi(profile.birthDate, today);
    const { star, term, moon, milestone } = birthCalendarFacts(profile.birthDate, today);
    const name = escapeHtml(profile.nickname || profile.name || "\u308F\u305F\u3057");
    const birthday = birth[0] + "\u5E74" + birth[1] + "\u6708" + birth[2] + "\u65E5";
    const dayText = facts.daysUntil === 0 ? "\u4ECA\u65E5\u306F\u8A95\u751F\u65E5\uFF01\u304A\u3081\u3067\u3068\u3046 \u{1F389}" : "\u6B21\u306E\u8A95\u751F\u65E5\u307E\u3067\u3042\u3068 " + facts.daysUntil + " \u65E5";
    const milestones = milestoneYears(profile.birthDate, today);
    const yaku = future.map(({ label, next }) => '<div class="back-item"><span>' + label + "\u306E\u6163\u7FD2</span><strong>" + (next ? next.year + "\u5E74 " + next.phase + "\uFF08\u6570\u3048" + (next.year - birth[0] + 1) + "\u6B73\uFF09" : "\u4ECA\u5F8C\u306E\u8A72\u5F53\u306A\u3057") + "</strong></div>").join("");
    const cardYaku = future.map(({ label, next }) => "<span>" + label + " " + (next ? next.year + "\u5E74" + next.phase : "\u8A72\u5F53\u306A\u3057") + "</span>").join("");
    const calendarInfo = '<section class="panel calendar-trivia"><div class="panel-title"><h2>\u308F\u305F\u3057\u306E\u66A6\u30FB\u8C46\u77E5\u8B58</h2><span class="fine">\u8A95\u751F\u65E5\u304B\u3089\u5206\u304B\u308B\u3053\u3068</span></div><div class="calendar-trivia-grid"><div><small>\u751F\u307E\u308C\u305F\u9803\u306E\u4E8C\u5341\u56DB\u7BC0\u6C17</small><strong>' + escapeHtml(term.boundary ? term.previous + "\uFF0F" + term.current : term.name) + "</strong><span>" + (term.boundary ? "\u7BC0\u5165\u308A\u5F53\u65E5\u30FB\u51FA\u751F\u6642\u523B\u306B\u3088\u3063\u3066\u5909\u308F\u308A\u307E\u3059" : "\u5B63\u7BC0\u309224\u306B\u5206\u3051\u305F\u65E5\u672C\u306E\u66A6") + "</span></div><div><small>\u751F\u307E\u308C\u305F\u65E5\u306E\u6708</small><strong>" + escapeHtml(moon.label) + "</strong><span>\u6708\u9F62 \u7D04 " + moon.age.toFixed(1) + "\uFF08\u65E5\u672C\u6642\u9593\u30FB\u6B63\u5348\u6642\u70B9\uFF09</span></div><div><small>\u6B21\u306E1000\u65E5\u8A18\u5FF5\u65E5</small><strong>" + milestone.milestone.toLocaleString("ja-JP") + "\u65E5\u76EE</strong><span>" + escapeHtml(milestone.date.replace(/-/g, "/")) + " \u30FB " + (milestone.remaining === 0 ? "\u4ECA\u65E5\u304C\u8A18\u5FF5\u65E5\uFF01" : "\u3042\u3068 " + milestone.remaining + " \u65E5") + "</span></div></div>" + (star.boundary ? '<p class="fine calendar-warning">\u7ACB\u6625\u304C\u8A95\u751F\u65E5\uFF08' + escapeHtml(star.risshunDate) + " " + escapeHtml(star.risshunTime) + "\u9803\uFF09\u306B\u5F53\u305F\u308A\u307E\u3059\u3002\u51FA\u751F\u6642\u523B\u306B\u3088\u308A\u672C\u547D\u661F\u3068\u516D\u5341\u5E72\u652F\u304C\u7570\u306A\u308A\u307E\u3059\u3002" + star.alternatives.map((x) => x.year + "\u5E74\u6271\u3044\uFF1A" + x.star + "\u30FB" + x.eto).join("\uFF0F") + "</p>" : "") + '<p class="fine calendar-note">\u672C\u547D\u661F\u30FB\u516D\u5341\u5E72\u652F\u306F\u7ACB\u6625\u57FA\u6E96\u306E\u4F1D\u7D71\u7684\u306A\u66A6\u3067\u3059\u3002\u7BC0\u6C17\u306E\u5207\u308A\u66FF\u308F\u308A\u306F\u65E5\u672C\u6A19\u6E96\u6642\u306B\u3088\u308B\u8A08\u7B97\u3002\u6708\u9F62\u306F\u51FA\u751F\u6642\u523B\u304C\u672A\u767B\u9332\u306E\u305F\u3081\u6B63\u5348\u6642\u70B9\u306E\u76EE\u5B89\u3067\u3059\u3002\u5360\u3044\u306F\u6587\u5316\u7684\u306A\u8AAD\u307F\u7269\u3068\u3057\u3066\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\u3002</p></section>';
    const nextMilestones = milestones.length ? milestones.slice(0, 3).map((x) => '<div class="back-item"><span>' + x.year + "\u5E74</span><strong>" + escapeHtml(x.title) + "</strong></div>").join("") : '<p class="fine">\u7BC0\u76EE\u306F\u3042\u308A\u307E\u305B\u3093</p>';
    el.innerHTML = '<div class="card-top"><div><span class="eyebrow">MY PERSONAL CARD</span><h2>\u30DE\u30A4\u30AB\u30FC\u30C9</h2></div><button data-act="edit-profile" data-editor-target="appearance" class="quiet-link">\u30C7\u30B6\u30A4\u30F3\u3092\u7DE8\u96C6 \u2197</button></div><div class="card-scene" role="button" tabindex="0" aria-label="' + (cardSide === "back" ? "\u30AB\u30FC\u30C9\u306E\u8868\u3092\u898B\u308B" : "\u30AB\u30FC\u30C9\u306E\u88CF\u3092\u898B\u308B") + '" aria-pressed="' + (cardSide === "back") + '"><div class="card-rotator' + (cardSide === "back" ? " flipped" : "") + '"><section class="license-card card-front" ' + (cardSide === "back" ? 'aria-hidden="true"' : 'aria-hidden="false"') + ' style="' + heroBackgroundStyle() + '"><div class="card-deco d1"></div><div class="card-deco d2"></div><div class="card-content"><div class="card-topline"><span class="logo">\u2726 MY PROF<span class="logo-dot">.</span></span><span>PERSONAL CARD</span></div><div class="card-person"><div class="card-avatar">' + imageForAvatar() + '</div><div class="card-info"><small>NAME / \u306A\u307E\u3048</small><strong>' + name + "</strong><small>DATE OF BIRTH</small><span>" + birthday + '</span></div></div><div class="card-age"><div><span>MY AGE TODAY</span><small>\u4ECA\u65E5\u306E\u308F\u305F\u3057</small></div><p><strong class="number">' + facts.full + '</strong><span class="unit">\u6B73</span></p></div><div class="card-bottom"><div><small>\u6570\u3048\u5E74</small><strong>' + facts.count + "\u6B73</strong></div><div><small>\u661F\u5EA7</small><strong>" + escapeHtml(facts.sign) + "</strong></div><div><small>\u5E72\u652F</small><strong>" + escapeHtml(facts.animal) + '\u5E74</strong></div></div></div></section><section class="license-card card-back" ' + (cardSide === "back" ? 'aria-hidden="false"' : 'aria-hidden="true"') + '><div class="card-content"><div class="card-topline"><span class="logo">\u2726 MY PROF<span class="logo-dot">.</span></span><span>ABOUT ME / BACK</span></div><div class="back-big"><small>\u751F\u307E\u308C\u3066\u304B\u3089\u4ECA\u65E5\u306F</small><p><strong>' + (facts.lived + 1).toLocaleString("ja-JP") + '</strong><span> \u65E5\u76EE</span></p></div><div class="back-grid"><div><small>\u4ECA\u5E74\u8FCE\u3048\u308B\u5E74\u9F62</small><strong>' + facts.turning + "\u6B73</strong></div><div><small>\u751F\u307E\u308C\u305F\u66DC\u65E5</small><strong>" + escapeHtml(facts.week) + "</strong></div><div><small>\u751F\u307E\u308C\u5E74\u306E\u548C\u66A6</small><strong>" + escapeHtml(facts.bornEra) + '</strong></div></div><div class="tradition-grid"><div><small>\u4E5D\u661F\u6C17\u5B66\u30FB\u672C\u547D\u661F</small><strong>' + escapeHtml(star.star) + "</strong></div><div><small>\u516D\u5341\u5E72\u652F</small><strong>" + escapeHtml(star.eto) + '</strong></div></div><div class="card-yaku-inline"><small>\u6B21\u306E\u5384\u5E74\uFF08\u4F1D\u7D71\u7684\u306A\u76EE\u5B89\uFF09</small><div>' + cardYaku + '</div></div><div class="back-bottom">\u2733 ' + dayText + '</div></div></section></div></div><button type="button" class="card-turn" data-act="turn-card" aria-pressed="' + (cardSide === "back") + '">\u21C4\u3000' + (cardSide === "back" ? "\u30AB\u30FC\u30C9\u306E\u8868\u306B\u623B\u3059" : "\u30AB\u30FC\u30C9\u306E\u88CF\u9762\u3092\u898B\u308B") + '</button><div class="card-below card-below-back" ' + (cardSide === "back" ? "" : "hidden") + '><p class="fine card-disclaimer">\u5384\u5E74\u306F\u7537\u5973\u5225\u306E\u4E00\u822C\u7684\u306A\u76EE\u5B89\u3092\u4E21\u65B9\u8868\u793A\u3057\u3066\u3044\u307E\u3059\u3002\u5730\u57DF\u30FB\u6163\u7FD2\u306B\u3088\u3063\u3066\u7570\u306A\u308A\u307E\u3059\u3002</p><section class="panel back-extra"><div class="panel-title"><h2>\u3053\u308C\u304B\u3089\u306E\u7BC0\u76EE</h2></div>' + nextMilestones + "</section>" + calendarInfo + '</div><div class="card-below card-below-front" ' + (cardSide === "back" ? "hidden" : "") + '><div class="birthday-ribbon"><span aria-hidden="true">\u2733</span>' + dayText + '</div><section class="panel"><div class="panel-title"><h2>\u308F\u305F\u3057\u306E\u57FA\u672C\u60C5\u5831</h2><span class="fine">' + today + '</span></div><div class="facts-grid">' + [["\u4ECA\u5E74\u8FCE\u3048\u308B\u5E74\u9F62", facts.turning + "\u6B73"], ["\u8840\u6DB2\u578B", profile.bloodType || "\u672A\u8A2D\u5B9A"], ["\u751F\u307E\u308C\u5E74\u306E\u548C\u66A6", facts.bornEra], ["\u751F\u307E\u308C\u305F\u66DC\u65E5", facts.week]].map(([t, v]) => '<div class="fact"><small>' + escapeHtml(t) + "</small><strong>" + escapeHtml(v) + "</strong></div>").join("") + '</div></section></div><section class="panel shortcuts"><div class="panel-title"><h2>\u3059\u3050\u306B\u4F7F\u3048\u308B</h2></div><div class="shortcut-grid"><button data-act="go-details"><span>\u25A4</span><strong>\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u8A73\u7D30</strong><small>\u4F4F\u6240\u30FB\u30E1\u30FC\u30EB\u3092\u30B3\u30D4\u30FC</small></button><button data-act="go-timeline"><span>\u25A5</span><strong>\u308F\u305F\u3057\u5C65\u6B74</strong><small>\u5B66\u6B74\u30FB\u8077\u6B74\u30FB\u51FA\u6765\u4E8B</small></button><button data-act="edit-profile" data-editor-target="appearance"><span>\u270E</span><strong>\u30AB\u30FC\u30C9\u3092\u7DE8\u96C6</strong><small>\u5199\u771F\u30FB\u80CC\u666F\u3092\u5909\u66F4</small></button></div></section>';
  }
  var sensitiveVisible = false;
  function detailRow(label, value, clipboard = value, { privateData = false } = {}) {
    const displayed = privateData && !sensitiveVisible && value ? '<span class="masked-value" aria-label="\u975E\u8868\u793A">\u2022\u2022\u2022\u2022\u2022\u2022</span>' : textOrNone(value);
    return '<div class="data-row"><div class="data-main"><div class="label">' + escapeHtml(label) + '</div><div class="value">' + displayed + "</div></div>" + (value ? '<button class="copy-btn" data-copy="' + escapeHtml(clipboard) + '" aria-label="' + escapeHtml(label) + '\u3092\u30B3\u30D4\u30FC">\u30B3\u30D4\u30FC</button>' : "") + "</div>";
  }
  function showDetails() {
    const el = $2("screen-details");
    let html = '<div class="section-heading"><h2>\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u8A73\u7D30</h2><button class="quiet-link" data-act="edit-profile">\u7DE8\u96C6\u3059\u308B \u2192</button></div><p class="help">\u4F4F\u6240\u3084\u30E1\u30FC\u30EB\u306F\u5FC5\u8981\u306A\u3068\u304D\u3060\u3051\u8868\u793A\u3067\u304D\u307E\u3059\u3002\u975E\u8868\u793A\u306E\u307E\u307E\u30B3\u30D4\u30FC\u3082\u53EF\u80FD\u3067\u3059\u3002</p><section class="panel"><div class="panel-title"><h2>\u57FA\u672C\u60C5\u5831</h2></div>' + detailRow("\u540D\u524D", profile.name) + detailRow("\u30CB\u30C3\u30AF\u30CD\u30FC\u30E0", profile.nickname) + detailRow("\u751F\u5E74\u6708\u65E5", profile.birthDate) + detailRow("\u8840\u6DB2\u578B", profile.bloodType) + detailRow("\u51FA\u8EAB\u5730", profile.birthplace) + "</section>";
    const addr = homeAddress(profile);
    const toggle = '<button class="secondary-button sensitive-toggle" type="button" data-act="toggle-sensitive" aria-pressed="' + sensitiveVisible + '" aria-label="' + (sensitiveVisible ? "\u4F4F\u6240\u3068\u30E1\u30FC\u30EB\u3092\u96A0\u3059" : "\u4F4F\u6240\u3068\u30E1\u30FC\u30EB\u3092\u8868\u793A") + '">' + (sensitiveVisible ? "\u975E\u8868\u793A\u306B\u3059\u308B" : "\u4F4F\u6240\u30FB\u30E1\u30FC\u30EB\u3092\u8868\u793A") + "</button>";
    html += '<div class="sensitive-controls">' + toggle + "</div>";
    html += '<section class="panel"><div class="panel-title"><h2>\u4F4F\u6240</h2><button class="quiet-link" data-act="edit-profile" data-editor-target="contact">\u5909\u66F4 \u2192</button></div>' + detailRow("\u90F5\u4FBF\u756A\u53F7", profile.postalCode, profile.postalCode, { privateData: true }) + detailRow("\u4F4F\u6240", addr, addr, { privateData: true }) + detailRow("\u90FD\u9053\u5E9C\u770C", profile.prefecture, profile.prefecture, { privateData: true }) + detailRow("\u5E02\u533A\u753A\u6751", profile.city, profile.city, { privateData: true }) + detailRow("\u753A\u540D\u30FB\u756A\u5730", profile.street, profile.street, { privateData: true }) + detailRow("\u5EFA\u7269\u30FB\u90E8\u5C4B\u756A\u53F7", profile.building, profile.building, { privateData: true }) + (addr || profile.postalCode ? '<div class="buttons" style="margin-top:12px"><button class="secondary-button" data-copy="' + escapeHtml((profile.postalCode ? "\u3012" + profile.postalCode + " " : "") + addr) + '">\u90F5\u4FBF\u756A\u53F7\uFF0B\u4F4F\u6240\u3092\u30B3\u30D4\u30FC</button></div>' : "") + "</section>";
    html += '<section class="panel"><div class="panel-title"><h2>\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9</h2><button class="quiet-link" data-act="edit-profile" data-editor-target="contact">\u8FFD\u52A0\u30FB\u7DE8\u96C6 \u2192</button></div>';
    if (!profile.emails.length) html += '<p class="help">\u307E\u3060\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u4ED5\u4E8B\u7528\u30FB\u666E\u6BB5\u7528\u306A\u3069\u3001\u8907\u6570\u767B\u9332\u3067\u304D\u307E\u3059\u3002</p>';
    for (const x of profile.emails) {
      html += '<div class="data-row"><div class="data-main"><span class="email-pill">' + escapeHtml(x.label || "\u30E1\u30FC\u30EB") + '</span><div class="value">' + (sensitiveVisible ? escapeHtml(x.address) : '<span class="masked-value" aria-label="\u975E\u8868\u793A">\u2022\u2022\u2022\u2022\u2022\u2022</span>') + '</div></div><button class="copy-btn" data-copy="' + escapeHtml(x.address) + '" aria-label="' + escapeHtml(x.label || "\u30E1\u30FC\u30EB") + '\u306E\u30A2\u30C9\u30EC\u30B9\u3092\u30B3\u30D4\u30FC">\u30B3\u30D4\u30FC</button></div>';
    }
    html += '</section><section class="panel"><div class="panel-title"><h2>\u30E1\u30E2</h2></div><p class="help">' + (profile.notes ? escapeHtml(profile.notes).replace(/\n/g, "<br>") : "\u81EA\u7531\u306B\u30E1\u30E2\u3092\u6B8B\u305B\u307E\u3059\u3002") + "</p></section>";
    el.innerHTML = html;
  }
  var EVENT_LABELS = { education: "\u5B66\u6B74", work: "\u8077\u6B74", life: "\u51FA\u6765\u4E8B" };
  function eventCategory(e) {
    return e.category || (/学校|高校|高等学校|大学|専門学校|短大|高専/.test(e.title) ? "education" : /就職|転職|退職|勤務|入社|会社|職歴|起業|独立|開業|異動|昇進/.test(e.title) ? "work" : "life");
  }
  var AUTO_SCHOOL_NOTE = "\u6A19\u6E96\u7684\u306A\u9032\u5B66\u306E\u5834\u5408\u306E\u76EE\u5B89\u3002\u81EA\u7531\u306B\u7DE8\u96C6\u30FB\u524A\u9664\u3067\u304D\u307E\u3059\u3002";
  function showTimeline() {
    const el = $2("screen-timeline"), arr = [...profile.events].sort(eventSort);
    let html = '<div class="section-heading"><h2>\u308F\u305F\u3057\u306E\u4EBA\u751F\u5E74\u8868</h2><button class="primary-button" data-act="new-event">\uFF0B \u8FFD\u52A0</button></div><p class="help">\u5E74\u3054\u3068\u306B\u6574\u7406\u3057\u3066\u8868\u793A\u3057\u307E\u3059\u3002\u5B66\u6B74\u30FB\u8077\u6B74\u30FB\u601D\u3044\u51FA\u306F\u8FFD\u52A0\u6642\u306B\u5206\u985E\u3067\u304D\u307E\u3059\u3002\u81EA\u52D5\u4F5C\u6210\u3055\u308C\u305F\u9032\u5B66\u4E88\u5B9A\u306F\u76EE\u5B89\u306A\u306E\u3067\u3001\u81EA\u7531\u306B\u7DE8\u96C6\u30FB\u524A\u9664\u3067\u304D\u307E\u3059\u3002</p>';
    if (!profile.birthDate) {
      el.innerHTML = html + '<div class="panel empty"><p>\u8A95\u751F\u65E5\u3092\u767B\u9332\u3059\u308B\u3068\u5E74\u8868\u304C\u4F5C\u308C\u307E\u3059\u3002</p><button class="primary-button" data-act="edit-profile">\u8A95\u751F\u65E5\u3092\u767B\u9332</button></div>';
      return;
    }
    html += '<section class="panel"><div class="panel-title"><h2>\u5B66\u6821\u30FB\u4ED5\u4E8B\u306E\u8A18\u9332</h2></div><div class="buttons"><button class="secondary-button" data-act="copy-education">\u5B66\u6B74\u3092\u307E\u3068\u3081\u3066\u30B3\u30D4\u30FC</button><button class="secondary-button" data-act="copy-work">\u8077\u6B74\u3092\u307E\u3068\u3081\u3066\u30B3\u30D4\u30FC</button></div><p class="fine">\u5C65\u6B74\u66F8\u306A\u3069\u306B\u8CBC\u308A\u4ED8\u3051\u3084\u3059\u3044\u548C\u66A6\u8868\u8A18\u3067\u3059\u3002\u76EE\u5B89\u306E\u8AAC\u660E\u6587\u306F\u30B3\u30D4\u30FC\u306B\u542B\u3081\u307E\u305B\u3093\u3002</p></section>';
    html += '<section class="panel"><div class="timeline-list">';
    let previousYear = "";
    const entries = [{ id: null, date: profile.birthDate, title: "\u8A95\u751F", note: "", category: "life", birth: true }, ...arr];
    entries.forEach((e, i) => {
      const year = e.date.slice(0, 4), cat = eventCategory(e), suggested = e.note === AUTO_SCHOOL_NOTE;
      if (year !== previousYear) {
        html += '<div class="timeline-year">' + escapeHtml(year) + "\u5E74</div>";
        previousYear = year;
      }
      html += '<div class="event"><div class="event-line"><div class="event-dot"></div>' + (i === entries.length - 1 ? "" : '<div class="event-stem"></div>') + '</div><div class="event-content"><div class="event-top"><div class="event-date">' + escapeHtml(e.date.slice(5).replace("-", "/")) + " \xB7 " + (e.birth ? "0\u6B73" : yearsOld(e.date)) + '</div><span class="event-kind">' + (suggested ? "\u9032\u5B66\u306E\u76EE\u5B89" : EVENT_LABELS[cat]) + "</span></div><strong>" + escapeHtml(e.title) + "</strong>" + (e.note && !suggested ? "<p>" + escapeHtml(e.note) + "</p>" : "") + (e.birth ? "" : '<div class="event-actions"><button class="mini-btn" data-act="edit-event" data-id="' + escapeHtml(e.id) + '">\u7DE8\u96C6</button><button class="mini-btn" data-act="copy-event" data-id="' + escapeHtml(e.id) + '">\u30B3\u30D4\u30FC</button></div>') + "</div></div>";
    });
    html += '</div></section><section class="panel"><div class="panel-title"><h2>\u3042\u306E\u3068\u304D\u4F55\u6B73\uFF1F</h2></div><div class="field-grid"><label class="field full">\u5E74\u3092\u6307\u5B9A\u3057\u3066\u5E74\u9F62\u3092\u8ABF\u3079\u308B<input id="age-search" type="number" min="1900" max="2100" step="1" value="' + (/* @__PURE__ */ new Date()).getFullYear() + '"></label></div><p class="help" id="age-search-result"></p></section>';
    el.innerHTML = html;
    renderAgeSearch();
  }
  function renderAgeSearch() {
    const input = $2("age-search"), out = $2("age-search-result");
    if (!input || !out || !profile.birthDate) return;
    const y = Number(input.value), by = Number(profile.birthDate.slice(0, 4));
    out.textContent = Number.isSafeInteger(y) && y >= 1900 && y <= 2100 && y >= by ? y + "\u5E74\u306B\u306F " + (y - by) + "\u6B73\u306E\u8A95\u751F\u65E5\u3092\u8FCE\u3048\u307E\u3059\u3002\u8A95\u751F\u65E5\u524D\u306F" + (y - by - 1) + "\u6B73\u3067\u3059\u3002" : "\u751F\u307E\u308C\u305F\u5E74\u4EE5\u964D\uFF081900\u301C2100\uFF09\u306E\u5E74\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
  }
  var view = "home";
  function go(v) {
    if (!["home", "details", "timeline"].includes(v)) return;
    if (v === "details" && view !== v) sensitiveVisible = false;
    const changed = view !== v;
    view = v;
    render();
    window.scrollTo?.(0, 0);
    if (changed) void ads.onNaturalBreak("section-change").catch((e) => console.warn("[MyProf section ad]", e));
  }
  function render() {
    for (const v of ["home", "details", "timeline"]) {
      $2("screen-" + v).hidden = v !== view;
      const tab = document.querySelector('.tab[data-view="' + v + '"]');
      tab.classList.toggle("active", v === view);
      if (v === view) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    }
    $2("card-file-tabs").hidden = view !== "home";
    if (view === "home") {
      customCards.renderTabs();
      showHome();
      installCardSwipe();
    } else if (view === "details") showDetails();
    else showTimeline();
    void ads.setInlineVisible(view === "home" && customCards.current() !== "personal").catch((e) => console.warn("[MyProf inline ad]", e));
  }
  document.querySelectorAll(".tab").forEach((x) => x.addEventListener("click", () => go(x.dataset.view)));
  var openOverlay = null;
  var lastFocus = null;
  var oldOverflow = "";
  var oldInert = false;
  var profileBaseline = null;
  var eventBaseline = null;
  var confirmingClose = false;
  function profileDraft() {
    return JSON.stringify({
      fields: fieldNames.map((name) => $2("p-" + name).value),
      birth: [$2("p-birthYear").value, $2("p-birthMonth").value, $2("p-birthDay").value],
      icon: tempIcon,
      color: tempColor,
      avatar: tempAvatar,
      background: tempBackground,
      emails: tempEmails
    });
  }
  function eventDraft() {
    return JSON.stringify({ title: $2("event-name").value, date: $2("event-date").value, note: $2("event-note").value, category: $2("event-category").value });
  }
  function isDirtyOverlay() {
    return openOverlay === "editor-overlay" ? profileDraft() !== profileBaseline : openOverlay === "event-overlay" ? eventDraft() !== eventBaseline : false;
  }
  function showOverlay(id, focus) {
    if (openOverlay) throw Error("\u5225\u306E\u7DE8\u96C6\u753B\u9762\u304C\u958B\u3044\u3066\u3044\u307E\u3059");
    lastFocus = document.activeElement;
    oldOverflow = document.body.style.overflow;
    oldInert = $2("app-main").inert;
    const overlay = $2(id);
    openOverlay = id;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    $2("app-main").inert = true;
    void ads.setModalOpen(true).catch((err) => console.error("[MyProf modal ad pause]", err));
    window.setTimeout(() => $2(focus)?.focus({ preventScroll: true }), 0);
  }
  function closeOverlay() {
    if (!openOverlay) return;
    if ($2(openOverlay).contains(document.activeElement) && document.activeElement?.blur) document.activeElement.blur();
    $2(openOverlay).hidden = true;
    openOverlay = null;
    document.body.style.overflow = oldOverflow;
    $2("app-main").inert = oldInert;
    void ads.setModalOpen(false).catch((err) => console.error("[MyProf modal ad restore]", err));
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }
  async function requestCloseOverlay() {
    if (!openOverlay || confirmingClose) return;
    if (!isDirtyOverlay()) {
      closeOverlay();
      return;
    }
    confirmingClose = true;
    try {
      const approved = await feedback.confirmAction({ title: "\u672A\u4FDD\u5B58\u306E\u5909\u66F4\u304C\u3042\u308A\u307E\u3059", message: "\u7DE8\u96C6\u3057\u305F\u5185\u5BB9\u3092\u4FDD\u5B58\u305B\u305A\u306B\u9589\u3058\u307E\u3059\u304B\uFF1F", acceptLabel: "\u4FDD\u5B58\u305B\u305A\u306B\u9589\u3058\u308B", cancelLabel: "\u7DE8\u96C6\u3092\u7D9A\u3051\u308B", danger: true });
      if (approved) closeOverlay();
    } finally {
      confirmingClose = false;
    }
  }
  document.addEventListener("keydown", (event) => {
    if (!openOverlay) return;
    const el = $2(openOverlay);
    if (event.key === "Escape") {
      event.preventDefault();
      void requestCloseOverlay();
      return;
    }
    if (event.key === "Tab") {
      const nodes = [...el.querySelectorAll("button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]")].filter((x) => !x.hidden && !x.closest("[hidden]") && x.getClientRects().length);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  for (const close of ["editor-close", "editor-scrim", "cancel-profile", "event-close", "event-scrim", "event-cancel", "settings-close", "settings-scrim"]) {
    $2(close).addEventListener("click", () => {
      void requestCloseOverlay().catch((err) => notify(err.message));
    });
  }
  $2("settings-button").addEventListener("click", () => showOverlay("settings-overlay", "settings-close"));
  var tempIcon = "";
  var tempColor = "";
  var tempAvatar = "";
  var tempBackground = "";
  var tempEmails = [];
  var fieldNames = ["name", "nickname", "bloodType", "birthplace", "postalCode", "prefecture", "city", "street", "building", "notes"];
  function fillBirthdayChoices() {
    $2("p-birthMonth").innerHTML = '<option value="">\u9078\u629E</option>' + Array.from({ length: 12 }, (_, i) => '<option value="' + String(i + 1).padStart(2, "0") + '">' + (i + 1) + "\u6708</option>").join("");
  }
  function fillBirthDays() {
    const y = Number($2("p-birthYear").value), m = Number($2("p-birthMonth").value);
    const days = m ? y >= 1900 && y <= 2100 ? new Date(y, m, 0).getDate() : new Date(2e3, m, 0).getDate() : 31;
    const previous = $2("p-birthDay").value;
    $2("p-birthDay").innerHTML = '<option value="">\u9078\u629E</option>' + Array.from({ length: days }, (_, i) => '<option value="' + String(i + 1).padStart(2, "0") + '">' + (i + 1) + "\u65E5</option>").join("");
    if (Number(previous) > 0 && Number(previous) <= days) $2("p-birthDay").value = previous;
  }
  fillBirthdayChoices();
  $2("p-birthYear").addEventListener("input", fillBirthDays);
  $2("p-birthMonth").addEventListener("change", fillBirthDays);
  function birthDateFromFields() {
    const y = $2("p-birthYear").value.trim(), m = $2("p-birthMonth").value, d = $2("p-birthDay").value;
    if (!/^[0-9]{4}$/.test(y) || !m || !d) throw Error("\u751F\u307E\u308C\u305F\u5E74\u30FB\u6708\u30FB\u65E5\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044");
    const birth = y + "-" + m + "-" + d;
    if (!isDate(birth) || birth > todayLocal()) throw Error("\u751F\u5E74\u6708\u65E5\u3092\u6B63\u3057\u304F\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044");
    return birth;
  }
  function renderIcons() {
    $2("icon-picker").innerHTML = ICONS.map((x) => '<button class="icon-choice' + (x === tempIcon ? " chosen" : "") + '" type="button" data-icon="' + escapeHtml(x) + '" aria-label="\u30A2\u30A4\u30B3\u30F3 ' + escapeHtml(x) + '" aria-pressed="' + (x === tempIcon) + '">' + escapeHtml(x) + "</button>").join("");
    $2("color-picker").innerHTML = BG_COLORS.map((x) => '<button class="color-choice' + (x === tempColor ? " chosen" : "") + '" type="button" data-color="' + x + '" style="background:' + x + '" aria-label="\u80CC\u666F\u8272 ' + x + '" aria-pressed="' + (x === tempColor) + '"></button>').join("");
  }
  function renderEmailEditors() {
    $2("email-editor-list").innerHTML = tempEmails.map((x) => '<div class="email-item" data-email-row="' + escapeHtml(x.id) + '"><input aria-label="\u30E1\u30FC\u30EB\u306E\u7528\u9014" placeholder="\u7528\u9014" maxlength="60" data-prop="label" value="' + escapeHtml(x.label) + '"><input aria-label="\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9" type="email" inputmode="email" autocomplete="off" maxlength="320" placeholder="hello@example.com" data-prop="address" value="' + escapeHtml(x.address) + '"><button type="button" data-remove-email="' + escapeHtml(x.id) + '" aria-label="\u3053\u306E\u30E1\u30FC\u30EB\u3092\u524A\u9664">\xD7</button></div>').join("");
  }
  function setEditorSection(section) {
    if (!["basic", "appearance", "contact"].includes(section)) throw Error("\u4E0D\u6B63\u306A\u7DE8\u96C6\u30BF\u30D6");
    for (const key of ["basic", "appearance", "contact"]) {
      const active = key === section;
      $2("editor-panel-" + key).hidden = !active;
      $2("editor-tab-" + key).classList.toggle("active", active);
      $2("editor-tab-" + key).setAttribute("aria-selected", String(active));
      $2("editor-tab-" + key).tabIndex = active ? 0 : -1;
    }
    const sheet = $2("editor-overlay").querySelector(".sheet");
    sheet.scrollTop = 0;
  }
  document.querySelectorAll("[data-editor-section]").forEach((button) => {
    button.addEventListener("click", () => setEditorSection(button.dataset.editorSection));
    button.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const sections = ["basic", "appearance", "contact"];
      const pos = sections.indexOf(button.dataset.editorSection);
      const idx = e.key === "Home" ? 0 : e.key === "End" ? 2 : (pos + (e.key === "ArrowRight" ? 1 : 2)) % 3;
      setEditorSection(sections[idx]);
      $2("editor-tab-" + sections[idx]).focus({ preventScroll: true });
    });
  });
  function editProfile(section = "basic") {
    for (const name of fieldNames) $2("p-" + name).value = profile[name];
    const b = profile.birthDate;
    $2("p-birthYear").value = b ? b.slice(0, 4) : "";
    $2("p-birthMonth").value = b ? b.slice(5, 7) : "";
    fillBirthDays();
    $2("p-birthDay").value = b ? b.slice(8, 10) : "";
    tempIcon = profile.avatarIcon;
    tempColor = profile.backgroundColor;
    tempAvatar = profile.avatarPhoto;
    tempBackground = profile.backgroundPhoto;
    tempEmails = profile.emails.map((x) => ({ ...x }));
    renderIcons();
    renderEmailEditors();
    $2("avatar-file").value = "";
    $2("background-file").value = "";
    if (!profile.birthDate) section = "basic";
    setEditorSection(section);
    profileBaseline = profileDraft();
    showOverlay("editor-overlay", "editor-title");
  }
  $2("icon-picker").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-icon]");
    if (!btn) return;
    tempIcon = btn.dataset.icon;
    renderIcons();
  });
  $2("color-picker").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-color]");
    if (!btn) return;
    tempColor = btn.dataset.color;
    renderIcons();
  });
  $2("email-editor-list").addEventListener("input", (e) => {
    const row = e.target.closest("[data-email-row]"), prop = e.target.dataset.prop;
    if (!row || !prop) return;
    const item = tempEmails.find((x) => x.id === row.dataset.emailRow);
    if (item) item[prop] = e.target.value;
  });
  $2("email-editor-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-email]");
    if (!btn) return;
    tempEmails = tempEmails.filter((x) => x.id !== btn.dataset.removeEmail);
    renderEmailEditors();
  });
  $2("add-email").addEventListener("click", () => {
    if (tempEmails.length >= 30) {
      notify("\u30E1\u30FC\u30EB\u306F30\u4EF6\u307E\u3067\u767B\u9332\u3067\u304D\u307E\u3059");
      return;
    }
    tempEmails.push({ id: makeId(), label: "", address: "" });
    renderEmailEditors();
    $2("email-editor-list").lastElementChild?.querySelector("input")?.focus();
  });
  $2("clear-avatar").addEventListener("click", () => {
    tempAvatar = "";
    $2("avatar-file").value = "";
    notify("\u4FDD\u5B58\u3059\u308B\u3068\u5199\u771F\u3092\u5916\u3057\u307E\u3059");
  });
  $2("clear-background").addEventListener("click", () => {
    tempBackground = "";
    $2("background-file").value = "";
    notify("\u4FDD\u5B58\u3059\u308B\u3068\u80CC\u666F\u5199\u771F\u3092\u5916\u3057\u307E\u3059");
  });
  async function resizedFile(file, maxWidth, maxHeight, maxBytes) {
    if (!file || !file.type.startsWith("image/")) throw Error("\u753B\u50CF\u30D5\u30A1\u30A4\u30EB\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044");
    if (file.size > 12 * 1024 * 1024) throw Error("12MB\u4EE5\u4E0B\u306E\u753B\u50CF\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044");
    const src = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve2, reject) => {
        image.onload = resolve2;
        image.onerror = () => reject(Error("\u753B\u50CF\u304C\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093"));
        image.src = src;
      });
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      let data = "";
      for (const quality of [0.76, 0.65, 0.54, 0.43]) {
        data = canvas.toDataURL("image/jpeg", quality);
        if (data.length <= maxBytes) break;
      }
      if (data.length > maxBytes) throw Error("\u753B\u50CF\u3092\u5341\u5206\u306B\u7E2E\u5C0F\u3067\u304D\u307E\u305B\u3093\u3002\u5225\u306E\u753B\u50CF\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044");
      return data;
    } finally {
      URL.revokeObjectURL(src);
    }
  }
  $2("avatar-file").addEventListener("change", async (e) => {
    try {
      if (e.target.files?.[0]) {
        tempAvatar = await resizedFile(e.target.files[0], 400, 400, 35e4);
        notify("\u9854\u5199\u771F\u3092\u8AAD\u307F\u8FBC\u307F\u307E\u3057\u305F\u3002\u4FDD\u5B58\u3059\u308B\u3068\u53CD\u6620\u3057\u307E\u3059");
      }
    } catch (err) {
      notify(err.message);
      e.target.value = "";
    }
  });
  $2("background-file").addEventListener("change", async (e) => {
    try {
      if (e.target.files?.[0]) {
        tempBackground = await resizedFile(e.target.files[0], 900, 1100, 13e5);
        notify("\u80CC\u666F\u5199\u771F\u3092\u8AAD\u307F\u8FBC\u307F\u307E\u3057\u305F\u3002\u4FDD\u5B58\u3059\u308B\u3068\u53CD\u6620\u3057\u307E\u3059");
      }
    } catch (err) {
      notify(err.message);
      e.target.value = "";
    }
  });
  $2("profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const next = { ...profile, avatarIcon: tempIcon, backgroundColor: tempColor, avatarPhoto: tempAvatar, backgroundPhoto: tempBackground, emails: tempEmails.filter((x) => x.address.trim()).map((x) => ({ ...x, label: x.label.trim(), address: x.address.trim() })) };
      for (const name of fieldNames) next[name] = $2("p-" + name).value.trim();
      next.birthDate = birthDateFromFields();
      const dates = reconcileEducationDates(profile, next.birthDate, makeId);
      next.events = dates.events;
      next.educationSeeded = dates.educationSeeded;
      save(next);
      closeOverlay();
      notify("\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F");
    } catch (err) {
      notify(err.message);
    }
  });
  var editingEvent = null;
  function editEvent(id = null) {
    const e = id ? profile.events.find((x) => x.id === id) : null;
    if (id && !e) throw Error("\u30A4\u30D9\u30F3\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    editingEvent = id;
    $2("event-title").textContent = e ? "\u51FA\u6765\u4E8B\u3092\u7DE8\u96C6" : "\u51FA\u6765\u4E8B\u3092\u8FFD\u52A0";
    $2("event-name").value = e?.title || "";
    $2("event-date").value = e?.date || todayLocal();
    $2("event-note").value = e?.note || "";
    $2("event-category").value = e ? eventCategory(e) : "life";
    $2("event-delete").hidden = !e;
    eventBaseline = eventDraft();
    showOverlay("event-overlay", "event-name");
  }
  $2("event-form").addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const value = { id: editingEvent || makeId(), title: $2("event-name").value.trim(), date: $2("event-date").value, note: $2("event-note").value.trim(), category: $2("event-category").value };
      if (!value.title || !isDate(value.date)) throw Error("\u51FA\u6765\u4E8B\u3068\u65E5\u4ED8\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044");
      const events = editingEvent ? profile.events.map((x) => x.id === editingEvent ? value : x) : [...profile.events, value];
      save({ ...profile, events });
      closeOverlay();
      notify("\u5E74\u8868\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F");
    } catch (err) {
      notify(err.message);
    }
  });
  $2("event-delete").addEventListener("click", async () => {
    if (!editingEvent) return;
    const yes = await feedback.confirmAction({ title: "\u51FA\u6765\u4E8B\u3092\u524A\u9664", message: "\u3053\u306E\u51FA\u6765\u4E8B\u3092\u5E74\u8868\u304B\u3089\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F", danger: true, acceptLabel: "\u524A\u9664\u3059\u308B" });
    if (!yes) return;
    save({ ...profile, events: profile.events.filter((x) => x.id !== editingEvent) });
    closeOverlay();
    notify("\u51FA\u6765\u4E8B\u3092\u524A\u9664\u3057\u307E\u3057\u305F");
  });
  async function copy(value, label = "\u30B3\u30D4\u30FC") {
    if (!value) {
      notify("\u30B3\u30D4\u30FC\u3059\u308B\u5185\u5BB9\u304C\u3042\u308A\u307E\u305B\u3093");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else throw Error("clipboard unavailable");
    } catch (err) {
      const node = document.createElement("textarea");
      node.value = value;
      node.style.position = "fixed";
      node.style.opacity = "0";
      document.body.appendChild(node);
      node.select();
      const ok = document.execCommand("copy");
      node.remove();
      if (!ok) throw Error("\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
    }
    notify(label + "\u3057\u307E\u3057\u305F");
  }
  function copyHistory(type) {
    const matches = profile.events.filter((x) => eventCategory(x) === type).sort(eventSort);
    if (!matches.length) {
      notify(type === "education" ? "\u5B66\u6B74\u304C\u3042\u308A\u307E\u305B\u3093" : "\u8077\u6B74\u304C\u3042\u308A\u307E\u305B\u3093");
      return;
    }
    return copy(matches.map((x) => japaneseEra(x.date) + " " + Number(x.date.slice(5, 7)) + "\u6708\u3000" + x.title.replace("\uFF084\u5E74\u5236\u306E\u4F8B\uFF09", "") + (x.note !== AUTO_SCHOOL_NOTE && x.note ? "\u3000" + x.note : "")).join("\n"), "\u307E\u3068\u3081\u3066\u30B3\u30D4\u30FC");
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    if (el.hasAttribute("data-copy")) {
      copy(el.dataset.copy).catch((err) => notify(err.message));
      return;
    }
    const action = el.dataset.act;
    if (action === "turn-card") turnCard();
    if (action === "edit-profile") editProfile(el.dataset.editorTarget || "basic");
    if (action === "go-details") go("details");
    if (action === "go-timeline") go("timeline");
    if (action === "toggle-sensitive") {
      sensitiveVisible = !sensitiveVisible;
      showDetails();
    }
    if (action === "new-event") editEvent();
    if (action === "edit-event") editEvent(el.dataset.id);
    if (action === "copy-event") {
      const entry = profile.events.find((x) => x.id === el.dataset.id);
      if (entry) copy(japaneseEra(entry.date) + "\u3000" + entry.title + (entry.note ? "\n" + entry.note : ""), "\u51FA\u6765\u4E8B\u3092\u30B3\u30D4\u30FC").catch((err) => notify(err.message));
    }
    if (action === "copy-education") copyHistory("education");
    if (action === "copy-work") copyHistory("work");
  });
  var removeCardSwipe = null;
  function installCardSwipe() {
    removeCardSwipe?.();
    removeCardSwipe = null;
    const scene = $2("screen-home").querySelector(".card-scene");
    if (scene) removeCardSwipe = attachHorizontalSwipe(scene, { onSwipe: () => turnCard() });
  }
  function turnCard() {
    const scene = $2("screen-home").querySelector(".card-scene");
    if (!scene) return;
    cardSide = cardSide === "front" ? "back" : "front";
    const flipped = cardSide === "back";
    scene.classList.toggle("showing-back", flipped);
    const rotator = scene.querySelector(".card-rotator");
    rotator.classList.toggle("flipped", flipped);
    rotator.classList.remove("is-flipping");
    void rotator.offsetWidth;
    rotator.classList.add("is-flipping");
    scene.querySelector(".card-front").setAttribute("aria-hidden", String(flipped));
    scene.querySelector(".card-back").setAttribute("aria-hidden", String(!flipped));
    scene.setAttribute("aria-label", flipped ? "\u30AB\u30FC\u30C9\u306E\u8868\u3092\u898B\u308B" : "\u30AB\u30FC\u30C9\u306E\u88CF\u3092\u898B\u308B");
    scene.setAttribute("aria-pressed", String(flipped));
    const trigger = $2("screen-home").querySelector(".card-turn");
    trigger.textContent = "\u21C4\u3000" + (flipped ? "\u30AB\u30FC\u30C9\u306E\u8868\u306B\u623B\u3059" : "\u30AB\u30FC\u30C9\u306E\u88CF\u9762\u3092\u898B\u308B");
    trigger.setAttribute("aria-pressed", String(flipped));
    $2("screen-home").querySelector(".card-below-front").hidden = flipped;
    $2("screen-home").querySelector(".card-below-back").hidden = !flipped;
  }
  $2("screen-home").addEventListener("click", (e) => {
    if (e.target.closest(".card-scene")) turnCard();
  });
  $2("screen-home").addEventListener("keydown", (e) => {
    if (e.target.matches(".card-scene") && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      turnCard();
    }
  });
  var lastRenderedDay = todayLocal();
  document.addEventListener("visibilitychange", () => {
    ads.setForeground(!document.hidden);
    if (document.hidden) return;
    const day = todayLocal();
    if (day !== lastRenderedDay) {
      lastRenderedDay = day;
      render();
    }
  });
  window.addEventListener("pageshow", () => {
    const day = todayLocal();
    if (day !== lastRenderedDay) {
      lastRenderedDay = day;
      render();
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "age-search") renderAgeSearch();
  });
  function runButton(id, action) {
    $2(id).addEventListener("click", async (e) => {
      try {
        await feedback.withBusy(e.currentTarget, action);
      } catch (err) {
        console.error(err);
        notify("\u30A8\u30E9\u30FC: " + err.message);
      }
    });
  }
  runButton("remove-ads", () => ads.buyRemoveAds());
  runButton("restore", async () => {
    await ads.restore();
    notify("\u8CFC\u5165\u72B6\u614B\u3092\u78BA\u8A8D\u3057\u307E\u3057\u305F");
  });
  runButton("privacy-choices", async () => {
    try {
      await ads.privacyOptions();
    } catch (err) {
      if (/privacy options form is unavailable because it is not required/i.test(String(err?.message || ""))) {
        notify("\u73FE\u5728\u3001\u5909\u66F4\u304C\u5FC5\u8981\u306A\u5E83\u544A\u306E\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u8A2D\u5B9A\u306F\u3042\u308A\u307E\u305B\u3093");
        return;
      }
      throw err;
    }
  });
  runButton("clear-profile", async () => {
    const confirmed = await feedback.confirmAction({ title: "\u30DE\u30A4\u30D7\u30ED\u30D5\u306E\u5168\u30C7\u30FC\u30BF\u3092\u524A\u9664", message: "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u30FB\u5E74\u8868\u30FB\u8FFD\u52A0\u30AB\u30FC\u30C9\u30FB\u5199\u771F\u3092\u3059\u3079\u3066\u524A\u9664\u3057\u307E\u3059\u3002\u5143\u306B\u623B\u305B\u307E\u305B\u3093\u3002\u5B9F\u884C\u3057\u307E\u3059\u304B\uFF1F", acceptLabel: "\u3059\u3079\u3066\u524A\u9664\u3059\u308B", cancelLabel: "\u30AD\u30E3\u30F3\u30BB\u30EB", danger: true });
    if (!confirmed) return;
    await customCards.clearAll();
    store2.clear();
    profile = DEFAULT_PROFILE();
    cardSide = "front";
    sensitiveVisible = false;
    view = "home";
    tempAvatar = "";
    tempBackground = "";
    tempEmails = [];
    profileBaseline = null;
    eventBaseline = null;
    closeOverlay();
    render();
    notify("\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u3092\u524A\u9664\u3057\u307E\u3057\u305F");
  });
  render();
  ads.initialize().catch((err) => {
    console.error("[Ads init]", err);
    notify("\u5E83\u544A\u30FB\u8CFC\u5165\u6A5F\u80FD\u306E\u521D\u671F\u5316\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044");
  });
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)

astronomy-engine/esm/astronomy.js:
  (**
      @preserve
  
      Astronomy library for JavaScript (browser and Node.js).
      https://github.com/cosinekitty/astronomy
  
      MIT License
  
      Copyright (c) 2019-2023 Don Cross <cosinekitty@gmail.com>
  
      Permission is hereby granted, free of charge, to any person obtaining a copy
      of this software and associated documentation files (the "Software"), to deal
      in the Software without restriction, including without limitation the rights
      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
      copies of the Software, and to permit persons to whom the Software is
      furnished to do so, subject to the following conditions:
  
      The above copyright notice and this permission notice shall be included in all
      copies or substantial portions of the Software.
  
      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.
  *)
  (**
   * @fileoverview Astronomy calculation library for browser scripting and Node.js.
   * @author Don Cross <cosinekitty@gmail.com>
   * @license MIT
   *)
*/
