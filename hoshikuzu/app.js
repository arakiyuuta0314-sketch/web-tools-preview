(() => {
  // src/generated/app-config.mjs
  var app_config_default = {
    "schemaVersion": 1,
    "appId": "com.example.hoshikuzu",
    "appName": "\u661F\u5C51\u306E\u52C7\u8005",
    "storageNamespace": "hoshikuzu-yuusha",
    "privacyPolicyUrl": "https://arakiyuuta0314-sketch.github.io/app-legal-pages/privacy/",
    "supportUrl": "https://arakiyuuta0314-sketch.github.io/",
    "contactEmail": "yuta.room.info@gmail.com",
    "ads": {
      "mode": "test",
      "appId": "ca-app-pub-3940256099942544~1458002511",
      "bannerId": "ca-app-pub-3940256099942544/2934735716",
      "interstitialId": "ca-app-pub-3940256099942544/4411468910",
      "minCompletedActions": 10,
      "cooldownMs": 6e5
    },
    "purchase": {
      "enabled": false,
      "removeAdsProductId": ""
    }
  };

  // src/lib/config.mjs
  var idPattern = /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9-]*){2,}$/;
  var adAppPattern = /^ca-app-pub-(\d{16})~\d{10}$/;
  var adUnitPattern = /^ca-app-pub-(\d{16})\/\d{10}$/;
  var isNonempty = (value) => typeof value === "string" && value.trim().length > 0;
  function invariant(ok, message2) {
    if (!ok) throw new Error("Config: " + message2);
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
    const ads = config.ads;
    invariant(ads && ["disabled", "test", "production"].includes(ads.mode), "ads.mode must be disabled, test or production");
    invariant(Number.isSafeInteger(ads.minCompletedActions) && ads.minCompletedActions > 0, "ads.minCompletedActions must be a positive integer");
    invariant(Number.isSafeInteger(ads.cooldownMs) && ads.cooldownMs >= 0, "ads.cooldownMs must be a nonnegative integer");
    if (ads.mode !== "disabled") {
      const app = adAppPattern.exec(ads.appId || "");
      const banner = adUnitPattern.exec(ads.bannerId || "");
      const interstitial = adUnitPattern.exec(ads.interstitialId || "");
      invariant(app && banner && interstitial, "three valid AdMob IDs required");
      invariant(app[1] === banner[1] && app[1] === interstitial[1], "AdMob publisher IDs do not match");
      invariant(ads.bannerId !== ads.interstitialId, "AdMob ad units must be distinct");
      if (ads.mode === "test") invariant(app[1] === "3940256099942544", "test mode must use Google demo IDs");
      if (ads.mode === "production") invariant(app[1] !== "3940256099942544", "Google demo IDs forbidden in production");
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

  // src/lib/storage.mjs
  function createJsonStore({ store, key, createInitial, validate }) {
    if (!store || typeof store.getItem !== "function" || typeof store.setItem !== "function") throw new TypeError("Storage API required");
    if (!key || typeof key !== "string") throw new TypeError("Unique storage key required");
    if (typeof createInitial !== "function" || typeof validate !== "function") throw new TypeError("Store schema and initializer required");
    const parse2 = (raw) => {
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
        const raw = store.getItem(key);
        return raw === null ? createInitial() : parse2(raw);
      },
      write(value) {
        validate(value);
        const serialized = JSON.stringify(value);
        store.setItem(key, serialized);
        return value;
      },
      importJson(raw) {
        const value = parse2(raw);
        this.write(value);
        return value;
      },
      exportJson() {
        return JSON.stringify(this.read(), null, 2);
      },
      clear() {
        store.removeItem(key);
      }
    };
  }

  // src/game/data/catalog.json
  var catalog_default = {
    schema: 1,
    monsters: [
      {
        id: "m01",
        name: "\u30DD\u30E8\u30F3",
        hp: 9,
        attack: 4,
        defense: 1,
        speed: 3,
        exp: 3,
        gold: 3,
        area: "field",
        status: null
      },
      {
        id: "m02",
        name: "\u30E2\u30B0\u30FC\u30EB",
        hp: 12,
        attack: 5,
        defense: 1,
        speed: 4,
        exp: 4,
        gold: 4,
        area: "field",
        status: null
      },
      {
        id: "m03",
        name: "\u30C4\u30CE\u30A6\u30B5\u30AE",
        hp: 15,
        attack: 6,
        defense: 2,
        speed: 5,
        exp: 5,
        gold: 6,
        area: "field",
        status: null
      },
      {
        id: "m04",
        name: "\u30C9\u30AF\u30AC\u30A8\u30EB",
        hp: 17,
        attack: 7,
        defense: 2,
        speed: 6,
        exp: 7,
        gold: 7,
        area: "cave",
        status: "poison"
      },
      {
        id: "m05",
        name: "\u30C8\u30B2\u30DE\u30EB",
        hp: 20,
        attack: 8,
        defense: 3,
        speed: 7,
        exp: 8,
        gold: 9,
        area: "cave",
        status: null
      },
      {
        id: "m06",
        name: "\u30B4\u30D6\u30EA\u30F3",
        hp: 28,
        attack: 11,
        defense: 3,
        speed: 8,
        exp: 17,
        gold: 23,
        area: "cave",
        status: null
      },
      {
        id: "m07",
        name: "\u30B3\u30DC\u30EB\u30C8",
        hp: 32,
        attack: 9,
        defense: 4,
        speed: 9,
        exp: 80,
        gold: 54,
        area: "east",
        status: null
      },
      {
        id: "m08",
        name: "\u30B5\u30F3\u30C9\u30D0\u30C3\u30C8",
        hp: 35,
        attack: 9,
        defense: 4,
        speed: 10,
        exp: 90,
        gold: 63,
        area: "east",
        status: null
      },
      {
        id: "m09",
        name: "\u30C9\u30AF\u30B5\u30BD\u30EA",
        hp: 40,
        attack: 10,
        defense: 5,
        speed: 11,
        exp: 100,
        gold: 72,
        area: "east",
        status: null
      },
      {
        id: "m10",
        name: "\u30B9\u30B1\u30EB\u30C8\u30F3",
        hp: 43,
        attack: 11,
        defense: 5,
        speed: 12,
        exp: 110,
        gold: 81,
        area: "east",
        status: null
      },
      {
        id: "m11",
        name: "\u30BE\u30F3\u30D3",
        hp: 40,
        attack: 14,
        defense: 5,
        speed: 13,
        exp: 120,
        gold: 90,
        area: "ruins",
        status: null
      },
      {
        id: "m12",
        name: "\u30DB\u30ED\u30A6\u30B4\u30FC\u30B9\u30C8",
        hp: 36,
        attack: 9,
        defense: 6,
        speed: 14,
        exp: 130,
        gold: 99,
        area: "ruins",
        status: null
      },
      {
        id: "m13",
        name: "\u30DF\u30A4\u30E9\u7537",
        hp: 56,
        attack: 18,
        defense: 6,
        speed: 15,
        exp: 140,
        gold: 108,
        area: "ruins",
        status: null
      },
      {
        id: "m14",
        name: "\u30B7\u30EB\u30D0\u30FC\u30A6\u30EB\u30D5",
        hp: 64,
        attack: 20,
        defense: 7,
        speed: 16,
        exp: 150,
        gold: 117,
        area: "ruins",
        status: null
      },
      {
        id: "m15",
        name: "\u30AA\u30FC\u30AF",
        hp: 72,
        attack: 22,
        defense: 7,
        speed: 17,
        exp: 160,
        gold: 126,
        area: "ruins",
        status: null
      },
      {
        id: "m16",
        name: "\u30EA\u30B6\u30FC\u30C9\u30DE\u30F3",
        hp: 80,
        attack: 24,
        defense: 8,
        speed: 18,
        exp: 170,
        gold: 135,
        area: "onyx",
        status: null
      },
      {
        id: "m17",
        name: "\u30DF\u30CE\u30BF\u30A6\u30ED\u30B9",
        hp: 88,
        attack: 26,
        defense: 8,
        speed: 19,
        exp: 180,
        gold: 144,
        area: "onyx",
        status: null
      },
      {
        id: "m18",
        name: "\u30D8\u30C6\u30ED\u30D3\u30FC\u30B9\u30C8",
        hp: 96,
        attack: 28,
        defense: 9,
        speed: 20,
        exp: 190,
        gold: 153,
        area: "onyx",
        status: null
      },
      {
        id: "m19",
        name: "\u30E4\u30F3\u30B0\u30C9\u30E9\u30B4\u30F3",
        hp: 104,
        attack: 30,
        defense: 9,
        speed: 21,
        exp: 200,
        gold: 162,
        area: "onyx",
        status: null
      },
      {
        id: "m20",
        name: "\u30EF\u30A4\u30D0\u30FC\u30F3",
        hp: 112,
        attack: 32,
        defense: 10,
        speed: 22,
        exp: 210,
        gold: 171,
        area: "onyx",
        status: null
      },
      {
        id: "m21",
        name: "\u30EC\u30C3\u30B5\u30FC\u30C7\u30FC\u30E2\u30F3",
        hp: 120,
        attack: 34,
        defense: 10,
        speed: 23,
        exp: 220,
        gold: 180,
        area: "onyx",
        status: null
      },
      {
        id: "m22",
        name: "\u30BD\u30A6\u30EB\u30EA\u30FC\u30D1\u30FC",
        hp: 128,
        attack: 36,
        defense: 11,
        speed: 24,
        exp: 230,
        gold: 189,
        area: "onyx",
        status: null
      },
      {
        id: "m23",
        name: "\u30B0\u30EC\u30FC\u30BF\u30FC\u30C7\u30FC\u30E2\u30F3",
        hp: 136,
        attack: 38,
        defense: 11,
        speed: 25,
        exp: 240,
        gold: 198,
        area: "onyx",
        status: null
      },
      {
        id: "m24",
        name: "\u30A8\u30F3\u30B7\u30A7\u30F3\u30C8\u30C9\u30E9\u30B4\u30F3",
        hp: 144,
        attack: 40,
        defense: 12,
        speed: 26,
        exp: 250,
        gold: 207,
        area: "onyx",
        status: null
      }
    ],
    spells: [
      {
        id: "sp1",
        name: "\u30CE\u30A8\u30EB",
        kind: "heal",
        level: 1,
        mp: 3,
        power: 14
      },
      {
        id: "sp2",
        name: "\u30CE\u30A8\u30E9",
        kind: "heal",
        level: 7,
        mp: 10,
        power: 55
      },
      {
        id: "sp3",
        name: "\u30D5\u30EC\u30E0",
        kind: "damage",
        level: 2,
        mp: 4,
        power: 13
      },
      {
        id: "sp4",
        name: "\u30D5\u30EC\u30E0\u30E9",
        kind: "damage",
        level: 8,
        mp: 12,
        power: 52
      },
      {
        id: "sp5",
        name: "\u30E2\u30EB\u30CD",
        kind: "sleep",
        level: 3,
        mp: 5,
        power: 2
      },
      {
        id: "sp6",
        name: "\u30D5\u30A6\u30A4\u30F3",
        kind: "silence",
        level: 5,
        mp: 4,
        power: 2
      },
      {
        id: "sp7",
        name: "\u30DF\u30B9\u30C8\u30E9",
        kind: "ward",
        level: 8,
        mp: 6,
        power: 0
      },
      {
        id: "sp8",
        name: "\u30EB\u30FC\u30E1\u30F3",
        kind: "light",
        level: 3,
        mp: 2,
        power: 0
      },
      {
        id: "sp9",
        name: "\u30DD\u30EB\u30BF",
        kind: "return",
        level: 9,
        mp: 8,
        power: 0
      },
      {
        id: "sp10",
        name: "\u30A8\u30B0\u30EC\u30B9",
        kind: "escape",
        level: 4,
        mp: 5,
        power: 0
      }
    ],
    equipment: {
      weapons: [
        {
          id: "wood",
          name: "\u6728\u307C\u3046",
          attack: 0,
          price: 0
        },
        {
          id: "copper",
          name: "\u9285\u306E\u5263",
          attack: 3,
          price: 45
        },
        {
          id: "iron",
          name: "\u9244\u306E\u5263",
          attack: 6,
          price: 140
        },
        {
          id: "knight",
          name: "\u9A0E\u58EB\u306E\u5263",
          attack: 11,
          price: 450
        },
        {
          id: "mythril",
          name: "\u30DF\u30B9\u30EA\u30EB\u30BD\u30FC\u30C9",
          attack: 18,
          price: 1300
        },
        {
          id: "thunder",
          name: "\u84BC\u96F7\u306E\u5263",
          attack: 28,
          price: 3800
        },
        {
          id: "hero",
          name: "\u52C7\u8005\u306E\u5927\u5263",
          attack: 42,
          price: 0
        }
      ],
      armors: [
        {
          id: "cloth",
          name: "\u5E03\u306E\u670D",
          defense: 0,
          price: 0
        },
        {
          id: "leather",
          name: "\u76AE\u306E\u93A7",
          defense: 3,
          price: 40
        },
        {
          id: "chain",
          name: "\u9396\u304B\u305F\u3073\u3089",
          defense: 7,
          price: 130
        },
        {
          id: "iron",
          name: "\u9244\u306E\u93A7",
          defense: 12,
          price: 350
        },
        {
          id: "steel",
          name: "\u92FC\u306E\u93A7",
          defense: 18,
          price: 850
        },
        {
          id: "mythril",
          name: "\u30DF\u30B9\u30EA\u30EB\u30E1\u30A4\u30EB",
          defense: 27,
          price: 2400
        }
      ],
      shields: [
        {
          id: "woodshield",
          name: "\u6728\u306E\u76FE",
          defense: 0,
          price: 0
        },
        {
          id: "leathershield",
          name: "\u76AE\u306E\u76FE",
          defense: 2,
          price: 35
        },
        {
          id: "ironshield",
          name: "\u9244\u306E\u76FE",
          defense: 6,
          price: 180
        },
        {
          id: "mythrilshield",
          name: "\u30DF\u30B9\u30EA\u30EB\u306E\u76FE",
          defense: 13,
          price: 1800
        }
      ],
      accessories: [
        {
          id: "power",
          name: "\u529B\u306E\u6307\u8F2A",
          attack: 4,
          price: 150
        },
        {
          id: "guard",
          name: "\u5B88\u308A\u306E\u8155\u8F2A",
          defense: 4,
          price: 460
        },
        {
          id: "wind",
          name: "\u98A8\u306E\u30DA\u30F3\u30C0\u30F3\u30C8",
          speed: 4,
          price: 300
        },
        {
          id: "star-orb",
          name: "\u661F\u306E\u30AA\u30FC\u30D6",
          mpDiscount: 1
        }
      ]
    },
    items: [
      {
        id: "potion",
        name: "\u30DD\u30FC\u30B7\u30E7\u30F3",
        price: 12,
        effect: "hp",
        amount: 25
      },
      {
        id: "great-potion",
        name: "\u30B0\u30EC\u30FC\u30C8\u30DD\u30FC\u30B7\u30E7\u30F3",
        price: 52,
        effect: "hp",
        amount: 80
      },
      {
        id: "antidote",
        name: "\u89E3\u6BD2\u85AC",
        price: 14,
        effect: "poison"
      },
      {
        id: "smoke",
        name: "\u3051\u3080\u308A\u7389",
        price: 35,
        effect: "escape"
      },
      {
        id: "iron-key",
        name: "\u9244\u306E\u9375",
        price: 0,
        effect: "gate"
      }
    ],
    boss: {
      id: "vold",
      name: "\u9B54\u738B\u30F4\u30A9\u30EB\u30C9",
      hp: 190,
      attack: 31,
      defense: 14,
      speed: 24,
      exp: 600,
      gold: 0,
      area: "onyx",
      status: null
    }
  };

  // src/game/data/maps.json
  var maps_default = {
    schema: 1,
    maps: {
      castle: {
        id: "castle",
        name: "\u30A2\u30EB\u30C6\u30EA\u30A2\u57CE",
        width: 15,
        height: 12,
        tiles: [
          [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            7,
            1,
            1,
            1,
            7,
            7,
            1,
            7,
            7,
            1,
            1,
            1,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            8,
            8,
            8,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            8,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            8,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            8,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            8,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            8,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            8,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            8,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            8,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            5,
            1,
            1,
            1,
            1,
            1,
            1,
            1
          ]
        ],
        spawn: {
          x: 7,
          y: 9
        },
        portals: [
          {
            x: 7,
            y: 11,
            to: "field",
            entry: {
              x: 5,
              y: 6
            }
          }
        ],
        npcs: [
          {
            id: "king",
            name: "\u30A2\u30EB\u30C9\u738B",
            x: 7,
            y: 2,
            kind: "king"
          },
          {
            id: "refugee",
            name: "\u907F\u96E3\u3057\u3066\u304D\u305F\u4EBA",
            x: 10,
            y: 7,
            kind: "refugee"
          },
          {
            id: "castle-guard",
            name: "\u5B88\u5099\u5175",
            x: 3,
            y: 7,
            kind: "guard"
          }
        ],
        objects: [
          {
            id: "raider",
            x: 9,
            y: 8,
            kind: "raider",
            name: "\u9B54\u7269"
          },
          {
            id: "sword",
            x: 6,
            y: 3,
            kind: "sword",
            name: "\u53E4\u3044\u5263"
          }
        ]
      },
      field: {
        id: "field",
        name: "\u30A2\u30EB\u30C6\u30EA\u30A2\u8857\u9053",
        width: 35,
        height: 19,
        tiles: [
          [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            0,
            4,
            4,
            4,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            4,
            4,
            4,
            0,
            4,
            4,
            4,
            0,
            0,
            0,
            0,
            0,
            4,
            4,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            4,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            5,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            5,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            4,
            4,
            4,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            3,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            3,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            4,
            0,
            4,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            3,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            3,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            3,
            0,
            0,
            0,
            0,
            0,
            5,
            0,
            0,
            0,
            0,
            0,
            3,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            3,
            0,
            0,
            0,
            0,
            0,
            3,
            0,
            0,
            0,
            0,
            0,
            3,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            6,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            4,
            4,
            4,
            4,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            4,
            4,
            4,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1
          ]
        ],
        spawn: {
          x: 5,
          y: 6
        },
        portals: [
          {
            x: 5,
            y: 5,
            to: "castle",
            entry: {
              x: 7,
              y: 10
            }
          },
          {
            x: 11,
            y: 8,
            to: "leaf",
            entry: {
              x: 8,
              y: 10
            }
          },
          {
            x: 17,
            y: 5,
            to: "cave",
            entry: {
              x: 11,
              y: 15
            }
          },
          {
            x: 32,
            y: 7,
            to: "sailun",
            entry: {
              x: 9,
              y: 12
            }
          },
          {
            x: 32,
            y: 15,
            to: "onyx",
            entry: {
              x: 12,
              y: 19
            }
          }
        ],
        npcs: [],
        objects: [
          {
            id: "gate",
            x: 23,
            y: 10,
            kind: "gate",
            name: "\u9244\u306E\u9580"
          },
          {
            id: "east-sign",
            x: 29,
            y: 9,
            kind: "sign",
            name: "\u30BB\u30A4\u30EB\u30F3\u306E\u9053\u6A19"
          },
          {
            id: "star-field",
            x: 33,
            y: 13,
            kind: "star",
            name: "\u5CA9\u9670\u306E\u661F\u5C51"
          },
          {
            id: "onyx-barrier",
            kind: "onyxBarrier",
            name: "\u9ED2\u66DC\u57CE\u306E\u95C7\u306E\u7D50\u754C",
            x: 32,
            y: 15
          }
        ]
      },
      leaf: {
        id: "leaf",
        name: "\u30EA\u30FC\u30D5\u30A1\u306E\u753A",
        width: 17,
        height: 13,
        tiles: [
          [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            1,
            1,
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            1,
            1,
            1,
            7,
            1
          ],
          [
            1,
            7,
            1,
            1,
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            1,
            1,
            1,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            8,
            8,
            8,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            5,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1
          ]
        ],
        spawn: {
          x: 8,
          y: 10
        },
        portals: [
          {
            x: 8,
            y: 12,
            to: "field",
            entry: {
              x: 11,
              y: 9
            }
          }
        ],
        npcs: [
          {
            id: "elder",
            name: "\u753A\u306E\u4E16\u8A71\u5F79",
            x: 8,
            y: 4,
            kind: "elder"
          },
          {
            id: "helper",
            name: "\u907F\u96E3\u6C11\u3092\u52A9\u3051\u308B\u5973\u6027",
            x: 5,
            y: 6,
            kind: "helper"
          },
          {
            id: "inn",
            name: "\u5BBF\u5C4B\u306E\u4E3B\u4EBA",
            x: 3,
            y: 9,
            kind: "inn"
          },
          {
            id: "shop",
            name: "\u9053\u5177\u5C4B",
            x: 13,
            y: 9,
            kind: "shop"
          }
        ],
        objects: [
          {
            id: "star-leaf",
            x: 14,
            y: 10,
            kind: "star",
            name: "\u53E4\u3044\u6728\u7BB1"
          }
        ]
      },
      cave: {
        id: "cave",
        name: "\u8A66\u7DF4\u306E\u6D1E\u7A9F",
        width: 23,
        height: 17,
        tiles: [
          [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            9,
            9,
            10,
            10,
            10,
            10,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            10,
            10,
            10,
            10,
            10,
            9,
            10,
            10,
            10,
            10,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            5,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1
          ]
        ],
        spawn: {
          x: 11,
          y: 15
        },
        portals: [
          {
            x: 11,
            y: 16,
            to: "field",
            entry: {
              x: 17,
              y: 6
            }
          }
        ],
        npcs: [
          {
            id: "watchman",
            name: "\u907F\u96E3\u8DEF\u306E\u898B\u5F35\u308A",
            x: 19,
            y: 3,
            kind: "watchman"
          }
        ],
        objects: [
          {
            id: "cave-boss",
            x: 17,
            y: 5,
            kind: "caveBoss",
            name: "\u30B4\u30D6\u30EA\u30F3\u306E\u982D\u76EE"
          },
          {
            id: "cave-chest",
            x: 3,
            y: 11,
            kind: "chest",
            name: "\u6728\u306E\u5B9D\u7BB1"
          },
          {
            id: "mural",
            x: 3,
            y: 4,
            kind: "mural",
            name: "\u53E4\u3044\u58C1\u753B"
          },
          {
            id: "star-cave",
            x: 5,
            y: 13,
            kind: "star",
            name: "\u5CA9\u306E\u9699\u9593"
          }
        ]
      },
      sailun: {
        id: "sailun",
        name: "\u6E2F\u753A\u30BB\u30A4\u30EB\u30F3",
        width: 19,
        height: 15,
        tiles: [
          [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            5,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            1
          ],
          [
            1,
            3,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            3,
            1
          ],
          [
            1,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            1
          ],
          [
            1,
            3,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            3,
            1
          ],
          [
            1,
            3,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            3,
            1
          ],
          [
            1,
            3,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            3,
            1
          ],
          [
            1,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            1
          ],
          [
            1,
            3,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            3,
            1
          ],
          [
            1,
            3,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            3,
            1
          ],
          [
            1,
            3,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            3,
            1
          ],
          [
            1,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            1
          ],
          [
            1,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            1
          ],
          [
            1,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            3,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1
          ]
        ],
        portals: [
          {
            x: 9,
            y: 14,
            to: "field",
            entry: {
              x: 32,
              y: 8
            }
          },
          {
            x: 9,
            y: 1,
            to: "ruins",
            entry: {
              x: 10,
              y: 16
            }
          }
        ],
        npcs: [
          {
            id: "front-soldier",
            kind: "frontSoldier",
            name: "\u524D\u7DDA\u304B\u3089\u623B\u3063\u305F\u5175\u58EB",
            x: 5,
            y: 5
          },
          {
            id: "riona",
            kind: "riona",
            name: "\u5360\u3044\u5E2B\u30EA\u30AA\u30CA",
            x: 14,
            y: 5
          },
          {
            id: "lighthouse",
            kind: "lighthouse",
            name: "\u706F\u53F0\u5B88",
            x: 9,
            y: 3
          },
          {
            id: "sailun-inn",
            kind: "inn",
            name: "\u6E2F\u306E\u5BBF\u5C4B",
            x: 3,
            y: 10
          },
          {
            id: "sailun-shop",
            kind: "shop",
            name: "\u6E2F\u306E\u9053\u5177\u5C4B",
            x: 15,
            y: 10
          }
        ],
        objects: [
          {
            id: "star-sailun",
            kind: "star",
            name: "\u5009\u5EAB\u306E\u661F\u5C51",
            x: 16,
            y: 3
          },
          {
            id: "sailun-iron-key",
            kind: "ironKeyChest",
            name: "\u53E4\u3044\u5009\u5EAB\u306E\u5B9D\u7BB1",
            x: 3,
            y: 3
          }
        ]
      },
      ruins: {
        id: "ruins",
        name: "\u6C88\u9ED9\u306E\u907A\u8DE1",
        width: 23,
        height: 18,
        tiles: [
          [
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            10,
            10,
            10,
            9,
            10,
            10,
            10,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            9,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            9,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10
          ]
        ],
        portals: [
          {
            x: 10,
            y: 17,
            to: "sailun",
            entry: {
              x: 9,
              y: 2
            }
          }
        ],
        npcs: [],
        objects: [
          {
            id: "ruins-switch-a",
            kind: "switchA",
            name: "\u6771\u306E\u77F3\u76E4",
            x: 18,
            y: 12
          },
          {
            id: "ruins-switch-b",
            kind: "switchB",
            name: "\u897F\u306E\u77F3\u76E4",
            x: 4,
            y: 12
          },
          {
            id: "ruins-guardian",
            kind: "ruinsBoss",
            name: "\u907A\u8DE1\u306E\u5B88\u8B77\u8005",
            x: 11,
            y: 4
          },
          {
            id: "dawn-mirror",
            kind: "mirror",
            name: "\u9ECE\u660E\u306E\u93E1\u306E\u53F0\u5EA7",
            x: 11,
            y: 2
          },
          {
            id: "ruins-chest",
            kind: "chest",
            name: "\u907A\u8DE1\u306E\u5B9D\u7BB1",
            x: 18,
            y: 4
          },
          {
            id: "ruins-optional-door",
            kind: "optionalDoor",
            name: "\u53E4\u3044\u9375\u6249",
            x: 5,
            y: 4
          },
          {
            id: "ruins-optional-chest",
            kind: "ironChest",
            name: "\u5C01\u5370\u3055\u308C\u305F\u5B9D\u7BB1",
            x: 4,
            y: 3
          },
          {
            id: "star-ruins",
            kind: "star",
            name: "\u661F\u306E\u6B20\u7247",
            x: 3,
            y: 3
          }
        ]
      },
      onyx: {
        id: "onyx",
        name: "\u9ED2\u66DC\u57CE\u30AA\u30CB\u30AD\u30B9",
        width: 25,
        height: 21,
        tiles: [
          [
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            9,
            10,
            10,
            10,
            10,
            10,
            9,
            10,
            10,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            9,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            8,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            8,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            8,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            8,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            8,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            8,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            8,
            9,
            9,
            9,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            10,
            10,
            10,
            10,
            10,
            8,
            10,
            10,
            10,
            10,
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            8,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            8,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            8,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            9,
            10
          ],
          [
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            9,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10,
            10
          ]
        ],
        portals: [
          {
            x: 12,
            y: 20,
            to: "field",
            entry: {
              x: 32,
              y: 16
            }
          }
        ],
        npcs: [],
        objects: [
          {
            id: "onyx-left-rune",
            kind: "onyxRuneA",
            name: "\u897F\u306E\u9ED2\u66DC\u7D0B\u7AE0",
            x: 4,
            y: 12
          },
          {
            id: "onyx-right-rune",
            kind: "onyxRuneB",
            name: "\u6771\u306E\u9ED2\u66DC\u7D0B\u7AE0",
            x: 20,
            y: 12
          },
          {
            id: "onyx-star-altar",
            kind: "onyxForge",
            name: "\u661F\u306E\u796D\u58C7",
            x: 12,
            y: 13
          },
          {
            id: "onyx-seal",
            kind: "onyxSeal",
            name: "\u9ED2\u66DC\u306E\u5C01\u5370\u6249",
            x: 12,
            y: 8
          },
          {
            id: "onyx-vold",
            kind: "onyxBoss",
            name: "\u9B54\u738B\u30F4\u30A9\u30EB\u30C9",
            x: 12,
            y: 2
          },
          {
            id: "onyx-armor",
            kind: "onyxChest",
            name: "\u53E4\u3044\u6B66\u5177\u306E\u5B9D\u7BB1",
            x: 3,
            y: 15
          },
          {
            id: "onyx-shield",
            kind: "onyxChest",
            name: "\u53E4\u3044\u6B66\u5177\u306E\u5B9D\u7BB1",
            x: 21,
            y: 15
          },
          {
            id: "onyx-supplies",
            kind: "onyxChest",
            name: "\u56DE\u5FA9\u85AC\u306E\u5B9D\u7BB1",
            x: 19,
            y: 3
          },
          {
            id: "onyx-inscription",
            kind: "onyxInscription",
            name: "\u9ED2\u66DC\u306E\u77F3\u7891",
            x: 11,
            y: 18
          }
        ]
      }
    }
  };

  // src/game/core.mjs
  var CATALOG = catalog_default;
  var MAPS = maps_default.maps;
  var STAGES = ["S00", "S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "CLEAR"];
  var STAGE_GOALS = {
    S00: "\u57CE\u306B\u5165\u308A\u8FBC\u3093\u3060\u9B54\u7269\u304B\u3089\u907F\u96E3\u8005\u3092\u5B88\u308B",
    S01: "\u30A2\u30EB\u30C9\u738B\u3068\u8A71\u3057\u3001\u65C5\u7ACB\u3061\u3092\u6C7A\u3081\u308B",
    S02: "\u30EA\u30FC\u30D5\u30A1\u306E\u753A\u3067\u907F\u96E3\u8DEF\u306B\u3064\u3044\u3066\u805E\u304F",
    S03: "\u8A66\u7DF4\u306E\u6D1E\u7A9F\u3067\u884C\u65B9\u4E0D\u660E\u306E\u898B\u5F35\u308A\u3092\u6551\u3046",
    S04: "\u8857\u9053\u306E\u6771\u306B\u3042\u308B\u9244\u306E\u9580\u3092\u958B\u3051\u308B",
    S05: "\u6E2F\u753A\u30BB\u30A4\u30EB\u30F3\u3067\u7D50\u754C\u30FB\u9ECE\u660E\u306E\u93E1\u30FB\u907A\u8DE1\u306E\u60C5\u5831\u3092\u96C6\u3081\u308B",
    S06: "\u6C88\u9ED9\u306E\u907A\u8DE1\u306E\u4ED5\u639B\u3051\u3092\u89E3\u304D\u3001\u9ECE\u660E\u306E\u93E1\u3092\u63A2\u3059",
    S07: "\u6771\u306E\u9ED2\u66DC\u57CE\u30AA\u30CB\u30AD\u30B9\u3067\u3001\u9ECE\u660E\u306E\u93E1\u3068\u5263\u3092\u4F7F\u3044\u7D50\u754C\u3092\u89E3\u304F",
    S08: "\u9ED2\u66DC\u57CE\u306E\u661F\u5263\u306E\u796D\u58C7\u3068\u4E8C\u3064\u306E\u7D0B\u7AE0\u3092\u8ABF\u3079\u3001\u6700\u5965\u306E\u9B54\u738B\u3092\u5012\u3059",
    S09: "\u9B54\u738B\u3092\u5012\u3057\u305F\u3002\u30A2\u30EB\u30C6\u30EA\u30A2\u57CE\u306E\u30A2\u30EB\u30C9\u738B\u306B\u5831\u544A\u3059\u308B",
    CLEAR: "\u661F\u5C51\u306E\u52C7\u8005\u306E\u65C5\u306F\u5B8C\u7D50\u3057\u305F\u3002\u5404\u5730\u3092\u81EA\u7531\u306B\u8A2A\u306D\u3089\u308C\u308B"
  };
  var itemById = (id) => catalog_default.items.find((x) => x.id === id);
  var monsterById = (id) => catalog_default.monsters.find((x) => x.id === id) || (catalog_default.boss?.id === id ? catalog_default.boss : void 0);
  var spellById = (id) => catalog_default.spells.find((x) => x.id === id);
  var clone = (value) => JSON.parse(JSON.stringify(value));
  var int = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
  var plain = (value) => !!value && typeof value === "object" && !Array.isArray(value);
  var fail = (msg) => {
    throw new Error("RPG\u30BB\u30FC\u30D6\u30C7\u30FC\u30BF\u7570\u5E38: " + msg);
  };
  function validateWorld() {
    if (maps_default.schema !== 1 || catalog_default.schema !== 1) throw Error("\u30C7\u30FC\u30BF\u5B9A\u7FA9\u306E\u30D0\u30FC\u30B8\u30E7\u30F3\u304C\u4E0D\u6B63");
    if (catalog_default.monsters.length !== 24 || catalog_default.spells.length !== 10 || catalog_default.boss?.id !== "vold") throw Error("\u30E2\u30F3\u30B9\u30BF\u30FC/\u546A\u6587/\u9B54\u738B\u306E\u4EF6\u6570\u4E0D\u4E00\u81F4");
    if (Object.keys(MAPS).length !== 7) throw Error("\u30DE\u30C3\u30D77\u30A8\u30EA\u30A2\u306E\u4EF6\u6570\u4E0D\u4E00\u81F4");
    if (catalog_default.equipment.weapons.length !== 7 || catalog_default.equipment.armors.length !== 6 || catalog_default.equipment.shields.length !== 4 || catalog_default.equipment.accessories.length !== 4) throw Error("\u88C5\u5099\u54C1\u4EF6\u6570\u4E0D\u4E00\u81F4");
    for (const m of Object.values(MAPS)) {
      if (m.tiles.length !== m.height || m.tiles.some((row) => row.length !== m.width)) throw Error("\u30DE\u30C3\u30D7\u5BF8\u6CD5: " + m.id);
      if (!m.portals.every((p) => MAPS[p.to] && within(m, p.x, p.y) && within(MAPS[p.to], p.entry.x, p.entry.y))) throw Error("\u30DE\u30C3\u30D7\u51FA\u53E3\u5B9A\u7FA9: " + m.id);
      if (![...m.npcs, ...m.objects].every((e) => within(m, e.x, e.y))) throw Error("\u914D\u7F6E\u5EA7\u6A19: " + m.id);
    }
  }
  function within(map, x, y) {
    return int(x, 0, map.width - 1) && int(y, 0, map.height - 1);
  }
  var allowed = (arr, v) => arr.includes(v);
  function validateState(s) {
    if (!plain(s) || s.version !== 1 || !allowed(STAGES, s.stage)) fail("\u9032\u884C\u30D0\u30FC\u30B8\u30E7\u30F3");
    if (typeof s.name !== "string" || !s.name.trim() || s.name.length > 12) fail("\u4E3B\u4EBA\u516C\u540D");
    if (!plain(s.player) || !int(s.player.level, 1, 50) || !int(s.player.exp, 0, 9999999) || !int(s.player.gold, 0, 9999999) || !int(s.player.hp, 0, 9999) || !int(s.player.mp, 0, 9999) || !allowed(["normal", "poison"], s.player.status)) fail("\u30B9\u30C6\u30FC\u30BF\u30B9");
    if (!plain(s.pos) || !MAPS[s.pos.map] || !within(MAPS[s.pos.map], s.pos.x, s.pos.y) || !allowed(["up", "down", "left", "right"], s.pos.facing)) fail("\u4F4D\u7F6E");
    if (!plain(s.inventory) || Object.keys(s.inventory).some((k) => !allowed(["potion", "great-potion", "antidote", "smoke", "iron-key"], k)) || Object.values(s.inventory).some((v) => !int(v, 0, 999))) fail("\u6240\u6301\u54C1");
    if (!plain(s.equipment)) fail("\u88C5\u5099");
    for (const [type, key] of [["weapons", "weapon"], ["armors", "armor"], ["shields", "shield"], ["accessories", "accessory"]]) {
      if (s.equipment[key] !== null && !catalog_default.equipment[type].some((e) => e.id === s.equipment[key])) fail("\u88C5\u5099 " + key);
    }
    if (!Array.isArray(s.owned) || s.owned.some((e) => !Object.values(catalog_default.equipment).flat().some((x) => x.id === e) && !["armor:iron", "armor:mythril"].includes(e)) || new Set(s.owned).size !== s.owned.length) fail("\u6240\u6301\u88C5\u5099");
    if (!Array.isArray(s.relics) || s.relics.some((id) => !["beginning-sword", "dawn-mirror"].includes(id)) || new Set(s.relics).size !== s.relics.length) fail("\u5927\u5207\u306A\u3082\u306E");
    if (!plain(s.flags) || ["openingDefeated", "swordGiven", "watchmanRescued", "caveBossDefeated", "gateOpen"].some((k) => typeof s.flags[k] !== "boolean")) fail("\u30A4\u30D9\u30F3\u30C8\u30D5\u30E9\u30B0");
    for (const k of ["frontIntel", "mirrorIntel", "ruinsIntel", "switchA", "switchB", "ruinsBossDefeated", "mirrorObtained", "optionalDoorOpen"]) if (s.flags[k] !== void 0 && typeof s.flags[k] !== "boolean") fail("\u7B2C\u4E8C\u5E55\u30D5\u30E9\u30B0 " + k);
    if (STAGES.indexOf(s.stage) >= 6 && !["frontIntel", "mirrorIntel", "ruinsIntel"].every((k) => s.flags[k] === true)) fail("\u60C5\u5831\u53CE\u96C6");
    if (STAGES.indexOf(s.stage) >= 7 && (!s.flags.mirrorObtained || !s.relics.includes("dawn-mirror"))) fail("\u9ECE\u660E\u306E\u93E1");
    for (const k of ["onyxBarrierOpen", "onyxRuneA", "onyxRuneB", "swordAwakened", "onyxSealOpen", "bossDefeated", "endingSeen"])
      if (s.flags[k] !== void 0 && typeof s.flags[k] !== "boolean") fail("\u7B2C\u4E09\u5E55\u30D5\u30E9\u30B0 " + k);
    if (s.flags.onyxBarrierOpen && (!s.flags.mirrorObtained || !s.relics.includes("beginning-sword"))) fail("\u7D50\u754C\u89E3\u9664\u6761\u4EF6");
    if (STAGES.indexOf(s.stage) >= 8 && !s.flags.onyxBarrierOpen) fail("\u9ED2\u66DC\u57CE\u672A\u958B\u653E");
    if (s.flags.swordAwakened && !s.owned.includes("hero")) fail("\u661F\u5263\u306E\u899A\u9192");
    if (s.flags.onyxSealOpen && (!s.flags.onyxRuneA || !s.flags.onyxRuneB || !s.flags.swordAwakened)) fail("\u9ED2\u66DC\u57CE\u306E\u5C01\u5370");
    if (s.flags.bossDefeated && (!s.flags.onyxSealOpen || !s.flags.onyxBarrierOpen)) fail("\u9B54\u738B\u8A0E\u4F10\u6761\u4EF6");
    if (STAGES.indexOf(s.stage) >= 9 && !s.flags.bossDefeated) fail("\u9B54\u738B\u8A0E\u4F10\u672A\u5B8C\u4E86");
    if (s.stage === "CLEAR" !== (s.flags.endingSeen === true)) fail("\u30A8\u30F3\u30C7\u30A3\u30F3\u30B0\u72B6\u614B");
    if (!Array.isArray(s.chests) || s.chests.some((x) => typeof x !== "string") || new Set(s.chests).size !== s.chests.length || !Array.isArray(s.stars) || s.stars.some((x) => !["star-leaf", "star-cave", "star-field", "star-sailun", "star-ruins"].includes(x)) || new Set(s.stars).size !== s.stars.length) fail("\u5B9D\u7BB1/\u661F\u5C51");
    if (s.owned.includes("star-orb") && s.stars.length !== 5) fail("\u661F\u306E\u30AA\u30FC\u30D6\u53D6\u5F97\u6761\u4EF6");
    if (!plain(s.defeated) || Object.entries(s.defeated).some(([id, v]) => !monsterById(id) || !int(v, 0, 9999))) fail("\u56F3\u9451");
    if (s.flags.gateOpen && (STAGES.indexOf(s.stage) < 5 || !s.flags.watchmanRescued)) fail("\u9580\u30D5\u30E9\u30B0");
    if (s.flags.watchmanRescued && !s.flags.caveBossDefeated) fail("\u898B\u5F35\u308A\u30D5\u30E9\u30B0");
    if (s.flags.mirrorObtained === true && !s.flags.ruinsBossDefeated) fail("\u93E1\u306E\u5B88\u8B77\u8005");
    if (s.flags.ruinsBossDefeated === true && (!s.flags.switchA || !s.flags.switchB)) fail("\u907A\u8DE1\u306E\u4ED5\u639B\u3051");
    if (STAGES.indexOf(s.stage) >= 2 && !s.flags.swordGiven) fail("\u5263\u306E\u53D7\u9818");
    if (s.flags.swordGiven !== s.relics.includes("beginning-sword")) fail("\u53E4\u3044\u5263\u306E\u6240\u6301");
    if (STAGES.indexOf(s.stage) >= 1 && !s.flags.openingDefeated) fail("\u57CE\u306E\u521D\u6226\u95D8");
    if (s.flags.gateOpen && !s.flags.watchmanRescued) fail("\u9580\u306E\u958B\u901A\u6761\u4EF6");
    if (s.player.hp > maxHp(s.player.level) || s.player.mp > maxMp(s.player.level)) fail("HP/MP\u4E0A\u9650");
  }
  var maxHp = (lv) => 36 + (lv - 1) * 8;
  var maxMp = (lv) => 14 + (lv - 1) * 3;
  function stats(s) {
    const e = s.equipment;
    const w = catalog_default.equipment.weapons.find((x) => x.id === e.weapon);
    const a = catalog_default.equipment.armors.find((x) => x.id === e.armor);
    const sh = catalog_default.equipment.shields.find((x) => x.id === e.shield);
    const ac = catalog_default.equipment.accessories.find((x) => x.id === e.accessory);
    return {
      attack: 7 + s.player.level * 2 + (w?.attack || 0) + (ac?.attack || 0),
      defense: 2 + s.player.level + (a?.defense || 0) + (sh?.defense || 0) + (ac?.defense || 0),
      speed: 8 + s.player.level + (ac?.speed || 0),
      maxHp: maxHp(s.player.level),
      maxMp: maxMp(s.player.level)
    };
  }
  function createState(name = "\u30A2\u30EC\u30F3") {
    name = String(name).trim();
    const s = {
      version: 1,
      name,
      stage: "S00",
      player: { level: 1, exp: 0, gold: 70, hp: 36, mp: 14, status: "normal" },
      pos: { map: "castle", x: 7, y: 9, facing: "up" },
      inventory: { potion: 3, "great-potion": 0, antidote: 1, smoke: 1, "iron-key": 0 },
      equipment: { weapon: "wood", armor: "cloth", shield: "woodshield", accessory: null },
      owned: ["wood", "cloth", "woodshield"],
      relics: [],
      flags: { openingDefeated: false, swordGiven: false, watchmanRescued: false, caveBossDefeated: false, gateOpen: false, frontIntel: false, mirrorIntel: false, ruinsIntel: false, switchA: false, switchB: false, ruinsBossDefeated: false, mirrorObtained: false, optionalDoorOpen: false, onyxBarrierOpen: false, onyxRuneA: false, onyxRuneB: false, swordAwakened: false, onyxSealOpen: false, bossDefeated: false, endingSeen: false },
      chests: [],
      stars: [],
      defeated: {}
    };
    validateState(s);
    return s;
  }
  function tileBlocked(s, map, x, y) {
    if (!within(map, x, y)) return true;
    const tile = map.tiles[y][x];
    if ([1, 2, 10].includes(tile)) return true;
    if (tile === 6 && !s.flags.gateOpen) return true;
    return false;
  }
  function entityAt(s, map, x, y) {
    const npc = map.npcs.find((e) => e.x === x && e.y === y);
    if (npc) return npc;
    return map.objects.find((e) => e.x === x && e.y === y && !(e.kind === "raider" && s.flags.openingDefeated) && !(e.kind === "caveBoss" && s.flags.caveBossDefeated) && !(e.kind === "gate" && s.flags.gateOpen) && !(e.kind === "chest" && s.chests.includes(e.id)) && !(e.kind === "star" && s.stars.includes(e.id)) && !(e.kind === "ruinsBoss" && s.flags.ruinsBossDefeated) && !(e.kind === "optionalDoor" && s.flags.optionalDoorOpen) && !(e.kind === "ironChest" && s.chests.includes(e.id)) && !(e.kind === "onyxBarrier" && s.flags.onyxBarrierOpen) && !(e.kind === "onyxSeal" && s.flags.onyxSealOpen) && !(e.kind === "onyxBoss" && s.flags.bossDefeated) && !(e.kind === "onyxChest" && s.chests.includes(e.id))) || null;
  }
  function move(s, dx, dy) {
    if (Math.abs(dx) + Math.abs(dy) !== 1) throw Error("Invalid movement");
    const next = clone(s);
    const direction2 = dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up";
    next.pos.facing = direction2;
    const map = MAPS[s.pos.map], x = s.pos.x + dx, y = s.pos.y + dy;
    if (!within(map, x, y)) return { state: next, kind: "blocked", message: "\u3053\u308C\u4EE5\u4E0A\u306F\u9032\u3081\u306A\u3044\u3002" };
    const obstacle = entityAt(s, map, x, y);
    if (obstacle) return { state: next, kind: "entity", entity: obstacle, message: obstacle.name + "\u304C\u3044\u308B\u3002\u6C7A\u5B9A\u3067\u8A71\u3059\uFF0F\u8ABF\u3079\u308B\u3002" };
    if (tileBlocked(s, map, x, y)) return { state: next, kind: "blocked", message: map.tiles[y][x] === 6 ? "\u9244\u306E\u9580\u306F\u9589\u3056\u3055\u308C\u3066\u3044\u308B\u3002\u6C7A\u5B9A\u3067\u8ABF\u3079\u3088\u3046\u3002" : "\u3053\u3061\u3089\u3078\u306F\u901A\u308C\u306A\u3044\u3002" };
    const portal = map.portals.find((p) => p.x === x && p.y === y);
    if (portal) {
      if (s.pos.map === "castle" && s.stage === "S00") return { state: next, kind: "blocked", message: "\u907F\u96E3\u8005\u3092\u5B88\u3089\u306A\u3051\u308C\u3070\uFF01" };
      if (s.pos.map === "castle" && s.stage === "S01") return { state: next, kind: "blocked", message: "\u65C5\u7ACB\u3064\u524D\u306B\u30A2\u30EB\u30C9\u738B\u3068\u8A71\u305D\u3046\u3002" };
      if (portal.to === "sailun" && !s.flags.gateOpen) return { state: next, kind: "blocked", message: "\u9244\u306E\u9580\u3092\u958B\u3051\u3066\u304B\u3089\u5411\u304B\u304A\u3046\u3002" };
      if (portal.to === "ruins" && STAGES.indexOf(s.stage) < 6) return { state: next, kind: "blocked", message: "\u307E\u305A\u6E2F\u753A\u3067\u60C5\u5831\u3092\u96C6\u3081\u3088\u3046\u3002" };
      if (portal.to === "onyx" && !s.flags.onyxBarrierOpen) return { state: next, kind: "blocked", message: "\u95C7\u306E\u7D50\u754C\u304C\u9053\u3092\u585E\u3044\u3067\u3044\u308B\u3002" };
      next.pos = { map: portal.to, x: portal.entry.x, y: portal.entry.y, facing: direction2 };
      return { state: next, kind: "portal", autoSave: ["castle", "leaf", "sailun", "ruins", "onyx"].includes(portal.to), message: MAPS[portal.to].name + "\u306B\u7740\u3044\u305F\u3002" };
    }
    next.pos.x = x;
    next.pos.y = y;
    return { state: next, kind: "walk" };
  }
  function front(s) {
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[s.pos.facing];
    return { x: s.pos.x + d[0], y: s.pos.y + d[1] };
  }
  function interact(s) {
    const target = front(s), e = entityAt(s, MAPS[s.pos.map], target.x, target.y);
    const next = clone(s);
    const result = { state: next, messages: [], kind: "talk" };
    if (!e) {
      if (s.pos.map === "field" && MAPS.field.tiles[target.y]?.[target.x] === 6) return gateInteraction(s);
      return { ...result, messages: ["\u3042\u305F\u308A\u3092\u8ABF\u3079\u305F\u304C\u3001\u7279\u306B\u5909\u308F\u3063\u305F\u3082\u306E\u306F\u306A\u3044\u3002"] };
    }
    switch (e.kind) {
      case "raider":
        return { state: next, kind: "battle", monsterId: "m01", tag: "tutorial", messages: ["\u9B54\u7269\u304C\u907F\u96E3\u8005\u306B\u8FEB\u308B\uFF01 " + s.name + "\u306F\u305D\u306E\u524D\u306B\u7ACB\u3061\u306F\u3060\u304B\u3063\u305F\u3002"] };
      case "refugee":
        return { ...result, messages: s.flags.openingDefeated ? ["\u907F\u96E3\u8005\u300C\u3042\u308A\u304C\u3068\u3046\u2026\u2026\u3042\u306A\u305F\u306E\u304A\u304B\u3052\u3067\u52A9\u304B\u308A\u307E\u3057\u305F\u300D"] : ["\u907F\u96E3\u8005\u300C\u305F\u3059\u3051\u3066\u2026\u2026\uFF01 \u3042\u306E\u9B54\u7269\u304C\u2026\u2026\uFF01\u300D"] };
      case "guard":
        return { ...result, messages: ["\u5B88\u5099\u5175\u300C\u5317\u306E\u738B\u306E\u9593\u3078\u3002\u57CE\u306E\u5175\u306F\u5404\u5730\u306E\u9632\u885B\u3067\u624B\u4E00\u676F\u3060\u300D"] };
      case "sword":
        return { ...result, messages: ["\u53E4\u3073\u305F\u5263\u304C\u98FE\u3089\u308C\u3066\u3044\u308B\u3002\u67C4\u306B\u306F\u5C0F\u3055\u306A\u661F\u306E\u7D0B\u7AE0\u304C\u3042\u308B\u3002"] };
      case "king":
        if (s.stage === "S00") return { ...result, messages: ["\u30A2\u30EB\u30C9\u738B\u300C\u4ECA\u306F\u907F\u96E3\u8005\u3092\u5B88\u3063\u3066\u307B\u3057\u3044\u3002\u3042\u306E\u9B54\u7269\u3092\u983C\u3080\uFF01\u300D"] };
        if (s.stage === "S01") {
          next.stage = "S02";
          next.flags.swordGiven = true;
          next.relics.push("beginning-sword");
          next.player.gold += 50;
          return { ...result, kind: "kingQuest", autoSave: true, messages: ["\u30A2\u30EB\u30C9\u738B\u300C\u9B54\u738B\u30F4\u30A9\u30EB\u30C9\u306E\u8ECD\u52E2\u304C\u3001\u5404\u5730\u306E\u6751\u3092\u8972\u3063\u3066\u3044\u308B\u300D", "\u30A2\u30EB\u30C9\u738B\u300C\u5175\u306F\u9632\u885B\u3067\u52D5\u304B\u305B\u306C\u3002\u305D\u306A\u305F\u304C\u4EBA\u3005\u3092\u5B88\u308B\u305F\u3081\u6226\u3063\u305F\u3068\u805E\u3044\u305F\u300D", "\u53E4\u3044\u5263\u306B\u3001\u661F\u306E\u3088\u3046\u306A\u5149\u304C\u4E00\u77AC\u5BBF\u3063\u305F\u3002", "\u30A2\u30EB\u30C9\u738B\u300C\u3053\u306E\u5263\u3092\u8A17\u305D\u3046\u3002\u307E\u305A\u306F\u30EA\u30FC\u30D5\u30A1\u3078\u5411\u304B\u3063\u3066\u304F\u308C\u300D", "\u65C5\u7ACB\u3061\u306E\u652F\u5EA6\u306B\u300150\u30B4\u30FC\u30EB\u30C9\u3092\u53D7\u3051\u53D6\u3063\u305F\u3002"] };
        }
        if (s.stage === "S09") {
          next.stage = "CLEAR";
          next.flags.endingSeen = true;
          return { ...result, kind: "ending", autoSave: true, messages: [
            "\u30A2\u30EB\u30C9\u738B\u300C" + s.name + "\u3001\u3088\u304F\u623B\u3063\u3066\u304F\u308C\u305F\u3002\u9B54\u738B\u30F4\u30A9\u30EB\u30C9\u3092\u5012\u3057\u305F\u3068\u805E\u3044\u305F\u300D",
            "\u30A2\u30EB\u30C9\u738B\u300C\u9B54\u738B\u8ECD\u306E\u4FB5\u653B\u306F\u6B62\u307E\u308A\u3001\u30EA\u30FC\u30D5\u30A1\u3067\u306F\u4EBA\u3005\u304C\u5BB6\u8DEF\u306B\u3064\u304D\u3001\u30BB\u30A4\u30EB\u30F3\u306E\u6E2F\u306B\u3082\u8239\u304C\u623B\u308A\u59CB\u3081\u305F\u300D",
            s.name + "\u300C\u307F\u3093\u306A\u304C\u3001\u77E5\u3089\u306A\u3044\u8AB0\u304B\u3092\u5B88\u308D\u3046\u3068\u3057\u3066\u3044\u307E\u3057\u305F\u3002\u4FFA\u3082\u3001\u305D\u306E\u4E00\u4EBA\u3067\u3044\u305F\u304B\u3063\u305F\u3060\u3051\u3067\u3059\u300D",
            "\u30A2\u30EB\u30C9\u738B\u300C\u305D\u306E\u52C7\u6C17\u3053\u305D\u304C\u3001\u3053\u306E\u56FD\u3092\u6551\u3063\u305F\u306E\u3060\u300D",
            "\u738B\u306F\u3001\u661F\u306E\u7D0B\u7AE0\u304C\u5149\u308B\u5263\u3092\u898B\u3064\u3081\u3001\u9759\u304B\u306B\u3046\u306A\u305A\u3044\u305F\u3002",
            "\u30A2\u30EB\u30C9\u738B\u300C\u4EBA\u3005\u306F\u305D\u306A\u305F\u3092\u3001\u661F\u5C51\u306E\u52C7\u8005\u3068\u547C\u3076\u3060\u308D\u3046\u300D",
            "\u3010\u7D42\u5E55\u3011\u661F\u5C51\u306E\u52C7\u8005\u3000\u301C\u306F\u3058\u307E\u308A\u306E\u5263\u3068\u9ED2\u66DC\u306E\u9B54\u738B\u57CE\u301C",
            "\u5192\u967A\u306F\u3053\u3053\u3067\u5B8C\u7D50\u3057\u305F\u3002\u5E73\u548C\u306B\u306A\u3063\u305F\u4E16\u754C\u3092\u3001\u3053\u308C\u304B\u3089\u3082\u6B69\u304F\u3053\u3068\u304C\u3067\u304D\u308B\u3002",
            "THE END\u3000\u2500\u2500 \u4EBA\u3092\u5B88\u308D\u3046\u3068\u3057\u305F\u3001\u5C0F\u3055\u306A\u52C7\u6C17\u306E\u7269\u8A9E\u3002"
          ] };
        }
        if (s.stage === "CLEAR") return { ...result, kind: "manualSave", messages: ["\u30A2\u30EB\u30C9\u738B\u300C\u661F\u5C51\u306E\u52C7\u8005\u3088\u3002\u56FD\u306B\u623B\u3063\u305F\u3068\u304D\u306F\u3001\u3044\u3064\u3067\u3082\u65C5\u306E\u8A18\u9332\u3092\u6B8B\u3057\u3066\u3086\u304F\u304C\u3044\u3044\u300D"] };
        return { ...result, kind: "manualSave", messages: ["\u30A2\u30EB\u30C9\u738B\u300C\u65C5\u306E\u8A18\u9332\u3092\u6B8B\u3057\u3066\u304A\u3053\u3046\u3002\u3069\u3046\u304B\u7121\u4E8B\u3067\u306A\u300D"] };
      case "elder":
        if (s.stage === "S02") {
          next.stage = "S03";
          return { ...result, kind: "quest", autoSave: true, messages: ["\u4E16\u8A71\u5F79\u300C\u3053\u3053\u306B\u306F\u9B54\u7269\u306B\u8FFD\u308F\u308C\u305F\u4EBA\u304C\u96C6\u307E\u3063\u3066\u3044\u308B\u3002\u98DF\u3079\u7269\u3082\u5BDD\u5E8A\u3082\u8DB3\u308A\u306A\u3044\u300D", "\u4E16\u8A71\u5F79\u300C\u6E2F\u3078\u306E\u907F\u96E3\u8DEF\u306F\u9244\u306E\u9580\u3067\u585E\u304C\u308C\u3066\u3044\u308B\u3002\u9375\u3092\u6301\u3063\u305F\u898B\u5F35\u308A\u304C\u3001\u8A66\u7DF4\u306E\u6D1E\u7A9F\u306B\u9003\u308C\u305F\u304D\u308A\u623B\u3089\u306A\u3044\u3093\u3060\u300D", "\u4E16\u8A71\u5F79\u300C\u304A\u9858\u3044\u3060\u3002\u3042\u306E\u4EBA\u3092\u635C\u3057\u3066\u304F\u308C\u306A\u3044\u304B\u300D"] };
        }
        return { ...result, messages: s.flags.bossDefeated ? ["\u4E16\u8A71\u5F79\u300C\u907F\u96E3\u3057\u3066\u3044\u305F\u4EBA\u305F\u3061\u304C\u3001\u5C11\u3057\u305A\u3064\u5BB6\u306B\u5E30\u308A\u59CB\u3081\u305F\u3088\u3002\u672C\u5F53\u306B\u3042\u308A\u304C\u3068\u3046\u300D"] : s.stage === "S03" ? ["\u4E16\u8A71\u5F79\u300C\u6D1E\u7A9F\u306E\u5965\u306B\u898B\u5F35\u308A\u304C\u3044\u308B\u306F\u305A\u3060\u3002\u6C17\u3092\u3064\u3051\u3066\u300D"] : ["\u4E16\u8A71\u5F79\u300C\u3042\u306A\u305F\u306E\u304A\u304B\u3052\u3067\u3001\u907F\u96E3\u8DEF\u306B\u5E0C\u671B\u304C\u898B\u3048\u307E\u3057\u305F\u300D"] };
      case "helper":
        return { ...result, messages: ["\u5973\u6027\u300C\u77E5\u3089\u306A\u3044\u4EBA\u540C\u58EB\u3067\u3082\u3001\u56F0\u3063\u3066\u3044\u308B\u306A\u3089\u52A9\u3051\u308B\u3067\u3057\u3087\u3046\u300D", "\u5973\u6027\u300C\u6E2F\u3078\u306E\u9053\u304C\u4F7F\u3048\u308C\u3070\u3001\u3082\u3063\u3068\u305F\u304F\u3055\u3093\u306E\u4EBA\u3092\u907F\u96E3\u3055\u305B\u3089\u308C\u308B\u306E\u306B\u300D"] };
      case "inn":
        return { ...result, kind: "inn", messages: ["\u5BBF\u5C4B\u300C\u4E00\u6CCA12\u30B4\u30FC\u30EB\u30C9\u3067\u3059\u3002\u4F11\u3093\u3067\u3044\u304D\u307E\u3059\u304B\uFF1F\u300D"] };
      case "shop":
        return { ...result, kind: "shop", messages: ["\u9053\u5177\u5C4B\u300C\u65C5\u306E\u652F\u5EA6\u306A\u3089\u4EFB\u305B\u3066\u304F\u3060\u3055\u3044\uFF01\u300D"] };
      case "caveBoss":
        if (s.stage !== "S03") return { ...result, messages: ["\u5965\u306B\u5F37\u3044\u9B54\u7269\u304C\u3044\u308B\u3002\u5148\u306B\u30EA\u30FC\u30D5\u30A1\u3067\u8A71\u3092\u805E\u3053\u3046\u3002"] };
        return { state: next, kind: "battle", monsterId: "m06", tag: "caveBoss", messages: ["\u30B4\u30D6\u30EA\u30F3\u306E\u982D\u76EE\u304C\u3001\u5965\u3078\u7D9A\u304F\u9053\u3092\u585E\u3044\u3067\u3044\u308B\uFF01"] };
      case "watchman":
        if (s.flags.watchmanRescued) return { ...result, messages: ["\u898B\u5F35\u308A\u300C\u3042\u306A\u305F\u304C\u958B\u3044\u3066\u304F\u308C\u305F\u9053\u3092\u3001\u307F\u3093\u306A\u3067\u5B88\u308B\u3088\u300D"] };
        if (s.stage !== "S03" && s.stage !== "S04" && s.stage !== "S05") return { ...result, messages: ["\u898B\u5F35\u308A\u300C\u8AB0\u304B\u2026\u2026\u30EA\u30FC\u30D5\u30A1\u306E\u753A\u306B\u77E5\u3089\u305B\u3066\u304F\u308C\u2026\u2026\u300D"] };
        if (!s.flags.caveBossDefeated) return { ...result, messages: ["\u898B\u5F35\u308A\u300C\u9375\u306F\u5B88\u3063\u305F\u3002\u3060\u304C\u3001\u9B54\u7269\u304C\u3044\u3066\u5E30\u308C\u306A\u3044\u2026\u2026\uFF01\u300D"] };
        if (!s.flags.watchmanRescued) {
          next.flags.watchmanRescued = true;
          next.inventory["iron-key"] += 1;
          next.stage = "S04";
          return { ...result, kind: "key", autoSave: true, messages: ["\u898B\u5F35\u308A\u300C\u52A9\u3051\u306B\u6765\u3066\u304F\u308C\u305F\u306E\u304B\uFF01 \u3042\u308A\u304C\u3068\u3046\u2026\u2026\uFF01\u300D", "\u898B\u5F35\u308A\u300C\u3053\u306E\u9244\u306E\u9375\u3067\u3001\u8857\u9053\u306E\u9580\u3092\u958B\u3051\u3066\u304F\u308C\u3002\u9003\u3052\u9053\u3092\u3064\u306A\u3050\u3093\u3060\u300D", "\u9244\u306E\u9375\u30921\u3064\u624B\u306B\u5165\u308C\u305F\u3002"] };
        }
        return { ...result, messages: ["\u898B\u5F35\u308A\u300C\u3042\u306A\u305F\u304C\u958B\u3044\u3066\u304F\u308C\u305F\u9053\u3092\u3001\u307F\u3093\u306A\u3067\u5B88\u308B\u3088\u300D"] };
      case "gate":
        return gateInteraction(s);
      case "chest":
        if (!next.chests.includes(e.id)) {
          next.chests.push(e.id);
          next.inventory["great-potion"]++;
          return { ...result, kind: "chest", autoSave: true, messages: ["\u5B9D\u7BB1\u304B\u3089\u30B0\u30EC\u30FC\u30C8\u30DD\u30FC\u30B7\u30E7\u30F3\u3092\u898B\u3064\u3051\u305F\uFF01"] };
        }
        return { ...result, messages: ["\u5B9D\u7BB1\u306F\u7A7A\u3063\u307D\u3060\u3002"] };
      case "star":
        if (!next.stars.includes(e.id)) {
          next.stars.push(e.id);
          const lines = ["\u661F\u306E\u6A21\u69D8\u3092\u6301\u3064\u5C0F\u3055\u306A\u7D50\u6676\u3092\u898B\u3064\u3051\u305F\u3002", "\u661F\u5C51\u306E\u6B20\u7247\u3092\u624B\u306B\u5165\u308C\u305F\uFF08" + next.stars.length + "/5\uFF09\u3002"];
          if (next.stars.length === 5 && !next.owned.includes("star-orb")) {
            next.owned.push("star-orb");
            next.equipment.accessory = "star-orb";
            lines.push("\u4E94\u3064\u306E\u661F\u5C51\u304C\u91CD\u306A\u308A\u3001\u661F\u306E\u30AA\u30FC\u30D6\u306B\u306A\u3063\u305F\uFF01", "\u661F\u306E\u30AA\u30FC\u30D6\u3092\u88C5\u5099\u3057\u305F\u3002\u546A\u6587\u306E\u6D88\u8CBBMP\u304C\u8EFD\u304F\u306A\u308B\u3002");
          }
          return { ...result, kind: "star", autoSave: true, messages: lines };
        }
        return { ...result, messages: ["\u3053\u3053\u306B\u306F\u4F55\u3082\u6B8B\u3063\u3066\u3044\u306A\u3044\u3002"] };
      case "mural":
        return { ...result, messages: ["\u58C1\u306B\u306F\u53E4\u3044\u5263\u58EB\u304C\u63CF\u304B\u308C\u3066\u3044\u308B\u3002\u5263\u306E\u67C4\u306B\u661F\u306E\u5370\u3002\u9854\u306E\u90E8\u5206\u3060\u3051\u304C\u524A\u308C\u3066\u8AAD\u3081\u306A\u3044\u3002"] };
      case "sign":
        return { ...result, messages: ["\u9053\u6A19\u306B\u306F\u300C\u6E2F\u753A\u30BB\u30A4\u30EB\u30F3\u300D\u3068\u523B\u307E\u308C\u3066\u3044\u308B\u3002", "\u6771\u3078\u9032\u3081\u3070\u6E2F\u753A\u306B\u7740\u304F\u3002"] };
      case "frontSoldier":
        if (s.flags.bossDefeated) return { ...result, messages: ["\u524D\u7DDA\u5175\u300C\u9ED2\u66DC\u57CE\u306E\u9B54\u7269\u305F\u3061\u304C\u9000\u304D\u59CB\u3081\u305F\u3002\u541B\u304C\u52DD\u3063\u305F\u3093\u3060\u306A\u300D"] };
        return recordIntel(s, "frontIntel", ["\u524D\u7DDA\u5175\u300C\u9ED2\u66DC\u57CE\u306E\u5468\u56F2\u306F\u9ED2\u3044\u7D50\u754C\u306B\u5305\u307E\u308C\u3066\u3044\u308B\u3002\u5263\u3082\u5175\u3082\u8FD1\u3065\u3051\u306A\u304B\u3063\u305F\u300D", "\u524D\u7DDA\u5175\u300C\u7D50\u754C\u3092\u89E3\u304F\u624B\u7ACB\u3066\u3092\u63A2\u3055\u306A\u3051\u308C\u3070\u2026\u2026\u300D"]);
      case "riona":
        if (s.flags.bossDefeated) return { ...result, messages: ["\u30EA\u30AA\u30CA\u300C\u6226\u3044\u304C\u7D42\u308F\u3063\u305F\u306E\u3067\u3059\u306D\u3002\u3069\u3046\u304B\u3001\u3053\u308C\u304B\u3089\u306E\u671D\u3092\u5927\u5207\u306B\u300D"] };
        return recordIntel(s, "mirrorIntel", ["\u30EA\u30AA\u30CA\u300C\u53E4\u3044\u4F1D\u627F\u306B\u3001\u95C7\u3092\u9000\u3051\u308B\u9ECE\u660E\u306E\u93E1\u3068\u3044\u3046\u54C1\u304C\u3042\u308B\u305D\u3046\u3067\u3059\u300D", "\u30EA\u30AA\u30CA\u300C\u305F\u3060\u306E\u5642\u304B\u3082\u3057\u308C\u307E\u305B\u3093\u3002\u3067\u3082\u3001\u63A2\u3059\u4FA1\u5024\u306F\u3042\u308B\u3067\u3057\u3087\u3046\u300D"]);
      case "lighthouse":
        if (s.flags.bossDefeated) return { ...result, messages: ["\u706F\u53F0\u5B88\u300C\u6E2F\u306B\u8239\u304C\u623B\u3063\u3066\u304D\u305F\u3002\u9577\u3044\u591C\u3060\u3063\u305F\u306A\u3042\u300D"] };
        return recordIntel(s, "ruinsIntel", ["\u706F\u53F0\u5B88\u300C\u5317\u306E\u5CAC\u306E\u53E4\u3044\u77F3\u9020\u308A\u306E\u907A\u8DE1\u306F\u3001\u6C88\u9ED9\u306E\u907A\u8DE1\u3068\u547C\u3070\u308C\u3066\u3044\u308B\u300D", "\u706F\u53F0\u5B88\u300C\u6E2F\u306E\u5317\u9580\u304B\u3089\u884C\u3051\u308B\u3002\u9577\u304F\u8AB0\u3082\u623B\u3063\u3066\u3044\u306A\u3044\u304C\u306A\u300D"]);
      case "switchA":
      case "switchB": {
        const key = e.kind === "switchA" ? "switchA" : "switchB";
        if (next.flags[key]) return { ...result, messages: ["\u77F3\u76E4\u306E\u5370\u306F\u3059\u3067\u306B\u5149\u3063\u3066\u3044\u308B\u3002"] };
        next.flags[key] = true;
        return { ...result, autoSave: true, messages: ["\u77F3\u76E4\u306B\u89E6\u308C\u308B\u3068\u3001\u523B\u307E\u308C\u305F\u7DDA\u304C\u9752\u767D\u304F\u5149\u3063\u305F\u3002", next.flags.switchA && next.flags.switchB ? "\u4E8C\u3064\u306E\u77F3\u76E4\u304C\u5171\u9CF4\u3057\u3001\u5965\u306E\u5C01\u5370\u304C\u5F31\u307E\u3063\u305F\u3002" : "\u3082\u3046\u3072\u3068\u3064\u306E\u77F3\u76E4\u304C\u5FDC\u3048\u308B\u306E\u3092\u5F85\u3063\u3066\u3044\u308B\u3002"] };
      }
      case "ruinsBoss":
        if (!s.flags.switchA || !s.flags.switchB) return { ...result, messages: ["\u77F3\u306E\u5B88\u8B77\u8005\u306F\u52D5\u304B\u306A\u3044\u3002\u4E8C\u3064\u306E\u77F3\u76E4\u304C\u307E\u3060\u7720\u3063\u3066\u3044\u308B\u3002"] };
        return { state: next, kind: "battle", monsterId: "m12", tag: "ruinsBoss", messages: ["\u4E8C\u3064\u306E\u77F3\u76E4\u304C\u97FF\u304D\u3001\u77F3\u306E\u5B88\u8B77\u8005\u304C\u76EE\u3092\u899A\u307E\u3057\u305F\uFF01"] };
      case "mirror":
        if (s.flags.mirrorObtained) return { ...result, messages: ["\u7A7A\u306E\u53F0\u5EA7\u306B\u3001\u3042\u306E\u3068\u304D\u306E\u5149\u306E\u4F59\u97FB\u304C\u6B8B\u3063\u3066\u3044\u308B\u3002"] };
        if (!s.flags.ruinsBossDefeated) return { ...result, messages: ["\u53F0\u5EA7\u306F\u95C7\u306E\u9396\u306B\u8986\u308F\u308C\u3066\u3044\u308B\u3002\u5B88\u8B77\u8005\u3092\u9000\u3051\u306A\u3051\u308C\u3070\u8FD1\u3065\u3051\u306A\u3044\u3002"] };
        next.flags.mirrorObtained = true;
        next.relics.push("dawn-mirror");
        next.stage = "S07";
        return { ...result, autoSave: true, kind: "mirror", messages: ["\u53F0\u5EA7\u306B\u7F6E\u304B\u308C\u305F\u53E4\u3044\u93E1\u306B\u3001\u671D\u713C\u3051\u306E\u3088\u3046\u306A\u5149\u304C\u5BBF\u308B\u3002", "\u9ECE\u660E\u306E\u93E1\u3092\u624B\u306B\u5165\u308C\u305F\uFF01", "\u305D\u306E\u77AC\u9593\u3001\u306F\u3058\u307E\u308A\u306E\u5263\u306E\u661F\u306E\u7D0B\u7AE0\u304C\u6DE1\u304F\u8F1D\u304D\u3001\u93E1\u306E\u5149\u3068\u547C\u3073\u5408\u3063\u305F\u3002", "\u4E8C\u3064\u306E\u5149\u306F\u9759\u304B\u306B\u6D88\u3048\u305F\u3002\u9ED2\u66DC\u57CE\u306E\u7D50\u754C\u3092\u89E3\u304F\u624B\u639B\u304B\u308A\u3092\u5F97\u305F\u3002", "\u3010\u7B2C\u4E8C\u5E55\u30AF\u30EA\u30A2\u3011\u9ECE\u660E\u306E\u93E1\u3092\u5165\u624B\uFF01"] };
      case "optionalDoor":
        if (next.inventory["iron-key"] < 1) return { ...result, messages: ["\u53E4\u3044\u9375\u6249\u3060\u3002\u9244\u306E\u9375\u304C\u3042\u308C\u3070\u958B\u3051\u3089\u308C\u305D\u3046\u3060\u3002"] };
        next.inventory["iron-key"]--;
        next.flags.optionalDoorOpen = true;
        return { ...result, autoSave: true, messages: ["\u9244\u306E\u9375\u3092\u4F7F\u3063\u3066\u3001\u5BC4\u308A\u9053\u306E\u6249\u3092\u958B\u3051\u305F\u3002"] };
      case "ironKeyChest":
        if (next.chests.includes(e.id)) return { ...result, messages: ["\u5B9D\u7BB1\u306F\u7A7A\u3063\u307D\u3060\u3002"] };
        next.chests.push(e.id);
        next.inventory["iron-key"]++;
        return { ...result, autoSave: true, messages: ["\u9244\u306E\u9375\u3092\u3082\u30461\u3064\u624B\u306B\u5165\u308C\u305F\uFF01 \u907A\u8DE1\u306E\u5BC4\u308A\u9053\u306E\u6249\u306B\u4F7F\u3048\u305D\u3046\u3060\u3002"] };
      case "ironChest":
        if (!next.flags.optionalDoorOpen) return { ...result, messages: ["\u9375\u6249\u306E\u5411\u3053\u3046\u306B\u5B9D\u7BB1\u304C\u898B\u3048\u308B\u3002"] };
        if (next.chests.includes(e.id)) return { ...result, messages: ["\u5B9D\u7BB1\u306F\u7A7A\u3063\u307D\u3060\u3002"] };
        next.chests.push(e.id);
        next.inventory["great-potion"]++;
        return { ...result, autoSave: true, messages: ["\u5B9D\u7BB1\u304B\u3089\u30B0\u30EC\u30FC\u30C8\u30DD\u30FC\u30B7\u30E7\u30F3\u3092\u624B\u306B\u5165\u308C\u305F\u3002"] };
      case "onyxBarrier":
        if (s.flags.onyxBarrierOpen) return { ...result, messages: ["\u9ED2\u66DC\u57CE\u3092\u8986\u3063\u305F\u7D50\u754C\u306F\u6D88\u3048\u3066\u3044\u308B\u3002"] };
        if (s.stage !== "S07" || !s.flags.mirrorObtained || !s.relics.includes("dawn-mirror") || !s.relics.includes("beginning-sword"))
          return { ...result, messages: ["\u57CE\u9580\u3092\u6697\u3044\u7D50\u754C\u304C\u8986\u3063\u3066\u3044\u308B\u3002\u9ECE\u660E\u306E\u93E1\u3068\u53E4\u3044\u5263\u304C\u5FC5\u8981\u3060\u3002"] };
        next.flags.onyxBarrierOpen = true;
        next.stage = "S08";
        return { ...result, kind: "barrier", autoSave: true, messages: [
          "\u9ED2\u66DC\u57CE\u306E\u5165\u53E3\u306B\u3001\u591C\u306E\u3088\u3046\u306A\u95C7\u304C\u6E26\u5DFB\u3044\u3066\u3044\u308B\u3002",
          "\u9ECE\u660E\u306E\u93E1\u3092\u63B2\u3052\u308B\u3068\u3001\u93E1\u306E\u5149\u304C\u7D50\u754C\u306E\u6A21\u69D8\u3092\u6620\u3057\u51FA\u3057\u305F\u3002",
          "\u306F\u3058\u307E\u308A\u306E\u5263\u306E\u661F\u7D0B\u304C\u547C\u5FDC\u3059\u308B\u3002\u4E8C\u3064\u306E\u5149\u304C\u91CD\u306A\u308A\u3001\u95C7\u306E\u7D50\u754C\u304C\u7815\u3051\u6563\u3063\u305F\uFF01",
          "\u9ECE\u660E\u306E\u93E1\u306F\u5931\u308F\u308C\u3066\u3044\u306A\u3044\u3002\u6249\u306E\u5411\u3053\u3046\u306B\u306F\u3001\u307E\u3060\u9B54\u738B\u304C\u5F85\u3063\u3066\u3044\u308B\u3002",
          "\u3010\u7B2C\u4E09\u5E55\u3011\u9ED2\u66DC\u57CE\u30AA\u30CB\u30AD\u30B9\u3078\u306E\u9053\u304C\u958B\u304B\u308C\u305F\u3002"
        ] };
      case "onyxRuneA":
      case "onyxRuneB": {
        const key = e.kind === "onyxRuneA" ? "onyxRuneA" : "onyxRuneB";
        if (next.flags[key]) return { ...result, messages: ["\u9ED2\u66DC\u306E\u7D0B\u7AE0\u306F\u3001\u3059\u3067\u306B\u706F\u3063\u3066\u3044\u308B\u3002"] };
        next.flags[key] = true;
        return { ...result, kind: "rune", autoSave: true, messages: ["\u77F3\u306B\u523B\u307E\u308C\u305F\u5370\u3078\u624B\u3092\u5F53\u3066\u308B\u3068\u3001\u7D2B\u306E\u5149\u304C\u8D70\u3063\u305F\u3002", next.flags.onyxRuneA && next.flags.onyxRuneB ? "\u4E8C\u3064\u306E\u7D0B\u7AE0\u304C\u706F\u3063\u305F\u3002\u4E2D\u592E\u306E\u5C01\u5370\u306B\u5909\u5316\u304C\u3042\u308B\u304B\u3082\u3057\u308C\u306A\u3044\u3002" : "\u9060\u304F\u3067\u5225\u306E\u7D0B\u7AE0\u304C\u5FDC\u3048\u305F\u3088\u3046\u3060\u3002"] };
      }
      case "onyxForge":
        if (s.flags.swordAwakened) return { ...result, messages: ["\u661F\u306E\u796D\u58C7\u306F\u9759\u304B\u306B\u8F1D\u3044\u3066\u3044\u308B\u3002\u306F\u3058\u307E\u308A\u306E\u5263\u306E\u529B\u306F\u3059\u3067\u306B\u623B\u3063\u305F\u3002"] };
        if (!s.flags.onyxBarrierOpen || !s.relics.includes("beginning-sword")) return { ...result, messages: ["\u77F3\u306E\u796D\u58C7\u306B\u3001\u661F\u306E\u304B\u305F\u3061\u3092\u3057\u305F\u304F\u307C\u307F\u304C\u3042\u308B\u3002"] };
        next.flags.swordAwakened = true;
        next.owned.push("hero");
        next.equipment.weapon = "hero";
        next.player.hp = maxHp(next.player.level);
        next.player.mp = maxMp(next.player.level);
        return { ...result, kind: "swordAwakening", autoSave: true, messages: [
          "\u661F\u306E\u796D\u58C7\u306B\u3001\u306F\u3058\u307E\u308A\u306E\u5263\u3092\u304B\u3056\u3057\u305F\u3002",
          "\u65C5\u306E\u9014\u4E2D\u3067\u76EE\u306B\u3057\u305F\u661F\u306E\u5149\u304C\u3001\u3072\u3068\u3064\u306E\u7948\u308A\u306E\u3088\u3046\u306B\u5263\u3078\u96C6\u307E\u3063\u3066\u3086\u304F\u3002",
          "\u9306\u3073\u305F\u5203\u304C\u6F84\u3093\u3060\u5149\u3092\u5E2F\u3073\u3001\u5927\u304D\u306A\u5263\u3078\u3068\u59FF\u3092\u5909\u3048\u305F\u3002",
          "\u306F\u3058\u307E\u308A\u306E\u5263\u306F\u3001\u52C7\u8005\u306E\u5927\u5263\u3068\u3057\u3066\u529B\u3092\u53D6\u308A\u623B\u3057\u305F\uFF01 \u540C\u3058\u4E00\u632F\u308A\u306E\u5263\u3060\u3002",
          "\u52C7\u8005\u306E\u5927\u5263\u3092\u88C5\u5099\u3057\u305F\u3002HP\u3068MP\u304C\u56DE\u5FA9\u3057\u305F\u3002"
        ] };
      case "onyxSeal":
        if (!s.flags.onyxRuneA || !s.flags.onyxRuneB) return { ...result, messages: ["\u4E8C\u3064\u306E\u9ED2\u66DC\u306E\u7D0B\u7AE0\u3092\u706F\u3055\u306A\u3051\u308C\u3070\u3001\u3053\u306E\u6249\u306F\u958B\u304B\u306A\u3044\u3002"] };
        if (!s.flags.swordAwakened) return { ...result, messages: ["\u7D0B\u7AE0\u306E\u5149\u304C\u5263\u3092\u6C42\u3081\u3066\u3044\u308B\u3002\u4E2D\u592E\u306E\u661F\u306E\u796D\u58C7\u3092\u8ABF\u3079\u3088\u3046\u3002"] };
        next.flags.onyxSealOpen = true;
        return { ...result, kind: "seal", autoSave: true, messages: ["\u4E8C\u3064\u306E\u7D0B\u7AE0\u304C\u5263\u306E\u5149\u306B\u5FDC\u3048\u3001\u9ED2\u3044\u77F3\u6249\u304C\u3086\u3063\u304F\u308A\u3068\u5DE6\u53F3\u3078\u958B\u3044\u305F\u3002", "\u6700\u5965\u306E\u7389\u5EA7\u3078\u9032\u3081\u308B\u3088\u3046\u306B\u306A\u3063\u305F\u3002"] };
      case "onyxChest": {
        if (next.chests.includes(e.id)) return { ...result, messages: ["\u5B9D\u7BB1\u306F\u7A7A\u3063\u307D\u3060\u3002"] };
        next.chests.push(e.id);
        if (e.id === "onyx-armor") {
          if (!next.owned.includes("armor:mythril")) next.owned.push("armor:mythril");
          next.equipment.armor = "mythril";
          return { ...result, kind: "chest", autoSave: true, messages: ["\u5B9D\u7BB1\u304B\u3089\u30DF\u30B9\u30EA\u30EB\u30E1\u30A4\u30EB\u3092\u898B\u3064\u3051\u3001\u88C5\u5099\u3057\u305F\uFF01"] };
        }
        if (e.id === "onyx-shield") {
          if (!next.owned.includes("mythrilshield")) next.owned.push("mythrilshield");
          next.equipment.shield = "mythrilshield";
          return { ...result, kind: "chest", autoSave: true, messages: ["\u5B9D\u7BB1\u304B\u3089\u30DF\u30B9\u30EA\u30EB\u306E\u76FE\u3092\u898B\u3064\u3051\u3001\u88C5\u5099\u3057\u305F\uFF01"] };
        }
        if (e.id === "onyx-supplies") {
          next.inventory["great-potion"] += 3;
          return { ...result, kind: "chest", autoSave: true, messages: ["\u5B9D\u7BB1\u304B\u3089\u30B0\u30EC\u30FC\u30C8\u30DD\u30FC\u30B7\u30E7\u30F3\u30923\u3064\u898B\u3064\u3051\u305F\uFF01"] };
        }
        throw Error("\u672A\u5B9A\u7FA9\u306E\u9ED2\u66DC\u57CE\u5B9D\u7BB1 " + e.id);
      }
      case "onyxInscription":
        return { ...result, messages: ["\u53E4\u3044\u77F3\u7891\u306B\u6587\u5B57\u304C\u523B\u307E\u308C\u3066\u3044\u308B\u3002", "\u300C\u5DE6\u53F3\u306E\u7D0B\u7AE0\u3092\u706F\u3057\u3001\u661F\u306E\u796D\u58C7\u306B\u5263\u3092\u6367\u3052\u3088\u300D"] };
      case "onyxBoss":
        if (s.flags.bossDefeated) return { ...result, messages: ["\u7389\u5EA7\u306F\u9759\u307E\u308A\u8FD4\u3063\u3066\u3044\u308B\u3002\u9B54\u738B\u30F4\u30A9\u30EB\u30C9\u306F\u3082\u3046\u3044\u306A\u3044\u3002"] };
        if (s.stage !== "S08" || !s.flags.onyxSealOpen) return { ...result, messages: ["\u6697\u3044\u7389\u5EA7\u304B\u3089\u5F37\u3044\u6C17\u914D\u304C\u6F02\u3046\u3002\u307E\u3060\u9032\u3080\u6E96\u5099\u304C\u3067\u304D\u3066\u3044\u306A\u3044\u3002"] };
        return { state: next, kind: "battle", monsterId: "vold", tag: "voldBoss", messages: [
          "\u9ED2\u3044\u7389\u5EA7\u306B\u3001\u9B54\u738B\u30F4\u30A9\u30EB\u30C9\u304C\u7ACB\u3063\u3066\u3044\u305F\u3002",
          "\u30F4\u30A9\u30EB\u30C9\u300C\u4EBA\u9593\u306F\u4F55\u5EA6\u3067\u3082\u4E89\u3044\u3001\u596A\u3044\u5408\u3046\u3002\u5B88\u308B\u4FA1\u5024\u306A\u3069\u306A\u3044\u300D",
          s.name + "\u300C\u4FFA\u304C\u898B\u3066\u304D\u305F\u4EBA\u305F\u3061\u306F\u9055\u3046\u3002\u898B\u77E5\u3089\u306C\u4EBA\u3092\u52A9\u3051\u3001\u660E\u65E5\u3092\u5B88\u308D\u3046\u3068\u3057\u3066\u3044\u305F\u300D",
          "\u30F4\u30A9\u30EB\u30C9\u306F\u3001" + s.name + "\u306E\u5263\u3092\u898B\u3066\u3001\u304B\u3059\u304B\u306B\u76EE\u3092\u7D30\u3081\u308B\u3002",
          "\u30F4\u30A9\u30EB\u30C9\u300C\u2026\u2026\u305D\u306E\u5263\u3001\u307E\u3060\u6B8B\u3063\u3066\u3044\u305F\u304B\u300D",
          s.name + "\u300C\u3053\u3053\u3067\u7D42\u308F\u3089\u305B\u308B\u3002\u307F\u3093\u306A\u306E\u660E\u65E5\u3092\u5B88\u308B\u305F\u3081\u306B\uFF01\u300D"
        ] };
      default:
        throw Error("\u672A\u5B9A\u7FA9\u306E\u30A4\u30D9\u30F3\u30C8: " + e.kind);
    }
  }
  function recordIntel(s, key, lines) {
    const next = clone(s);
    if (STAGES.indexOf(s.stage) < 5) return { state: next, kind: "talk", messages: lines };
    const already = next.flags[key] === true;
    next.flags[key] = true;
    const complete = ["frontIntel", "mirrorIntel", "ruinsIntel"].every((k) => next.flags[k] === true);
    if (complete && next.stage === "S05") next.stage = "S06";
    return { state: next, kind: "intel", autoSave: !already, messages: [...lines, ...complete && s.stage === "S05" ? ["\u4E09\u3064\u306E\u624B\u639B\u304B\u308A\u304C\u3064\u306A\u304C\u3063\u305F\u3002\u6E2F\u306E\u5317\u9580\u304B\u3089\u6C88\u9ED9\u306E\u907A\u8DE1\u3078\u5411\u304B\u304A\u3046\uFF01"] : []] };
  }
  function gateInteraction(s) {
    const next = clone(s);
    if (s.flags.gateOpen) return { state: next, kind: "talk", messages: ["\u9244\u306E\u9580\u306F\u958B\u3044\u3066\u3044\u308B\u3002\u907F\u96E3\u8DEF\u3092\u884C\u304D\u6765\u3067\u304D\u308B\u3002"] };
    if (s.stage !== "S04" || !s.flags.watchmanRescued || s.inventory["iron-key"] < 1) return { state: next, kind: "talk", messages: ["\u5927\u304D\u306A\u9244\u306E\u9580\u304C\u9053\u3092\u585E\u3044\u3067\u3044\u308B\u3002\u9375\u7A74\u306F\u3072\u3068\u3064\u3060\u3002", "\u9375\u3092\u6301\u3064\u898B\u5F35\u308A\u3092\u8A66\u7DF4\u306E\u6D1E\u7A9F\u3067\u63A2\u305D\u3046\u3002"] };
    next.inventory["iron-key"] -= 1;
    next.flags.gateOpen = true;
    next.stage = "S05";
    return { state: next, kind: "gateOpen", autoSave: true, messages: ["\u9244\u306E\u9375\u304C\u3001\u53E4\u3044\u9320\u306B\u3074\u305F\u308A\u3068\u306F\u307E\u3063\u305F\u3002", "\u91CD\u3044\u9244\u306E\u9580\u304C\u3086\u3063\u304F\u308A\u3068\u958B\u304F\u3002", "\u30EA\u30FC\u30D5\u30A1\u3068\u6E2F\u3092\u7D50\u3076\u907F\u96E3\u8DEF\u304C\u3001\u518D\u3073\u4EBA\u3005\u306E\u305F\u3081\u306B\u958B\u304B\u308C\u305F\u3002", "\u3010\u7B2C\u4E00\u5E55\u30AF\u30EA\u30A2\u3011\u9244\u306E\u9580\u3001\u958B\u901A\uFF01"] };
  }
  function gainVictory(s, enemyId, tag) {
    const enemy = monsterById(enemyId);
    if (!enemy) throw Error("Unknown enemy");
    const next = clone(s);
    next.defeated[enemyId] = (next.defeated[enemyId] || 0) + 1;
    next.player.exp += enemy.exp;
    next.player.gold += enemy.gold;
    const notes = [enemy.name + "\u3092\u5012\u3057\u305F\uFF01 " + enemy.exp + "\u7D4C\u9A13\u5024\u3001" + enemy.gold + "G\u3092\u7372\u5F97\u3002"];
    let leveled = false;
    while (next.player.level < 50 && next.player.exp >= next.player.level * next.player.level * 8) {
      next.player.level++;
      leveled = true;
      next.player.hp = maxHp(next.player.level);
      next.player.mp = maxMp(next.player.level);
      notes.push("\u30EC\u30D9\u30EB" + next.player.level + "\u306B\u306A\u3063\u305F\uFF01 HP\u3068MP\u304C\u56DE\u5FA9\u3057\u305F\u3002");
    }
    if (tag === "tutorial" && !next.flags.openingDefeated) {
      next.flags.openingDefeated = true;
      next.stage = "S01";
      notes.push("\u907F\u96E3\u8005\u306F\u7121\u4E8B\u3060\u3002\u53E4\u3044\u5263\u304C\u4E00\u77AC\u3001\u6DE1\u3044\u661F\u306E\u3088\u3046\u306B\u8F1D\u3044\u305F\u3002", "\u738B\u306E\u9593\u3078\u5411\u304B\u304A\u3046\u3002");
    }
    if (tag === "ruinsBoss" && !next.flags.ruinsBossDefeated) {
      next.flags.ruinsBossDefeated = true;
      notes.push("\u5B88\u8B77\u8005\u304C\u5D29\u308C\u3001\u5965\u306E\u53F0\u5EA7\u3078\u7D9A\u304F\u9053\u304C\u958B\u3051\u305F\u3002");
    }
    if (tag === "voldBoss") {
      if (next.stage !== "S08" || !next.flags.onyxSealOpen || next.flags.bossDefeated) throw Error("\u9B54\u738B\u6226\u306E\u9032\u884C\u6761\u4EF6\u304C\u4E0D\u6B63");
      next.flags.bossDefeated = true;
      next.stage = "S09";
      notes.push(
        "\u9B54\u738B\u30F4\u30A9\u30EB\u30C9\u306F\u819D\u3092\u3064\u304D\u3001\u305D\u306E\u8EAB\u304B\u3089\u95C7\u304C\u6D88\u3048\u3066\u3044\u3063\u305F\u3002",
        "\u30F4\u30A9\u30EB\u30C9\u300C\u4EBA\u304C\u2026\u2026\u307E\u305F\u8AB0\u304B\u3092\u5B88\u308D\u3046\u3068\u3059\u308B\u306E\u304B\u2026\u2026\u300D",
        "\u9B54\u738B\u30F4\u30A9\u30EB\u30C9\u306F\u5012\u308C\u305F\u3002\u3082\u3046\u4E8C\u5EA6\u3068\u3001\u305D\u306E\u7389\u5EA7\u306B\u7ACB\u3064\u3053\u3068\u306F\u306A\u3044\u3002",
        "\u57CE\u3092\u8986\u3063\u3066\u3044\u305F\u9ED2\u3044\u96F2\u304C\u6674\u308C\u3001\u5404\u5730\u3078\u5411\u304B\u3063\u3066\u3044\u305F\u9B54\u7269\u305F\u3061\u306F\u7D71\u7387\u3092\u5931\u3063\u3066\u9000\u3044\u3066\u3044\u3063\u305F\u3002",
        "\u5E30\u9084\u306E\u9053\u304C\u958B\u304B\u308C\u305F\u3002" + s.name + "\u306F\u30A2\u30EB\u30C6\u30EA\u30A2\u57CE\u3078\u623B\u308B\u3002",
        "\u30A2\u30EB\u30C9\u738B\u306B\u3001\u9B54\u738B\u8A0E\u4F10\u3092\u5831\u544A\u3057\u3088\u3046\u3002"
      );
      next.pos = { map: "castle", x: 7, y: 9, facing: "up" };
    }
    if (tag === "caveBoss" && !next.flags.caveBossDefeated) {
      next.flags.caveBossDefeated = true;
      notes.push("\u6D1E\u7A9F\u306E\u5965\u306B\u9759\u3051\u3055\u304C\u623B\u3063\u305F\u3002\u898B\u5F35\u308A\u3092\u52A9\u3051\u3088\u3046\uFF01");
    }
    return { state: next, messages: notes, autoSave: leveled || tag === "tutorial" || tag === "caveBoss" || tag === "ruinsBoss" || tag === "voldBoss" };
  }
  function defeat(s) {
    const next = clone(s);
    next.player.gold = Math.floor(next.player.gold / 2);
    next.player.hp = maxHp(next.player.level);
    next.player.mp = maxMp(next.player.level);
    next.player.status = "normal";
    next.pos = { map: "castle", x: 7, y: 9, facing: "up" };
    return { state: next, autoSave: true, messages: ["\u610F\u8B58\u304C\u9060\u306E\u3044\u3066\u3044\u304F\u2026\u2026\u3002", "\u30A2\u30EB\u30C6\u30EA\u30A2\u57CE\u3067\u76EE\u3092\u899A\u307E\u3057\u305F\u3002\u6240\u6301\u91D1\u304C\u534A\u5206\u306B\u306A\u3063\u305F\u3002", "\u5927\u5207\u306A\u9375\u3084\u3001\u958B\u3044\u305F\u9580\u306E\u8A18\u9332\u306F\u5931\u308F\u308C\u3066\u3044\u306A\u3044\u3002"] };
  }
  function useItem(s, id) {
    const next = clone(s), item = itemById(id);
    if (!item || !int(next.inventory[id], 1, 999)) return { state: next, used: false, message: "\u305D\u306E\u9053\u5177\u306F\u6301\u3063\u3066\u3044\u306A\u3044\u3002" };
    if (item.effect === "gate" || item.effect === "escape") return { state: next, used: false, message: "\u3053\u306E\u9053\u5177\u306F\u3053\u3053\u3067\u306F\u4F7F\u3048\u306A\u3044\u3002" };
    if (item.effect === "poison") {
      if (next.player.status !== "poison") return { state: next, used: false, message: "\u6BD2\u306B\u306F\u304B\u304B\u3063\u3066\u3044\u306A\u3044\u3002" };
      next.player.status = "normal";
    } else {
      if (next.player.hp === maxHp(next.player.level)) return { state: next, used: false, message: "HP\u306F\u6E80\u30BF\u30F3\u3060\u3002" };
      next.player.hp = Math.min(maxHp(next.player.level), next.player.hp + item.amount);
    }
    next.inventory[id]--;
    return { state: next, used: true, message: item.name + "\u3092\u4F7F\u3063\u305F\u3002" };
  }
  function buy(s, id) {
    const item = itemById(id);
    if (!item || !item.price) throw Error("\u8CA9\u58F2\u5BFE\u8C61\u5916");
    const next = clone(s);
    if (next.player.gold < item.price) return { state: next, ok: false, message: "\u30B4\u30FC\u30EB\u30C9\u304C\u8DB3\u308A\u306A\u3044\u3002" };
    if (next.inventory[id] >= 99) return { state: next, ok: false, message: "\u3053\u308C\u4EE5\u4E0A\u306F\u6301\u3066\u306A\u3044\u3002" };
    next.player.gold -= item.price;
    next.inventory[id]++;
    return { state: next, ok: true, message: item.name + "\u3092\u8CB7\u3063\u305F\u3002" };
  }
  function rest(s) {
    const next = clone(s);
    if (next.player.gold < 12) return { state: next, ok: false, message: "\u5BBF\u6CCA\u4EE3\u304C\u8DB3\u308A\u306A\u3044\u3002" };
    next.player.gold -= 12;
    next.player.hp = maxHp(next.player.level);
    next.player.mp = maxMp(next.player.level);
    next.player.status = "normal";
    return { state: next, ok: true, message: "\u3086\u3063\u304F\u308A\u4F11\u3093\u3060\u3002 HP\u3068MP\u304C\u56DE\u5FA9\u3057\u305F\u3002" };
  }
  validateWorld();
  var equipmentOwnedKey = (type, id) => type === "armors" && ["iron", "mythril"].includes(id) ? "armor:" + id : id;
  function ownsEquipment(s, type, id) {
    const key = equipmentOwnedKey(type, id);
    return s.owned.includes(key) || key !== id && s.equipment.armor === id && s.owned.includes(id);
  }
  function buyEquipment(s, id, category) {
    if (category !== void 0 && !Object.hasOwn(catalog_default.equipment, category)) throw Error("\u88C5\u5099\u30AB\u30C6\u30B4\u30EA\u4E0D\u6B63");
    const resolved = category || Object.keys(catalog_default.equipment).find((type) => catalog_default.equipment[type].some((x) => x.id === id));
    const e = catalog_default.equipment[resolved]?.find((x) => x.id === id);
    if (!e || !e.price) throw Error("\u975E\u58F2\u54C1\u306E\u88C5\u5099");
    const next = clone(s);
    category = resolved;
    if (ownsEquipment(next, category, id)) return { state: next, ok: false, message: "\u3059\u3067\u306B\u6301\u3063\u3066\u3044\u308B\u3002" };
    if (next.player.gold < e.price) return { state: next, ok: false, message: "\u30B4\u30FC\u30EB\u30C9\u304C\u8DB3\u308A\u306A\u3044\u3002" };
    next.player.gold -= e.price;
    next.owned.push(equipmentOwnedKey(category, id));
    const slot = { weapons: "weapon", armors: "armor", shields: "shield", accessories: "accessory" }[category];
    next.equipment[slot] = id;
    return { state: next, ok: true, message: e.name + "\u3092\u8CB7\u3063\u3066\u88C5\u5099\u3057\u305F\uFF01" };
  }
  function equip(s, id, category) {
    const next = clone(s);
    const matches = Object.entries(catalog_default.equipment).filter(([, list]) => list.some((x) => x.id === id));
    if (!category) category = matches[0]?.[0];
    if (!matches.some(([key]) => key === category)) throw Error("\u4E0D\u660E\u306A\u88C5\u5099");
    if (!ownsEquipment(next, category, id)) throw Error("\u672A\u6240\u6301\u306E\u88C5\u5099");
    const slot = { weapons: "weapon", armors: "armor", shields: "shield", accessories: "accessory" }[category];
    next.equipment[slot] = id;
    return { state: next, message: "\u88C5\u5099\u3092\u5909\u66F4\u3057\u305F\u3002" };
  }

  // src/game/combat.mjs
  function beginCombat(enemyId, tag = "random") {
    const enemy = monsterById(enemyId);
    if (!enemy) throw Error("\u672A\u5B9A\u7FA9\u306E\u6575: " + enemyId);
    return { id: enemyId, hp: enemy.hp, tag, round: 1, asleep: 0, silenced: 0, ward: 0 };
  }
  var roll = (rng, min, max) => Math.floor(min + (max - min + 1) * rng());
  function strike(attack, defense, rng) {
    return Math.max(1, Math.floor(attack * (0.82 + rng() * 0.42)) - Math.floor(defense * 0.5));
  }
  function combatTurn(state2, combat, action, rng = Math.random) {
    let s = clone(state2), b = clone(combat);
    const e = monsterById(b.id), lines = [];
    if (!action || typeof action !== "object") throw Error("\u6226\u95D8\u30B3\u30DE\u30F3\u30C9\u4E0D\u6B63");
    if (action.type === "run" || action.type === "item" && action.id === "smoke") {
      if (b.tag !== "random") return { state: s, battle: b, lines: ["\u3053\u3053\u3067\u306F\u9003\u3052\u3089\u308C\u306A\u3044\uFF01"], outcome: "continue" };
      if (action.type === "item") {
        if (s.inventory.smoke < 1) return { state: s, battle: b, lines: ["\u3051\u3080\u308A\u7389\u3092\u6301\u3063\u3066\u3044\u306A\u3044\u3002"], outcome: "continue" };
        s.inventory.smoke--;
        lines.push("\u3051\u3080\u308A\u7389\u3092\u6295\u3052\u305F\uFF01");
      }
      const escapeChance = Math.max(0.35, Math.min(0.85, 0.55 + (stats(s).speed - e.speed) * 0.025));
      if (action.type === "item" || rng() < escapeChance) return { state: s, battle: null, lines: [...lines, "\u3046\u307E\u304F\u9003\u3052\u304D\u308C\u305F\uFF01"], outcome: "escaped" };
      lines.push("\u9003\u3052\u3089\u308C\u306A\u304B\u3063\u305F\uFF01");
    } else if (action.type === "attack") {
      if (rng() < 0.05) lines.push(s.name + "\u306E\u653B\u6483\u306F\u5916\u308C\u305F\uFF01");
      else {
        const damage = strike(stats(s).attack, e.defense, rng);
        b.hp = Math.max(0, b.hp - damage);
        lines.push(s.name + "\u306E\u653B\u6483\uFF01 " + e.name + "\u306B" + damage + "\u30C0\u30E1\u30FC\u30B8\u3002");
      }
    } else if (action.type === "spell") {
      const spell = spellById(action.id);
      if (!spell || s.player.level < spell.level) return { state: s, battle: b, lines: ["\u305D\u306E\u546A\u6587\u306F\u307E\u3060\u4F7F\u3048\u306A\u3044\u3002"], outcome: "continue" };
      if (!["heal", "damage", "sleep", "silence", "ward"].includes(spell.kind)) return { state: s, battle: b, lines: ["\u3053\u306E\u546A\u6587\u306F\u6226\u95D8\u4E2D\u306B\u306F\u4F7F\u3048\u306A\u3044\u3002"], outcome: "continue" };
      const cost = Math.max(1, spell.mp - (s.equipment.accessory === "star-orb" ? 1 : 0));
      if (spell.kind === "heal" && s.player.hp === maxHp(s.player.level)) return { state: s, battle: b, lines: ["HP\u306F\u6E80\u30BF\u30F3\u3060\u3002"], outcome: "continue" };
      if (s.player.mp < cost) return { state: s, battle: b, lines: ["MP\u304C\u8DB3\u308A\u306A\u3044\uFF01"], outcome: "continue" };
      s.player.mp -= cost;
      if (spell.kind === "heal") {
        const heal = Math.min(maxHp(s.player.level) - s.player.hp, spell.power);
        s.player.hp += heal;
        lines.push(spell.name + "\uFF01 HP\u304C" + heal + "\u56DE\u5FA9\u3057\u305F\u3002");
      } else if (spell.kind === "damage") {
        const damage = Math.max(1, spell.power + roll(rng, -3, 3) - Math.floor(e.defense / 3));
        b.hp = Math.max(0, b.hp - damage);
        lines.push(spell.name + "\uFF01 " + e.name + "\u306B" + damage + "\u30C0\u30E1\u30FC\u30B8\u3002");
      } else if (spell.kind === "sleep") {
        if (b.id === "vold") lines.push(spell.name + "\uFF01 \u3057\u304B\u3057\u9B54\u738B\u306B\u7720\u308A\u306E\u8853\u306F\u52B9\u304B\u306A\u304B\u3063\u305F\u3002");
        else {
          b.asleep = 3;
          lines.push(spell.name + "\uFF01 " + e.name + "\u306F\u7720\u308A\u8FBC\u3093\u3060\u3002");
        }
      } else if (spell.kind === "silence") {
        if (b.id === "vold") lines.push(spell.name + "\uFF01 \u3057\u304B\u3057\u9B54\u738B\u306E\u95C7\u306E\u529B\u3092\u5C01\u3058\u3089\u308C\u306A\u3044\u3002");
        else {
          b.silenced = 4;
          lines.push(spell.name + "\uFF01 " + e.name + "\u306E\u8853\u3092\u5C01\u3058\u305F\u3002");
        }
      } else if (spell.kind === "ward") {
        b.ward = 4;
        lines.push(spell.name + "\uFF01 \u661F\u306E\u5B88\u308A\u304C\u8EAB\u3092\u5305\u3093\u3060\u3002\u6B21\u306E3\u56DE\u306E\u88AB\u30C0\u30E1\u30FC\u30B8\u3092\u8EFD\u6E1B\u3059\u308B\u3002");
      }
    } else if (action.type === "item") {
      const r = useItem(s, action.id);
      s = r.state;
      if (!r.used) return { state: s, battle: b, lines: [r.message], outcome: "continue" };
      lines.push(r.message);
    } else throw Error("\u672A\u5B9A\u7FA9\u306E\u6226\u95D8\u30B3\u30DE\u30F3\u30C9: " + action.type);
    if (b.hp === 0) {
      const win = gainVictory(s, b.id, b.tag);
      return { state: win.state, battle: null, lines: [...lines, ...win.messages], outcome: "won", autoSave: win.autoSave };
    }
    if (b.id === "vold" && b.hp <= e.hp / 2 && b.round === 3) lines.push("\u30F4\u30A9\u30EB\u30C9\u300C\u4EBA\u9593\u304C\u2026\u2026\u3053\u3053\u307E\u3067\u6297\u3046\u3068\u306F\uFF01\u300D");
    if (b.asleep > 0) {
      lines.push(e.name + "\u306F\u7720\u3063\u3066\u3044\u308B\u2026\u2026\u3002");
      b.asleep--;
    } else if (["m12", "m18", "m21", "m22", "m23", "vold"].includes(b.id) && rng() < 0.32) {
      if (b.silenced > 0) lines.push(e.name + "\u306F\u546A\u6587\u3092\u5531\u3048\u3088\u3046\u3068\u3057\u305F\u304C\u3001\u5C01\u3058\u3089\u308C\u3066\u3044\u308B\uFF01");
      else {
        const spellDamage = Math.max(3, Math.floor(e.attack * 0.72) + roll(rng, 0, 4));
        const damage = b.ward > 0 ? Math.max(1, Math.ceil(spellDamage * 0.5)) : spellDamage;
        s.player.hp = Math.max(0, s.player.hp - damage);
        lines.push(e.name + "\u306E\u95C7\u306E\u8853\uFF01 " + damage + "\u30C0\u30E1\u30FC\u30B8\u3092\u53D7\u3051\u305F\u3002");
      }
    } else if (rng() < 0.04) lines.push(e.name + "\u306E\u653B\u6483\u306F\u5916\u308C\u305F\uFF01");
    else if (rng() < 0.06) lines.push(s.name + "\u306F\u653B\u6483\u3092\u304B\u308F\u3057\u305F\uFF01");
    else {
      const rawDamage = strike(e.attack, stats(s).defense, rng);
      const damage = b.ward > 0 ? Math.max(1, Math.ceil(rawDamage * 0.5)) : rawDamage;
      s.player.hp = Math.max(0, s.player.hp - damage);
      lines.push(e.name + "\u306E\u653B\u6483\uFF01 " + damage + "\u30C0\u30E1\u30FC\u30B8\u3092\u53D7\u3051\u305F\u3002");
      if (e.status === "poison" && rng() < 0.2) {
        s.player.status = "poison";
        lines.push(s.name + "\u306F\u6BD2\u306B\u304A\u304B\u3055\u308C\u305F\uFF01");
      }
    }
    if (s.player.hp === 0) {
      const lost = defeat(s);
      return { state: lost.state, battle: null, lines: [...lines, ...lost.messages], outcome: "lost", autoSave: true };
    }
    if (s.player.status === "poison") {
      const poison = Math.min(s.player.hp - 1, 2);
      if (poison > 0) {
        s.player.hp -= poison;
        lines.push("\u6BD2\u306E\u30C0\u30E1\u30FC\u30B8\u3092" + poison + "\u53D7\u3051\u305F\u3002");
      }
    }
    if (b.silenced > 0) b.silenced--;
    if (b.ward > 0) b.ward--;
    b.round++;
    return { state: s, battle: b, lines, outcome: "continue" };
  }

  // src/game/art.mjs
  var block = (c, x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  var dot = (c, x, y, color, w = 1, h = 1) => block(c, x, y, w, h, color);
  var palettes = {
    field: ["#365f46", "#234a3a", "#75ad63", "#bed281"],
    castle: ["#8898a4", "#58677b", "#27384f", "#d7ba76"],
    leaf: ["#b99e81", "#887660", "#ebd4a7", "#5c7e64"],
    sailun: ["#b0b9ae", "#788f91", "#d9cdad", "#5f91a4"],
    cave: ["#4b4e60", "#34374c", "#776b83", "#a7a0b7"],
    ruins: ["#787b8c", "#545d72", "#b5ad9d", "#a9c4b7"],
    onyx: ["#3b3549", "#211f34", "#675273", "#a87bba"]
  };
  var hash = (x, y, s = 0) => (Math.imul(x + 127, 73856093) ^ Math.imul(y + 281, 19349663) ^ Math.imul(s + 1, 83492791)) >>> 0;
  function drawTile(c, id, x, y, wx, wy, mapId) {
    const p = palettes[mapId] || palettes.field, seed = hash(wx, wy, id), variation = seed % 5;
    const field = mapId === "field", castle = mapId === "castle", town = ["leaf", "sailun"].includes(mapId), dungeon = ["cave", "ruins", "onyx"].includes(mapId);
    const floor = dungeon ? p[0] : town ? p[0] : p[0];
    block(c, x, y, 16, 16, floor);
    if (id === 0) {
      block(c, x, y, 16, 16, field ? "#365d43" : town ? "#68846a" : p[0]);
      if (variation < 3) {
        dot(c, x + 2 + seed % 7, y + 5, "#4c8356", 2, 1);
        dot(c, x + 10, y + 11, "#72a66b", 2, 2);
      }
      if (seed % 19 === 0) {
        dot(c, x + 7, y + 7, "#e3c76e", 2, 2);
        dot(c, x + 7, y + 6, "#f9eee0");
      }
      if (seed % 13 === 0) {
        dot(c, x + 3, y + 12, "#244b3b", 3, 1);
      }
    } else if (id === 1) {
      const wall = castle ? "#4b6075" : mapId === "leaf" ? "#a77965" : mapId === "sailun" ? "#6b8f91" : mapId === "ruins" ? "#6a7788" : mapId === "onyx" ? "#302b42" : "#45475b";
      block(c, x, y, 16, 16, wall);
      block(c, x, y, 16, 3, mapId === "onyx" ? "#655173" : mapId === "leaf" ? "#d6ad81" : p[2]);
      block(c, x, y + 7, 16, 1, mapId === "onyx" ? "#18192b" : "#384557");
      dot(c, x + (wx % 2 ? 3 : 9), y + 3, "#253343", 1, 4);
      dot(c, x + (wx % 2 ? 11 : 4), y + 9, "#344050", 1, 6);
      if (variation === 0) {
        dot(c, x + 3, y + 11, p[3], 2, 2);
      }
      if (mapId === "leaf") {
        block(c, x + 1, y + 4, 2, 11, "#775349");
        block(c, x + 12, y + 4, 2, 11, "#775349");
      }
      if (mapId === "sailun") {
        dot(c, x + 4, y + 4, "#c3d2c6", 5, 2);
      }
      if (mapId === "onyx") {
        dot(c, x + 5, y + 5, "#614775", 2, 2);
      }
    } else if (id === 2) {
      block(c, x, y, 16, 16, mapId === "sailun" ? "#347b8d" : "#2b7183");
      block(c, x, y, 16, 2, "#235c76");
      dot(c, x + seed % 5, y + 6, "#6ac2c0", 7, 1);
      dot(c, x + 7, y + 12, "#a0d4be", 5, 1);
      dot(c, x + 2, y + 9, "#226379", 3, 1);
    } else if (id === 3) {
      block(c, x, y, 16, 16, field ? "#ad9367" : town ? "#bdad98" : "#a69a86");
      if (field) {
        dot(c, x + 2, y + 5, "#d5ba83", 5, 2);
        dot(c, x + 11, y + 11, "#8c785c", 4, 1);
        if (variation < 2) dot(c, x + 6, y + 13, "#dbc398", 3, 1);
      } else {
        block(c, x, y + 8, 16, 1, "#897f78");
        dot(c, x + (wx % 2 ? 4 : 12), y, "#82796d", 1, 9);
        dot(c, x + (wx % 2 ? 12 : 4), y + 9, "#82796d", 1, 7);
      }
    } else if (id === 4) {
      block(c, x, y, 16, 16, "#234c3b");
      block(c, x + 7, y + 10, 3, 6, "#65513d");
      for (const [dx, dy, w, h, co] of [[3, 5, 10, 8, "#2c7048"], [1, 7, 6, 6, "#326e48"], [5, 2, 8, 8, "#408451"], [9, 7, 6, 5, "#487f50"], [5, 3, 3, 2, "#6b9d58"], [12, 9, 2, 2, "#6c9b51"]]) block(c, x + dx, y + dy, w, h, co);
      block(c, x + 3, y + 12, 4, 2, "#285e41");
      if (variation === 0) dot(c, x + 4, y + 6, "#a3bb72", 2, 2);
    } else if (id === 5) {
      block(c, x, y, 16, 16, dungeon ? "#252538" : "#594b45");
      block(c, x + 2, y + 1, 12, 15, p[2]);
      block(c, x + 4, y + 4, 8, 11, dungeon ? "#1c2531" : "#77543f");
      block(c, x + 5, y + 5, 6, 9, dungeon ? "#303449" : "#9d704b");
      dot(c, x + 10, y + 10, "#f1d29a", 2, 2);
      block(c, x + 3, y + 1, 10, 2, p[3]);
    } else if (id === 6) {
      block(c, x, y, 16, 16, "#aa966b");
      block(c, x + 1, y, 14, 16, "#293c4e");
      for (let t = 3; t < 16; t += 4) block(c, x + t, y + 1, 2, 15, "#9eafbc");
      block(c, x + 1, y + 3, 14, 2, "#d1c6ab");
      block(c, x + 1, y + 12, 14, 2, "#6d7f8c");
      dot(c, x + 7, y + 7, "#efd18b", 2, 2);
    } else if (id === 7) {
      block(c, x, y, 16, 16, p[0]);
      block(c, x, y, 16, 1, p[1]);
      block(c, x, y + 14, 16, 2, p[1]);
      if ((wx + wy) % 2 === 0) {
        block(c, x + 1, y + 2, 14, 11, castle ? "#96a7b2" : p[2]);
        block(c, x + 1, y + 10, 14, 2, p[0]);
      } else {
        block(c, x + 1, y + 2, 14, 11, castle ? "#81939f" : p[0]);
        dot(c, x + 11, y + 3, p[2], 3, 2);
      }
      if (mapId === "onyx") {
        dot(c, x + 3, y + 4, "#776286", 2, 2);
      }
    } else if (id === 8) {
      block(c, x, y, 16, 16, mapId === "onyx" ? "#3b2a4c" : "#80404a");
      block(c, x + 3, y, 10, 16, mapId === "onyx" ? "#8b527c" : "#ac4455");
      block(c, x + 3, y, 2, 16, "#e1b77a");
      block(c, x + 11, y, 2, 16, "#e1b77a");
      if (wy % 2 === 0) dot(c, x + 7, y + 5, "#ebcf94", 2, 3);
    } else if (id === 9) {
      block(c, x, y, 16, 16, p[0]);
      block(c, x, y + 13, 16, 3, p[1]);
      dot(c, x + 3, y + 4, p[2], 5, 2);
      dot(c, x + 11, y + 8, p[1], 4, 3);
      if (variation < 3) {
        dot(c, x + 7, y + 12, p[3], 2, 1);
        dot(c, x + 2, y + 10, p[1], 2, 1);
      }
      if (mapId === "onyx") {
        dot(c, x + 6, y + 6, "#7e538d", 3, 3);
        dot(c, x + 7, y + 7, "#bc85b9");
      }
      if (mapId === "ruins") {
        dot(c, x + 8, y + 3, "#a8a7a1", 4, 2);
      }
    } else if (id === 10) {
      block(c, x, y, 16, 16, p[1]);
      block(c, x, y, 16, 3, p[2]);
      block(c, x + 2, y + 3, 11, 6, p[0]);
      block(c, x + 6, y + 9, 9, 4, p[0]);
      dot(c, x + 4, y + 5, p[3], 3, 1);
      dot(c, x + 11, y + 11, p[3], 2, 1);
    } else throw Error("\u672A\u5B9A\u7FA9\u306E\u5730\u5F62\u30BF\u30A4\u30EB " + id);
  }
  function drawPerson(c, x, y, kind = "hero", facing = "down") {
    const wears = { hero: ["#4b8bd1", "#2b4f84"], king: ["#ac4258", "#67294b"], watchman: ["#e9b965", "#88623b"], riona: ["#ad7dc4", "#634b91"], frontSoldier: ["#b6c1ca", "#586778"], lighthouse: ["#d9b374", "#74613a"], elder: ["#81a486", "#3c6860"], helper: ["#bf8489", "#82555e"], inn: ["#96ac7f", "#536a4b"], shop: ["#7e9eb6", "#48677a"], guard: ["#acbac6", "#5e768d"], refugee: ["#d09c77", "#8c705b"] }[kind] || ["#78b28f", "#427566"];
    const [coat, shadow] = wears;
    block(c, x + 4, y + 14, 8, 2, "#1b2738");
    block(c, x + 5, y + 11, 3, 4, shadow);
    block(c, x + 9, y + 11, 3, 4, shadow);
    block(c, x + 3, y + 7, 10, 6, coat);
    block(c, x + 4, y + 8, 2, 3, shadow);
    block(c, x + 10, y + 8, 2, 3, shadow);
    block(c, x + 4, y + 2, 8, 6, "#dba87e");
    block(c, x + 5, y + 1, 6, 2, kind === "riona" ? "#d5c4ed" : kind === "king" ? "#ddbd62" : "#463745");
    if (kind === "king") {
      block(c, x + 3, y, 10, 2, "#e7c56f");
      dot(c, x + 4, y - 2, "#e7c56f", 2, 3);
      dot(c, x + 10, y - 2, "#e7c56f", 2, 3);
    }
    if (kind === "riona") {
      block(c, x + 2, y + 3, 2, 9, "#7a5797");
      block(c, x + 12, y + 3, 2, 9, "#7a5797");
    }
    if (kind === "frontSoldier" || kind === "guard") {
      block(c, x + 3, y + 1, 10, 3, "#8c9caa");
      block(c, x + 5, y + 8, 6, 2, "#e2d9b4");
    }
    if (kind === "hero") {
      block(c, x + 4, y + 6, 8, 3, "#f0d5a6");
      dot(c, x + 10, y + 7, "#d9c280", 2, 2);
    }
    if (facing !== "up") {
      dot(c, x + 6, y + 5, "#263444");
      dot(c, x + 10, y + 5, "#263444");
    }
  }
  function drawObject(c, e, x, y, s) {
    const r = (dx, dy, w, h, co) => block(c, x + dx, y + dy, w, h, co), q = (dx, dy, co) => r(dx, dy, 1, 1, co);
    const k = e.kind;
    if (["raider", "caveBoss", "ruinsBoss", "onyxBoss"].includes(k)) {
      const base = k === "onyxBoss" ? "#6f3658" : k === "ruinsBoss" ? "#81939e" : "#a57759";
      r(3, 7, 10, 8, "#262738");
      r(4, 5, 8, 8, base);
      r(4, 2, 8, 5, "#51506a");
      r(5, 7, 2, 2, "#f8d48f");
      r(10, 7, 2, 2, "#f8d48f");
      if (k === "onyxBoss") {
        r(2, 1, 3, 6, "#913d63");
        r(11, 1, 3, 6, "#913d63");
      }
    } else if (k === "gate") return;
    else if (["onyxBarrier", "onyxSeal", "optionalDoor"].includes(k)) {
      const onyx = k !== "optionalDoor";
      r(1, 0, 14, 16, onyx ? "#241d37" : "#746659");
      r(3, 2, 10, 14, onyx ? "#563b68" : "#997e5e");
      r(6, 3, 4, 10, onyx ? "#ad81c7" : "#b5a183");
      q(11, 10, "#f2d48d");
    } else if (["onyxRuneA", "onyxRuneB", "switchA", "switchB"].includes(k)) {
      const glowing = Boolean(s.flags[k]);
      r(2, 1, 12, 15, "#27283f");
      r(3, 2, 10, 12, "#7f7f83");
      r(5, 5, 6, 6, glowing ? "#9ee9d9" : "#565d7c");
      r(7, 3, 2, 10, glowing ? "#e4fff1" : "#9096ae");
    } else if (k === "onyxForge" || k === "sword") {
      r(3, 12, 10, 3, "#846c62");
      r(5, 9, 6, 4, "#b7a38a");
      r(7, 2, 2, 10, s.flags.swordAwakened ? "#fff3ba" : "#b7c9d3");
      r(6, 4, 4, 3, "#cce2ef");
      r(4, 10, 8, 2, "#e3c479");
      q(8, 1, "#f9f5d4");
    } else if (k === "mirror") {
      r(4, 2, 8, 12, "#e4be72");
      r(5, 3, 6, 9, "#a8f4e6");
      r(6, 4, 4, 3, "#e8fff7");
      r(6, 13, 4, 2, "#8a715d");
    } else if (["chest", "ironChest", "ironKeyChest", "onyxChest"].includes(k)) {
      r(1, 6, 14, 9, "#4a2f36");
      r(2, 7, 12, 7, k === "onyxChest" ? "#624663" : "#9b673c");
      r(1, 5, 14, 3, "#d9a55b");
      r(2, 9, 12, 1, "#664333");
      r(7, 7, 3, 6, "#f2d27b");
      r(8, 9, 1, 2, "#6c503b");
    } else if (k === "star") {
      r(6, 1, 4, 3, "#f7df96");
      r(2, 5, 12, 3, "#aadddc");
      r(5, 3, 6, 9, "#fff0a9");
      r(7, 0, 2, 14, "#efffff");
      r(5, 6, 6, 4, "#e3e5ff");
      r(5, 12, 6, 2, "#786c9a");
    } else if (k === "mural") {
      r(1, 1, 14, 14, "#aa9677");
      r(3, 2, 10, 12, "#d0bea0");
      r(7, 5, 2, 7, "#574a58");
      r(5, 8, 7, 2, "#7b6870");
      q(8, 3, "#dfc87c");
    } else if (k === "sign") {
      r(7, 7, 2, 9, "#6d533d");
      r(1, 3, 14, 7, "#dfb873");
      r(2, 4, 12, 1, "#fff0bc");
      r(4, 7, 8, 1, "#9f704a");
    } else if (k === "onyxInscription") {
      r(2, 2, 12, 13, "#7a7182");
      r(4, 4, 8, 8, "#c4b1a2");
      r(7, 5, 2, 6, "#f0d2a3");
    } else throw Error("\u672A\u5B9A\u7FA9\u306E\u5730\u7269 " + k);
  }
  function drawEnemy(c, id, cx = 160, cy = 126) {
    const num = id === "vold" ? 25 : Number(id.slice(1));
    const s = id === "vold" ? 4 : 3, x = cx - 16 * s, y = cy - 18 * s;
    const fill = (px, py, w, h, color) => block(c, x + px * s, y + py * s, w * s, h * s, color);
    const accent = (px, py, color) => fill(px, py, 2, 2, color);
    const palette = [
      ["#6fc5a6", "#347d79", "#a6e8c0"],
      ["#ad8266", "#654d56", "#dbb290"],
      ["#d7ad75", "#815e5b", "#f3dbaf"],
      ["#80bd7a", "#4e845c", "#d9d986"],
      ["#b8a16a", "#6f7152", "#e4ce8c"],
      ["#a67459", "#59465c", "#dfc69c"],
      ["#af795c", "#605674", "#ddaf8b"],
      ["#6d8f9d", "#43536b", "#b7d4d8"],
      ["#b18b64", "#675068", "#efd09b"],
      ["#c7c6ba", "#62768b", "#fff5e4"],
      ["#9c9c9a", "#53597c", "#d9cfc3"],
      ["#9bb2ca", "#535a96", "#e1e7fa"],
      ["#c6bba1", "#73656c", "#f0e1c9"],
      ["#a8c1c4", "#5e748d", "#d7e8ed"],
      ["#8c9366", "#50566b", "#c1af80"],
      ["#70a48e", "#3f5367", "#b7dbb5"],
      ["#b98569", "#654456", "#e4c49b"],
      ["#a99a8a", "#53486a", "#dabcb0"],
      ["#7e9d7f", "#304e60", "#bfd2a4"],
      ["#8287a8", "#41456d", "#b7b7df"],
      ["#95678c", "#483657", "#c69fba"],
      ["#9da4a6", "#56526c", "#e2ecde"],
      ["#aa6581", "#4b3457", "#e8a5c8"],
      ["#797d9e", "#383459", "#c4b8e0"]
    ][num - 1] || ["#765069", "#241c3e", "#d6a6b9"];
    const [primary, dark, light] = palette;
    if ([1, 2, 3, 4, 5].includes(num)) {
      fill(6, 13, 20, 13, dark);
      fill(8, 10, 16, 14, primary);
      fill(11, 8, 10, 3, light);
      if (num === 1) {
        fill(10, 25, 12, 2, light);
        accent(11, 16, "#1b3b47");
        accent(20, 16, "#1b3b47");
      }
      if (num === 2) {
        fill(11, 8, 10, 6, primary);
        fill(5, 16, 4, 6, light);
        fill(23, 16, 4, 6, light);
      }
      if (num === 3) {
        fill(10, 1, 4, 14, light);
        fill(19, 0, 4, 14, light);
        fill(9, 12, 14, 6, primary);
      }
      if (num === 4) {
        fill(5, 14, 6, 6, light);
        fill(22, 14, 5, 6, light);
        fill(10, 21, 13, 2, dark);
      }
      if (num === 5) {
        for (let i = 0; i < 5; i++) fill(5 + i * 5, 7 + i % 2 * 2, 3, 8, light);
      }
      accent(12, 17, "#252b45");
      accent(20, 17, "#252b45");
    } else if ([6, 7, 15, 16, 17].includes(num)) {
      fill(7, 12, 18, 15, primary);
      fill(10, 5, 12, 10, light);
      fill(5, 15, 5, 12, dark);
      fill(22, 15, 5, 12, dark);
      fill(8, 25, 6, 6, dark);
      fill(19, 25, 6, 6, dark);
      if (num === 17) {
        fill(5, 1, 7, 11, dark);
        fill(20, 1, 7, 11, dark);
      }
      if (num === 16) {
        fill(10, 4, 12, 4, "#7ebd7a");
        fill(20, 10, 6, 3, "#83caa1");
      }
      if (num === 15) {
        fill(6, 8, 20, 4, dark);
        fill(9, 5, 14, 6, primary);
      }
      fill(11, 12, 3, 2, "#2a273e");
      fill(19, 12, 3, 2, "#2a273e");
      fill(14, 16, 5, 2, dark);
    } else if ([8, 9].includes(num)) {
      fill(9, 12, 14, 12, primary);
      fill(13, 10, 6, 6, light);
      for (let i = 0; i < 3; i++) {
        fill(i * 3, 8 + i * 3, 9, 4, dark);
        fill(23 + i * 3, 8 + i * 3, 9, 4, dark);
      }
      if (num === 9) {
        fill(13, 2, 6, 10, dark);
        fill(15, 1, 2, 3, light);
        fill(7, 23, 4, 8, dark);
        fill(21, 23, 4, 8, dark);
      }
      accent(12, 17, "#fce2a4");
      accent(20, 17, "#fce2a4");
    } else if ([10, 11, 12, 13, 22].includes(num)) {
      const ghost = [12, 22].includes(num);
      fill(8, 8, 16, 20, primary);
      fill(6, 13, 5, 14, dark);
      fill(21, 13, 5, 14, dark);
      fill(10, 5, 12, 12, light);
      fill(9, 2, 14, 5, dark);
      if (num === 10) {
        fill(13, 17, 6, 4, dark);
        fill(12, 23, 8, 2, light);
      }
      if (num === 11) {
        fill(9, 9, 14, 3, "#818797");
        fill(5, 25, 6, 6, dark);
      }
      if (num === 13) {
        for (let j = 8; j < 24; j += 5) fill(8, j, 17, 2, "#eee0bc");
      }
      if (ghost) {
        fill(5, 24, 5, 4, light);
        fill(14, 26, 5, 6, light);
        fill(24, 23, 3, 5, light);
      }
      accent(12, 13, num === 22 ? "#ec85cd" : "#282b3d");
      accent(20, 13, num === 22 ? "#ec85cd" : "#282b3d");
      if (num === 22) {
        fill(26, 0, 2, 26, "#aab0c2");
        fill(22, 3, 7, 3, "#c9c5d7");
      }
    } else if (num === 14) {
      fill(3, 16, 26, 10, primary);
      fill(20, 10, 10, 10, light);
      fill(24, 6, 3, 8, dark);
      fill(29, 7, 3, 8, dark);
      fill(6, 24, 4, 7, dark);
      fill(22, 24, 4, 7, dark);
      fill(0, 11, 7, 4, dark);
      accent(26, 15, "#23293d");
    } else if ([18, 19, 20, 24].includes(num)) {
      fill(7, 13, 21, 14, primary);
      fill(16, 3, 14, 12, light);
      fill(5, 17, 5, 10, dark);
      fill(23, 22, 6, 9, dark);
      for (let i = 0; i < 4; i++) fill(2 + i * 4, 8 + i, 6, 10, dark);
      fill(25, 12, 7, 4, primary);
      accent(26, 9, "#f8da9c");
      if (num === 19 || num === 24) {
        fill(13, 0, 4, 9, dark);
        fill(23, 0, 4, 9, dark);
      }
      if (num === 24) {
        fill(8, 4, 16, 5, "#dcb878");
        fill(4, 15, 2, 9, "#dcb878");
      }
    } else if ([21, 23, 25].includes(num)) {
      fill(5, 16, 22, 13, dark);
      fill(9, 8, 14, 17, primary);
      fill(11, 3, 10, 10, light);
      fill(3, 4, 8, 18, dark);
      fill(22, 4, 8, 18, dark);
      fill(7, 0, 5, 7, num === 25 ? "#a35b79" : primary);
      fill(20, 0, 5, 7, num === 25 ? "#a35b79" : primary);
      fill(11, 12, 4, 3, "#ffcc8e");
      fill(19, 12, 4, 3, "#ffcc8e");
      if (num === 25) {
        fill(1, 11, 6, 15, "#522a52");
        fill(26, 11, 6, 15, "#522a52");
        fill(13, 24, 6, 5, "#d5ab80");
      } else {
        fill(3, 19, 6, 7, primary);
        fill(24, 19, 5, 7, primary);
      }
    } else throw Error("\u672A\u5B9A\u7FA9\u306E\u6575\u63CF\u753BID " + id);
  }

  // src/game/render.mjs
  var TILE = 16;
  var W = 320;
  var H = 240;
  var rect = (c, x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  function viewport(s) {
    const m = MAPS[s.pos.map];
    const ox = m.width <= 20 ? Math.floor((W - m.width * TILE) / 2) : 0;
    const oy = m.height <= 15 ? Math.floor((H - m.height * TILE) / 2) : 0;
    return { ox, oy, cx: m.width <= 20 ? 0 : Math.min(m.width - 20, Math.max(0, s.pos.x - 10)), cy: m.height <= 15 ? 0 : Math.min(m.height - 15, Math.max(0, s.pos.y - 7)) };
  }
  var colors = { castle: "#b9d3e3", field: "#d1e6b2", leaf: "#e8d5aa", cave: "#bbafd1", sailun: "#b2e6e0", ruins: "#d6cdbb", onyx: "#e5abd4" };
  function star(c, x, y, size = 1, color = "#eed391") {
    rect(c, x, y - 2 * size, size, 5 * size, color);
    rect(c, x - 2 * size, y, size * 5, size, color);
  }
  function renderMap(canvas, s, light = 0) {
    const c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    const m = MAPS[s.pos.map], v = viewport(s);
    rect(c, 0, 0, W, H, "#0e1725");
    const screen = (x, y) => [(x - v.cx) * TILE + v.ox, (y - v.cy) * TILE + v.oy];
    for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
      const [sx, sy] = screen(x, y);
      if (sx < -16 || sy < -16 || sx >= W || sy >= H) continue;
      const id = m.tiles[y][x] === 6 && s.flags.gateOpen ? 3 : m.tiles[y][x];
      drawTile(c, id, sx, sy, x, y, m.id);
    }
    for (const e of m.objects) {
      if (!entityAt(s, m, e.x, e.y)) continue;
      const [x, y] = screen(e.x, e.y);
      drawObject(c, e, x, y, s);
    }
    for (const n of m.npcs) {
      const [x, y] = screen(n.x, n.y);
      drawPerson(c, x, y, n.kind);
    }
    const [px, py] = screen(s.pos.x, s.pos.y);
    rect(c, px + 3, py + 14, 10, 2, "#1c2b35");
    drawPerson(c, px, py, "hero", s.pos.facing);
    if (light > 0 && ["cave", "ruins", "onyx"].includes(m.id)) {
      const glow = (s.player.level + light) % 2 ? "#f4e1a4" : "#d2edec";
      star(c, px + 8, py - 3, 1, glow);
      for (const e of m.objects) {
        if (entityAt(s, m, e.x, e.y) && ["star", "chest", "ironChest", "ironKeyChest", "onyxChest", "mirror", "onyxForge", "onyxRuneA", "onyxRuneB", "switchA", "switchB"].includes(e.kind)) {
          const [ex, ey] = screen(e.x, e.y);
          if (ex >= 0 && ex < 310 && ey >= 18 && ey < 216) star(c, ex + 13, ey + 1, 1, "#f4dfa0");
        }
      }
    }
    rect(c, 1, 1, 318, 19, "#121f31");
    rect(c, 3, 3, 314, 15, "#2a3b51");
    rect(c, 4, 3, 2, 15, colors[m.id] || "#d5c49f");
    c.fillStyle = "#f4e8c9";
    c.font = "bold 10px monospace";
    c.textBaseline = "top";
    c.fillText(m.name, 10, 6);
    c.textAlign = "right";
    c.fillStyle = colors[m.id] || "#c2ddea";
    c.fillText("Lv " + s.player.level + "  " + s.stage, 309, 6);
    c.textAlign = "left";
    rect(c, 0, 224, 320, 16, "#0e1828");
    rect(c, 0, 224, 320, 1, "#8c7691");
    c.fillStyle = "#f1dfbc";
    c.font = "10px monospace";
    c.fillText("HP " + s.player.hp + "/" + stats(s).maxHp + "    MP " + s.player.mp + "/" + stats(s).maxMp + "    " + s.player.gold + " G", 8, 229);
  }
  function renderBattle(canvas, s, b) {
    const c = canvas.getContext("2d"), enemy = monsterById(b.id);
    c.imageSmoothingEnabled = false;
    const palette = {
      field: ["#182d3c", "#35495c", "#759071"],
      east: ["#263c47", "#617072", "#b7ab7c"],
      cave: ["#211f34", "#51465c", "#8c7691"],
      ruins: ["#232b3e", "#5b6773", "#9c9b8f"],
      onyx: ["#18172c", "#493150", "#9a5c85"]
    }[enemy.area] || ["#172738", "#4d6171", "#8c8791"];
    rect(c, 0, 0, W, H, palette[0]);
    for (let i = 0; i < 45; i++) {
      const x = (i * 73 + 23) % 320, y = (i * 47 + 13) % 154;
      rect(c, x, y, i % 7 === 0 ? 2 : 1, 1, i % 4 === 0 ? palette[2] : palette[1]);
    }
    for (let x of [23, 278]) {
      rect(c, x, 45, 19, 113, palette[1]);
      rect(c, x - 3, 47, 25, 7, palette[2]);
      for (let y = 59; y < 155; y += 17) rect(c, x + 2, y, 15, 2, palette[0]);
    }
    rect(c, 0, 155, 320, 3, palette[2]);
    rect(c, 0, 158, 320, 65, palette[1]);
    for (let i = 0; i < 13; i++) {
      rect(c, i * 67 % 320, 164 + i % 4 * 14, 28, 2, palette[0]);
      rect(c, i * 41 % 320, 179 + i % 3 * 13, 1, 12, palette[2]);
    }
    rect(c, 93, 159, 135, 7, palette[0]);
    rect(c, 105, 164, 110, 4, palette[2]);
    if (b.id === "vold") {
      star(c, 160, 79, 3, "#ba7ca5");
      star(c, 76, 115, 1, "#dbb38a");
      star(c, 248, 100, 1, "#dbb38a");
    }
    drawEnemy(c, b.id, 160, 125);
    c.fillStyle = "#f7e7c2";
    c.font = "bold 15px monospace";
    c.textAlign = "center";
    c.textBaseline = "top";
    c.fillText(enemy.name, 160, 24);
    c.font = "11px monospace";
    c.fillStyle = "#cdd9e3";
    c.fillText("\u6575 HP " + b.hp + "/" + enemy.hp + "  /  TURN " + b.round, 160, 45);
    if (b.ward > 0) {
      c.fillStyle = "#a4efdf";
      c.fillText("\u2726 \u5B88\u308A\u306E\u5149 " + (b.ward - 1), 160, 59);
    }
    c.textAlign = "left";
    c.strokeStyle = "#c6a66e";
    c.lineWidth = 3;
    c.strokeRect(3, 3, 314, 234);
    rect(c, 0, 221, 320, 19, "#101925");
    c.fillStyle = "#f7e8c4";
    c.font = "10px monospace";
    c.fillText(s.name + "  HP " + s.player.hp + "/" + stats(s).maxHp + "  MP " + s.player.mp + "/" + stats(s).maxMp, 10, 227);
  }

  // src/game/audio.mjs
  var N = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
  var pitch = (note, octave = 4) => note === null ? 0 : 440 * 2 ** (((octave - 4) * 12 + note - 9) / 12);
  var parse = (value) => {
    if (value === "-" || value === null) return 0;
    const match = /^([A-G](?:b)?)([1-7])$/.exec(value);
    if (!match) throw Error("\u97F3\u968E\u306E\u5B9A\u7FA9\u4E0D\u6B63: " + value);
    return pitch(N[match[1]], Number(match[2]));
  };
  var phrase = (text) => [...text.split(" "), ...Array(32).fill("-")].slice(0, 32);
  var tune = (bpm, lead, bass, chords, accent = 0) => ({ bpm, lead: phrase(lead), bass: phrase(bass), chords: phrase(chords), accent });
  var THEMES = Object.freeze({
    title: tune(
      106,
      "E5 - G5 B5 A5 - G5 E5 D5 - E5 G5 B5 - A5 G5 E5 - G5 - A5 C6 B5 - G5 E5 D5 - E5 G5 A5 - E5 -",
      "C3 - - G2 A2 - - E3 F3 - - C3 G2 - - G2 C3 - - G2 F3 - - C3 G2 - E3 - C3 - - -",
      "C4 - E4 G4 F4 - A4 C5 D4 - F4 A4 G4 - B4 D5 C4 - E4 G4 A3 - C4 F4 B3 - D4 G4 C4 - E4 - - -"
    ),
    castle: tune(
      95,
      "G4 - C5 - E5 G5 F5 - E5 D5 C5 - D5 E5 G5 - A5 - G5 E5 D5 - C5 - D5 E5 - F5 D5 C5 - -",
      "C3 - G2 - C3 - G2 - A2 - E3 - F3 - G2 - F3 - C3 - G2 - D3 - G2 - C3 - G2 - C3 -",
      "C4 - - E4 G4 - - E4 A3 - - C4 F4 - - D4 C4 - - E4 G3 - - B3 F3 - A3 C4 E4 - G4 -"
    ),
    field: tune(
      144,
      "C5 E5 G5 - A5 - G5 E5 F5 A5 C6 - B5 - G5 - E5 G5 A5 C6 D6 - C6 A5 G5 - E5 F5 G5 - C5 -",
      "C3 - C3 G2 A2 - A2 E3 F3 - F3 C3 G2 - G2 D3 C3 - C3 G2 F3 - F3 C3 G2 - G2 D3 C3 - G2 -",
      "E4 - G4 - C5 - E4 - F4 - A4 - C5 - A4 - G4 - B4 - D5 - B4 - F4 - A4 - C5 - G4 -"
    ),
    town: tune(
      112,
      "E5 G5 A5 - G5 E5 C5 - D5 E5 G5 - E5 - D5 - C5 E5 G5 - A5 G5 E5 - F5 E5 D5 - C5 - - -",
      "C3 - G2 - A2 - E3 - F3 - C3 - G2 - G2 - C3 - E3 - F3 - A2 - G2 - G2 - C3 - G2 -",
      "C4 - E4 - A3 - C4 - F3 - A3 - G3 - B3 - C4 - E4 - F3 - C4 - G3 - D4 - C4 -"
    ),
    cave: tune(
      76,
      "C4 - - - Eb4 - G4 - Gb4 - - D4 Eb4 - - - C4 - - Bb3 - D4 - G4 - F4 Eb4 - D4 - - -",
      "C2 - C2 - G2 - C2 - Eb2 - Eb2 - Bb2 - G2 - C2 - C2 - G2 - Bb2 - Eb2 - Bb2 - G2 -",
      "C3 - - G3 - - Eb3 - Bb3 - - F3 - - D3 - C3 - - G3 - - F3 - Bb3 - G3 - - -"
    ),
    ruins: tune(
      88,
      "A4 - C5 - D5 - C5 - G4 - Bb4 - A4 - - - F4 - A4 C5 - Eb5 - D5 - C5 - A4 G4 - - -",
      "D2 - A2 - F2 - A2 - G2 - D3 - C3 - D2 - Bb2 - F2 - G2 - C3 - D3 - A2 - D2 -",
      "D4 - F4 - A4 - D5 - C4 - F4 - Bb4 - D5 - Bb3 - D4 - G4 - C5 - A3 - D4 - F4 -"
    ),
    onyx: tune(
      132,
      "D5 - F5 Ab5 G5 - F5 D5 C5 - D5 F5 Ab5 - G5 - Bb5 A5 Ab5 - F5 - D5 - Eb5 F5 G5 - Ab5 - F5 D5 -",
      "D2 D2 A2 D2 F2 F2 C3 F2 Eb2 Eb2 Bb2 Eb2 D2 D2 A2 D2 Bb1 Bb1 F2 Bb1 Ab1 Ab1 Eb2 Ab1 G1 G1 D2 G1 D2 D2 A2 D2",
      "D4 - F4 - Ab4 - F4 - C4 - Eb4 - G4 - Eb4 - Bb3 - D4 - F4 - D4 - Ab3 - C4 - Eb4 - C4 -"
    ),
    battle: tune(
      174,
      "E5 E5 - G5 A5 G5 E5 D5 E5 - G5 B5 A5 - G5 E5 F5 F5 - A5 C6 B5 A5 G5 E5 - G5 A5 B5 A5 G5 -",
      "E2 E2 B2 E2 E2 B2 D3 B2 C3 C3 G2 C3 D3 D3 A2 D3 E2 E2 B2 E2 F2 F2 C3 F2 G2 G2 D3 G2 E2 E2 B2 E2",
      "E4 - G4 B4 E4 - G4 B4 C4 - E4 G4 D4 - F4 A4 E4 - G4 B4 F4 - A4 C5 G4 - B4 D5 E4 - G4 B4",
      1
    ),
    boss: tune(
      164,
      "D5 - D5 Eb5 F5 - Ab5 - A5 Ab5 F5 Eb5 D5 - C5 - D5 F5 Ab5 A5 C6 - Bb5 Ab5 G5 - F5 Eb5 D5 - - -",
      "D2 D2 D2 A1 D2 D2 F2 D2 Eb2 Eb2 Eb2 Bb1 Eb2 Eb2 G2 Eb2 F2 F2 F2 C2 F2 F2 Ab2 F2 G2 G2 G2 D2 A1 A1 A1 D2",
      "D4 - F4 Ab4 D4 - F4 Ab4 Eb4 - G4 Bb4 Eb4 - G4 Bb4 F4 - Ab4 C5 F4 - Ab4 C5 G4 - Bb4 D5 A3 - D4 F4",
      2
    ),
    ending: tune(
      92,
      "C5 - E5 - G5 - C6 - B5 A5 G5 - E5 - D5 - F5 - A5 - C6 - B5 G5 E5 - F5 D5 C5 - - -",
      "C3 - G2 - C3 - E3 - F3 - C3 - G2 - C3 - A2 - E3 - F3 - C3 - G2 - C3 - G2 -",
      "C4 - E4 - G4 - E4 - F4 - A4 - C5 - A4 - A3 - C4 - E4 - C4 - F4 - A4 - G4 - E4 -"
    )
  });
  var randNoise = (context) => {
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.12), context.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 229;
    for (let i = 0; i < data.length; i++) {
      seed = seed * 1664525 + 1013904223 >>> 0;
      data[i] = (seed / 4294967295 * 2 - 1) * 0.5;
    }
    return buffer;
  };
  var GameAudio = class {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.music = null;
      this.sfx = null;
      this.noise = null;
      this.muted = false;
      this.theme = "title";
      this.step = 0;
      this.nextAt = 0;
      this.timer = null;
      this.noteCount = 0;
      this.effectCount = 0;
      this.available = Boolean(globalThis.AudioContext || globalThis.webkitAudioContext);
    }
    async unlock() {
      if (this.muted || !this.available) return false;
      try {
        if (!this.ctx) {
          const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
          this.ctx = new Context();
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.55;
          this.master.connect(this.ctx.destination);
          this.music = this.ctx.createGain();
          this.music.gain.value = 0.3;
          this.music.connect(this.master);
          this.sfx = this.ctx.createGain();
          this.sfx.gain.value = 0.45;
          this.sfx.connect(this.master);
          this.noise = randNoise(this.ctx);
        }
        await this.ctx.resume();
        if (!this.timer) {
          this.nextAt = this.ctx.currentTime + 0.05;
          this.timer = setInterval(() => this.schedule(), 65);
        }
        this.schedule();
        return true;
      } catch (err) {
        console.warn("[RPG Audio] \u97F3\u58F0\u3092\u958B\u59CB\u3067\u304D\u307E\u305B\u3093:", err);
        return false;
      }
    }
    setTheme(next) {
      if (!THEMES[next]) throw Error("\u672A\u5B9A\u7FA9\u306EBGM: " + next);
      if (this.theme !== next) {
        this.theme = next;
        this.step = 0;
        if (this.ctx) this.nextAt = this.ctx.currentTime + 0.055;
      }
    }
    setMuted(value) {
      this.muted = Boolean(value);
      if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.55, this.ctx.currentTime, 0.02);
      return this.muted;
    }
    tone(freq, at, duration, { type = "square", level = 0.13, bus = this.music, slide = 0 } = {}) {
      if (!freq || !this.ctx || this.muted) return;
      const osc = this.ctx.createOscillator(), env = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(45, freq), at);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(45, freq + slide), at + Math.min(duration, 0.14));
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(level, at + 6e-3);
      env.gain.setValueAtTime(level * 0.82, at + Math.min(0.04, duration * 0.4));
      env.gain.exponentialRampToValueAtTime(1e-3, at + duration);
      osc.connect(env);
      env.connect(bus);
      osc.start(at);
      osc.stop(at + duration + 8e-3);
      this.noteCount++;
    }
    drum(at, level = 0.045) {
      if (!this.ctx || this.muted) return;
      const src = this.ctx.createBufferSource(), env = this.ctx.createGain(), hp = this.ctx.createBiquadFilter();
      src.buffer = this.noise;
      hp.type = "highpass";
      hp.frequency.value = 750;
      env.gain.setValueAtTime(level, at);
      env.gain.exponentialRampToValueAtTime(1e-3, at + 0.05);
      src.connect(hp);
      hp.connect(env);
      env.connect(this.music);
      src.start(at);
      src.stop(at + 0.06);
    }
    schedule() {
      if (!this.ctx || this.muted || this.ctx.state !== "running") return;
      const song = THEMES[this.theme], duration = 60 / song.bpm / 2;
      let safe = 0;
      while (this.nextAt < this.ctx.currentTime + 0.17 && safe++ < 8) {
        const i = this.step;
        const lead = parse(song.lead[i % song.lead.length]);
        const bass = parse(song.bass[i % song.bass.length]);
        const chord = parse(song.chords[i % song.chords.length]);
        if (lead) this.tone(lead, this.nextAt, duration * 0.86, { type: "square", level: 0.11 });
        if (bass) this.tone(bass, this.nextAt, duration * 0.92, { type: "triangle", level: 0.16 });
        if (chord && i % 2 === 0) this.tone(chord, this.nextAt, duration * 0.62, { type: "square", level: 0.045 });
        if (song.accent && i % 4 === 0) this.drum(this.nextAt, 0.04);
        this.nextAt += duration;
        this.step++;
      }
    }
    cue(name) {
      if (!this.ctx || this.muted || this.ctx.state !== "running") return;
      this.effectCount++;
      const now = this.ctx.currentTime + 5e-3;
      const notes = {
        confirm: [[740, 0, 0.07], [988, 0.07, 0.11]],
        cancel: [[540, 0, 0.07], [360, 0.07, 0.13]],
        talk: [[540, 0, 0.04]],
        attack: [[250, 0, 0.08], [100, 0.04, 0.11]],
        hit: [[170, 0, 0.14]],
        heal: [[520, 0, 0.12], [650, 0.11, 0.12], [790, 0.22, 0.15]],
        spell: [[400, 0, 0.1], [610, 0.08, 0.12], [910, 0.17, 0.18]],
        chest: [[440, 0, 0.09], [660, 0.1, 0.09], [880, 0.2, 0.24]],
        relic: [[524, 0, 0.17], [660, 0.15, 0.17], [784, 0.3, 0.2], [1047, 0.48, 0.34]],
        step: [[160, 0, 0.035]],
        run: [[570, 0, 0.04], [820, 0.04, 0.07]],
        level: [[523, 0, 0.11], [659, 0.1, 0.11], [784, 0.2, 0.12], [1047, 0.33, 0.24]],
        defeat: [[330, 0, 0.12], [277, 0.13, 0.12], [220, 0.28, 0.24]],
        victory: [[523, 0, 0.12], [659, 0.13, 0.12], [784, 0.26, 0.12], [1047, 0.42, 0.36]]
      };
      const parts = notes[name];
      if (!parts) throw Error("\u672A\u5B9A\u7FA9\u306E\u52B9\u679C\u97F3: " + name);
      for (const [hz, offset, len] of parts) this.tone(hz, now + offset, len, { bus: this.sfx, level: 0.17, type: name === "hit" || name === "attack" ? "sawtooth" : "square", slide: name === "attack" ? -85 : 0 });
    }
    inspect() {
      return { supported: this.available, unlocked: !!this.ctx, state: this.ctx?.state || "not-started", theme: this.theme, muted: this.muted, notes: this.noteCount, effects: this.effectCount };
    }
  };

  // src/main.mjs
  validateConfig(app_config_default);
  var $ = (id) => document.getElementById(id);
  $("privacy-link").href = app_config_default.privacyPolicyUrl;
  $("support-link").href = app_config_default.supportUrl;
  var auto = createJsonStore({ store: localStorage, key: app_config_default.storageNamespace + ".rpg.auto.v1", createInitial: () => createState(), validate: validateState });
  var manual = createJsonStore({ store: localStorage, key: app_config_default.storageNamespace + ".rpg.manual.v1", createInitial: () => createState(), validate: validateState });
  var has = (slot) => localStorage.getItem(slot === "auto" ? app_config_default.storageNamespace + ".rpg.auto.v1" : app_config_default.storageNamespace + ".rpg.manual.v1") !== null;
  var state = null;
  var battle = null;
  var queue = [];
  var hint = "";
  var panelMode = "";
  var moving = null;
  var lightSteps = 0;
  var audio = new GameAudio();
  var musicFor = () => !state ? "title" : state.stage === "CLEAR" ? "ending" : battle ? battle.id === "vold" ? "boss" : "battle" : { castle: "castle", field: "field", leaf: "town", sailun: "town", cave: "cave", ruins: "ruins", onyx: "onyx" }[state.pos.map] || "field";
  function soundButtons() {
    $("sound-toggle").textContent = audio.muted ? "\u266B OFF" : "\u266B ON";
    $("sound-toggle").setAttribute("aria-pressed", String(audio.muted));
    $("sound-toggle").setAttribute("aria-label", audio.muted ? "\u97F3\u3092\u51FA\u3059" : "\u97F3\u3092\u6D88\u3059");
    $("start-sound").textContent = audio.ctx && !audio.muted ? "\u266B \u30BF\u30A4\u30C8\u30EB\u97F3\u697D\u3092\u505C\u6B62" : "\u266B \u30BF\u30A4\u30C8\u30EB\u97F3\u697D\u3092\u8074\u304F";
    $("start-sound").setAttribute("aria-pressed", String(Boolean(audio.ctx && !audio.muted)));
  }
  function toggleSound() {
    if (!audio.ctx || audio.muted) {
      audio.setMuted(false);
      audio.unlock().catch(console.warn);
    } else audio.setMuted(true);
    soundButtons();
  }
  $("sound-toggle").addEventListener("click", toggleSound);
  $("start-sound").addEventListener("click", toggleSound);
  soundButtons();
  var $panel = $("action-panel");
  var $content = $("panel-content");
  var setError = (err) => {
    console.error("[RPG]", err);
    $("start-error").textContent = String(err.message || err);
  };
  function storeAndSet(next, autoSave = false) {
    validateState(next);
    if (autoSave) auto.write(next);
    state = next;
    paint();
  }
  function paint() {
    if (!state) return;
    audio.setTheme(musicFor());
    if (battle) renderBattle($("game"), state, battle);
    else renderMap($("game"), state, lightSteps);
    $("message").textContent = queue[0] || hint || "\u6B21\u306E\u76EE\u7684\uFF1A" + STAGE_GOALS[state.stage];
    $("journey-progress").textContent = state.stage === "CLEAR" ? "\u2726 \u5E73\u548C\u3092\u53D6\u308A\u623B\u3057\u305F\u4E16\u754C" : state.stage === "S09" ? "\u2726 \u5E30\u9084\u306E\u65C5" : state.stage === "S08" ? "\u2726 \u9B54\u738B\u57CE\u306E\u6700\u6DF1\u90E8\u3078" : state.stage === "S07" ? "\u2726 \u6C7A\u6226\u3078\u306E\u9053" : ["S05", "S06"].includes(state.stage) ? "\u2726 \u9ECE\u660E\u306E\u93E1\u3092\u63A2\u3059" : "\u2726 \u5192\u967A\u306E\u306F\u3058\u307E\u308A";
    $("journey-stars").textContent = "\u661F\u5C51 " + state.stars.length + " / 5 \xB7 \u8A0E\u4F10 " + Object.keys(state.defeated).filter((id) => id !== "vold").length + " / 24";
    $("travel-region").textContent = MAPS[state.pos.map].name;
    $("travel-goal").textContent = state.stage === "CLEAR" ? "\u5192\u967A\u306F\u7D42\u308F\u3063\u305F\u3002\u5E73\u548C\u306B\u306A\u3063\u305F\u5404\u5730\u3078\u65C5\u7ACB\u3068\u3046\u3002" : STAGE_GOALS[state.stage];
    const weapon = CATALOG.equipment.weapons.find((e) => e.id === state.equipment.weapon);
    $("travel-weapon").textContent = "\u2694 " + weapon.name;
    $("travel-hp").textContent = "HP " + state.player.hp + "/" + stats(state).maxHp;
    $("travel-mp").textContent = "MP " + state.player.mp + "/" + stats(state).maxMp;
    $("message-arrow").hidden = queue.length === 0;
    const milestone = queue.find((line) => /【第一幕クリア】|【第二幕クリア】|【第三幕】|【終幕】/.test(line));
    $("completion").hidden = !milestone;
    $("completion").textContent = milestone?.includes("\u7D42\u5E55") ? "\u2726 THE END \xB7 \u661F\u5C51\u306E\u52C7\u8005" : milestone?.includes("\u7B2C\u4E09\u5E55") ? "\u2726 \u9ED2\u66DC\u57CE\u306E\u7D50\u754C\u89E3\u9664\uFF01" : milestone?.includes("\u7B2C\u4E8C\u5E55") ? "\u2726 \u9ECE\u660E\u306E\u93E1 \u5165\u624B\uFF01" : "\u2726 \u9244\u306E\u9580 \u958B\u901A\uFF01";
    $("chapter").textContent = state.stage === "CLEAR" ? "\u7D42\u5E55 \xB7 \u5192\u967A\u306E\u5B8C\u7D50" : state.stage === "S09" ? "\u7D42\u7AE0 \xB7 \u5E30\u9084" : state.stage === "S08" ? "\u7B2C\u4E09\u5E55 \xB7 \u9ED2\u66DC\u57CE" : state.stage === "S07" ? "\u7B2C\u4E09\u5E55 \xB7 \u95C7\u306E\u7D50\u754C" : ["S05", "S06"].includes(state.stage) ? "\u7B2C\u4E8C\u5E55 \xB7 \u9ECE\u660E\u306E\u93E1" : "\u7B2C\u4E00\u5E55 \xB7 \u306F\u3058\u307E\u308A";
  }
  function message(lines) {
    queue = lines.filter(Boolean).map(String);
    hint = "";
    paint();
    if (!queue.length) afterMessage();
  }
  function advanceMessage() {
    if (!queue.length) return false;
    queue.shift();
    paint();
    if (!queue.length) afterMessage();
    return true;
  }
  function afterMessage() {
    if (battle && !panelMode) battleChoices();
  }
  function notice(text) {
    hint = text;
    paint();
  }
  function closePanel() {
    panelMode = "";
    $panel.hidden = true;
    $content.replaceChildren();
  }
  function openPanel(title, choices, desc = "") {
    closePanel();
    panelMode = title;
    $panel.hidden = false;
    $("panel-title").textContent = title;
    if (desc) {
      const p = document.createElement("p");
      p.textContent = desc;
      $content.append(p);
    }
    for (const choice of choices) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = choice.label;
      btn.disabled = Boolean(choice.disabled);
      if (choice.wide) btn.className = "wide";
      btn.addEventListener("click", () => {
        try {
          choice.run();
        } catch (err) {
          fatal(err);
        }
      });
      $content.append(btn);
    }
  }
  function fatal(err) {
    console.error("[RPG]", err);
    closePanel();
    queue = [];
    hint = "\u51E6\u7406\u3092\u505C\u6B62\u3057\u307E\u3057\u305F\u3002\u30BB\u30FC\u30D6\u30C7\u30FC\u30BF\u306F\u52DD\u624B\u306B\u521D\u671F\u5316\u3057\u307E\u305B\u3093\u3002 " + String(err.message || err);
    paint();
    $("message").style.color = "#ffb5ad";
  }
  function apply(result) {
    if (["chest", "key"].includes(result.kind)) audio.cue("chest");
    if (["mirror", "barrier", "swordAwakening", "star", "ending"].includes(result.kind)) audio.cue("relic");
    if (["gateOpen", "rune", "seal"].includes(result.kind)) audio.cue("spell");
    storeAndSet(result.state, Boolean(result.autoSave));
    if (result.messages) message(result.messages);
    else if (result.message) notice(result.message);
  }
  function beginFight(id, tag, lines = []) {
    audio.cue("attack");
    battle = beginCombat(id, tag);
    closePanel();
    message([...lines, tag === "tutorial" ? "\u300C\u305F\u305F\u304B\u3046\u300D\u3067\u9B54\u7269\u306B\u7ACB\u3061\u5411\u304B\u304A\u3046\uFF01" : monsterById(id).name + "\u304C\u73FE\u308C\u305F\uFF01"]);
    paint();
  }
  function performBattle(action) {
    if (queue.length) return;
    const result = combatTurn(state, battle, action);
    audio.cue(action.type === "spell" ? "spell" : action.type === "item" ? "heal" : action.type === "run" ? "run" : "attack");
    const screen = $("game").parentElement;
    screen.classList.remove("is-hit", "is-magic");
    if (action.type === "attack" || action.type === "spell") {
      screen.classList.add(action.type === "spell" ? "is-magic" : "is-hit");
      setTimeout(() => screen.classList.remove("is-hit", "is-magic"), 240);
    }
    if (result.outcome === "won") audio.cue("victory");
    if (result.outcome === "lost") audio.cue("defeat");
    if (result.outcome === "continue" && result.state.player.hp < state.player.hp) audio.cue("hit");
    closePanel();
    battle = result.battle;
    storeAndSet(result.state, Boolean(result.autoSave));
    message(result.lines);
    if (result.outcome !== "continue") {
      hint = "";
    }
  }
  function battleChoices() {
    if (!battle || queue.length) return;
    const enemy = monsterById(battle.id);
    openPanel("\u6226\u95D8\u30B3\u30DE\u30F3\u30C9", [
      { label: "\u2694 \u305F\u305F\u304B\u3046", run: () => performBattle({ type: "attack" }) },
      { label: "\u2726 \u3058\u3085\u3082\u3093", run: () => spellMenu(true) },
      { label: "\u{1F9EA} \u3069\u3046\u3050", run: () => itemMenu(true) },
      { label: "\u2197 \u306B\u3052\u308B", run: () => performBattle({ type: "run" }), disabled: battle.tag !== "random" }
    ], enemy.name + "  HP " + battle.hp + " / " + enemy.hp);
  }
  function spellCost(sp) {
    return Math.max(1, sp.mp - (state?.equipment.accessory === "star-orb" ? 1 : 0));
  }
  function spellMenu(inBattle = false) {
    const known = CATALOG.spells.filter((sp) => state.player.level >= sp.level);
    const choices = known.map((sp) => ({
      label: sp.name + " / " + spellCost(sp) + "MP",
      disabled: state.player.mp < spellCost(sp) || (inBattle ? !["heal", "damage", "sleep", "silence", "ward"].includes(sp.kind) : !["heal", "light", "return", "escape"].includes(sp.kind)),
      run: () => inBattle ? performBattle({ type: "spell", id: sp.id }) : castFieldSpell(sp)
    }));
    choices.push({ label: "\u3082\u3069\u308B", run: () => inBattle ? battleChoices() : showMenu(), wide: true });
    openPanel("\u3058\u3085\u3082\u3093", choices, "\u899A\u3048\u3066\u3044\u308B\u546A\u6587\uFF1A" + known.map((sp) => sp.name).join("\u30FB"));
  }
  function castFieldSpell(sp) {
    closePanel();
    if (!["heal", "light", "return", "escape", "ward"].includes(sp.kind)) {
      notice("\u3053\u306E\u546A\u6587\u306F\u6226\u95D8\u7528\u3067\u3059\u3002");
      return;
    }
    if (state.player.mp < spellCost(sp)) {
      notice("MP\u304C\u8DB3\u308A\u306A\u3044\u3002");
      return;
    }
    const next = clone(state);
    if (sp.kind === "heal") {
      if (next.player.hp === maxHp(next.player.level)) {
        notice("HP\u306F\u6E80\u30BF\u30F3\u3060\u3002");
        return;
      }
      next.player.mp -= spellCost(sp);
      next.player.hp = Math.min(maxHp(next.player.level), next.player.hp + sp.power);
      storeAndSet(next, true);
      message([sp.name + "\uFF01 HP\u304C\u56DE\u5FA9\u3057\u305F\u3002"]);
      return;
    }
    if (sp.kind === "light") {
      next.player.mp -= spellCost(sp);
      lightSteps = 45;
      storeAndSet(next, true);
      message(["\u30EB\u30FC\u30E1\u30F3\u306E\u5149\u304C\u8FBA\u308A\u3092\u7167\u3089\u3057\u305F\u300245\u6B69\u306E\u3042\u3044\u3060\u3001\u9B54\u7269\u3068\u306E\u906D\u9047\u304C\u5C11\u3057\u6E1B\u308A\u3001\u30C0\u30F3\u30B8\u30E7\u30F3\u306E\u5B9D\u3084\u4ED5\u639B\u3051\u304C\u5149\u308B\u3002"]);
      return;
    }
    if (sp.kind === "escape" && ["cave", "ruins", "onyx"].includes(next.pos.map)) {
      const destination = { cave: { map: "field", x: 17, y: 6, facing: "down" }, ruins: { map: "sailun", x: 9, y: 2, facing: "down" }, onyx: { map: "field", x: 32, y: 16, facing: "down" } }[next.pos.map];
      next.player.mp -= spellCost(sp);
      next.pos = destination;
      storeAndSet(next, true);
      message(["\u30A8\u30B0\u30EC\u30B9\uFF01 \u30C0\u30F3\u30B8\u30E7\u30F3\u306E\u5165\u53E3\u3078\u623B\u3063\u305F\u3002"]);
      return;
    }
    if (sp.kind === "return" && next.pos.map !== "castle") {
      next.player.mp -= spellCost(sp);
      next.pos = { map: "leaf", x: 8, y: 10, facing: "down" };
      storeAndSet(next, true);
      message(["\u30DD\u30EB\u30BF\uFF01 \u30EA\u30FC\u30D5\u30A1\u306E\u753A\u3078\u623B\u3063\u305F\u3002"]);
      return;
    }
    notice("\u3053\u3053\u3067\u306F\u4F7F\u3046\u5FC5\u8981\u304C\u306A\u3044\u3002");
  }
  function itemMenu(inBattle = false) {
    const choices = CATALOG.items.filter((i) => state.inventory[i.id] > 0).map((item) => ({
      label: item.name + " \xD7" + state.inventory[item.id],
      disabled: item.id === "iron-key" || (inBattle ? false : item.id === "smoke"),
      run: () => {
        if (inBattle) performBattle({ type: "item", id: item.id });
        else {
          const r = useItem(state, item.id);
          closePanel();
          storeAndSet(r.state, r.used);
          message([r.message]);
        }
      }
    }));
    choices.push({ label: "\u3082\u3069\u308B", run: () => inBattle ? battleChoices() : showMenu(), wide: true });
    openPanel("\u3069\u3046\u3050", choices, "\u6240\u6301\u54C1\u306E\u4E00\u89A7\u3067\u3059\u3002" + (state.relics.includes("beginning-sword") ? " \u5927\u5207\u306A\u3082\u306E\uFF1A\u306F\u3058\u307E\u308A\u306E\u5263\uFF08\u58F2\u5374\u3067\u304D\u307E\u305B\u3093\uFF09" : ""));
  }
  function equipmentMenu() {
    const owned = Object.entries(CATALOG.equipment).flatMap(([category, list]) => list.filter((e) => ownsEquipment(state, category, e.id)).map((e) => ({ ...e, category })));
    openPanel("\u305D\u3046\u3073", [
      ...owned.map((e) => ({ label: e.name + (state.equipment[{ weapons: "weapon", armors: "armor", shields: "shield", accessories: "accessory" }[e.category]] === e.id ? " \u2713" : ""), run: () => {
        const r = equip(state, e.id, e.category);
        closePanel();
        storeAndSet(r.state, true);
        message([r.message]);
      } })),
      { label: "\u3082\u3069\u308B", run: showMenu, wide: true }
    ], "\u88C5\u5099\u3092\u9078\u3093\u3067\u5909\u66F4\u3067\u304D\u307E\u3059\u3002");
  }
  function bookMenu() {
    const seen = CATALOG.monsters.filter((e) => state.defeated[e.id]);
    const other = CATALOG.monsters.length - seen.length;
    openPanel("\u30E2\u30F3\u30B9\u30BF\u30FC\u56F3\u9451", [
      ...seen.map((e) => ({ label: e.name + " \xD7" + state.defeated[e.id], run: () => notice(e.name + "\uFF1A\u906D\u9047\u5730\u57DF " + ({ field: "\u8857\u9053", cave: "\u8A66\u7DF4\u306E\u6D1E\u7A9F", east: "\u6771\u90E8\u8857\u9053", ruins: "\u6C88\u9ED9\u306E\u907A\u8DE1", onyx: "\u9ED2\u66DC\u57CE\u30AA\u30CB\u30AD\u30B9" }[e.area] || "\u4E0D\u660E")) })),
      { label: "\u3082\u3069\u308B", run: showMenu, wide: true }
    ], "\u8A0E\u4F10\u8A18\u9332 " + seen.length + "/24\u7A2E\u3002\u672A\u8A18\u9332\u306E\u9B54\u7269\u306F\u300C\uFF1F\uFF1F\uFF1F\u300D\uFF1A" + other + "\u7A2E" + (state.flags.bossDefeated ? "\u3002\u9B54\u738B\u30F4\u30A9\u30EB\u30C9\u8A0E\u4F10\u6E08\u307F\uFF01" : ""));
  }
  function showMenu() {
    if (!state || battle || queue.length) return;
    const st = stats(state);
    openPanel("\u5192\u967A\u30E1\u30CB\u30E5\u30FC", [
      { label: "\u30B9\u30C6\u30FC\u30BF\u30B9", run: () => openPanel("\u30B9\u30C6\u30FC\u30BF\u30B9", [{ label: "\u3082\u3069\u308B", run: showMenu, wide: true }], state.name + " Lv" + state.player.level + "\nHP " + state.player.hp + "/" + st.maxHp + "\u3000MP " + state.player.mp + "/" + st.maxMp + "\n\u653B\u6483 " + st.attack + "\u3000\u5B88\u5099 " + st.defense + "\u3000\u901F\u3055 " + st.speed + "\nEXP " + state.player.exp + "\u3000" + state.player.gold + "G") },
      { label: "\u3069\u3046\u3050", run: () => itemMenu() },
      { label: "\u3058\u3085\u3082\u3093", run: () => spellMenu() },
      { label: "\u305D\u3046\u3073", run: equipmentMenu },
      { label: "\u30E2\u30F3\u30B9\u30BF\u30FC\u56F3\u9451", run: bookMenu },
      { label: "\u30BB\u30FC\u30D6", run: () => openPanel("\u30BB\u30FC\u30D6", [{ label: "\u3082\u3069\u308B", run: showMenu, wide: true }], "\u738B\u69D8\u306E\u30BB\u30FC\u30D6\u306F\u30A2\u30EB\u30C6\u30EA\u30A2\u57CE\u3067\u30A2\u30EB\u30C9\u738B\u306B\u8A71\u3057\u304B\u3051\u3066\u304F\u3060\u3055\u3044\u3002\u30AA\u30FC\u30C8\u30BB\u30FC\u30D6\u306F\u57CE\u30FB\u753A\u3078\u306E\u5165\u5834\u3001\u30EC\u30D9\u30EB\u30A2\u30C3\u30D7\u3001\u91CD\u8981\u30A4\u30D9\u30F3\u30C8\u3067\u884C\u308F\u308C\u307E\u3059\u3002") },
      { label: "\u6B21\u306E\u76EE\u7684", run: () => openPanel("\u6B21\u306E\u76EE\u7684", [{ label: "\u3082\u3069\u308B", run: showMenu, wide: true }], STAGE_GOALS[state.stage] + "\u3000\u661F\u5C51\u306E\u6B20\u7247 " + state.stars.length + "/5\uFF08\u4EFB\u610F\u53CE\u96C6\uFF09") },
      { label: "\u5927\u5207\u306A\u3082\u306E", run: () => openPanel("\u5927\u5207\u306A\u3082\u306E", [{ label: "\u3082\u3069\u308B", run: showMenu, wide: true }], state.relics.map((id) => id === "beginning-sword" ? state.flags.swordAwakened ? "\u306F\u3058\u307E\u308A\u306E\u5263\uFF1A\u52C7\u8005\u306E\u5927\u5263\u3068\u3057\u3066\u899A\u9192\u3057\u305F\u3001\u540C\u3058\u4E00\u632F\u308A\u3002" : "\u306F\u3058\u307E\u308A\u306E\u5263\uFF1A\u661F\u306E\u7D0B\u7AE0\u3092\u6301\u3064\u53E4\u3044\u5263\u3002" : "\u9ECE\u660E\u306E\u93E1\uFF1A\u7D50\u754C\u3092\u9000\u3051\u308B\u53E4\u3044\u93E1\u3002").join("\n") || "\u307E\u3060\u4F55\u3082\u6301\u3063\u3066\u3044\u306A\u3044\u3002") },
      { label: "\u3068\u3058\u308B", run: closePanel }
    ]);
  }
  var SHOP_STOCK = Object.freeze({
    leaf: { weapons: ["copper"], armors: ["leather"], shields: ["leathershield"], accessories: ["power"] },
    sailun: { weapons: ["iron", "knight", "mythril", "thunder"], armors: ["chain", "iron", "steel"], shields: ["ironshield", "mythrilshield"], accessories: ["guard", "wind"] }
  });
  function shopMenu() {
    const town = state.pos.map === "sailun" ? "sailun" : "leaf";
    const stock = CATALOG.items.filter((i) => i.price > 0 && ["potion", "great-potion", "antidote", "smoke"].includes(i.id));
    const gear = Object.entries(SHOP_STOCK[town]).flatMap(([category, ids]) => CATALOG.equipment[category].filter((e) => ids.includes(e.id)).map((e) => ({ ...e, category })));
    const options = [
      ...stock.map((i) => ({ label: i.name + " " + i.price + "G", run: () => {
        const r = buy(state, i.id);
        closePanel();
        storeAndSet(r.state, r.ok);
        message([r.message]);
      } })),
      ...gear.map((e) => ({ label: e.name + " " + e.price + "G", disabled: ownsEquipment(state, e.category, e.id), run: () => {
        const r = buyEquipment(state, e.id, e.category);
        closePanel();
        storeAndSet(r.state, r.ok);
        message([r.message]);
      } })),
      { label: "\u8CB7\u308F\u306A\u3044", run: closePanel, wide: true }
    ];
    openPanel(town === "sailun" ? "\u30BB\u30A4\u30EB\u30F3\u306E\u9053\u5177\u5C4B" : "\u30EA\u30FC\u30D5\u30A1\u306E\u9053\u5177\u5C4B", options, "\u6240\u6301\u91D1 " + state.player.gold + "G\u3002\u8CFC\u5165\u3057\u305F\u88C5\u5099\u306F\u81EA\u52D5\u3067\u88C5\u5099\u3055\u308C\u307E\u3059\u3002");
  }
  function innMenu() {
    openPanel(state.pos.map === "sailun" ? "\u30BB\u30A4\u30EB\u30F3\u306E\u5BBF" : "\u30EA\u30FC\u30D5\u30A1\u306E\u5BBF", [
      { label: "\u4F11\u3080 / 12G", run: () => {
        const r = rest(state);
        closePanel();
        storeAndSet(r.state, r.ok);
        message([r.message]);
      } },
      { label: "\u3084\u3081\u308B", run: closePanel }
    ], "HP\u30FBMP\u30FB\u6BD2\u3092\u56DE\u5FA9\u3057\u307E\u3059\u3002");
  }
  function startRandom() {
    if (state.stage === "S00" || state.stage === "S01") return;
    const encounter = (probability) => Math.random() < probability * (lightSteps > 0 ? 0.45 : 1);
    const map = state.pos.map, terrain = MAPS[map].tiles[state.pos.y][state.pos.x];
    if (map === "field" && [0, 4].includes(terrain) && encounter(0.045)) {
      const pool = state.pos.x >= 24 ? ["m07", "m08", "m09", "m10"] : ["m01", "m02", "m03"];
      beginFight(pool[Math.floor(Math.random() * pool.length)], "random");
    }
    if (map === "ruins" && encounter(0.055)) {
      const pool = ["m08", "m09", "m10", "m11", "m12", "m13", "m14", "m15"];
      beginFight(pool[Math.floor(Math.random() * pool.length)], "random");
    }
    if (map === "onyx" && encounter(0.07)) {
      const pool = ["m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24"];
      beginFight(pool[Math.floor(Math.random() * pool.length)], "random");
    }
    if (map === "cave" && encounter(0.065)) {
      const id = ["m02", "m03", "m04", "m05"][Math.floor(Math.random() * 4)];
      beginFight(id, "random");
    }
  }
  function direction(dir) {
    if (!state || battle || queue.length || panelMode) return;
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const r = move(state, dx, dy);
    if (r.kind === "portal") audio.cue("run");
    storeAndSet(r.state, Boolean(r.autoSave));
    if (r.message) notice(r.message);
    else {
      hint = "";
      paint();
    }
    if (r.kind === "walk") {
      startRandom();
      if (lightSteps > 0) lightSteps--;
    } else if (r.kind === "portal" && lightSteps > 0) {
      lightSteps = 0;
    }
  }
  function confirm() {
    if (!state || panelMode) return;
    if (!battle) audio.cue("confirm");
    if (advanceMessage()) return;
    if (battle) {
      battleChoices();
      return;
    }
    try {
      const r = interact(state);
      if (r.kind === "battle") {
        beginFight(r.monsterId, r.tag, r.messages);
        return;
      }
      if (r.kind === "manualSave") {
        manual.write(r.state);
        storeAndSet(r.state);
        message([...r.messages, "\u738B\u69D8\u306E\u30BB\u30FC\u30D6\u306B\u8A18\u9332\u3057\u305F\u3002"]);
        return;
      }
      apply(r);
      if (r.kind === "shop") shopMenu();
      if (r.kind === "inn") innMenu();
    } catch (err) {
      fatal(err);
    }
  }
  function cancel() {
    audio.cue("cancel");
    if (panelMode) {
      if (battle) battleChoices();
      else closePanel();
      return;
    }
    if (queue.length) {
      advanceMessage();
      return;
    }
    if (!battle) showMenu();
  }
  function stopMoving() {
    if (moving) {
      clearInterval(moving);
      moving = null;
    }
    document.querySelectorAll("[data-dir]").forEach((n) => n.classList.remove("pressed"));
  }
  for (const button of document.querySelectorAll("[data-dir]")) {
    button.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      stopMoving();
      button.classList.add("pressed");
      direction(button.dataset.dir);
      moving = setInterval(() => direction(button.dataset.dir), 165);
      if (button.setPointerCapture) button.setPointerCapture(ev.pointerId);
    });
    button.addEventListener("pointerup", stopMoving);
    button.addEventListener("pointercancel", stopMoving);
    button.addEventListener("lostpointercapture", stopMoving);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopMoving();
  });
  window.addEventListener("blur", stopMoving);
  $("confirm").addEventListener("click", confirm);
  $("cancel").addEventListener("click", cancel);
  $("menu-button").addEventListener("click", () => panelMode ? closePanel() : showMenu());
  $("panel-close").addEventListener("click", closePanel);
  document.addEventListener("keydown", (ev) => {
    if (!$("start-overlay").hidden || ev.target.tagName === "INPUT") return;
    const dirs = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
    if (dirs[ev.key]) {
      ev.preventDefault();
      direction(dirs[ev.key]);
      return;
    }
    if (["Enter", " ", "z", "Z"].includes(ev.key)) {
      ev.preventDefault();
      if (!ev.repeat) confirm();
    }
    if (["Escape", "x", "X"].includes(ev.key)) {
      ev.preventDefault();
      if (!ev.repeat) cancel();
    }
    if (ev.key.toLowerCase() === "m" && !ev.repeat) {
      ev.preventDefault();
      panelMode ? closePanel() : showMenu();
    }
  });
  function begin(s, intro = false) {
    audio.unlock().catch(console.warn);
    validateState(s);
    state = s;
    battle = null;
    queue = [];
    hint = "";
    lightSteps = 0;
    closePanel();
    $("start-overlay").hidden = true;
    document.title = "\u661F\u5C51\u306E\u52C7\u8005\uFF5C\u306F\u3058\u307E\u308A\u306E\u5263\u3068\u9ED2\u66DC\u306E\u9B54\u738B\u57CE";
    paint();
    if (intro) message(["\u30A2\u30EB\u30C6\u30EA\u30A2\u738B\u56FD\u3002\u9B54\u7269\u306E\u8ECD\u52E2\u3092\u9003\u308C\u305F\u4EBA\u3005\u304C\u3001\u57CE\u3078\u62BC\u3057\u5BC4\u305B\u305F\u3002", "\u9003\u3052\u9045\u308C\u305F\u4EBA\u306E\u3059\u3050\u305D\u3070\u306B\u3001\u9B54\u7269\u304C\u8FEB\u3063\u3066\u3044\u308B\u3002", "\u5341\u5B57\u30AD\u30FC\u3067\u8FD1\u3065\u304D\u3001A\u30DC\u30BF\u30F3\u3067\u9B54\u7269\u3068\u6226\u304A\u3046\u3002"]);
    else message(["\u5192\u967A\u306E\u8A18\u9332\u3092\u8AAD\u307F\u8FBC\u3093\u3060\u3002", "\u6B21\u306E\u76EE\u7684\uFF1A" + STAGE_GOALS[s.stage]]);
  }
  function verifySlots() {
    for (const [key, store] of [["auto", auto], ["manual", manual]]) {
      const button = $(key === "auto" ? "load-auto" : "load-manual");
      button.disabled = !has(key);
      if (has(key)) store.read();
    }
  }
  $("new-game").addEventListener("click", () => {
    try {
      const name = $("hero-name").value.trim();
      const s = createState(name);
      if ((has("auto") || has("manual")) && !window.confirm("\u65B0\u3057\u3044\u5192\u967A\u3092\u59CB\u3081\u308B\u3068\u30AA\u30FC\u30C8\u30BB\u30FC\u30D6\u3092\u4E0A\u66F8\u304D\u3057\u307E\u3059\u3002\u738B\u69D8\u306E\u30BB\u30FC\u30D6\u306F\u6B8B\u3057\u307E\u3059\u3002\u7D9A\u3051\u307E\u3059\u304B\uFF1F")) return;
      auto.write(s);
      begin(s, true);
    } catch (err) {
      setError(err);
    }
  });
  $("load-auto").addEventListener("click", () => {
    try {
      begin(auto.read());
    } catch (err) {
      setError(err);
    }
  });
  $("load-manual").addEventListener("click", () => {
    try {
      begin(manual.read());
    } catch (err) {
      setError(err);
    }
  });
  try {
    verifySlots();
  } catch (err) {
    setError(err);
    $("new-game").disabled = true;
  }
  window.__hoshikuzuQA = Object.freeze({ state: () => state ? clone(state) : null, battle: () => battle ? clone(battle) : null, audio: () => audio.inspect() });
})();
