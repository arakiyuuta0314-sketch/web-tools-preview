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
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
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
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
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

  // src/generated/app-config.mjs
  var app_config_default = {
    "schemaVersion": 1,
    "appId": "com.yuta.hanafudakoikoi",
    "appName": "\u306F\u3058\u3081\u3066\u306E\u82B1\u672D \u3053\u3044\u3053\u3044",
    "storageNamespace": "hanafuda-koikoi",
    "privacyPolicyUrl": "https://arakiyuuta0314-sketch.github.io/app-legal-pages/privacy/",
    "supportUrl": "https://arakiyuuta0314-sketch.github.io/",
    "contactEmail": "yuta.room.info@gmail.com",
    "ads": {
      "mode": "test",
      "appId": "ca-app-pub-3940256099942544~1458002511",
      "bannerId": "ca-app-pub-3940256099942544/2934735716",
      "interstitialId": "ca-app-pub-3940256099942544/4411468910",
      "minCompletedActions": 10,
      "cooldownMs": 6e5,
      "rewardedId": "ca-app-pub-3940256099942544/1712485313"
    },
    "purchase": {
      "enabled": true,
      "removeAdsProductId": "com.yuta.hanafudakoikoi.remove_ads"
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
      if (Object.hasOwn(ads2, "rewardedId")) {
        invariant(adUnitPattern.exec(ads2.rewardedId)?.[1] === app[1], "rewarded ad unit must match the AdMob publisher");
        invariant(![ads2.bannerId, ads2.interstitialId, ads2.appOpenId].includes(ads2.rewardedId), "rewarded ad unit must be distinct");
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

  // src/lib/storage.mjs
  function createJsonStore({ store: store3, key, createInitial, validate: validate2 }) {
    if (!store3 || typeof store3.getItem !== "function" || typeof store3.setItem !== "function") throw new TypeError("Storage API required");
    if (!key || typeof key !== "string") throw new TypeError("Unique storage key required");
    if (typeof createInitial !== "function" || typeof validate2 !== "function") throw new TypeError("Store schema and initializer required");
    const parse = (raw) => {
      let value;
      try {
        value = JSON.parse(raw);
      } catch {
        throw new Error("Saved data is not valid JSON: " + key);
      }
      validate2(value);
      return value;
    };
    return {
      read() {
        const raw = store3.getItem(key);
        return raw === null ? createInitial() : parse(raw);
      },
      write(value) {
        validate2(value);
        const serialized = JSON.stringify(value);
        store3.setItem(key, serialized);
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
        store3.removeItem(key);
      }
    };
  }

  // src/lib/layout.mjs
  function createDeviceLayout({ root, bannerHeightPx = 50, native = false }) {
    if (!root?.classList || !root?.style) throw new TypeError("Layout: root HTML element required");
    if (!Number.isSafeInteger(bannerHeightPx) || bannerHeightPx < 0 || bannerHeightPx > 200)
      throw new RangeError("Layout: banner height must be 0\u2013200 px");
    root.classList.add("app-viewport");
    if (native) root.classList.add("native-app");
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

  // src/lib/ad-policy.mjs
  function isAdBreakAllowed({ events, lastShown, now, minCompletedActions, cooldownMs }) {
    if (![events, lastShown, now, minCompletedActions, cooldownMs].every(Number.isFinite)) throw new Error("Ad frequency values must be numeric");
    if (![events, minCompletedActions, cooldownMs].every(Number.isSafeInteger) || events < 0 || minCompletedActions < 1 || cooldownMs < 0) throw new Error("Invalid ad frequency settings");
    if (lastShown < 0 || now < lastShown) return false;
    return events >= minCompletedActions && now - lastShown >= cooldownMs;
  }
  function createFrequencyTracker({ store: store3, key, now, minCompletedActions, cooldownMs }) {
    if (typeof now !== "function") throw new Error("Clock required");
    const initial2 = () => ({ version: 1, events: 0, lastShown: now() });
    function validate2(v) {
      if (!v || v.version !== 1 || !Number.isSafeInteger(v.events) || v.events < 0 || v.events > 1e8 || !Number.isFinite(v.lastShown) || v.lastShown < 0) throw new Error("Invalid ad frequency state");
    }
    const model = createTrackerStore(store3, key, initial2, validate2);
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
  function createTrackerStore(store3, key, createInitial, validate2) {
    return createJsonStore({ store: store3, key, createInitial, validate: validate2 });
  }

  // src/services/monetization.mjs
  function createMonetization({ config, localStorage: localStorage2, ports: ports2, now = Date.now, onStatus = () => {
  } }) {
    const native = Boolean(ports2.native);
    const ads2 = config.ads;
    const purchase = config.purchase;
    let bannerRequested = false;
    const tracker = createFrequencyTracker({
      store: localStorage2,
      key: config.storageNamespace + ".adFrequency.v1",
      now,
      minCompletedActions: ads2.minCompletedActions,
      cooldownMs: ads2.cooldownMs
    });
    let owned = false, bannerVisible = false, adsReady = false, prepared = false, presenting = false, purchaseReady = false, started = false;
    let consentWarning = "";
    const report = (category, value) => onStatus(
      category,
      category === "ads" && consentWarning ? value + "\uFF08" + consentWarning + "\uFF09" : value
    );
    const hideAds = async () => {
      prepared = false;
      try {
        if (bannerRequested) await ports2.ads.hideBanner();
      } catch (err) {
        report("ads", "\u30D0\u30CA\u30FC\u975E\u8868\u793A\u5931\u6557: " + err.message);
        return;
      }
      bannerVisible = false;
      report("banner", 0);
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
        });
        purchaseReady = true;
        if (ports2.purchase.owned(purchase.removeAdsProductId)) await unlock();
        else report("purchase", "\u8CFC\u5165\u53EF\u80FD");
      } catch (err) {
        report("purchase", "\u521D\u671F\u5316\u30A8\u30E9\u30FC: " + err.message);
        throw err;
      }
    }
    async function prepare() {
      if (!adsReady || owned || prepared) return;
      await ports2.ads.prepareInterstitial({ adId: ads2.interstitialId, isTesting: ads2.mode === "test" });
      prepared = true;
    }
    async function initAds() {
      if (!native || ads2.mode === "disabled" || owned && !ads2.rewardedId) {
        report("ads", owned ? "\u8CFC\u5165\u6E08\u307F\u30FB\u5E83\u544A\u306A\u3057" : native ? "\u5E83\u544A\u6A5F\u80FD\u30AA\u30D5" : "\u30D6\u30E9\u30A6\u30B6\u30D7\u30EC\u30D3\u30E5\u30FC\u30FB\u5E83\u544A\u306A\u3057");
        return;
      }
      report("ads", "\u540C\u610F\u72B6\u614B\u3092\u78BA\u8A8D\u4E2D");
      let canRequestAds;
      try {
        let consent = await ports2.ads.requestConsentInfo();
        if (consent.status === "REQUIRED" && consent.isConsentFormAvailable) consent = await ports2.ads.showConsentForm();
        canRequestAds = consent.canRequestAds;
      } catch (err) {
        consentWarning = "\u5E83\u544A\u306E\u540C\u610F\u78BA\u8A8D\u306B\u5931\u6557: " + err.message;
        report("ads", "\u5E83\u544A\u306E\u521D\u671F\u5316\u3092\u7D9A\u884C\u4E2D");
      }
      if (canRequestAds === false) {
        report("ads", "\u5E83\u544A\u30EA\u30AF\u30A8\u30B9\u30C8\u4E0D\u53EF\u30FB\u540C\u610F\u8A2D\u5B9A\u3092\u78BA\u8A8D");
        return;
      }
      if (ports2.ads.requestTrackingIfNeeded) await ports2.ads.requestTrackingIfNeeded();
      await ports2.ads.initialize({ initializeForTesting: ads2.mode === "test" });
      adsReady = true;
      try {
        await prepare();
      } catch (e) {
        report("ads", "\u5168\u753B\u9762\u5E83\u544A\u6E96\u5099\u5931\u6557: " + e.message);
      }
      if (owned) return hideAds();
      try {
        bannerRequested = true;
        await ports2.ads.showBanner({ adId: ads2.bannerId, adSize: "BANNER", position: "BOTTOM_CENTER", margin: 0, isTesting: ads2.mode === "test" }, (height) => {
          if (height > 0 && owned) {
            void hideAds();
            return;
          }
          report("banner", height);
          if (height > 0 && !bannerVisible) report("ads", "\u30D0\u30CA\u30FC\u8868\u793A\u4E2D");
          bannerVisible = height > 0;
        });
        if (owned) return hideAds();
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
      async showRewarded() {
        if (!native || !adsReady || !ads2.rewardedId) throw new Error("\u30EA\u30EF\u30FC\u30C9\u5E83\u544A\u306F\u73FE\u5728\u5229\u7528\u3067\u304D\u307E\u305B\u3093");
        if (presenting) return false;
        presenting = true;
        try {
          return await ports2.ads.showRewarded({ adId: ads2.rewardedId, isTesting: ads2.mode === "test" });
        } finally {
          presenting = false;
        }
      },
      async privacyOptions() {
        if (!native || ads2.mode === "disabled") throw new Error("\u5E83\u544A\u306E\u540C\u610F\u8A2D\u5B9A\u306F\u3053\u306E\u74B0\u5883\u3067\u306F\u5229\u7528\u3067\u304D\u307E\u305B\u3093");
        await ports2.ads.showPrivacyOptionsForm();
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
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
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
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
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
        upsertTransactionInProgress(productId, state2) {
          const transactionId = virtualTransactionId(productId);
          return new Promise((resolve) => {
            const existing = this.pseudoReceipt.transactions.find((t) => t.transactionId === transactionId);
            if (existing) {
              existing.state = state2;
              existing.refresh(productId);
              resolve(existing);
            } else {
              const tr = new AppleAppStore.SKTransaction(CdvPurchase2.Platform.APPLE_APPSTORE, this.pseudoReceipt, this.context.apiDecorators);
              tr.state = state2;
              tr.transactionId = transactionId;
              tr.refresh(productId);
              this.pseudoReceipt.transactions.push(tr);
              resolve(tr);
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
            return new Promise((resolve) => {
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
                  resolve(existing);
                } else {
                  const tr = new AppleAppStore.SKTransaction(CdvPurchase2.Platform.APPLE_APPSTORE, this._receipt, this.context.apiDecorators);
                  tr.state = state2;
                  tr.transactionId = transactionId;
                  tr.refresh(productId);
                  this._receipt.transactions.push(tr);
                  resolve(tr);
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
          return new Promise((resolve) => {
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
              resolve(void 0);
            }), (code, message) => {
              this.log.info("bridge.init failed: " + code + " - " + message);
              resolve(appStoreError(code, message, null));
            });
          });
        }
        loadReceipts() {
          return __awaiter(this, void 0, void 0, function* () {
            if (this.bridge.pendingTransactionsReady) {
              yield this.bridge.pendingTransactionsReady;
              yield new Promise((r) => setTimeout(r, 0));
            }
            return new Promise((resolve) => {
              this.initializeAppReceipt(() => {
                this.receiptsUpdated.call();
                if (this._receipt) {
                  resolve([this._receipt, this.pseudoReceipt]);
                } else {
                  resolve([this.pseudoReceipt]);
                }
              });
            });
          });
        }
        canMakePayments() {
          return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
              this.bridge.canMakePayments(() => {
                this._canMakePayments = true;
                resolve(true);
              }, (message) => {
                this.log.warn(`canMakePayments: ${message}`);
                this._canMakePayments = false;
                resolve(false);
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
            return new Promise((resolve) => {
              var _a;
              if (((_a = this.bridge.appStoreReceipt) === null || _a === void 0 ? void 0 : _a.appStoreReceipt) && !this.forceReceiptReload) {
                this.log.debug("using cached appstore receipt");
                return resolve(this.bridge.appStoreReceipt);
              }
              this.log.debug("loading appstore receipt...");
              this.forceReceiptReload = false;
              this.bridge.loadReceipts((receipt) => {
                this.log.debug("appstore receipt loaded");
                if (!resolved)
                  resolve(receipt);
                resolved = true;
              }, (code, message) => {
                this.log.warn("Failed to load appStoreReceipt: " + code + " - " + message);
                if (!resolved)
                  resolve(void 0);
                resolved = true;
              });
              setTimeout(function() {
                if (!resolved)
                  resolve(void 0);
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
          return new Promise((resolve) => {
            if (!this.discountEligibilityDeterminer)
              return resolve([]);
            this.discountEligibilityDeterminer(applicationReceipt, eligibilityRequests, resolve);
          });
        }
        loadProducts(products) {
          return new Promise((resolve) => {
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
              resolve(ret);
            }), (code, message) => {
              return products.map((p) => appStoreError(code, message, null));
            });
          });
        }
        order(offer, additionalData) {
          return __awaiter(this, void 0, void 0, function* () {
            let resolved = false;
            return new Promise((resolve) => {
              var _a, _b;
              const callResolve = (result) => {
                if (resolved)
                  return;
                this.setPaymentMonitor(() => {
                });
                resolved = true;
                resolve(result);
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
          return new Promise((resolve) => {
            this.log.info("finish(" + transaction.transactionId + ")");
            if (transaction.transactionId === AppleAppStore.APPLICATION_VIRTUAL_TRANSACTION_ID || transaction.transactionId === virtualTransactionId(transaction.products[0].id)) {
              transaction.state = CdvPurchase2.TransactionState.FINISHED;
              this.receiptsUpdated.call();
              return resolve(void 0);
            }
            const wasAlreadyFinished = transaction.state === CdvPurchase2.TransactionState.FINISHED;
            const success = () => {
              transaction.state = CdvPurchase2.TransactionState.FINISHED;
              if (!wasAlreadyFinished) {
                this.receiptsUpdated.call();
              }
              resolve(void 0);
            };
            const error = (msg) => {
              var _a, _b;
              if (msg === null || msg === void 0 ? void 0 : msg.includes("[#CdvPurchase:100]")) {
                transaction.state = CdvPurchase2.TransactionState.FINISHED;
                resolve(void 0);
              } else {
                resolve(appStoreError(CdvPurchase2.ErrorCode.FINISH, "Failed to finish transaction", (_b = (_a = transaction.products[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null));
              }
            };
            this.bridge.finish(transaction.transactionId, success, error);
          });
        }
        refreshReceipt() {
          return new Promise((resolve) => {
            const success = (receipt) => {
              resolve(receipt);
            };
            const error = (code, message) => {
              resolve(appStoreError(code, message, null));
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
          return new Promise((resolve) => {
            this.onRestoreCompleted = (error) => {
              this.onRestoreCompleted = void 0;
              this.bridge.refreshReceipts((obj) => {
                resolve(error);
              }, (code, message) => {
                resolve(error || appStoreError(code, message, null));
              });
            };
            this.forceReceiptReload = true;
            this.bridge.restore();
          });
        }
        presentCodeRedemptionSheet() {
          return new Promise((resolve) => {
            this.bridge.presentCodeRedemptionSheet(resolve);
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
            return new Promise((resolve) => {
              const plugin = this.plugin;
              if (!plugin) {
                log("getStorefront failed: plugin not available");
                resolve(void 0);
                return;
              }
              plugin.getStorefront().then((result) => resolve(result.countryCode || void 0)).catch((err) => {
                log("getStorefront failed: " + ((err === null || err === void 0 ? void 0 : err.message) || err));
                resolve(void 0);
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
              this.pendingTransactionsReady = new Promise((resolve) => {
                this._pendingTransactionsResolve = resolve;
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
            return new Promise((resolve) => {
              window.cordova.exec((countryCode) => {
                resolve(countryCode || void 0);
              }, (err) => {
                log("getStorefront failed: " + err);
                resolve(void 0);
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
              this.pendingTransactionsReady = new Promise((resolve) => {
                this._pendingTransactionsResolve = resolve;
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
            return new Promise((resolve) => {
              exec("getStorefront", [], (countryCode) => {
                resolve(countryCode || void 0);
              }, (err) => {
                log("getStorefront failed: " + err);
                resolve(void 0);
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
          return new Promise((resolve) => {
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
              this.iosBridge.initialize(this.context, resolve);
            } else if (Braintree.AndroidBridge.Bridge.isSupported() && !this.androidBridge) {
              this.log.info("instantiating android bridge...");
              this.androidBridge = new Braintree.AndroidBridge.Bridge(this.log);
              this.log.info("calling android bridge -> initialize...");
              const auth = this.options.tokenizationKey ? this.options.tokenizationKey : this.options.clientTokenProvider ? this.options.clientTokenProvider : "";
              this.androidBridge.initialize(auth, resolve);
            } else {
              this.log.info("platform not supported...");
              resolve(void 0);
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
            return new Promise((resolve) => {
              window.cordova.exec((result) => {
                this.log.info("dropInSuccess: " + JSON.stringify(result));
                resolve(result);
              }, (err) => {
                this.log.info("dropInFailure: " + err);
                const errCode = err.split("|")[0];
                const errMessage = err.split("|").slice(1).join("");
                if (errCode === "UserCanceledException") {
                  resolve(Braintree.braintreeError(CdvPurchase2.ErrorCode.PAYMENT_CANCELLED, errMessage));
                } else if (errCode === "AuthorizationException") {
                  resolve(Braintree.braintreeError(CdvPurchase2.ErrorCode.UNAUTHORIZED_REQUEST_DATA, errMessage));
                } else {
                  resolve(Braintree.braintreeError(CdvPurchase2.ErrorCode.UNKNOWN, err));
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
            return new Promise((resolve) => {
              var _a;
              if (!((_a = ApplePayPlugin.get()) === null || _a === void 0 ? void 0 : _a.installed)) {
                return resolve(Braintree.braintreeError(CdvPurchase2.ErrorCode.SETUP, "cordova-plugin-purchase-braintree-applepay does not appear to be installed."));
              } else {
                const success = (result) => {
                  resolve(result);
                };
                const failure = (err) => {
                  const message = err !== null && err !== void 0 ? err : "payment request failed";
                  resolve(Braintree.braintreeError(CdvPurchase2.ErrorCode.PURCHASE, "Braintree+ApplePay ERROR: " + message));
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
            return new Promise((resolve) => {
              var _a;
              if (CdvPurchase2.Utils.platformId() !== "ios") {
                log.info("BraintreeApplePayPlugin is only available for ios.");
                return resolve(false);
              }
              if (!((_a = ApplePayPlugin.get()) === null || _a === void 0 ? void 0 : _a.installed)) {
                log.info("BraintreeApplePayPlugin does not appear to be installed.");
                return resolve(false);
              }
              try {
                window.cordova.exec((result) => {
                  resolve(result);
                }, () => {
                  log.info("BraintreeApplePayPlugin is not available.");
                  resolve(false);
                }, PLUGIN_ID, "isApplePaySupported", []);
              } catch (err) {
                log.info("BraintreeApplePayPlugin is not installed.");
                resolve(false);
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
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
              const onSuccess = (result) => {
                this.log.info("dropInSuccess: " + JSON.stringify(result));
                if (result.paymentMethodType === Braintree.DropIn.PaymentMethod.APPLE_PAY) {
                  this.log.info("it's an ApplePay request, we have to process it.");
                  this.continueDropInForApplePay(paymentRequest, dropInRequest, result).then(resolve);
                } else {
                  resolve(result);
                }
              };
              const onError = (errorString) => {
                this.log.info("dropInFailure: " + errorString);
                const [errCode, errMessage] = errorString.split("|");
                if (errCode === "UserCanceledException") {
                  resolve(Braintree.braintreeError(CdvPurchase2.ErrorCode.PAYMENT_CANCELLED, errMessage));
                } else {
                  resolve(Braintree.braintreeError(CdvPurchase2.ErrorCode.UNKNOWN, "ERROR " + errCode + ": " + errMessage));
                }
              };
              this.clientTokenProvider((clientToken) => {
                if (typeof clientToken === "string")
                  window.cordova.exec(onSuccess, onError, "BraintreePlugin", "launchDropIn", [clientToken, dropInRequest]);
                else
                  resolve(clientToken);
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
            return this.initializationPromise = new Promise((resolve) => {
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
                resolve(void 0);
              };
              const iabError = (err, code) => {
                this.initialized = false;
                if (Number(code) === CdvPurchase2.ErrorCode.STORE_BLOCKED) {
                  const error = playStoreError(CdvPurchase2.ErrorCode.STORE_BLOCKED, "Init failed - " + err, null);
                  this.context.error(error);
                  resolve(error);
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
          return new Promise((resolve) => {
            this.getPurchases().then((err) => {
              resolve(this._receipts);
            });
          });
        }
        /** @inheritDoc */
        loadProducts(products) {
          return new Promise((resolve) => {
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
              resolve(ret);
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
        finish(transaction) {
          return new Promise((resolve) => {
            const onSuccess = () => {
              if (transaction.state !== CdvPurchase2.TransactionState.FINISHED) {
                transaction.state = CdvPurchase2.TransactionState.FINISHED;
                this.context.listener.receiptsUpdated(CdvPurchase2.Platform.GOOGLE_PLAY, [transaction.parentReceipt]);
              }
              resolve(void 0);
            };
            const firstProduct = transaction.products[0];
            if (!firstProduct)
              return resolve(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish a transaction with no product", null));
            const product = this._products.getProduct(firstProduct.id);
            if (!product)
              return resolve(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish transaction, unknown product " + firstProduct.id, firstProduct.id));
            const receipt = this._receipts.find((r) => r.hasTransaction(transaction));
            if (!receipt)
              return resolve(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish transaction, linked receipt not found.", product.id));
            if (!receipt.purchaseToken)
              return resolve(playStoreError(CdvPurchase2.ErrorCode.FINISH, "Cannot finish transaction, linked receipt contains no purchaseToken.", product.id));
            const onFailure = (message, code) => resolve(playStoreError(code || CdvPurchase2.ErrorCode.UNKNOWN, message, product.id));
            if (product.type === CdvPurchase2.ProductType.NON_RENEWING_SUBSCRIPTION || product.type === CdvPurchase2.ProductType.CONSUMABLE) {
              if (!transaction.isConsumed)
                return this.bridge.consumePurchase(onSuccess, onFailure, receipt.purchaseToken);
            } else {
              if (!transaction.isAcknowledged)
                return this.bridge.acknowledgePurchase(onSuccess, onFailure, receipt.purchaseToken);
            }
            resolve(void 0);
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
            if (schedule.find((s) => s.refreshTime === refreshTime) || refreshTime < Date.now()) {
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
          return new Promise((resolve) => {
            this.log.debug("getPurchases");
            const success = () => {
              this.log.debug("getPurchases success");
              setTimeout(() => resolve(void 0), 0);
            };
            const failure = (message, code) => {
              this.log.warn("getPurchases failed: " + message + " (" + code + ")");
              setTimeout(() => resolve(playStoreError(code || CdvPurchase2.ErrorCode.UNKNOWN, message, null)), 0);
            };
            this.bridge.getPurchases(success, failure);
          });
        }
        /** @inheritDoc */
        order(offer, additionalData) {
          return __awaiter(this, void 0, void 0, function* () {
            warnIfDeprecatedAdditionalUsername(this.log, additionalData);
            additionalData = withObfuscatedAccountId(additionalData, this.context);
            return new Promise((resolve) => {
              this.log.info("Order - " + JSON.stringify(offer));
              const buySuccess = () => resolve(void 0);
              const buyFailed = (message, code) => {
                this.log.warn("Order failed: " + JSON.stringify({ message, code }));
                if (Number(code) === CdvPurchase2.ErrorCode.STORE_BLOCKED) {
                  resolve(playStoreError(CdvPurchase2.ErrorCode.STORE_BLOCKED, message, offer.productId));
                  return;
                }
                resolve(playStoreError(code !== null && code !== void 0 ? code : CdvPurchase2.ErrorCode.UNKNOWN, message, offer.productId));
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
            return new Promise((resolve) => {
              this.bridge.getStorefront((countryCode) => {
                resolve(countryCode || void 0);
              }, (message) => {
                this.log.warn("getStorefront failed: " + message);
                resolve(void 0);
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
          return new Promise((resolve) => {
            this.bridge.getPurchases(() => resolve(void 0), (message, code) => {
              this.log.warn("getPurchases() failed: " + (code !== null && code !== void 0 ? code : "ERROR") + ": " + message);
              resolve(playStoreError(code !== null && code !== void 0 ? code : CdvPurchase2.ErrorCode.UNKNOWN, message, null));
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
        for (var n2 = "", e = 0; e < 4; e++)
          n2 += HEX2STR[r >> 8 * e + 4 & 15] + HEX2STR[r >> 8 * e & 15];
        return n2;
      }
      function hexStringFromArray(array) {
        const out = [];
        for (var arrayLength = array.length, i = 0; i < arrayLength; i++)
          out.push(toHexString(array[i]));
        return out.join("");
      }
      function add32(r, n2) {
        return r + n2 & 4294967295;
      }
      function complexShift(r, n2, e, t, o, u, shiftFunction) {
        function shiftAdd32(op0, op1, v1) {
          return add32(op0 << op1 | op0 >>> 32 - op1, v1);
        }
        function add32x4(i0, i1, j0, j1) {
          return add32(add32(i1, i0), add32(j0, j1));
        }
        return shiftAdd32(add32x4(r, n2, t, u), o, e);
      }
      var step1Function = function(shiftFunction, n2, e, t, o, u, f, a) {
        return complexShift(e & t | ~e & o, n2, e, u, f, a);
      };
      var step2Function = function(shiftFunction, n2, e, t, o, u, f, a) {
        return complexShift(e & o | t & ~o, n2, e, u, f, a);
      };
      var step3Function = function(shiftFunction, n2, e, t, o, u, f, a) {
        return complexShift(e ^ t ^ o, n2, e, u, f, a);
      };
      var step4Function = function(shiftFunction, n2, e, t, o, u, f, a) {
        return complexShift(t ^ (e | ~o), n2, e, u, f, a);
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
          shiftFunction = function(r, n2) {
            const e = (65535 & r) + (65535 & n2);
            return (r >> 16) + (n2 >> 16) + (e >> 16) << 16 | 65535 & e;
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
            return new Promise((resolve) => {
              setTimeout(() => {
                this.context.listener.receiptsReady(CdvPurchase2.Platform.TEST);
                resolve(this.receipts);
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
          return new Promise((resolve) => {
            setTimeout(() => {
              transaction.state = CdvPurchase2.TransactionState.FINISHED;
              transaction.isAcknowledged = true;
              updateVerifiedPurchases(transaction);
              const product = this.products.find((p) => transaction.products[0].id === p.id);
              if ((product === null || product === void 0 ? void 0 : product.type) === CdvPurchase2.ProductType.CONSUMABLE)
                transaction.isConsumed = true;
              const receipts = this.receipts.filter((r) => r.hasTransaction(transaction));
              this.context.listener.receiptsUpdated(platform, receipts);
              resolve(void 0);
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
          const makeTransaction = (n2) => {
            var _a, _b;
            const tr = new CdvPurchase2.Transaction(platform, receipt, this.context.apiDecorators);
            tr.products = [{
              id: Test.testProducts.PAID_SUBSCRIPTION_ACTIVE.id,
              offerId: Test.testProducts.PAID_SUBSCRIPTION_ACTIVE.extra.offerId
            }];
            tr.state = CdvPurchase2.TransactionState.APPROVED;
            tr.transactionId = transactionId(n2);
            tr.isAcknowledged = n2 == 1;
            tr.renewalIntent = CdvPurchase2.RenewalIntent.RENEW;
            const firstPurchase = +(((_b = (_a = receipt === null || receipt === void 0 ? void 0 : receipt.transactions) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.purchaseDate) || /* @__PURE__ */ new Date());
            tr.purchaseDate = new Date(firstPurchase);
            tr.lastRenewalDate = new Date(firstPurchase + RENEWS_EVERY_MS * (n2 - 1));
            tr.expirationDate = new Date(firstPurchase + RENEWS_EVERY_MS * n2);
            updateVerifiedPurchases(tr);
            return tr;
          };
          receipt.transactions.push(makeTransaction(1));
          this.receipts.push(receipt);
          this.context.listener.receiptsUpdated(CdvPurchase2.Platform.TEST, [receipt]);
          function transactionId(n2) {
            return "test-active-subscription-transaction-" + n2;
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
          wait: () => new Promise((resolve) => {
            if (timeout)
              waiting.push(resolve);
            else
              resolve();
          })
        };
      }
      Utils.createDebouncer = createDebouncer;
      function asyncDelay(milliseconds) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
        const n2 = iso.slice(1, l - 1);
        if (n2 === "1") {
          if (options === null || options === void 0 ? void 0 : options.omitOne) {
            return { "D": "day", "W": "week", "M": "month", "Y": "year" }[iso[l - 1]] || iso[l - 1];
          } else {
            return { "D": "1 day", "W": "1 week", "M": "1 month", "Y": "1 year" }[iso[l - 1]] || iso[l - 1];
          }
        } else {
          const u = { "D": "days", "W": "weeks", "M": "months", "Y": "years" }[iso[l - 1]] || iso[l - 1];
          return `${n2} ${u}`;
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
  async function showRewarded(config) {
    await AdMob.prepareRewardVideoAd(config);
    const listeners = [];
    let earned = false, resolve, reject;
    const finished = new Promise((ok, failed) => {
      resolve = ok;
      reject = failed;
    });
    try {
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        earned = true;
      }));
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => resolve(earned)));
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => reject(new Error(error.message))));
      void AdMob.showRewardVideoAd().then(() => {
        earned = true;
      }, reject);
      return await finished;
    } finally {
      await Promise.allSettled(listeners.map((listener) => listener.remove()));
    }
  }
  function createNativePorts() {
    const native = Capacitor.getPlatform() === "ios";
    return {
      native,
      ads: {
        requestConsentInfo: () => AdMob.requestConsentInfo(),
        showConsentForm: () => AdMob.showConsentForm(),
        initialize: (config) => AdMob.initialize(config),
        async showBanner(config, onHeight) {
          let measuredHeight = 0;
          await AdMob.addListener(BannerAdPluginEvents.SizeChanged, ({ height }) => {
            measuredHeight = height;
            onHeight(height);
          });
          await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
            onHeight(measuredHeight || 50);
          });
          await AdMob.showBanner(config);
        },
        hideBanner: () => AdMob.hideBanner(),
        prepareInterstitial: (config) => AdMob.prepareInterstitial(config),
        showRewarded,
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
          const receiptsReady = new Promise((resolve) => {
            confirmReady = resolve;
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

  // src/game/cards.mjs
  var MONTHS = [
    { month: 1, en: "January", flower: "\u677E", place: "\u677E\u98A8\u306E\u6D5C", season: "\u65B0\u6625" },
    { month: 2, en: "February", flower: "\u6885", place: "\u6885\u9999\u308B\u91CC", season: "\u65E9\u6625" },
    { month: 3, en: "March", flower: "\u685C", place: "\u82B1\u971E\u306E\u90FD", season: "\u6625" },
    { month: 4, en: "April", flower: "\u85E4", place: "\u85E4\u68DA\u306E\u5BBF", season: "\u6669\u6625" },
    { month: 5, en: "May", flower: "\u83D6\u84B2", place: "\u6C34\u8FBA\u306E\u5EAD", season: "\u521D\u590F" },
    { month: 6, en: "June", flower: "\u7261\u4E39", place: "\u7261\u4E39\u306E\u5C71\u91CC", season: "\u6885\u96E8" },
    { month: 7, en: "July", flower: "\u8429", place: "\u8429\u539F\u306E\u5C0F\u5F84", season: "\u76DB\u590F" },
    { month: 8, en: "August", flower: "\u8292", place: "\u6708\u898B\u306E\u9AD8\u539F", season: "\u6669\u590F" },
    { month: 9, en: "September", flower: "\u83CA", place: "\u83CA\u9999\u306E\u8336\u5C4B", season: "\u521D\u79CB" },
    { month: 10, en: "October", flower: "\u7D05\u8449", place: "\u7D05\u8449\u306E\u5CE0", season: "\u79CB" },
    { month: 11, en: "November", flower: "\u67F3", place: "\u6642\u96E8\u306E\u6A4B", season: "\u6669\u79CB" },
    { month: 12, en: "December", flower: "\u6850", place: "\u9CF3\u51F0\u306E\u675C", season: "\u51AC" }
  ];
  var defs = [
    [["Hikari", "\u5149", "\u9DB4"], ["Tanzaku", "\u77ED\u518A", "\u8D64\u77ED"], ["Kasu_1", "\u30AB\u30B9", "\u677E\u306E\u8449"], ["Kasu_2", "\u30AB\u30B9", "\u677E\u306E\u8449"]],
    [["Tane", "\u30BF\u30CD", "\u9DAF"], ["Tanzaku", "\u77ED\u518A", "\u8D64\u77ED"], ["Kasu_1", "\u30AB\u30B9", "\u6885\u306E\u679D"], ["Kasu_2", "\u30AB\u30B9", "\u6885\u306E\u679D"]],
    [["Hikari", "\u5149", "\u685C\u306B\u5E55"], ["Tanzaku", "\u77ED\u518A", "\u8D64\u77ED"], ["Kasu_1", "\u30AB\u30B9", "\u685C\u306E\u82B1"], ["Kasu_2", "\u30AB\u30B9", "\u685C\u306E\u82B1"]],
    [["Tane", "\u30BF\u30CD", "\u4E0D\u5982\u5E30"], ["Tanzaku", "\u77ED\u518A", "\u85E4\u306E\u77ED\u518A"], ["Kasu_1", "\u30AB\u30B9", "\u85E4\u306E\u82B1"], ["Kasu_2", "\u30AB\u30B9", "\u85E4\u306E\u82B1"]],
    [["Tane", "\u30BF\u30CD", "\u516B\u6A4B"], ["Tanzaku", "\u77ED\u518A", "\u83D6\u84B2\u306E\u77ED\u518A"], ["Kasu_1", "\u30AB\u30B9", "\u83D6\u84B2\u306E\u8449"], ["Kasu_2", "\u30AB\u30B9", "\u83D6\u84B2\u306E\u8449"]],
    [["Tane", "\u30BF\u30CD", "\u8776"], ["Tanzaku", "\u77ED\u518A", "\u9752\u77ED"], ["Kasu_1", "\u30AB\u30B9", "\u7261\u4E39\u306E\u82B1"], ["Kasu_2", "\u30AB\u30B9", "\u7261\u4E39\u306E\u82B1"]],
    [["Tane", "\u30BF\u30CD", "\u732A"], ["Tanzaku", "\u77ED\u518A", "\u8429\u306E\u77ED\u518A"], ["Kasu_1", "\u30AB\u30B9", "\u8429\u306E\u82B1"], ["Kasu_2", "\u30AB\u30B9", "\u8429\u306E\u82B1"]],
    [["Hikari", "\u5149", "\u6708"], ["Tane", "\u30BF\u30CD", "\u96C1"], ["Kasu_1", "\u30AB\u30B9", "\u8292\u306E\u7A42"], ["Kasu_2", "\u30AB\u30B9", "\u8292\u306E\u7A42"]],
    [["Tane", "\u30BF\u30CD", "\u76C3"], ["Tanzaku", "\u77ED\u518A", "\u9752\u77ED"], ["Kasu_1", "\u30AB\u30B9", "\u83CA\u306E\u82B1"], ["Kasu_2", "\u30AB\u30B9", "\u83CA\u306E\u82B1"]],
    [["Tane", "\u30BF\u30CD", "\u9E7F"], ["Tanzaku", "\u77ED\u518A", "\u9752\u77ED"], ["Kasu_1", "\u30AB\u30B9", "\u7D05\u8449"], ["Kasu_2", "\u30AB\u30B9", "\u7D05\u8449"]],
    [["Hikari", "\u5149", "\u5C0F\u91CE\u9053\u98A8"], ["Tane", "\u30BF\u30CD", "\u71D5"], ["Tanzaku", "\u77ED\u518A", "\u67F3\u306E\u77ED\u518A"], ["Kasu", "\u30AB\u30B9", "\u67F3\u306E\u8449"]],
    [["Hikari", "\u5149", "\u9CF3\u51F0"], ["Kasu_1", "\u30AB\u30B9", "\u6850\u306E\u82B1"], ["Kasu_2", "\u30AB\u30B9", "\u6850\u306E\u8449"], ["Kasu_3", "\u30AB\u30B9", "\u6850\u306E\u8449"]]
  ];
  var DECK = Object.freeze(defs.flatMap((group, i) => group.map(([variant, type, subject], j) => Object.freeze({
    id: i + 1 + "-" + (j + 1),
    month: i + 1,
    flower: MONTHS[i].flower,
    type,
    subject,
    variant,
    asset: "assets/cards/Hanafuda_" + MONTHS[i].en + "_" + variant + ".png",
    name: i + 1 + "\u6708 " + MONTHS[i].flower + "\u30FB" + subject,
    detail: i + 1 + "\u6708\u306E" + MONTHS[i].flower + "\u3092\u63CF\u3044\u305F" + type + "\u672D\u3002" + subject + "\u304C\u898B\u5206\u3051\u308B\u76EE\u5370\u3067\u3059\u3002"
  }))));
  var CARD_BY_ID = Object.fromEntries(DECK.map((c) => [c.id, c]));
  function card(id) {
    const result = CARD_BY_ID[id];
    if (!result) throw new Error("Unknown card: " + id);
    return result;
  }
  var cardIds = Object.freeze(DECK.map((c) => c.id));
  var RED = ["1-2", "2-2", "3-2"];
  var BLUE = ["6-2", "9-2", "10-2"];
  var BOAR_DEER_BUTTERFLY = ["7-1", "10-1", "6-1"];
  var LIGHTS = DECK.filter((c) => c.type === "\u5149").map((c) => c.id);
  var RAIN = "11-1";
  var MOON = "8-1";
  var CURTAIN = "3-1";
  var CUP = "9-1";

  // src/game/rules.mjs
  var RULES = Object.freeze({
    pointThreshold: 7,
    highScoreMultiplier: 2,
    opponentKoiMultiplier: 2,
    initialHand: 8,
    initialField: 8,
    roundDraw: 24,
    fieldFourOfMonth: "redeal",
    threeMatch: "capture-all",
    noAgari: "zero-both",
    lateYaku: "auto-stop",
    scoreGrowth: "higher-total"
  });
  var YAKU_TABLE = Object.freeze([
    { id: "goko", name: "\u4E94\u5149", base: 10, group: "lights", requires: 5 },
    { id: "shiko", name: "\u56DB\u5149", base: 8, group: "lights-norain", requires: 4 },
    { id: "ame-shiko", name: "\u96E8\u5165\u308A\u56DB\u5149", base: 7, group: "lights-rain", requires: 4 },
    { id: "sanko", name: "\u4E09\u5149", base: 5, group: "lights-norain", requires: 3 },
    { id: "inoshikacho", name: "\u732A\u9E7F\u8776", base: 5, group: "set", ids: BOAR_DEER_BUTTERFLY, bonus: "tane-after-three" },
    { id: "akatan", name: "\u8D64\u77ED", base: 5, group: "set", ids: RED, bonus: "tan-after-three" },
    { id: "aotan", name: "\u9752\u77ED", base: 5, group: "set", ids: BLUE, bonus: "tan-after-three" },
    { id: "tane", name: "\u30BF\u30CD", base: 1, group: "count", type: "\u30BF\u30CD", requires: 5, perExtra: 1 },
    { id: "tan", name: "\u30BF\u30F3", base: 1, group: "count", type: "\u77ED\u518A", requires: 5, perExtra: 1 },
    { id: "kasu", name: "\u30AB\u30B9", base: 1, group: "count", type: "\u30AB\u30B9", requires: 10, perExtra: 1 },
    { id: "tsukimizake", name: "\u6708\u898B\u9152", base: 3, group: "set", ids: [MOON, CUP] },
    { id: "hanamizake", name: "\u82B1\u898B\u9152", base: 3, group: "set", ids: [CURTAIN, CUP] }
  ]);
  var YAKU_BY_ID = Object.fromEntries(YAKU_TABLE.map((y) => [y.id, y]));
  function evaluate(capturedIds) {
    const held = new Set(capturedIds);
    if (held.size !== capturedIds.length) throw new Error("Duplicate captured card");
    for (const id of held) card(id);
    const counts = { \u5149: 0, \u30BF\u30CD: 0, \u77ED\u518A: 0, \u30AB\u30B9: 0 };
    for (const id of held) counts[card(id).type]++;
    if (held.has(CUP)) counts["\u30AB\u30B9"]++;
    const scored = [], near = [];
    for (const y of YAKU_TABLE) {
      let missing = [], points = 0, progress = 0;
      if (y.group === "set") {
        missing = y.ids.filter((id) => !held.has(id));
        progress = y.ids.length - missing.length;
        if (!missing.length) {
          points = y.base;
          if (y.bonus === "tane-after-three") points += Math.max(0, counts["\u30BF\u30CD"] - 3);
          if (y.bonus === "tan-after-three") points += Math.max(0, counts["\u77ED\u518A"] - 3);
        }
      } else if (y.group === "count") {
        progress = counts[y.type];
        missing = Array.from({ length: Math.max(0, y.requires - progress) }, () => y.type);
        if (progress >= y.requires) points = y.base + (progress - y.requires) * (y.perExtra || 0);
      } else {
        const found = LIGHTS.filter((id) => held.has(id));
        let valid = false;
        if (y.id === "goko") {
          progress = found.length;
          valid = found.length === 5;
        }
        if (y.id === "shiko") {
          progress = found.filter((id) => id !== RAIN).length;
          valid = progress === 4 && !held.has(RAIN);
        }
        if (y.id === "ame-shiko") {
          progress = found.length;
          valid = found.length === 4 && held.has(RAIN);
        }
        if (y.id === "sanko") {
          progress = found.filter((id) => id !== RAIN).length;
          valid = progress === 3 && !held.has(RAIN);
        }
        missing = Array.from({ length: Math.max(0, y.requires - progress) }, () => "\u5149");
        if (valid) points = y.base;
      }
      if (points > 0) scored.push({ id: y.id, name: y.name, points });
      else if (missing.length === 1 && progress > 0) near.push({ id: y.id, name: y.name, needed: missing[0], progress });
    }
    const lightOrder = ["goko", "shiko", "ame-shiko", "sanko"];
    const light = scored.find((x) => lightOrder.includes(x.id));
    const unique = scored.filter((x) => !lightOrder.includes(x.id) || x.id === light?.id);
    return { yakus: unique, raw: unique.reduce((sum, y) => sum + y.points, 0), counts, near };
  }
  function settlePoints(raw, koiCalls, winner) {
    if (!Number.isSafeInteger(raw) || raw < 0 || !Array.isArray(koiCalls) || koiCalls.length !== 2) throw new Error("Invalid settlement");
    if (koiCalls.some((x) => !Number.isSafeInteger(x) || x < 0 || x > 8)) throw new Error("Invalid koi count");
    if (winner !== 0 && winner !== 1) throw new Error("Winner required for settlement");
    const high = raw >= RULES.pointThreshold ? RULES.highScoreMultiplier : 1;
    const koi = koiCalls[1 - winner] > 0 ? RULES.opponentKoiMultiplier : 1;
    return { raw, multiplier: high * koi, points: raw * high * koi };
  }
  function probableYaku(ids) {
    return evaluate(ids).near.filter((y) => y.needed !== void 0).slice(0, 5);
  }

  // src/game/learning.mjs
  var CARD_FAMILIES = Object.freeze([
    { type: "\u5149", sample: "1-1", meaning: "\u7279\u5225\u306A\u7D75\u67C4\u3002\u4E09\u5149\u30FB\u56DB\u5149\u306A\u3069\u306E\u5F79\u3092\u72D9\u3046\u672D" },
    { type: "\u30BF\u30CD", sample: "7-1", meaning: "\u52D5\u7269\u3084\u9053\u5177\u306A\u3069\u30025\u679A\u3067\u300C\u30BF\u30CD\u300D\u306E\u5F79" },
    { type: "\u77ED\u518A", sample: "6-2", meaning: "\u7D30\u9577\u3044\u77ED\u518A\u30025\u679A\u3067\u300C\u30BF\u30F3\u300D\u306E\u5F79" },
    { type: "\u30AB\u30B9", sample: "2-3", meaning: "\u82B1\u3084\u8449\u306A\u3069\u300210\u679A\u3067\u300C\u30AB\u30B9\u300D\u306E\u5F79" }
  ]);
  function newCaptureIds(log, fromIndex, actor = 0) {
    if (!Array.isArray(log) || !Number.isInteger(fromIndex) || fromIndex < 0 || !Number.isInteger(actor)) throw new Error("Invalid capture log");
    return [...new Set(log.slice(fromIndex).filter((e) => e.actor === actor).flatMap((e) => e.taken || []))];
  }
  function cardsForYaku(y, captured) {
    const rule = YAKU_BY_ID[y.id];
    if (!rule) throw new Error("Missing yaku definition: " + y.id);
    const held = new Set(captured);
    if (rule.ids) return rule.ids.filter((id) => held.has(id));
    if (rule.group === "count") return captured.filter((id) => card(id).type === rule.type || rule.type === "\u30AB\u30B9" && id === CUP);
    if (rule.group.startsWith("lights")) return LIGHTS.filter((id) => held.has(id));
    return [];
  }
  function completedYakuSummary(captured, koiCalls = [0, 0]) {
    const score = evaluate(captured);
    if (score.raw < 1) throw new Error("No completed yaku");
    const settlement = settlePoints(score.raw, koiCalls, 0);
    return {
      ...settlement,
      yakus: score.yakus.map((y) => ({ ...y, cards: cardsForYaku(y, captured) }))
    };
  }
  function newYakuCelebration(captured, newCards) {
    if (!newCards.length) return null;
    const added = new Set(newCards);
    const before = new Map(evaluate(captured.filter((id) => !added.has(id))).yakus.map((yaku) => [yaku.id, yaku.points]));
    const yakus = evaluate(captured).yakus.filter((yaku) => yaku.points > (before.get(yaku.id) ?? 0));
    if (!yakus.length) return null;
    yakus.sort((a, b) => b.points - a.points);
    const points = yakus[0].points;
    const tier = points >= 7 ? 3 : points >= 4 ? 2 : 1;
    const cards = [...new Set(yakus.flatMap((yaku) => cardsForYaku(yaku, captured)))];
    return { tier, yakus, cards };
  }

  // src/game/engine.mjs
  function shuffle(ids, rng = Math.random) {
    const a = [...ids];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function initialHandBonus(ids) {
    if (!Array.isArray(ids) || ids.length !== 8 || new Set(ids).size !== 8) throw new Error("Invalid initial hand");
    const counts = /* @__PURE__ */ new Map();
    for (const id of ids) {
      const month = card(id).month;
      counts.set(month, (counts.get(month) || 0) + 1);
    }
    if ([...counts.values()].includes(4)) return "te-shi";
    if (counts.size === 4 && [...counts.values()].every((count) => count === 2)) return "kuttsuki";
    return null;
  }
  function initialDealClaim(hands) {
    if (!Array.isArray(hands) || hands.length !== 2) throw new Error("Both initial hands required");
    const claims = hands.map(initialHandBonus);
    if (claims[0] && claims[1]) return { redeal: true };
    if (claims[0]) return { winner: 0, reason: claims[0] };
    if (claims[1]) return { winner: 1, reason: claims[1] };
    return null;
  }
  function createRound({ dealer = 0, rng = Math.random } = {}) {
    let deck, field, bonus;
    for (let attempt = 0; attempt < 500; attempt++) {
      deck = shuffle(cardIds, rng);
      field = deck.slice(16, 24);
      if (field.some((id) => field.filter((x) => card(x).month === card(id).month).length === 4)) continue;
      const claim = initialDealClaim([deck.slice(0, 8), deck.slice(8, 16)]);
      if (claim?.redeal) continue;
      bonus = claim;
      break;
    }
    if (!deck || bonus === void 0) throw new Error("Unable to deal a valid round");
    const round = {
      dealer,
      current: dealer,
      phase: bonus ? "round-end" : "hand",
      hands: [deck.slice(0, 8), deck.slice(8, 16)],
      field,
      stock: deck.slice(24),
      captured: [[], []],
      lastRaw: [0, 0],
      koiCalls: [0, 0],
      pendingDraw: null,
      pendingHand: null,
      event: null,
      turn: 0,
      result: bonus ? { ...bonus, raw: 6, multiplier: 1, points: 6 } : null,
      log: []
    };
    assertConservation(round);
    return round;
  }
  function applyInitialBonus(g) {
    const result = g.round.result;
    if (!result) return g;
    g.scores[result.winner] += result.points;
    if (g.index + 1 >= g.length) {
      g.finished = true;
      g.round.phase = "game-end";
    }
    return g;
  }
  function createGame({ mode = "free", length = 3, month = 1, difficulty = 2, beginner = false, rng = Math.random } = {}) {
    if (mode !== "free" || ![3, 6, 12].includes(length) || month < 1 || month > 12) throw new Error("Invalid game mode");
    if (![1, 2, 3].includes(difficulty)) throw new Error("Invalid difficulty");
    return applyInitialBonus({
      version: 1,
      mode,
      length,
      month,
      difficulty: beginner ? 1 : difficulty,
      beginner,
      scores: [0, 0],
      index: 0,
      round: createRound({ dealer: 0, rng }),
      finished: false
    });
  }
  function assertConservation(r) {
    const all = [...r.hands[0], ...r.hands[1], ...r.field, ...r.stock, ...r.captured[0], ...r.captured[1]];
    if (r.pendingDraw) all.push(r.pendingDraw);
    if (all.length !== 48 || new Set(all).size !== 48 || all.some((id) => !cardIds.includes(id))) throw new Error("Card conservation violation");
    return true;
  }
  function matching(field, id) {
    return field.filter((x) => card(x).month === card(id).month);
  }
  function legalHands(r) {
    if (r.phase !== "hand") return [];
    return r.hands[r.current].flatMap((id) => {
      const matches = matching(r.field, id);
      return matches.length === 2 ? matches.map((target) => ({ cardId: id, targetId: target })) : [{ cardId: id, targetId: matches.length === 1 ? matches[0] : null }];
    });
  }
  function capture(r, id, targetId, actor, source) {
    if (source !== "hand" && source !== "stock") throw new Error("Unknown move source");
    const matches = matching(r.field, id);
    const acquired = [id];
    if (matches.length === 1) {
      if (targetId !== null && targetId !== matches[0]) throw new Error("Incorrect matching target");
      acquired.push(matches[0]);
    } else if (matches.length === 2) {
      if (!matches.includes(targetId)) throw new Error("Target must be selected from two matches");
      acquired.push(targetId);
    } else if (matches.length === 3) {
      if (targetId !== null && !matches.includes(targetId)) throw new Error("Invalid triple target");
      acquired.push(...matches);
    } else if (matches.length > 3) throw new Error("Invalid field month count");
    if (acquired.length === 1) r.field.push(id);
    else {
      const taken = new Set(acquired.slice(1));
      r.field = r.field.filter((x) => !taken.has(x));
      r.captured[actor].push(...acquired);
    }
    r.event = { actor, played: id, taken: acquired.length > 1 ? acquired : [], source };
    r.log.push({ actor, card: id, taken: [...r.event.taken], source });
    return acquired;
  }
  function playHand(g, id, targetId = null) {
    const r = g.round;
    if (g.finished || r.phase !== "hand") throw new Error("Not a hand-play phase");
    const actor = r.current;
    if (!r.hands[actor].includes(id)) throw new Error("Card not in current hand");
    if (matching(r.field, id).length === 2 && !matching(r.field, id).includes(targetId)) throw new Error("Choose one matching field card");
    r.hands[actor].splice(r.hands[actor].indexOf(id), 1);
    capture(r, id, targetId, actor, "hand");
    r.pendingHand = r.event;
    r.phase = "draw";
    return drawStock(g);
  }
  function drawStock(g) {
    const r = g.round;
    if (r.phase !== "draw" || !r.stock.length) throw new Error("No stock for draw");
    const id = r.stock.shift(), matches = matching(r.field, id);
    if (matches.length === 2) {
      r.pendingDraw = id;
      r.phase = "draw-target";
      assertConservation(r);
      return g;
    }
    return resolveDraw(g, id, matches.length === 1 ? matches[0] : null);
  }
  function resolveDraw(g, id, targetId) {
    const r = g.round;
    const actor = r.current;
    capture(r, id, targetId, actor, "stock");
    r.pendingDraw = null;
    r.pendingHand = null;
    const score = evaluate(r.captured[actor]);
    r.turn++;
    if (score.raw > r.lastRaw[actor]) {
      if (r.hands[0].length === 0 && r.hands[1].length === 0) finishRound(g, actor, "last-card");
      else if (r.koiCalls[0] + r.koiCalls[1] > 0) finishRound(g, actor, "koi-agari");
      else r.phase = "decision";
    } else {
      if (r.hands[0].length === 0 && r.hands[1].length === 0) finishRound(g, null, "draw");
      else {
        r.current = 1 - actor;
        r.phase = "hand";
      }
    }
    assertConservation(r);
    return g;
  }
  function chooseDrawMatch(g, targetId) {
    const r = g.round;
    if (r.phase !== "draw-target" || !r.pendingDraw) throw new Error("No draw choice");
    if (!matching(r.field, r.pendingDraw).includes(targetId)) throw new Error("Invalid draw match");
    return resolveDraw(g, r.pendingDraw, targetId);
  }
  function decide(g, choice) {
    const r = g.round, actor = r.current;
    if (g.finished || r.phase !== "decision") throw new Error("Not at koi decision");
    if (!["stop", "koi"].includes(choice)) throw new Error("Invalid koi decision");
    if (choice === "stop") return finishRound(g, actor, "agari");
    r.koiCalls[actor]++;
    r.lastRaw[actor] = evaluate(r.captured[actor]).raw;
    r.current = 1 - actor;
    r.phase = "hand";
    assertConservation(r);
    return g;
  }
  function finishRound(g, winner, reason) {
    const r = g.round;
    const raw = winner === null ? 0 : evaluate(r.captured[winner]).raw;
    const settled = winner === null ? { raw: 0, multiplier: 1, points: 0 } : settlePoints(raw, r.koiCalls, winner);
    if (winner !== null) g.scores[winner] += settled.points;
    r.phase = "round-end";
    r.result = { winner, reason, ...settled };
    if (g.index + 1 >= g.length) {
      g.finished = true;
      r.phase = "game-end";
    }
    return g;
  }
  function nextRound(g, rng = Math.random) {
    if (g.mode !== "free" || g.finished || g.round.phase !== "round-end") throw new Error("No next round");
    const previous = g.round.result;
    g.index++;
    const dealer = previous.winner === null ? 1 - g.round.dealer : previous.winner;
    g.round = createRound({ dealer, rng });
    return applyInitialBonus(g);
  }
  var weight = (id) => card(id).type === "\u5149" ? 11 : card(id).type === "\u30BF\u30CD" ? 6 : card(id).type === "\u77ED\u518A" ? 4 : 1;
  function potentialValue(r, actor, ids) {
    const now = evaluate(r.captured[actor]);
    const next = evaluate([...r.captured[actor], ...ids]);
    const near = next.near.length - now.near.length;
    return (next.raw - now.raw) * 14 + near * 2 + ids.reduce((sum, id) => sum + weight(id), 0);
  }
  function cpuChooseMove(g, rng = Math.random) {
    const r = g.round;
    if (r.current !== 1 || r.phase !== "hand") throw new Error("CPU is not playing");
    const choices = legalHands(r);
    if (!choices.length) throw new Error("CPU no legal actions");
    if (g.difficulty === 1) return choices[Math.floor(rng() * choices.length)];
    const scored = choices.map((m) => {
      const matches = matching(r.field, m.cardId);
      const taken = matches.length === 3 ? [m.cardId, ...matches] : matches.length ? [m.cardId, m.targetId] : [];
      const own = potentialValue(r, 1, taken);
      const visibleThreat = matches.reduce((sum, id) => sum + weight(id), 0) * (g.difficulty === 3 ? 1.5 : 0.25);
      return { m, score: own + visibleThreat + weight(m.cardId) * 0.15 + rng() * (g.difficulty === 3 ? 0.2 : 5) };
    });
    return scored.sort((a, b) => b.score - a.score)[0].m;
  }
  function cpuDecide(g) {
    const r = g.round;
    if (r.current !== 1 || r.phase !== "decision") throw new Error("CPU decision required");
    const own = evaluate(r.captured[1]).raw;
    const opp = evaluate(r.captured[0]).raw;
    const turns = r.hands[1].length;
    if (g.difficulty === 1) return own >= 5 || turns <= 2 ? "stop" : "koi";
    if (g.difficulty === 2) return own >= 4 || turns <= 3 || opp >= 3 ? "stop" : "koi";
    return own >= 3 || turns <= 4 || opp >= 2 || r.koiCalls[0] > 0 ? "stop" : "koi";
  }
  function runCpu(g, rng = Math.random) {
    for (let steps = 0; steps < 6 && !g.finished && g.round.current === 1; steps++) {
      const r = g.round;
      if (r.phase === "hand") {
        const move = cpuChooseMove(g, rng);
        playHand(g, move.cardId, move.targetId);
      } else if (r.phase === "draw-target") {
        const choices = matching(r.field, r.pendingDraw);
        const best = choices.slice().sort((a, b) => potentialValue(r, 1, [r.pendingDraw, b]) - potentialValue(r, 1, [r.pendingDraw, a]))[0];
        chooseDrawMatch(g, best);
      } else if (r.phase === "decision") decide(g, cpuDecide(g));
      else break;
    }
    assertConservation(g.round);
    return g;
  }

  // src/game/opponents.mjs
  var OPPONENTS = [
    { id: "easy", label: "\u3084\u3055\u3057\u3044", lines: [
      "\u3048\u3078\u3078\u3001|\u308F\u305F\u3057\u3082\u307E\u3060|\u4FEE\u884C\u4E2D\u306A\u3093\u3067\u3059\u3002",
      "\u307E\u3001\u8CA0\u3051\u307E\u305B\u3093|\u304B\u3089\u306D\u2026\u2026\u305F\u3076\u3093\u3002",
      "\u3053\u306E\u672D\u306E\u7D75\u3001|\u304D\u308C\u3044\u3067|\u597D\u304D\u306A\u3093\u3067\u3059\u3002",
      "\u3069\u3001\u3069\u3046\u3057\u3088\u3046\u3002|\u3048\u3044\u3063\u3001|\u601D\u3044\u5207\u3063\u3066\uFF01",
      "\u82B1\u672D\u3063\u3066\u3001|\u5B63\u7BC0\u3092\u96C6\u3081\u308B|\u307F\u305F\u3044\u3067|\u697D\u3057\u3044\u3067\u3059\u3088\u306D\u3002",
      "\u3082\u3046\u4E00\u5C40\u3001|\u4ED8\u304D\u5408\u3063\u3066|\u304F\u3060\u3055\u3044\u306D\u3002"
    ] },
    { id: "normal", label: "\u3075\u3064\u3046", lines: [
      "\u3044\u3089\u3063\u3057\u3083\u3044\u3002|\u3086\u3063\u304F\u308A|\u3057\u3066\u3044\u3063\u3066\u306D\u3002",
      "\u672D\u306E\u58F0\u3092|\u805E\u304F\u306E\u304C\u3001|\u4E0A\u9054\u306E\u30B3\u30C4\u3088\u3002",
      "\u3042\u3089\u3001\u3044\u3044\u624B\u306D\u3002|\u3053\u3061\u3089\u3082|\u8CA0\u3051\u306A\u3044\u308F\u3088\u3002",
      "\u3053\u3044\u3053\u3044\u3059\u308B\u304B\u3001|\u52DD\u8CA0\u3059\u308B\u304B\u3002|\u305D\u3053\u304C|\u60A9\u307F\u3069\u3053\u308D\u306D\u3002",
      "\u9577\u304F\u7D9A\u3051\u308B|\u79D8\u8A23\u306F\u3001|\u697D\u3057\u3080\u3053\u3068\u3088\u3002",
      "\u3055\u3042\u3001|\u6B21\u306E\u5C40\u3092|\u59CB\u3081\u307E\u3057\u3087\u3046\u304B\u3002"
    ] },
    { id: "hard", label: "\u3064\u3088\u3044", lines: [
      "\u624B\u52A0\u6E1B\u306F|\u3057\u307E\u305B\u3093\u3088\u3002",
      "\u305D\u306E\u4E00\u624B\u3001|\u8AAD\u3081\u3066\u3044\u307E\u3057\u305F\u3002",
      "\u82B1\u306F\u54B2\u304F\u3068\u304D\u3092|\u5F85\u3064\u3082\u306E\u3002|\u308F\u305F\u3057\u3082|\u5F85\u3061\u307E\u3059\u3002",
      "\u3042\u3089\u3001|\u9762\u767D\u304F|\u306A\u3063\u3066\u304D\u307E\u3057\u305F\u306D\u3002",
      "\u52DD\u8CA0\u306F|\u6700\u5F8C\u307E\u3067|\u5206\u304B\u308A\u307E\u305B\u3093\u3002|\u3060\u304B\u3089|\u697D\u3057\u3044\u306E\u3067\u3059\u3002",
      "\u6B21\u306F\u3001|\u3082\u3046\u5C11\u3057|\u672C\u6C17\u3092|\u51FA\u3057\u307E\u3057\u3087\u3046\u304B\u3002"
    ] }
  ].map((opponent) => ({
    ...opponent,
    lines: opponent.lines.map((line) => line.split("|")),
    figure: "assets/opponent-" + opponent.id + "-figure.webp",
    board: "images/opponent-" + opponent.id + "-board.webp"
  }));

  // src/game/content.mjs
  var stories = [
    [
      "\u6B63\u6708\u306E\u5EAD\u3067\u3001{\u677E|\u307E\u3064}\u306F\u51AC\u306B\u3082\u7DD1\u3092\u4FDD\u3061\u307E\u3059\u3002\u9577\u5BFF\u3084\u5909\u308F\u3089\u306C\u751F\u547D\u306E\u3057\u308B\u3057\u3068\u3055\u308C\u3001\u9580\u677E\u306B\u3082\u7528\u3044\u3089\u308C\u3066\u304D\u307E\u3057\u305F\u3002\u65B0\u5E74\u306E\u9580\u306B\u7ACB\u3064\u677E\u3068\u3001\u672D\u306E\u679D\u3076\u308A\u3092\u898B\u6BD4\u3079\u3066\u307F\u307E\u3057\u3087\u3046\u3002",
      "\u4E00\u6708\u306E\u5149\u672D\u306F\u300C\u677E\u306B{\u9DB4|\u3064\u308B}\u300D\u3002\u9DB4\u3082\u9577\u5BFF\u3092\u795D\u3046\u7D75\u67C4\u3067\u3001\u4E8C\u3064\u304C\u305D\u308D\u3046\u3068\u6B63\u6708\u3089\u3057\u3044\u666F\u8272\u306B\u306A\u308A\u307E\u3059\u3002\u9CE5\u3068\u3001\u679D\u306E\u305D\u3070\u306E\u8D64\u3044\u8272\u304C\u76EE\u5370\u3067\u3059\u3002",
      "\u8D64\u3044\u77ED\u518A\u306B\u6587\u5B57\u304C\u3042\u308B\u672D\u3082\u4E00\u6708\u306E\u4EF2\u9593\u3067\u3059\u3002\u4E8C\u6708\u306E\u6885\u3001\u4E09\u6708\u306E\u685C\u306E\u6587\u5B57\u5165\u308A\u77ED\u518A\u3068\u96C6\u3081\u308B\u3068\u300C{\u8D64\u77ED|\u3042\u304B\u305F\u3093}\u300D\u3002\u540C\u3058\u8D64\u3067\u3082\u6587\u5B57\u306E\u306A\u3044\u77ED\u518A\u304C\u3042\u308B\u306E\u3067\u3001\u8272\u3068\u6587\u5B57\u3092\u4E00\u7DD2\u306B\u898B\u3066\u304F\u3060\u3055\u3044\u3002"
    ],
    [
      "\u307E\u3060\u98A8\u304C\u51B7\u305F\u3044\u3053\u308D\u3001{\u6885|\u3046\u3081}\u306F\u8449\u306B\u5148\u304C\u3051\u3066\u82B1\u3092\u958B\u304D\u307E\u3059\u3002\u82B1\u306E\u8272\u306F\u767D\u304B\u3089\u6FC3\u3044\u7D05\u307E\u3067\u3042\u308A\u3001\u8FD1\u304F\u306B\u5BC4\u308B\u3068\u9999\u308A\u306B\u6C17\u3065\u304F\u3053\u3068\u3082\u3002\u6625\u306E\u8A2A\u308C\u3092\u5F85\u3064\u666F\u8272\u306B\u3088\u304F\u4F3C\u5408\u3044\u307E\u3059\u3002",
      "\u4E8C\u6708\u306E\u30BF\u30CD\u672D\u306F\u300C\u6885\u306B{\u9DAF|\u3046\u3050\u3044\u3059}\u300D\u3002\u9DAF\u306F\u6625\u5148\u306B\u3055\u3048\u305A\u308B\u3053\u3068\u304B\u3089{\u6625\u544A\u9CE5|\u306F\u308B\u3064\u3052\u3069\u308A}\u3068\u3082\u547C\u3070\u308C\u307E\u3059\u3002\u5B9F\u969B\u306B\u82B1\u3092\u8A2A\u308C\u308B\u7DD1\u8272\u306E\u9CE5\u3092\u898B\u3066\u3082\u3001\u3059\u3050\u306B\u9DAF\u3068\u6C7A\u3081\u305A\u3001\u5225\u306E\u9CE5\u304B\u3082\u3057\u308C\u306A\u3044\u3068\u8003\u3048\u308B\u3068\u89B3\u5BDF\u304C\u9762\u767D\u304F\u306A\u308A\u307E\u3059\u3002",
      "\u6885\u306B\u306F\u6587\u5B57\u5165\u308A\u306E\u8D64\u3044\u77ED\u518A\u3082\u3042\u308A\u307E\u3059\u3002\u9CE5\u306E\u672D\u3068\u77ED\u518A\u306F\u7A2E\u985E\u304C\u9055\u3044\u307E\u3059\u304C\u3001\u6885\u306E\u679D\u304C\u76EE\u5370\u306A\u306E\u3067\u5BFE\u5C40\u3067\u306F\u540C\u3058\u4E8C\u6708\u3068\u3057\u3066\u5408\u308F\u305B\u3066\u53D6\u308C\u307E\u3059\u3002"
    ],
    [
      "{\u685C|\u3055\u304F\u3089}\u304C\u54B2\u304F\u3068\u3001\u6728\u306E\u4E0B\u306B\u6577\u7269\u3092\u5E83\u3052\u3066\u82B1\u3092\u773A\u3081\u308B\u82B1\u898B\u306E\u5B63\u7BC0\u3067\u3059\u3002\u6E80\u958B\u306E\u679D\u3092\u898B\u4E0A\u3052\u308B\u6642\u9593\u3082\u3001\u82B1\u3073\u3089\u304C\u98A8\u306B\u6563\u308B\u666F\u8272\u3082\u3001\u6625\u306E\u697D\u3057\u307F\u3068\u3057\u3066\u89AA\u3057\u307E\u308C\u3066\u3044\u307E\u3059\u3002",
      "\u4E09\u6708\u306E\u5149\u672D\u306F\u300C\u685C\u306B{\u5E55|\u307E\u304F}\u300D\u3002\u679D\u306E\u4E0B\u306E\u5E55\u306F\u3001\u82B1\u898B\u306E\u5E2D\u3092\u601D\u308F\u305B\u307E\u3059\u3002\u672D\u3092\u898B\u305F\u3068\u304D\u306F\u82B1\u306E\u8272\u306B\u52A0\u3048\u3066\u3001\u4E0B\u5074\u3092\u5927\u304D\u304F\u5360\u3081\u308B\u5E55\u3092\u63A2\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002",
      "\u4E5D\u6708\u306E\u300C\u83CA\u306B{\u76C3|\u3055\u304B\u305A\u304D}\u300D\u3068\u305D\u308D\u3046\u3068\u300C\u82B1\u898B\u9152\u300D\u3002\u4E09\u6708\u3068\u4E5D\u6708\u306F\u540C\u3058\u6708\u3068\u3057\u3066\u5408\u308F\u305B\u3066\u53D6\u308C\u307E\u305B\u3093\u304C\u3001\u53D6\u308A\u672D\u306E\u4E2D\u306B\u305D\u308D\u3048\u308B\u3068\u5F79\u306B\u306A\u308A\u307E\u3059\u3002"
    ],
    [
      "\u521D\u590F\u306B\u5411\u304B\u3046\u3053\u308D\u3001{\u85E4|\u3075\u3058}\u306E\u82B1\u306F\u623F\u306B\u306A\u3063\u3066\u5782\u308C\u4E0B\u304C\u308A\u307E\u3059\u3002\u85E4\u68DA\u306E\u4E0B\u304B\u3089\u898B\u4E0A\u3052\u308B\u3068\u3001\u7D2B\u8272\u306E\u82B1\u304C\u5E7E\u91CD\u306B\u3082\u91CD\u306A\u308A\u3001\u898B\u308B\u65B9\u5411\u3067\u9055\u3063\u305F\u8868\u60C5\u3092\u898B\u305B\u307E\u3059\u3002",
      "\u56DB\u6708\u306E\u30BF\u30CD\u672D\u306B\u306F{\u4E0D\u5982\u5E30|\u307B\u3068\u3068\u304E\u3059}\u304C\u63CF\u304B\u308C\u307E\u3059\u3002\u6B4C\u306B\u3082\u8A60\u307E\u308C\u3066\u304D\u305F\u9CE5\u3067\u3001\u305D\u306E\u58F0\u306F\u590F\u306E\u8A2A\u308C\u3092\u601D\u308F\u305B\u307E\u3059\u3002\u85E4\u306E\u82B1\u623F\u306E\u5411\u3053\u3046\u3092\u98DB\u3076\u5C0F\u3055\u306A\u59FF\u3092\u63A2\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002",
      "\u9CE5\u306E\u3044\u306A\u3044\u85E4\u306E\u672D\u3082\u3042\u308A\u307E\u3059\u3002\u8584\u7D2B\u306E\u82B1\u623F\u304C\u4E0B\u3092\u5411\u304F\u5F62\u306F\u5171\u901A\u306E\u76EE\u5370\u3067\u3059\u3002\u9CE5\u3001\u77ED\u518A\u3001\u82B1\u3060\u3051\u306E\u672D\u3092\u898B\u6BD4\u3079\u308B\u3068\u3001\u6708\u3068\u672D\u306E\u7A2E\u985E\u3092\u5225\u3005\u306B\u899A\u3048\u3089\u308C\u307E\u3059\u3002"
    ],
    [
      "\u6C34\u8FBA\u306B\u7D30\u3044\u8449\u304C\u7ACB\u3061\u3001\u305D\u306E\u9593\u306B\u7D2B\u8272\u306E\u82B1\u304C\u898B\u3048\u307E\u3059\u3002\u4E94\u6708\u306E\u672D\u306F\u300C{\u83D6\u84B2|\u3042\u3084\u3081}\u300D\u3068\u547C\u3070\u308C\u3001{\u71D5\u5B50\u82B1|\u304B\u304D\u3064\u3070\u305F}\u306E\u666F\u8272\u3068\u3082\u7D50\u3073\u4ED8\u3051\u3066\u8A9E\u3089\u308C\u307E\u3059\u3002",
      "\u30BF\u30CD\u672D\u306E\u6A4B\u306F\u300C{\u516B\u6A4B|\u3084\u3064\u306F\u3057}\u300D\u3002\u6298\u308C\u66F2\u304C\u3063\u305F\u6A4B\u3068\u6C34\u8FBA\u306E\u82B1\u306F\u3001\u300E{\u4F0A\u52E2\u7269\u8A9E|\u3044\u305B\u3082\u306E\u304C\u305F\u308A}\u300F\u306E\u516B\u6A4B\u306E\u5834\u9762\u3092\u9023\u60F3\u3055\u305B\u307E\u3059\u3002\u65C5\u4EBA\u304C\u71D5\u5B50\u82B1\u3092\u898B\u3066\u6B4C\u3092\u8A60\u3080\u304F\u3060\u308A\u3067\u3059\u3002",
      "\u4E94\u6708\u306B\u306F\u7AEF\u5348\u306E\u7BC0\u53E5\u3084\u83D6\u84B2\u6E6F\u306E\u98A8\u7FD2\u3082\u3042\u308A\u307E\u3059\u3002\u6E6F\u306B\u5165\u308C\u308B{\u83D6\u84B2|\u3057\u3087\u3046\u3076}\u306F\u9999\u308A\u306E\u3042\u308B\u690D\u7269\u3067\u3001\u672D\u306B\u63CF\u304B\u308C\u305F\u7D2B\u306E\u82B1\u3068\u306F\u533A\u5225\u3057\u3066\u899A\u3048\u308B\u3068\u3001\u540D\u524D\u306E\u8AAD\u307F\u5206\u3051\u3082\u697D\u3057\u3081\u307E\u3059\u3002"
    ],
    [
      "{\u7261\u4E39|\u307C\u305F\u3093}\u306E\u82B1\u306F\u3001\u5927\u304D\u306A\u82B1\u3073\u3089\u304C\u91CD\u306A\u308A\u3001\u9060\u304F\u304B\u3089\u3082\u76EE\u3092\u5F15\u304D\u307E\u3059\u3002\u7D75\u306E\u4E2D\u3067\u82B1\u3092\u5927\u304D\u304F\u63CF\u3051\u3070\u3001\u305D\u308C\u3060\u3051\u3067\u83EF\u3084\u304B\u306A\u666F\u8272\u306B\u306A\u308A\u307E\u3059\u3002\u516D\u6708\u306E\u672D\u3067\u306F\u82B1\u3060\u3051\u306E\u7D75\u306B\u3082\u3001\u305D\u306E\u4E38\u3044\u8F2A\u90ED\u304C\u3088\u304F\u51FA\u3066\u3044\u307E\u3059\u3002",
      "\u30BF\u30CD\u672D\u3067\u306F\u3001\u82B1\u306E\u305D\u3070\u306B{\u8776|\u3061\u3087\u3046}\u304C\u821E\u3044\u307E\u3059\u3002\u4E03\u6708\u306E{\u732A|\u3044\u306E\u3057\u3057}\u3001\u5341\u6708\u306E{\u9E7F|\u3057\u304B}\u3068\u305D\u308D\u3048\u308B\u3068\u300C{\u732A\u9E7F\u8776|\u3044\u306E\u3057\u304B\u3061\u3087\u3046}\u300D\u3002\u8349\u82B1\u306E\u9055\u3046\u4E09\u679A\u3092\u3001\u52D5\u7269\u306E\u59FF\u3067\u899A\u3048\u3089\u308C\u308B\u5F79\u3067\u3059\u3002",
      "\u7261\u4E39\u306B\u306F\u9752\u3044\u77ED\u518A\u3082\u3042\u308A\u307E\u3059\u3002\u4E5D\u6708\u306E\u83CA\u3001\u5341\u6708\u306E\u7D05\u8449\u306E\u9752\u77ED\u518A\u3068\u96C6\u3081\u3066\u300C{\u9752\u77ED|\u3042\u304A\u305F\u3093}\u300D\u3002\u8776\u3068\u9752\u3044\u77ED\u518A\u3092\u63A2\u3059\u3068\u3001\u516D\u6708\u306E\u672D\u3067\u72D9\u3048\u308B\u5F79\u304C\u4E8C\u3064\u601D\u3044\u6D6E\u304B\u3073\u307E\u3059\u3002"
    ],
    [
      "{\u8429|\u306F\u304E}\u306F\u5C0F\u3055\u306A\u82B1\u3092\u7D30\u3044\u679D\u306B\u305F\u304F\u3055\u3093\u4ED8\u3051\u307E\u3059\u3002\u79CB\u306E\u4E03\u8349\u306E\u4E00\u3064\u306B\u6319\u3052\u3089\u308C\u307E\u3059\u304C\u3001\u82B1\u672D\u3067\u306F\u4E03\u6708\u306E\u7D75\u67C4\u3002\u672D\u306E\u6708\u306F\u73FE\u4EE3\u306E\u958B\u82B1\u6642\u671F\u3068\u3044\u3064\u3082\u3074\u3063\u305F\u308A\u5408\u3046\u308F\u3051\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
      "\u4E03\u6708\u306E\u30BF\u30CD\u672D\u3067\u306F\u3001\u8429\u306E\u4E0B\u306B{\u732A|\u3044\u306E\u3057\u3057}\u304C\u3044\u307E\u3059\u3002\u679D\u306E\u304B\u3052\u306B\u3044\u308B\u9ED2\u3063\u307D\u3044\u4F53\u3068\u3001\u4E38\u307F\u306E\u3042\u308B\u80CC\u3092\u63A2\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002\u8776\u3068\u9E7F\u3092\u52A0\u3048\u308C\u3070\u300C{\u732A\u9E7F\u8776|\u3044\u306E\u3057\u304B\u3061\u3087\u3046}\u300D\u306B\u306A\u308A\u307E\u3059\u3002",
      "\u77ED\u518A\u306E\u672D\u3084\u82B1\u3060\u3051\u306E\u672D\u3067\u3082\u3001\u7D30\u3044\u679D\u306B\u70B9\u3005\u3068\u4E26\u3076\u82B1\u306F\u305D\u306E\u307E\u307E\u3067\u3059\u3002\u732A\u3060\u3051\u3067\u6708\u3092\u899A\u3048\u308B\u3088\u308A\u3001\u8429\u306E\u8449\u3068\u679D\u3092\u898B\u5206\u3051\u308B\u3068\u56DB\u679A\u3068\u3082\u63A2\u3057\u3084\u3059\u304F\u306A\u308A\u307E\u3059\u3002"
    ],
    [
      "{\u8292|\u3059\u3059\u304D}\u306E\u7A42\u304C\u98A8\u306B\u63FA\u308C\u3001\u4E38\u3044\u6708\u304C\u5C71\u306E\u5411\u3053\u3046\u306B\u6D6E\u304B\u3073\u307E\u3059\u3002\u6708\u898B\u3067\u306F\u56E3\u5B50\u3084\u8292\u3092\u4F9B\u3048\u308B\u3053\u3068\u304C\u3042\u308A\u307E\u3059\u3002\u8292\u306F\u79CB\u306E\u8349\u3068\u3057\u3066\u89AA\u3057\u307E\u308C\u3001\u7A42\u306E\u5F62\u3092\u7A32\u7A42\u306B\u898B\u7ACB\u3066\u308B\u8AAC\u660E\u3082\u3042\u308A\u307E\u3059\u3002",
      "\u516B\u6708\u306E\u5149\u672D\u306F\u300C\u8292\u306B\u6708\u300D\u3002\u5927\u304D\u306A\u6708\u304C\u4E00\u679A\u306E\u4E2D\u592E\u306B\u3042\u308B\u306E\u3067\u3001\u521D\u3081\u3066\u898B\u308B\u4EBA\u306B\u3082\u898B\u3064\u3051\u3084\u3059\u3044\u672D\u3067\u3059\u3002\u4E5D\u6708\u306E{\u76C3|\u3055\u304B\u305A\u304D}\u3068\u4E00\u7DD2\u306B\u53D6\u3063\u3066\u304A\u304F\u3068\u300C\u6708\u898B\u9152\u300D\u306B\u306A\u308A\u307E\u3059\u3002",
      "\u540C\u3058\u516B\u6708\u306B\u306F\u3001\u7A7A\u3092\u9023\u306A\u3063\u3066\u98DB\u3076{\u96C1|\u304C\u3093}\u306E\u30BF\u30CD\u672D\u3082\u3042\u308A\u307E\u3059\u3002\u9CE5\u306E\u6709\u7121\u3060\u3051\u3067\u5224\u65AD\u305B\u305A\u3001\u5730\u9762\u306B\u96C6\u307E\u308B\u8292\u306E\u7D30\u3044\u7DDA\u306B\u3082\u76EE\u3092\u5411\u3051\u308B\u3068\u3001\u6708\u306E\u672D\u3068\u4EF2\u9593\u3060\u3068\u5206\u304B\u308A\u307E\u3059\u3002"
    ],
    [
      "\u79CB\u306E{\u83CA|\u304D\u304F}\u306F\u3001\u9262\u690D\u3048\u3084\u83CA\u306E\u5C55\u793A\u3067\u3082\u898B\u3089\u308C\u307E\u3059\u3002\u65E7\u66A6\u4E5D\u6708\u4E5D\u65E5\u306E{\u91CD\u967D|\u3061\u3087\u3046\u3088\u3046}\u306E\u7BC0\u53E5\u306B\u306F\u3001\u83CA\u3092\u6D6E\u304B\u3079\u305F\u9152\u3067\u9577\u5BFF\u3092\u9858\u3046\u98A8\u7FD2\u304C\u4F1D\u308F\u308A\u307E\u3059\u3002",
      "\u4E5D\u6708\u306E\u30BF\u30CD\u672D\u306F\u300C\u83CA\u306B{\u76C3|\u3055\u304B\u305A\u304D}\u300D\u3002\u82B1\u306E\u304B\u305F\u308F\u3089\u306E\u5668\u306B\u6CE8\u76EE\u3057\u307E\u3057\u3087\u3046\u3002\u685C\u306B\u5E55\u3068\u7D44\u3081\u3070\u82B1\u898B\u9152\u3001\u8292\u306B\u6708\u3068\u7D44\u3081\u3070\u6708\u898B\u9152\u3067\u3059\u3002\u4E00\u679A\u306E\u5668\u304C\u6625\u3068\u79CB\u3001\u4E8C\u3064\u306E\u666F\u8272\u3092\u3064\u306A\u304E\u307E\u3059\u3002",
      "\u4E5D\u6708\u306B\u306F\u9752\u3044\u77ED\u518A\u306E\u672D\u3082\u3042\u308A\u307E\u3059\u3002\u7261\u4E39\u3068\u7D05\u8449\u306E\u9752\u77ED\u518A\u3092\u3059\u3067\u306B\u6301\u3063\u3066\u3044\u308C\u3070\u3001\u83CA\u306E\u77ED\u518A\u304C\u9752\u77ED\u306E\u6700\u5F8C\u306E\u4E00\u679A\u3002\u76C3\u3068\u77ED\u518A\u3067\u72D9\u3048\u308B\u5F79\u304C\u9055\u3044\u307E\u3059\u3002"
    ],
    [
      "\u5C71\u306E{\u7D05\u8449|\u3082\u307F\u3058}\u304C\u8272\u3065\u304F\u3053\u308D\u3001\u6728\u3005\u3092\u898B\u306B\u51FA\u304B\u3051\u308B\u3053\u3068\u3092{\u7D05\u8449\u72E9|\u3082\u307F\u3058\u304C}\u308A\u3068\u547C\u3073\u307E\u3059\u3002\u8D64\u3084\u9EC4\u306E\u8449\u304C\u91CD\u306A\u308B\u3068\u3001\u590F\u3068\u540C\u3058\u9053\u3082\u5225\u306E\u666F\u8272\u306B\u898B\u3048\u3066\u304D\u307E\u3059\u3002",
      "\u5341\u6708\u306E\u30BF\u30CD\u672D\u306F\u300C\u7D05\u8449\u306B{\u9E7F|\u3057\u304B}\u300D\u3002\u8449\u306E\u4E0B\u3067\u9E7F\u304C\u9854\u3092\u5F8C\u308D\u3078\u5411\u3051\u3066\u3044\u307E\u3059\u3002\u516D\u6708\u306E\u8776\u3068\u4E03\u6708\u306E\u732A\u3092\u96C6\u3081\u3066\u3044\u308C\u3070\u3001\u3053\u306E\u9E7F\u304C\u300C{\u732A\u9E7F\u8776|\u3044\u306E\u3057\u304B\u3061\u3087\u3046}\u300D\u3092\u5B8C\u6210\u3055\u305B\u307E\u3059\u3002",
      "\u5341\u6708\u306E\u9752\u3044\u77ED\u518A\u306F\u3001\u83CA\u3068\u7261\u4E39\u306E\u9752\u77ED\u518A\u3068\u4EF2\u9593\u3067\u3059\u3002\u79CB\u306E\u8D64\u3044\u8449\u306E\u4E2D\u306B\u3042\u308B\u9752\u3044\u7E26\u9577\u306E\u5F62\u306F\u3001\u624B\u672D\u306B\u4E26\u3093\u3067\u3044\u3066\u3082\u898B\u5206\u3051\u3084\u3059\u3044\u624B\u304C\u304B\u308A\u3067\u3059\u3002"
    ],
    [
      "\u679D\u306E\u7D30\u3044{\u67F3|\u3084\u306A\u304E}\u304C\u96E8\u306B\u306C\u308C\u3001\u5098\u3092\u5DEE\u3057\u305F{\u5C0F\u91CE\u9053\u98A8|\u304A\u306E\u306E\u3068\u3046\u3075\u3046}\u304C\u7ACB\u3063\u3066\u3044\u307E\u3059\u3002\u9053\u98A8\u306F\u5E73\u5B89\u6642\u4EE3\u306E\u66F8\u306E\u540D\u624B\u3067\u3059\u3002\u3053\u306E\u672D\u306F\u300C\u96E8\u300D\u3068\u3082\u547C\u3070\u308C\u3001\u5341\u4E00\u6708\u306E\u5149\u672D\u306B\u5F53\u305F\u308A\u307E\u3059\u3002",
      "\u9053\u98A8\u304C\u67F3\u306B\u98DB\u3073\u3064\u3053\u3046\u3068\u3059\u308B{\u86D9|\u304B\u3048\u308B}\u3092\u898B\u3066\u3001\u52AA\u529B\u3092\u7D9A\u3051\u308B\u5927\u5207\u3055\u3092\u609F\u3063\u305F\u3068\u3044\u3046\u8A71\u304C\u4F1D\u308F\u308A\u307E\u3059\u3002\u4F1D\u8AAC\u306E\u4E00\u5834\u9762\u3068\u3057\u3066\u3001\u4EBA\u7269\u306E\u8DB3\u5143\u306B\u3044\u308B\u5C0F\u3055\u306A\u86D9\u3092\u63A2\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002",
      "\u3053\u3044\u3053\u3044\u3067\u306F\u96E8\u672D\u306E\u6271\u3044\u304C\u5149\u306E\u5F79\u306B\u3088\u3063\u3066\u7570\u306A\u308A\u307E\u3059\u3002\u96E8\u3092\u542B\u3080\u56DB\u679A\u306F\u300C{\u96E8\u56DB\u5149|\u3042\u3081\u3057\u3053\u3046}\u300D\u3001\u542B\u307E\u306A\u3044\u56DB\u679A\u306F\u300C{\u56DB\u5149|\u3057\u3053\u3046}\u300D\u3002\u96E8\u3092\u5165\u308C\u305F\u4E09\u679A\u3067\u306F\u4E09\u5149\u306B\u306A\u308A\u307E\u305B\u3093\u3002"
    ],
    [
      "{\u6850|\u304D\u308A}\u306B\u306F\u5927\u304D\u306A\u8449\u304C\u3042\u308A\u3001\u7D0B\u306B\u3082\u7528\u3044\u3089\u308C\u3066\u304D\u307E\u3057\u305F\u3002\u5341\u4E8C\u6708\u306E\u672D\u3067\u306F\u3001\u8449\u3068\u305D\u306E\u4E0A\u306E\u9CE5\u3092\u898B\u6BD4\u3079\u308B\u3068\u3001\u307B\u304B\u306E\u6708\u306E\u9CE5\u672D\u3068\u306F\u9055\u3046\u59FF\u304C\u5206\u304B\u308A\u307E\u3059\u3002",
      "\u5149\u672D\u306B\u63CF\u304B\u308C\u308B\u306E\u306F{\u9CF3\u51F0|\u307B\u3046\u304A\u3046}\u3002\u5B9F\u5728\u306E\u9CE5\u3067\u306F\u306A\u304F\u3001\u3081\u3067\u305F\u3044\u3053\u3068\u3092\u8868\u3059\u4F1D\u8AAC\u306E\u9CE5\u3067\u3059\u3002\u9577\u3044\u5C3E\u7FBD\u304C\u5E83\u304C\u308A\u3001\u6885\u306E\u9DAF\u3084\u85E4\u306E\u4E0D\u5982\u5E30\u3088\u308A\u3082\u98FE\u308A\u306E\u591A\u3044\u59FF\u3067\u63CF\u304B\u308C\u307E\u3059\u3002",
      "\u677E\u306B\u9DB4\u3001\u685C\u306B\u5E55\u3001\u8292\u306B\u6708\u3001\u67F3\u306B\u9053\u98A8\u3001\u305D\u3057\u3066\u6850\u306B\u9CF3\u51F0\u3002\u4E94\u679A\u306E\u5149\u672D\u304C\u3059\u3079\u3066\u305D\u308D\u3063\u305F\u5F79\u304C\u300C{\u4E94\u5149|\u3054\u3053\u3046}\u300D\u3067\u3059\u3002\u5341\u4E8C\u6708\u306E\u672D\u3092\u304D\u3063\u304B\u3051\u306B\u3001\u6B8B\u308A\u56DB\u679A\u306E\u7D75\u3092\u601D\u3044\u51FA\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002"
    ]
  ];
  var CHAPTERS = MONTHS.map((month, index) => ({ ...month, story: stories[index] }));

  // src/game/betting.mjs
  var BETTING_RATES = /* @__PURE__ */ new Map([[10, "\u5C0F\u52DD\u8CA0"], [50, "\u4E2D\u52DD\u8CA0"], [100, "\u5927\u52DD\u8CA0"]]);
  var MIN_COINS = 100;
  var FREE_COINS = 300;
  var AD_COINS = 500;
  var BETTING_DIFFICULTY = /* @__PURE__ */ new Map([[10, 1], [50, 2], [100, 3]]);
  function createWallet() {
    return { coins: 3e3, lastFreeRefill: null };
  }
  function localDay(now = /* @__PURE__ */ new Date()) {
    const twoDigits = (value) => String(value).padStart(2, "0");
    return now.getFullYear() + "-" + twoDigits(now.getMonth() + 1) + "-" + twoDigits(now.getDate());
  }
  function canRefillForFree(wallet, today = localDay()) {
    return wallet.lastFreeRefill === null || wallet.lastFreeRefill < today;
  }
  function settleBettingMatch(wallet, game) {
    if (!game?.finished || !game.betting || game.betting.settlement) return;
    const difference = (game.scores[0] - game.scores[1]) * game.betting.rate;
    const change = Math.max(-wallet.coins, difference) || 0;
    wallet.coins += change;
    game.betting.settlement = { change, balance: wallet.coins };
  }

  // src/game/progress.mjs
  function recordFinishedGame(state2, g) {
    if (!g || !g.finished || g.recorded) return false;
    if (!g.round?.result) throw new Error("Finished game lacks an explicit outcome");
    const win = g.round.result.winner;
    if (win !== null && win !== 0 && win !== 1) throw new Error("Invalid winner");
    let outcome;
    if (g.mode === "free") {
      outcome = Math.sign(g.scores[0] - g.scores[1]);
    } else throw new Error("Unknown game mode");
    state2.stats[outcome === 1 ? "wins" : outcome === -1 ? "losses" : "draws"]++;
    g.recorded = true;
    return true;
  }

  // src/game/narration.mjs
  function reachable(y, ownIds, opponentIds) {
    const own = new Set(ownIds), opponent = new Set(opponentIds);
    const rule = YAKU_BY_ID[y.id];
    if (!rule) throw new Error("Unknown near yaku: " + y.id);
    if (rule.group === "set") return rule.ids.every((id) => own.has(id) || !opponent.has(id));
    if (rule.group === "count") {
      const remaining = DECK.filter((c) => c.type === rule.type && !opponent.has(c.id)).length + (rule.type === "\u30AB\u30B9" && !opponent.has(CUP) ? 1 : 0);
      return remaining >= rule.requires;
    }
    const available = LIGHTS.filter((id) => !opponent.has(id));
    const nonRain = available.filter((id) => id !== RAIN);
    if (rule.id === "goko") return available.length === 5;
    if (rule.id === "shiko") return !own.has(RAIN) && nonRain.length === 4;
    if (rule.id === "sanko") return !own.has(RAIN) && nonRain.length >= 3;
    if (rule.id === "ame-shiko") return available.includes(RAIN) && available.length >= 4;
    throw new Error("Unknown light yaku: " + rule.id);
  }
  function reachableNearYaku(ownIds, opponentIds) {
    return probableYaku(ownIds).filter((y) => reachable(y, ownIds, opponentIds));
  }
  function guidance(g) {
    const r = g.round;
    const mine = evaluate(r.captured[0]);
    const opp = evaluate(r.captured[1]);
    const nearMine = reachableNearYaku(r.captured[0], r.captured[1]);
    const short = nearMine.map((y) => y.name + "\u307E\u3067\u3042\u30681\u679A");
    const summary = [];
    const recent = r.log.slice(-4);
    if (recent.length) {
      for (const move of recent) {
        const c = card(move.card);
        const who = move.actor === 0 ? "\u3042\u306A\u305F" : "\u76F8\u624B";
        const action = move.source === "stock" ? who + "\u304C\u5C71\u672D\u304B\u3089" + c.flower + "\u306E" + c.type + "\u672D\u3092\u3081\u304F\u308A\u307E\u3057\u305F\u3002" : move.source === "hand" ? who + "\u304C" + c.flower + "\u306E" + c.type + "\u672D\u3092\u51FA\u3057\u307E\u3057\u305F\u3002" : who + "\u306E" + c.flower + "\u306E" + c.type + "\u672D\u304C\u516C\u958B\u3055\u308C\u307E\u3057\u305F\u3002";
        summary.push(action + (move.taken.length ? move.taken.length + "\u679A\u3092\u53D6\u308A\u307E\u3057\u305F\u3002" : "\u5834\u306B\u7F6E\u304D\u307E\u3057\u305F\u3002"));
      }
      if (mine.yakus.length) summary.push("\u3042\u306A\u305F\u306E\u6210\u7ACB\u5F79\u306F" + mine.yakus.map((y) => y.name + " " + y.points + "\u70B9").join("\u3001") + "\u3002");
      if (r.captured[1].length) {
        const hint = reachableNearYaku(r.captured[1], r.captured[0]);
        if (hint.length) summary.push("\u76F8\u624B\u306E\u516C\u958B\u53D6\u308A\u672D\u3092\u898B\u308B\u3068\u3001" + hint[0].name + "\u304C\u8FD1\u3044\u304B\u3082\u3057\u308C\u307E\u305B\u3093\u3002");
      }
    } else summary.push("\u540C\u3058\u6708\u306E\u672D\u3092\u5408\u308F\u305B\u308B\u3068\u3001\u53D6\u308A\u672D\u306B\u306A\u308A\u307E\u3059\u3002\u307E\u305A\u624B\u672D\u3092\u9078\u3073\u307E\u3057\u3087\u3046\u3002");
    const blocked = probableYaku(r.captured[0]).filter((y) => !nearMine.some((n2) => n2.id === y.id));
    for (const y of blocked.slice(0, 2)) {
      const rule = YAKU_BY_ID[y.id];
      if (rule.group === "set" && typeof y.needed === "string" && r.captured[1].includes(y.needed)) {
        const name = y.needed === CUP ? "\u83CA\u306B\u76C3" : card(y.needed).name;
        summary.push("\u76F8\u624B\u304C" + name + "\u3092\u53D6\u3063\u3066\u3044\u308B\u305F\u3081\u3001" + y.name + "\u306F\u3053\u306E\u5C40\u3067\u306F\u4F5C\u308C\u307E\u305B\u3093\u3002");
      }
    }
    if (short.length) summary.push("\u3082\u3046\u5C11\u3057\u3067\u6210\u7ACB\uFF1A" + short.slice(0, 3).join("\uFF0F") + "\u3002");
    if (r.phase === "decision" && r.current === 0) {
      const settlement = settlePoints(mine.raw, r.koiCalls, 0);
      const turns = r.hands[0].length;
      summary.push("\u4ECA\u300C\u52DD\u8CA0\u300D\u3067\u7D42\u3048\u308B\u3068" + settlement.points + "\u70B9\u3002" + (turns <= 2 || opp.raw > 0 || settlement.points >= 7 ? "\u6B8B\u308A\u672D\u3068\u76F8\u624B\u306E\u516C\u958B\u5F79\u3092\u8003\u3048\u308B\u3068\u3001\u52DD\u8CA0\u3067\u78BA\u5B9A\u3055\u305B\u308B\u9078\u629E\u304C\u5805\u5B9F\u3067\u3059\u3002" : "\u4F59\u88D5\u304C\u3042\u308C\u3070\u300C\u3053\u3044\u3053\u3044\u300D\u3067\u5F97\u70B9\u3092\u4F38\u3070\u305B\u307E\u3059\u304C\u3001\u76F8\u624B\u306B\u5148\u306B\u4E0A\u304C\u3089\u308C\u308B\u5371\u967A\u3082\u3042\u308A\u307E\u3059\u3002"));
    }
    return { brief: summary[0], full: summary.join(" "), near: short, mine, opp };
  }
  function helpfulHandIds(g) {
    const r = g.round;
    if (r.phase !== "hand" || r.current !== 0) return [];
    const before = evaluate(r.captured[0]);
    const beforeNear = reachableNearYaku(r.captured[0], r.captured[1]);
    return r.hands[0].filter((id) => {
      const matches = r.field.filter((x) => card(x).month === card(id).month);
      return matches.some((mid) => {
        const next = [...r.captured[0], id, mid];
        const after = evaluate(next);
        return after.raw > before.raw || reachableNearYaku(next, r.captured[1]).length > beforeNear.length;
      });
    });
  }
  function letterForCard(id) {
    const c = card(id);
    return c.name + "\u3002" + c.detail;
  }

  // src/game/match-lessons.mjs
  function createMatchLesson(step, { difficulty = 2, rng = Math.random } = {}) {
    const game = createGame({ length: 3, difficulty, rng: step === 6 ? () => 0.42 : rng });
    game.matchLesson = step;
    if (step === 7) return game;
    const hand = Array.from({ length: 8 }, (_, i) => i + 1 + "-3");
    const field = Array.from({ length: 8 }, (_, i) => i + 1 + "-4");
    const opponent = ["9-1", "9-2", "10-1", "10-2", "1-1", "2-1", "3-1", "4-1"];
    const openingStock = ["11-1", "9-3", "11-4", "9-4", "11-2", "10-3", "11-3", "10-4", "12-2"];
    const used = /* @__PURE__ */ new Set([...hand, ...field, ...opponent, ...openingStock]);
    game.length = 1;
    game.difficulty = 1;
    game.scores = [0, 0];
    game.lessonNotices = ["start"];
    game.round = {
      dealer: 0,
      current: 0,
      phase: "hand",
      hands: [hand, opponent],
      field,
      stock: [...openingStock, ...cardIds.filter((id) => !used.has(id))],
      captured: [[], []],
      lastRaw: [0, 0],
      koiCalls: [0, 0],
      pendingDraw: null,
      pendingHand: null,
      event: null,
      turn: 0,
      result: null,
      log: []
    };
    assertConservation(game.round);
    return game;
  }
  function distance(rule, ids) {
    if (rule.group === "set") return rule.ids.filter((id) => !ids.includes(id)).length;
    if (rule.group === "count") {
      const count = ids.filter((id) => card(id).type === rule.type || rule.type === "\u30AB\u30B9" && id === CUP).length;
      return Math.max(0, rule.requires - count);
    }
    const lights = ids.filter((id) => card(id).type === "\u5149");
    if (rule.group === "lights-rain") return Math.max(0, 3 - lights.filter((id) => id !== RAIN).length) + Number(!lights.includes(RAIN));
    if (rule.group === "lights-norain" && lights.includes(RAIN)) return Infinity;
    return Math.max(0, rule.requires - lights.length);
  }
  function progressByCapture(ids, taken, unavailable) {
    const next = [...ids, ...taken];
    const score = evaluate(next), rawGain = score.raw - evaluate(ids).raw;
    const possible = cardIds.filter((id) => !unavailable.has(id) && !next.includes(id));
    const goals = YAKU_TABLE.filter((rule) => {
      const after = distance(rule, next);
      return after < distance(rule, ids) && after !== Infinity && distance(rule, [...next, ...possible.filter((id) => rule.group !== "lights-norain" || id !== RAIN)]) === 0;
    }).sort((a, b) => distance(a, next) - distance(b, next) || b.base - a.base);
    const goal = goals[0];
    return { goal, score: rawGain * 30 + (goal ? 20 / (1 + distance(goal, next)) : 0) };
  }
  function describe(id) {
    const { name, type } = card(id);
    return name + "\uFF08" + type + "\uFF09";
  }
  function matchLessonHint(g) {
    const r = g.round;
    const [mine, opponent] = r.captured;
    const blocked = /* @__PURE__ */ new Set([...mine, ...r.hands[0]]);
    const opponentScore = evaluate(opponent);
    const threat = cardIds.filter((id) => !blocked.has(id) && !opponent.includes(id)).flatMap((id) => {
      const next = evaluate([...opponent, id]);
      return next.raw > opponentScore.raw ? next.yakus.filter((y) => !opponentScore.yakus.some((old) => old.id === y.id)) : [];
    }).sort((a, b) => b.points - a.points)[0];
    const warning = threat ? " \u76F8\u624B\u306F" + threat.name + "\u307E\u3067\u3042\u30681\u679A\u3002" : "";
    if (r.phase === "decision") {
      const points = settlePoints(evaluate(mine).raw, r.koiCalls, 0).points;
      const turns = r.hands[0].length;
      const advice = threat || opponentScore.raw || turns <= 2 || points >= 7 ? "\u4ECA\u306E\u70B9\u3092\u53D6\u308B\u306A\u3089\u52DD\u8CA0\u304C\u304A\u3059\u3059\u3081\u3002" : "\u307E\u3060\u624B\u6570\u304C\u3042\u308B\u306E\u3067\u3001\u70B9\u3092\u4F38\u3070\u3057\u305F\u3044\u306A\u3089\u3053\u3044\u3053\u3044\u3082\u9078\u3079\u308B\u3088\u3002";
      return "\u52DD\u8CA0\u306A\u3089" + points + "\u70B9\u3002\u6B8B\u308A\u306E\u624B\u756A\u306F\u6700\u5927" + turns + "\u56DE\u3002" + warning + (opponentScore.raw ? " \u76F8\u624B\u306B\u306F\u3059\u3067\u306B\u5F79\u304C\u3042\u308B\u3088\u3002" : !threat ? " \u76F8\u624B\u306E\u53D6\u308A\u672D\u306B\u3042\u30681\u679A\u3067\u5B8C\u6210\u3059\u308B\u5F79\u306F\u306A\u3044\u3088\u3002" : "") + " " + advice;
    }
    const draw = r.phase === "draw-target";
    const moves = draw ? matching(r.field, r.pendingDraw).map((targetId) => ({ cardId: r.pendingDraw, targetId })) : legalHands(r);
    const unavailable = new Set(opponent);
    const captures = moves.flatMap(({ cardId, targetId }) => {
      const matches = matching(r.field, cardId);
      if (!matches.length) return [];
      const targets = matches.length === 3 ? matches : [targetId];
      return [{ cardId, targets, ...progressByCapture(mine, [cardId, ...targets], unavailable) }];
    }).sort((a, b) => b.score - a.score);
    if (captures.length) {
      const { cardId, targets, goal } = captures[0];
      const reason = goal ? "\u3002" + goal.name + "\u306B\u8FD1\u3065\u304F\u3088\u3002" : "\u3092\u53D6\u308C\u308B\u3088\u3002";
      return (draw ? "\u5C71\u672D\u306E" + describe(cardId) + "\u306F\u3001" : describe(cardId) + "\u3092\u51FA\u3057\u3066\u3001") + targets.map(describe).join("\u30FB") + (goal ? "\u3092\u53D6\u308D\u3046" : "") + reason + warning;
    }
    const discards = r.hands[0].map((id) => ({
      id,
      score: progressByCapture(mine, [id], unavailable).score + opponent.filter((taken) => card(taken).month === card(id).month).length * 3
    })).sort((a, b) => a.score - b.score);
    return "\u540C\u3058\u6708\u306E\u5834\u672D\u304C\u306A\u3044\u306D\u3002\u5F79\u3078\u306E\u5F71\u97FF\u304C\u5C11\u306A\u304F\u3001\u76F8\u624B\u306E\u53D6\u308A\u672D\u306B\u3082\u5C11\u306A\u3044\u6708\u3092\u76EE\u5B89\u306B\u3001" + describe(discards[0].id) + "\u3092\u5834\u306B\u51FA\u305D\u3046\u3002" + warning;
  }

  // src/game/tutorial-script.mjs
  var TEACHING_CAPTURE_ORDER = Object.freeze(["2-1", "4-1", "5-1", "6-1", "7-1"]);
  var TEACHING_PLAYER_HAND = Object.freeze([...TEACHING_CAPTURE_ORDER, "1-3", "3-3", "8-3"]);
  var TEACHING_FIELD = Object.freeze(["2-3", "4-3", "5-3", "6-3", "7-3", "1-4", "3-4", "8-4"]);
  var TEACHING_OPPONENT_HAND = Object.freeze(["9-3", "9-4", "9-2", "10-3", "10-4", "11-3", "11-4", "12-3"]);
  var SAFE_STOCK = ["1-2", "3-2", "10-2", "11-2", "12-4", "1-1", "3-1", "8-1", "11-1", "12-1"];
  function createTeachingGame() {
    const game = createGame({ mode: "free", length: 3, month: 1, beginner: true, difficulty: 1, rng: () => 0.42 });
    const chosen = [...TEACHING_PLAYER_HAND, ...TEACHING_OPPONENT_HAND, ...TEACHING_FIELD];
    const rest = cardIds.filter((id) => !chosen.includes(id));
    const stock = [...SAFE_STOCK, ...rest.filter((id) => !SAFE_STOCK.includes(id))];
    if ((/* @__PURE__ */ new Set([...chosen, ...stock])).size !== 48 || stock.length !== 24) throw Error("Invalid teaching script deck");
    if (initialHandBonus(TEACHING_PLAYER_HAND) || initialHandBonus(TEACHING_OPPONENT_HAND)) throw Error("Unexpected initial bonus");
    game.round = {
      dealer: 0,
      current: 0,
      phase: "hand",
      hands: [[...TEACHING_PLAYER_HAND], [...TEACHING_OPPONENT_HAND]],
      field: [...TEACHING_FIELD],
      stock,
      captured: [[], []],
      lastRaw: [0, 0],
      koiCalls: [0, 0],
      pendingDraw: null,
      pendingHand: null,
      event: null,
      turn: 0,
      result: null,
      log: []
    };
    game.length = 1;
    game.tutorial = true;
    game.tutorialStandalone = true;
    game.tutorialIntroDone = false;
    game.tutorialIntroStep = 0;
    game.tutorialIntroVersion = 9;
    game.tutorialMonthAnswers = [];
    game.tutorialRoleStep = 0;
    game.tutorialHint = "";
    game.tutorialCaptureIndex = 0;
    game.tutorialLabelsOff = false;
    game.tutorialCaptureShown = false;
    assertConservation(game.round);
    return game;
  }
  var PRACTICE_SCENES = [
    {
      hand: ["1-3", "2-3", "3-3", "4-3", "5-3"],
      field: ["1-4", "2-4", "3-4", "4-4", "5-4"],
      opponent: ["9-3", "9-4", "10-3", "10-4", "11-4"],
      stock: ["6-1", "7-1", "8-2", "12-1", "6-2", "7-2", "11-1", "12-2", "10-2"]
    },
    {
      hand: ["2-1", "4-1", "5-1", "6-1", "7-1"],
      field: ["2-3", "4-3", "5-3", "6-3", "7-3"],
      opponent: ["9-3", "9-4", "10-3", "10-4", "11-4"],
      stock: ["1-3", "3-3", "8-3", "12-3", "1-2", "3-2", "11-1", "12-4", "10-2"]
    },
    {
      hand: ["1-2", "2-2", "4-2", "5-2", "7-2"],
      field: ["1-3", "2-3", "4-3", "5-3", "7-3"],
      opponent: ["9-3", "9-4", "10-3", "10-4", "11-4"],
      stock: ["3-3", "6-3", "8-3", "12-3", "3-1", "6-1", "11-1", "12-4", "10-2"]
    },
    {
      hand: ["1-1", "3-1", "8-1", "12-1"],
      field: ["1-3", "3-3", "8-3", "5-3"],
      opponent: ["9-3", "9-4", "11-4", "10-4"],
      // The opponent reveals a matching paulownia card after the three-light decision.
      stock: ["2-3", "4-3", "6-3", "7-3", "10-3", "12-2", "10-2"]
    }
  ];
  function createPracticeGame(step, standalone) {
    const scene = PRACTICE_SCENES[step - 3];
    const game = createGame({ mode: "free", length: 3, month: 1, beginner: true, difficulty: 1, rng: () => 0.42 });
    const used = /* @__PURE__ */ new Set([...scene.hand, ...scene.opponent, ...scene.field, ...scene.stock]);
    game.round = {
      dealer: 0,
      current: 0,
      phase: "hand",
      hands: [[...scene.hand], [...scene.opponent]],
      field: [...scene.field],
      stock: [...scene.stock, ...cardIds.filter((id) => !used.has(id))],
      captured: [[], []],
      lastRaw: [0, 0],
      koiCalls: [0, 0],
      pendingDraw: null,
      pendingHand: null,
      event: null,
      turn: 0,
      result: null,
      log: []
    };
    Object.assign(game, {
      length: 1,
      tutorial: true,
      tutorialIntroDone: true,
      tutorialStep: step,
      tutorialSingleStep: standalone,
      tutorialRoleStep: 0,
      tutorialHint: ""
    });
    assertConservation(game.round);
    return game;
  }
  function createTutorialMonthQuestions(rng = Math.random) {
    const months = MONTHS.map(({ month }) => month);
    return shuffle(months, rng).slice(0, 3).map((month) => {
      const cards = DECK.filter((card2) => card2.month === month);
      const id = cards[Math.floor(rng() * cards.length)].id;
      const distractors = shuffle(months.filter((other) => other !== month), rng).slice(0, 2);
      return { id, month, choices: shuffle([month, ...distractors], rng) };
    });
  }

  // src/main.mjs
  validateConfig(app_config_default);
  var $ = (id) => document.getElementById(id);
  var KEY = app_config_default.storageNamespace + ".hanafuda.v1";
  var initial = () => ({
    version: 1,
    travelUnlocked: 1,
    travelCleared: 0,
    seen: [],
    quiz: { correct: 0, total: 0 },
    stats: { wins: 0, losses: 0, draws: 0 },
    settings: { beginner: true, narration: "full", difficulty: 2, sound: true },
    tutorialCompleted: false,
    active: null
  });
  function validate(v) {
    const wallet = v?.wallet;
    if (wallet !== void 0 && (!wallet || !Number.isSafeInteger(wallet.coins) || wallet.coins < 0 || !(wallet.lastFreeRefill === null || /^\d{4}-\d{2}-\d{2}$/.test(wallet.lastFreeRefill)))) throw new Error("\u30B3\u30A4\u30F3\u306E\u4FDD\u5B58\u30C7\u30FC\u30BF\u304C\u4E0D\u6B63\u3067\u3059\u3002");
    if (!v || v.version !== 1 || !Number.isInteger(v.travelUnlocked) || v.travelUnlocked < 1 || v.travelUnlocked > 12 || !Number.isInteger(v.travelCleared) || v.travelCleared < 0 || v.travelCleared > 12 || !Array.isArray(v.seen) || !v.quiz || !v.stats || !v.settings || !["full", "brief", "none"].includes(v.settings.narration) || typeof v.settings.beginner !== "boolean" || v.settings.sound !== void 0 && typeof v.settings.sound !== "boolean" || v.tutorialCompleted !== void 0 && typeof v.tutorialCompleted !== "boolean" || !v.active && v.active !== null) throw new Error("\u4FDD\u5B58\u30C7\u30FC\u30BF\u304C\u4E0D\u6B63\u3067\u3059\u3002\u4E0A\u66F8\u304D\u305B\u305A\u306B\u505C\u6B62\u3057\u307E\u3057\u305F\u3002");
  }
  var store2 = createJsonStore({ store: window.localStorage, key: KEY, createInitial: initial, validate });
  var serviceWorkerUpdatePending = false;
  var serviceWorkerReloadStarted = false;
  var state = store2.read();
  var screen = "home";
  var selectedHand = null;
  var selectedCard = null;
  var TUTORIAL_INTRO_VERSION = 10;
  var TUTORIAL_QUIZ_PHASE = 5;
  if (state.tutorialIntroCompleted === void 0 && (state.tutorialQuizCompleted ?? (state.tutorialCompleted || state.active?.tutorialIntroVersion !== TUTORIAL_INTRO_VERSION && (state.active?.tutorialMonthAnswers?.length ?? 0) >= 2))) {
    state.tutorialIntroCompleted = true;
    store2.write(state);
  }
  if (state.active?.tutorial && !state.active.tutorialIntroDone && state.active.tutorialIntroVersion !== TUTORIAL_INTRO_VERSION) {
    state.active.tutorialIntroStep = 0;
    state.active.tutorialIntroVersion = TUTORIAL_INTRO_VERSION;
    store2.write(state);
  }
  if (state.active?.tutorial && state.active.tutorialStep === 6 && state.active.finished && state.active.round.result?.winner === 0 && !state.completedPracticeSteps?.includes(6)) {
    recordPracticeStep(6);
    store2.write(state);
  }
  var quiz = null;
  var quizSession = null;
  var settingsReturn = "home";
  var tutorialReturn = "home";
  var freeDifficulty = 2;
  var notice = "";
  var adsStatus = "\u30D6\u30E9\u30A6\u30B6\u3067\u306F\u5E83\u544A\u3092\u8868\u793A\u3057\u307E\u305B\u3093";
  var studyMonth = 1;
  var selectedYakuIndex = 0;
  var gameDialog = null;
  var gameDialogReturn = null;
  var pendingStart = null;
  var turnPresentation = null;
  var bettingRate = 0;
  var matchLength = 3;
  var ports = createNativePorts();
  var layout = createDeviceLayout({ root: document.documentElement, native: ports.native });
  var purchaseStatus = "App Store\u3092\u78BA\u8A8D\u4E2D";
  var ads = createMonetization({ config: app_config_default, localStorage: window.localStorage, ports, onStatus: (k, v) => {
    if (k === "ads") adsStatus = v;
    if (k === "banner") {
      layout.setBannerHeight(Math.ceil(v));
      layout.setBannerVisible(v > 0);
    }
    if (k === "purchase") {
      purchaseStatus = v;
      const dialog = document.querySelector(".ad-removal-dialog");
      if (dialog) {
        dialog.querySelector('[role="status"]').textContent = v;
        if (ads.status().owned) dialog.querySelector('[data-action="buy-remove-ads"]').disabled = true;
      }
    }
  } });
  function isPractice(game) {
    return Boolean(game?.tutorial || game?.matchLesson);
  }
  function savedMatch() {
    return state.savedMatch ?? (isPractice(state.active) ? null : state.active);
  }
  function canResumeGame(game) {
    return Boolean(game && (!game.finished || game.pendingYakuCelebration || game.pendingTurnPresentation) && game.mode !== "travel");
  }
  function setPracticeGame(game) {
    if (state.active && !isPractice(state.active)) state.savedMatch = state.active;
    state.active = game;
  }
  function restoreSavedMatch() {
    state.active = state.savedMatch ?? null;
    delete state.savedMatch;
  }
  function finishPractice() {
    restoreSavedMatch();
    screen = "tutorial";
    save();
  }
  function save() {
    store2.write(state);
  }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function n(v) {
    return Number(v).toLocaleString("ja-JP");
  }
  function photo(id) {
    return card(id).asset;
  }
  function tile(id, opts = {}) {
    const c = card(id), act = opts.action || "inspect", cls = ["hana", opts.className || ""].filter(Boolean).join(" ");
    const button = '<button type="button" class="' + cls + '" data-action="' + act + '" data-id="' + esc(id) + '" aria-label="' + esc(c.name) + '"><img src="' + photo(id) + '" alt="' + esc(c.name) + '" draggable="false"></button>';
    if (!opts.label) return button;
    return '<div class="card-slot">' + button + '<div class="card-name" aria-hidden="true"><strong>' + c.month + "\u6708 " + esc(c.flower) + "</strong><span>" + esc(c.subject) + "\u30FB" + esc(c.type) + "</span></div></div>";
  }
  var TAKEN_FAMILIES = Object.freeze(["\u5149", "\u30BF\u30CD", "\u77ED\u518A", "\u30AB\u30B9"]);
  function boardTakenPanel(ids, allowDetails, who = 0, incoming = []) {
    const label = who === 1 ? "\u76F8\u624B\u306E\u53D6\u308A\u672D" : "\u3042\u306A\u305F\u306E\u53D6\u308A\u672D";
    return '<section class="board-taken" aria-label="' + label + '"><div class="board-side-heading"><strong>' + label + "</strong><span>" + ids.length + '\u679A</span></div><div class="board-taken-grid" aria-label="' + label + '\u3002\u4E0A\u4E0B\u306B\u30B9\u30AF\u30ED\u30FC\u30EB\u3057\u3066\u5168\u3066\u78BA\u8A8D\u3067\u304D\u307E\u3059">' + (ids.length || incoming.length ? [...ids, ...incoming].map((id) => '<button type="button" class="board-taken-card' + (incoming.includes(id) ? " incoming-card" : "") + '" data-action="inspect" data-id="' + esc(id) + '" aria-label="' + esc(card(id).name) + '"><img src="' + photo(id) + '" alt="' + esc(card(id).name) + '"></button>').join("") : '<span class="board-side-empty">\u53D6\u3063\u305F\u672D\u306F\u3053\u3053\u306B\u4E26\u3073\u307E\u3059</span>') + '</div><button type="button" class="taken-browse-button" data-action="show-taken" data-who="' + who + '">\u5168\u672D\u3092\u898B\u308B \u203A</button></section>';
  }
  function yakuCardIdsForDisplay(y, ids) {
    const rule = YAKU_TABLE.find((item) => item.id === y.id);
    if (!rule) throw new Error("Missing yaku definition: " + y.id);
    if (rule.ids) return rule.ids.filter((id) => ids.includes(id));
    if (rule.group === "count") return ids.filter((id) => card(id).type === rule.type || rule.type === "\u30AB\u30B9" && id === CUP);
    if (rule.group.startsWith("lights")) return LIGHTS.filter((id) => ids.includes(id));
    return [];
  }
  function boardYakuPanel(ids, koiCalls, label = "\u3042\u306A\u305F\u306E\u3067\u304D\u3066\u3044\u308B\u5F79") {
    const current = evaluate(ids);
    const complete = current.raw > 0 ? completedYakuSummary(ids, koiCalls) : null;
    const completed = (complete?.yakus || []).map((y) => ({ name: y.name, points: y.points, cards: y.cards, near: false }));
    const developing = current.near.map((y) => ({ name: y.name, points: 0, cards: yakuCardIdsForDisplay(y, ids), near: true }));
    const items = [...completed, ...developing];
    const scoreLabel = current.raw > 0 ? current.raw + "\u70B9" : developing.length ? "\u3042\u30681\u679A" : "\u2014";
    return '<section class="board-yaku" aria-label="' + label + '"><div class="board-side-heading"><strong>' + label + "</strong><span>" + scoreLabel + "</span></div>" + (items.length ? '<div class="board-yaku-list">' + items.map((y) => '<div class="board-yaku-item' + (y.near ? " is-near" : "") + '"><strong>' + esc(y.name) + " <small>" + (y.near ? "\u3042\u30681\u679A" : y.points + "\u70B9") + '</small></strong><div class="board-yaku-cards">' + y.cards.map((id) => '<img src="' + photo(id) + '" alt="' + esc(card(id).name) + '">').join("") + "</div></div>").join("") + "</div>" : '<p class="board-side-empty">\u307E\u3060\u5F79\u306F\u3042\u308A\u307E\u305B\u3093</p>') + (complete?.multiplier > 1 ? '<small class="board-yaku-multiplier">\u5408\u8A08 ' + complete.points + "\u70B9\uFF08" + complete.multiplier + "\u500D\uFF09</small>" : "") + "</section>";
  }
  function takenDetails(ids) {
    const score = evaluate(ids);
    return '<p class="taken-detail-intro">\u53D6\u3063\u305F\u672D\u3092\u7A2E\u985E\u3054\u3068\u306B\u8868\u793A\u3057\u3066\u3044\u307E\u3059\u3002\u672D\u3092\u30BF\u30C3\u30D7\u3059\u308B\u3068\u540D\u524D\u3068\u8AAC\u660E\u3092\u898B\u3089\u308C\u307E\u3059\u3002</p><div class="taken-detail-status">' + ids.length + "\u679A\u306E\u53D6\u308A\u672D \xB7 \u73FE\u5728 " + score.raw + "\u70B9" + (score.yakus.length ? "<span>\u6210\u7ACB\u3057\u305F\u5F79\uFF1A" + score.yakus.map((y) => esc(y.name) + " " + y.points + "\u70B9").join("\u30FB") + "</span>" : "<span>\u307E\u3060\u5F79\u306F\u5B8C\u6210\u3057\u3066\u3044\u307E\u305B\u3093</span>") + '</div><div class="taken-groups">' + TAKEN_FAMILIES.map((type) => {
      const subset = ids.filter((id) => card(id).type === type);
      const threshold = type === "\u30BF\u30CD" || type === "\u77ED\u518A" ? 5 : type === "\u30AB\u30B9" ? 10 : 3;
      return '<section class="taken-group" aria-label="' + esc(type) + "\u672D " + subset.length + '\u679A"><header><strong>' + esc(type) + "\u672D</strong><span>" + subset.length + "\u679A" + (type === "\u5149" ? "" : " / " + threshold + "\u679A\u3067\u5F79") + '</span></header><div class="taken-group-cards">' + (subset.length ? subset.map((id) => '<button class="taken-card" type="button" data-action="inspect" data-id="' + esc(id) + '" aria-label="' + esc(card(id).name) + '"><img src="' + photo(id) + '" alt="' + esc(card(id).name) + '"></button>').join("") : '<span class="taken-not-yet">\u307E\u3060\u306A\u3057</span>') + "</div></section>";
    }).join("") + "</div>" + (ids.includes(CUP) ? '<p class="taken-cup-note">\u203B \u83CA\u306E\u76C3\u306F\u30BF\u30CD\u672D\u3067\u3059\u304C\u3001\u30AB\u30B9\u306E\u5F79\u306B\u3082\u6570\u3048\u307E\u3059\u3002</p>' : "");
  }
  function backButton(action, label = "\u623B\u308B", extra = "") {
    return '<button type="button" class="back-control ' + extra + '" data-action="' + action + '">' + label + "</button>";
  }
  function shell(content) {
    const gaming = screen === "game";
    const intro = gaming && state.active?.tutorial && !state.active.tutorialIntroDone;
    const destination = {
      free: "home",
      learn: "home",
      cards: "learn",
      yaku: "learn",
      columns: "learn",
      quiz: "learn",
      settings: "settings-back",
      credits: "settings",
      tutorial: "tutorial-back"
    }[screen];
    return '<div class="shell scene-' + screen + (["cards", "yaku", "quiz", "columns", "free"].includes(screen) ? " tutorial-aligned" : "") + '"><main class="page"><header class="topbar"><button type="button" class="brand brand-home" data-action="home" aria-label="Home"><span class="seal">\u82B1</span><span class="brand-name">\u306F\u3058\u3081\u3066\u306E\u82B1\u672D \u3053\u3044\u3053\u3044</span></button><div class="row">' + (gaming ? backButton(intro ? "tutorial-menu" : "home", intro ? "\u623B\u308B" : "\u4E2D\u65AD\u30FB\u4FDD\u5B58") : (screen === "settings" || screen === "credits" ? "" : '<button class="quiet" data-action="settings">\u8A2D\u5B9A</button>') + (destination ? backButton(destination) : "")) + '</div></header><section class="scene-body">' + content + "</section>" + (gaming ? "" : '<nav class="scene-nav" aria-label="\u753B\u9762\u306E\u79FB\u52D5"><button data-action="home" aria-label="\u30DB\u30FC\u30E0">\u2302<span>\u30DB\u30FC\u30E0</span></button><button data-action="start-tutorial" aria-label="\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB">\u2726<span>\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB</span></button><button data-action="learn" aria-label="\u56F3\u9451\u30FB\u30AF\u30A4\u30BA">\u25A3<span>\u56F3\u9451</span></button></nav>') + "</main></div>";
  }
  function headline(title, subtitle) {
    return '<div class="row"><div><div class="kicker">' + esc(subtitle) + '</div><h1 class="chapter-title">' + esc(title) + "</h1></div></div>";
  }
  function home() {
    const canResume = canResumeGame(savedMatch()) || canResumeGame(state.active);
    return shell('<div class="hub home-redesign"><button type="button" class="engawa-heading engawa-title-art" data-action="swing-title" aria-label="\u306F\u3058\u3081\u3066\u306E\u82B1\u672D \u3053\u3044\u3053\u3044"></button>' + (canResume ? '<button class="home-resume" type="button" data-action="resume">\u7D9A\u304D\u304B\u3089\u518D\u958B</button>' : "") + '<button class="home-object engawa-board home-tutorial" type="button" data-action="start-tutorial"><span class="engawa-main">\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB</span></button><button class="home-object engawa-board engawa-small home-dictionary" type="button" data-action="learn"><span class="engawa-label">\u56F3\u9451\u30FB\u30AF\u30A4\u30BA</span></button><button class="home-object engawa-board engawa-small home-free" type="button" data-action="free"><span class="engawa-label"><img class="engawa-match-label" src="assets/engawa-home/match-label.png" alt="\u5BFE\u5C40"></span></button><button class="home-object engawa-board home-settings" type="button" data-action="settings" aria-label="\u8A2D\u5B9A"><span class="engawa-label">\u2699 \u8A2D\u5B9A</span></button></div>');
  }
  function phrases(parts) {
    return parts.map((part) => '<span class="phrase">' + esc(part) + "</span>").join("");
  }
  function swingTitle(button) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tilt = getComputedStyle(button).transform;
    button.getAnimations().forEach((animation) => animation.cancel());
    button.animate([
      { transform: tilt },
      { transform: "rotate(3deg)", offset: 0.24 },
      { transform: "rotate(-2deg)", offset: 0.57 },
      { transform: "rotate(.8deg)", offset: 0.8 },
      { transform: "rotate(0deg)" }
    ], { duration: 1300, easing: "ease-in-out" });
  }
  function learn() {
    return shell('<div class="study-hub"><div class="study-heading"><h1>\u56F3\u9451\u30FB\u30AF\u30A4\u30BA</h1></div><button class="study-main" data-action="start-tutorial"><strong>' + phrases(["\u3053\u3044\u3053\u3044\u306E", "\u57FA\u672C\u3092\u5B66\u3076"]) + "</strong><small>" + phrases(["\u904A\u3073\u306E\u76EE\u7684\u304B\u3089\u3001", "\u5148\u751F\u3068\u306E\u7DF4\u7FD2\u307E\u3067"]) + '</small></button><div class="study-actions"><button data-action="cards"><strong>\u2740 \u672D\u3092\u304A\u307C\u3048\u308B</strong><span>' + phrases(["\u6708\u30FB\u82B1\u30FB\u7A2E\u985E\u3092", "1\u304B\u6708\u305A\u3064"]) + '</span><img src="' + photo("1-1") + '" alt="" aria-hidden="true"></button><button data-action="yaku"><strong>\u273F \u5F79\u3092\u304A\u307C\u3048\u308B</strong><span>' + phrases(["\u305D\u308D\u3048\u308B\u672D\u3068", "\u70B9\u6570\u3092\u898B\u308B"]) + '</span><img src="' + photo("8-1") + '" alt="" aria-hidden="true"></button><button data-action="quiz"><strong>\u25C7 \u30AF\u30A4\u30BA\u3067\u305F\u3081\u3059</strong><img src="' + photo("9-1") + '" alt="" aria-hidden="true"></button><button data-action="columns"><strong>\u263E \u82B1\u306E\u3082\u306E\u304C\u305F\u308A</strong><span>' + phrases(["12\u304B\u6708\u306E", "\u82B1\u3068\u7531\u6765"]) + '</span><img src="' + photo("11-1") + '" alt="" aria-hidden="true"></button></div></div>');
  }
  function inlineTeacher(description, { className = "", title = "", note = "", action = "", status = false } = {}) {
    return '<aside class="teacher-bubble inline-teacher ' + className + '" aria-label="\u5148\u751F\u306E\u6848\u5185">' + teacherAvatar() + '<div class="teacher-speech"' + (status ? ' role="status"' : "") + ">" + (note ? "<small>" + esc(note) + "</small>" : "") + (title ? "<h3>" + esc(title) + "</h3>" : "") + "<p>" + (Array.isArray(description) ? phrases(description) : esc(description)) + "</p></div>" + action + "</aside>";
  }
  function optionChip(action, value, label, selected, disabled = false) {
    return '<button type="button" class="chip' + (selected ? " active" : "") + '" data-action="' + action + '" data-value="' + value + '" aria-pressed="' + selected + '"' + (disabled ? " disabled" : "") + ">" + label + "</button>";
  }
  function matchChoices(label, action, options, selected, locked = false) {
    return '<div class="match-choices" role="group" aria-label="' + label + (locked ? "\uFF08\u30EC\u30FC\u30C8\u9023\u52D5\uFF09" : "") + '"><h2>' + label + (locked ? " <small>\u9023\u52D5</small>" : "") + "</h2><div>" + options.map(([value, text]) => optionChip(action, value, text, value === selected, locked)).join("") + "</div></div>";
  }
  function matchOpponent() {
    return OPPONENTS[(BETTING_DIFFICULTY.get(bettingRate) ?? freeDifficulty) - 1];
  }
  var lastOpponentLines = /* @__PURE__ */ new Map();
  function nextOpponentLine(opponent) {
    const choices = opponent.lines.filter((line2) => line2 !== lastOpponentLines.get(opponent.id));
    const line = choices[Math.floor(Math.random() * choices.length)];
    lastOpponentLines.set(opponent.id, line);
    return line;
  }
  function free() {
    const betting = bettingRate !== 0;
    const { coins } = state.wallet ?? createWallet();
    const opponent = matchOpponent();
    const line = lastOpponentLines.get(opponent.id) || nextOpponentLine(opponent);
    return shell('<div class="match-menu feedback-match" aria-label="\u5BFE\u5C40\u306E\u652F\u5EA6"><div class="match-controls"><div class="betting-rates">' + matchChoices("\u30EC\u30FC\u30C8\uFF081\u70B9\u3042\u305F\u308A\uFF09", "betting-rate", [[0, "\u8CED\u3051\u306A\u3057"], ...[...BETTING_RATES].map(([rate, label]) => [rate, label + "\uFF08" + rate + "\uFF09"])], bettingRate) + "</div>" + matchChoices(
      "\u76F8\u624B\u306E\u5F37\u3055",
      "difficulty",
      OPPONENTS.map((character, index) => [index + 1, character.label]),
      OPPONENTS.indexOf(opponent) + 1,
      betting
    ) + matchChoices("\u5BFE\u5C40\u306E\u9577\u3055", "match-length", [[3, "3\u304B\u6708"], [6, "6\u304B\u6708"], [12, "12\u304B\u6708"]], matchLength) + matchChoices("\u521D\u5FC3\u8005\u30E2\u30FC\u30C9", "beginner", [[true, "\u30AA\u30F3"], [false, "\u30AA\u30D5"]], state.settings.beginner) + matchChoices("\u5148\u751F\u306E\u89E3\u8AAC", "narration", [["full", "\u304F\u308F\u3057\u304F"], ["brief", "\u77ED\u304F"], ["none", "\u306A\u3057"]], state.settings.narration) + '<button class="match-start" data-action="start-free">\u5BFE\u5C40\u3092\u59CB\u3081\u308B</button></div><div class="match-companion"><div class="match-wallet-slot"><div class="betting-options betting-wallet"><span class="coin-medallion" aria-hidden="true"></span><strong aria-label="\u6240\u6301\u30B3\u30A4\u30F3 ' + n(coins) + '">' + n(coins) + ' <small>\u30B3\u30A4\u30F3</small></strong><button data-action="coin-refill">\u30B3\u30A4\u30F3\u3092\u3082\u3089\u3046</button></div></div><div class="opponent-stage"><button type="button" class="match-portrait" data-action="opponent-line" aria-label="\u76F8\u624B\uFF08' + opponent.label + '\uFF09\u306E\u30BB\u30EA\u30D5" aria-controls="opponent-line"><img class="match-character" src="' + opponent.figure + '" alt=""></button><button type="button" class="teacher-bubble inline-teacher opponent-line" data-action="opponent-line" aria-label="\u76F8\u624B\u306E\u30BB\u30EA\u30D5\u3092\u5207\u308A\u66FF\u3048\u308B"><span class="teacher-speech" role="status" id="opponent-line">' + phrases(line) + "</span></button></div></div>" + inlineTeacher(betting ? ["\u5BFE\u5C40\u7D42\u4E86\u6642\u306B", "\u30EC\u30FC\u30C8\u306B\u5FDC\u3058\u3066", "\u5408\u8A08\u70B9\u306E\u5DEE\u3092", "\u7CBE\u7B97\u3057\u307E\u3059\u3002"] : ["\u5F37\u3055\u3092\u9078\u3093\u3067\u3001", "\u3053\u3044\u3053\u3044\u3092", "\u697D\u3057\u3082\u3046\u3002"]) + "</div>");
  }
  function openCoinRefill(invoker) {
    state.wallet ??= createWallet();
    const dialog = document.createElement("dialog");
    dialog.className = "coin-refill-dialog";
    dialog.setAttribute("aria-labelledby", "coin-refill-title");
    showCoinChoices(dialog);
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      dialog.remove();
      (invoker.isConnected ? invoker : $("app").querySelector('[data-action="coin-refill"]'))?.focus();
    }, { once: true });
    dialog.showModal();
  }
  function showCoinChoices(dialog) {
    const freeAvailable = canRefillForFree(state.wallet);
    dialog.innerHTML = '<h2 id="coin-refill-title">\u30B3\u30A4\u30F3\u3092\u3082\u3089\u3046</h2><p>\u6240\u6301\u30B3\u30A4\u30F3 <strong>' + n(state.wallet.coins) + " \u30B3\u30A4\u30F3</strong></p>" + (state.wallet.coins < MIN_COINS ? "<p>\u30EC\u30FC\u30C8\u3092\u4F7F\u3046\u5BFE\u5C40\u306B\u306F100\u30B3\u30A4\u30F3\u4EE5\u4E0A\u5FC5\u8981\u3067\u3059\u3002\u8CED\u3051\u306A\u3057\u306A\u3089\u3001\u30B3\u30A4\u30F3\u306A\u3057\u3067\u904A\u3079\u307E\u3059\u3002</p>" : "") + '<button class="primary" data-action="coin-free-claim" ' + (freeAvailable ? "" : "disabled") + ">\u7121\u6599\u3067\u3082\u3089\u3046\uFF081\u65E51\u56DE\uFF09 \uFF0B" + n(FREE_COINS) + " \u30B3\u30A4\u30F3</button>" + (!freeAvailable ? "<small>\u672C\u65E5\u306E\u7121\u6599\u5206\u306F\u53D7\u3051\u53D6\u308A\u6E08\u307F\u3067\u3059</small>" : "") + '<button class="secondary" data-action="coin-ad">\u5E83\u544A\u3067\u3082\u3089\u3046 \uFF0B' + n(AD_COINS) + ' \u30B3\u30A4\u30F3</button><button class="back-control" data-action="coin-close">\u623B\u308B</button>';
  }
  function showRefillAdPreview(dialog) {
    dialog.innerHTML = '<h2 id="coin-refill-title">\u5E83\u544A\u3067\u3082\u3089\u3046</h2><p>\u30A2\u30D7\u30EA\u7248\u3067\u306F\u3053\u3053\u306B\u5E83\u544A\u304C\u8868\u793A\u3055\u308C\u307E\u3059\u3002\u5B8C\u4E86\u3092\u62BC\u3059\u3068' + n(AD_COINS) + '\u30B3\u30A4\u30F3\u53D7\u3051\u53D6\u308C\u307E\u3059\u3002</p><button class="primary" data-action="coin-ad-claim">\u5B8C\u4E86</button><button class="back-control" data-action="coin-ad-back">\u623B\u308B</button>';
    dialog.querySelector('[data-action="coin-ad-claim"]').focus();
  }
  function openCardZoom(id, invoker) {
    const c = card(id), dialog = document.createElement("dialog");
    dialog.className = "card-zoom";
    dialog.setAttribute("aria-label", c.name);
    dialog.innerHTML = '<img src="' + photo(id) + '" alt="' + esc(c.name) + '">' + inlineTeacher(letterForCard(id), { title: c.name }) + '<form method="dialog"><button class="back-control">\u623B\u308B</button></form>';
    dialog.addEventListener("close", () => {
      dialog.remove();
      invoker?.focus();
    }, { once: true });
    document.body.append(dialog);
    dialog.showModal();
  }
  function monthNavigation(label) {
    return '<nav class="reference-top" aria-label="\u6708\u306E\u79FB\u52D5"><button data-action="study-prev">\u2039 \u524D\u306E\u6708</button><strong>' + studyMonth + "\u6708 \xB7 " + esc(label) + '</strong><button data-action="study-next">\u6B21\u306E\u6708 \u203A</button></nav>';
  }
  function monthTabs() {
    return '<nav class="month-tabs" aria-label="\u6708\u3092\u9078\u3076">' + MONTHS.map((_, i) => '<button type="button" data-action="study-month" data-value="' + (i + 1) + '" aria-pressed="' + (studyMonth === i + 1) + '">' + (i + 1) + "\u6708</button>").join("") + "</nav>";
  }
  function cardCollection() {
    const m = MONTHS[studyMonth - 1], cards = DECK.filter((c) => c.month === studyMonth);
    const detail = selectedCard && card(selectedCard).month === studyMonth ? card(selectedCard) : null;
    return shell('<div class="reference-page card-book">' + headline("\u672D\u3092\u304A\u307C\u3048\u308B", "48\u679A\u3092\u6708\u3054\u3068\u306B") + monthNavigation(m.flower) + '<div class="open-book"><div class="reference-cards">' + cards.map((c) => '<div class="catalogitem">' + tile(c.id, { className: detail?.id === c.id ? "is-inspected" : "" }) + "</div>").join("") + "</div></div>" + monthTabs() + inlineTeacher(detail ? letterForCard(detail.id) : "\u540C\u3058\u6708\u306E\u672D\u306F\u3001\u7D75\u67C4\u304C\u9055\u3063\u3066\u3082\u4E00\u7DD2\u306B\u53D6\u308C\u307E\u3059\u3002", {
      className: "reference-note",
      title: detail ? detail.name : m.flower + "\u306E4\u679A",
      note: detail ? "" : "\u672D\u3092\u30BF\u30C3\u30D7\u3059\u308B\u3068\u89E3\u8AAC\u304C\u8868\u793A\u3055\u308C\u307E\u3059",
      status: true
    }) + '<div class="reference-page-count">' + studyMonth + " / 12\u304B\u6708</div></div>");
  }
  function yakuExample(y) {
    let ids = y.ids || [];
    if (y.group === "lights" || y.group === "lights-norain" || y.group === "lights-rain") ids = y.id === "ame-shiko" ? ["1-1", "3-1", "8-1", "11-1"] : LIGHTS.filter((id) => y.id === "goko" || id !== "11-1").slice(0, y.requires);
    if (y.group === "count") ids = DECK.filter((c) => c.type === y.type).slice(0, y.requires).map((c) => c.id);
    return ids;
  }
  function yakuScrollEntry(y, index) {
    const examples = yakuExample(y);
    const description = y.group === "count" ? y.type + "\u306E\u672D\u3092" + y.requires + "\u679A\u96C6\u3081\u308B\u3068\u6210\u7ACB\u3002\u4EE5\u5F8C1\u679A\u3054\u3068\u306B1\u70B9\u8FFD\u52A0\u3002" : y.bonus ? "\u6307\u5B9A\u3055\u308C\u305F\u672D\u3092\u305D\u308D\u3048\u308B\u3068\u6210\u7ACB\u3002\u3055\u3089\u306B\u96C6\u3081\u305F\u672D\u3067\u5F97\u70B9\u304C\u5897\u3048\u307E\u3059\u3002" : "\u3053\u306E\u7D75\u67C4\u306E\u7D44\u307F\u5408\u308F\u305B\u3092\u305D\u308D\u3048\u308B\u3068\u6210\u7ACB\u3057\u307E\u3059\u3002";
    return '<article class="yaku-entry"' + (index === selectedYakuIndex ? ' aria-current="true"' : "") + "><h2>" + esc(y.name) + " <span>" + y.base + '\u70B9</span></h2><div class="reference-yaku">' + examples.map((id) => tile(id, { action: "zoom-yaku-card" })).join("") + "</div><p>" + esc(description) + "</p></article>";
  }
  function yakuGuide() {
    const y = YAKU_TABLE[selectedYakuIndex];
    return shell('<div class="reference-page yaku-collection">' + headline("\u5F79\u3092\u304A\u307C\u3048\u308B", "\u3053\u3044\u3053\u3044\u306E\u5F79\u56F3\u9451") + '<nav class="reference-top" aria-label="\u5F79\u306E\u79FB\u52D5"><button data-action="yaku-prev">\u2039 \u524D\u306E\u5F79</button><strong>' + esc(y.name) + " \xB7 " + y.base + '\u70B9</strong><button data-action="yaku-next">\u6B21\u306E\u5F79 \u203A</button></nav><div class="yaku-scroll" tabindex="0" aria-label="\u5F79\u4E00\u89A7">' + YAKU_TABLE.map(yakuScrollEntry).join("") + '</div><div class="reference-page-count">' + (selectedYakuIndex + 1) + " / " + YAKU_TABLE.length + "\u5F79</div></div>");
  }
  function storyParagraph(text) {
    return "<p>" + esc(text).replace(/\{([^|{}]+)\|([^{}]+)\}/g, "<ruby>$1<rt>$2</rt></ruby>") + "</p>";
  }
  function columns() {
    const ch = CHAPTERS[studyMonth - 1];
    return shell('<div class="reference-page story-page">' + headline("\u82B1\u306E\u3082\u306E\u304C\u305F\u308A", "\u5341\u4E8C\u304B\u6708\u306E\u82B1\u3060\u3088\u308A") + monthNavigation(ch.flower) + '<article class="story-scroll"><div class="season-art"><img src="' + photo(ch.month + "-1") + '" alt="' + esc(ch.flower) + '"></div><div class="reference-note story-text" tabindex="0"><h2>' + esc(ch.place) + "</h2>" + ch.story.map(storyParagraph).join("") + '</div></article><div class="reference-page-count">' + ch.month + " / 12\u304B\u6708</div></div>");
  }
  function newQuiz() {
    const { months, yakus, answered } = quizSession;
    const useMonth = months.length && (!yakus.length || answered % 2 === 0);
    if (useMonth) {
      const c = card(months.pop());
      const others = MONTHS.map((_, i) => i + 1).filter((month) => month !== c.month);
      quiz = { kind: "month", cardId: c.id, options: shuffle([c.month, ...shuffle(others).slice(0, 3)]), answered: null };
    } else if (yakus.length) {
      const y = YAKU_BY_ID[yakus.pop()];
      const answer = y.ids[2], held = y.ids.slice(0, 2);
      const others = DECK.filter((c) => c.type === card(answer).type && !y.ids.includes(c.id)).map((c) => c.id);
      quiz = { kind: "yaku", yakuId: y.id, held, answer, options: shuffle([answer, ...shuffle(others).slice(0, 3)]), answered: null };
    } else quiz = null;
  }
  function startQuiz() {
    quizSession = { months: shuffle(DECK.map((c) => c.id)), yakus: shuffle(["inoshikacho", "akatan", "aotan"]), answered: 0, correct: 0 };
    newQuiz();
  }
  function quizView() {
    if (!quiz) return shell('<div class="quiz-result">' + headline("\u30AF\u30A4\u30BA\u306E\u7D50\u679C", "\u82B1\u672D\u30AF\u30A4\u30BA") + "<p>" + quizSession.answered + "\u554F\u4E2D " + quizSession.correct + '\u554F\u6B63\u89E3</p><button class="primary" data-action="quiz-restart">\u3082\u3046\u4E00\u5EA6</button></div>');
    const showMonth = quiz.kind === "month", c = showMonth ? card(quiz.cardId) : null;
    const y = showMonth ? null : YAKU_TABLE.find((v) => v.id === quiz.yakuId);
    const heading = showMonth ? "\u3053\u306E\u672D\u306F\u3001\u4F55\u6708\u306E\u672D\uFF1F" : "\u300C" + y.name + "\u300D\u3092\u5B8C\u6210\u3055\u305B\u308B\u672D\u306F\u3069\u308C\uFF1F";
    const display = showMonth ? '<img src="' + photo(c.id) + '" alt="\u554F\u984C\u306E\u82B1\u672D">' : quiz.held.map((id) => '<img src="' + photo(id) + '" alt="' + esc(card(id).name) + '">').join("");
    const answered = quiz.answered !== null;
    const choices = showMonth ? quiz.options.map((m) => '<button class="quiz-option ' + (answered ? m === c.month ? "correct" : m === quiz.answered ? "wrong" : "" : "") + '" data-action="answer" data-month="' + m + '" ' + (answered ? "disabled" : "") + ">" + m + "\u6708 " + MONTHS[m - 1].flower + "</button>").join("") : quiz.options.map((id) => '<button class="quiz-option ' + (answered ? id === quiz.answer ? "correct" : id === quiz.answered ? "wrong" : "" : "") + '" data-action="answer" data-id="' + id + '" ' + (answered ? "disabled" : "") + '><img src="' + photo(id) + '" alt="' + esc(card(id).name) + '"></button>').join("");
    const correct = quiz.answered === (showMonth ? c.month : quiz.answer);
    const explanation = showMonth ? c.detail : "\u6B63\u89E3\u306F " + card(quiz.answer).name + "\u3002" + y.name + "\u304C\u5B8C\u6210\u3057\u307E\u3059\u3002";
    return shell('<div class="quiz-screen"><div class="quiz-head"><small>\u82B1\u672D\u30AF\u30A4\u30BA ' + (quizSession.answered + (answered ? 0 : 1)) + '\u554F\u76EE</small><h1 class="quiz-title">' + heading + '</h1></div><div class="quiz-art">' + display + '</div><div class="quiz-options">' + choices + "</div>" + inlineTeacher(answered ? (correct ? "\u6B63\u89E3\uFF01" : "\u60DC\u3057\u3044\uFF01") + " " + explanation : "\u672D\u306E\u300C\u6708\u30FB\u82B1\u30FB\u7D75\u67C4\u300D\u306B\u6CE8\u76EE\u3057\u3066\u7B54\u3048\u3066\u307F\u3088\u3046\u3002", {
      className: "quiz-feedback",
      status: true,
      action: answered ? '<button class="primary" data-action="next-quiz">' + (quizSession.months.length || quizSession.yakus.length ? "\u6B21\u306E\u554F\u984C\u3078 \u203A" : "\u7D50\u679C\u3092\u898B\u308B") + "</button>" : ""
    }) + '<div class="quiz-counter">\u3044\u307E\u307E\u3067 ' + state.quiz.correct + "\u554F\u6B63\u89E3 / " + state.quiz.total + "\u554F</div></div>");
  }
  function showAdRemoval(invoker) {
    const dialog = document.createElement("dialog");
    dialog.className = "coin-refill-dialog ad-removal-dialog";
    dialog.setAttribute("aria-labelledby", "ad-removal-title");
    dialog.innerHTML = '<h2 id="ad-removal-title">\u5E83\u544A\u306E\u975E\u8868\u793A</h2>' + (ports.native ? '<p>\u30D0\u30CA\u30FC\u3068\u5168\u753B\u9762\u5E83\u544A\u3092\u975E\u8868\u793A\u306B\u3057\u307E\u3059\u3002</p><p role="status">' + esc(purchaseStatus) + '</p><button class="primary" data-action="buy-remove-ads" ' + (ads.status().owned ? "disabled" : "") + '>\u8CFC\u5165\u3059\u308B</button><button class="secondary" data-action="restore-remove-ads">\u8CFC\u5165\u3092\u5FA9\u5143</button>' : "<p>\u30A2\u30D7\u30EA\u7248\u3067\u63D0\u4F9B\u4E88\u5B9A\u3067\u3059\u3002Web\u7248\u3067\u306F\u8CFC\u5165\u3067\u304D\u307E\u305B\u3093\u3002</p>") + '<form method="dialog"><button class="back-control">\u623B\u308B</button></form>';
    dialog.addEventListener("close", () => {
      dialog.remove();
      invoker.focus();
    }, { once: true });
    document.body.append(dialog);
    dialog.showModal();
  }
  function settingsView() {
    return shell('<div class="settings-screen feedback-settings">' + headline("\u8A2D\u5B9A", "\u30B7\u30B9\u30C6\u30E0") + '<div class="settings-sound">' + matchChoices("\u30B5\u30A6\u30F3\u30C9", "sound", [[true, "\u30AA\u30F3"], [false, "\u30AA\u30D5"]], state.settings.sound ?? true) + '<small>\u73FE\u5728\u306E\u7248\u306B\u306F\u52B9\u679C\u97F3\u304C\u3042\u308A\u307E\u305B\u3093\u3002</small></div><div class="settings-ads"><button class="settings-credits" data-action="ad-removal">\u5E83\u544A\u306E\u975E\u8868\u793A \u203A</button>' + (ports.native ? "" : "<small>\u30A2\u30D7\u30EA\u7248\u3067\u63D0\u4F9B\u4E88\u5B9A</small>") + "</div><p>" + esc(adsStatus) + '</p><button class="settings-credits" data-action="credits">\u30AF\u30EC\u30B8\u30C3\u30C8\u30FB\u30E9\u30A4\u30BB\u30F3\u30B9 \u203A</button></div>');
  }
  var TUTORIAL_STEPS = [
    "\u82B1\u672D\u3068\u306F\uFF1F",
    "\u82B1\u306E\u66A6",
    "\u306F\u3058\u3081\u306B",
    "\u30B9\u30C6\u30C3\u30D72 \u6708\u5F53\u3066\u30AF\u30A4\u30BA\u3068\u30AB\u30B9\u672D\u306E\u7DF4\u7FD2",
    "\u30B9\u30C6\u30C3\u30D73 \u30BF\u30CD\u672D\u306E\u7DF4\u7FD2",
    "\u30B9\u30C6\u30C3\u30D74 \u77ED\u518A\u672D\u306E\u7DF4\u7FD2",
    "\u30B9\u30C6\u30C3\u30D75 \u5149\u672D\u3068\u4ED5\u4E0A\u3052"
  ];
  function tutorialMenu() {
    const entries = [
      { label: "\u30B9\u30C6\u30C3\u30D71 \u82B1\u672D\u3068\u306F\uFF1F", action: "tutorial-intro", completed: state.tutorialIntroCompleted },
      ...TUTORIAL_STEPS.slice(3).map((label, index) => {
        const step = index + 3;
        return { label, action: "tutorial-step", step, completed: state.completedPracticeSteps?.includes(step) };
      }),
      ...["\u5BFE\u5C40\u30EC\u30C3\u30B9\u30F3", "3\u304B\u6708\u52DD\u8CA0"].map((label, index) => {
        const step = index + 6;
        return { label: "\u30B9\u30C6\u30C3\u30D7" + step + " " + label, action: "match-lesson", step, completed: state.completedMatchLessons?.includes(step) };
      })
    ];
    const steps = entries.map(({ label, action, step, completed }) => '<li><button type="button" class="tutorial-step-plaque" data-action="' + action + '"' + (step ? ' data-value="' + step + '"' : "") + (completed ? ' aria-describedby="tutorial-step-complete"' : "") + ">" + label + "</button></li>").join("");
    const figure = "assets/teacher-figure.png" ? ' style="--teacher-figure:url(./assets/teacher-figure.png)"' : "";
    return shell('<section class="tutorial-step-menu"><div class="tutorial-step-picker"><header class="tutorial-step-heading"><h1>\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB</h1></header><ol>' + steps + '</ol><span id="tutorial-step-complete" hidden>\u5B8C\u4E86</span></div><div class="tutorial-teacher-figure" aria-hidden="true"' + figure + "></div></section>");
  }
  function recordPracticeStep(step) {
    state.completedPracticeSteps ??= [];
    if (!state.completedPracticeSteps.includes(step)) state.completedPracticeSteps.push(step);
  }
  var PRACTICE_GOALS = [
    { type: "\u30AB\u30B9", label: "\u30AB\u30B9\u672D", total: 10 },
    { type: "\u30BF\u30CD", label: "\u30BF\u30CD\u672D", total: 5 },
    { type: "\u77ED\u518A", label: "\u77ED\u518A\u672D", total: 5 },
    { type: "\u5149", label: "\u5149\u672D", total: 3 }
  ];
  function practiceProgress(g) {
    const goal = PRACTICE_GOALS[g.tutorialStep - 3];
    if (!goal) return "";
    const { captured, koiCalls } = g.round;
    const count = evaluate(captured[0]).counts[goal.type];
    if (koiCalls[0] && goal.type === "\u5149") {
      return count >= 4 ? "\u5149\u672D\u304C4\u679A\u305D\u308D\u3063\u305F\u3088\u3002\u56DB\u5149\u306E\u70B9\u6570\u3092\u78BA\u8A8D\u3057\u3088\u3046\u3002" : "\u3053\u3044\u3053\u3044\uFF01 \u3053\u306E\u5C40\u306F\u7D9A\u304F\u3088\u3002\u6850\u306E\u672D\u3092\u5408\u308F\u305B\u3066\u30014\u679A\u76EE\u306E\u5149\u672D\u3092\u53D6\u308D\u3046\u3002";
    }
    if (!count) return goal.type === "\u5149" ? "\u5149\u672D\u30923\u679A\u96C6\u3081\u3066\u4E09\u5149\u3092\u4F5C\u308D\u3046\u3002" : "\u540C\u3058\u6708\u306E\u672D\u3092\u5408\u308F\u305B\u3066\u3001" + goal.label + "\u3092" + goal.total + "\u679A\u96C6\u3081\u3088\u3046\u3002";
    if (count >= goal.total) return goal.label + "\u304C" + count + "\u679A\u305D\u308D\u3063\u305F\u3088\u3002\u5F79\u3068\u70B9\u6570\u3092\u78BA\u8A8D\u3057\u3088\u3046\u3002";
    return goal.label + "\u304C" + count + "\u679A\u96C6\u307E\u3063\u305F\u3088\u3002\u3042\u3068" + (goal.total - count) + "\u679A\u3002\u6B21\u3082" + goal.label + "\u3092\u9078\u3093\u3067\u3001\u540C\u3058\u6708\u306E\u5834\u672D\u3068\u5408\u308F\u305B\u3088\u3046\u3002";
  }
  function finalPracticeDecision(score) {
    const names = score.yakus.map((yaku) => yaku.name).join("\u30FB");
    const fourLights = YAKU_BY_ID.shiko;
    const next = settlePoints(fourLights.base, [0, 0], 0);
    return [
      "\u52DD\u8CA0\u306A\u3089\u3001" + names + "\u3067" + score.points + "\u70B9\u3092\u3082\u3089\u3063\u3066\u3001\u3053\u306E\u5C40\u3092\u7D42\u3048\u308B\u3088\u3002",
      "\u3053\u3044\u3053\u3044\u3092\u9078\u3076\u3068\u3001\u5C40\u3092\u7D9A\u3051\u3066\u70B9\u3092\u5897\u3084\u305B\u308B\u3088\u3002",
      "\u3053\u3044\u3053\u3044\u306E\u3042\u3068\u3001\u76F8\u624B\u304C\u5148\u306B\u5F79\u3092\u4F5C\u308B\u3068\u3001\u81EA\u5206\u306F0\u70B9\u3001\u76F8\u624B\u306E\u5F97\u70B9\u306F2\u500D\u3002",
      "\u5F79\u306E\u5408\u8A08\u304C" + RULES.pointThreshold + "\u70B9\u4EE5\u4E0A\u306A\u3089\u5F97\u70B9\u306F2\u500D\u3002\u56DB\u5149\u306A\u3089" + next.raw + "\u70B9\u304C" + next.points + "\u70B9\u306B\u306A\u308B\u3088\u3002"
    ].join("\n");
  }
  function lessonFor(g, selected, guide) {
    const r = g.round, teach = Boolean(g.tutorial);
    if (teach && g.tutorialLearning) {
      const ids = g.tutorialLearning.ids || [], first = (g.tutorialLearning.index ?? 0) === 0, types = [...new Set(ids.map((id) => card(id).type))];
      return { step: "\u672D\u3092\u96C6\u3081\u308B", title: first ? "\u672D\u304C\u53D6\u308C\u305F\u306D\uFF01" : "\u53D6\u308A\u672D\u304C\u5897\u3048\u305F\u306D", description: practiceProgress(g) || (first ? "\u540C\u3058\u6708\u306E\u672D\u3092\u5408\u308F\u305B\u308B\u3068\u30012\u679A\u3068\u3082\u81EA\u5206\u306E\u53D6\u308A\u672D\u306B\u306A\u308B\u3088\u3002\u3053\u308C\u306F" + types.join("\u30FB") + "\u672D\u3002\u5F79\u3092\u4F5C\u308B\u3068\u304D\u306B\u4F7F\u3046\u672D\u3060\u306D\u3002" : types.join("\u30FB") + "\u672D\u304C\u5897\u3048\u305F\u3088\u3002\u5C11\u3057\u305A\u3064\u96C6\u3081\u3066\u3044\u3053\u3046\u3002"), tapAction: "tutorial-learned", visual: "capture" };
    }
    if (teach && r.phase === "decision" && r.current === 0) {
      const score = completedYakuSummary(r.captured[0], r.koiCalls), step = g.tutorialRoleStep ?? 0;
      if (step === 0) return { step: "\u5F79\u304C\u3067\u304D\u305F", title: score.yakus.map((y) => y.name).join("\u30FB") + "\u304C\u5B8C\u6210\uFF01", description: "\u5F79\u3092\u4F5C\u3063\u305F\u672D\u3092\u898B\u3066\u307F\u3088\u3046\u3002", tapAction: "tutorial-role-points", visual: "role" };
      if (step === 1 && g.tutorialStep >= 3 && g.tutorialStep < 6) return { step: "\u5F79\u306E\u70B9\u6570", title: score.yakus.map((y) => y.name).join("\u30FB") + " " + score.raw + "\u70B9", description: "\u96C6\u3081\u305F\u672D\u3067\u5F79\u304C\u3067\u304D\u305F\u306D\u3002", tapAction: "tutorial-finish-practice" };
      if (step === 1) return { step: "\u5F79\u306E\u70B9\u6570", title: "\u70B9\u6570\u306E\u78BA\u8A8D", description: score.yakus.map((yaku) => yaku.name).join("\u30FB") + "\u306F" + score.raw + "\u70B9\u3060\u3088\u3002", tapAction: "tutorial-decision", visual: "points" };
      return { step: "\u3055\u3044\u3054\u306E\u9078\u629E", title: "\u52DD\u8CA0\u3059\u308B\uFF1F \u3053\u3044\u3053\u3044\u3059\u308B\uFF1F", description: g.tutorialStep === 6 ? finalPracticeDecision(score) : "\u52DD\u8CA0\u3067\u70B9\u3092\u78BA\u5B9A\u3002\u3053\u3044\u3053\u3044\u3067\u6B21\u306E\u5F79\u3092\u306D\u3089\u3048\u308B\u3051\u308C\u3069\u3001\u76F8\u624B\u306B\u5148\u306B\u5F79\u3092\u4F5C\u3089\u308C\u308B\u3053\u3068\u3082\u3042\u308B\u3088\u3002", visual: "decision" };
    }
    if (teach && (r.phase === "game-end" || r.phase === "round-end")) {
      const practiceResult = g.tutorialStep === 6 && r.result.winner === 0;
      const settled = practiceResult ? evaluate(r.captured[0]).yakus.map((yaku) => yaku.name).join("\u30FB") + " " + r.result.raw + "\u70B9\u3002\u5F97\u70B9" + r.result.points + "\u70B9\u304C\u78BA\u5B9A\u3057\u305F\u3088\u3002" : "";
      return { step: "\u7DF4\u7FD2\u304A\u308F\u308A", title: g.tutorialStep === 6 ? "\u7DF4\u7FD2\u5B8C\u4E86\uFF01" : r.result.winner === 0 ? "\u306F\u3058\u3081\u3066\u306E\u4E00\u5C40\u3001\u3067\u304D\u305F\u306D\uFF01" : "\u4E00\u5C40\u304A\u3064\u304B\u308C\u3055\u307E\uFF01", description: settled || "\u82B1\u672D\u3092\u5408\u308F\u305B\u3066\u3001\u5F79\u3092\u4F5C\u3063\u3066\u3001\u6700\u5F8C\u306B\u81EA\u5206\u3067\u9078\u3079\u305F\u306D\u3002\u3053\u308C\u3067\u57FA\u672C\u306E\u904A\u3073\u65B9\u306F\u3070\u3063\u3061\u308A\u3002\u6B21\u306F\u8CED\u3051\u306A\u3057\u3067\u5BFE\u5C40\u3057\u3066\u307F\u3088\u3046\u3002", action: (g.tutorialSingleStep ? "" : '<button class="primary" data-action="tutorial-free">\u8CED\u3051\u306A\u3057\u3078 \u203A</button>') + backButton("tutorial-menu", "\u30B9\u30C6\u30C3\u30D7\u4E00\u89A7\u3078"), visual: "complete" };
    }
    if (teach && r.phase === "hand" && r.current === 0) {
      if (g.tutorialHint) return { step: "\u672D\u3092\u9078\u3076", title: "\u3086\u3063\u304F\u308A\u63A2\u3057\u3066\u307F\u3088\u3046", description: g.tutorialHint, action: "" };
      if (!selected) return {
        step: TUTORIAL_STEPS[g.tutorialStep] || "\u624B\u672D\u3092\u9078\u3076",
        title: "\u624B\u672D\u304B\u3089\u4E00\u679A\u9078\u307C\u3046",
        description: practiceProgress(g) || "\u540C\u3058\u6708\u306E\u5834\u672D\u304C\u3042\u308B\u624B\u672D\u3092\u63A2\u3057\u3066\u307F\u3088\u3046\u3002",
        action: ""
      };
      const c = card(selected), matches = matching(r.field, selected);
      if (matches.length) return { step: "\u540C\u3058\u6708\u3092\u5408\u308F\u305B\u308B", title: "\u540C\u3058\u6708\u306E\u672D\u3092\u63A2\u305D\u3046", description: c.month + "\u6708\u306E" + c.flower + "\u3060\u306D\u3002\u5834\u306B\u3042\u308B\u540C\u3058\u6708\u306E\u672D\u3092\u30BF\u30C3\u30D7\u3057\u3088\u3046\u3002", action: "" };
      if (g.tutorialStep === void 0) return { step: "\u672D\u3092\u5834\u306B\u51FA\u3059", title: "\u5834\u306B\u540C\u3058\u6708\u306E\u672D\u304C\u306A\u3044\u306D", description: "\u3053\u306E\u672D\u306F\u305D\u306E\u307E\u307E\u5834\u306B\u51FA\u305B\u308B\u3088\u3002", tapAction: "dismiss-teacher", action: '<button class="primary" data-action="play-selected">\u5834\u306B\u51FA\u3059</button>' };
      return { step: "\u672D\u3092\u9078\u3073\u76F4\u3059", title: "\u5834\u306B\u540C\u3058\u6708\u306E\u672D\u304C\u306A\u3044\u306D", description: "\u5225\u306E\u624B\u672D\u3092\u9078\u3093\u3067\u3001\u540C\u3058\u6708\u3092\u5408\u308F\u305B\u3088\u3046\u3002", action: "" };
    }
    if (teach && r.phase === "draw-target" && r.current === 0) return { step: "\u5C71\u672D\u306E\u672D\u3092\u5408\u308F\u305B\u308B", title: "\u5C71\u672D\u304B\u3089\u3082\u540C\u3058\u6708\u3092\u63A2\u305D\u3046", description: card(r.pendingDraw).month + "\u6708\u306E\u672D\u304C\u51FA\u305F\u306D\u3002\u540C\u3058\u6708\u306E\u5834\u672D\u3092\u30BF\u30C3\u30D7\u3057\u3066\u5408\u308F\u305B\u3088\u3046\u3002", action: "" };
    if (teach && r.phase === "hand" && r.current === 1) return { step: "\u76F8\u624B\u306E\u756A", title: "\u76F8\u624B\u3082\u4E00\u679A\u305A\u3064\u904A\u3076\u3088", description: "\u76F8\u624B\u306E\u624B\u672D\u306F\u88CF\u5411\u304D\u3002\u3069\u306E\u672D\u3092\u6301\u3063\u3066\u3044\u308B\u304B\u306F\u5206\u304B\u3089\u306A\u3044\u3093\u3060\u3002", action: "" };
    if (r.phase === "hand" && r.current === 0) {
      if (!selected) return { step: "\u3042\u306A\u305F\u306E\u756A", title: "\u624B\u672D\u30921\u679A\u30BF\u30C3\u30D7", description: guide.brief, action: g.matchLesson ? "" : '<button class="coach-detail" data-action="show-guide">\u5148\u751F\u306B\u805E\u304F \u203A</button>' };
      const c = card(selected), matches = matching(r.field, selected);
      return { step: "\u672D\u3092\u5408\u308F\u305B\u308B", title: matches.length ? "\u540C\u3058\u6708\u306E\u672D\u3092\u30BF\u30C3\u30D7" : "\u5834\u306B\u51FA\u3059", description: c.month + "\u6708 " + c.flower + "\u300C" + c.subject + "\u300D\u3092\u9078\u3093\u3060\u3088\u3002", action: matches.length ? "" : '<button class="primary" data-action="play-selected">\u5834\u306B\u51FA\u3059</button>' };
    }
    return { step: "\u3042\u306A\u305F\u306E\u756A", title: "\u6B21\u306E\u672D\u3092\u9078\u307C\u3046", description: "\u5834\u306B\u51FA\u3055\u308C\u305F\u672D\u3092\u898B\u306A\u304C\u3089\u3001\u624B\u672D\u3092\u9078\u3093\u3067\u307F\u3088\u3046\u3002", action: "" };
  }
  var STOCK_FRAME_EXPLANATION = "\u5C71\u672D\u304B\u3089\u5F15\u3044\u305F\u672D\u306B\u306F\u6C34\u8272\u306E\u67A0\u304C\u4ED8\u304F\u3088\u3002";
  var MATCH_LESSON_NOTICES = {
    start: { step: "\u5BFE\u5C40\u30EC\u30C3\u30B9\u30F3", title: "\u4E00\u5C40\u3001\u901A\u3057\u3066\u904A\u3093\u3067\u307F\u3088\u3046", description: STOCK_FRAME_EXPLANATION },
    yaku: { step: "\u5BFE\u5C40\u30EC\u30C3\u30B9\u30F3", title: "\u521D\u3081\u3066\u306E\u5F79\u304C\u3067\u304D\u305F\u306D\uFF01", description: "\u53D6\u3063\u305F\u672D\u306E\u7D44\u307F\u5408\u308F\u305B\u3067\u5F79\u304C\u3067\u304D\u308B\u3068\u3001\u70B9\u6570\u304C\u3064\u304F\u3088\u3002" },
    decision: { step: "\u5BFE\u5C40\u30EC\u30C3\u30B9\u30F3", title: "\u52DD\u8CA0\u3059\u308B\uFF1F \u3053\u3044\u3053\u3044\u3059\u308B\uFF1F", description: "\u52DD\u8CA0\u306A\u3089\u70B9\u3092\u78BA\u5B9A\u3057\u3066\u5C40\u3092\u7D42\u3048\u308B\u3088\u3002\u3053\u3044\u3053\u3044\u306A\u3089\u7D9A\u3051\u3089\u308C\u308B\u3051\u308C\u3069\u3001\u76F8\u624B\u304C\u5148\u306B\u5F79\u3092\u4F5C\u308B\u3068\u76F8\u624B\u306E\u52DD\u3061\u3060\u3088\u3002" },
    end: { step: "\u5BFE\u5C40\u30EC\u30C3\u30B9\u30F3", title: "\u4E00\u5C40\u304A\u3064\u304B\u308C\u3055\u307E\uFF01", description: "\u5F97\u70B9\u3092\u78BA\u8A8D\u3057\u3066\u3001\u30B9\u30C6\u30C3\u30D7\u4E00\u89A7\u3078\u623B\u308D\u3046\u3002" }
  };
  function yakuNames(yakus) {
    return '<ul class="panel-yaku">' + yakus.map(({ name, points }) => "<li>" + esc(name) + " <b>" + points + "\u70B9</b></li>").join("") + "</ul>";
  }
  function celebrationPetals() {
    return '<div class="yaku-celebration-petals" aria-hidden="true">' + Array.from({ length: 6 }, (_, index) => '<i style="--petal:' + index + '"></i>').join("") + "</div>";
  }
  function resultTitle(winner) {
    return winner === 0 ? "\u3042\u306A\u305F\u306E\u52DD\u3061\uFF01" : winner === 1 ? "\u76F8\u624B\u306E\u52DD\u3061" : "\u5F15\u304D\u5206\u3051";
  }
  function resultPanel(g) {
    const { winner, points, multiplier, raw, reason } = g.round.result;
    const finale = g.finished && g.matchLesson !== 6;
    const [mine, opponent] = g.scores;
    const matchWinner = mine === opponent ? null : Number(mine < opponent);
    const yakus = winner === null ? [] : reason === "te-shi" ? [{ name: "\u624B\u56DB", points }] : reason === "kuttsuki" ? [{ name: "\u304F\u3063\u3064\u304D", points }] : evaluate(g.round.captured[winner]).yakus;
    const won = (finale ? matchWinner : winner) === 0;
    const coins = finale ? g.betting?.settlement : null;
    const action = g.finished ? g.matchLesson ? backButton("finish-match-lesson", "\u30B9\u30C6\u30C3\u30D7\u4E00\u89A7\u3078") : backButton("home", "\u30DB\u30FC\u30E0\u3078\u623B\u308B") : '<button class="primary" data-action="next-round">\u6B21\u306E\u5C40\u3078</button>';
    return '<div class="teacher-dim" aria-hidden="true"></div><section class="result table-panel' + (finale ? " match-finale" : "") + (coins ? " betting-finale" : "") + (won ? " result-win" : "") + '" role="dialog" aria-modal="true" aria-labelledby="result-title"><span class="result-label">' + (finale ? "\u5BFE\u5C40\u7D50\u679C" : "\u7B2C" + (g.index + 1) + "\u5C40\u306E\u7D50\u679C") + '</span><h2 id="result-title">' + resultTitle(finale ? matchWinner : winner) + "</h2>" + (finale ? '<p class="match-totals" aria-label="\u5BFE\u5C40\u306E\u5408\u8A08\u70B9"><span>\u3042\u306A\u305F <b>' + mine + "\u70B9</b></span> \uFF0F <span>\u76F8\u624B <b>" + opponent + "\u70B9</b></span></p>" : "") + '<div class="round-settlement"><p>' + (finale ? "\u6700\u7D42\u5C40 \xB7 " + resultTitle(winner) + "\u3000" : "") + "\u5F97\u70B9 <strong>" + points + "\u70B9</strong>" + (multiplier > 1 ? ' <span class="result-multiplier">\uFF08' + raw + "\u70B9 \xD7 " + multiplier + "\u500D\uFF09</span>" : "") + "</p>" + (yakus.length ? yakuNames(yakus) : "") + "</div>" + (coins ? '<div class="coin-result"><div><span>\u30B3\u30A4\u30F3\u306E\u5897\u6E1B</span><strong>' + (coins.change > 0 ? "+" : coins.change < 0 ? "\u2212" : "") + n(Math.abs(coins.change)) + " \u30B3\u30A4\u30F3</strong></div><div><span>\u7CBE\u7B97\u5F8C\u306E\u6240\u6301\u30B3\u30A4\u30F3</span><strong>" + n(coins.balance) + " \u30B3\u30A4\u30F3</strong></div></div>" : "") + '<div class="result-action">' + (coins && state.wallet.coins < MIN_COINS ? '<button class="secondary" data-action="coin-refill">\u30B3\u30A4\u30F3\u3092\u3082\u3089\u3046</button>' : "") + action + "</div>" + (won ? celebrationPetals() : "") + "</section>";
  }
  function gameDialogView(g) {
    if (!gameDialog || ["guide", "match-hint"].includes(gameDialog)) return "";
    let title = "", body = "";
    if (gameDialog === "card") {
      const c = card(selectedCard);
      title = c.name;
      body = '<div class="card-inspection"><img src="' + photo(c.id) + '" alt="' + esc(c.name) + '"><div><strong>' + esc(c.type) + "\u672D</strong><p>" + esc(letterForCard(c.id)) + "</p><p>\u53D6\u3063\u305F\u672D\u3092\u96C6\u3081\u308B\u3068\u300C\u5F79\u300D\u306B\u306A\u308A\u307E\u3059\u3002</p></div></div>";
    } else {
      const mine = gameDialog === "mine", ids = g.round.captured[mine ? 0 : 1];
      title = mine ? "\u81EA\u5206\u306E\u53D6\u308A\u672D" : "\u76F8\u624B\u306E\u53D6\u308A\u672D";
      body = takenDetails(ids);
    }
    return '<div class="game-dialog" role="dialog" aria-modal="true" aria-label="' + title + '"><div class="dialog-sheet' + (["mine", "opp"].includes(gameDialog) ? " capture-dialog" : "") + '"><div class="dialog-top"><strong>' + title + "</strong>" + backButton("close-dialog", gameDialogReturn ? "\u4E00\u89A7\u306B\u623B\u308B" : "\u623B\u308B") + "</div>" + body + "</div></div>";
  }
  var INTRO_LESSONS = [
    { title: "\u82B1\u672D\u3068\u306F\uFF1F", description: "\u82B1\u672D\u306F\u3001\u5B63\u7BC0\u306E\u82B1\u3084\u98A8\u7269\u3092\u63CF\u3044\u305F\u65E5\u672C\u306E\u672D\u3060\u3088\u30021\u6708\u304B\u308912\u6708\u307E\u3067\u3001\u5404\u67084\u679A\u305A\u3064\u3067\u5168\u90E8\u306748\u679A\u3002" },
    { title: "\u82B1\u306E\u66A6\u3092\u898B\u3066\u307F\u3088\u3046", description: "\u672D\u306E\u7D75\u306B\u306F\u3001\u305D\u308C\u305E\u308C\u5B63\u7BC0\u306E\u82B1\u304C\u63CF\u304B\u308C\u3066\u3044\u308B\u3088\u3002\u6C17\u306B\u306A\u308B\u82B1\u3092\u773A\u3081\u3066\u307F\u3066\u306D\u3002" },
    { title: "\u306F\u3058\u3081\u306B", description: "\u540C\u3058\u6708\u306E\u672D\u3092\u5408\u308F\u305B\u3066\u53D6\u308D\u3046\u3002\u53D6\u3063\u305F\u672D\u3092\u96C6\u3081\u3066\u3001\u6C7A\u307E\u3063\u305F\u7D44\u307F\u5408\u308F\u305B\u304C\u305D\u308D\u3046\u3068\u300C\u5F79\u300D\u306B\u306A\u308B\u3088\u3002" },
    { title: "\u5BFE\u5C40\u306F\u4F55\u304B\u6708\uFF1F", description: "1\u5C40\u304C\u4E00\u6708\u3060\u3088\u3002\u5BFE\u5C40\u306F3\u304B\u6708\u30FB6\u304B\u6708\u30FB12\u304B\u6708\u304B\u3089\u9078\u3079\u308B\u3088\u3002\u5168\u671F\u9593\u306E\u5408\u8A08\u70B9\u3067\u52DD\u6557\u304C\u6C7A\u307E\u308B\u3088\u3002" },
    { title: "\u52DD\u8CA0\u3068\u3053\u3044\u3053\u3044", description: [
      "\u52DD\u8CA0\uFF1A\u5F79\u304C\u3067\u304D\u305F\u3089\u3001\u305D\u306E\u70B9\u3092\u3082\u3089\u3063\u3066\u5C40\u3092\u7D42\u3048\u308B\u3002",
      "\u3053\u3044\u3053\u3044\uFF1A\u5BA3\u8A00\u3057\u3066\u5C40\u3092\u7D9A\u3051\u308B\u3002\u6B21\u306B\u3069\u3061\u3089\u304B\u304C\u5F79\u3092\u4F5C\u3063\u305F\u6642\u70B9\u3067\u5C40\u304C\u7D42\u308F\u308A\u3001\u4F5C\u3063\u305F\u5074\u304C\u5F97\u70B9\u3059\u308B\u3002\u52DD\u8CA0\u304B\u3053\u3044\u3053\u3044\u304B\u3092\u3082\u3046\u4E00\u5EA6\u9078\u3076\u3053\u3068\u306F\u306A\u3044\u3088\u3002",
      "\u3053\u3044\u88AB\u308A\uFF1A\u76F8\u624B\u304C\u5148\u306B\u5F79\u3092\u4F5C\u308B\u3053\u3068\u3002\u3053\u3044\u3053\u3044\u3057\u305F\u5074\u306F0\u70B9\u3067\u3001\u76F8\u624B\u306E\u5F97\u70B9\u306F2\u500D\u3002",
      "\u500D\u4ED8\u3051\uFF1A\u5F79\u306E\u5408\u8A08\u304C7\u70B9\u4EE5\u4E0A\u306A\u3089\u52DD\u8005\u306E\u5F97\u70B9\u306F2\u500D\u3002\u3053\u3044\u88AB\u308A\u3068\u91CD\u306A\u308C\u30704\u500D\u3002"
    ].join("\n") }
  ];
  function tutorialMonthQuestion(g) {
    return g.tutorialMonthQuestions[g.tutorialMonthAnswers.length];
  }
  function tutorialQuizView(g) {
    const count = g.tutorialMonthAnswers.length, total = g.tutorialMonthQuestions.length;
    const feedback = g.tutorialMonthFeedback, q = tutorialMonthQuestion(g);
    const lesson = feedback ? {
      title: "\u6B63\u89E3\uFF01 " + feedback.month + "\u6708\u306E\u82B1\u3060\u306D",
      description: "\u82B1\u306E\u66A6\u3067\u898B\u305F\u7D75\u3068\u540C\u3058\u3060\u306D\u3002"
    } : q ? {
      title: "\u3053\u306E\u672D\u306F\u4F55\u6708\u304B\u306A\uFF1F",
      description: g.tutorialHint || "\u672D\u306E\u7D75\u3092\u898B\u3066\u3001\u4F55\u6708\u306E\u672D\u304B\u9078\u3093\u3067\u307F\u3088\u3046\u3002"
    } : {
      title: "\u82B1\u306E\u66A6\u3092\u899A\u3048\u305F\u306D\uFF01",
      description: "\u6708\u3068\u82B1\u306E\u7D44\u307F\u5408\u308F\u305B\u304C\u5206\u304B\u3063\u305F\u306D\u3002\u6B21\u306F\u30AB\u30B9\u672D\u3092\u96C6\u3081\u3066\u307F\u3088\u3046\u3002"
    };
    const exhibit = q ? '<section class="tutorial-month-quiz' + (feedback ? " is-feedback" : "") + '"><small>\u6708\u5F53\u3066 ' + (count + 1) + " / " + total + '</small><img src="' + photo(q.id) + '" alt="\u6708\u3092\u5F53\u3066\u308B\u82B1\u672D"><div class="month-quiz-choices">' + q.choices.map((v) => "<button " + (feedback ? "disabled " : "") + (feedback && v === feedback.month ? 'class="correct" aria-pressed="true" ' : "") + 'data-action="tutorial-month-answer" data-month="' + v + '">' + v + "\u6708</button>").join("") + "</div></section>" : '<div class="tutorial-quiz-complete">' + total + "\u554F\u6B63\u89E3\uFF01</div>";
    return exhibit + teacherBubble({ ...lesson, step: "\u6708\u5F53\u3066\u30AF\u30A4\u30BA" }, "", feedback ? "tutorial-month-next" : q ? "" : "tutorial-continue");
  }
  function tutorialExhibit(phase) {
    if (phase === 1) return '<section class="tutorial-almanac" aria-label="\u5341\u4E8C\u304B\u6708\u306E\u82B1\u306E\u66A6"><div class="almanac-grid">' + MONTHS.map((m, i) => '<div class="almanac-month"><img src="' + photo(i + 1 + "-1") + '" alt="' + esc(m.flower) + '"><span><b>' + String(i + 1).padStart(2, "0") + "\u6708</b><small>" + esc(m.flower) + "</small></span></div>").join("") + "</div></section>";
    if (phase !== 2) return "";
    const examples = [
      ["1-3", "\u30AB\u30B9\u672D", "10\u679A\u96C6\u3081\u308B\u3068\u30AB\u30B9\u3002"],
      ["2-1", "\u30BF\u30CD\u672D", "\u9CE5\u3084\u52D5\u7269\u306A\u3069\u304C\u76EE\u5370\u30025\u679A\u3067\u30BF\u30CD\u3002"],
      ["3-2", "\u77ED\u518A\u672D", "\u7D30\u9577\u3044\u77ED\u518A\u304C\u76EE\u5370\u30025\u679A\u3067\u30BF\u30F3\u3002"],
      ["8-1", "\u5149\u672D", "\u6708\u3084\u9DB4\u306A\u3069\u306E\u7279\u5225\u306A\u672D\u3002\u305D\u308D\u3048\u308B\u3068\u5149\u306E\u5F79\u306B\u3002"]
    ];
    return '<section class="tutorial-purpose-art" aria-label="\u672D\u306E\u56DB\u3064\u306E\u7A2E\u985E">' + examples.map(([id, name, description]) => '<figure><img src="' + photo(id) + '" alt="' + esc(card(id).name) + '"><figcaption><strong>' + name + "</strong><span>" + description + "</span></figcaption></figure>").join("") + "</section>";
  }
  function teacherAvatar() {
    return '<span class="teacher-icon-frame" aria-hidden="true"></span>';
  }
  function teacherBubble(lesson, visual = "", tapAction = "") {
    const dismiss = tapAction ? ' data-teacher-tap="' + tapAction + '"' : "";
    return (tapAction ? '<button type="button" class="teacher-dim" data-teacher-tap="' + tapAction + '" aria-label="\u5148\u751F\u306E\u6848\u5185\u3092\u78BA\u8A8D"></button>' : '<div class="teacher-dim" aria-hidden="true"></div>') + '<aside class="teacher-bubble" aria-label="\u5148\u751F\u306E\u6848\u5185"' + dismiss + ">" + teacherAvatar() + '<div class="teacher-speech" role="status"><small>\u5148\u751F \xB7 ' + esc(lesson.step) + "</small><h3>" + esc(lesson.title) + "</h3><p>" + esc(lesson.description) + "</p>" + visual + (tapAction && !lesson.action ? '<small class="teacher-tap-prompt">\u753B\u9762\u3092\u30BF\u30C3\u30D7\u3057\u3066\u9032\u3080</small>' : "") + "</div>" + (lesson.action ? '<div class="teacher-actions">' + lesson.action + "</div>" : "") + "</aside>";
  }
  function tutorialRoleVisual(g, lesson) {
    if (!g.tutorial || !lesson.visual) return "";
    if (lesson.visual === "capture") return '<div class="teacher-visual teacher-capture">' + (g.tutorialLearning?.ids || []).map((id) => '<img src="' + photo(id) + '" alt="' + esc(card(id).name) + '">').join("") + "</div>";
    if (lesson.visual === "points") return "";
    if (lesson.visual === "role") {
      const score = completedYakuSummary(g.round.captured[0], g.round.koiCalls), cards = [...new Set(score.yakus.flatMap((y) => y.cards))];
      return '<div class="teacher-visual teacher-role-cards">' + cards.map((id) => '<img src="' + photo(id) + '" alt="' + esc(card(id).name) + '">').join("") + "</div>";
    }
    return "";
  }
  function tutorialIntroView(g) {
    const step = g.tutorialIntroStep ?? 0;
    const lesson = INTRO_LESSONS[step];
    return shell('<section class="tutorial-welcome tutorial-intro-step-' + step + '">' + (step === TUTORIAL_QUIZ_PHASE ? tutorialQuizView(g) : '<header class="tutorial-welcome-copy"><h1>' + esc(lesson.title) + "</h1><p>" + esc(lesson.description) + "</p></header>" + tutorialExhibit(step) + '<div class="tutorial-next"><button class="primary" data-action="tutorial-next">' + (step === INTRO_LESSONS.length - 1 ? "\u30B9\u30C6\u30C3\u30D7\u4E00\u89A7\u3078" : "\u6B21\u3078 \u203A") + "</button></div>") + "</section>");
  }
  function decisionPanel(g, lesson, hintButton) {
    const score = completedYakuSummary(g.round.captured[0], g.round.koiCalls);
    return '<div class="teacher-dim decision-dim" aria-hidden="true"></div><section class="decision-panel table-panel" role="dialog" aria-modal="true" aria-labelledby="decision-title"><h2 id="decision-title">\u52DD\u8CA0\u3059\u308B\uFF1F \u3053\u3044\u3053\u3044\u3059\u308B\uFF1F</h2>' + yakuNames(score.yakus) + '<dl class="decision-scores"><div><dt>\u5F79\u306E\u5408\u8A08</dt><dd>' + score.raw + "\u70B9</dd></div><div><dt>\u52DD\u8CA0\u3067\u78BA\u5B9A</dt><dd>" + score.points + "\u70B9</dd></div></dl>" + (g.tutorial ? '<div class="teacher-speech"><p>' + esc(lesson.description) + "</p></div>" : "") + '<div class="decision-actions"><button class="primary" data-action="stop">\u52DD\u8CA0\u3059\u308B</button><button class="secondary" data-action="koi">\u3053\u3044\u3053\u3044</button></div>' + hintButton + "</section>";
  }
  function gameView() {
    const g = state.active;
    if (!g) return home();
    const playback = turnPresentation;
    const r = playback?.board ?? g.round, guide = guidance(g);
    if (g.tutorial && !g.tutorialIntroDone) return tutorialIntroView(g);
    const lesson = lessonFor(g, selectedHand, guide);
    const selecting = selectedHand && r.current === 0 && r.phase === "hand", matchingNow = selecting ? matching(r.field, selectedHand) : [];
    const showFieldNames = Boolean(!g.tutorial && g.beginner), showHandNames = Boolean(!g.tutorial && g.beginner), fieldCount = r.field.length, isEnd = r.phase === "round-end" || r.phase === "game-end";
    const drawChoice = !playback && r.current === 0 && r.phase === "draw-target";
    const handChoice = !playback && matchingNow.length === 2;
    const choiceCard = drawChoice ? card(r.pendingDraw) : null;
    const stockFace = playback?.stockCard;
    const markedStock = stockFace && playback.drawnCard === stockFace;
    const teachingStock = Boolean(g.tutorial || g.matchLesson);
    const stockExplanation = teachingStock && (drawChoice || playback?.explainStock) ? STOCK_FRAME_EXPLANATION : "";
    const choiceText = drawChoice ? "\u5C71\u672D\u304B\u3089\u5F15\u3044\u305F" + choiceCard.month + "\u6708\u30FB" + choiceCard.subject + "\u3068\u5408\u3046\u672D\u304C2\u679A\u3042\u308B\u3088\u3002\u53D6\u308A\u305F\u3044\u65B9\u3092\u30BF\u30C3\u30D7\u3057\u3066\u306D\u3002" : handChoice ? "\u5408\u3046\u672D\u304C2\u679A\u3042\u308B\u3088\u3002\u53D6\u308A\u305F\u3044\u65B9\u3092\u30BF\u30C3\u30D7\u3057\u3066\u306D\u3002" : "";
    const field = r.field.map((id) => {
      const chosen = r.phase === "draw-target" && r.current === 0 && matching(r.field, r.pendingDraw).includes(id), same = selecting && matchingNow.includes(id);
      return tile(id, { action: chosen ? "draw-target" : same ? "field-target" : "inspect", label: showFieldNames, className: (chosen || same || playback?.matches.includes(id) ? "target " : "") + (playback?.drawnCard === id ? "drawn-card" : "") });
    }).join("");
    const hand = r.hands[0].map((id) => tile(id, { action: "select-hand", label: showHandNames, className: (selectedHand === id ? "selected " : "") + (!playback && g.beginner && helpfulHandIds(g).includes(id) ? "hint " : "") + (r.current === 0 && r.phase === "hand" ? "playable" : "") })).join("");
    const tutor = Boolean(g.tutorial);
    const deciding = !playback && r.phase === "decision" && r.current === 0 && (!tutor || lesson.visual === "decision");
    const opponentBacks = r.hands[1].map(() => '<span class="opponent-card-back" aria-hidden="true"><i></i></span>').join("");
    const playerTaken = boardTakenPanel(r.captured[0], !tutor, 0, r.current === 0 ? playback?.incoming : void 0);
    const playerYaku = boardYakuPanel(r.captured[0], r.koiCalls, "\u3042\u306A\u305F\u306E\u3067\u304D\u3066\u3044\u308B\u5F79");
    const rivalTaken = boardTakenPanel(r.captured[1], !tutor, 1, r.current === 1 ? playback?.incoming : void 0);
    const rivalYaku = boardYakuPanel(r.captured[1], [r.koiCalls[1], r.koiCalls[0]], "\u76F8\u624B\u306E\u3067\u304D\u3066\u3044\u308B\u5F79");
    const roundLabel = g.matchLesson === 6 ? "\u5BFE\u5C40\u30EC\u30C3\u30B9\u30F3" : g.matchLesson === 7 ? "3\u304B\u6708\u52DD\u8CA0" : tutor ? "\u7DF4\u7FD2" : g.length + "\u304B\u6708\u5BFE\u5C40";
    const recentDraw = g.matchLesson && [...r.log].reverse().find((event) => event.actor === 0 && event.source === "stock");
    const fieldCaption = playback?.caption || (recentDraw ? "\u5C71\u672D\u304B\u3089 " + card(recentDraw.card).name + "\uFF08" + (recentDraw.taken.length ? "\u53D6\u3063\u305F" : "\u5834\u306B\u51FA\u305F") + "\uFF09" : "\u540C\u3058\u6708\u306E\u672D\u3092\u5408\u308F\u305B\u3088\u3046");
    const stagedCard = drawChoice ? r.pendingDraw : playback?.stagedCard;
    const stagedImage = stagedCard ? '<img class="lesson-played-card' + (drawChoice || playback.drawnCard === stagedCard ? " drawn-card" : "") + '" src="' + photo(stagedCard) + '" alt="' + esc(card(stagedCard).name) + '">' : "";
    const board = '<div class="tabletop seated-table"><aside class="board-side opponent-side" aria-label="\u76F8\u624B\u306E\u53D6\u308A\u672D\u3068\u5F79">' + rivalTaken + rivalYaku + '</aside><div class="tabletop-main"><section class="board-opponent region-opponent" aria-label="' + (tutor ? "\u5148\u751F" : "\u76F8\u624B") + '\u306E\u624B\u672D\uFF08\u88CF\u5411\u304D\uFF09"><div class="opponent-label"><strong>' + (tutor ? "\u5148\u751F" : "\u76F8\u624B") + '\u306E\u624B\u672D</strong><span>\u4F0F\u305B\u672D</span></div><div class="opponent-backs" aria-label="\u76F8\u624B\u306E\u624B\u672D ' + r.hands[1].length + '\u679A">' + opponentBacks + "</div>" + (r.current === 1 ? stagedImage : "") + '</section><section class="board-zone board-field region-field" aria-label="\u5171\u6709\u306E\u5834\u672D"><div class="board-zone-caption"><strong>\u307F\u3093\u306A\u306E\u5834\u672D <small>' + fieldCount + "\u679A</small></strong><span>" + esc(choiceText ? "" : fieldCaption) + '</span></div><div class="landscape-fieldline"><div class="field-stock"><span class="stock-back" aria-hidden="true">' + (stockFace ? '<img class="stock-face' + (markedStock ? " drawn-card" : "") + '" src="' + photo(stockFace) + '" alt="' + esc(card(stockFace).name) + '">' : "") + "</span>" + (tutor ? "" : "<small>\u5C71\u672D " + r.stock.length + "\u679A</small>") + '</div><div class="fieldcards ' + (fieldCount > 8 ? "dense" : "") + '">' + field + '</div></div></section><section class="board-zone board-hand region-hand" aria-label="\u3042\u306A\u305F\u306E\u624B\u672D"><div class="board-zone-caption"><strong>\u3042\u306A\u305F\u306E\u624B\u672D</strong><span>' + (playback || choiceText || deciding || isEnd ? "" : r.current === 0 ? "\u3053\u3053\u304B\u30891\u679A\u9078\u307C\u3046" : "\u76F8\u624B\u306E\u756A\u3067\u3059") + '</span></div><div class="handcards">' + hand + "</div></section>" + (r.current === 0 ? stagedImage : "") + '</div><aside class="board-side player-side" aria-label="\u3042\u306A\u305F\u306E\u53D6\u308A\u672D\u3068\u5F79">' + playerTaken + playerYaku + '</aside><div class="table-edge-controls"><span class="round-score-plaque"><strong>' + roundLabel + " \xB7 \u7B2C" + (g.index + 1) + "\u5C40</strong><small>" + g.scores[0] + " \u5BFE " + g.scores[1] + "</small></span>" + backButton("home", "\u4E2D\u65AD\u30FB\u4FDD\u5B58", "edge-save-button") + "</div></div>";
    const hintButton = g.matchLesson === 7 && !isEnd && !playback ? '<button class="coach-detail" data-action="match-hint">\u5148\u751F\u306B\u805E\u304F</button>' : "";
    const playAction = playback || deciding ? "" : (lesson.action || "") + hintButton;
    const matchNotice = g.lessonNotices?.[0];
    const showingResult = isEnd && !tutor && !playback && !matchNotice;
    const matchHint = gameDialog === "match-hint";
    const guideOpen = playback?.lesson || !playback && (matchNotice || matchHint || deciding || showingResult || tutor && !teacherDismissed && !choiceText || gameDialog === "guide");
    let guidePanel = "";
    if (playback?.lesson) {
      const { cards } = playback.lesson;
      const visual = cards ? '<div class="teacher-visual teacher-role-cards">' + cards.map((id) => '<img src="' + photo(id) + '" alt="' + esc(card(id).name) + '">').join("") + "</div>" : "";
      guidePanel = teacherBubble(playback.lesson, visual, "advance-lesson-scene");
    } else if (!playback && matchNotice) {
      const example = matchNotice === "start" ? '<div class="teacher-stock-example"><img class="stock-frame-example drawn-card" src="' + photo("8-1") + '" alt="\u6C34\u8272\u306E\u67A0\u304C\u4ED8\u3044\u305F\u672D\u306E\u898B\u672C"></div>' : "";
      guidePanel = teacherBubble(MATCH_LESSON_NOTICES[matchNotice], example, "dismiss-match-notice");
    } else if (matchHint) {
      guidePanel = teacherBubble({ step: "3\u304B\u6708\u52DD\u8CA0", title: "\u5148\u751F\u306E\u30D2\u30F3\u30C8", description: (drawChoice ? STOCK_FRAME_EXPLANATION : "") + matchLessonHint(g) }, "", "close-dialog");
    } else if (showingResult) {
      guidePanel = resultPanel(g);
    } else if (deciding) {
      guidePanel = decisionPanel(g, lesson, hintButton);
    } else if (tutor && guideOpen) {
      const bubbleLesson = lesson.tapAction === "dismiss-teacher" ? { ...lesson, action: "" } : lesson;
      guidePanel = teacherBubble(bubbleLesson, tutorialRoleVisual(g, lesson), lesson.tapAction || "dismiss-teacher");
    } else if (guideOpen) {
      guidePanel = teacherBubble(
        { step: "\u5BFE\u5C40\u306E\u6848\u5185", title: "\u5148\u751F\u306E\u89E3\u8AAC", description: guide.full },
        '<div class="howto-mini"><strong>\u899A\u3048\u3066\u304A\u304F\u3053\u3068</strong><span>\u2460 \u624B\u672D\u304B\u30891\u679A\u9078\u3076</span><span>\u2461 \u540C\u3058\u6708\u306E\u5834\u672D\u306B\u5408\u308F\u305B\u308B</span><span>\u2462 \u5C71\u672D\u30821\u679A\u3081\u304F\u3089\u308C\u308B</span><span>\u2463 \u5F79\u304C\u3067\u304D\u305F\u3089\u52DD\u8CA0\u304B\u3053\u3044\u3053\u3044</span></div>',
        "close-dialog"
      );
    } else if (!gameDialog && (!isEnd || tutor) && playAction) {
      guidePanel = '<aside class="board-play-controls" aria-label="\u5BFE\u5C40\u306E\u64CD\u4F5C">' + playAction + "</aside>";
    }
    const boardNotice = choiceText + stockExplanation;
    const choiceNotice = boardNotice && (!matchHint || !drawChoice) ? '<p class="board-choice-notice" role="status">' + esc(boardNotice) + "</p>" : "";
    const opponent = tutor || g.matchLesson ? null : OPPONENTS[g.difficulty - 1];
    const opponentArt = opponent ? ' style="--opponent-board:url(' + opponent.board + ')"' : "";
    const legacyHeader = '<div class="gameheader" hidden><div class="round-badge">' + roundLabel + "<small>\u7B2C" + (g.index + 1) + '\u5C40</small></div><div class="game-score">' + g.scores[0] + " \u5BFE " + g.scores[1] + "</div></div>";
    return shell('<div class="play-layout seated-layout' + (g.beginner && !tutor && !g.matchLesson ? " beginner-match" : "") + (tutor ? " is-tutorial tutorial-engawa" : "") + (playback?.lesson ? " match-lesson-scene" : "") + '">' + legacyHeader + '<div class="game-board-wrap"' + opponentArt + (guideOpen ? " inert" : "") + ">" + board + "</div>" + choiceNotice + guidePanel + gameDialogView(g) + "</div>");
  }
  function credits() {
    return shell(headline("\u672D\u7D75\u306B\u3064\u3044\u3066", "CREDITS") + '<div class="panel"><h3>\u82B1\u672D48\u679A\u306E\u7D75\u67C4</h3><p class="story">Louie Mantia Jr. \u539F\u4F5C\u3001dotty-dev \u306B\u3088\u308B\u5F69\u8272\u7248\u3002CC BY-SA 4.0\uFF08\u8868\u793A\u30FB\u7D99\u627F\uFF09\u3002\u672D\u306E\u7D75\u306F\u6539\u5909\u305B\u305A\u306B\u540C\u68B1\u3057\u3066\u3044\u307E\u3059\u3002</p><p class="lead"><a href="https://github.com/dotty-dev/Hanafuda-Louie-Recolor" target="_blank" rel="noopener">\u753B\u50CF\u306E\u51FA\u5178</a><br><a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0 \u30E9\u30A4\u30BB\u30F3\u30B9</a></p><p class="lead">\u30E9\u30A4\u30BB\u30F3\u30B9\u5168\u6587\u306F\u30BD\u30FC\u30B9\u30B3\u30FC\u30C9\u306E docs/licenses \u306B\u53CE\u9332\u3057\u3066\u3044\u307E\u3059\u3002\u672C\u30A2\u30D7\u30EA\u306E\u6587\u7AE0\u3068UI\u306F\u72EC\u81EA\u5236\u4F5C\u3067\u3059\u3002</p><p class="lead">\u30DB\u30FC\u30E0\u770B\u677F\u306E\u66F8\u4F53\uFF1AYuji Syuku\uFF08Kinuta Font Factory\uFF0FThe Yuji Project Authors\uFF09\u3002SIL Open Font License 1.1\u3002\u30E9\u30A4\u30BB\u30F3\u30B9\u5168\u6587\u306F docs/licenses/YujiSyuku-OFL.txt \u306B\u53CE\u9332\u3057\u3066\u3044\u307E\u3059\u3002</p></div>');
  }
  function replacementConfirmView() {
    return '<div class="replace-game-backdrop"><section class="replace-game-dialog" role="alertdialog" aria-modal="true" aria-labelledby="replace-game-title" aria-describedby="replace-game-description"><span class="replace-game-kicker">NEW GAME</span><h2 id="replace-game-title">\u65B0\u3057\u3044\u5BFE\u5C40\u3092\u59CB\u3081\u307E\u3059\u304B\uFF1F</h2><p id="replace-game-description">\u4ECA\u306E\u5BFE\u5C40\u306E\u9014\u4E2D\u72B6\u614B\u306F\u7F6E\u304D\u63DB\u308F\u308A\u307E\u3059\u3002\u7D9A\u304D\u304B\u3089\u518D\u958B\u3059\u308B\u3053\u3068\u306F\u3067\u304D\u306A\u304F\u306A\u308A\u307E\u3059\u304C\u3001\u56F3\u9451\u30FB\u30AF\u30A4\u30BA\u306E\u8A18\u9332\u3084\u8A2D\u5B9A\u306F\u305D\u306E\u307E\u307E\u6B8B\u308A\u307E\u3059\u3002</p><div class="replace-game-actions">' + (screen === "free" ? backButton("close-replace-game", "\u8A2D\u5B9A\u306B\u623B\u308B") : "") + '<button type="button" class="replace-game-cancel" data-action="cancel-replace-game">\u4ECA\u306E\u5BFE\u5C40\u306B\u623B\u308B</button><button type="button" class="replace-game-confirm" data-action="confirm-replace-game">\u65B0\u3057\u304F\u59CB\u3081\u308B</button></div></section></div>';
  }
  function requestStartConfirmation(retry) {
    const game = savedMatch();
    if (!game || game.finished && !game.pendingYakuCelebration && !game.pendingTurnPresentation) return false;
    pendingStart = retry;
    render();
    $("app").querySelector(screen === "free" ? '[data-action="close-replace-game"]' : '[data-action="cancel-replace-game"]')?.focus();
    return true;
  }
  var teacherDismissed = false;
  function render() {
    teacherDismissed = false;
    renderScreen();
  }
  function renderScreen() {
    document.title = "\u306F\u3058\u3081\u3066\u306E\u82B1\u672D \u3053\u3044\u3053\u3044";
    $("app").innerHTML = {
      home,
      learn,
      free,
      cards: cardCollection,
      yaku: yakuGuide,
      columns,
      quiz: quizView,
      settings: settingsView,
      tutorial: tutorialMenu,
      game: gameView,
      credits
    }[screen]() + (pendingStart ? replacementConfirmView() : "");
    if (pendingStart) $("app").querySelector(".shell").inert = true;
    if (screen === "yaku") {
      const scroll = $("app").querySelector(".yaku-scroll");
      scroll.scrollTop = scroll.querySelector('[aria-current="true"]').offsetTop;
    }
    reloadForServiceWorkerUpdate();
  }
  function recordIfDone() {
    const g = state.active;
    if (g?.matchLesson) {
      if (g.finished) {
        state.completedMatchLessons ??= [];
        if (!state.completedMatchLessons.includes(g.matchLesson)) state.completedMatchLessons.push(g.matchLesson);
      }
      return;
    }
    if (g?.tutorial) {
      if (g.finished && !g.recorded) {
        if (g.tutorialStep === 6 && g.round.result?.winner === 0) recordPracticeStep(g.tutorialStep);
        if (!g.tutorialSingleStep) state.tutorialCompleted = true;
        g.recorded = true;
      }
      return;
    }
    settleBettingMatch(state.wallet, g);
    recordFinishedGame(state, g);
  }
  function showYakuCelebration({ tier, yakus, cards, actor = 0 }) {
    const dialog = document.createElement("dialog");
    dialog.className = "yaku-celebration yaku-celebration-" + tier;
    dialog.setAttribute("aria-labelledby", "yaku-celebration-title");
    dialog.innerHTML = '<div class="yaku-celebration-bubble">' + teacherAvatar() + '<h2 id="yaku-celebration-title">' + (actor === 1 ? "\u76F8\u624B\u306B\u5F79\u304C\u3067\u304D\u305F\uFF01" : "\u5F79\u304C\u3067\u304D\u305F\uFF01") + '</h2><ul class="yaku-celebration-names">' + yakus.map((yaku) => "<li>" + esc(yaku.name) + " <b>" + yaku.points + "\u70B9</b></li>").join("") + '</ul><div class="yaku-celebration-cards">' + cards.map((id) => '<img src="' + photo(id) + '" alt="' + esc(card(id).name) + '">').join("") + '</div><p class="yaku-celebration-prompt">\u753B\u9762\u3092\u30BF\u30C3\u30D7\u3057\u3066\u9032\u3080</p></div>' + (tier === 3 ? celebrationPetals() : "") + '<button type="button" class="yaku-celebration-skip" aria-label="\u5F79\u306E\u8868\u793A\u3092\u9589\u3058\u3066\u9032\u3080" autofocus></button>';
    document.body.append(dialog);
    const liftedCards = [...document.querySelectorAll((actor === 1 ? ".opponent-side" : ".player-side") + " .board-taken-card")].filter((button) => cards.includes(button.dataset.id));
    for (const button of liftedCards) button.classList.add("celebrating-card", "celebrating-card-" + tier);
    dialog.showModal();
    return new Promise((resolve) => {
      function dismiss() {
        dialog.close();
        dialog.remove();
        for (const button of liftedCards) button.classList.remove("celebrating-card", "celebrating-card-" + tier);
        resolve();
      }
      dialog.addEventListener("click", dismiss, { once: true });
      dialog.addEventListener("cancel", (event) => event.preventDefault());
    });
  }
  var TURN_MOTION = Object.freeze({
    scale: 1.5,
    handFlight: 640,
    drawFlight: 600,
    captureFlight: 550,
    reveal: 260,
    afterReveal: 420,
    afterPlay: 170,
    match: 260,
    afterCapture: 130
  });
  var MATCH_LESSON_HOLD = 1800;
  var MATCH_LESSON_YAKU_HOLD = 3200;
  function matchResolutionLesson(move) {
    const { actor, source, taken, card: id } = move;
    const who = actor === 0 ? "\u3042\u306A\u305F" : "\u76F8\u624B";
    const month = card(id).month + "\u6708";
    const origin = source === "stock" ? "\u5F15\u3044\u305F\u672D" : "\u51FA\u3057\u305F\u672D";
    if (taken.length === 4) return {
      title: "\u540C\u3058\u6708\u306E\u672D\u3092\u7DCF\u53D6\u308A",
      description: origin + "\u3082\u5834\u306E3\u679A\u3082" + month + "\u30024\u679A\u5168\u90E8\u304C" + who + "\u306E\u53D6\u308A\u672D\u306B\u306A\u308B\u3088\u3002"
    };
    if (taken.length) return {
      title: origin + "\u3068\u5834\u672D\u304C\u5408\u3046",
      description: month + "\u306E\u5834\u672D\u3068\u5408\u3063\u305F\u306D\u30022\u679A\u3068\u3082" + who + "\u306E\u53D6\u308A\u672D\u3060\u3088\u3002"
    };
    return { title: "\u672D\u304C\u5834\u306B\u6B8B\u308B", description: month + "\u306E\u5834\u672D\u304C\u306A\u3044\u306E\u3067\u3001" + origin + "\u306F\u5834\u306B\u6B8B\u308B\u3088\u3002" };
  }
  async function replayMoves(board, round, { teachingStock = false, matchLesson }) {
    const motion = TURN_MOTION;
    const controller = new AbortController();
    const { signal } = controller;
    const playback = {
      board,
      controller,
      matches: [],
      caption: "",
      stockCard: null,
      stagedCard: board.pendingDraw,
      drawnCard: board.pendingDraw,
      incoming: []
    };
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const overlay = document.createElement("div");
    overlay.className = "turn-motion-layer";
    overlay.setAttribute("aria-hidden", "true");
    const finish = async (animations) => {
      const abort = () => animations.forEach((animation) => animation.cancel());
      signal.addEventListener("abort", abort, { once: true });
      try {
        await Promise.all(animations.map((animation) => animation.finished));
      } catch {
      } finally {
        signal.removeEventListener("abort", abort);
      }
      return !signal.aborted;
    };
    const wait = (ms) => finish([overlay.animate([{}, {}], { duration: reducedMotion ? Math.min(ms, 35) : ms })]);
    const find = (selector) => document.querySelector(".play-layout " + selector);
    const fieldCard = (id) => find('.fieldcards [data-id="' + id + '"]');
    const bounds = (element) => element.getBoundingClientRect();
    const frame = (stage, caption) => {
      playback.caption = caption;
      renderScreen();
      find(".tabletop").dataset.turnStage = stage;
      find(".tabletop").dataset.turnActor = board.current;
    };
    let advanceRequested = false, readingTime;
    const setLesson = (lesson) => {
      if (matchLesson) {
        advanceRequested = false;
        playback.lesson = { step: "\u5BFE\u5C40\u30EC\u30C3\u30B9\u30F3", ...lesson };
      }
    };
    playback.advanceLesson = () => {
      advanceRequested = true;
      readingTime?.finish();
    };
    const holdLesson = async (ms) => {
      if (advanceRequested) return !signal.aborted;
      readingTime = overlay.animate([{}, {}], { duration: ms });
      const done = await finish([readingTime]);
      readingTime = null;
      return done;
    };
    function fly(id, from, to, duration) {
      const image = document.createElement("img");
      image.src = photo(id);
      image.className = "turn-flying-card" + (playback.drawnCard === id ? " drawn-card" : "");
      image.alt = "";
      const width = from.width;
      const height = from.height;
      Object.assign(image.style, { width: width + "px", height: height + "px" });
      overlay.append(image);
      const [fromX, fromY] = [from.x + width / 2, from.y + height / 2];
      const [toX, toY] = [to.x + to.width / 2, to.y + to.height / 2];
      const pose = (progress, scaleX, scaleY = scaleX) => "translate(" + (fromX + (toX - fromX) * progress - width / 2) + "px," + (fromY + (toY - fromY) * progress - height / 2) + "px) scale(" + scaleX + "," + scaleY + ")";
      const scale = motion.scale * Math.max(1, to.height / height);
      const frames = [
        { transform: pose(0, 1), offset: 0 },
        { transform: pose(0.18, scale), offset: 0.18 },
        { transform: pose(0.82, scale), offset: 0.82 },
        { transform: pose(1, to.width / width, to.height / height), offset: 1 }
      ];
      return image.animate(frames, { duration, easing: "cubic-bezier(.22,.61,.36,1)", fill: "both" });
    }
    async function landCard(id, origin, destination, duration) {
      if (reducedMotion) return true;
      const image = destination.querySelector("img") ?? destination;
      const flight = fly(id, origin, bounds(image), duration);
      destination.style.visibility = "hidden";
      if (!await finish([flight])) return false;
      destination.style.visibility = "";
      overlay.replaceChildren();
      return true;
    }
    const entries = round.log.slice(board.log.length);
    if (round.pendingDraw) entries.push({ actor: round.current, card: round.pendingDraw, taken: [], source: "stock", awaitingChoice: true });
    turnPresentation = playback;
    board.phase = "presentation";
    document.body.append(overlay);
    try {
      for (const move of entries) {
        const { actor, card: id, source, taken } = move;
        const who = actor === 0 ? "\u3042\u306A\u305F" : "\u76F8\u624B";
        const fromStock = source === "stock";
        board.current = actor;
        const alreadyStaged = fromStock && playback.stagedCard === id;
        if (fromStock && !alreadyStaged) {
          playback.lesson = null;
          board.stock.shift();
          playback.stockCard = id;
          setLesson({ title: who + "\u304C\u5C71\u672D\u3092\u5F15\u304F", description: card(id).name + "\u30921\u679A\u5F15\u3044\u305F\u3088\u3002" });
          const caption = who + "\u304C\u5C71\u672D\u3092\u3081\u304F\u3063\u305F";
          frame("stock-flip", caption);
          const face = find(".stock-face");
          if (!reducedMotion && !await finish([face.animate(
            [{ transform: "rotateY(90deg)" }, { transform: "rotateY(0deg)" }],
            { duration: motion.reveal, fill: "both" }
          )])) return false;
          playback.drawnCard = id;
          face.classList.add("drawn-card");
          if (!await wait(motion.afterReveal)) return false;
          if (teachingStock && actor === 0 && !board.log.some((event) => event.actor === 0 && event.source === "stock")) {
            playback.explainStock = true;
            frame("stock-explanation", caption);
            if (!await finish([overlay.animate([{}, {}], { duration: 1200 })])) return false;
            playback.explainStock = false;
          }
        }
        const kind = fromStock ? "stock" : "hand";
        const duration = fromStock ? motion.drawFlight : motion.handFlight;
        if (!alreadyStaged) {
          let sourceCard = find(".stock-face");
          if (!fromStock) {
            playback.lesson = null;
            frame("source", who + "\u306E\u756A");
            const hand = board.hands[actor];
            const handIndex = hand.indexOf(id);
            sourceCard = actor === 0 ? find('.handcards [data-id="' + id + '"] img') : find(".opponent-backs").children[handIndex];
            hand.splice(handIndex, 1);
            setLesson({ title: who + "\u304C\u624B\u672D\u3092\u51FA\u3059", description: card(id).name + "\u30921\u679A\u51FA\u3057\u305F\u3088\u3002" });
          }
          const origin = bounds(sourceCard);
          playback.stockCard = null;
          playback.stagedCard = id;
          frame(fromStock ? "stock-reveal" : "hand-play", who + (fromStock ? "\u304C\u5C71\u672D\u3092\u3081\u304F\u3063\u305F" : "\u304C\u624B\u672D\u3092\u51FA\u3057\u305F"));
          if (!await landCard(id, origin, find(".lesson-played-card"), duration)) return false;
          if (!await (matchLesson ? holdLesson(MATCH_LESSON_HOLD) : wait(motion.afterPlay))) return false;
          if (move.awaitingChoice) break;
        }
        if (matchLesson) setLesson(matchResolutionLesson(move));
        let played;
        if (taken.length) {
          playback.matches = taken.filter((cardId) => cardId !== id);
          frame(kind + "-match", "\u540C\u3058\u6708\u306E\u672D\u304C\u5408\u3063\u305F");
        } else {
          const origin = bounds(find(".lesson-played-card"));
          playback.stagedCard = null;
          board.field.push(id);
          frame(kind + "-stay", "\u672D\u304C\u5834\u306B\u6B8B\u308B");
          played = fieldCard(id);
          if (!await landCard(id, origin, played, duration)) return false;
        }
        if (taken.length) {
          if (!await (matchLesson ? holdLesson(MATCH_LESSON_HOLD) : wait(motion.match))) return false;
          const origins = taken.map((cardId) => bounds(cardId === id ? find(".lesson-played-card") : fieldCard(cardId).querySelector("img")));
          playback.stagedCard = null;
          const side = actor === 0 ? ".player-side" : ".opponent-side";
          const captureStage = kind + "-capture";
          const captureCaption = who + "\u306E\u53D6\u308A\u672D\u3078";
          playback.matches = [];
          board.field = board.field.filter((cardId) => !taken.includes(cardId));
          if (!reducedMotion) {
            playback.incoming = taken;
            frame(captureStage, captureCaption);
            const panel = bounds(find(side + " .board-taken-grid"));
            const flights = taken.map((cardId, index) => {
              const destination = bounds(find(side + ' .board-taken-card[data-id="' + cardId + '"] img'));
              const to = destination.bottom <= panel.bottom ? destination : { x: panel.x + panel.width / 2 - 10, y: panel.y, width: 20, height: 32 };
              return fly(cardId, origins[index], to, motion.captureFlight);
            });
            if (!await finish(flights)) return false;
            overlay.replaceChildren();
          }
          playback.incoming = [];
          playback.drawnCard = null;
          board.captured[actor].push(...taken);
          frame(captureStage + "-arrival", captureCaption);
          if (!await wait(motion.afterCapture)) return false;
        } else if (matchLesson) {
          if (!await holdLesson(MATCH_LESSON_HOLD)) return false;
          playback.drawnCard = null;
        } else if (fromStock) {
          playback.drawnCard = null;
          played.classList.remove("drawn-card");
        }
        const celebration = matchLesson && newYakuCelebration(board.captured[actor], taken);
        if (celebration) {
          const { yakus, cards } = celebration;
          setLesson({
            title: who + "\u306B" + yakus.map((yaku) => yaku.name).join("\u30FB") + "\u304C\u3067\u304D\u305F\u3088",
            description: yakus.map((yaku) => yaku.name + "\uFF08" + yaku.points + "\u70B9\uFF09").join("\u30FB"),
            cards
          });
          frame("lesson-yaku", "\u5F79\u304C\u3067\u304D\u305F");
          if (!await holdLesson(MATCH_LESSON_YAKU_HOLD)) return false;
          playback.lesson = null;
        }
      }
      return true;
    } finally {
      overlay.remove();
      if (turnPresentation === playback) turnPresentation = null;
    }
  }
  async function advanceAfterMove(logStart = null, turnLogStart = logStart, before = null) {
    const g = state.active;
    if (g.tutorial && logStart !== null && !g.tutorialLearning) {
      const taken = newCaptureIds(g.round.log, logStart, 0);
      if (taken.length) {
        g.tutorialLearning = { ids: taken };
        g.tutorialCaptureShown = true;
      }
    }
    if (g.matchLesson !== 6 && turnLogStart !== null && g.round.phase !== "draw-target") {
      const r2 = g.round;
      const celebration = newYakuCelebration(r2.captured[0], newCaptureIds(r2.log, turnLogStart, 0));
      if (celebration) g.pendingYakuCelebration = celebration;
    }
    selectedHand = null;
    if (before) g.pendingTurnPresentation = true;
    if (g.betting && g.finished) recordIfDone();
    save();
    const presentationOptions = { matchLesson: g.matchLesson === 6 };
    if (before && !await replayMoves(before, g.round, { ...presentationOptions, teachingStock: g.tutorial || g.matchLesson === 7 })) return;
    if (g.pendingYakuCelebration) {
      render();
      await showYakuCelebration(g.pendingYakuCelebration);
      delete g.pendingYakuCelebration;
    }
    const cpuBefore = !g.tutorialLearning && g.round.current === 1 && ["hand", "draw-target", "decision"].includes(g.round.phase) && !g.finished ? structuredClone(g.round) : null;
    if (cpuBefore) {
      runCpu(g, g.tutorial || g.matchLesson === 6 ? () => 0 : Math.random);
      if (!g.tutorial && g.matchLesson !== 6) {
        const r2 = g.round;
        const celebration = newYakuCelebration(r2.captured[1], newCaptureIds(r2.log, cpuBefore.log.length, 1));
        if (celebration) g.pendingYakuCelebration = { ...celebration, actor: 1 };
      }
    }
    if (g.tutorial && g.round.phase === "decision" && g.round.current === 0 && g.tutorialRoleStep === void 0) g.tutorialRoleStep = 0;
    if (g.tutorial) g.tutorialHint = "";
    const r = g.round;
    if (g.matchLesson === 6) {
      if (r.phase === "decision" && !g.lessonNotices.includes("decision")) g.lessonNotices.push("decision");
      if (g.finished && !g.lessonNotices.includes("end")) g.lessonNotices.push("end");
    }
    if (cpuBefore) g.pendingTurnPresentation = true;
    recordIfDone();
    save();
    if (cpuBefore && !await replayMoves(cpuBefore, r, presentationOptions)) return;
    delete g.pendingTurnPresentation;
    save();
    render();
    if (cpuBefore && g.pendingYakuCelebration) {
      await showYakuCelebration(g.pendingYakuCelebration);
      delete g.pendingYakuCelebration;
      save();
    }
    if (!g.matchLesson && (r.phase === "round-end" || r.phase === "game-end") && !r.adBreakProcessed) {
      r.adBreakProcessed = true;
      save();
      await ads.recordCommittedAction();
    }
  }
  function startFreeMatch({ length, beginner, difficulty, rate = null }, confirmed = false) {
    if (!confirmed && requestStartConfirmation(() => startFreeMatch({ length, beginner, difficulty, rate }, true))) return;
    state.active = createGame({ mode: "free", length, month: 1, beginner, difficulty });
    state.active.difficulty = difficulty;
    delete state.savedMatch;
    if (rate !== null) state.active.betting = { rate };
    selectedHand = null;
    gameDialog = null;
    gameDialogReturn = null;
    screen = "game";
    recordIfDone();
    save();
    render();
  }
  function startMatchLesson(step) {
    setPracticeGame(createMatchLesson(step, { difficulty: state.settings.difficulty }));
    selectedHand = null;
    gameDialog = null;
    gameDialogReturn = null;
    screen = "game";
    recordIfDone();
    save();
    render();
  }
  function startTeaching(step) {
    if (step === 0 || step === 3) {
      setPracticeGame(createTeachingGame());
      Object.assign(state.active, { tutorialStep: step, tutorialIntroVersion: TUTORIAL_INTRO_VERSION, tutorialSingleStep: true });
      if (step === 3) {
        state.active.tutorialIntroStep = TUTORIAL_QUIZ_PHASE;
        state.active.tutorialMonthQuestions = createTutorialMonthQuestions();
      }
      selectedHand = null;
      gameDialog = null;
      gameDialogReturn = null;
      screen = "game";
      save();
      render();
    } else showPracticeStep(step, true);
  }
  function showPracticeStep(step, standalone) {
    setPracticeGame(createPracticeGame(step, standalone));
    selectedHand = null;
    gameDialog = null;
    gameDialogReturn = null;
    screen = "game";
    save();
    render();
  }
  function advanceTutorial(step) {
    if (state.active.tutorialSingleStep) {
      finishPractice();
      render();
    } else showPracticeStep(step, false);
  }
  function hideToast() {
    clearTimeout(toast.timer);
    $("toast").hidden = true;
  }
  function toast(s) {
    notice = String(s);
    const el = $("toast");
    el.hidden = false;
    el.innerHTML = "<span>" + esc(notice) + '</span><button type="button" data-action="dismiss-toast" aria-label="\u8AAC\u660E\u3092\u9589\u3058\u308B">\u9589\u3058\u308B \xD7</button>';
    clearTimeout(toast.timer);
    toast.timer = setTimeout(hideToast, 4200);
  }
  async function clickAction(button, event) {
    const action = button.dataset.action, id = button.dataset.id, m = Number(button.dataset.month || 0), val = button.dataset.value;
    const purchaseDialog = button.closest?.(".ad-removal-dialog");
    if (purchaseDialog) {
      if (!ports.native || !purchaseDialog.open) return;
      const buy = purchaseDialog.querySelector('[data-action="buy-remove-ads"]');
      const restore = purchaseDialog.querySelector('[data-action="restore-remove-ads"]');
      if (![buy, restore].includes(button)) return;
      buy.disabled = restore.disabled = true;
      const status = purchaseDialog.querySelector('[role="status"]');
      try {
        if (button === buy) await ads.buyRemoveAds();
        else {
          await ads.restore();
          if (!ads.status().owned) status.textContent = "\u5FA9\u5143\u3067\u304D\u308B\u8CFC\u5165\u306F\u3042\u308A\u307E\u305B\u3093\u3002";
        }
      } catch (err) {
        status.textContent = err.message;
      } finally {
        buy.disabled = ads.status().owned;
        restore.disabled = false;
      }
      return;
    }
    const refillDialog = button.closest?.(".coin-refill-dialog");
    if (refillDialog) {
      if (!refillDialog.open) return;
      if (action === "coin-close") {
        refillDialog.close();
        return;
      }
      if (action === "coin-ad-back") {
        showCoinChoices(refillDialog);
        refillDialog.querySelector('[data-action="coin-ad"]').focus();
        return;
      }
      if (action === "coin-ad") {
        if (!ports.native) {
          showRefillAdPreview(refillDialog);
          return;
        }
        button.disabled = true;
        try {
          if (await ads.showRewarded()) {
            state.wallet.coins += AD_COINS;
            save();
            refillDialog.close();
            render();
          }
        } catch (err) {
          toast("\u5E83\u544A\u3092\u8868\u793A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002" + err.message);
        } finally {
          button.disabled = false;
        }
        return;
      }
      const today = localDay();
      if (action === "coin-free-claim") {
        if (!canRefillForFree(state.wallet, today)) return;
        state.wallet.lastFreeRefill = today;
      } else if (ports.native || action !== "coin-ad-claim") return;
      state.wallet.coins += action === "coin-free-claim" ? FREE_COINS : AD_COINS;
      save();
      refillDialog.close();
      render();
      return;
    }
    if (action === "swing-title") {
      swingTitle(button);
      return;
    }
    if (action === "opponent-line") {
      $("opponent-line").innerHTML = phrases(nextOpponentLine(matchOpponent()));
      return;
    }
    if (action === "ad-removal") {
      showAdRemoval(button);
      return;
    }
    if (action === "coin-refill") {
      openCoinRefill(button);
      return;
    }
    if (action === "dismiss-toast") {
      hideToast();
      return;
    }
    if (action === "close-replace-game") {
      pendingStart = null;
      render();
      $("app").querySelector('[data-action="start-free"]')?.focus();
      return;
    }
    if (action === "cancel-replace-game") {
      pendingStart = null;
      return clickAction({ dataset: { action: "resume" } }, event);
    }
    if (action === "confirm-replace-game") {
      const retry = pendingStart;
      pendingStart = null;
      if (retry) retry();
      return;
    }
    if (turnPresentation) {
      if (action === "advance-lesson-scene" && turnPresentation.lesson) {
        turnPresentation.advanceLesson();
        return;
      }
      if (action !== "home" || turnPresentation.lesson) return;
      turnPresentation.controller.abort();
      turnPresentation = null;
      screen = "home";
      selectedHand = null;
      gameDialog = null;
      gameDialogReturn = null;
      render();
      return;
    }
    if (screen === "game" && state.active?.lessonNotices?.length && action !== "dismiss-match-notice") return;
    if (screen === "game" && gameDialog === "match-hint" && action !== "close-dialog") return;
    if (action === "dismiss-teacher") {
      teacherDismissed = true;
      renderScreen();
      return;
    }
    if (state.active?.tutorial && screen === "game") {
      if (!state.active.tutorialIntroDone && !["tutorial-next", "tutorial-continue", "tutorial-month-answer", "tutorial-month-next", "home", "tutorial-menu"].includes(action)) return;
      if (state.active.tutorialLearning && !["tutorial-learned", "home"].includes(action)) return;
      if (!state.active.tutorialLearning && state.active.round.phase === "decision" && state.active.round.current === 0) {
        const step = state.active.tutorialRoleStep ?? 0;
        if (step === 0 && !["tutorial-role-points", "show-taken", "close-dialog", "home"].includes(action)) return;
        if (step === 1 && !["tutorial-decision", "tutorial-finish-practice", "show-taken", "close-dialog", "home"].includes(action)) return;
        if (step >= 2 && !["stop", "koi", "home"].includes(action)) return;
      }
    }
    if (action === "dismiss-match-notice") {
      state.active.lessonNotices.shift();
      save();
      renderScreen();
      return;
    }
    if (action === "match-hint") {
      gameDialog = "match-hint";
      renderScreen();
      return;
    }
    if (action === "show-guide") {
      gameDialog = "guide";
      gameDialogReturn = null;
      render();
      return;
    }
    if (action === "show-taken") {
      gameDialog = button.dataset.who === "0" ? "mine" : "opp";
      gameDialogReturn = null;
      renderScreen();
      return;
    }
    if (action === "close-dialog") {
      gameDialog = gameDialogReturn;
      gameDialogReturn = null;
      renderScreen();
      return;
    }
    if (action === "home") {
      screen = "home";
      selectedHand = null;
      gameDialog = null;
      gameDialogReturn = null;
    } else if (action === "resume") {
      if (canResumeGame(state.savedMatch)) {
        restoreSavedMatch();
        save();
      }
      screen = "game";
      if (state.active?.pendingTurnPresentation || state.active?.pendingYakuCelebration || state.active?.round.current === 1 && !state.active.finished && !state.active.tutorialLearning) {
        await advanceAfterMove();
        return;
      }
    } else if (action === "learn") {
      screen = "learn";
    } else if (action === "free") {
      screen = "free";
      bettingRate = 0;
      matchLength = 3;
    } else if (action === "cards") {
      studyMonth = 1;
      selectedCard = null;
      screen = "cards";
    } else if (action === "yaku") {
      screen = "yaku";
    } else if (action === "quiz" || action === "quiz-restart") {
      screen = "quiz";
      startQuiz();
    } else if (action === "columns") {
      studyMonth = 1;
      screen = "columns";
    } else if (action === "settings") {
      if (screen !== "settings" && screen !== "credits") settingsReturn = screen;
      screen = "settings";
    } else if (action === "settings-back") {
      screen = settingsReturn;
    } else if (action === "credits") {
      event.preventDefault();
      screen = "credits";
    } else if (action === "study-month") {
      studyMonth = Number(val);
      selectedCard = null;
    } else if (action === "study-prev") {
      studyMonth = studyMonth === 1 ? 12 : studyMonth - 1;
      selectedCard = null;
    } else if (action === "study-next") {
      studyMonth = studyMonth === 12 ? 1 : studyMonth + 1;
      selectedCard = null;
    } else if (action === "yaku-prev") {
      selectedYakuIndex = (selectedYakuIndex + YAKU_TABLE.length - 1) % YAKU_TABLE.length;
    } else if (action === "yaku-next") {
      selectedYakuIndex = (selectedYakuIndex + 1) % YAKU_TABLE.length;
    } else if (action === "start-tutorial") {
      if (screen !== "tutorial") tutorialReturn = screen;
      screen = "tutorial";
    } else if (action === "tutorial-menu") {
      screen = "tutorial";
    } else if (action === "tutorial-back") {
      screen = tutorialReturn;
    } else if (action === "finish-match-lesson") {
      finishPractice();
    } else if (action === "match-lesson") {
      startMatchLesson(Number(val));
      return;
    } else if (action === "tutorial-intro") {
      startTeaching(0);
      return;
    } else if (action === "tutorial-step") {
      startTeaching(Number(val));
      return;
    } else if (action === "tutorial-free") {
      startFreeMatch({ length: 3, beginner: true, difficulty: 1 });
      return;
    } else if (action === "tutorial-month-answer") {
      const g = state.active;
      if (!g?.tutorial || g.tutorialIntroStep !== TUTORIAL_QUIZ_PHASE) throw Error("Month quiz inactive");
      const correct = tutorialMonthQuestion(g)?.month;
      if (correct === void 0) throw Error("Quiz already completed");
      if (g.tutorialMonthFeedback) throw Error("Acknowledge the previous quiz feedback first");
      if (m !== correct) {
        g.tutorialHint = m + "\u6708\u306E\u672D\u3068\u306F\u9055\u3046\u306D\u3002\u82B1\u306E\u7D75\u3092\u3088\u304F\u898B\u3066\u3001\u3082\u3046\u4E00\u5EA6\u9078\u3093\u3067\u307F\u3088\u3046\u3002";
        render();
        return;
      }
      g.tutorialMonthFeedback = { month: m };
      g.tutorialHint = "";
      save();
    } else if (action === "tutorial-month-next") {
      const g = state.active;
      if (!g?.tutorial || g.tutorialIntroStep !== TUTORIAL_QUIZ_PHASE || !g.tutorialMonthFeedback) throw Error("No month quiz feedback to acknowledge");
      g.tutorialMonthAnswers ??= [];
      g.tutorialMonthAnswers.push(g.tutorialMonthFeedback.month);
      g.tutorialMonthFeedback = null;
      g.tutorialHint = "";
      save();
    } else if (action === "tutorial-next") {
      const g = state.active;
      if (!g?.tutorial || g.tutorialIntroDone || !INTRO_LESSONS[g.tutorialIntroStep]) throw Error("Tutorial is not at the introduction");
      if (g.tutorialIntroStep === INTRO_LESSONS.length - 1) {
        state.tutorialIntroCompleted = true;
        finishPractice();
      } else {
        g.tutorialIntroStep++;
        save();
      }
    } else if (action === "tutorial-finish-practice") {
      const g = state.active;
      decide(g, "stop");
      recordPracticeStep(g.tutorialStep);
      advanceTutorial(g.tutorialStep + 1);
      return;
    } else if (action === "tutorial-role-points") {
      if (!state.active?.tutorial || state.active.round.phase !== "decision") throw Error("Role lesson inactive");
      state.active.tutorialRoleStep = 1;
      state.active.tutorialHint = "";
      save();
    } else if (action === "tutorial-decision") {
      if (!state.active?.tutorial || state.active.round.phase !== "decision") throw Error("Decision lesson inactive");
      state.active.tutorialRoleStep = 2;
      state.active.tutorialHint = "";
      save();
    } else if (action === "tutorial-learned") {
      if (!state.active?.tutorialLearning) throw new Error("No capture lesson to acknowledge");
      state.active.tutorialLearning = null;
      save();
      await advanceAfterMove();
      return;
    } else if (action === "tutorial-continue") {
      const g = state.active;
      if (!g?.tutorial || g.tutorialIntroStep !== TUTORIAL_QUIZ_PHASE || tutorialMonthQuestion(g)) throw Error("3\u554F\u306E\u30AF\u30A4\u30BA\u3092\u7D42\u3048\u3066\u304F\u3060\u3055\u3044");
      showPracticeStep(3, g.tutorialSingleStep);
      return;
    } else if (action === "match-length") {
      matchLength = Number(val);
    } else if (action === "betting-rate") {
      bettingRate = Number(val);
      if (bettingRate && !state.wallet) {
        state.wallet = createWallet();
        save();
      }
      if (bettingRate && state.wallet.coins < MIN_COINS) {
        render();
        openCoinRefill($("app").querySelector('[data-action="coin-refill"]'));
        return;
      }
    } else if (action === "start-free") {
      const rate = bettingRate || null;
      if (rate !== null && state.wallet.coins < MIN_COINS) {
        openCoinRefill(button);
        return;
      }
      startFreeMatch({
        length: matchLength,
        beginner: state.settings.beginner,
        difficulty: rate === null ? freeDifficulty : BETTING_DIFFICULTY.get(rate),
        rate
      });
      return;
    } else if (action === "zoom-yaku-card") {
      openCardZoom(id, button);
      return;
    } else if (action === "inspect") {
      if (state.active?.tutorial && screen === "game") {
        const r = state.active.round;
        state.active.tutorialHint = r.phase === "draw-target" ? "\u5C71\u672D\u304B\u3089\u51FA\u305F\u672D\u3068\u3001\u540C\u3058\u6708\u306E\u5834\u672D\u3092\u9078\u307C\u3046\u3002" : selectedHand ? "\u3053\u306E\u672D\u306F\u9055\u3046\u6708\u3060\u306D\u3002\u9078\u3093\u3060\u672D\u3068\u540C\u3058\u6708\u306E\u5834\u672D\u3092\u63A2\u3057\u3066\u307F\u3088\u3046\u3002" : "\u307E\u305A\u306F\u81EA\u5206\u306E\u624B\u672D\u304B\u3089\u4E00\u679A\u9078\u3093\u3067\u307F\u3088\u3046\u3002";
        render();
        return;
      }
      selectedCard = id;
      if (!state.seen.includes(id)) {
        state.seen.push(id);
        save();
      }
      if (screen === "cards") {
        render();
        openCardZoom(id, $("app").querySelector('[data-id="' + id + '"]'));
        return;
      }
      if (screen === "game") {
        gameDialogReturn = ["mine", "opp"].includes(gameDialog) ? gameDialog : null;
        gameDialog = "card";
      }
    } else if (action === "select-hand") {
      if (state.active?.round.phase === "hand" && state.active.round.current === 0) {
        selectedHand = id;
        selectedCard = id;
        if (state.active.tutorial) state.active.tutorialHint = "";
        if (!state.seen.includes(id)) {
          state.seen.push(id);
          save();
        }
      } else if (state.active?.tutorial) return;
      else {
        selectedCard = id;
        gameDialog = "card";
      }
    } else if (action === "play-selected") {
      if (!selectedHand) throw new Error("\u5148\u306B\u624B\u672D\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044");
      if (state.active.tutorialLabelStage === 1) state.active.tutorialLabelStage = 2;
      const logStart = state.active.round.log.length;
      const before = structuredClone(state.active.round);
      playHand(state.active, selectedHand);
      await advanceAfterMove(logStart, logStart, before);
      return;
    } else if (action === "field-target") {
      if (!selectedHand) throw new Error("\u624B\u672D\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044");
      if (state.active.tutorialLabelStage === 1) state.active.tutorialLabelStage = 2;
      const logStart = state.active.round.log.length;
      const before = structuredClone(state.active.round);
      playHand(state.active, selectedHand, id);
      await advanceAfterMove(logStart, logStart, before);
      return;
    } else if (action === "draw-target") {
      const { log, pendingHand } = state.active.round;
      const logStart = log.length;
      const before = structuredClone(state.active.round);
      chooseDrawMatch(state.active, id);
      await advanceAfterMove(logStart, pendingHand ? logStart - 1 : logStart, before);
      return;
    } else if (action === "stop" || action === "koi") {
      if (state.active.tutorial && action === "koi") state.active.tutorialLabelStage = 1;
      decide(state.active, action);
      await advanceAfterMove();
      return;
    } else if (action === "next-round") {
      nextRound(state.active);
      await advanceAfterMove();
      return;
    } else if (action === "beginner") {
      state.settings.beginner = val === "true";
      save();
    } else if (action === "sound") {
      state.settings.sound = val === "true";
      save();
    } else if (action === "narration") {
      state.settings.narration = val;
      save();
    } else if (action === "difficulty") {
      freeDifficulty = Number(val);
    } else if (action === "answer" && quiz?.answered === null) {
      quiz.answered = quiz.kind === "month" ? m : id;
      state.quiz.total++;
      quizSession.answered++;
      if (quiz.answered === (quiz.kind === "month" ? card(quiz.cardId).month : quiz.answer)) {
        state.quiz.correct++;
        quizSession.correct++;
      }
      save();
    } else if (action === "next-quiz") {
      newQuiz();
    }
    render();
  }
  var enteringHomePlaque = false;
  document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action],[data-teacher-tap]");
    if (!control || control.disabled || enteringHomePlaque) return;
    const button = control.dataset.action ? control : { dataset: { action: control.dataset.teacherTap } };
    const activate = async () => {
      const animatePlaque = document.documentElement.dataset.hanafudaPreview === "stage5" && control.matches(".scene-home .engawa-board") && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!animatePlaque) return clickAction(button, event);
      enteringHomePlaque = true;
      try {
        await control.animate([
          { rotate: "0deg" },
          { rotate: "2deg", offset: 0.33 },
          { rotate: "-1deg", offset: 0.72 },
          { rotate: "0deg" }
        ], { duration: 420, easing: "ease-in-out" }).finished.catch(() => {
        });
        if (!control.isConnected) return;
        await clickAction(button, event);
        $("app").querySelector(".shell:not(.scene-home) .scene-body")?.classList.add("entrance-arrival");
      } finally {
        enteringHomePlaque = false;
      }
    };
    void activate().catch((err) => {
      console.error("[hanafuda]", err);
      toast("\u30A8\u30E9\u30FC: " + err.message);
    });
  });
  function syncHomeViewport() {
    const viewport = window.visualViewport;
    if (viewport?.scale !== 1) return;
    const root = document.documentElement.style;
    root.setProperty("--home-width", viewport.width + "px");
    root.setProperty("--home-height", viewport.height + "px");
    root.setProperty("--home-left", viewport.offsetLeft + "px");
    root.setProperty("--home-top", viewport.offsetTop + "px");
  }
  window.addEventListener("resize", syncHomeViewport);
  window.addEventListener("pageshow", syncHomeViewport);
  window.visualViewport?.addEventListener("resize", syncHomeViewport);
  window.visualViewport?.addEventListener("scroll", syncHomeViewport);
  syncHomeViewport();
  render();
  void ads.initialize().catch((e) => {
    console.error("AdMob init", e);
    toast("\u5E83\u544A\u306E\u521D\u671F\u5316\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u5BFE\u5C40\u306F\u7D9A\u3051\u3089\u308C\u307E\u3059\u3002");
  });
  function reloadForServiceWorkerUpdate() {
    if (!serviceWorkerUpdatePending || serviceWorkerReloadStarted || screen !== "home" || document.visibilityState !== "visible") return;
    serviceWorkerReloadStarted = true;
    location.reload();
  }
  if (!ports.native && "serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) {
    const workers = navigator.serviceWorker;
    let controller = workers.controller;
    workers.addEventListener("controllerchange", () => {
      const next = workers.controller;
      if (!next || next === controller) return;
      if (controller) serviceWorkerUpdatePending = true;
      controller = next;
      reloadForServiceWorkerUpdate();
    });
    const registration = workers.register("./sw.js", { updateViaCache: "none" }).catch((err) => {
      console.warn("Offline cache is unavailable", err);
    });
    let updateInProgress = false;
    async function checkForServiceWorkerUpdate() {
      if (updateInProgress || serviceWorkerReloadStarted) return;
      updateInProgress = true;
      try {
        const reg = await registration;
        await reg?.update();
      } catch (err) {
        console.warn("Update check unavailable", err);
      } finally {
        updateInProgress = false;
      }
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      reloadForServiceWorkerUpdate();
      void checkForServiceWorkerUpdate();
    });
    void checkForServiceWorkerUpdate();
  }
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
