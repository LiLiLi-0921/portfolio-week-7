/* =========================================================
   World time app — projects.html
   API: UAPI World Time
     GET https://uapis.cn/api/v1/misc/worldtime?city=<city>

   The API accepts English city names (no spaces) and IANA
   timezone IDs, but rejects Chinese names — so Chinese input
   is mapped to its IANA zone before the request.
   ========================================================= */
(function () {
  "use strict";

  var API_URL = "https://uapis.cn/api/v1/misc/worldtime";

  /* Chinese city → IANA timezone (the API rejects CJK names) */
  var CJK_ZONES = {
    "北京": "Asia/Shanghai", "上海": "Asia/Shanghai", "天津": "Asia/Shanghai",
    "重庆": "Asia/Shanghai", "广州": "Asia/Shanghai", "深圳": "Asia/Shanghai",
    "杭州": "Asia/Shanghai", "南京": "Asia/Shanghai", "苏州": "Asia/Shanghai",
    "成都": "Asia/Shanghai", "武汉": "Asia/Shanghai", "西安": "Asia/Shanghai",
    "香港": "Asia/Hong_Kong", "澳门": "Asia/Macau", "台北": "Asia/Taipei",
    "东京": "Asia/Tokyo", "首尔": "Asia/Seoul", "新加坡": "Asia/Singapore",
    "曼谷": "Asia/Bangkok", "迪拜": "Asia/Dubai", "新德里": "Asia/Kolkata",
    "伦敦": "Europe/London", "巴黎": "Europe/Paris", "柏林": "Europe/Berlin",
    "罗马": "Europe/Rome", "莫斯科": "Europe/Moscow",
    "纽约": "America/New_York", "洛杉矶": "America/Los_Angeles",
    "芝加哥": "America/Chicago", "多伦多": "America/Toronto",
    "悉尼": "Australia/Sydney", "墨尔本": "Australia/Melbourne",
    "奥克兰": "Pacific/Auckland", "圣保罗": "America/Sao_Paulo"
  };

  /* English city → IANA timezone.
     UAPI's city table is very sparse (e.g. Boston returns 404),
     but IANA IDs always work. Keys are normalised: lowercase,
     no spaces / dots / hyphens. */
  var CITY_ZONES = {
    /* United States */
    "boston": "America/New_York", "newyork": "America/New_York",
    "washington": "America/New_York", "washingtondc": "America/New_York",
    "philadelphia": "America/New_York", "atlanta": "America/New_York",
    "miami": "America/New_York", "orlando": "America/New_York",
    "tampa": "America/New_York", "charlotte": "America/New_York",
    "raleigh": "America/New_York", "baltimore": "America/New_York",
    "buffalo": "America/New_York", "cleveland": "America/New_York",
    "pittsburgh": "America/New_York", "detroit": "America/New_York",
    "columbus": "America/New_York", "cincinnati": "America/New_York",
    "indianapolis": "America/Indiana/Indianapolis",
    "chicago": "America/Chicago", "houston": "America/Chicago",
    "dallas": "America/Chicago", "austin": "America/Chicago",
    "sanantonio": "America/Chicago", "nashville": "America/Chicago",
    "memphis": "America/Chicago", "neworleans": "America/Chicago",
    "minneapolis": "America/Chicago", "stlouis": "America/Chicago",
    "kansascity": "America/Chicago", "milwaukee": "America/Chicago",
    "denver": "America/Denver", "saltlakecity": "America/Denver",
    "phoenix": "America/Phoenix",
    "losangeles": "America/Los_Angeles", "sanfrancisco": "America/Los_Angeles",
    "sandiego": "America/Los_Angeles", "sanjose": "America/Los_Angeles",
    "oakland": "America/Los_Angeles",
    "sacramento": "America/Los_Angeles", "seattle": "America/Los_Angeles",
    "portland": "America/Los_Angeles", "lasvegas": "America/Los_Angeles",
    "anchorage": "America/Anchorage", "honolulu": "Pacific/Honolulu",
    /* Canada */
    "toronto": "America/Toronto", "ottawa": "America/Toronto",
    "montreal": "America/Toronto", "vancouver": "America/Vancouver",
    "calgary": "America/Edmonton", "edmonton": "America/Edmonton",
    /* Europe */
    "london": "Europe/London", "manchester": "Europe/London",
    "edinburgh": "Europe/London", "dublin": "Europe/Dublin",
    "paris": "Europe/Paris", "berlin": "Europe/Berlin",
    "frankfurt": "Europe/Berlin", "munich": "Europe/Berlin",
    "hamburg": "Europe/Berlin", "madrid": "Europe/Madrid",
    "barcelona": "Europe/Madrid", "rome": "Europe/Rome",
    "milan": "Europe/Rome", "amsterdam": "Europe/Amsterdam",
    "brussels": "Europe/Brussels", "vienna": "Europe/Vienna",
    "zurich": "Europe/Zurich", "stockholm": "Europe/Stockholm",
    "oslo": "Europe/Oslo", "copenhagen": "Europe/Copenhagen",
    "helsinki": "Europe/Helsinki", "lisbon": "Europe/Lisbon",
    "prague": "Europe/Prague", "warsaw": "Europe/Warsaw",
    "budapest": "Europe/Budapest", "athens": "Europe/Athens",
    "istanbul": "Europe/Istanbul", "moscow": "Europe/Moscow",
    /* Asia */
    "tokyo": "Asia/Tokyo", "osaka": "Asia/Tokyo", "kyoto": "Asia/Tokyo",
    "seoul": "Asia/Seoul", "beijing": "Asia/Shanghai",
    "shanghai": "Asia/Shanghai", "shenzhen": "Asia/Shanghai",
    "guangzhou": "Asia/Shanghai", "hangzhou": "Asia/Shanghai",
    "nanjing": "Asia/Shanghai", "chengdu": "Asia/Shanghai",
    "wuhan": "Asia/Shanghai", "xian": "Asia/Shanghai",
    "hongkong": "Asia/Hong_Kong", "macau": "Asia/Macau",
    "taipei": "Asia/Taipei", "singapore": "Asia/Singapore",
    "bangkok": "Asia/Bangkok", "jakarta": "Asia/Jakarta",
    "kualalumpur": "Asia/Kuala_Lumpur", "manila": "Asia/Manila",
    "hanoi": "Asia/Bangkok", "hochiminh": "Asia/Ho_Chi_Minh",
    "mumbai": "Asia/Kolkata", "delhi": "Asia/Kolkata",
    "newdelhi": "Asia/Kolkata", "bangalore": "Asia/Kolkata",
    "dubai": "Asia/Dubai", "riyadh": "Asia/Riyadh",
    "telaviv": "Asia/Jerusalem", "jerusalem": "Asia/Jerusalem",
    /* Oceania */
    "sydney": "Australia/Sydney", "melbourne": "Australia/Melbourne",
    "brisbane": "Australia/Brisbane", "perth": "Australia/Perth",
    "auckland": "Pacific/Auckland", "wellington": "Pacific/Auckland",
    /* Americas (South / Central) */
    "saopaulo": "America/Sao_Paulo", "riodejaneiro": "America/Sao_Paulo",
    "buenosaires": "America/Argentina/Buenos_Aires",
    "santiago": "America/Santiago", "lima": "America/Lima",
    "bogota": "America/Bogota", "mexicocity": "America/Mexico_City",
    "caracas": "America/Caracas",
    /* Africa */
    "cairo": "Africa/Cairo", "johannesburg": "Africa/Johannesburg",
    "capetown": "Africa/Johannesburg", "lagos": "Africa/Lagos",
    "nairobi": "Africa/Nairobi", "casablanca": "Africa/Casablanca"
  };

  function normalizeKey(text) {
    return text.toLowerCase().replace(/[\s.\-_]/g, "");
  }

  var MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  var input, searchBtn, messageEl, resultEl;
  var timeEl, ampmEl, cityEl, dateEl, weekdayEl, zoneEl;
  var timer = null;
  var requestId = 0;

  function hasCJK(text) {
    return /[\u3400-\u9fff]/.test(text);
  }

  /* Build the list of candidate queries to try */
  function buildCandidates(raw) {
    if (hasCJK(raw)) {
      var cjkZone = CJK_ZONES[raw];
      return cjkZone ? [cjkZone] : [raw];
    }

    var key = normalizeKey(raw);
    // Known city → use its IANA zone directly (UAPI's city table is sparse)
    if (CITY_ZONES[key]) return [CITY_ZONES[key]];

    var list = [raw];
    var compact = raw.replace(/\s+/g, "");
    if (compact !== raw) list.push(compact);
    return list;
  }

  /* Friendly label for the result (the API echoes the zone when
     we query by IANA ID, which isn't a city name) */
  function displayName(raw) {
    if (hasCJK(raw)) return raw;
    if (CITY_ZONES[normalizeKey(raw)]) {
      return raw.replace(/\s+/g, " ").replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
    }
    return raw;
  }

  function showMessage(text, kind) {
    messageEl.textContent = text || "";
    messageEl.className = "weather-message" + (kind ? " " + kind : "");
  }

  function stopClock() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function renderClock(offsetSeconds) {
    // Epoch now + zone offset → read via getUTC* for the zone's wall clock
    var d = new Date(Date.now() + offsetSeconds * 1000);
    var h24 = d.getUTCHours();
    var h12 = h24 % 12 || 12;
    var ampm = h24 >= 12 ? "PM" : "AM";

    timeEl.textContent = h12 + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds());
    ampmEl.textContent = ampm;
    dateEl.textContent = MONTHS[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear();
    weekdayEl.textContent = DAYS[d.getUTCDay()];
  }

  async function fetchTime(cityQuery) {
    var res = await fetch(
      API_URL + "?city=" + encodeURIComponent(cityQuery),
      { headers: { Accept: "application/json" } }
    );
    var data = await res.json().catch(function () { return null; });
    if (res.status === 429) return { rateLimited: true };
    if (!res.ok || !data || data.error) return null;
    return data;
  }

  async function search() {
    var raw = input.value.trim();
    if (!raw) {
      stopClock();
      resultEl.hidden = true;
      showMessage("Enter a city first.", "error");
      return;
    }

    var myId = ++requestId;
    stopClock();
    resultEl.hidden = true;
    showMessage("Loading…", "loading");
    searchBtn.disabled = true;

    try {
      var candidates = buildCandidates(raw);
      var data = null;
      var rateLimited = false;
      for (var i = 0; i < candidates.length; i++) {
        var result = await fetchTime(candidates[i]);
        if (result && result.rateLimited) { rateLimited = true; break; }
        if (result) { data = result; break; }
      }

      if (myId !== requestId) return; // a newer search superseded this one

      if (rateLimited) {
        showMessage("Too many searches right now — please wait a moment and try again.", "error");
        return;
      }

      if (!data) {
        showMessage("Couldn't find that city — check the spelling.", "error");
        return;
      }

      // Cities we resolved via the map show the user's own input
      cityEl.textContent = displayName(raw);
      zoneEl.textContent = data.timezone + " · " + data.offset_string;

      renderClock(data.offset_seconds);
      timer = setInterval(function () { renderClock(data.offset_seconds); }, 1000);

      showMessage("", "");
      resultEl.hidden = false;
    } catch (err) {
      if (myId !== requestId) return;
      showMessage("Couldn't reach the world time service. Try again in a moment.", "error");
    } finally {
      if (myId === requestId) searchBtn.disabled = false;
    }
  }

  function init() {
    input = document.getElementById("worldtime-input");
    searchBtn = document.getElementById("worldtime-search");
    messageEl = document.getElementById("worldtime-message");
    resultEl = document.getElementById("worldtime-result");
    timeEl = document.getElementById("wt-time");
    ampmEl = document.getElementById("wt-ampm");
    cityEl = document.getElementById("wt-city");
    dateEl = document.getElementById("wt-date");
    weekdayEl = document.getElementById("wt-weekday");
    zoneEl = document.getElementById("wt-zone");

    if (!input || !searchBtn) return; // not on this page

    searchBtn.addEventListener("click", search);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") search();
    });
  }

  init();
})();
