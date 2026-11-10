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
            1,
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
            1,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            7,
            8,
            8,
            8,
            7,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            7,
            7,
            8,
            7,
            7,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            7,
            7,
            8,
            7,
            7,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            7,
            7,
            8,
            7,
            7,
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
            1,
            7,
            7,
            7,
            7,
            8,
            7,
            7,
            7,
            7,
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
            x: 9,
            y: 6,
            kind: "refugee"
          },
          {
            id: "castle-guard",
            name: "\u5B88\u5099\u5175",
            x: 5,
            y: 3,
            kind: "guard"
          },
          {
            id: "castle-guard-east",
            name: "\u5B88\u5099\u5175",
            x: 9,
            y: 3,
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
        ],
        scenery: [
          {
            kind: "column",
            x: 2,
            y: 4
          },
          {
            kind: "column",
            x: 12,
            y: 4
          },
          {
            kind: "column",
            x: 2,
            y: 9
          },
          {
            kind: "column",
            x: 12,
            y: 9
          },
          {
            kind: "banner",
            x: 3,
            y: 1
          },
          {
            kind: "banner",
            x: 11,
            y: 1
          },
          {
            kind: "throne-canopy",
            x: 7,
            y: 1
          },
          {
            kind: "mosaic",
            x: 5,
            y: 5
          },
          {
            kind: "mosaic",
            x: 10,
            y: 5
          },
          {
            kind: "doorway",
            x: 1,
            y: 7
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
          },
          {
            id: "west-waystone",
            x: 8,
            y: 2,
            kind: "waystone",
            name: "\u897F\u306E\u53E4\u3044\u9053\u6A19"
          },
          {
            id: "south-waystone",
            x: 15,
            y: 13,
            kind: "waystone",
            name: "\u91CE\u55B6\u5730\u306E\u77F3\u6A19"
          },
          {
            id: "east-waystone",
            x: 28,
            y: 14,
            kind: "waystone",
            name: "\u6F6E\u98A8\u306E\u77F3\u6A19"
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
            0,
            0,
            0,
            0,
            0,
            0,
            3,
            1,
            3,
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
            1,
            1,
            1,
            0,
            0,
            3,
            3,
            3,
            0,
            0,
            1,
            1,
            1,
            0,
            1
          ],
          [
            1,
            0,
            1,
            1,
            1,
            0,
            0,
            3,
            3,
            3,
            0,
            0,
            1,
            1,
            1,
            0,
            1
          ],
          [
            1,
            0,
            0,
            0,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
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
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
            7,
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
            3,
            3,
            8,
            8,
            8,
            3,
            3,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            3,
            3,
            3,
            3,
            3,
            3,
            1,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            0,
            3,
            3,
            3,
            3,
            1,
            3,
            3,
            3,
            1,
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
            3,
            3,
            3,
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
        ],
        buildings: [
          {
            id: "leaf-inn",
            x: 1,
            y: 6,
            w: 4,
            h: 3,
            kind: "inn"
          },
          {
            id: "leaf-shop",
            x: 12,
            y: 6,
            w: 4,
            h: 3,
            kind: "shop"
          },
          {
            id: "leaf-west-home",
            x: 2,
            y: 2,
            w: 3,
            h: 2,
            kind: "home"
          },
          {
            id: "leaf-east-home",
            x: 12,
            y: 2,
            w: 3,
            h: 2,
            kind: "home"
          }
        ],
        scenery: [
          {
            kind: "well",
            x: 11,
            y: 7
          },
          {
            kind: "lamp",
            x: 6,
            y: 9
          },
          {
            kind: "lamp",
            x: 10,
            y: 9
          },
          {
            kind: "garden",
            x: 2,
            y: 10
          },
          {
            kind: "garden",
            x: 14,
            y: 5
          },
          {
            kind: "signpost",
            x: 8,
            y: 1
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
            2,
            2,
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
            2,
            1
          ],
          [
            1,
            2,
            2,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            1,
            7,
            7,
            3,
            7,
            7,
            2,
            1
          ],
          [
            1,
            2,
            2,
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
            2,
            1
          ],
          [
            1,
            2,
            2,
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
            2,
            1
          ],
          [
            1,
            2,
            2,
            3,
            7,
            7,
            7,
            1,
            7,
            7,
            7,
            1,
            7,
            7,
            7,
            3,
            7,
            2,
            1
          ],
          [
            1,
            2,
            2,
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
            2,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            1,
            7,
            7,
            7,
            3,
            7,
            7,
            7,
            1,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            1,
            7,
            7,
            3,
            7,
            7,
            7,
            3,
            1,
            1,
            1,
            1,
            1,
            1
          ],
          [
            1,
            1,
            1,
            1,
            1,
            1,
            7,
            3,
            7,
            7,
            7,
            3,
            7,
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
            1,
            7,
            7,
            3,
            7,
            7,
            1,
            3,
            7,
            7,
            7,
            3,
            1
          ],
          [
            1,
            2,
            2,
            2,
            2,
            2,
            2,
            3,
            3,
            3,
            3,
            3,
            2,
            2,
            2,
            2,
            2,
            2,
            1
          ],
          [
            1,
            2,
            2,
            2,
            2,
            2,
            2,
            3,
            3,
            3,
            3,
            3,
            2,
            2,
            2,
            2,
            2,
            2,
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
        ],
        buildings: [
          {
            id: "sailun-inn",
            x: 1,
            y: 7,
            w: 5,
            h: 3,
            kind: "inn"
          },
          {
            id: "sailun-shop",
            x: 13,
            y: 7,
            w: 5,
            h: 3,
            kind: "shop"
          }
        ],
        scenery: [
          {
            kind: "boat",
            x: 1,
            y: 2
          },
          {
            kind: "boat",
            x: 16,
            y: 12
          },
          {
            kind: "barrels",
            x: 6,
            y: 11
          },
          {
            kind: "barrels",
            x: 12,
            y: 11
          },
          {
            kind: "lamp",
            x: 7,
            y: 5
          },
          {
            kind: "lamp",
            x: 11,
            y: 5
          },
          {
            kind: "lighthouse",
            x: 11,
            y: 2
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
      case "waystone": {
        const words = {
          "west-waystone": ["\u82D4\u3080\u3057\u305F\u53E4\u3044\u9053\u6A19\u3002\u77F3\u306E\u77E2\u5370\u306F\u30A2\u30EB\u30C6\u30EA\u30A2\u57CE\u3068\u30EA\u30FC\u30D5\u30A1\u753A\u3092\u6307\u3057\u3066\u3044\u308B\u3002", "\u6614\u3001\u65C5\u4EBA\u3084\u907F\u96E3\u3059\u308B\u4EBA\u3005\u304C\u8FF7\u308F\u306A\u3044\u3088\u3046\u306B\u7F6E\u304B\u308C\u305F\u306E\u3060\u308D\u3046\u3002"],
          "south-waystone": ["\u8349\u539F\u306E\u5C0F\u3055\u306A\u91CE\u55B6\u5730\u3002\u4F4E\u3044\u77F3\u6A19\u306B\u306F\u5E7E\u4EBA\u3082\u306E\u65C5\u4EBA\u304C\u6B8B\u3057\u305F\u5370\u304C\u3042\u308B\u3002", "\u9060\u56DE\u308A\u306E\u9053\u306B\u3082\u3001\u3053\u3053\u3092\u6B69\u3044\u305F\u4EBA\u305F\u3061\u306E\u66AE\u3089\u3057\u304C\u3042\u308B\u3002"],
          "east-waystone": ["\u6D77\u3078\u5411\u304B\u3046\u8857\u9053\u306E\u77F3\u6A19\u3002\u6771\u3078\u9032\u3080\u3068\u3001\u98A8\u306B\u6F6E\u306E\u9999\u308A\u304C\u6DF7\u3058\u308B\u3002", "\u304B\u3064\u3066\u3053\u3053\u3092\u901A\u3063\u305F\u5546\u4EBA\u305F\u3061\u306F\u3001\u6E2F\u306E\u706F\u308A\u3092\u983C\u308A\u306B\u65C5\u3092\u3057\u305F\u3068\u3044\u3046\u3002"]
        }[e.id];
        if (!words) throw Error("\u672A\u5B9A\u7FA9\u306E\u8857\u9053\u77F3\u6A19 " + e.id);
        return { ...result, messages: words };
      }
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
      const r2 = useItem(s, action.id);
      s = r2.state;
      if (!r2.used) return { state: s, battle: b, lines: [r2.message], outcome: "continue" };
      lines.push(r2.message);
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

  // src/game/combat-visuals.mjs
  var DUR = 620;
  var rect = (c, x, y, w, h, color2) => {
    c.fillStyle = color2;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  var clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function combatFeedback(beforeState, beforeBattle, result, action, now) {
    if (!beforeState || !beforeBattle || !result || !action) throw Error("Incomplete combat feedback inputs");
    if (!Number.isFinite(now)) throw Error("Combat feedback timestamp invalid");
    const currentEnemyHp = result.battle?.hp ?? (result.outcome === "won" ? 0 : beforeBattle.hp);
    const enemyDamage = Math.max(0, beforeBattle.hp - currentEnemyHp);
    const playerDamage = Math.max(0, beforeState.player.hp - result.state.player.hp);
    const healing = Math.max(0, result.state.player.hp - beforeState.player.hp);
    const type = action.type === "attack" ? "blade" : action.type === "spell" ? "spell" : action.type === "item" ? "item" : action.type === "run" ? "escape" : null;
    if (!type) throw Error("Unsupported combat feedback command " + action.type);
    return Object.freeze({
      type,
      enemyDamage,
      playerDamage,
      healing,
      startedAt: now,
      duration: DUR,
      enemyId: beforeBattle.id
    });
  }
  function combatFeedbackProgress(fx, now) {
    if (!fx) return 1;
    if (!Number.isFinite(fx.startedAt) || !Number.isFinite(fx.duration) || fx.duration <= 0)
      throw Error("Corrupt combat effect");
    return clamp((now - fx.startedAt) / fx.duration, 0, 1);
  }
  function paintCombatFeedback(c, W2, H2, fx, now) {
    if (!fx) return;
    const t = combatFeedbackProgress(fx, now);
    if (t >= 1) return;
    const midX = Math.round(W2 / 2), midY = Math.round(H2 * 0.54);
    const offset = Math.round((1 - t) * 11);
    if (fx.type === "blade" && fx.enemyDamage > 0) {
      for (let k = 0; k < 4; k++) {
        const x = midX - 44 + k * 18 - offset, y = midY - 41 - k * 8 + offset;
        rect(c, x, y, 4, 43, "#374c61");
        rect(c, x + 4, y - 4, 4, 40, "#e6d6ad");
        rect(c, x + 8, y - 4, 2, 30, "#fff2db");
      }
    } else if (fx.type === "spell") {
      for (let i = 0; i < 7; i++) {
        const phase = t * Math.PI * 1.55 + i * 6.283 / 7;
        const radius = 44 + (1 - t) * 19;
        const x = midX + Math.round(Math.cos(phase) * radius);
        const y = midY + Math.round(Math.sin(phase) * radius * 0.65) - 12;
        rect(c, x - 2, y - 2, 6, 6, "#497c91");
        rect(c, x, y, 3, 3, "#b8e5d3");
        if (i % 2 === 0) rect(c, x + 1, y - 4, 1, 2, "#f2e6b3");
      }
    } else if (fx.type === "item" && fx.healing > 0) {
      for (let i = 0; i < 5; i++) {
        const x = midX - 33 + i * 14, y = Math.round(H2 * 0.73) - Math.round(35 * (1 - t)) + i % 2 * 5;
        rect(c, x, y, 3, 11, "#629785");
        rect(c, x - 4, y + 4, 11, 3, "#b6e6b6");
      }
    }
    if (fx.enemyDamage > 0) {
      const y = midY - 76 - Math.round(14 * (1 - t));
      c.font = "bold 18px monospace";
      c.textAlign = "center";
      c.strokeStyle = "#192538";
      c.lineWidth = 4;
      c.strokeText("-" + fx.enemyDamage, midX + 48, y);
      c.fillStyle = fx.type === "spell" ? "#b7f1df" : "#ffdfb6";
      c.fillText("-" + fx.enemyDamage, midX + 48, y);
    }
    if (fx.playerDamage > 0) {
      const frame = t < 0.55 ? "#b65c66" : "#734a56";
      rect(c, 3, Math.round(H2 * 0.2), 3, Math.round(H2 * 0.56), frame);
      rect(c, W2 - 6, Math.round(H2 * 0.2), 3, Math.round(H2 * 0.56), frame);
      c.textAlign = "left";
      c.font = "bold 15px monospace";
      c.strokeStyle = "#182436";
      c.lineWidth = 3;
      c.strokeText("-" + fx.playerDamage, 10, H2 - 45);
      c.fillStyle = "#ffc2b2";
      c.fillText("-" + fx.playerDamage, 10, H2 - 45);
    }
    if (fx.healing > 0 && fx.type !== "spell") {
      c.textAlign = "right";
      c.font = "bold 15px monospace";
      c.strokeStyle = "#182436";
      c.lineWidth = 3;
      c.strokeText("+" + fx.healing, W2 - 10, H2 - 45);
      c.fillStyle = "#b6ecd4";
      c.fillText("+" + fx.healing, W2 - 10, H2 - 45);
    }
    c.textAlign = "left";
  }

  // src/game/castle-visual.mjs
  var CASTLE_ART_SCENE = Object.freeze({
    width: 1254,
    height: 1474,
    tileWidth: 80,
    tileHeight: 72,
    originX: 27,
    originY: 250
  });
  var scenes = {
    background: "castle-background.png",
    foreground: "castle-foreground.png",
    king: "castle-king.png",
    guard: "castle-guard.png",
    guardEast: "castle-guard-east.png",
    refugee: "castle-refugee.png",
    raider: "castle-raider.png",
    libraryBackground: "castle-library-background.png",
    libraryForeground: "castle-library-foreground.png",
    librarian: "castle-librarian.png"
  };
  for (const direction2 of ["up", "down", "left", "right"]) for (let frame = 0; frame < 3; frame++) {
    scenes[`hero_${direction2}_${frame}`] = `castle-hero-${direction2}-${frame}.png`;
  }
  var CASTLE_SCENE_SCALE = 0.44;
  var ART_VERSION = "20261111-generated-hero-walk-v1";
  var cache = { ready: false, failed: false, images: {} };
  var lastHeroSprite = "";
  function castleArtDebug() {
    return { ready: cache.ready, lastHeroSprite };
  }
  function heroGaitFrame(motion, t) {
    if (!motion || t < 0.17 || t > 0.86) return 0;
    return motion.step % 2 === 0 ? 1 : 2;
  }
  function paintSharedHero(c, feetX, feetY, facing = "down", frame = 0, scale = 0.4) {
    if (!cache.ready) throw Error("Shared protagonist art not loaded");
    const key = `hero_${facing}_${frame}`;
    const sprite = cache.images[key];
    if (!sprite) throw Error("Missing protagonist art: " + key);
    lastHeroSprite = key;
    const w = Math.round(sprite.width * scale), h = Math.round(sprite.height * scale);
    const x = Math.round(feetX - w / 2), y = Math.round(feetY - h);
    c.save();
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#1319297a";
    c.beginPath();
    c.ellipse(
      Math.round(feetX),
      Math.round(feetY - 3),
      Math.max(7, Math.round(w * 0.34)),
      Math.max(3, Math.round(w * 0.09)),
      0,
      0,
      Math.PI * 2
    );
    c.fill();
    c.drawImage(sprite, x, y, w, h);
    c.restore();
  }
  var clamp2 = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function castleArtReady() {
    return cache.ready;
  }
  function preloadCastleArt(onReady = () => {
  }) {
    if (cache.ready) {
      onReady();
      return Promise.resolve();
    }
    if (cache.loading) return cache.loading.then(onReady);
    cache.loading = Promise.all(Object.entries(scenes).map(([name, file]) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        cache.images[name] = image;
        resolve();
      };
      image.onerror = () => {
        cache.failed = true;
        reject(Error("Castle art missing: " + file));
      };
      image.src = "assets/castle/" + file + "?v=" + ART_VERSION;
    }))).then(() => {
      const bg = cache.images.background;
      if (bg.naturalWidth !== 1254 || bg.naturalHeight !== 1474) throw Error("Wrong castle-art dimensions");
      cache.ready = true;
      onReady();
    });
    return cache.loading;
  }
  function castleMapPoint(x, y) {
    const m = CASTLE_ART_SCENE;
    return {
      x: m.originX + (x + 0.5) * m.tileWidth,
      y: m.originY + (y + 0.5) * m.tileHeight
    };
  }
  function castleVisualPosition(s, motion = null, now = performance.now()) {
    const pos = s.pos;
    const t = motion && motion.map === "castle" ? clamp2((now - motion.start) / motion.duration, 0, 1) : 1;
    return {
      x: motion && motion.map === "castle" ? motion.fromX + (pos.x - motion.fromX) * t : pos.x,
      y: motion && motion.map === "castle" ? motion.fromY + (pos.y - motion.fromY) * t : pos.y,
      t
    };
  }
  function castleCamera(canvas, s, motion = null, now = performance.now()) {
    const pos = castleVisualPosition(s, motion, now), p = castleMapPoint(pos.x, pos.y);
    const viewWidth = canvas.width, viewHeight = canvas.height;
    const m = CASTLE_ART_SCENE;
    return {
      x: clamp2(p.x - viewWidth / 2, 0, Math.max(0, m.width - viewWidth)),
      // Initial view shows the throne and the hero together, rather
      // than cutting the king off above the phone viewport.
      y: clamp2(p.y - viewHeight * 0.75, 0, Math.max(0, m.height - viewHeight)),
      player: p
    };
  }
  function drawSmallPerson(c, cx, cy, kind) {
    c.save();
    c.translate(Math.round(cx - 30), Math.round(cy - 56));
    const tile = (x, y, w, h, color3) => {
      c.fillStyle = color3;
      c.fillRect(x * 5, y * 5, w * 5, h * 5);
    };
    const color2 = kind === "refugee" ? "#a5676a" : "#47788e";
    tile(3, 0, 6, 1, "#27283b");
    tile(2, 1, 8, 2, "#483a38");
    tile(3, 3, 6, 3, "#e9bb8d");
    tile(4, 4, 1, 1, "#3b2c36");
    tile(7, 4, 1, 1, "#3b2c36");
    tile(2, 6, 8, 6, color2);
    tile(4, 6, 4, 2, "#d8ad69");
    tile(1, 7, 2, 4, "#edc59b");
    tile(9, 7, 2, 4, "#edc59b");
    tile(2, 12, 3, 1, "#292d3c");
    tile(7, 12, 3, 1, "#292d3c");
    c.restore();
  }
  function drawSword(c, x, y) {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.fillStyle = "#252b42";
    c.fillRect(-6, -32, 12, 53);
    c.fillStyle = "#e9e4d5";
    c.fillRect(-4, -39, 8, 32);
    c.fillStyle = "#88cbd9";
    c.fillRect(-1, -35, 3, 23);
    c.fillStyle = "#e4ba61";
    c.fillRect(-22, -11, 44, 7);
    c.fillStyle = "#765c50";
    c.fillRect(-5, -6, 10, 22);
    c.fillStyle = "#ffdf99";
    c.fillRect(-8, 16, 16, 5);
    c.restore();
  }
  function uiLabel(c, canvas, s, title = "\u30A2\u30EB\u30C6\u30EA\u30A2\u57CE\u3000\u738B\u306E\u9593") {
    const W2 = canvas.width, H2 = canvas.height;
    const locationW = Math.min(W2 - 12, Math.ceil(title.length * 15 + 16));
    c.fillStyle = "#0b1229e8";
    c.fillRect(5, 5, locationW, 26);
    c.strokeStyle = "#dfc58e";
    c.lineWidth = 1;
    c.strokeRect(5.5, 5.5, locationW, 25);
    c.font = "bold 14px sans-serif";
    c.textBaseline = "middle";
    c.fillStyle = "#f5e9ce";
    c.textAlign = "left";
    c.fillText(title, 13, 19);
    c.fillStyle = "#081527ef";
    c.fillRect(0, H2 - 28, W2, 28);
    c.fillStyle = "#dbc18d";
    c.fillRect(0, H2 - 28, W2, 1);
    c.fillStyle = "#f7ecd7";
    c.font = "bold 13px monospace";
    c.fillText("HP " + s.player.hp + "/" + stats(s).maxHp + "   MP " + s.player.mp + "/" + stats(s).maxMp, 10, H2 - 14);
  }
  function renderCastleScene(canvas, s, motion = null, now = performance.now()) {
    if (!cache.ready) return false;
    if (s.pos.map !== "castle") throw Error("Castle art on another map");
    const c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    const z = CASTLE_SCENE_SCALE;
    const W2 = Math.ceil(canvas.width / z), H2 = Math.ceil(canvas.height / z);
    const camera = castleCamera({ width: W2, height: H2 }, s, motion, now);
    c.save();
    c.scale(z, z);
    c.fillStyle = "#0b101c";
    c.fillRect(0, 0, W2, H2);
    c.drawImage(cache.images.background, Math.round(-camera.x), Math.round(-camera.y));
    const plot = (x, y) => {
      const p = castleMapPoint(x, y);
      return { x: p.x - camera.x, y: p.y - camera.y };
    };
    const map = MAPS.castle;
    const actors2 = [];
    for (const n of map.npcs) {
      const p = plot(n.x, n.y);
      actors2.push({ z: p.y, draw: () => {
        let im, anchor = 0, lift = 0;
        if (n.kind === "king") {
          im = cache.images.king;
          lift = 53;
        } else if (n.id === "castle-guard") {
          im = cache.images.guard;
          anchor = -42;
        } else if (n.id === "castle-guard-east") {
          im = cache.images.guardEast;
          anchor = 44;
        } else if (n.id === "refugee") {
          im = cache.images.refugee;
          lift = 41;
        } else {
          drawSmallPerson(c, p.x, p.y, n.kind);
          return;
        }
        c.drawImage(im, Math.round(p.x - im.width / 2 + anchor), Math.round(p.y + lift - im.height));
      } });
    }
    for (const e of map.objects) {
      if (!entityAt(s, map, e.x, e.y)) continue;
      const p = plot(e.x, e.y);
      actors2.push({ z: p.y, draw: () => {
        if (e.kind === "raider") {
          const im = cache.images.raider;
          c.drawImage(im, Math.round(p.x - im.width / 2), Math.round(p.y + 42 - im.height));
        } else if (e.kind === "sword") drawSword(c, p.x, p.y);
      } });
    }
    const pp = camera.player;
    actors2.push({ z: pp.y - camera.y, draw: () => {
      const t = castleVisualPosition(s, motion, now).t;
      const isMoving = motion && motion.map === "castle" && t < 1;
      const frame = isMoving ? heroGaitFrame(motion, t) : 0;
      const hero = cache.images[`hero_${s.pos.facing}_${frame}`];
      if (!hero) throw Error("Missing directional hero sprite: " + s.pos.facing + "/" + frame);
      lastHeroSprite = `hero_${s.pos.facing}_${frame}`;
      const bob = isMoving ? -Math.round(Math.sin(t * Math.PI) * 2) : 0;
      const sx = Math.round(pp.x - camera.x - hero.width / 2);
      const sy = Math.round(pp.y - camera.y + 43 - hero.height + bob);
      c.fillStyle = "#11132065";
      c.beginPath();
      c.ellipse(sx + hero.width / 2, sy + hero.height - 10, 35, 10, 0, 0, Math.PI * 2);
      c.fill();
      c.drawImage(hero, sx, sy);
    } });
    actors2.sort((a, b) => a.z - b.z);
    for (const actor of actors2) actor.draw();
    c.drawImage(cache.images.foreground, Math.round(-camera.x), Math.round(-camera.y));
    c.restore();
    uiLabel(c, canvas, s);
    return true;
  }
  var CASTLE_LIBRARY_SCENE = Object.freeze({
    width: 1254,
    height: 1380,
    tileWidth: 80,
    tileHeight: 72,
    originX: 147,
    originY: 320
  });
  function castleLibraryPoint(x, y) {
    const m = CASTLE_LIBRARY_SCENE;
    return { x: m.originX + (x + 0.5) * m.tileWidth, y: m.originY + (y + 0.5) * m.tileHeight };
  }
  function castleLibraryCamera(canvas, room, motion = null, now = performance.now()) {
    const m = CASTLE_LIBRARY_SCENE;
    const t = motion && motion.id === room.id ? clamp2((now - motion.start) / motion.duration, 0, 1) : 1;
    const x = motion && motion.id === room.id ? motion.fromX + (room.x - motion.fromX) * t : room.x;
    const y = motion && motion.id === room.id ? motion.fromY + (room.y - motion.fromY) * t : room.y;
    const p = castleLibraryPoint(x, y);
    return {
      x: clamp2(p.x - canvas.width / 2, 0, Math.max(0, m.width - canvas.width)),
      y: clamp2(p.y - canvas.height * 0.6, 0, Math.max(0, m.height - canvas.height)),
      player: p,
      t
    };
  }
  function renderCastleLibrary(canvas, s, room, motion = null, now = performance.now()) {
    if (!cache.ready) return false;
    if (room?.id !== "castle-library" || s.pos.map !== "castle") throw Error("Library renderer requires castle library");
    const c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    const z = CASTLE_SCENE_SCALE;
    const cam = castleLibraryCamera({
      width: Math.ceil(canvas.width / z),
      height: Math.ceil(canvas.height / z)
    }, room, motion, now);
    c.save();
    c.scale(z, z);
    const sx = (x) => Math.round(x - cam.x), sy = (y) => Math.round(y - cam.y);
    c.fillStyle = "#131321";
    c.fillRect(0, 0, Math.ceil(canvas.width / z), Math.ceil(canvas.height / z));
    c.drawImage(cache.images.libraryBackground, sx(0), sy(0));
    const elder = castleLibraryPoint(6, 3), elderSprite = cache.images.librarian;
    const heroFrame = motion && cam.t < 1 ? heroGaitFrame(motion, cam.t) : 0;
    const heroKey = "hero_" + room.facing + "_" + heroFrame;
    const heroSprite = cache.images[heroKey];
    if (!heroSprite) throw Error("Missing castle room sprite " + heroKey);
    lastHeroSprite = heroKey;
    const actors2 = [
      { y: elder.y, draw: () => {
        c.drawImage(elderSprite, sx(elder.x - elderSprite.width / 2), sy(elder.y + 42 - elderSprite.height));
      } },
      { y: cam.player.y, draw: () => {
        const x = sx(cam.player.x - heroSprite.width / 2), y = sy(cam.player.y + 43 - heroSprite.height);
        c.fillStyle = "#10132575";
        c.beginPath();
        c.ellipse(x + heroSprite.width / 2, y + heroSprite.height - 9, 32, 9, 0, 0, Math.PI * 2);
        c.fill();
        c.drawImage(heroSprite, x, y);
      } }
    ];
    actors2.sort((a, b) => a.y - b.y);
    for (const actor of actors2) actor.draw();
    c.drawImage(cache.images.libraryForeground, sx(0), sy(0));
    c.restore();
    uiLabel(c, canvas, s, "\u30A2\u30EB\u30C6\u30EA\u30A2\u57CE\u3000\u66F8\u5EAB");
    return true;
  }

  // src/game/interiors.mjs
  var ENTRIES = Object.freeze([
    {
      id: "castle-library",
      map: "castle",
      door: { x: 1, y: 7 },
      name: "\u30A2\u30EB\u30C6\u30EA\u30A2\u57CE\u30FB\u66F8\u5EAB",
      theme: "library",
      keeper: "\u66F8\u5EAB\u756A",
      words: ["\u66F8\u5EAB\u756A\u300C\u57CE\u306B\u53E4\u304F\u304B\u3089\u6B8B\u308B\u5730\u56F3\u306F\u3001\u5192\u967A\u8005\u306E\u9053\u3057\u308B\u3079\u306B\u306A\u308B\u3093\u3060\u300D", "\u66F8\u5EAB\u756A\u300C\u56F0\u3063\u305F\u3089\u3001\u753A\u306E\u4EBA\u306E\u8A71\u3092\u805E\u3044\u3066\u307F\u308B\u3068\u3044\u3044\u3088\u300D"]
    },
    {
      id: "leaf-west-home",
      map: "leaf",
      door: { x: 3, y: 3 },
      name: "\u30EA\u30FC\u30D5\u30A1\u30FB\u4ED5\u7ACB\u3066\u5C4B\u306E\u5BB6",
      theme: "home",
      keeper: "\u4ED5\u7ACB\u3066\u5C4B",
      words: ["\u4ED5\u7ACB\u3066\u5C4B\u300C\u907F\u96E3\u3057\u3066\u304D\u305F\u4EBA\u306E\u670D\u3092\u3001\u307F\u3093\u306A\u3067\u7E55\u3063\u3066\u3044\u308B\u3093\u3060\u300D", "\u4ED5\u7ACB\u3066\u5C4B\u300C\u6D1E\u7A9F\u3078\u884C\u304F\u306A\u3089\u7121\u7406\u3092\u3057\u306A\u3044\u3067\u306D\u300D"]
    },
    {
      id: "leaf-east-home",
      map: "leaf",
      door: { x: 13, y: 3 },
      name: "\u30EA\u30FC\u30D5\u30A1\u30FB\u6751\u4EBA\u306E\u5BB6",
      theme: "home",
      keeper: "\u30EA\u30FC\u30D5\u30A1\u306E\u4F4F\u4EBA",
      words: ["\u6751\u4EBA\u300C\u9B54\u7269\u304C\u3044\u306A\u304F\u306A\u308C\u3070\u3001\u307E\u305F\u753A\u3082\u8CD1\u3084\u304B\u306B\u306A\u308B\u3088\u300D", "\u6751\u4EBA\u300C\u65C5\u306E\u4EBA\u3082\u3001\u3053\u306E\u753A\u3067\u306F\u5927\u5207\u306A\u304A\u5BA2\u3055\u3093\u3055\u300D"]
    },
    {
      id: "leaf-inn",
      map: "leaf",
      door: { x: 2, y: 8 },
      name: "\u30EA\u30FC\u30D5\u30A1\u30FB\u65C5\u4EBA\u306E\u5BBF",
      theme: "inn",
      keeper: "\u5BBF\u306E\u5973\u5C06",
      service: "inn",
      words: ["\u5BBF\u306E\u5973\u5C06\u300C\u75B2\u308C\u305F\u8DB3\u3092\u4F11\u3081\u3066\u3044\u304D\u306A\u3055\u3044\u3002\u6E29\u304B\u306A\u5BDD\u5E8A\u3092\u7528\u610F\u3057\u307E\u3059\u300D"]
    },
    {
      id: "leaf-shop",
      map: "leaf",
      door: { x: 14, y: 8 },
      name: "\u30EA\u30FC\u30D5\u30A1\u30FB\u65C5\u306E\u9053\u5177\u5C4B",
      theme: "shop",
      keeper: "\u9053\u5177\u5C4B\u306E\u4E3B\u4EBA",
      service: "shop",
      words: ["\u9053\u5177\u5C4B\u306E\u4E3B\u4EBA\u300C\u4F55\u304C\u5FC5\u8981\u304B\u3001\u68DA\u3092\u898B\u3066\u304B\u3089\u6C7A\u3081\u3066\u304A\u304F\u308C\u300D"]
    },
    {
      id: "sailun-inn",
      map: "sailun",
      door: { x: 2, y: 9 },
      name: "\u30BB\u30A4\u30EB\u30F3\u30FB\u6F6E\u98A8\u306E\u5BBF",
      theme: "harbor-inn",
      keeper: "\u5BBF\u306E\u4E3B\u4EBA",
      service: "inn",
      words: ["\u5BBF\u306E\u4E3B\u4EBA\u300C\u6E2F\u3092\u884C\u304D\u4EA4\u3046\u8239\u306E\u4EBA\u3082\u3001\u3053\u3053\u3067\u591C\u3092\u660E\u304B\u3059\u3093\u3060\u300D"]
    },
    {
      id: "sailun-shop",
      map: "sailun",
      door: { x: 16, y: 9 },
      name: "\u30BB\u30A4\u30EB\u30F3\u30FB\u8239\u5177\u3068\u9053\u5177\u306E\u5E97",
      theme: "harbor-shop",
      keeper: "\u9053\u5177\u5C4B\u306E\u4E3B\u4EBA",
      service: "shop",
      words: ["\u9053\u5177\u5C4B\u306E\u4E3B\u4EBA\u300C\u6D77\u306E\u9053\u5177\u3082\u3001\u65C5\u306B\u5F79\u7ACB\u3064\u3082\u306E\u3082\u63C3\u3048\u3066\u3044\u308B\u3088\u300D"]
    }
  ]);
  var W = 12;
  var H = 10;
  var ENTRY = { x: 6, y: 8 };
  var blocked = /* @__PURE__ */ new Set(["2,3", "2,4", "9,3", "9,4", "3,6", "8,6", "1,2", "10,2"]);
  var SLOTS = ["2,3", "2,4", "9,3", "9,4", "3,6", "8,6", "1,2", "10,2"];
  var PRESETS = {
    "castle-library": [
      ["shelf", "\u6B74\u53F2\u66F8\u306E\u68DA", "\u3053\u306E\u56FD\u306E\u53E4\u3044\u5730\u56F3\u304C\u4F55\u518A\u3082\u3042\u308B\u3002\u3069\u308C\u3082\u9053\u304C\u5C11\u3057\u305A\u3064\u9055\u3046\u3002"],
      ["shelf", "\u65C5\u306E\u8A18\u9332", "\u4ED6\u56FD\u306E\u8A00\u8449\u3067\u66F8\u304B\u308C\u305F\u65C5\u306E\u8A18\u9332\u304C\u4E26\u3093\u3067\u3044\u308B\u3002"],
      ["scrollcase", "\u5DFB\u7269\u68DA", "\u53E4\u3044\u5199\u672C\u304C\u4E01\u5BE7\u306B\u5DFB\u304B\u308C\u3066\u3044\u308B\u3002\u8AB0\u304B\u304C\u3053\u3053\u3067\u5B88\u308A\u7D9A\u3051\u305F\u306E\u3060\u308D\u3046\u3002"],
      ["shelf", "\u661F\u306E\u8A18\u9332", "\u7D30\u304B\u306A\u661F\u56F3\u304C\u63CF\u304B\u308C\u3066\u3044\u308B\u3002\u8A18\u3055\u308C\u305F\u5E74\u6708\u306F\u3059\u3067\u306B\u6D88\u3048\u3066\u3044\u305F\u3002"],
      ["table", "\u8AAD\u66F8\u673A", "\u624B\u5165\u308C\u3055\u308C\u305F\u7FBD\u6839\u30DA\u30F3\u3068\u3001\u8AAD\u307F\u304B\u3051\u306E\u672C\u304C\u6B8B\u3063\u3066\u3044\u308B\u3002"],
      ["crate", "\u4FDD\u7BA1\u7BB1", "\u6E7F\u6C17\u3092\u9632\u3050\u5E03\u3067\u5927\u5207\u306A\u6587\u66F8\u304C\u5305\u307E\u308C\u3066\u3044\u305F\u3002"],
      ["window", "\u66F8\u5EAB\u306E\u7A93", "\u9AD8\u3044\u7A93\u304B\u3089\u3001\u9060\u304F\u306E\u753A\u4E26\u307F\u306B\u5149\u304C\u5DEE\u3057\u8FBC\u3093\u3067\u3044\u308B\u3002"],
      ["globe", "\u53E4\u3044\u5730\u7403\u5100", "\u5927\u9678\u306E\u6771\u7AEF\u306F\u307E\u3060\u7A7A\u767D\u3060\u3002\u66F8\u5EAB\u756A\u3082\u305D\u306E\u5148\u3092\u77E5\u3089\u306A\u3044\u3089\u3057\u3044\u3002"]
    ],
    "leaf-west-home": [
      ["wardrobe", "\u4ED5\u7ACB\u3066\u68DA", "\u4ED5\u7ACB\u3066\u9014\u4E2D\u306E\u65C5\u88C5\u304C\u80A9\u3092\u4E26\u3079\u3066\u3044\u308B\u3002"],
      ["fabric", "\u5E03\u306E\u5C71", "\u4E08\u592B\u306A\u5E03\u3068\u3001\u5B50\u3069\u3082\u7528\u306E\u5C0F\u3055\u306A\u4E0A\u7740\u304C\u7A4D\u307E\u308C\u3066\u3044\u308B\u3002"],
      ["loom", "\u6A5F\u7E54\u308A\u6A5F", "\u8DB3\u8E0F\u307F\u3067\u52D5\u304F\u6A5F\u7E54\u308A\u6A5F\u3002\u4FEE\u7E55\u306E\u305F\u3081\u306B\u4F55\u5EA6\u3082\u4F7F\u308F\u308C\u3066\u3044\u308B\u3002"],
      ["fabric", "\u7CF8\u3068\u91DD", "\u67D3\u3081\u305F\u7CF8\u304C\u8272\u3054\u3068\u306B\u5DFB\u304B\u308C\u3001\u91DD\u304C\u5C0F\u7BB1\u306B\u4E26\u3093\u3067\u3044\u308B\u3002"],
      ["sewing", "\u88C1\u7E2B\u53F0", "\u907F\u96E3\u3057\u3066\u304D\u305F\u4EBA\u306E\u7834\u308C\u305F\u8896\u304C\u3001\u4E00\u91DD\u305A\u3064\u7E2B\u3044\u5408\u308F\u3055\u308C\u3066\u3044\u308B\u3002"],
      ["crate", "\u670D\u306E\u6728\u7BB1", "\u6D17\u3044\u305F\u3066\u306E\u8863\u670D\u304C\u5E03\u306B\u5305\u307E\u308C\u3066\u3044\u308B\u3002"],
      ["window", "\u5C0F\u3055\u306A\u7A93", "\u7A93\u306E\u5916\u306B\u306F\u3001\u30EA\u30FC\u30D5\u30A1\u306E\u5E83\u5834\u304C\u898B\u3048\u308B\u3002"],
      ["vase", "\u767D\u3044\u82B1", "\u5C0F\u3055\u306A\u82B1\u304C\u4E00\u8F2A\u3002\u8584\u6697\u3044\u90E8\u5C4B\u304C\u307B\u3093\u306E\u5C11\u3057\u660E\u308B\u304F\u306A\u308B\u3002"]
    ],
    "leaf-east-home": [
      ["shelf", "\u601D\u3044\u51FA\u306E\u68DA", "\u5BB6\u65CF\u306E\u53E4\u3044\u5199\u771F\u7ACB\u3066\u3068\u3001\u65C5\u5148\u3067\u62FE\u3063\u305F\u5C0F\u77F3\u304C\u4E26\u3093\u3067\u3044\u308B\u3002"],
      ["cupboard", "\u98DF\u5668\u68DA", "\u6B20\u3051\u305F\u76BF\u3082\u5927\u5207\u306B\u4E26\u3079\u3089\u308C\u3066\u3044\u308B\u3002"],
      ["hearth", "\u6696\u7089", "\u7070\u306F\u307E\u3060\u6E29\u304B\u3044\u3002\u8AB0\u304B\u304C\u3055\u3063\u304D\u307E\u3067\u706B\u3092\u711A\u3044\u3066\u3044\u305F\u3002"],
      ["cupboard", "\u4FDD\u5B58\u98DF\u306E\u68DA", "\u5E72\u3057\u305F\u91CE\u83DC\u3068\u9EA6\u306E\u888B\u3002\u51AC\u306B\u5099\u3048\u3066\u96C6\u3081\u305F\u98DF\u6599\u3060\u3002"],
      ["table", "\u5915\u98DF\u306E\u673A", "\u4E09\u4EBA\u5206\u306E\u6728\u306E\u5668\u3068\u3001\u5C11\u3057\u3060\u3051\u6B8B\u3063\u305F\u30D1\u30F3\u304C\u3042\u308B\u3002"],
      ["crate", "\u85AA\u5165\u308C", "\u3088\u304F\u4E7E\u304B\u3057\u305F\u85AA\u304C\u63C3\u3048\u3066\u3042\u308B\u3002"],
      ["window", "\u901A\u308A\u306E\u7A93", "\u901A\u308A\u306B\u306F\u4EBA\u304C\u623B\u308A\u3001\u5C11\u3057\u305A\u3064\u65E5\u5E38\u3092\u53D6\u308A\u623B\u3057\u3066\u3044\u308B\u3002"],
      ["vase", "\u7A93\u8FBA\u306E\u9262", "\u5BB6\u306E\u4EBA\u304C\u80B2\u3066\u3066\u3044\u308B\u3001\u5C0F\u3055\u306A\u7DD1\u306E\u9262\u690D\u3048\u3002"]
    ],
    "leaf-inn": [
      ["bed", "\u65C5\u4EBA\u306E\u5BDD\u5E8A", "\u6E05\u6F54\u306A\u5BDD\u5177\u304C\u63C3\u3063\u3066\u3044\u308B\u3002\u3053\u3053\u306A\u3089\u75B2\u308C\u3092\u53D6\u308C\u305D\u3046\u3060\u3002"],
      ["bed", "\u7A93\u969B\u306E\u5BDD\u5E8A", "\u6BDB\u5E03\u304C\u4E01\u5BE7\u306B\u7573\u307E\u308C\u3066\u3044\u308B\u3002"],
      ["cupboard", "\u5BBF\u306E\u98DF\u5668\u68DA", "\u5BA2\u4EBA\u7528\u306E\u6E6F\u98F2\u307F\u304C\u4E26\u3093\u3067\u3044\u308B\u3002"],
      ["shelf", "\u65C5\u306E\u6848\u5185\u68DA", "\u8857\u9053\u306E\u9053\u9806\u3092\u66F8\u3044\u305F\u5C0F\u3055\u306A\u7D19\u304C\u3042\u308B\u3002"],
      ["table", "\u5BBF\u306E\u671D\u98DF\u53F0", "\u6E29\u304B\u306A\u30B9\u30FC\u30D7\u306E\u9999\u308A\u304C\u3059\u308B\u3002"],
      ["crate", "\u65C5\u4EBA\u306E\u8377\u7269\u7BB1", "\u5BA2\u304C\u9810\u3051\u305F\u8377\u7269\u306B\u306F\u3001\u4E00\u3064\u3072\u3068\u3064\u672D\u304C\u4ED8\u3044\u3066\u3044\u308B\u3002"],
      ["window", "\u671D\u65E5\u306E\u7A93", "\u671D\u306B\u306A\u308B\u3068\u3001\u3053\u3053\u304B\u3089\u3084\u3055\u3057\u3044\u5149\u304C\u5DEE\u3059\u3002"],
      ["vase", "\u5BBF\u306E\u82B1", "\u67AF\u3089\u3055\u306A\u3044\u3088\u3046\u3001\u6BCE\u65E5\u6C34\u304C\u66FF\u3048\u3089\u308C\u3066\u3044\u308B\u3002"]
    ],
    "leaf-shop": [
      ["shelf", "\u65C5\u306E\u9053\u5177\u68DA", "\u56DE\u5FA9\u85AC\u3084\u5305\u5E2F\u306A\u3069\u304C\u7528\u9014\u3054\u3068\u306B\u6574\u7406\u3055\u308C\u3066\u3044\u308B\u3002"],
      ["shelf", "\u4FDD\u5B58\u98DF\u306E\u68DA", "\u5E72\u3057\u8089\u3068\u6728\u306E\u6C34\u7B52\u304C\u4E26\u3093\u3067\u3044\u308B\u3002"],
      ["cupboard", "\u4E88\u5099\u306E\u85AC\u7BB1", "\u3044\u3056\u3068\u3044\u3046\u3068\u304D\u306E\u305F\u3081\u306E\u85AC\u304C\u304D\u3061\u3093\u3068\u3057\u307E\u308F\u308C\u3066\u3044\u308B\u3002"],
      ["fabric", "\u65C5\u88C5\u306E\u5E03", "\u96E8\u3088\u3051\u306E\u5916\u5957\u304C\u4F55\u679A\u304B\u639B\u3051\u3089\u308C\u3066\u3044\u308B\u3002"],
      ["counter", "\u9053\u5177\u5C4B\u306E\u30AB\u30A6\u30F3\u30BF\u30FC", "\u5E97\u306E\u4E3B\u4EBA\u304C\u6BCE\u671D\u78E8\u3044\u3066\u3044\u308B\u6728\u306E\u30AB\u30A6\u30F3\u30BF\u30FC\u3002"],
      ["crate", "\u88DC\u5145\u5F85\u3061\u306E\u7BB1", "\u6E2F\u304B\u3089\u5C4A\u3044\u305F\u54C1\u306E\u8377\u672D\u304C\u3064\u3044\u3066\u3044\u308B\u3002"],
      ["window", "\u901A\u308A\u306E\u7A93", "\u30EA\u30FC\u30D5\u30A1\u306E\u4EBA\u305F\u3061\u304C\u8CB7\u3044\u7269\u306B\u7ACB\u3061\u5BC4\u3063\u3066\u3044\u308B\u3002"],
      ["vase", "\u5C0F\u3055\u306A\u98FE\u308A", "\u6728\u5F6B\u308A\u306E\u304A\u5B88\u308A\u304C\u3001\u68DA\u306E\u9685\u306B\u98FE\u3089\u308C\u3066\u3044\u308B\u3002"]
    ],
    "sailun-inn": [
      ["bed", "\u8239\u4E57\u308A\u306E\u5BDD\u5E8A", "\u9577\u65C5\u306E\u8239\u4E57\u308A\u3092\u8FCE\u3048\u308B\u9811\u4E08\u306A\u6728\u306E\u5BDD\u53F0\u3002"],
      ["bed", "\u6CE2\u97F3\u306E\u5BDD\u5E8A", "\u7720\u308B\u3068\u3001\u7A93\u306E\u5916\u304B\u3089\u6CE2\u306E\u97F3\u304C\u805E\u3053\u3048\u308B\u3002"],
      ["cupboard", "\u8239\u5BA2\u306E\u98DF\u5668\u68DA", "\u539A\u624B\u306E\u5668\u306F\u3001\u63FA\u308C\u308B\u8239\u3067\u3082\u5272\u308C\u306B\u304F\u3044\u3002"],
      ["shelf", "\u6D77\u56F3\u306E\u68DA", "\u6E2F\u304B\u3089\u5317\u3078\u4F38\u3073\u308B\u822A\u8DEF\u304C\u66F8\u304B\u308C\u3066\u3044\u308B\u3002"],
      ["table", "\u6E2F\u5BBF\u306E\u98DF\u4E8B\u53F0", "\u9B5A\u306E\u716E\u8FBC\u307F\u304C\u6E6F\u6C17\u3092\u7ACB\u3066\u3066\u3044\u308B\u3002"],
      ["barrel", "\u6C34\u306E\u6A3D", "\u8239\u304B\u3089\u904B\u3093\u3060\u771F\u6C34\u304C\u84C4\u3048\u3089\u308C\u3066\u3044\u308B\u3002"],
      ["window", "\u6E2F\u306E\u7A93", "\u505C\u6CCA\u3057\u3066\u3044\u308B\u5C0F\u821F\u306E\u5E06\u304C\u98A8\u306B\u63FA\u308C\u3066\u3044\u308B\u3002"],
      ["vase", "\u6D5C\u306E\u82B1", "\u6F6E\u98A8\u306B\u3082\u8CA0\u3051\u305A\u54B2\u304F\u3001\u5C0F\u3055\u306A\u9EC4\u8272\u3044\u82B1\u3002"]
    ],
    "sailun-shop": [
      ["shelf", "\u65C5\u306E\u88C5\u5099\u68DA", "\u4E08\u592B\u306A\u9769\u7D10\u3068\u9632\u6C34\u888B\u304C\u63C3\u3048\u3066\u3042\u308B\u3002"],
      ["shelf", "\u8239\u5177\u68DA", "\u6ED1\u8ECA\u3084\u30ED\u30FC\u30D7\u306A\u3069\u3001\u8239\u306E\u4FEE\u7406\u306B\u5FC5\u8981\u306A\u9053\u5177\u304C\u3042\u308B\u3002"],
      ["cupboard", "\u91D1\u5C5E\u306E\u88C5\u5099\u7BB1", "\u78E8\u304B\u308C\u305F\u91D1\u5177\u304C\u6574\u7136\u3068\u53CE\u3081\u3089\u308C\u3066\u3044\u308B\u3002"],
      ["barrel", "\u5E06\u5E03\u306E\u675F", "\u6F6E\u98A8\u306B\u3082\u4E08\u592B\u306A\u5E06\u5E03\u304C\u4E38\u304F\u675F\u306D\u3089\u308C\u3066\u3044\u308B\u3002"],
      ["counter", "\u6E2F\u753A\u306E\u30AB\u30A6\u30F3\u30BF\u30FC", "\u65C5\u4EBA\u3068\u8239\u4E57\u308A\u304C\u4EA4\u308F\u3059\u3001\u53E4\u3044\u5546\u8AC7\u306E\u8DE1\u304C\u6B8B\u3063\u3066\u3044\u308B\u3002"],
      ["crate", "\u6D77\u8DEF\u306E\u8377\u7BB1", "\u6E2F\u3078\u5C4A\u3044\u305F\u3070\u304B\u308A\u306E\u54C1\u304C\u5C01\u3092\u3055\u308C\u305F\u307E\u307E\u7F6E\u3044\u3066\u3042\u308B\u3002"],
      ["window", "\u6F6E\u98A8\u306E\u7A93", "\u5916\u304B\u3089\u6F6E\u306E\u9999\u308A\u3068\u3001\u30AB\u30E2\u30E1\u306E\u58F0\u304C\u5C4A\u304F\u3002"],
      ["globe", "\u5C0F\u3055\u306A\u822A\u6D77\u56F3", "\u30BB\u30A4\u30EB\u30F3\u304B\u3089\u5317\u306E\u5CAC\u307E\u3067\u3001\u5371\u967A\u306A\u6D45\u702C\u304C\u66F8\u304D\u8FBC\u307E\u308C\u3066\u3044\u308B\u3002"]
    ]
  };
  var ROOM_FURNISHINGS = new Map(Object.entries(PRESETS).map(([id, items]) => {
    if (items.length !== SLOTS.length) throw Error("Interior item layout mismatch: " + id);
    return [id, new Map(items.map(([kind, name, description], i) => [
      SLOTS[i],
      Object.freeze({ kind, name, description })
    ]))];
  }));
  function interiorFixtures(room) {
    const items = ROOM_FURNISHINGS.get(room.id);
    if (!items) throw Error("Unknown furnished interior: " + room.id);
    return items;
  }
  var resident = { x: 6, y: 3 };
  function enterableDoor(pos) {
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[pos.facing];
    return ENTRIES.find((e) => e.map === pos.map && e.door.x === pos.x + delta[0] && e.door.y === pos.y + delta[1]) || null;
  }
  function makeInterior(door) {
    if (!ENTRIES.some((e) => e.id === door.id)) throw Error("Unknown interior");
    return { id: door.id, x: ENTRY.x, y: ENTRY.y, facing: "up" };
  }
  function interiorDefinition(room) {
    const definition = ENTRIES.find((e) => e.id === room.id);
    if (!definition) throw Error("Unknown interior " + room.id);
    return definition;
  }
  function moveInside(room, dir) {
    if (!["up", "down", "left", "right"].includes(dir)) throw Error("Direction invalid");
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const x = room.x + dx, y = room.y + dy;
    if (x === 6 && y === 9) return { kind: "exit", room: null };
    const facing = { ...room, facing: dir };
    if (x <= 0 || y <= 1 || x >= W - 1 || y >= H - 1 || blocked.has(x + "," + y) || x === resident.x && y === resident.y)
      return { kind: "blocked", room: facing };
    return { kind: "walk", room: { ...facing, x, y } };
  }
  function interiorTarget(room) {
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[room.facing];
    if (!d) throw Error("Invalid interior direction");
    return { x: room.x + d[0], y: room.y + d[1] };
  }
  function investigateInside(room) {
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[room.facing];
    const x = room.x + dx, y = room.y + dy;
    const definition = interiorDefinition(room);
    if (x === resident.x && y === resident.y) return definition.words;
    const item = interiorFixtures(room).get(x + "," + y);
    if (item) return [item.description];
    if (x === 6 && y === 9) return ["\u6249\u304B\u3089\u5916\u3078\u623B\u308C\u308B\u3002\u4E0B\u3078\u6B69\u3053\u3046\u3002"];
    return ["\u3042\u305F\u308A\u3092\u8ABF\u3079\u305F\u3002\u5BB6\u5177\u3084\u751F\u6D3B\u306E\u9053\u5177\u304C\u4E26\u3093\u3067\u3044\u308B\u3002"];
  }
  function interiorPrompt(room) {
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[room.facing];
    const x = room.x + dx, y = room.y + dy;
    if (x === resident.x && y === resident.y) {
      const def = interiorDefinition(room);
      return def.service === "inn" ? "A  \u5BBF\u6CCA\u3059\u308B" : def.service === "shop" ? "A  \u8CB7\u3044\u7269\u3092\u3059\u308B" : "A  " + def.keeper + "\u3068\u8A71\u3059";
    }
    const fixture = interiorFixtures(room).get(x + "," + y);
    if (fixture) return "A  " + fixture.name + "\u3092\u8ABF\u3079\u308B";
    return "";
  }

  // src/game/retro-assets.mjs
  var IMAGES = Object.freeze({
    floor: "floor.png",
    interior: "interior.png",
    village: "village.png",
    actors: "actors.png",
    monsters: "monsters.png",
    vold: "vold.png",
    townSheet: "ansimuz-town.png",
    townGrass: "ansimuz-grass.png",
    townGround: "ansimuz-town-ground.png",
    townHouses: "ansimuz-houses.png",
    actors32: "actors32.png",
    townCalmGrass: "town-grass-calm.png",
    townRoad: "town-road-edges.png"
  });
  var RETRO_ASSET_VERSION = "20261111-castle-approved-return-v13-01";
  var cache2 = /* @__PURE__ */ new Map();
  var ready = false;
  var loading = null;
  function retroAssetsReady() {
    return ready;
  }
  function retroAsset(key) {
    if (!Object.hasOwn(IMAGES, key)) throw Error("Unrecognized retro art key: " + key);
    if (!ready) throw Error("Retro CC0 assets not preloaded: " + key);
    const img = cache2.get(key);
    if (!img || !img.complete || img.naturalWidth === 0) throw Error("Retro asset unavailable: " + key);
    return img;
  }
  function preloadRetroAssets() {
    if (loading) return loading;
    if (typeof Image === "undefined") throw Error("Retro art preload requires browser Image");
    loading = Promise.all(Object.entries(IMAGES).map(([key, filename]) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth < 32 || img.naturalHeight < 32) {
          reject(Error("Corrupt retro PNG: " + filename));
          return;
        }
        cache2.set(key, img);
        resolve();
      };
      img.onerror = () => reject(Error("Could not load retro art " + filename));
      img.src = "assets/retro/" + filename + "?v=" + RETRO_ASSET_VERSION;
    }))).then(() => {
      ready = true;
      return true;
    });
    return loading;
  }

  // src/game/reboot-art.mjs
  var TILE = 24;
  var B = (c, x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  var D = (c, x, y, col) => B(c, x, y, 1, 1, col);
  var HASH = (x, y, z = 0) => (Math.imul(x + 83, 73856093) ^ Math.imul(y + 127, 19349663) ^ Math.imul(z + 73, 83492791)) >>> 0;
  var hashdot = (c, x, y, seed, col, n = 3) => {
    for (let i = 0; i < n; i++) {
      const h = HASH(seed, i, 7);
      B(c, x + 3 + h % 17, y + 3 + (h >>> 8) % 16, 1 + (h % 3 === 0 ? 1 : 0), 1, col);
    }
  };
  var P = {
    castle: {
      ground: "#9b9f9e",
      light: "#c0c0b3",
      shade: "#777f83",
      dark: "#4b596b",
      deep: "#283446",
      wall: "#586879",
      accent: "#c4a46b",
      wood: "#69463c",
      roof: "#506482",
      grass: "#5c8855"
    },
    field: {
      ground: "#669958",
      light: "#9abe6c",
      shade: "#418050",
      dark: "#315e44",
      deep: "#263c38",
      wall: "#858c6a",
      accent: "#d5b579",
      wood: "#906c47",
      roof: "#8c5748",
      grass: "#5b9952"
    },
    leaf: {
      ground: "#6c9b58",
      light: "#9dc071",
      shade: "#457b50",
      dark: "#315d45",
      deep: "#2b483d",
      wall: "#c8b58a",
      accent: "#dfbd79",
      wood: "#78553d",
      roof: "#aa634b",
      grass: "#6d9b58"
    },
    sailun: {
      ground: "#9ea99d",
      light: "#d4d6bd",
      shade: "#738e8c",
      dark: "#466777",
      deep: "#2b4554",
      wall: "#d6cbb0",
      accent: "#dfbb79",
      wood: "#805f48",
      roof: "#52738a",
      grass: "#6b996f"
    },
    cave: {
      ground: "#645d62",
      light: "#998b8d",
      shade: "#4e4755",
      dark: "#35374d",
      deep: "#222d3d",
      wall: "#514d63",
      accent: "#cead7d",
      wood: "#715244",
      roof: "#64576c",
      grass: "#717a5b"
    },
    ruins: {
      ground: "#838b8d",
      light: "#bac2b0",
      shade: "#62777b",
      dark: "#405d66",
      deep: "#2c3e51",
      wall: "#657780",
      accent: "#c2b087",
      wood: "#6c6a63",
      roof: "#587b79",
      grass: "#7c9b7b"
    },
    onyx: {
      ground: "#534b64",
      light: "#8d7798",
      shade: "#3e3854",
      dark: "#2c2944",
      deep: "#1e2138",
      wall: "#423952",
      accent: "#ad7794",
      wood: "#65546a",
      roof: "#514766",
      grass: "#547673"
    }
  };
  var theme = (m) => P[m] || P.field;
  var sourceTile = (c, sheet, tx, ty, x, y) => {
    c.drawImage(retroAsset(sheet), tx * 16, ty * 16, 16, 16, Math.round(x), Math.round(y), TILE, TILE);
  };
  function paintLicensedTerrain(c, id, x, y, wx, wy, mapId, neighbors) {
    if (!retroAssetsReady()) return false;
    const variant = HASH(wx, wy, id) % 4;
    if (id === 0 || id === 4) {
      const base = mapId === "sailun" ? "interior" : "floor";
      if (base === "interior") sourceTile(c, "interior", 12 + (wx + 3) % 6, 6 + wy % 4, x, y);
      else sourceTile(c, "floor", 12 + variant, 12, x, y);
      if (id === 0 && mapId === "leaf" && HASH(wx, wy, 2) % 9 === 0) {
        B(c, x + 15, y + 6, 2, 3, "#e9cb7e");
        D(c, x + 16, y + 5, "#fff2b6");
      }
      if (mapId === "field" && HASH(wx, wy, 5) % 19 === 0) B(c, x + 5, y + 11, 2, 2, "#e9d38e");
      return true;
    }
    if (id === 3) {
      if (mapId === "field" || mapId === "leaf") {
        let col = 14 + (wx + wy & 1);
        if (neighbors.w === 0 && neighbors.e !== 0) col = 13;
        if (neighbors.e === 0 && neighbors.w !== 0) col = 16;
        sourceTile(c, "floor", col, 9, x, y);
      } else if (mapId === "sailun") sourceTile(c, "floor", 12 + wx % 5, 14 + wy % 4, x, y);
      else sourceTile(c, "interior", 12 + wx % 6, 0 + wy % 4, x, y);
      return true;
    }
    if (id === 7) {
      if (mapId === "castle") sourceTile(c, "interior", 12 + wx % 6, wy % 4, x, y);
      else if (mapId === "sailun") sourceTile(c, "floor", 12 + wx % 5, 14 + wy % 4, x, y);
      else sourceTile(c, "interior", wx % 6, 12 + wy % 4, x, y);
      return true;
    }
    if (id === 5 && mapId === "field") {
      sourceTile(c, "floor", 14, 9, x, y);
      return true;
    }
    if (id === 9) {
      const dark = mapId === "onyx" || mapId === "cave";
      if (mapId === "ruins") {
        sourceTile(c, "floor", 12 + wx % 5, 14 + wy % 4, x, y);
        B(c, x, y, 24, 24, "#3c6f6a66");
      } else {
        const mx = 12 + wx % 6, my = (dark ? 12 : 6) + wy % 4;
        sourceTile(c, "interior", mx, my, x, y);
      }
      if (mapId === "onyx") B(c, x, y, 24, 24, "#48264f35");
      if (mapId === "ruins" && HASH(wx, wy) % 11 === 0) {
        B(c, x + 16, y + 6, 5, 2, "#708e7d");
        B(c, x + 18, y + 5, 2, 3, "#a0b998");
      }
      if (mapId === "cave" && HASH(wx, wy) % 7 === 0) B(c, x + 5, y + 5, 3, 2, "#7a6875");
      return true;
    }
    return false;
  }
  function floor(c, x, y, wx, wy, p, variation) {
    B(c, x, y, 24, 24, p.ground);
    if (variation === 0) B(c, x + 2, y + 2, 8, 3, p.light);
    if (variation === 1) B(c, x + 14, y + 13, 7, 2, p.shade);
    if (variation === 2) B(c, x + 4, y + 17, 7, 2, p.shade);
    hashdot(c, x, y, HASH(wx, wy), p.shade, 4);
    hashdot(c, x, y, HASH(wy, wx, 3), p.light, 3);
  }
  function stone(c, x, y, wx, wy, p, castle2 = false) {
    B(c, x, y, 24, 24, p.ground);
    const shade = (wx + wy) % 3 === 0 ? p.light : p.shade;
    B(c, x, y, 24, 1, p.shade);
    B(c, x, y + 11, 24, 1, p.shade);
    B(c, x + 10 + wy % 2 * 5, y + 1, 1, 10, p.shade);
    B(c, x + 5 + (wy + 1) % 2 * 9, y + 12, 1, 12, p.shade);
    B(c, x + 1, y + 2, 9, 1, p.light);
    B(c, x + 12, y + 13, 10, 1, p.light);
    if (HASH(wx, wy) % 4 === 0) {
      B(c, x + 16, y + 4, 3, 1, p.light);
      B(c, x + 4, y + 17, 2, 1, shade);
    }
    if (castle2) {
      B(c, x + 2, y + 9, 4, 1, "#ded4b9");
      B(c, x + 14, y + 19, 3, 1, "#bdb4a2");
    }
  }
  function grass(c, x, y, wx, wy, p) {
    B(c, x, y, 24, 24, p.ground);
    const v = HASH(wx, wy) % 4;
    for (let i = 0; i < 5; i++) {
      const px = 3 + HASH(wx, i, wy) % 18, py = 3 + HASH(wy, i, wx) % 17;
      B(c, x + px, y + py, 2 + i % 2, 1, i % 3 === 0 ? p.light : p.shade);
      if (i % 2 === 0) D(c, x + px + 1, y + py - 2, p.light);
    }
    if (v === 0) {
      B(c, x + 13, y + 8, 2, 2, "#e8d98b");
      D(c, x + 14, y + 7, "#fff6c8");
      D(c, x + 14, y + 10, "#fff3b0");
    }
    if (v === 1) {
      B(c, x + 4, y + 15, 3, 2, p.dark);
      B(c, x + 18, y + 5, 3, 1, p.light);
    }
  }
  function water(c, x, y, wx, wy, m) {
    const deep = m === "sailun" ? "#285f82" : "#316c85";
    const mid = m === "sailun" ? "#3885a0" : "#448e9b";
    const hi = m === "sailun" ? "#8bd1d2" : "#a3d6c8";
    B(c, x, y, 24, 24, deep);
    B(c, x, y + 3, 24, 18, mid);
    for (let i = 0; i < 4; i++) {
      const n = HASH(wx, wy, i), px = n % 15, py = 4 + (n >>> 6) % 16;
      B(c, x + px, y + py, 5 + i % 4, 1, i % 2 ? hi : deep);
      if (i % 3 === 0) B(c, x + px + 2, y + py + 2, 2, 1, hi);
    }
    B(c, x, y + 22, 24, 2, deep);
  }
  function carpet(c, x, y, wx, wy, p) {
    B(c, x, y, 24, 24, p.dark);
    B(c, x + 3, y, 18, 24, "#8f364a");
    B(c, x + 5, y, 14, 24, "#ad4b51");
    B(c, x + 2, y, 2, 24, p.accent);
    B(c, x + 20, y, 2, 24, p.accent);
    for (const [dx, dy] of [[8, 5], [14, 17]]) {
      if ((wx + wy) % 2 === 0) {
        B(c, x + dx, y + dy, 2, 2, "#d69b66");
        D(c, x + dx + 2, y + dy + 2, "#efc787");
      }
    }
  }
  function wall(c, x, y, wx, wy, p, m) {
    B(c, x, y, 24, 24, p.deep);
    B(c, x, y, 24, 5, p.light);
    B(c, x, y + 5, 24, 2, p.shade);
    B(c, x + 1, y + 7, 22, 16, p.wall);
    B(c, x + 1, y + 9, 22, 1, p.shade);
    B(c, x + 1, y + 18, 22, 1, p.shade);
    if (wy % 2) {
      B(c, x + 8, y + 10, 1, 8, p.dark);
      B(c, x + 18, y + 19, 1, 5, p.dark);
    } else {
      B(c, x + 16, y + 11, 1, 7, p.dark);
      B(c, x + 4, y + 19, 1, 5, p.dark);
    }
    B(c, x + 2, y + 11, 6, 1, p.light);
    B(c, x + 12, y + 21, 6, 1, p.light);
    if (HASH(wx, wy) % 3 === 0) B(c, x + 7, y + 14, 2, 2, p.shade);
    if (m === "onyx") {
      B(c, x + 2, y + 9, 2, 10, "#714b7e");
      D(c, x + 19, y + 13, "#b17aaf");
    }
    if (m === "ruins") {
      B(c, x + 4, y + 9, 5, 1, "#91b6a5");
      B(c, x + 6, y + 11, 1, 5, "#719b83");
    }
  }
  function tree(c, x, y, wx, wy, p) {
    B(c, x, y, 24, 24, p.deep);
    B(c, x + 10, y + 15, 5, 9, "#715339");
    B(c, x + 11, y + 17, 2, 7, "#af8357");
    const clusters = [
      [5, 8, 14, 13, p.dark],
      [3, 4, 13, 12, p.shade],
      [10, 3, 12, 13, p.dark],
      [7, 1, 11, 12, p.ground],
      [2, 10, 10, 8, p.shade],
      [13, 9, 9, 10, p.shade],
      [8, 4, 7, 6, p.light],
      [15, 5, 4, 4, p.light],
      [4, 9, 6, 3, p.light]
    ];
    for (const [dx, dy, w, h, color2] of clusters) B(c, x + dx, y + dy, w, h, color2);
    B(c, x + 6, y + 3, 5, 2, "#b7cd7b");
    B(c, x + 14, y + 12, 5, 2, p.dark);
    if (HASH(wx, wy) % 5 === 0) D(c, x + 16, y + 3, "#e0d98d");
  }
  function rock(c, x, y, p, m, wx, wy, n = {}) {
    B(c, x, y, 24, 24, p.dark);
    B(c, x + 1, y + 2, 22, 21, p.shade);
    if (n.n !== 10) {
      B(c, x, y, 24, 5, p.light);
      B(c, x + 2, y + 1, 15, 2, p.accent);
    } else {
      B(c, x + 3, y + 3, 11, 2, p.ground);
    }
    if (n.s !== 10) {
      B(c, x + 1, y + 18, 22, 6, p.deep);
      B(c, x + 3, y + 17, 18, 2, p.dark);
    } else B(c, x + 3, y + 21, 17, 1, p.dark);
    if (n.w !== 10) {
      B(c, x + 1, y + 5, 3, 14, p.light);
      B(c, x + 2, y + 7, 1, 11, p.accent);
    }
    if (n.e !== 10) {
      B(c, x + 20, y + 5, 4, 14, p.deep);
    }
    const cracks = HASH(wx, wy, 9);
    B(c, x + 4 + cracks % 10, y + 8, 1, 5, p.dark);
    B(c, x + 6 + cracks % 9, y + 13, 4, 1, p.light);
    if (cracks % 4 === 0) {
      B(c, x + 16, y + 4, 5, 2, p.wall);
      B(c, x + 10, y + 19, 2, 1, p.light);
    }
    if (m === "ruins" && cracks % 3 === 0) {
      B(c, x + 7, y + 6, 3, 2, "#7f9b8f");
      B(c, x + 9, y + 9, 1, 3, "#98bba3");
    }
    if (m === "onyx") {
      B(c, x + 6, y + 8, 1, 9, "#9b6d9b");
      D(c, x + 7, y + 8, "#dca2bd");
    }
  }
  function paintTile(c, id, x, y, wx, wy, mapId, neighbors = {}) {
    const p = theme(mapId), v = HASH(wx, wy, id) % 4;
    if (paintLicensedTerrain(c, id, x, y, wx, wy, mapId, neighbors)) return;
    if (id === 0) {
      grass(c, x, y, wx, wy, p);
      return;
    }
    if (id === 1) {
      if (mapId === "field" || mapId === "cave") {
        rock(c, x, y, p, mapId, wx, wy, neighbors);
        B(c, x + 1, y + 1, 14, 2, p.grass);
        if (mapId === "field") {
          B(c, x + 7, y + 3, 8, 4, "#52784c");
          B(c, x + 12, y + 1, 4, 2, "#96b86e");
        }
      } else wall(c, x, y, wx, wy, p, mapId);
      return;
    }
    if (id === 2) {
      water(c, x, y, wx, wy, mapId);
      return;
    }
    if (id === 3) {
      if (mapId === "field") {
        B(c, x, y, 24, 24, "#b69a70");
        B(c, x, y, 24, 2, "#cdb58a");
        B(c, x + 3, y + 7, 6, 2, "#9c8265");
        B(c, x + 15, y + 17, 6, 1, "#d2bd93");
        hashdot(c, x, y, HASH(wx, wy), "#947b5c", 4);
      } else {
        stone(c, x, y, wx, wy, { ...p, ground: mapId === "sailun" ? "#b8b5a7" : "#b4ad95" }, false);
      }
      return;
    }
    if (id === 4) {
      tree(c, x, y, wx, wy, p);
      return;
    }
    if (id === 5) {
      stone(c, x, y, wx, wy, p, true);
      B(c, x + 3, y + 2, 18, 22, p.deep);
      B(c, x + 5, y + 3, 14, 20, p.wood);
      B(c, x + 6, y + 4, 5, 18, "#ad815a");
      B(c, x + 12, y + 4, 5, 18, "#704e3c");
      B(c, x + 6, y + 4, 11, 2, p.accent);
      B(c, x + 17, y + 14, 2, 2, "#f2d48c");
      return;
    }
    if (id === 6) {
      stone(c, x, y, wx, wy, p, false);
      B(c, x + 1, y, 22, 24, "#273446");
      for (let i = 4; i < 24; i += 5) {
        B(c, x + i, y + 1, 2, 22, "#a2afad");
        B(c, x + i, y + 1, 1, 22, "#d9d0b7");
      }
      B(c, x + 1, y + 7, 22, 3, "#b7a078");
      B(c, x + 1, y + 18, 22, 2, "#655f62");
      return;
    }
    if (id === 7) {
      stone(c, x, y, wx, wy, p, mapId === "castle");
      return;
    }
    if (id === 8) {
      carpet(c, x, y, wx, wy, p);
      return;
    }
    if (id === 9) {
      floor(c, x, y, wx, wy, p, v);
      B(c, x + 1, y + 22, 22, 1, p.dark);
      B(c, x + 2, y + 2, 7, 1, p.light);
      if (v === 0) {
        B(c, x + 9, y + 6, 4, 3, p.shade);
        D(c, x + 13, y + 9, p.dark);
      }
      return;
    }
    if (id === 10) {
      rock(c, x, y, p, mapId, wx, wy, neighbors);
      return;
    }
    throw Error("Unknown tile kind " + id);
  }
  function paintTreeCanopy(c, x, y, wx, wy, mapId) {
    if (retroAssetsReady()) {
      const large = HASH(wx, wy, 31) % 4 !== 1;
      if (large) {
        c.drawImage(retroAsset("village"), 0, 97, 64, 60, Math.round(x - 17), Math.round(y - 39), 58, 62);
      } else {
        c.drawImage(retroAsset("village"), 76, 97, 43, 59, Math.round(x - 8), Math.round(y - 31), 43, 56);
      }
      return;
    }
    const p = theme(mapId), variant = HASH(wx, wy, 31) % 4;
    const colors = variant === 0 ? ["#244e3c", "#397047", "#589958", "#7db565", "#a5cc72"] : variant === 1 ? ["#285438", "#43723d", "#5e9444", "#80b45b", "#a8cc70"] : ["#224b42", "#386c55", "#518b62", "#74b272", "#a4ca8a"];
    const R2 = (dx, dy, w, h, color2) => B(c, x + dx, y + dy, w, h, color2);
    R2(9, 9, 9, 18, "#4b382d");
    R2(12, 12, 3, 15, "#89623d");
    R2(2, 4, 34, 22, colors[0]);
    R2(-5, 1, 25, 21, colors[1]);
    R2(8, -11, 22, 32, colors[0]);
    R2(16, -9, 23, 26, colors[1]);
    R2(-3, -5, 25, 23, colors[2]);
    R2(8, -16, 21, 25, colors[2]);
    R2(13, -17, 15, 14, colors[3]);
    R2(24, -7, 13, 13, colors[3]);
    R2(-1, 0, 12, 12, colors[3]);
    R2(8, -9, 11, 9, colors[3]);
    R2(2, -3, 8, 6, colors[4]);
    R2(17, -15, 7, 4, colors[4]);
    R2(27, -4, 6, 3, colors[4]);
    R2(11, 8, 9, 4, colors[2]);
    R2(5, 14, 8, 6, colors[1]);
    R2(24, 12, 8, 7, colors[1]);
    R2(6, 18, 6, 2, colors[0]);
    R2(28, 18, 7, 2, colors[0]);
    if (variant === 3) {
      R2(8, -15, 2, 3, "#e6d78e");
      R2(30, 7, 2, 2, "#d6ca78");
    }
  }
  var characterPalettes = {
    hero: ["#315f9f", "#4d9dc9", "#c5e0e4", "#243a62", "#e9ba8d", "#604638"],
    king: ["#a44e61", "#d27a70", "#f6d69b", "#684b5d", "#e4b694", "#8a5d5b"],
    refugee: ["#ad7564", "#e4bba1", "#f0d69e", "#604c56", "#dfb093", "#7c5b47"],
    guard: ["#587787", "#9eb3b6", "#f1ce8b", "#344d5f", "#d8ae8e", "#59656b"],
    elder: ["#678e60", "#a6bd75", "#ecdda7", "#4b6954", "#ddaf8c", "#b2a78a"],
    helper: ["#a56570", "#d9ad9c", "#f1d59b", "#66535a", "#e4b28e", "#775a50"],
    inn: ["#9a7658", "#d4b27d", "#eee1b4", "#665344", "#deb38e", "#795c45"],
    shop: ["#506e79", "#8fb3ae", "#e9d49c", "#36546b", "#e8b897", "#8c6257"],
    watchman: ["#967a53", "#d2b474", "#f8e0a3", "#5b554a", "#d9ac88", "#675347"],
    frontSoldier: ["#637f87", "#9fbbc6", "#e5cc9d", "#435369", "#ddb38d", "#6c5552"],
    riona: ["#755b91", "#a995c2", "#d6d5ea", "#494565", "#e6bea4", "#ded6b7"],
    lighthouse: ["#ab8e64", "#dbc9a0", "#e6d5ba", "#665f53", "#dbb492", "#8b705b"]
  };
  var actorP = (kind) => characterPalettes[kind] || characterPalettes.helper;
  function paintActor(c, tileX, tileY, kind = "hero", facing = "down", frame = 0, scale = 1) {
    if (retroAssetsReady()) {
      const people = ["hero", "king", "guard", "refugee", "elder", "helper", "inn", "shop", "watchman", "frontSoldier", "riona", "lighthouse"];
      const actorIndex = people.indexOf(kind);
      if (actorIndex < 0) throw Error("Missing authored actor: " + kind);
      const col = { down: 0, up: 1, left: 2, right: 3 }[facing];
      if (col === void 0) throw Error("Bad actor facing: " + facing);
      const row = frame > 0 ? Math.abs(frame) % 2 + 1 : 0;
      const width = 36 * scale, height = 42 * scale;
      const x2 = Math.round(tileX + (TILE - width) / 2);
      const y2 = Math.round(tileY + TILE - height + 3);
      B(c, tileX + 3 * scale, tileY + 24 * scale, 18 * scale, 3 * scale, "#15232a75");
      c.drawImage(
        retroAsset("actors32"),
        (col * 3 + row) * 32,
        actorIndex * 32,
        32,
        32,
        x2,
        y2,
        width,
        height
      );
      return { x: x2, y: y2, width, height };
    }
    const p = actorP(kind);
    const x = Math.round(tileX), y = Math.round(tileY) - 10;
    const R2 = (a, b, w, h, col) => B(c, x + a * scale, y + b * scale, w * scale, h * scale, col);
    const stride = frame % 3 === 1 ? 2 : frame % 3 === 2 ? -2 : 0;
    B(c, x + 3 * scale, y + 30 * scale, 18 * scale, 2 * scale, "#17243288");
    R2(6 + stride, 25, 5, 5, p[3]);
    R2(13 - stride, 25, 5, 5, p[3]);
    R2(6 + stride, 28, 5, 3, "#2e2a35");
    R2(13 - stride, 28, 5, 3, "#2e2a35");
    R2(4, 14, 16, 13, p[3]);
    R2(3, 18, 18, 6, p[0]);
    R2(6, 15, 12, 9, p[0]);
    R2(7, 16, 10, 3, p[1]);
    R2(7, 22, 10, 2, p[2]);
    R2(10, 16, 4, 8, p[1]);
    R2(2, 17 + stride / 2, 4, 9, p[0]);
    R2(18, 17 - stride / 2, 4, 9, p[0]);
    R2(3, 24 + stride / 2, 3, 3, p[4]);
    R2(18, 24 - stride / 2, 3, 3, p[4]);
    R2(6, 19, 2, 3, p[3]);
    R2(16, 19, 2, 3, p[3]);
    R2(8, 23, 8, 2, p[3]);
    R2(7, 5, 11, 12, "#7c554f");
    R2(8, 5, 9, 10, p[4]);
    R2(10, 7, 7, 7, "#f0c69b");
    R2(6, 10, 2, 4, p[4]);
    R2(18, 10, 2, 4, p[4]);
    R2(10, 16, 6, 2, p[4]);
    const hair = kind === "hero" ? "#203d70" : kind === "riona" ? "#d9c5e1" : kind === "king" ? "#a19a82" : kind === "guard" || kind === "frontSoldier" ? "#677788" : p[5];
    const bright = kind === "hero" ? "#4b8fb9" : kind === "riona" ? "#f0ddf3" : kind === "king" ? "#d6c4a6" : kind === "guard" || kind === "frontSoldier" ? "#a8bfc0" : "#c69d75";
    R2(6, 3, 13, 5, hair);
    R2(8, 1, 9, 4, bright);
    R2(5, 6, 4, 6, hair);
    R2(16, 4, 4, 7, hair);
    R2(8, 4, 5, 2, bright);
    R2(15, 6, 2, 3, bright);
    if (facing === "up") {
      R2(7, 6, 11, 10, hair);
      R2(9, 6, 6, 4, bright);
      R2(8, 14, 9, 3, p[3]);
    } else if (facing === "left") {
      R2(7, 9, 2, 2, "#232e46");
      R2(5, 11, 4, 2, p[4]);
      R2(8, 12, 2, 1, "#966963");
      R2(15, 9, 4, 7, hair);
    } else if (facing === "right") {
      R2(16, 9, 2, 2, "#232e46");
      R2(17, 11, 4, 2, p[4]);
      R2(15, 12, 2, 1, "#966963");
      R2(5, 9, 4, 7, hair);
    } else {
      R2(10, 10, 2, 2, "#2a3246");
      R2(16, 10, 2, 2, "#2a3246");
      R2(11, 12, 1, 1, "#fff6d9");
      R2(16, 12, 1, 1, "#fff6d9");
      R2(13, 14, 3, 1, "#b4786d");
    }
    if (kind === "hero") {
      R2(11, 19, 3, 3, "#f7e2bd");
      R2(7, 20, 2, 5, "#d0a65a");
      R2(19, 17, 2, 8, "#a7b6bb");
      R2(20, 17, 1, 8, "#e7e5db");
    }
    if (kind === "king") {
      R2(7, 1, 12, 3, "#d7b56c");
      R2(8, 0, 2, 3, "#ffefb6");
      R2(14, 0, 2, 3, "#ffefb6");
      R2(11, 1, 3, 2, "#e45d71");
      R2(9, 19, 8, 4, "#dcbb7b");
    }
    if (kind === "guard" || kind === "frontSoldier") {
      R2(6, 3, 14, 4, "#9aacbb");
      R2(9, 0, 6, 4, "#c8dbdf");
      R2(19, 18, 4, 9, "#7896a2");
      R2(19, 17, 4, 2, "#c9dddb");
    }
    if (kind === "riona") {
      R2(5, 9, 3, 13, hair);
      R2(18, 9, 3, 13, hair);
      R2(7, 24, 10, 3, "#ded4ae");
      R2(9, 2, 6, 2, "#c8ad6e");
    }
    if (kind === "elder") {
      R2(10, 13, 6, 3, "#e0e3c5");
      R2(10, 16, 5, 2, "#cfd4ad");
    }
    return { x, y, width: 24 * scale, height: 32 * scale };
  }
  var F = (c, x, y, w, h, co) => B(c, x, y, w, h, co);
  function paintBuilding(c, b, tileToPixel, mapId) {
    const p = theme(mapId);
    const [x, y] = tileToPixel(b.x, b.y);
    const w = b.w * TILE, h = b.h * TILE;
    if (w < 48 || h < 48) throw Error("Building below authored minimum");
    if (retroAssetsReady()) {
      const isHome = b.kind === "home";
      const region = isHome ? { x: 253, y: 95, w: 67, h: 92 } : { x: 177, y: 95, w: 77, h: 95 };
      const visualWidth = w + (isHome ? 4 : 9);
      const visualHeight = h + 25;
      const px = x - Math.round((visualWidth - w) / 2);
      B(c, x + 2, y + h - 10, w - 4, 9, "#273b2d55");
      c.drawImage(
        retroAsset("village"),
        region.x,
        region.y,
        region.w,
        region.h,
        Math.round(px),
        Math.round(y - 25),
        visualWidth,
        visualHeight
      );
      if (mapId === "sailun") {
        const roof2 = b.kind === "inn" ? "#467487" : "#546e83";
        const roofHi2 = b.kind === "inn" ? "#91b1b4" : "#a0b1b3";
        for (let tier = 0; tier < 10; tier++) {
          const inset = 21 - tier * 2, ty = y - 22 + tier * 5;
          B(c, x - 5 + inset, ty, w + 10 - 2 * inset, 5, tier % 2 ? roof2 : roofHi2);
          B(c, x - 4 + inset, ty + 1, w + 8 - 2 * inset, 2, roof2);
          for (let sh = 6; sh < w - 2 * inset; sh += 16) {
            B(c, x - 4 + inset + sh, ty + 3, 1, 2, "#e4d5b0");
          }
        }
        B(c, x - 4, y + 27, w + 8, 5, "#364e5d");
        B(c, x + 2, y + 27, w - 4, 1, "#e4d5ae");
        B(c, x + 6, y + 35, 7, 3, "#6b8e99");
        B(c, x + w - 13, y + 35, 7, 3, "#6b8e99");
      }
      if (b.kind !== "home") {
        const plaqueX = x + Math.round(w / 2) - 14;
        B(c, plaqueX, y + 30, 28, 11, "#41363d");
        B(c, plaqueX + 1, y + 31, 26, 9, "#dfc89b");
        if (b.kind === "inn") {
          B(c, plaqueX + 8, y + 34, 12, 3, "#8f4e4a");
          B(c, plaqueX + 9, y + 32, 10, 2, "#b67552");
        } else {
          B(c, plaqueX + 10, y + 32, 9, 6, "#546e78");
          B(c, plaqueX + 9, y + 34, 11, 2, "#86abb6");
        }
      }
      return;
    }
    const roof = b.kind === "inn" ? mapId === "sailun" ? "#507b8d" : "#8b675c" : b.kind === "shop" ? "#637e91" : p.roof;
    const roofHi = b.kind === "inn" ? "#ad9375" : b.kind === "shop" ? "#8aa6b5" : "#d09874";
    F(c, x - 2, y + 12, w + 4, h - 12, "#594d48");
    F(c, x + 2, y + 16, w - 4, h - 20, p.wall);
    F(c, x + 4, y + 18, w - 8, h - 23, "#ded0ad");
    F(c, x + w - 12, y + 18, 8, h - 23, "#968777");
    F(c, x - 5, y + 12, w + 10, 9, "#352f39");
    F(c, x - 4, y + 6, w + 8, 9, roof);
    F(c, x - 1, y + 1, w + 2, 6, roofHi);
    for (let i = 0; i < Math.ceil(w / 12); i++) {
      F(c, x - 3 + i * 12, y + 9, 10, 2, i % 2 ? roof : "#c19b81");
      F(c, x - 3 + i * 12, y + 12, 11, 2, "#374459");
    }
    for (let tier = 0; tier < 7; tier++) {
      const inset = (6 - tier) * 3, py = y - 20 + tier * 3;
      F(c, x + inset, py, w - 2 * inset, 3, tier % 2 ? roof : roofHi);
      F(c, x + inset + 1, py, w - 2 * inset - 2, 1, tier % 2 ? "#e9bc86" : "#64463a");
    }
    F(c, x + 4, y + 1, w - 8, 4, "#493b3e");
    F(c, x + 6, y + 5, w - 12, 3, roofHi);
    for (let tx = 9; tx < w - 9; tx += 13) {
      F(c, x + tx, y + 8, 8, 2, "#d7ae82");
      F(c, x + tx + 2, y + 11, 7, 2, roof);
    }
    for (const bx of [6, w - 9]) {
      F(c, x + bx, y + 23, 3, Math.max(4, h - 31), "#80573e");
      F(c, x + bx + 1, y + 25, 1, Math.max(3, h - 35), "#d4a173");
    }
    F(c, x + 5, y + 24, w - 10, 2, "#87654e");
    for (let i = 0; i < w - 16; i += 12) F(c, x + 8 + i, y + 18, 2, 16, p.wood);
    for (const side of [8, w - 24]) {
      F(c, x + side, y + 30, 16, 16, "#594a43");
      F(c, x + side + 2, y + 31, 12, 11, "#9bc3c5");
      F(c, x + side + 3, y + 33, 10, 2, "#e5f0da");
      F(c, x + side + 7, y + 31, 2, 11, p.wood);
      F(c, x + side, y + 43, 16, 3, p.wood);
    }
    const doorX = x + Math.round(w / 2) - 9;
    F(c, doorX - 2, y + h - 27, 22, 27, "#4d4247");
    F(c, doorX, y + h - 25, 18, 25, p.wood);
    F(c, doorX + 3, y + h - 22, 12, 21, "#b8875e");
    F(c, doorX + 4, y + h - 21, 5, 20, "#d8ae80");
    F(c, doorX + 13, y + h - 13, 2, 2, "#f7d18b");
    F(c, x + 3, y + h - 6, w - 6, 6, "#615c5d");
    if (b.kind === "inn") {
      F(c, x + w / 2 - 16, y + 18, 32, 14, "#65443f");
      F(c, x + w / 2 - 14, y + 20, 28, 10, "#e1bf82");
      F(c, x + w / 2 - 9, y + 22, 18, 2, "#6e4b43");
      F(c, x + w / 2 - 4, y + 24, 8, 3, "#96504b");
    } else if (b.kind === "shop") {
      F(c, x + w / 2 - 16, y + 18, 32, 14, "#52677b");
      F(c, x + w / 2 - 14, y + 20, 28, 10, "#e0c48e");
      F(c, x + w / 2 - 9, y + 22, 18, 2, "#4d6073");
      F(c, x + w / 2 - 3, y + 20, 6, 9, "#a7764d");
    }
  }
  function paintScenery(c, feature, tileToPixel, mapId) {
    const p = theme(mapId);
    const [x, y] = tileToPixel(feature.x, feature.y);
    const k = feature.kind;
    if (k === "column") {
      F(c, x + 6, y - 18, 15, 44, "#505e71");
      F(c, x + 3, y - 15, 15, 39, "#b9b5a8");
      F(c, x + 5, y - 12, 5, 34, "#e7d9bd");
      F(c, x + 2, y - 17, 20, 6, "#d1bea0");
      F(c, x + 1, y + 19, 23, 6, "#716d73");
    } else if (k === "banner") {
      F(c, x + 6, y - 17, 13, 38, "#7e2b48");
      F(c, x + 7, y - 17, 2, 35, "#e0bd76");
      F(c, x + 16, y - 17, 2, 35, "#e0bd76");
      F(c, x + 10, y - 4, 6, 8, "#e6bf73");
    } else if (k === "throne-canopy") {
      F(c, x - 21, y - 11, 67, 16, "#473449");
      F(c, x - 16, y - 13, 56, 7, "#8e3249");
      F(c, x - 15, y - 10, 3, 24, "#d9b46e");
      F(c, x + 36, y - 10, 3, 24, "#d9b46e");
      F(c, x - 4, y - 9, 23, 10, "#d9b46e");
      F(c, x + 2, y - 7, 11, 8, "#6d2c4a");
    } else if (k === "mosaic") {
      F(c, x + 5, y + 4, 14, 14, "#9e825e");
      F(c, x + 8, y + 7, 8, 8, "#d5bc85");
      F(c, x + 11, y + 1, 2, 20, "#d4b883");
      F(c, x + 2, y + 10, 20, 2, "#d4b883");
    } else if (k === "doorway") {
      F(c, x + 1, y + 2, 22, 20, "#3a4356");
      F(c, x + 4, y + 5, 16, 17, "#684b43");
      F(c, x + 9, y + 12, 2, 2, "#efd2a4");
    } else if (k === "well") {
      F(c, x + 3, y + 7, 19, 17, "#564f56");
      F(c, x + 5, y + 8, 15, 13, "#bbb3a1");
      F(c, x + 7, y + 10, 11, 9, "#355f77");
      F(c, x + 7, y + 12, 11, 1, "#9ad7dd");
      F(c, x + 4, y + 5, 18, 5, "#e0c9a3");
      F(c, x + 7, y - 2, 2, 10, p.wood);
      F(c, x + 18, y - 2, 2, 10, p.wood);
      F(c, x + 5, y - 6, 17, 4, "#936b50");
      F(c, x + 8, y - 8, 11, 3, "#ce9b68");
    } else if (k === "lamp") {
      F(c, x + 10, y - 8, 4, 28, "#5e4c4c");
      F(c, x + 8, y - 12, 8, 12, "#e8bd6d");
      F(c, x + 10, y - 9, 4, 8, "#fff4c7");
      F(c, x + 7, y - 15, 10, 4, "#4c4d53");
      F(c, x + 7, y + 20, 10, 3, "#4d474a");
    } else if (k === "garden") {
      for (const [dx, dy] of [[3, 6], [13, 7], [9, 14]]) {
        F(c, x + dx, y + dy, 8, 7, "#366344");
        F(c, x + dx + 1, y + dy + 1, 4, 3, "#83b66c");
        D(c, x + dx + 3, y + dy + 2, "#f1dc96");
      }
      F(c, x + 2, y + 21, 22, 3, "#9c7954");
    } else if (k === "signpost") {
      F(c, x + 11, y + 8, 3, 16, "#76553e");
      F(c, x + 2, y + 3, 22, 10, "#af8356");
      F(c, x + 4, y + 5, 18, 5, "#e6be7a");
      F(c, x + 6, y + 7, 12, 1, "#745943");
    } else if (k === "boat") {
      F(c, x + 2, y - 7, 22, 30, "#73533c");
      F(c, x + 4, y - 6, 18, 24, "#cca77c");
      F(c, x + 8, y - 7, 11, 8, "#f4deab");
      F(c, x + 10, y - 13, 2, 27, "#604b42");
      F(c, x + 12, y - 11, 12, 19, "#e9e0bf");
      F(c, x + 14, y - 9, 8, 15, "#fbf0d0");
      F(c, x + 6, y + 17, 16, 3, "#664335");
    } else if (k === "barrels") {
      for (const dx of [2, 13]) {
        F(c, x + dx, y + 8, 10, 13, "#78533b");
        F(c, x + dx + 2, y + 6, 6, 14, "#b88a58");
        F(c, x + dx, y + 9, 10, 2, "#dac79d");
        F(c, x + dx, y + 17, 10, 2, "#5a554e");
      }
    } else if (k === "lighthouse") {
      F(c, x + 5, y - 30, 16, 50, "#ded8c5");
      F(c, x + 6, y - 27, 5, 45, "#f2efdd");
      for (let dy = 0; dy < 42; dy += 9) F(c, x + 5, y - 23 + dy, 16, 2, "#8a9da2");
      F(c, x + 3, y - 35, 20, 8, "#4b7192");
      F(c, x + 9, y - 41, 8, 7, "#ffe6a0");
      F(c, x + 5, y + 10, 16, 8, "#647581");
    } else throw Error("Unknown authored scenery kind " + k);
  }
  function paintObject(c, obj, tileToPixel, s) {
    const [x, y] = tileToPixel(obj.x, obj.y), k = obj.kind;
    if (["raider", "caveBoss", "ruinsBoss", "onyxBoss"].includes(k)) {
      const color2 = k === "onyxBoss" ? "#855078" : "#98735e";
      F(c, x + 5, y + 5, 15, 17, "#353748");
      F(c, x + 7, y + 2, 12, 14, color2);
      F(c, x + 8, y + 8, 3, 3, "#ffcd79");
      F(c, x + 16, y + 8, 3, 3, "#ffcd79");
      F(c, x + 4, y + 17, 6, 7, "#3b304b");
      F(c, x + 16, y + 17, 6, 7, "#3b304b");
      F(c, x + 5, y + 1, 5, 6, "#676078");
      F(c, x + 17, y + 1, 5, 6, "#676078");
    } else if (k === "gate") return;
    else if (["onyxBarrier", "onyxSeal", "optionalDoor"].includes(k)) {
      const dark = k !== "optionalDoor";
      F(c, x + 2, y, 20, 24, dark ? "#302943" : "#755b4c");
      F(c, x + 5, y + 2, 14, 21, dark ? "#745a83" : "#ad8764");
      F(c, x + 11, y + 2, 2, 20, dark ? "#c69ed0" : "#e7cb9e");
      F(c, x + 17, y + 14, 2, 2, "#eed29c");
    } else if (["onyxRuneA", "onyxRuneB", "switchA", "switchB"].includes(k)) {
      const glow = Boolean(s.flags[k]);
      F(c, x + 4, y + 3, 17, 21, "#5d6570");
      F(c, x + 6, y + 5, 13, 15, "#a7abb1");
      F(c, x + 10, y + 6, 5, 11, glow ? "#a2f3e2" : "#5b7890");
      F(c, x + 8, y + 12, 9, 3, glow ? "#e2fff0" : "#83939c");
    } else if (k === "onyxForge" || k === "sword") {
      F(c, x + 3, y + 16, 18, 7, "#71645c");
      F(c, x + 10, y + 1, 4, 20, "#e8d5a0");
      F(c, x + 9, y + 4, 6, 10, "#d5e4de");
      F(c, x + 6, y + 12, 12, 2, "#c9a26c");
      D(c, x + 11, y, "#fff9d1");
    } else if (k === "mirror") {
      F(c, x + 4, y + 3, 16, 21, "#d9b97c");
      F(c, x + 6, y + 5, 12, 16, "#73b2bb");
      F(c, x + 9, y + 7, 5, 7, "#d9f2dc");
      F(c, x + 3, y + 21, 18, 3, "#8f795e");
    } else if (["chest", "ironChest", "ironKeyChest", "onyxChest"].includes(k)) {
      const co = k === "onyxChest" ? "#75586e" : "#90603e";
      F(c, x + 2, y + 10, 20, 14, "#463842");
      F(c, x + 4, y + 12, 16, 10, co);
      F(c, x + 3, y + 7, 18, 6, "#b58655");
      F(c, x + 4, y + 7, 16, 2, "#eed59a");
      F(c, x + 11, y + 10, 3, 10, "#e7c781");
      F(c, x + 10, y + 16, 5, 4, "#775644");
    } else if (k === "star") {
      F(c, x + 10, y + 1, 5, 21, "#e9ddaa");
      F(c, x + 3, y + 9, 18, 5, "#9de2d7");
      F(c, x + 8, y + 7, 9, 9, "#fff7d1");
      D(c, x + 12, y + 11, "#fafaff");
    } else if (k === "mural") {
      F(c, x + 2, y + 1, 20, 23, "#b5a18a");
      F(c, x + 5, y + 4, 14, 17, "#dcc8a4");
      F(c, x + 12, y + 5, 3, 13, "#665c69");
      F(c, x + 7, y + 10, 10, 3, "#80737d");
      F(c, x + 10, y + 4, 7, 3, "#e0bf89");
    } else if (k === "waystone") {
      F(c, x + 5, y + 6, 15, 18, "#40565d");
      F(c, x + 7, y + 4, 12, 19, "#83978d");
      F(c, x + 9, y + 2, 8, 5, "#b7b49a");
      F(c, x + 8, y + 7, 2, 13, "#d4d1b2");
      F(c, x + 10, y + 9, 7, 2, "#506c6b");
      F(c, x + 10, y + 12, 5, 2, "#e0cf9c");
      F(c, x + 11, y + 16, 5, 1, "#59746e");
      F(c, x + 6, y + 19, 16, 3, "#5e7569");
      F(c, x + 5, y + 22, 17, 2, "#34494b");
      F(c, x + 4, y + 21, 4, 3, "#5f8a66");
    } else if (k === "sign") {
      F(c, x + 10, y + 10, 3, 14, "#5a443a");
      F(c, x + 2, y + 1, 21, 13, "#c6a070");
      F(c, x + 4, y + 3, 17, 3, "#efddad");
      F(c, x + 7, y + 9, 10, 2, "#8d694e");
    } else if (k === "onyxInscription") {
      F(c, x + 2, y + 2, 20, 22, "#74697a");
      F(c, x + 4, y + 4, 16, 18, "#b3a6a7");
      F(c, x + 10, y + 6, 5, 14, "#e3d3ab");
      F(c, x + 5, y + 13, 13, 2, "#6c6287");
    } else throw Error("Unknown object kind " + k);
  }
  function paintInteriorFurniture(c, kind, x, y) {
    const r2 = (dx, dy, w, h, col) => F(c, x + dx, y + dy, w, h, col);
    if (kind === "shelf") {
      r2(1, 0, 22, 24, "#4d3837");
      r2(3, 2, 18, 20, "#a1744c");
      for (let n = 0; n < 3; n++) {
        r2(4, 3 + n * 7, 16, 2, "#dbc18b");
        for (let j = 0; j < 4; j++) r2(5 + j * 4, 5 + n * 7, 2, 3, ["#627e94", "#b77557", "#94a26a", "#c5ab7b"][j]);
      }
    } else if (kind === "table") {
      r2(1, 8, 22, 11, "#74533f");
      r2(3, 6, 18, 7, "#b48763");
      r2(5, 8, 6, 2, "#d9b597");
      r2(3, 19, 3, 5, "#503e39");
      r2(18, 19, 3, 5, "#503e39");
    } else if (kind === "crate") {
      r2(2, 5, 20, 19, "#654e3b");
      r2(4, 7, 16, 15, "#b88850");
      r2(11, 7, 3, 15, "#805c3c");
      r2(4, 14, 16, 2, "#d0a573");
    } else if (kind === "vase") {
      r2(8, 9, 10, 14, "#4e7886");
      r2(10, 7, 6, 3, "#8db2b8");
      r2(12, 1, 2, 9, "#587e56");
      for (const [a, b] of [[6, 3], [15, 3], [10, 0]]) r2(a, b, 4, 4, "#e0a084");
    } else if (kind === "window") {
      r2(2, 2, 20, 19, "#574a4c");
      r2(5, 4, 14, 15, "#6fa1a1");
      r2(11, 4, 2, 15, "#d9c4a3");
      r2(5, 10, 14, 2, "#d9c4a3");
      r2(5, 19, 14, 3, "#b6a184");
    } else if (kind === "cupboard") {
      r2(1, 2, 22, 22, "#664d3f");
      r2(3, 4, 18, 18, "#b38862");
      r2(5, 6, 14, 3, "#ddbd91");
      r2(5, 15, 14, 3, "#d2ab7b");
      r2(11, 4, 2, 18, "#70523f");
    } else if (kind === "bed") {
      r2(2, 2, 20, 22, "#4e403d");
      r2(4, 3, 16, 18, "#b38a62");
      r2(5, 4, 14, 6, "#dfd6bb");
      r2(6, 5, 12, 3, "#f7ebd8");
      r2(5, 11, 14, 9, "#597a85");
      r2(7, 12, 11, 2, "#a2b8b5");
      r2(5, 20, 14, 2, "#8c6850");
      r2(2, 3, 2, 20, "#76513f");
    } else if (kind === "wardrobe") {
      r2(2, 0, 20, 24, "#544037");
      r2(4, 2, 16, 20, "#9e7854");
      r2(6, 4, 12, 16, "#bd8e62");
      r2(11, 4, 2, 16, "#73523e");
      r2(9, 12, 1, 3, "#e3c48f");
      r2(15, 12, 1, 3, "#e3c48f");
      r2(4, 20, 16, 2, "#5d3f36");
    } else if (kind === "fabric") {
      r2(3, 13, 19, 9, "#66504e");
      for (const [dy, col] of [[9, "#c49276"], [13, "#88a596"], [17, "#d4b991"]]) {
        r2(4, dy, 16, 5, col);
        r2(6, dy + 1, 12, 1, "#e5d8bf");
      }
      r2(7, 6, 12, 3, "#8a6a61");
      r2(8, 4, 10, 3, "#b8a28a");
    } else if (kind === "loom") {
      r2(2, 1, 3, 23, "#5a4034");
      r2(19, 1, 3, 23, "#5a4034");
      r2(3, 2, 18, 3, "#c9a173");
      r2(3, 20, 18, 3, "#c9a173");
      for (let n = 0; n < 8; n++) r2(6 + n * 2, 6, 1, 13, n % 2 ? "#b78d70" : "#e4c6a0");
      r2(6, 14, 12, 3, "#769c8f");
      r2(3, 23, 18, 1, "#483939");
    } else if (kind === "sewing") {
      r2(1, 8, 22, 12, "#6a4d3e");
      r2(2, 6, 20, 7, "#b58a5a");
      r2(3, 9, 16, 2, "#e5c89d");
      r2(6, 4, 9, 5, "#d9ae8f");
      r2(7, 3, 4, 2, "#e1d8b4");
      r2(16, 4, 2, 6, "#5f8691");
      r2(3, 20, 3, 4, "#664735");
      r2(19, 20, 3, 4, "#664735");
    } else if (kind === "hearth") {
      r2(1, 1, 22, 23, "#5a514a");
      r2(3, 2, 18, 19, "#91836c");
      r2(6, 7, 12, 15, "#282e38");
      r2(7, 17, 10, 5, "#d07851");
      r2(9, 12, 6, 8, "#f3a45d");
      r2(11, 10, 3, 9, "#ffe0a0");
      r2(3, 2, 18, 4, "#d0b795");
      r2(2, 21, 20, 3, "#645246");
    } else if (kind === "counter") {
      r2(1, 9, 22, 12, "#594438");
      r2(2, 6, 20, 7, "#c5a079");
      r2(3, 8, 18, 3, "#e2bd89");
      r2(3, 17, 18, 2, "#96704b");
      r2(4, 21, 4, 3, "#513c32");
      r2(17, 21, 4, 3, "#513c32");
      r2(13, 3, 6, 5, "#6d8086");
      r2(14, 2, 4, 2, "#c8d4c8");
    } else if (kind === "barrel") {
      r2(4, 3, 16, 21, "#4d4540");
      r2(6, 4, 12, 19, "#987049");
      r2(6, 5, 12, 4, "#bc925d");
      r2(6, 18, 12, 4, "#694f3d");
      r2(5, 9, 14, 3, "#5c6d71");
      r2(5, 17, 14, 3, "#5c6d71");
      r2(11, 4, 2, 18, "#d1a979");
    } else if (kind === "globe") {
      r2(10, 16, 4, 8, "#70513c");
      r2(4, 22, 17, 2, "#503d3b");
      r2(5, 2, 14, 15, "#486f87");
      r2(7, 3, 10, 12, "#75a5a8");
      r2(11, 5, 5, 4, "#5c865f");
      r2(8, 10, 6, 3, "#70946c");
      r2(4, 7, 2, 6, "#dfbc88");
      r2(18, 7, 2, 6, "#dfbc88");
      r2(11, 1, 3, 2, "#edd4a0");
    } else if (kind === "scrollcase") {
      r2(1, 2, 22, 22, "#4e3939");
      r2(3, 4, 18, 18, "#8b694e");
      for (let k = 0; k < 3; k++) {
        r2(5, 6 + k * 5, 14, 3, "#dfc8a0");
        r2(6, 5 + k * 5, 2, 4, "#8f6c54");
        r2(16, 5 + k * 5, 2, 4, "#8f6c54");
        r2(8, 6 + k * 5, 7, 1, "#b29a75");
      }
      r2(3, 20, 18, 2, "#d1ad75");
    } else throw Error("Unknown room furniture " + kind);
  }
  function paintBattleBackdrop(c, W2, H2, area) {
    const p = theme(area === "east" ? "field" : area);
    F(c, 0, 0, W2, H2, "#172337");
    const y0 = Math.floor(H2 * 0.49);
    if (area === "field" || area === "east") {
      F(c, 0, 0, W2, y0, "#6094a9");
      F(c, 0, 0, W2, 18, "#446b90");
      for (let i = 0; i < 12; i++) {
        const x = i * 34 - 10, h = 27 + HASH(i, 4) % 45;
        F(c, x, y0 - h, 28, h, "#6f92a0");
        F(c, x + 6, y0 - h - 5, 15, 8, "#a5b9b4");
      }
      F(c, 0, y0 - 3, W2, H2 - y0 + 3, "#5d9363");
      for (let x = 0; x < W2; x += 31) {
        F(c, x, y0 - 16, 20, 17, "#366348");
        F(c, x + 5, y0 - 22, 14, 15, "#487f57");
      }
    } else if (area === "cave" || area === "ruins" || area === "onyx") {
      F(c, 0, 0, W2, y0, area === "onyx" ? "#1d1830" : area === "ruins" ? "#29384a" : "#25283d");
      for (let i = 0; i < 11; i++) {
        const x = i * 36;
        F(c, x + 2, 23, 22, y0 - 23, area === "onyx" ? "#41314f" : area === "ruins" ? "#486477" : "#4e4b61");
        F(c, x + 2, 23, 3, y0 - 23, p.light);
        F(c, x, y0 - 11, 26, 13, p.dark);
      }
      F(c, 0, y0, W2, H2 - y0, p.ground);
      if (area === "onyx") for (let i = 0; i < 7; i++) {
        const x = 15 + i * 47;
        F(c, x, y0 + 8, 4, 24, "#9d608f");
        F(c, x + 2, y0 + 5, 3, 12, "#c387af");
      }
    } else {
      F(c, 0, 0, W2, y0, "#63829b");
      F(c, 0, y0 - 27, W2, 29, "#596f77");
      for (let i = 0; i < 9; i++) F(c, i * 42, y0 - 49, 29, 25, "#9ea9a2");
      F(c, 0, y0, W2, H2 - y0, "#867a70");
    }
    for (let y = y0; y < H2; y += 18) {
      F(c, 0, y, W2, 1, p.shade);
      for (let x = Math.floor(y / 18) % 2 * 13; x < W2; x += 32) {
        F(c, x, y + 2, 1, 12, p.shade);
        if (HASH(x, y) % 4 === 0) F(c, x + 10, y + 8, 5, 2, p.light);
      }
    }
    F(c, 0, H2 - 10, W2, 10, p.dark);
  }
  var monsterBase = [
    "#73bfaa",
    "#aa8262",
    "#be9666",
    "#7caf74",
    "#b09c6b",
    "#ad785b",
    "#9d7f68",
    "#689ba7",
    "#a47d58",
    "#cac8b5",
    "#99a7a8",
    "#b3b3d1",
    "#b49a84",
    "#9bafc4",
    "#a3a777",
    "#739e86",
    "#b77b68",
    "#9ba991",
    "#648d78",
    "#8285ac",
    "#a46b94",
    "#b2b5b6",
    "#a36d8d",
    "#8188ac",
    "#a06b89"
  ];
  function paintMonster(c, id, cx, foot) {
    const n = id === "vold" ? 25 : Number(String(id).slice(1));
    if (!Number.isSafeInteger(n) || n < 1 || n > 25) throw Error("Unrecognized enemy " + id);
    if (retroAssetsReady() && n === 25) {
      const size = 158, x2 = Math.round(cx - size / 2), y2 = Math.round(foot - size + 5);
      const frame = Math.floor(performance.now() / 620) % 2;
      B(c, x2 + 17, foot - 4, size - 34, 4, "#111827aa");
      c.drawImage(retroAsset("vold"), frame * 64, 0, 64, 64, x2, y2, size, size);
      return { width: size, height: size };
    }
    if (retroAssetsReady() && n !== 25) {
      const size = 144, x2 = Math.round(cx - size / 2), y2 = Math.round(foot - size + 4);
      B(c, x2 + 13, foot - 4, size - 26, 4, "#111827a0");
      c.drawImage(retroAsset("monsters"), (n - 1) % 6 * 64, Math.floor((n - 1) / 6) * 64, 64, 64, x2, y2, size, size);
      return { width: size, height: size };
    }
    const col = monsterBase[n - 1], sc = n === 25 ? 3 : 2;
    const x = Math.round(cx - 22 * sc), y = Math.round(foot - 54 * sc);
    const r2 = (u, v, w, h, color2) => F(c, x + u * sc, y + v * sc, w * sc, h * sc, color2);
    const dark = n === 25 ? "#33263e" : "#34434b", light = n === 25 ? "#e1a9bc" : "#e8d6a5";
    F(c, x - 7, foot - 2, 58 * sc, 4, "#18233199");
    if (n <= 5) {
      r2(7, 22, 28, 25, dark);
      r2(10, 18, 23, 25, col);
      r2(14, 16, 15, 6, light);
      r2(9, 25, 5, 11, light);
      r2(11, 34, 5, 4, dark);
      r2(29, 34, 5, 4, dark);
      r2(18, 40, 9, 3, "#74595a");
      if (n === 3 || n === 5) {
        r2(12, 10, 5, 12, light);
        r2(29, 9, 4, 16, light);
      }
      if (n === 2) {
        r2(6, 30, 6, 9, light);
        r2(33, 29, 5, 11, light);
      }
    } else if ([8, 9, 14, 18, 19, 20, 24].includes(n)) {
      r2(4, 23, 34, 19, dark);
      r2(8, 21, 29, 21, col);
      r2(21, 12, 16, 20, light);
      r2(33, 18, 8, 7, col);
      r2(38, 23, 5, 4, "#7b6260");
      r2(5, 39, 7, 10, dark);
      r2(27, 39, 8, 11, dark);
      r2(0, 17, 11, 9, dark);
      r2(0, 13, 8, 4, light);
      if ([18, 19, 20, 24].includes(n)) {
        r2(3, 4, 8, 22, dark);
        r2(10, 10, 8, 20, col);
        r2(21, 8, 9, 18, dark);
        r2(26, 1, 6, 18, light);
        r2(16, 2, 6, 15, col);
      } else if (n === 8) {
        r2(4, 8, 4, 23, dark);
        r2(32, 8, 4, 22, dark);
      }
    } else if ([10, 11, 12, 13, 22].includes(n)) {
      r2(9, 16, 25, 29, dark);
      r2(12, 12, 19, 30, col);
      r2(15, 8, 14, 16, light);
      r2(9, 41, 5, 12, dark);
      r2(29, 39, 5, 13, dark);
      r2(3, 27, 9, 10, col);
      r2(32, 26, 8, 11, col);
      if (n === 10 || n === 13) {
        for (let i = 0; i < 4; i++) r2(15, 19 + i * 5, 15, 2, "#f2e5c5");
      }
      if (n === 22) {
        r2(33, 2, 3, 45, "#c5b4c7");
        r2(33, 2, 8, 3, "#eee2ef");
      }
    } else {
      r2(13, 7, 18, 15, dark);
      r2(14, 10, 16, 12, col);
      r2(19, 12, 8, 4, light);
      r2(8, 25, 28, 21, dark);
      r2(10, 24, 24, 20, col);
      r2(16, 26, 13, 12, "#827c76");
      r2(18, 25, 9, 4, light);
      r2(4, 25, 9, 22, dark);
      r2(31, 25, 9, 22, dark);
      r2(12, 43, 8, 11, dark);
      r2(27, 43, 8, 11, dark);
      r2(8, 27, 5, 12, col);
      r2(31, 27, 5, 12, col);
      if (n >= 21) {
        r2(10, 2, 7, 14, dark);
        r2(29, 2, 7, 14, dark);
      }
      if (n === 25) {
        r2(1, 20, 11, 27, "#62415d");
        r2(33, 19, 10, 28, "#62415d");
        r2(9, 2, 28, 7, "#40354f");
      }
    }
    const eyes = [14, 29];
    for (const u of eyes) {
      r2(u, 22, 5, 4, "#262f44");
      r2(u + 1, 22, 3, 2, n >= 21 ? "#f7a7ad" : "#f7e4b3");
      r2(u + 1, 23, 1, 1, "#ffffff");
    }
    if (n === 25) {
      r2(0, 18, 10, 29, "#39283e");
      r2(1, 21, 7, 24, "#6a3a59");
      r2(36, 18, 9, 29, "#34263f");
      r2(38, 20, 5, 27, "#764b68");
      r2(3, 26, 8, 5, "#985675");
      r2(35, 26, 6, 5, "#a06081");
      r2(8, 12, 9, 8, "#3e334a");
      r2(27, 12, 10, 8, "#3e334a");
      r2(9, 6, 28, 18, "#30283d");
      r2(11, 8, 24, 16, "#6c5267");
      r2(15, 11, 15, 13, "#bf9288");
      r2(17, 13, 11, 8, "#d2a392");
      r2(15, 16, 4, 4, "#241b38");
      r2(27, 16, 4, 4, "#241b38");
      r2(16, 16, 3, 2, "#ffbba1");
      r2(28, 16, 3, 2, "#ffbba1");
      r2(15, 21, 16, 2, "#7b4e5a");
      r2(18, 22, 9, 2, "#d2a99a");
      r2(19, 25, 8, 2, "#4d3347");
      r2(10, 4, 26, 6, "#72526b");
      r2(10, 3, 26, 2, "#c4a073");
      r2(13, -6, 5, 13, "#b88977");
      r2(14, -7, 3, 10, "#f0cb97");
      r2(30, -7, 5, 14, "#8c5c7a");
      r2(31, -10, 3, 10, "#e1b28f");
      r2(21, -11, 5, 17, "#91657b");
      r2(22, -13, 3, 16, "#eed0a4");
      r2(13, 3, 20, 3, "#cfb18b");
      r2(21, 2, 5, 4, "#efc77e");
      r2(22, 4, 3, 3, "#9d4d70");
      r2(5, 25, 12, 9, "#4c3651");
      r2(6, 23, 11, 4, "#d1a57b");
      r2(31, 24, 11, 8, "#4c3651");
      r2(31, 23, 10, 4, "#d1a57b");
      r2(7, 31, 4, 5, "#ad7c6e");
      r2(35, 30, 4, 5, "#b58777");
      r2(14, 27, 19, 18, "#303348");
      r2(16, 29, 15, 14, "#67566d");
      r2(18, 29, 11, 3, "#c2a078");
      r2(17, 39, 14, 3, "#ad866e");
      r2(15, 45, 19, 4, "#433148");
      r2(16, 44, 17, 2, "#c2a179");
      r2(19, 33, 10, 2, "#d2b28a");
      r2(23, 29, 2, 13, "#efd8ac");
      r2(19, 34, 10, 2, "#ad5275");
      r2(21, 36, 5, 5, "#e8b28d");
      r2(22, 35, 3, 7, "#fbdfaa");
      r2(14, 47, 7, 8, "#2c263f");
      r2(27, 47, 7, 8, "#2c263f");
      r2(15, 52, 9, 3, "#6c5362");
      r2(28, 52, 8, 3, "#6c5362");
      r2(40, 8, 2, 40, "#b8b4b8");
      r2(40, 5, 2, 20, "#f2ead9");
      r2(38, 37, 7, 3, "#cca46f");
      r2(39, 39, 5, 9, "#614153");
      r2(41, 3, 1, 3, "#ffffff");
    }
    r2(12, 27, 4, 2, light);
    r2(17, 34, 2, 5, light);
    return { width: 44 * sc, height: 54 * sc };
  }

  // src/game/room-scene-art.mjs
  var F2 = (c, x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  var ROOM_THEMES = {
    library: { stone: "#5d6978", stoneHi: "#b0b9b5", stoneDeep: "#364253", floor: "#b3a58f", floorHi: "#d8ceb1", seam: "#8b806d", mat: "#465b79", matHi: "#718ca0", trim: "#e4c38f", plaster: "#899aa2" },
    tailor: { stone: "#71564d", stoneHi: "#d4b19c", stoneDeep: "#533d3c", floor: "#b28b65", floorHi: "#d9b588", seam: "#8b674a", mat: "#6c735c", matHi: "#a8b28a", trim: "#e6c79d", plaster: "#d5bba1" },
    home: { stone: "#735e4d", stoneHi: "#d8bb91", stoneDeep: "#4b3d38", floor: "#bca079", floorHi: "#e2cba1", seam: "#8e735b", mat: "#a47457", matHi: "#d5a57e", trim: "#e1c999", plaster: "#d6bd94" },
    inn: { stone: "#6f6756", stoneHi: "#dfcca2", stoneDeep: "#4d483e", floor: "#c5a27c", floorHi: "#e7cf9f", seam: "#977659", mat: "#69817f", matHi: "#a9cac0", trim: "#ebcf9e", plaster: "#d1b48b" },
    shop: { stone: "#77705d", stoneHi: "#e2cba2", stoneDeep: "#51463b", floor: "#b2a78b", floorHi: "#d2cab3", seam: "#93836e", mat: "#667781", matHi: "#a7b6b0", trim: "#e2ca94", plaster: "#b8b4a1" },
    "harbor-inn": { stone: "#5b7177", stoneHi: "#b4d2c9", stoneDeep: "#304955", floor: "#a9a78f", floorHi: "#d7c6a7", seam: "#778d84", mat: "#557b85", matHi: "#8db5b5", trim: "#dccb99", plaster: "#99b7b4" },
    "harbor-shop": { stone: "#566772", stoneHi: "#b6ccd0", stoneDeep: "#354652", floor: "#a49c8c", floorHi: "#c9c5b2", seam: "#75818a", mat: "#6d677f", matHi: "#b6a6bf", trim: "#d4c39d", plaster: "#98b0b2" }
  };
  var supportedInteriorThemes = Object.freeze(Object.keys(ROOM_THEMES));
  function paintRoomArchitecture(c, theme2) {
    const p = ROOM_THEMES[theme2];
    if (!p) throw Error("Unsupported indoor art theme: " + theme2);
    for (let y = 0; y < 10; y++) for (let x = 0; x < 12; x++) {
      const X = x * TILE, Y = y * TILE;
      const wall2 = x === 0 || x === 11 || y <= 1 || y === 9;
      if (wall2) {
        F2(c, X, Y, 24, 24, p.stoneDeep);
        F2(c, X + 1, Y + 1, 22, 20, p.stone);
        F2(c, X + 2, Y + 1, 20, 2, p.stoneHi);
        F2(c, X + 2, Y + 4, 18, 15, p.plaster);
        F2(c, X + 2, Y + 19, 20, 3, p.stone);
        if ((x + y) % 3 === 0) {
          F2(c, X + 17, Y + 9, 1, 9, p.stone);
          F2(c, X + 4, Y + 8, 11, 1, p.stoneHi);
        }
        if (y === 1 && x > 0 && x < 11) {
          F2(c, X + 1, Y + 19, 22, 4, p.stoneDeep);
          F2(c, X + 2, Y + 20, 20, 2, p.trim);
        }
      } else {
        F2(c, X, Y, 24, 24, (x + y) % 2 ? p.floor : p.floorHi);
        F2(c, X, Y + 22, 24, 2, p.seam);
        F2(c, X + 3, Y + 4, 16, 1, p.floorHi);
        if ((x * 7 + y * 11) % 4 === 0) {
          F2(c, X + 16, Y + 11, 3, 2, p.floor);
          F2(c, X + 7, Y + 18, 2, 1, p.seam);
        }
      }
    }
    const bounds = theme2 === "library" ? [4, 4, 4, 4] : theme2 === "tailor" ? [4, 5, 4, 3] : theme2 === "home" ? [4, 5, 4, 3] : theme2 === "inn" || theme2 === "harbor-inn" ? [4, 5, 4, 3] : [4, 4, 4, 4];
    const [xx, yy, ww, hh] = bounds, rx = xx * TILE, ry = yy * TILE, rw = ww * TILE, rh = hh * TILE;
    F2(c, rx - 2, ry - 2, rw + 4, rh + 4, p.stoneDeep);
    F2(c, rx, ry, rw, rh, p.trim);
    F2(c, rx + 3, ry + 3, rw - 6, rh - 6, p.mat);
    F2(c, rx + 7, ry + 7, rw - 14, rh - 14, p.matHi);
    F2(c, rx + 10, ry + 10, rw - 20, rh - 20, p.mat);
    for (let n = 0; n < 6; n++) {
      const dy = Math.round((n + 1) * (rh - 20) / 7);
      F2(c, rx + 10, ry + dy, 3, 3, p.matHi);
      F2(c, rx + rw - 13, ry + dy, 3, 3, p.matHi);
    }
    F2(c, 6 * TILE - 2, 9 * TILE, 28, 24, p.stoneDeep);
    F2(c, 6 * TILE + 1, 9 * TILE + 1, 22, 22, "#60463d");
    F2(c, 6 * TILE + 4, 9 * TILE + 3, 16, 18, "#aa8464");
    F2(c, 6 * TILE + 6, 9 * TILE + 6, 4, 12, "#caad82");
    F2(c, 6 * TILE + 17, 9 * TILE + 12, 2, 2, p.trim);
    for (const x of [2, 9]) {
      const X = x * TILE + 10;
      F2(c, X, 2 * TILE - 17, 4, 12, p.stoneDeep);
      F2(c, X - 2, 2 * TILE - 13, 8, 5, "#9a6c4f");
      F2(c, X - 1, 2 * TILE - 16, 6, 6, "#f5d597");
      F2(c, X, 2 * TILE - 17, 3, 4, "#fff0b9");
    }
    if (theme2 === "library") {
      for (const x of [4, 6, 8]) {
        F2(c, x * TILE + 6, 0, 14, 21, p.stoneDeep);
        F2(c, x * TILE + 7, 2, 12, 17, "#526c78");
        F2(c, x * TILE + 12, 4, 2, 13, p.trim);
        F2(c, x * TILE + 9, 9, 8, 2, "#d6bf93");
      }
      F2(c, 2 * TILE + 7, 2 * TILE + 9, 13, 3, "#ddc895");
    } else if (theme2 === "tailor") {
      for (const x of [4, 8]) {
        F2(c, x * TILE + 8, 0, 8, 18, "#9c684f");
        F2(c, x * TILE + 4, 6, 16, 3, p.trim);
        F2(c, x * TILE + 5, 9, 14, 9, x === 4 ? "#b47964" : "#6d8c86");
        F2(c, x * TILE + 10, 9, 4, 11, "#dfbd9b");
      }
      for (let x = 5; x <= 8; x++) F2(c, x * TILE + 8, 2 * TILE + 1, 9, 3, "#9b8570");
    } else if (theme2 === "home") {
      for (const x of [4, 7]) {
        F2(c, x * TILE + 5, 0, 15, 18, "#6b5546");
        F2(c, x * TILE + 7, 3, 11, 10, "#c09a6a");
        F2(c, x * TILE + 11, 8, 4, 3, "#718d73");
      }
    } else if (theme2 === "inn" || theme2 === "harbor-inn") {
      F2(c, 4 * TILE, 2 * TILE + 4, 4 * TILE, 6, p.stoneDeep);
      F2(c, 4 * TILE + 2, 2 * TILE + 5, 4 * TILE - 4, 2, p.trim);
      if (theme2 === "harbor-inn") {
        for (const x of [4, 5, 6, 7]) F2(c, x * TILE + 10, 1 * TILE + 12, 8, 3, "#698f94");
      }
    } else if (theme2 === "shop" || theme2 === "harbor-shop") {
      for (const x of [4, 7]) {
        F2(c, x * TILE + 8, 1 * TILE + 2, 10, 19, p.stoneDeep);
        F2(c, x * TILE + 10, 1 * TILE + 4, 6, 16, "#9d8060");
        F2(c, x * TILE + 11, 1 * TILE + 5, 4, 4, p.trim);
      }
    }
  }

  // src/game/town-life.mjs
  var R = (c, x, y, w, h, co) => {
    c.fillStyle = co;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  var hash = (x, y, z = 0) => (Math.imul(x + 23, 38609) ^ Math.imul(y + 39, 12011) ^ Math.imul(z + 71, 19531)) >>> 0;
  function paintTownLife(c, m, at2) {
    if (m.id !== "leaf" && m.id !== "sailun") return 0;
    let details = 0;
    if (m.id === "leaf") {
      for (const [y, from, to] of [[11, 2, 5], [11, 11, 14], [1, 5, 6], [1, 10, 11]]) {
        for (let x = from; x <= to; x++) {
          if (m.tiles[y]?.[x] !== 0) continue;
          const [px, py] = at2(x, y), seed = hash(x, y);
          R(c, px + 2, py + 16, 20, 2, "#527647");
          for (let j = 0; j < 3; j++) {
            const fx = px + 4 + j * 7, fy = py + 10 + (seed >> j * 3) % 5;
            R(c, fx, fy, 2, 7, "#4b7f49");
            R(c, fx - 2, fy + 2, 6, 2, "#75a05c");
            if (j % 2) {
              R(c, fx, fy - 2, 3, 3, "#e7c17f");
              R(c, fx + 1, fy - 1, 1, 1, "#ffeed0");
            }
          }
          details++;
        }
      }
      const [lx, ly] = at2(5, 2);
      R(c, lx + 6, ly + 4, 5 * 24 + 14, 2, "#80664e");
      R(c, lx + 7, ly + 6, 4, 5, "#b89d76");
      for (let i = 0; i < 5; i++) {
        const xx = lx + 16 + i * 21;
        R(c, xx, ly + 6, 13, 16, ["#a7655c", "#e8cca2", "#618b86", "#cc9c82", "#9cac79"][i]);
        R(c, xx + 1, ly + 7, 11, 2, "#e5d1ac");
        R(c, xx + 4, ly + 20, 6, 1, "#7a7164");
        details++;
      }
      const [mx, my] = at2(8, 5);
      R(c, mx + 6, my + 7, 13, 2, "#b7bc9a");
      R(c, mx + 10, my + 2, 3, 15, "#769583");
      R(c, mx + 7, my + 6, 5, 3, "#8dac8c");
      R(c, mx + 12, my + 12, 6, 3, "#6c987b");
      details++;
      return details;
    }
    for (let y = 12; y <= 13; y++) for (let x = 7; x <= 11; x++) {
      if (m.tiles[y]?.[x] !== 3) continue;
      const [px, py] = at2(x, y);
      R(c, px + 1, py + 2, 22, 4, "#776a5a");
      R(c, px + 1, py + 3, 22, 2, "#bb9974");
      R(c, px + 1, py + 10, 22, 3, "#80745f");
      R(c, px + 1, py + 15, 22, 3, "#bea47f");
      R(c, px + 2, py + 22, 20, 2, "#555f61");
      for (const xx of [4, 19]) {
        R(c, px + xx, py + 5, 2, 2, "#d2c7a7");
        R(c, px + xx, py + 18, 2, 2, "#a8abb0");
      }
      details++;
    }
    for (const [x, y] of [[2, 12], [3, 13], [15, 12], [16, 13]]) {
      if (m.tiles[y]?.[x] !== 2) continue;
      const [px, py] = at2(x, y);
      R(c, px + 4, py + 4, 17, 2, "#bdc4ab");
      for (let i = 0; i < 4; i++) {
        R(c, px + 4 + i * 5, py + 4, 1, 14, "#9baea7");
        R(c, px + 4, py + 7 + i * 3, 17, 1, "#729ca1");
      }
      R(c, px + 1, py + 18, 5, 3, "#d3aa7f");
      details++;
    }
    for (const [x, y] of [[6, 4], [12, 4], [8, 6], [10, 10]]) {
      const type = m.tiles[y]?.[x];
      if (![3, 7].includes(type)) continue;
      const [px, py] = at2(x, y);
      R(c, px + 5, py + 12, 15, 1, "#bac5b3");
      R(c, px + 8, py + 9, 2, 8, "#738b8e");
      R(c, px + 13, py + 7, 2, 8, "#cdd6c1");
      details++;
    }
    return details;
  }

  // src/game/leaf-art-v11.mjs
  var draw = (c, sheet, sx, sy, sw, sh, x, y, w, h) => {
    c.drawImage(
      retroAsset(sheet),
      sx,
      sy,
      sw,
      sh,
      Math.round(x),
      Math.round(y),
      Math.round(w),
      Math.round(h)
    );
  };
  var dot = (c, x, y, w, h, color2) => {
    c.fillStyle = color2;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  var mix = (x, y, a = 0) => (Math.imul(x + 23, 73856093) ^ Math.imul(y + 51, 19349663) ^ Math.imul(a + 3, 83492791)) >>> 0;
  var isPaved = (id) => id === 3 || id === 7 || id === 8 || id === 5;
  function leafRoadMask(map, wx, wy) {
    const at2 = (x, y) => map.tiles[y]?.[x];
    return (isPaved(at2(wx, wy - 1)) ? 0 : 1) | (isPaved(at2(wx + 1, wy)) ? 0 : 2) | (isPaved(at2(wx, wy + 1)) ? 0 : 4) | (isPaved(at2(wx - 1, wy)) ? 0 : 8);
  }
  function paintLeafGround(c, id, x, y, wx, wy, map) {
    if (map.id !== "leaf") throw Error("CC0 village ground used outside Leaf");
    const gx = (wx % 3 + 3) % 3, gy = (wy % 3 + 3) % 3;
    draw(c, "townCalmGrass", gx * 16, gy * 16, 16, 16, x, y, TILE, TILE);
    if (id === 1) {
      if (wx === 0 || wy === 0 || wx === map.width - 1 || wy === map.height - 1) {
        draw(c, "townSheet", 0, 0, 16, 16, x, y, TILE, TILE);
      }
      return;
    }
    if (id === 3 || id === 7 || id === 8 || id === 5) {
      const edgeMask = leafRoadMask(map, wx, wy);
      draw(c, "townRoad", edgeMask * 16, 0, 16, 16, x, y, TILE, TILE);
      return;
    }
    if (id !== 0 && id !== 4) throw Error("Unsupported Leaf world tile " + id);
  }
  function paintLeafTree(c, x, y, wx, wy) {
    const v = mix(wx, wy) % 3;
    const options = [
      [75, 46, 23, 88],
      [96, 45, 22, 90],
      [118, 49, 21, 86]
    ];
    const [sx, sy, sw, sh] = options[v];
    const height = v === 1 ? 113 : 105;
    const width = Math.round(sw / sh * height);
    draw(
      c,
      "townSheet",
      sx,
      sy,
      sw,
      sh,
      x + (TILE - width) / 2,
      y + TILE - height + 2,
      width,
      height
    );
  }
  function paintLeafBuilding(c, b, at2) {
    const variants = {
      "leaf-inn": 0,
      "leaf-shop": 1,
      "leaf-west-home": 2,
      "leaf-east-home": 3
    };
    const variant = variants[b.id];
    if (variant === void 0) throw Error("Leaf building has no approved source facade: " + b.id);
    const [x, y] = at2(b.x, b.y);
    const width = b.w * TILE + (b.kind === "home" ? 3 : 5);
    const height = Math.round(width * 101 / 99);
    const left = x + Math.round((b.w * TILE - width) / 2) - (b.id === "leaf-inn" ? 9 : 0);
    const bottom = y + b.h * TILE + 3;
    draw(c, "townHouses", variant * 99, 0, 99, 101, left, bottom - height, width, height);
    dot(c, left + 4, bottom - 2, width - 8, 2, "#384b3b66");
  }

  // src/game/retro-decoration.mjs
  var color = {
    field: ["#e6d7a0", "#f3e8bb", "#91b771", "#5b824e"],
    leaf: ["#f4ddb1", "#edb38e", "#85bd7b", "#496a4d"],
    sailun: ["#d9d7ca", "#a6c9c5", "#7f9892", "#4b6a6c"],
    cave: ["#a5a3a9", "#b3a387", "#6e6377", "#49435b"],
    ruins: ["#a8c6ad", "#c5d3a4", "#66998c", "#415d66"],
    onyx: ["#c7a5bc", "#e0b0b0", "#8c6489", "#4a3658"],
    castle: ["#e5c79e", "#f9e5ad", "#bc9f70", "#796264"]
  };
  var rand = (x, y, z = 0) => (Math.imul(x + 37, 73471) ^ Math.imul(y + 83, 67373) ^ Math.imul(z + 19, 27919)) >>> 0;
  var rect2 = (c, x, y, w, h, co) => {
    c.fillStyle = co;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  var cell = (m, x, y) => m.tiles[y]?.[x];
  function plant(c, x, y, mapId, k) {
    const p = color[mapId], x1 = x + 8, y1 = y + 13;
    rect2(c, x1, y1, 1, 8, p[3]);
    rect2(c, x1 - 4, y1 + 3, 5, 2, p[2]);
    rect2(c, x1 + 2, y1 + 1, 5, 2, p[2]);
    if (k % 3 === 0) {
      rect2(c, x1 - 2, y1 - 3, 5, 4, p[0]);
      rect2(c, x1, y1 - 1, 2, 2, "#fff1e3");
    } else if (k % 3 === 1) {
      rect2(c, x1 - 3, y1 - 2, 6, 4, p[1]);
      rect2(c, x1 - 2, y1 - 3, 2, 2, p[0]);
    } else {
      rect2(c, x1 - 2, y1 + 1, 6, 3, p[2]);
      rect2(c, x1 + 1, y1 - 1, 2, 5, p[2]);
    }
  }
  function torch(c, x, y, mapId, k) {
    const p = color[mapId];
    rect2(c, x + 10, y + 4, 4, 19, "#41383e");
    rect2(c, x + 11, y + 5, 2, 14, "#b69a70");
    rect2(c, x + 8, y, 8, 8, k % 2 ? "#e6b371" : "#f3d69c");
    rect2(c, x + 10, y + 2, 4, 4, "#fff4c4");
    rect2(c, x + 7, y + 13, 10, 3, "#493d47");
  }
  function crystals(c, x, y, mapId, k) {
    const p = color[mapId], tone = mapId === "onyx" ? "#b67cb7" : "#88bbbd";
    rect2(c, x + 4, y + 10, 7, 13, "#4e5369");
    rect2(c, x + 5, y + 4, 5, 17, tone);
    rect2(c, x + 6, y + 3, 2, 5, "#e0e9d4");
    rect2(c, x + 12, y + 12, 8, 11, "#506176");
    rect2(c, x + 14, y + 6, 4, 14, "#9cbed0");
    rect2(c, x + 16, y + 6, 1, 10, "#e1eeef");
    if (k % 3 === 0) rect2(c, x + 1, y + 20, 17, 3, "#2d354a");
  }
  function flag(c, x, y, mapId) {
    rect2(c, x + 8, y - 15, 2, 33, "#cbb082");
    rect2(c, x + 10, y - 14, 13, 21, "#823e54");
    rect2(c, x + 11, y - 12, 10, 1, "#f0ba83");
    rect2(c, x + 14, y - 8, 4, 7, "#d8ad68");
    rect2(c, x + 15, y - 8, 2, 7, "#fff0b8");
    rect2(c, x + 10, y + 4, 13, 3, "#5b314e");
  }
  function crack(c, x, y, mapId, k) {
    const p = color[mapId];
    rect2(c, x + 5, y + 9, 8, 1, p[3]);
    rect2(c, x + 12, y + 9, 2, 6, p[3]);
    rect2(c, x + 14, y + 14, 5, 1, p[3]);
    rect2(c, x + 15, y + 15, 1, 4, p[3]);
    if (k % 4 === 0) rect2(c, x + 8, y + 16, 3, 1, p[2]);
  }
  function stonyArch(c, x, y, mapId, k) {
    const p = color[mapId];
    rect2(c, x + 3, y - 8, 18, 31, "#253044");
    rect2(c, x + 3, y - 8, 19, 4, p[0]);
    rect2(c, x + 3, y - 4, 4, 24, p[3]);
    rect2(c, x + 17, y - 4, 4, 24, p[3]);
    rect2(c, x + 5, y - 3, 3, 20, p[2]);
    rect2(c, x + 17, y - 3, 3, 20, p[2]);
    rect2(c, x + 8, y + 8, 8, 11, p[3]);
    rect2(c, x + 8, y + 8, 8, 1, p[0]);
    if (k % 2 === 0) rect2(c, x + 10, y - 4, 5, 3, p[1]);
  }
  function anchorPost(c, x, y) {
    rect2(c, x + 8, y + 7, 8, 17, "#584b41");
    rect2(c, x + 9, y + 6, 5, 17, "#997b60");
    rect2(c, x + 5, y + 5, 15, 5, "#b29a74");
    rect2(c, x + 7, y + 13, 11, 3, "#d7b17e");
    rect2(c, x + 14, y + 14, 3, 8, "#7a6556");
  }
  function paintRegionAtmosphere(c, m, toPixel) {
    const mapId = m.id;
    if (!color[mapId]) throw Error("Missing region palette " + mapId);
    if (!retroAssetsReady()) throw Error("Required CC0 art not ready for region");
    for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
      const tile = cell(m, x, y), h = rand(x, y, mapId.length);
      const [px, py] = toPixel(x, y);
      if (["field", "leaf"].includes(mapId)) {
        if (tile === 0 && h % 13 === 1) plant(c, px, py, mapId, h);
        if (tile === 0 && h % 19 === 0) {
          rect2(c, px + 4, py + 16, 8, 4, "#3e7344");
          rect2(c, px + 6, py + 13, 7, 3, "#679d57");
          rect2(c, px + 8, py + 12, 2, 1, "#a1c983");
        }
        continue;
      }
      if (mapId === "sailun") {
        if (tile === 2 && h % 3 === 0) {
          rect2(c, px + 3, py + 8, 8, 1, "#86c6d2");
          rect2(c, px + 14, py + 17, 7, 1, "#b4dcdc");
        }
        const bottomWater = cell(m, x, y + 1) === 2;
        if ([3, 7].includes(tile) && bottomWater && x % 4 === 0) {
          anchorPost(c, px, py);
          rect2(c, px + 5, py + 20, 16, 3, "#715a4d");
        }
        if ([3, 7].includes(tile) && h % 31 === 0) {
          rect2(c, px + 8, py + 7, 9, 2, "#d0b99c");
          rect2(c, px + 10, py + 10, 2, 2, "#9b846e");
        }
        continue;
      }
      if (mapId === "castle") {
        if (tile === 1 && x > 2 && x < m.width - 3 && y === 3 && x % 3 === 1) {
          rect2(c, px + 5, py - 13, 15, 31, "#313c52");
          rect2(c, px + 7, py - 11, 11, 23, "#567e94");
          rect2(c, px + 11, py - 13, 3, 27, "#ddcb91");
          rect2(c, px + 8, py - 5, 8, 2, "#e6b87a");
        }
        if (tile === 7 && h % 29 === 0) {
          rect2(c, px + 4, py + 7, 11, 1, "#d3bd99");
          rect2(c, px + 8, py + 11, 1, 8, "#d0b08a");
        }
        continue;
      }
      if (mapId === "cave") {
        if (tile === 9 && h % 23 === 0) crack(c, px, py, mapId, h);
        if (tile === 10 && h % 19 === 0) crystals(c, px, py, mapId, h);
        if (tile === 10 && h % 31 === 0) torch(c, px, py, mapId, h);
        continue;
      }
      if (mapId === "ruins") {
        if (tile === 9 && h % 13 === 0) crack(c, px, py, mapId, h);
        if (tile === 10 && h % 17 === 0) stonyArch(c, px, py, mapId, h);
        if (tile === 10 && h % 29 === 0) {
          rect2(c, px + 5, py + 3, 11, 17, "#52756d");
          rect2(c, px + 7, py + 4, 6, 5, "#a2bf98");
          rect2(c, px + 12, py + 11, 2, 8, "#6eac8b");
        }
        continue;
      }
      if (mapId === "onyx") {
        if (tile === 10 && h % 13 === 1) stonyArch(c, px, py, mapId, h);
        if (tile === 10 && h % 19 === 2) torch(c, px, py, mapId, h);
        if (tile === 9 && h % 29 === 0) crack(c, px, py, mapId, h);
        if (tile === 10 && h % 37 === 0) crystals(c, px, py, mapId, h);
        if (tile === 9 && h % 41 === 0) {
          rect2(c, px + 6, py + 9, 13, 1, "#a36f9f");
          rect2(c, px + 12, py + 3, 2, 16, "#725180");
        }
      }
    }
    if (mapId === "castle") {
      for (const xx of [3, 11]) for (const yy of [3, 8]) {
        const [px, py] = toPixel(xx, yy);
        if (cell(m, xx, yy) === 1) flag(c, px, py, mapId);
      }
    }
  }

  // src/game/regional-structures.mjs
  var F3 = (c, x, y, w, h, k) => {
    c.fillStyle = k;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  var hash2 = (x, y, s = 0) => (Math.imul(x + 17, 11939) ^ Math.imul(y + 71, 81527) ^ Math.imul(s + 19, 32971)) >>> 0;
  var at = (m, x, y) => m.tiles[y]?.[x];
  function wornCarving(c, x, y, variant) {
    F3(c, x + 3, y + 3, 18, 19, "#3d616e");
    F3(c, x + 5, y + 4, 14, 15, "#6c908a");
    F3(c, x + 7, y + 5, 9, 1, "#bed0b6");
    F3(c, x + 11, y + 7, 2, 10, "#344e5c");
    F3(c, x + 8, y + 10, 8, 2, "#3e5a61");
    if (variant % 3 === 0) {
      F3(c, x + 3, y + 16, 6, 3, "#415d5e");
      F3(c, x + 13, y + 5, 4, 5, "#718e80");
    } else {
      F3(c, x + 6, y + 12, 3, 5, "#8bac93");
      F3(c, x + 17, y + 14, 2, 5, "#40565b");
    }
    F3(c, x + 4, y + 22, 16, 2, "#253f4f");
  }
  function mossyColumn(c, x, y, variant) {
    F3(c, x + 2, y - 8, 20, 31, "#243746");
    F3(c, x + 3, y - 9, 18, 4, "#b8bd9e");
    F3(c, x + 5, y - 5, 14, 21, "#738c83");
    F3(c, x + 7, y - 4, 3, 17, "#b5c5ad");
    F3(c, x + 4, y + 15, 17, 4, "#465f66");
    F3(c, x + 2, y + 19, 21, 4, "#9aa99a");
    F3(c, x + 5, y + 19, 8, 1, "#d5d9b6");
    if (variant % 2) {
      F3(c, x + 16, y - 7, 3, 6, "#526957");
      F3(c, x + 17, y - 2, 2, 5, "#648868");
      F3(c, x + 15, y + 3, 3, 2, "#8cba83");
    } else {
      F3(c, x + 6, y - 8, 5, 2, "#425d65");
      F3(c, x + 9, y + 5, 2, 11, "#495f5c");
    }
  }
  function crystalWall(c, x, y, s, glow) {
    const crystal = glow ? ["#4e4264", "#946b9b", "#c6a4b3", "#ffe1be"] : ["#2d5361", "#5a94a0", "#9bbfbc", "#dcf1d9"];
    F3(c, x + 4, y + 8, 4, 15, crystal[0]);
    F3(c, x + 5, y + 4, 5, 17, crystal[1]);
    F3(c, x + 7, y + 1, 2, 13, crystal[3]);
    F3(c, x + 12, y + 11, 7, 12, crystal[0]);
    F3(c, x + 14, y + 7, 5, 15, crystal[2]);
    F3(c, x + 16, y + 7, 1, 11, crystal[3]);
    if (s % 2 === 0) {
      F3(c, x + 1, y + 16, 4, 7, crystal[1]);
      F3(c, x + 3, y + 13, 1, 7, crystal[3]);
    }
  }
  function caveLedge(c, x, y, variant) {
    F3(c, x, y + 14, 24, 10, "#222733");
    F3(c, x, y + 14, 24, 2, "#81727d");
    F3(c, x + 1, y + 16, 21, 2, "#685d6b");
    for (let a = 0; a < 3; a++) {
      const xx = 3 + (variant >>> a * 4) % 17, len = 3 + (variant >>> (a + 1) * 3) % 8;
      F3(c, x + xx, y + 18, 2, len, "#3e3849");
      F3(c, x + xx + 1, y + 18, 1, Math.max(2, len - 1), "#837482");
    }
  }
  function ruinInlay(c, x, y, variant) {
    F3(c, x + 3, y + 4, 18, 1, "#9cac96");
    F3(c, x + 7, y + 5, 1, 10, "#527b77");
    F3(c, x + 8, y + 13, 9, 1, "#8fab95");
    F3(c, x + 15, y + 12, 1, 7, "#4c7074");
    F3(c, x + 10, y + 17, 7, 2, "#799891");
    if (variant % 5 === 0) F3(c, x + 12, y + 8, 3, 3, "#b4c4a2");
    if (variant % 7 === 0) {
      F3(c, x + 9, y + 9, 2, 1, "#d3dfb7");
      F3(c, x + 13, y + 10, 1, 2, "#b7e1cc");
    }
  }
  function onyxObelisk(c, x, y, variant) {
    F3(c, x + 4, y - 13, 16, 37, "#1f2033");
    F3(c, x + 5, y - 13, 14, 5, "#77647d");
    F3(c, x + 7, y - 18, 10, 6, "#554860");
    F3(c, x + 10, y - 21, 4, 4, "#9a6b94");
    F3(c, x + 6, y - 6, 12, 21, "#55475d");
    F3(c, x + 9, y - 4, 5, 15, "#2b2c47");
    F3(c, x + 10, y + 1, 3, 8, "#aa799a");
    F3(c, x + 12, y - 3, 1, 13, "#dd9dae");
    F3(c, x + 3, y + 13, 18, 5, "#312a43");
    F3(c, x + 2, y + 19, 20, 4, "#786480");
    if (variant % 3 === 0) F3(c, x + 5, y + 11, 3, 2, "#a08097");
  }
  function fissure(c, x, y, variant) {
    F3(c, x + 2, y + 4, 10, 2, "#3b2a48");
    F3(c, x + 10, y + 6, 3, 6, "#392e4c");
    F3(c, x + 12, y + 12, 9, 2, "#5b3855");
    F3(c, x + 16, y + 13, 3, 2, "#a9687b");
    F3(c, x + 18, y + 14, 2, 1, "#e0a18b");
    if (variant % 3 === 0) {
      F3(c, x + 6, y + 3, 3, 1, "#cb7e93");
      F3(c, x + 13, y + 10, 1, 4, "#d9a4a7");
    }
  }
  function tideStones(c, x, y, variant) {
    F3(c, x + 4, y + 15, 7, 3, "#e2d9c2");
    F3(c, x + 13, y + 11, 9, 3, "#779caa");
    F3(c, x + 15, y + 8, 4, 2, "#e4d8bc");
    if (variant % 3 === 0) {
      F3(c, x + 2, y + 6, 10, 2, "#527d96");
      F3(c, x + 3, y + 6, 5, 1, "#b6e7dc");
    }
  }
  function wildPlants(c, x, y, variant) {
    F3(c, x + 4, y + 16, 11, 3, "#3f7850");
    F3(c, x + 7, y + 12, 2, 8, "#64995f");
    F3(c, x + 10, y + 10, 2, 8, "#4b8958");
    F3(c, x + 7, y + 9, 3, 4, variant % 4 === 0 ? "#e9df9c" : "#83b66e");
    F3(c, x + 11, y + 13, 2, 4, "#a7ca80");
    if (variant % 8 === 0) {
      F3(c, x + 8, y + 8, 2, 2, "#efbb94");
      F3(c, x + 10, y + 11, 3, 2, "#e8dcac");
    }
  }
  function paintRegionalStructures(c, m, screen) {
    const id = m.id;
    for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
      const kind = at(m, x, y), v = hash2(x, y, id.length);
      const [sx, sy] = screen(x, y);
      if (id === "ruins") {
        if (kind === 10) {
          const border = at(m, x, y + 1) === 9;
          if (border && (x + 2 * y) % 5 === 0) mossyColumn(c, sx, sy, v);
          else if (v % 12 === 0) wornCarving(c, sx, sy, v);
          if (border && v % 7 === 0) {
            F3(c, sx + 3, sy + 20, 18, 3, "#4b6a64");
            F3(c, sx + 7, sy + 18, 6, 2, "#83ac85");
          }
        } else if (kind === 9 && v % 7 === 1) ruinInlay(c, sx, sy, v);
        continue;
      }
      if (id === "cave") {
        if (kind === 10) {
          if (at(m, x, y + 1) === 9 && v % 3 === 0) caveLedge(c, sx, sy, v);
          if (v % 9 === 1) crystalWall(c, sx, sy, v, false);
        }
        if (kind === 9 && v % 23 === 3) {
          F3(c, sx + 6, sy + 16, 12, 4, "#393b4b");
          F3(c, sx + 9, sy + 15, 7, 1, "#847586");
        }
        continue;
      }
      if (id === "onyx") {
        if (kind === 10) {
          if (at(m, x, y + 1) === 9 && v % 5 === 0) onyxObelisk(c, sx, sy, v);
          else if (v % 11 === 4) crystalWall(c, sx, sy, v, true);
        }
        if (kind === 9 && v % 9 === 2) fissure(c, sx, sy, v);
        continue;
      }
      if (id === "sailun") {
        if (kind === 2 && v % 5 === 2) tideStones(c, sx, sy, v);
        continue;
      }
      if (id === "field" || id === "leaf") {
        if (kind === 0 && v % 15 === 5) wildPlants(c, sx, sy, v);
      }
    }
  }
  function paintRegionalLighting(c, mapId, width, height, heroX, heroY) {
    if (!["cave", "ruins", "onyx"].includes(mapId)) return;
    const theme2 = {
      cave: { shade: "17,18,30", amount: 0.39 },
      ruins: { shade: "19,36,40", amount: 0.18 },
      onyx: { shade: "20,12,34", amount: 0.32 }
    }[mapId];
    const centerX = heroX + 12, centerY = heroY + 12;
    const inner = Math.min(width, height) * 0.18, outer = Math.max(width, height) * 0.79;
    const g = c.createRadialGradient(centerX, centerY, inner, centerX, centerY, outer);
    g.addColorStop(0, "rgba(" + theme2.shade + ",0)");
    g.addColorStop(0.5, "rgba(" + theme2.shade + "," + (theme2.amount * 0.2).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + theme2.shade + "," + theme2.amount + ")");
    c.fillStyle = g;
    c.fillRect(0, 0, width, height);
  }

  // src/game/portal-landmarks.mjs
  var r = (c, x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  function castle(c, x, y) {
    const gray = "#596877", grayHi = "#bec0af", dark = "#2f4355", gold = "#e3c18b";
    r(c, x - 26, y + 10, 76, 13, "#34453c");
    r(c, x - 23, y - 14, 24, 34, dark);
    r(c, x - 21, y - 12, 20, 31, gray);
    r(c, x + 24, y - 14, 24, 34, dark);
    r(c, x + 26, y - 12, 20, 31, gray);
    for (const sx of [-23, -15, -7, 24, 32, 40]) {
      r(c, x + sx, y - 22, 6, 9, gray);
      r(c, x + sx + 1, y - 21, 4, 2, grayHi);
    }
    for (const sx of [-20, 27]) {
      r(c, x + sx, y - 5, 16, 2, grayHi);
      r(c, x + sx, y + 8, 16, 2, grayHi);
      r(c, x + sx + 7, y + 11, 2, 8, "#394d5d");
    }
    r(c, x - 3, y - 25, 31, 10, dark);
    r(c, x - 1, y - 23, 27, 5, gray);
    r(c, x + 7, y - 22, 11, 3, grayHi);
    r(c, x + 1, y - 15, 24, 34, "#253345");
    r(c, x + 4, y - 12, 18, 31, "#4f3943");
    r(c, x + 7, y - 9, 13, 26, "#67454a");
    r(c, x + 8, y - 9, 4, 26, "#a06b59");
    r(c, x + 18, y + 4, 2, 3, gold);
    r(c, x + 1, y - 16, 23, 3, gold);
    r(c, x - 17, y - 10, 5, 13, "#854a50");
    r(c, x - 16, y - 10, 1, 12, gold);
    r(c, x + 36, y - 10, 5, 13, "#854a50");
    r(c, x + 37, y - 10, 1, 12, gold);
    r(c, x + 4, y + 16, 17, 3, "#bca584");
  }
  function village(c, x, y) {
    const dark = "#554b3f", wood = "#906446", woodHi = "#d8b187", roof = "#a06749";
    r(c, x - 18, y + 14, 64, 7, "#486847");
    r(c, x - 17, y - 11, 12, 29, dark);
    r(c, x - 15, y - 9, 8, 26, wood);
    r(c, x + 33, y - 11, 12, 29, dark);
    r(c, x + 35, y - 9, 8, 26, wood);
    r(c, x - 20, y - 18, 68, 9, roof);
    r(c, x - 15, y - 23, 58, 6, wood);
    r(c, x - 9, y - 27, 46, 6, roof);
    r(c, x - 2, y - 30, 32, 5, "#bc8555");
    for (let i = -8; i < 36; i += 11) {
      r(c, x + i, y - 21, 8, 2, woodHi);
      r(c, x + i + 3, y - 17, 7, 2, "#68493a");
    }
    r(c, x - 5, y - 7, 34, 10, dark);
    r(c, x - 3, y - 5, 30, 7, woodHi);
    r(c, x + 3, y - 2, 18, 2, "#70503d");
    r(c, x + 11, y - 5, 3, 7, "#b17647");
    for (const sx of [-13, 37]) {
      r(c, x + sx, y + 8, 4, 8, woodHi);
      r(c, x + sx - 2, y + 13, 7, 3, dark);
    }
  }
  function cave(c, x, y) {
    const outline = "#353d48", rock2 = "#77747b", hi = "#a7a0a0", deep = "#252b3b";
    r(c, x - 23, y + 12, 72, 12, "#5b6465");
    const boulders = [[-23, -7, 17, 29], [-12, -26, 24, 46], [8, -35, 27, 55], [32, -15, 18, 36]];
    for (const [px, py, w, h] of boulders) {
      r(c, x + px, y + py, w, h, outline);
      r(c, x + px + 2, y + py + 2, w - 5, h - 4, rock2);
      r(c, x + px + 3, y + py + 3, w - 11, 3, hi);
      r(c, x + px + 7, y + py + 9, 3, 7, outline);
    }
    r(c, x - 3, y - 15, 32, 35, deep);
    r(c, x, y - 18, 26, 7, outline);
    r(c, x + 3, y - 22, 20, 7, rock2);
    r(c, x + 6, y - 23, 14, 3, hi);
    r(c, x + 1, y - 4, 2, 21, hi);
    r(c, x + 24, y - 4, 2, 21, "#4b4955");
    for (const sx of [7, 14, 20]) {
      r(c, x + sx, y - 14, 2, 7, "#7f8290");
      r(c, x + sx + 1, y - 11, 1, 6, hi);
    }
    for (const [sx, sy] of [[-17, 12], [-10, 17], [34, 13]]) {
      r(c, x + sx, y + sy, 5, 9, "#3b6475");
      r(c, x + sx + 1, y + sy - 4, 3, 12, "#7bb7ae");
      r(c, x + sx + 2, y + sy - 4, 1, 8, "#d0e2cb");
    }
  }
  function harbor(c, x, y) {
    const navy = "#3b5868", sky = "#82b0b4", stone2 = "#b9bba8", gold = "#e5c78f";
    r(c, x - 23, y + 16, 73, 6, "#5b7a81");
    r(c, x - 19, y - 18, 14, 37, navy);
    r(c, x - 16, y - 16, 9, 33, stone2);
    r(c, x + 31, y - 18, 14, 37, navy);
    r(c, x + 33, y - 16, 9, 33, stone2);
    r(c, x - 21, y - 23, 66, 8, navy);
    r(c, x - 18, y - 21, 60, 4, sky);
    for (const sx of [-14, 34]) {
      r(c, x + sx, y - 10, 5, 3, "#f0edce");
      r(c, x + sx + 1, y - 9, 3, 12, "#487b91");
    }
    r(c, x + 2, y - 30, 21, 10, navy);
    r(c, x + 4, y - 28, 17, 5, "#decaa9");
    r(c, x + 9, y - 27, 8, 2, gold);
    r(c, x - 3, y - 15, 30, 28, "#24435c");
    r(c, x, y - 13, 24, 28, "#4b7883");
    r(c, x + 2, y - 11, 20, 25, "#1c3646");
    r(c, x + 5, y + 3, 14, 2, sky);
    r(c, x + 8, y + 10, 8, 1, gold);
    r(c, x - 22, y + 16, 18, 3, navy);
    r(c, x - 19, y + 16, 13, 1, gold);
    r(c, x + 30, y + 16, 18, 3, navy);
    r(c, x + 33, y + 16, 12, 1, gold);
    r(c, x + 10, y - 27, 2, 4, "#345a71");
    r(c, x + 14, y - 27, 2, 4, "#345a71");
    r(c, x + 11, y - 24, 5, 1, "#638f9a");
  }
  function onyx(c, x, y) {
    const black = "#201d32", purple = "#57425b", metal = "#9e7c9c", glow = "#dda0b9";
    r(c, x - 26, y + 14, 75, 10, "#3b2d45");
    r(c, x - 24, y - 16, 22, 36, black);
    r(c, x - 22, y - 29, 18, 15, purple);
    r(c, x - 19, y - 38, 12, 11, black);
    r(c, x - 16, y - 44, 6, 9, metal);
    r(c, x + 27, y - 16, 22, 36, black);
    r(c, x + 29, y - 29, 18, 15, purple);
    r(c, x + 32, y - 38, 12, 11, black);
    r(c, x + 35, y - 44, 6, 9, metal);
    for (const xx of [-17, 31]) {
      r(c, x + xx, y - 23, 10, 3, metal);
      r(c, x + xx + 2, y - 20, 6, 27, purple);
      r(c, x + xx + 4, y - 11, 2, 17, glow);
    }
    r(c, x - 5, y - 23, 37, 41, black);
    r(c, x - 1, y - 27, 29, 10, purple);
    r(c, x + 3, y - 29, 21, 5, metal);
    r(c, x + 2, y - 18, 24, 36, "#392b44");
    r(c, x + 5, y - 15, 18, 33, "#574056");
    r(c, x + 10, y - 12, 8, 27, "#211c32");
    r(c, x + 12, y - 16, 3, 30, "#a16b94");
    r(c, x + 13, y - 8, 1, 19, glow);
    r(c, x + 7, y + 11, 14, 3, "#c192a7");
    r(c, x + 7, y + 15, 14, 3, purple);
  }
  function paintWorldPortal(c, portal, screen) {
    const [x, y] = screen(portal.x, portal.y);
    switch (portal.to) {
      case "castle":
        castle(c, x, y);
        break;
      case "leaf":
        village(c, x, y);
        break;
      case "cave":
        cave(c, x, y);
        break;
      case "sailun":
        harbor(c, x, y);
        break;
      case "onyx":
        onyx(c, x, y);
        break;
      default:
        throw Error("No authored world landmark for portal to " + portal.to);
    }
  }

  // src/game/reboot-view.mjs
  var clamp3 = (v, a, b) => Math.max(a, Math.min(b, v));
  var backgrounds = /* @__PURE__ */ new Map();
  var actors = { hero: "hero", king: "king", guard: "guard", refugee: "refugee" };
  var shot = (context, x, y, w, h, color2) => {
    context.fillStyle = color2;
    context.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  function makeCanvas(w, h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d", { alpha: false });
    c.imageSmoothingEnabled = false;
    return { canvas, c };
  }
  function backgroundFor(m, s) {
    const id = m.id + (s.flags.gateOpen ? "-open" : "-closed");
    if (backgrounds.has(id)) return backgrounds.get(id);
    const { canvas, c } = makeCanvas(m.width * TILE, m.height * TILE);
    const kindAt = (x, y) => {
      const kind = m.tiles[y]?.[x];
      return kind === 6 && s.flags.gateOpen ? 3 : kind;
    };
    for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
      const kind = kindAt(x, y);
      if (m.id === "leaf") paintLeafGround(c, kind, x * TILE, y * TILE, x, y, m);
      else paintTile(c, kind, x * TILE, y * TILE, x, y, m.id, {
        n: kindAt(x, y - 1),
        s: kindAt(x, y + 1),
        w: kindAt(x - 1, y),
        e: kindAt(x + 1, y)
      });
    }
    const at2 = (x, y) => [x * TILE, y * TILE];
    if (m.id !== "leaf") {
      paintRegionAtmosphere(c, m, at2);
      paintRegionalStructures(c, m, at2);
      paintTownLife(c, m, at2);
    }
    for (const feature of m.scenery || []) paintScenery(c, feature, at2, m.id);
    backgrounds.set(id, canvas);
    return canvas;
  }
  function retroCamera(s, motion = null, now = performance.now(), W2 = 288, H2 = 340) {
    const m = MAPS[s.pos.map];
    const t = motion && motion.map === s.pos.map ? clamp3((now - motion.start) / motion.duration, 0, 1) : 1;
    const px = motion && motion.map === s.pos.map ? motion.fromX + (s.pos.x - motion.fromX) * t : s.pos.x;
    const py = motion && motion.map === s.pos.map ? motion.fromY + (s.pos.y - motion.fromY) * t : s.pos.y;
    const cols = W2 / TILE, rows = H2 / TILE;
    const ox = m.width <= cols ? Math.round((W2 - m.width * TILE) / 2) : 0;
    const oy = m.height <= rows ? Math.round((H2 - m.height * TILE) / 2) : 0;
    const cx = m.width <= cols ? 0 : clamp3(px - cols / 2 + 0.5, 0, m.width - cols);
    const cy = m.height <= rows ? 0 : clamp3(py - rows / 2 + 0.5, 0, m.height - rows);
    return { px, py, t, ox, oy, cx, cy, cols, rows };
  }
  function label(c, W2, H2, main, st) {
    const left = Math.round(Math.max(6, (W2 - main.length * 13) / 2));
    if (main) {
      shot(c, 6, 6, Math.min(W2 - 12, main.length * 14 + 16), 23, "#0a1426ec");
      c.strokeStyle = "#e4d8b7";
      c.lineWidth = 1;
      c.strokeRect(7.5, 7.5, Math.min(W2 - 15, main.length * 14 + 13), 20);
      c.fillStyle = "#f6edd5";
      c.font = "bold 12px sans-serif";
      c.textBaseline = "middle";
      c.textAlign = "left";
      c.fillText(main, 14, 18);
    }
    const status = "HP " + st.hp + "  MP " + st.mp;
    const maxWidth = W2 - 12;
    shot(c, 0, H2 - 27, W2, 27, "#09111ee8");
    shot(c, 0, H2 - 27, W2, 1, "#c9bd9f");
    c.font = "bold 12px monospace";
    c.fillStyle = "#fff0d1";
    c.fillText(status, 9, H2 - 12);
    c.textAlign = "right";
    c.fillText("Lv." + st.level + "  " + st.gold + "G", maxWidth, H2 - 12);
    c.textAlign = "left";
  }
  function addMapActors(s, m, light) {
    const drawables = [];
    for (const n of m.npcs) {
      drawables.push({ x: n.x, y: n.y, depth: n.y, draw: (c, screen) => paintActor(c, ...screen(n.x, n.y), actors[n.kind] || n.kind, "down", 0) });
    }
    for (const obj of m.objects) {
      if (!entityAt(s, m, obj.x, obj.y)) continue;
      drawables.push({ x: obj.x, y: obj.y, depth: obj.y, draw: (c, screen) => paintObject(c, obj, screen, s) });
    }
    return drawables;
  }
  function drawWorld(canvas, s, light = 0, motion = null) {
    const W2 = canvas.width, H2 = canvas.height;
    const c = canvas.getContext("2d", { alpha: false });
    c.imageSmoothingEnabled = false;
    const m = MAPS[s.pos.map], v = retroCamera(s, motion, performance.now(), W2, H2);
    const bg = backgroundFor(m, s);
    shot(c, 0, 0, W2, H2, m.id === "field" ? "#294a42" : "#182238");
    const dx = Math.round(v.ox - v.cx * TILE), dy = Math.round(v.oy - v.cy * TILE);
    c.drawImage(bg, dx, dy);
    const screen = (x, y) => [Math.round(x * TILE + dx), Math.round(y * TILE + dy)];
    const drawables = addMapActors(s, m, light);
    for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
      if (m.tiles[y][x] !== 4) continue;
      const tx = x, ty = y;
      drawables.push({
        x: tx,
        y: ty,
        depth: ty + 0.85,
        draw: (ctx, screenFn) => {
          const [sx, sy] = screenFn(tx, ty);
          if (m.id === "leaf") paintLeafTree(ctx, sx, sy, tx, ty);
          else paintTreeCanopy(ctx, sx, sy, tx, ty, m.id);
        }
      });
    }
    for (const b of m.buildings || []) {
      drawables.push({
        x: b.x,
        y: b.y,
        depth: b.y + b.h - 0.15,
        draw: (ctx, screenFn) => {
          if (m.id === "leaf") paintLeafBuilding(ctx, b, screenFn);
          else paintBuilding(ctx, b, screenFn, m.id);
        }
      });
    }
    if (m.id === "field") for (const portal of m.portals) {
      drawables.push({
        x: portal.x,
        y: portal.y,
        depth: portal.y + 0.85,
        draw: (ctx, screenFn) => paintWorldPortal(ctx, portal, screenFn)
      });
    }
    drawables.push({ x: v.px, y: v.py, depth: v.py + 0.12, draw: (ctx, screenFn) => {
      const [x, y] = screenFn(v.px, v.py);
      const f = motion && v.t < 1 ? heroGaitFrame(motion, v.t) : 0;
      paintSharedHero(ctx, x + TILE / 2, y + TILE, s.pos.facing, f, 0.4);
    } });
    drawables.sort((a, b) => a.depth - b.depth);
    for (const actor of drawables) {
      const [x, y] = screen(actor.x, actor.y);
      actor.draw(c, screen);
    }
    const [heroX, heroY] = screen(v.px, v.py);
    paintRegionalLighting(c, m.id, W2, H2, heroX, heroY);
    if (light > 0 && ["cave", "ruins", "onyx"].includes(m.id)) {
      const [x, y] = screen(v.px, v.py);
      shot(c, x + 6, y - 19, 1, 7, "#f8e5ae");
      shot(c, x + 3, y - 16, 7, 1, "#e0dbb6");
    }
    label(c, W2, H2, m.name, { hp: s.player.hp, mp: s.player.mp, level: s.player.level, gold: s.player.gold });
  }
  var rooms = /* @__PURE__ */ new Map();
  function roomBackground(room) {
    const def = interiorDefinition(room);
    const id = def.id;
    if (rooms.has(id)) return rooms.get(id);
    const { canvas, c } = makeCanvas(12 * TILE, 10 * TILE);
    paintRoomArchitecture(c, def.theme);
    for (const [loc, item] of interiorFixtures(room)) {
      const [x, y] = loc.split(",").map(Number);
      paintInteriorFurniture(c, item.kind, x * TILE, y * TILE);
    }
    rooms.set(id, canvas);
    return canvas;
  }
  function drawRoom(canvas, state2, room, motion = null) {
    const W2 = canvas.width, H2 = canvas.height;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.imageSmoothingEnabled = false;
    shot(ctx, 0, 0, W2, H2, "#242a37");
    const bg = roomBackground(room);
    const ox = Math.round((W2 - bg.width) / 2), oy = Math.round((H2 - bg.height) / 2);
    ctx.drawImage(bg, ox, oy);
    const resident2 = { x: 6, y: 3 };
    const moving2 = motion && motion.id === room.id;
    const t = moving2 ? clamp3((performance.now() - motion.start) / motion.duration, 0, 1) : 1;
    const x = moving2 ? motion.fromX + (room.x - motion.fromX) * t : room.x;
    const y = moving2 ? motion.fromY + (room.y - motion.fromY) * t : room.y;
    const drawables = [
      { y: resident2.y, fn: () => paintActor(
        ctx,
        ox + resident2.x * TILE,
        oy + resident2.y * TILE,
        {
          library: "elder",
          tailor: "helper",
          home: "elder",
          inn: "inn",
          shop: "shop",
          "harbor-inn": "inn",
          "harbor-shop": "shop"
        }[interiorDefinition(room).theme],
        "down",
        0
      ) },
      { y: y + 0.1, fn: () => paintSharedHero(
        ctx,
        ox + x * TILE + TILE / 2,
        oy + y * TILE + TILE,
        room.facing,
        t < 1 ? heroGaitFrame(motion, t) : 0,
        0.4
      ) }
    ];
    drawables.sort((a, b) => a.y - b.y).forEach((a) => a.fn());
    label(
      ctx,
      W2,
      H2,
      interiorDefinition(room).name,
      { hp: state2.player.hp, mp: state2.player.mp, level: state2.player.level, gold: state2.player.gold }
    );
  }
  function drawFight(canvas, s, b, impact = null) {
    const W2 = canvas.width, H2 = canvas.height;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.imageSmoothingEnabled = false;
    const enemy = monsterById(b.id);
    if (!enemy) throw Error("Invalid battle monster " + b.id);
    paintBattleBackdrop(ctx, W2, H2, enemy.area);
    const foot = H2 - Math.max(45, Math.round(H2 * 0.16));
    paintMonster(ctx, b.id, Math.round(W2 / 2), foot);
    paintCombatFeedback(ctx, W2, H2, impact, performance.now());
    const name = enemy.name;
    shot(
      ctx,
      Math.round(W2 / 2) - Math.min(122, name.length * 7 + 22),
      10,
      Math.min(W2 - 18, name.length * 14 + 44),
      28,
      "#0a1225ed"
    );
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#f0e5cf";
    ctx.strokeRect(
      Math.round(W2 / 2) - Math.min(122, name.length * 7 + 22) + 1.5,
      11.5,
      Math.min(W2 - 20, name.length * 14 + 41),
      25
    );
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff0d1";
    ctx.textBaseline = "middle";
    ctx.fillText(name, Math.round(W2 / 2), 24);
    if (b.ward > 0) {
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#a5f0d5";
      ctx.fillText("\u5B88\u308A\u306E\u5149", Math.round(W2 / 2), 52);
    }
    const barW = Math.min(W2 - 58, 210), barX = (W2 - barW) / 2;
    shot(ctx, barX, H2 - 48, barW, 8, "#1a2036");
    shot(ctx, barX + 1, H2 - 47, Math.max(1, Math.round((barW - 2) * b.hp / enemy.hp)), 6, "#ad6478");
    shot(ctx, barX + 1, H2 - 47, Math.max(1, Math.round((barW - 2) * b.hp / enemy.hp)), 2, "#dd9caa");
    label(ctx, W2, H2, "", { hp: s.player.hp, mp: s.player.mp, level: s.player.level, gold: s.player.gold });
    ctx.textAlign = "left";
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
    tone(freq, at2, duration, { type = "square", level = 0.13, bus = this.music, slide = 0 } = {}) {
      if (!freq || !this.ctx || this.muted) return;
      const osc = this.ctx.createOscillator(), env = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(45, freq), at2);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(45, freq + slide), at2 + Math.min(duration, 0.14));
      env.gain.setValueAtTime(0, at2);
      env.gain.linearRampToValueAtTime(level, at2 + 6e-3);
      env.gain.setValueAtTime(level * 0.82, at2 + Math.min(0.04, duration * 0.4));
      env.gain.exponentialRampToValueAtTime(1e-3, at2 + duration);
      osc.connect(env);
      env.connect(bus);
      osc.start(at2);
      osc.stop(at2 + duration + 8e-3);
      this.noteCount++;
    }
    drum(at2, level = 0.045) {
      if (!this.ctx || this.muted) return;
      const src = this.ctx.createBufferSource(), env = this.ctx.createGain(), hp = this.ctx.createBiquadFilter();
      src.buffer = this.noise;
      hp.type = "highpass";
      hp.frequency.value = 750;
      env.gain.setValueAtTime(level, at2);
      env.gain.exponentialRampToValueAtTime(1e-3, at2 + 0.05);
      src.connect(hp);
      hp.connect(env);
      env.connect(this.music);
      src.start(at2);
      src.stop(at2 + 0.06);
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

  // src/game/menu-navigation.mjs
  function nextMenuSelection(choices, index, dir) {
    if (!["up", "down", "left", "right"].includes(dir)) throw Error("\u30E1\u30CB\u30E5\u30FC\u65B9\u5411\u304C\u4E0D\u6B63");
    if (!Array.isArray(choices) || choices.length === 0) return -1;
    const n = choices.length, columns = 2, delta = { up: -columns, down: columns, left: -1, right: 1 }[dir];
    let at2 = Math.max(0, Math.min(n - 1, index));
    for (let count = 0; count < n; count++) {
      at2 = (at2 + delta + n) % n;
      if (!choices[at2]?.disabled) return at2;
    }
    return index;
  }
  function firstMenuSelection(choices) {
    return choices.findIndex((choice) => !choice.disabled);
  }

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
  var menuChoices = [];
  var menuIndex = -1;
  var menuBack = null;
  var walkMotion = null;
  var walkFrame = 0;
  var walkStep = 0;
  var interior = null;
  var roomMotion = null;
  var roomFrame = 0;
  var roomStep = 0;
  var battleFx = null;
  var battleFrame = 0;
  var audio = new GameAudio();
  var musicFor = () => !state ? "title" : state.stage === "CLEAR" ? "ending" : battle ? battle.id === "vold" ? "boss" : "battle" : interior ? state.pos.map === "castle" ? "castle" : "town" : { castle: "castle", field: "field", leaf: "town", sailun: "town", cave: "cave", ruins: "ruins", onyx: "onyx" }[state.pos.map] || "field";
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
  function sizeGameCanvas() {
    const canvas = $("game"), rect3 = canvas.getBoundingClientRect();
    if (rect3.width < 1 || rect3.height < 1) return;
    const desiredWidth = 288;
    if (canvas.width !== desiredWidth) canvas.width = desiredWidth;
    const pixels = Math.max(175, Math.min(560, Math.round(desiredWidth * rect3.height / rect3.width)));
    if (canvas.height !== pixels) canvas.height = pixels;
  }
  function paintCurrentWorld() {
    if (state.pos.map === "castle") {
      if (!castleArtReady()) throw Error("Approved castle art not loaded");
      renderCastleScene($("game"), state, walkMotion);
    } else drawWorld($("game"), state, lightSteps, walkMotion);
  }
  function paintCurrentRoom() {
    if (interior?.id === "castle-library") {
      if (!castleArtReady()) throw Error("Approved castle library art not loaded");
      renderCastleLibrary($("game"), state, interior, roomMotion);
    } else drawRoom($("game"), state, interior, roomMotion);
  }
  function paint() {
    if (!state) return;
    sizeGameCanvas();
    audio.setTheme(musicFor());
    if (battle) drawFight($("game"), state, battle, battleFx);
    else if (interior) paintCurrentRoom();
    else paintCurrentWorld();
    const goal = STAGE_GOALS[state.stage];
    if ($("objective-text").textContent !== goal) $("objective-text").textContent = goal;
    $("dialogue").hidden = !(queue.length || hint);
    $("message").textContent = queue[0] || hint || "";
    const target = front(state), visible = interior ? null : entityAt(state, MAPS[state.pos.map], target.x, target.y);
    const door = interior ? null : enterableDoor(state.pos);
    const roomPrompt = interior ? interiorPrompt(interior) : "";
    const gate = !interior && state.pos.map === "field" && MAPS.field.tiles[target.y]?.[target.x] === 6 && !state.flags.gateOpen;
    $("context-hint").hidden = Boolean(battle || queue.length || panelMode || !roomPrompt && !door && !visible && !gate);
    $("context-hint").textContent = interior ? roomPrompt : door ? "A  " + door.name + "\u3078\u5165\u308B" : gate ? "A  \u9244\u306E\u9580\u3092\u8ABF\u3079\u308B" : visible ? "A  " + (MAPS[state.pos.map].npcs.some((n) => n === visible) ? "\u306F\u306A\u3059\uFF1A" : "\u3057\u3089\u3079\u308B\uFF1A") + visible.name : "";
    $("message-arrow").hidden = queue.length === 0;
    $("talk-shortcut").textContent = battle ? "\u305F\u305F\u304B\u3046" : "\u306F\u306A\u3059";
    $("item-shortcut").disabled = queue.length > 0;
    $("spell-shortcut").disabled = queue.length > 0;
    $("menu-button").disabled = Boolean(battle || queue.length);
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
    menuChoices = [];
    menuIndex = -1;
    menuBack = null;
    $panel.hidden = true;
    $panel.removeAttribute("data-panel-type");
    $content.replaceChildren();
  }
  function markMenu() {
    [...$content.querySelectorAll("button[data-command-index]")].forEach((btn, i) => {
      const active = i === menuIndex;
      btn.classList.toggle("is-selected", active);
      btn.setAttribute("aria-current", active ? "true" : "false");
      if (active && document.activeElement !== btn) btn.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }
  function steerMenu(dir) {
    if (!menuChoices.length) return;
    menuIndex = nextMenuSelection(menuChoices, menuIndex, dir);
    audio.cue("step");
    markMenu();
  }
  function chooseMenu() {
    const choice = menuChoices[menuIndex];
    if (!choice || choice.disabled) return;
    audio.cue("confirm");
    choice.run();
  }
  function openPanel(title, choices, desc = "", back = null) {
    closePanel();
    panelMode = title;
    menuChoices = choices;
    menuIndex = firstMenuSelection(choices);
    menuBack = back || (battle ? battleChoices : title === "\u5192\u967A\u30E1\u30CB\u30E5\u30FC" || title.includes("\u9053\u5177\u5C4B") || title.includes("\u5BBF") ? closePanel : showMenu);
    const panelHost = battle ? document.querySelector(".controls") : document.querySelector(".screen-shell");
    if ($panel.parentElement !== panelHost) panelHost.append($panel);
    $panel.hidden = false;
    $panel.dataset.panelType = battle ? "battle" : "field";
    $("panel-title").textContent = title;
    if (desc) {
      const p = document.createElement("p");
      p.textContent = desc;
      $content.append(p);
    }
    choices.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = choice.label;
      btn.disabled = Boolean(choice.disabled);
      btn.dataset.commandIndex = String(i);
      if (choice.wide) btn.className = "wide";
      btn.addEventListener("click", () => {
        try {
          menuIndex = i;
          markMenu();
          chooseMenu();
        } catch (err) {
          fatal(err);
        }
      });
      $content.append(btn);
    });
    markMenu();
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
  function stopBattleFx() {
    if (battleFrame) cancelAnimationFrame(battleFrame);
    battleFrame = 0;
    battleFx = null;
  }
  function animateBattleFx() {
    if (!battle || !battleFx) {
      stopBattleFx();
      return;
    }
    if (combatFeedbackProgress(battleFx, performance.now()) >= 1) {
      stopBattleFx();
      paint();
      return;
    }
    paint();
    battleFrame = requestAnimationFrame(animateBattleFx);
  }
  function beginFight(id, tag, lines = []) {
    stopBattleFx();
    stopWalkAnimation();
    audio.cue("attack");
    battle = beginCombat(id, tag);
    closePanel();
    message([...lines, tag === "tutorial" ? "\u300C\u305F\u305F\u304B\u3046\u300D\u3067\u9B54\u7269\u306B\u7ACB\u3061\u5411\u304B\u304A\u3046\uFF01" : monsterById(id).name + "\u304C\u73FE\u308C\u305F\uFF01"]);
    paint();
  }
  function performBattle(action) {
    if (queue.length) return;
    const result = combatTurn(state, battle, action);
    stopBattleFx();
    if (result.battle) battleFx = combatFeedback(state, battle, result, action, performance.now());
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
    if (battleFx) battleFrame = requestAnimationFrame(animateBattleFx);
    if (result.outcome !== "continue") {
      hint = "";
    }
  }
  function battleChoices() {
    if (!battle || queue.length) return;
    stopWalkAnimation();
    const enemy = monsterById(battle.id);
    openPanel("\u6226\u95D8\u30B3\u30DE\u30F3\u30C9", [
      { label: "\u2694 \u305F\u305F\u304B\u3046", run: () => performBattle({ type: "attack" }) },
      { label: "\u2726 \u3058\u3085\u3082\u3093", run: () => spellMenu(true) },
      { label: "\u{1F9EA} \u3069\u3046\u3050", run: () => itemMenu(true) },
      { label: "\u2197 \u306B\u3052\u308B", run: () => performBattle({ type: "run" }), disabled: battle.tag !== "random" }
    ]);
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
          const r2 = useItem(state, item.id);
          closePanel();
          storeAndSet(r2.state, r2.used);
          message([r2.message]);
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
        const r2 = equip(state, e.id, e.category);
        closePanel();
        storeAndSet(r2.state, true);
        message([r2.message]);
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
    stopWalkAnimation();
    const st = stats(state);
    openPanel("\u5192\u967A\u30E1\u30CB\u30E5\u30FC", [
      { label: "\u306F\u306A\u3059 / \u3057\u3089\u3079\u308B", run: () => {
        closePanel();
        confirm();
      } },
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
        const r2 = buy(state, i.id);
        closePanel();
        storeAndSet(r2.state, r2.ok);
        message([r2.message]);
      } })),
      ...gear.map((e) => ({ label: e.name + " " + e.price + "G", disabled: ownsEquipment(state, e.category, e.id), run: () => {
        const r2 = buyEquipment(state, e.id, e.category);
        closePanel();
        storeAndSet(r2.state, r2.ok);
        message([r2.message]);
      } })),
      { label: "\u8CB7\u308F\u306A\u3044", run: closePanel, wide: true }
    ];
    openPanel(town === "sailun" ? "\u30BB\u30A4\u30EB\u30F3\u306E\u9053\u5177\u5C4B" : "\u30EA\u30FC\u30D5\u30A1\u306E\u9053\u5177\u5C4B", options, "\u6240\u6301\u91D1 " + state.player.gold + "G\u3002\u8CFC\u5165\u3057\u305F\u88C5\u5099\u306F\u81EA\u52D5\u3067\u88C5\u5099\u3055\u308C\u307E\u3059\u3002");
  }
  function innMenu() {
    openPanel(state.pos.map === "sailun" ? "\u30BB\u30A4\u30EB\u30F3\u306E\u5BBF" : "\u30EA\u30FC\u30D5\u30A1\u306E\u5BBF", [
      { label: "\u4F11\u3080 / 12G", run: () => {
        const r2 = rest(state);
        closePanel();
        storeAndSet(r2.state, r2.ok);
        message([r2.message]);
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
  function stopWalkAnimation() {
    if (walkFrame) cancelAnimationFrame(walkFrame);
    walkFrame = 0;
    walkMotion = null;
  }
  function animateWalkFrame() {
    if (!state || battle || !walkMotion) {
      stopWalkAnimation();
      return;
    }
    if (performance.now() - walkMotion.start >= walkMotion.duration) {
      stopWalkAnimation();
      paint();
      return;
    }
    paintCurrentWorld();
    walkFrame = requestAnimationFrame(animateWalkFrame);
  }
  function stopRoomAnimation() {
    if (roomFrame) cancelAnimationFrame(roomFrame);
    roomFrame = 0;
    roomMotion = null;
  }
  function animateRoomFrame() {
    if (!state || battle || !interior || !roomMotion) {
      stopRoomAnimation();
      return;
    }
    if (performance.now() - roomMotion.start >= roomMotion.duration) {
      stopRoomAnimation();
      paint();
      return;
    }
    paintCurrentRoom();
    roomFrame = requestAnimationFrame(animateRoomFrame);
  }
  function direction(dir) {
    if (!state) return;
    if (panelMode) {
      steerMenu(dir);
      return;
    }
    if (battle || queue.length) return;
    if (interior) {
      const previous2 = interior;
      const moved = moveInside(interior, dir);
      stopRoomAnimation();
      if (moved.kind === "exit") {
        interior = null;
        audio.cue("run");
        message(["\u5EFA\u7269\u304B\u3089\u5916\u3078\u51FA\u305F\u3002"]);
      } else {
        interior = moved.room;
        if (moved.kind === "walk") roomMotion = { id: interior.id, fromX: previous2.x, fromY: previous2.y, start: performance.now(), duration: 145, step: roomStep++ };
        if (moved.kind === "blocked") hint = "\u5BB6\u5177\u3084\u58C1\u304C\u3042\u3063\u3066\u9032\u3081\u306A\u3044\u3002";
        else hint = "";
        paint();
        if (roomMotion) roomFrame = requestAnimationFrame(animateRoomFrame);
      }
      return;
    }
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const previous = state.pos;
    const r2 = move(state, dx, dy);
    stopWalkAnimation();
    if (r2.kind === "walk") {
      walkMotion = { map: previous.map, fromX: previous.x, fromY: previous.y, start: performance.now(), duration: 145, step: walkStep++ };
    }
    if (r2.kind === "portal") audio.cue("run");
    storeAndSet(r2.state, Boolean(r2.autoSave));
    if (r2.message) notice(r2.message);
    else {
      hint = "";
      paint();
    }
    if (walkMotion) walkFrame = requestAnimationFrame(animateWalkFrame);
    if (r2.kind === "walk") {
      startRandom();
      if (lightSteps > 0) lightSteps--;
    } else if (r2.kind === "portal" && lightSteps > 0) {
      lightSteps = 0;
    }
  }
  function confirm() {
    if (!state) return;
    if (panelMode) {
      try {
        chooseMenu();
      } catch (err) {
        fatal(err);
      }
      return;
    }
    if (!battle) audio.cue("confirm");
    if (advanceMessage()) return;
    if (battle) {
      battleChoices();
      return;
    }
    if (interior) {
      const next = interiorTarget(interior);
      if (next.x === 6 && next.y === 3) {
        const service = interiorDefinition(interior).service;
        if (service === "inn") {
          innMenu();
          return;
        }
        if (service === "shop") {
          shopMenu();
          return;
        }
      }
      message(investigateInside(interior));
      return;
    }
    const doorway = enterableDoor(state.pos);
    if (doorway) {
      stopWalkAnimation();
      stopRoomAnimation();
      interior = makeInterior(doorway);
      audio.cue("run");
      message([doorway.name + "\u306B\u5165\u3063\u305F\u3002\u5BB6\u5177\u3084\u4F4F\u4EBA\u306B\u8FD1\u3065\u304D\u3001A\u3067\u8A71\u3059\u30FB\u8ABF\u3079\u308B\u3002\u51FA\u53E3\u306F\u4E0B\u306E\u6249\u3002"]);
      return;
    }
    try {
      const r2 = interact(state);
      if (r2.kind === "battle") {
        beginFight(r2.monsterId, r2.tag, r2.messages);
        return;
      }
      if (r2.kind === "manualSave") {
        manual.write(r2.state);
        storeAndSet(r2.state);
        message([...r2.messages, "\u738B\u69D8\u306E\u30BB\u30FC\u30D6\u306B\u8A18\u9332\u3057\u305F\u3002"]);
        return;
      }
      apply(r2);
      if (r2.kind === "shop") shopMenu();
      if (r2.kind === "inn") innMenu();
    } catch (err) {
      fatal(err);
    }
  }
  function cancel() {
    audio.cue("cancel");
    if (panelMode) {
      try {
        menuBack?.();
      } catch (err) {
        fatal(err);
      }
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
  $("talk-shortcut").addEventListener("click", () => {
    if (!state) return;
    if (queue.length) {
      advanceMessage();
      return;
    }
    if (battle) {
      performBattle({ type: "attack" });
      return;
    }
    if (panelMode) closePanel();
    confirm();
  });
  $("item-shortcut").addEventListener("click", () => {
    if (!state || queue.length) return;
    itemMenu(Boolean(battle));
  });
  $("spell-shortcut").addEventListener("click", () => {
    if (!state || queue.length) return;
    spellMenu(Boolean(battle));
  });
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
    stopWalkAnimation();
    stopRoomAnimation();
    stopBattleFx();
    audio.unlock().catch(console.warn);
    validateState(s);
    state = s;
    battle = null;
    interior = null;
    queue = [];
    hint = "";
    lightSteps = 0;
    closePanel();
    $("start-overlay").hidden = true;
    document.title = "\u661F\u5C51\u306E\u52C7\u8005\uFF5C\u306F\u3058\u307E\u308A\u306E\u5263\u3068\u9ED2\u66DC\u306E\u9B54\u738B\u57CE";
    paint();
    if (intro) message(["\u30A2\u30EB\u30C6\u30EA\u30A2\u738B\u56FD\u3002\u9B54\u7269\u306E\u8ECD\u52E2\u3092\u9003\u308C\u305F\u4EBA\u3005\u304C\u3001\u57CE\u3078\u62BC\u3057\u5BC4\u305B\u305F\u3002", "\u9003\u3052\u9045\u308C\u305F\u4EBA\u306E\u3059\u3050\u305D\u3070\u306B\u3001\u9B54\u7269\u304C\u8FEB\u3063\u3066\u3044\u308B\u3002", "\u5341\u5B57\u30AD\u30FC\u3067\u8FD1\u3065\u304D\u3001A\u30DC\u30BF\u30F3\u3067\u9B54\u7269\u3068\u6226\u304A\u3046\u3002"]);
    else message(["\u5192\u967A\u306E\u8A18\u9332\u3092\u8AAD\u307F\u8FBC\u3093\u3060\u3002"]);
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
  var saveSlotError = null;
  try {
    verifySlots();
  } catch (err) {
    saveSlotError = err;
    setError(err);
  }
  for (const id of ["new-game", "load-auto", "load-manual"]) $(id).disabled = true;
  if (!saveSlotError) {
    Promise.all([preloadRetroAssets(), preloadCastleArt()]).then(() => {
      verifySlots();
      $("new-game").disabled = false;
    }).catch((err) => {
      setError(err);
      for (const id of ["new-game", "load-auto", "load-manual"]) $(id).disabled = true;
    });
  }
  window.addEventListener("resize", () => {
    if (state) paint();
  });
  window.__hoshikuzuQA = Object.freeze({ state: () => state ? clone(state) : null, battle: () => battle ? clone(battle) : null, interior: () => interior ? { ...interior } : null, visual: () => ({ system: "atlas-v12", tile: 24, width: $("game").width, height: $("game").height, assetsLoaded: retroAssetsReady(), castleArtLoaded: castleArtReady(), heroSprite: castleArtDebug().lastHeroSprite }), impact: () => battleFx ? { ...battleFx } : null, audio: () => audio.inspect() });
})();
