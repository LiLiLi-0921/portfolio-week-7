/* =========================================================
   Weather app — projects.html
   Current weather: UAPI Weather API (uapis.cn)
     GET https://uapis.cn/api/v1/misc/weather?city=<name>
   3-day forecast: Open-Meteo (free, no key, CORS-enabled)
     - Geocode: https://geocoding-api.open-meteo.com/v1/search?name=<city>
     - Forecast: https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..
   (UAPI's history endpoint is blocked for browser requests
    and provides no future forecast, so Open-Meteo fills that role.)

   When the user types pinyin (e.g. "Suzhou"), a local
   dictionary resolves it to all matching Chinese city names
   (e.g. 苏州, 宿州). Weather is fetched for each match and
   every result card is shown. Chinese input goes straight to
   the API.
   ========================================================= */
(function () {
  "use strict";

  var API_URL = "https://uapis.cn/api/v1/misc/weather";
  var GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
  var FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

  /* ---------- DOM refs ---------- */
  var $input  = document.getElementById("weather-input");
  var $search = document.getElementById("weather-search");
  var $msg    = document.getElementById("weather-message");
  var $result = document.getElementById("weather-result");
  var $unitBtns = document.querySelectorAll(".unit-btn");

  /* ---------- State ---------- */
  var unit = "C";              // current temperature unit
  var lastResults = [];        // raw API data from last search (for re-render on unit switch)

  /* ---------- Pinyin → Chinese city names ----------
     Ambiguous pinyin map to multiple cities; the app fetches
     weather for every match and shows all result cards.
     Key is lowercased, no spaces. */
  var PINYIN_CITIES = {
    // Municipalities
    "beijing":      ["北京"],
    "shanghai":     ["上海"],
    "tianjin":      ["天津"],
    "chongqing":    ["重庆"],
    // Provincial capitals
    "guangzhou":    ["广州"],
    "chengdu":      ["成都"],
    "hangzhou":     ["杭州"],
    "xian":         ["西安"],
    "nanjing":      ["南京"],
    "shenyang":     ["沈阳"],
    "harbin":       ["哈尔滨"],
    "jinan":        ["济南"],
    "zhengzhou":    ["郑州"],
    "shijiazhuang": ["石家庄"],
    "taiyuan":      ["太原"],
    "kunming":      ["昆明"],
    "changchun":    ["长春"],
    "hefei":        ["合肥"],
    "nanchang":     ["南昌"],
    "guiyang":      ["贵阳"],
    "lanzhou":      ["兰州"],
    "haikou":       ["海口"],
    "lhasa":        ["拉萨"],
    "urumqi":       ["乌鲁木齐"],
    "yinchuan":     ["银川"],
    "xining":       ["西宁"],
    "hohhot":       ["呼和浩特"],
    "nanning":      ["南宁"],
    // SARs
    "hongkong":     ["香港"],
    "macao":        ["澳门"],
    "macau":        ["澳门"],
    // Ambiguous pinyin — multiple cities share the same spelling
    "suzhou":       ["苏州", "宿州"],
    "fuzhou":       ["福州", "抚州"],
    "taizhou":      ["泰州", "台州"],
    // Other major cities
    "shenzhen":     ["深圳"],
    "qingdao":      ["青岛"],
    "dalian":       ["大连"],
    "ningbo":       ["宁波"],
    "xiamen":       ["厦门"],
    "changsha":     ["长沙"],
    "wuhan":        ["武汉"],
    "wuxi":         ["无锡"],
    "wenzhou":      ["温州"],
    "yangzhou":     ["扬州"],
    "changzhou":    ["常州"],
    "xuzhou":       ["徐州"],
    "zhuhai":       ["珠海"],
    "foshan":       ["佛山"],
    "dongguan":     ["东莞"],
    "luoyang":      ["洛阳"],
    "yantai":       ["烟台"],
    "weifang":      ["潍坊"],
    "tangshan":     ["唐山"],
    "baoding":      ["保定"],
    "handan":       ["邯郸"],
    "cangzhou":     ["沧州"],
    "wuhu":         ["芜湖"],
    "bengbu":       ["蚌埠"],
    "quanzhou":     ["泉州"],
    "zhangzhou":    ["漳州"],
    "putian":       ["莆田"],
    "guilin":       ["桂林"],
    "liuzhou":      ["柳州"],
    "wuzhou":       ["梧州"],
    "beihai":       ["北海"],
    "zhongshan":    ["中山"],
    "jiangmen":     ["江门"],
    "huizhou":      ["惠州"],
    "zhaoqing":     ["肇庆"],
    "kaifeng":      ["开封"],
    "anyang":       ["安阳"],
    "nanyang":      ["南阳"],
    "xinyang":      ["信阳"],
    "shantou":      ["汕头"],
    "meizhou":      ["梅州"],
    "shaoguan":     ["韶关"],
    "maoming":      ["茂名"],
    "zhanjiang":    ["湛江"],
    "chaozhou":     ["潮州"]
  };

  /* ---------- City coordinates ----------
     Used directly for the forecast fetch (skips geocoding, which
     fails for some Chinese names like 宿州 and can be ambiguous). */
  var CITY_COORDS = {
    "北京": [39.9075, 116.39723], "上海": [31.2304, 121.4737],
    "天津": [39.3434, 117.3616], "重庆": [29.5630, 106.5516],
    "广州": [23.1291, 113.2644], "成都": [30.5728, 104.0668],
    "杭州": [30.2741, 120.1551], "西安": [34.3416, 108.9398],
    "南京": [32.0603, 118.7969], "沈阳": [41.8057, 123.4315],
    "哈尔滨": [45.8038, 126.5350], "济南": [36.6512, 117.1201],
    "郑州": [34.7466, 113.6254], "石家庄": [38.0428, 114.5149],
    "太原": [37.8706, 112.5489], "昆明": [24.8801, 102.8329],
    "长春": [43.8171, 125.3235], "合肥": [31.8206, 117.2272],
    "南昌": [28.6820, 115.8579], "贵阳": [26.6470, 106.6302],
    "兰州": [36.0611, 103.8343], "海口": [20.0444, 110.1999],
    "拉萨": [29.6520, 91.1721], "乌鲁木齐": [43.8256, 87.6168],
    "银川": [38.4872, 106.2309], "西宁": [36.6171, 101.7782],
    "呼和浩特": [40.8414, 111.7519], "南宁": [22.8170, 108.3665],
    "香港": [22.3193, 114.1694], "澳门": [22.1987, 113.5439],
    "苏州": [31.30408, 120.59538], "宿州": [33.63611, 116.97889],
    "福州": [26.0745, 119.2965], "抚州": [27.9545, 116.3582],
    "泰州": [32.4553, 119.9230], "台州": [28.6560, 121.4208],
    "深圳": [22.5431, 114.0579], "青岛": [36.0671, 120.3826],
    "大连": [38.9140, 121.6147], "宁波": [29.8683, 121.5440],
    "厦门": [24.4798, 118.0894], "长沙": [28.2282, 112.9388],
    "武汉": [30.5928, 114.3055], "无锡": [31.4912, 120.3119],
    "温州": [27.9938, 120.6994], "扬州": [32.3947, 119.4126],
    "常州": [31.8105, 119.9741], "徐州": [34.2044, 117.2857],
    "珠海": [22.2710, 113.5767], "佛山": [23.0218, 113.1219],
    "东莞": [23.0430, 113.7633], "洛阳": [34.6197, 112.4540],
    "烟台": [37.5365, 121.3997], "潍坊": [36.7069, 119.1618],
    "唐山": [39.6304, 118.1802], "保定": [38.8740, 115.4646],
    "邯郸": [36.6093, 114.4896], "沧州": [38.3037, 116.8387],
    "芜湖": [31.3528, 118.4330], "蚌埠": [32.9163, 117.3894],
    "泉州": [24.8741, 118.6758], "漳州": [24.5128, 117.6473],
    "莆田": [25.4544, 119.0078], "桂林": [25.2742, 110.2902],
    "柳州": [24.3255, 109.4155], "梧州": [23.4770, 111.2793],
    "北海": [21.4811, 109.1199], "中山": [22.5155, 113.3927],
    "江门": [22.5789, 113.0819], "惠州": [23.1115, 114.4161],
    "肇庆": [23.0472, 112.4652], "开封": [34.7971, 114.3074],
    "安阳": [36.0997, 114.3927], "南阳": [32.9908, 112.5283],
    "信阳": [32.1469, 114.0913], "汕头": [23.3535, 116.6822],
    "梅州": [24.2886, 116.1221], "韶关": [24.8104, 113.5975],
    "茂名": [21.6631, 110.9254], "湛江": [21.2707, 110.3594],
    "潮州": [23.6618, 116.6224]
  };

  /* ---------- Weather-term mapping (Chinese → English + emoji) ---------- */
  var WEATHER_MAP = {
    "晴":     { en: "Clear",         emoji: "☀️" },
    "多云":   { en: "Partly Cloudy", emoji: "⛅" },
    "阴":     { en: "Overcast",      emoji: "☁️" },
    "阵雨":   { en: "Showers",       emoji: "🌦️" },
    "雷阵雨": { en: "Thunderstorms", emoji: "⛈️" },
    "小雨":   { en: "Light Rain",    emoji: "🌧️" },
    "中雨":   { en: "Moderate Rain", emoji: "🌧️" },
    "大雨":   { en: "Heavy Rain",    emoji: "🌧️" },
    "暴雨":   { en: "Rainstorm",     emoji: "🌧️" },
    "晴间多云": { en: "Partly Cloudy",   emoji: "⛅" },
    "阴间多云": { en: "Mostly Cloudy",   emoji: "☁️" },
    "小毛毛雨": { en: "Light Drizzle",   emoji: "🌦️" },
    "中毛毛雨": { en: "Moderate Drizzle",emoji: "🌧️" },
    "大毛毛雨": { en: "Heavy Drizzle",   emoji: "🌧️" },
    "小雪":   { en: "Light Snow",    emoji: "🌨️" },
    "中雪":   { en: "Moderate Snow", emoji: "🌨️" },
    "大雪":   { en: "Heavy Snow",    emoji: "❄️" },
    "暴雪":   { en: "Snowstorm",      emoji: "❄️" },
    "雨夹雪": { en: "Sleet",          emoji: "🌨️" },
    "雾":     { en: "Fog",            emoji: "🌫️" },
    "霾":     { en: "Haze",           emoji: "🌫️" },
    "浮尘":   { en: "Dust",           emoji: "🌪️" },
    "扬沙":   { en: "Sand",           emoji: "🌪️" },
    "沙尘暴": { en: "Sandstorm",      emoji: "🌪️" },
    "冰雹":   { en: "Hail",           emoji: "🌨️" }
  };

  function lookupWeather(text) {
    if (!text) return { en: "Unknown", emoji: "🌡️" };
    if (WEATHER_MAP[text]) return WEATHER_MAP[text];
    if (/雷/.test(text)) return { en: "Thunderstorms", emoji: "⛈️" };
    if (/雪/.test(text)) return { en: text, emoji: "❄️" };
    if (/雨/.test(text)) return { en: text, emoji: "🌧️" };
    if (/雾|霾/.test(text)) return { en: text, emoji: "🌫️" };
    if (/沙|尘/.test(text)) return { en: text, emoji: "🌪️" };
    if (/晴/.test(text)) return { en: "Clear", emoji: "☀️" };
    if (/多云/.test(text)) return { en: "Partly Cloudy", emoji: "⛅" };
    if (/阴/.test(text)) return { en: "Overcast", emoji: "☁️" };
    return { en: text, emoji: "🌡️" };
  }

  function translateWind(dir) {
    var map = {
      "北风": "N", "南风": "S", "东风": "E", "西风": "W",
      "东北风": "NE", "东南风": "SE", "西北风": "NW", "西南风": "SW",
      "微风": "Light", "静风": "Calm", "无风": "Calm"
    };
    return map[dir] || dir || "";
  }

  function translateReportTime(t) {
    if (!t) return "";
    var m = t.match(/(\d+)\s*分钟前/);
    if (m) return m[1] + " min ago";
    m = t.match(/(\d+)\s*小时前/);
    if (m) return m[1] + " hr ago";
    if (/刚刚|实时/.test(t)) return "Just now";
    return t;
  }

  function toFahrenheit(c) { return Math.round(c * 9 / 5 + 32); }

  /* ---------- WMO weather codes (Open-Meteo) → label + emoji ---------- */
  var WMO_MAP = {
    0:  { en: "Clear",           emoji: "☀️" },
    1:  { en: "Mainly Clear",    emoji: "🌤️" },
    2:  { en: "Partly Cloudy",   emoji: "⛅" },
    3:  { en: "Overcast",        emoji: "☁️" },
    45: { en: "Fog",             emoji: "🌫️" },
    48: { en: "Rime Fog",        emoji: "🌫️" },
    51: { en: "Light Drizzle",   emoji: "🌦️" },
    53: { en: "Drizzle",         emoji: "🌦️" },
    55: { en: "Dense Drizzle",   emoji: "🌧️" },
    56: { en: "Freezing Drizzle",emoji: "🌧️" },
    57: { en: "Freezing Drizzle",emoji: "🌧️" },
    61: { en: "Light Rain",      emoji: "🌧️" },
    63: { en: "Moderate Rain",   emoji: "🌧️" },
    65: { en: "Heavy Rain",      emoji: "🌧️" },
    66: { en: "Freezing Rain",   emoji: "🌧️" },
    67: { en: "Freezing Rain",   emoji: "🌧️" },
    71: { en: "Light Snow",      emoji: "🌨️" },
    73: { en: "Moderate Snow",   emoji: "🌨️" },
    75: { en: "Heavy Snow",      emoji: "❄️" },
    77: { en: "Snow Grains",     emoji: "🌨️" },
    80: { en: "Light Showers",   emoji: "🌦️" },
    81: { en: "Showers",         emoji: "🌦️" },
    82: { en: "Heavy Showers",   emoji: "🌧️" },
    85: { en: "Snow Showers",    emoji: "🌨️" },
    86: { en: "Snow Showers",    emoji: "🌨️" },
    95: { en: "Thunderstorm",    emoji: "⛈️" },
    96: { en: "Thunderstorm",    emoji: "⛈️" },
    99: { en: "Thunderstorm",    emoji: "⛈️" }
  };

  function toLocalISODate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function dateLabel(isoDate) {
    var today = toLocalISODate(new Date());
    var tomorrow = toLocalISODate(new Date(Date.now() + 86400000));
    if (isoDate === today) return "Today";
    if (isoDate === tomorrow) return "Tomorrow";
    var parts = isoDate.split("-");
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[parseInt(parts[1], 10) - 1] + " " + parseInt(parts[2], 10);
  }

  /* ---------- UI helpers ---------- */
  function showMsg(text, type) {
    $msg.textContent = text;
    $msg.className = "weather-message" + (type ? " " + type : "");
  }
  function hideResult() { $result.hidden = true; $result.innerHTML = ""; }
  function showResult() { $result.hidden = false; }

  /* ---------- Build a single weather card ---------- */
  function buildCard(data) {
    var w = lookupWeather(data.weather);

    var card = document.createElement("div");
    card.className = "weather-card";

    // Main row: emoji + city/temp/condition
    var main = document.createElement("div");
    main.className = "weather-main";

    var icon = document.createElement("span");
    icon.className = "weather-emoji";
    icon.textContent = w.emoji;
    main.appendChild(icon);

    var info = document.createElement("div");
    info.className = "weather-info";

    var h3 = document.createElement("h3");
    h3.textContent = (data.city || "") +
      (data.province && data.province !== data.city ? ", " + data.province : "");
    info.appendChild(h3);

    var temp = document.createElement("p");
    temp.className = "weather-temp";
    var tempVal = document.createElement("span");
    tempVal.textContent = unit === "F" ? toFahrenheit(data.temperature) : data.temperature;
    var deg = document.createElement("span");
    deg.className = "deg";
    deg.textContent = unit === "F" ? "°F" : "°C";
    temp.appendChild(tempVal);
    temp.appendChild(deg);
    info.appendChild(temp);

    var cond = document.createElement("p");
    cond.className = "weather-condition";
    cond.textContent = w.en;
    info.appendChild(cond);

    main.appendChild(info);
    card.appendChild(main);

    // Details row
    var details = document.createElement("div");
    details.className = "weather-details";

    function detail(label, val) {
      var d = document.createElement("div");
      d.className = "weather-detail";
      var l = document.createElement("span");
      l.className = "detail-label";
      l.textContent = label;
      var v = document.createElement("span");
      v.className = "detail-val";
      v.textContent = val;
      d.appendChild(l);
      d.appendChild(v);
      details.appendChild(d);
    }

    detail("Humidity", data.humidity != null ? data.humidity + "%" : "—");
    detail("Wind", translateWind(data.wind_direction) +
      (data.wind_power ? " " + data.wind_power : ""));
    detail("Updated", translateReportTime(data.report_time));

    card.appendChild(details);

    // 3-day weather strip (from history endpoint)
    if (data._forecast && data._forecast.length > 0) {
      var fc = document.createElement("div");
      fc.className = "weather-forecast";

      var fcTitle = document.createElement("h4");
      fcTitle.textContent = "3-Day Weather";
      fc.appendChild(fcTitle);

      var strip = document.createElement("div");
      strip.className = "forecast-strip";

      data._forecast.forEach(function (day) {
        var emoji = day.emoji || lookupWeather(day.weather).emoji;
        var high = unit === "F" ? toFahrenheit(day.temp_max) : Math.round(day.temp_max);
        var low  = unit === "F" ? toFahrenheit(day.temp_min) : Math.round(day.temp_min);

        var cell = document.createElement("div");
        cell.className = "forecast-day";

        var dl = document.createElement("span");
        dl.className = "forecast-date";
        dl.textContent = dateLabel(day.date);
        cell.appendChild(dl);

        var de = document.createElement("span");
        de.className = "forecast-emoji";
        de.textContent = emoji;
        cell.appendChild(de);

        var dt = document.createElement("span");
        dt.className = "forecast-temps";
        dt.innerHTML = high + '°<span class="low">/' + low + "°</span>";
        cell.appendChild(dt);

        strip.appendChild(cell);
      });

      fc.appendChild(strip);
      card.appendChild(fc);
    }

    return card;
  }

  /* ---------- 3-day forecast via Open-Meteo ---------- */
  async function geocode(city, lang) {
    var r = await fetch(
      GEO_URL + "?name=" + encodeURIComponent(city) + "&count=1&language=" + lang + "&format=json",
      { headers: { Accept: "application/json" } }
    );
    var d = await r.json();
    if (d.results && d.results.length) {
      return [d.results[0].latitude, d.results[0].longitude];
    }
    return null;
  }

  async function fetchForecast(city) {
    // 1) Resolve coordinates: hardcoded map first, geocoding as fallback
    var lat, lon;
    if (CITY_COORDS[city]) {
      lat = CITY_COORDS[city][0];
      lon = CITY_COORDS[city][1];
    } else {
      var coords = null;
      try { coords = await geocode(city, "zh"); } catch (e) { coords = null; }
      if (!coords) {
        try { coords = await geocode(city, "en"); } catch (e) { coords = null; }
      }
      if (!coords) return [];
      lat = coords[0];
      lon = coords[1];
    }

    // 2) Fetch 3-day forecast for those coordinates
    var fcRes = await fetch(
      FORECAST_URL + "?latitude=" + lat + "&longitude=" + lon +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&timezone=auto&forecast_days=3",
      { headers: { Accept: "application/json" } }
    );
    var fc = await fcRes.json();
    var d = fc.daily || {};
    var out = [];
    for (var i = 0; i < (d.time || []).length; i++) {
      var wmo = WMO_MAP[d.weather_code[i]] || { en: "Unknown", emoji: "🌡️" };
      out.push({
        date: d.time[i],
        weather: wmo.en,
        emoji: wmo.emoji,
        temp_max: d.temperature_2m_max[i],
        temp_min: d.temperature_2m_min[i]
      });
    }
    return out;
  }

  /* ---------- Fetch weather for a single city ---------- */
  async function fetchOne(city) {
    var enc = encodeURIComponent(city);

    // Current weather (UAPI) + 3-day forecast (Open-Meteo) in parallel
    var results = await Promise.all([
      fetch(API_URL + "?city=" + enc, { headers: { Accept: "application/json" } }),
      fetchForecast(city).catch(function () { return []; })
    ]);

    var data = await results[0].json();
    if (data.error || data.code) return null;

    data._forecast = results[1] || [];
    return data;
  }

  /* ---------- Resolve pinyin → Chinese city names ---------- */
  function resolveCities(input) {
    // If the input contains CJK characters, send it directly
    if (/[\u4e00-\u9fff]/.test(input)) return [input];
    // Lowercase + strip spaces for dictionary lookup
    var key = input.toLowerCase().replace(/\s+/g, "");
    if (PINYIN_CITIES[key]) return PINYIN_CITIES[key];
    // Not in dictionary — send the raw input (API may still match)
    return [input];
  }

  /* ---------- Search ---------- */
  async function searchWeather() {
    var city = $input.value.trim();

    // Empty input — don't call the API
    if (!city) {
      showMsg("Enter a city first.");
      hideResult();
      return;
    }

    var cities = resolveCities(city);

    // Loading state
    $search.disabled = true;
    showMsg("Loading" + (cities.length > 1 ? " " + cities.length + " cities…" : "…"), "loading");
    hideResult();

    try {
      // Fetch all matches in parallel
      var results = await Promise.all(
        cities.map(function (c) { return fetchOne(c); })
      );

      // Filter out nulls (city not found)
      var found = results.filter(function (r) { return r !== null; });

      if (found.length === 0) {
        showMsg("Couldn't find that city — check the spelling.", "error");
        return;
      }

      // Render all result cards
      showResult();
      lastResults = found;
      found.forEach(function (data) {
        $result.appendChild(buildCard(data));
      });

      showMsg("");
    } catch (e) {
      showMsg("Couldn't reach the weather service. Try again in a moment.", "error");
    } finally {
      $search.disabled = false;
    }
  }

  /* ---------- Wire up events ---------- */
  $search.addEventListener("click", searchWeather);
  $input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); searchWeather(); }
  });

  /* ---------- Unit toggle ---------- */
  $unitBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var newUnit = btn.getAttribute("data-unit");
      if (newUnit === unit) return;
      unit = newUnit;
      $unitBtns.forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-unit") === newUnit);
      });
      // Re-render existing cards with the new unit
      if (lastResults.length > 0 && !$result.hidden) {
        $result.innerHTML = "";
        lastResults.forEach(function (data) {
          $result.appendChild(buildCard(data));
        });
      }
    });
  });
})();
