const $ = (id) => document.getElementById(id);

let syncedAtMs = 0;
let syncedBrowserMs = 0;
let dotsYear = 0;
let dotCount = 0;
const DOT_TOTAL = 48;

const text = {
  year: "\u5e74\u5ea6",
  timeSource: "\u65f6\u95f4\u6e90",
  quoteSource: "\u540d\u8a00\u6e90",
  localTimeSource: "\u672c\u5730\u5b9e\u65f6\u515c\u5e95",
  fallbackQuote: "\u5c71\u91cd\u6c34\u590d\u7591\u65e0\u8def\uff0c\u67f3\u6697\u82b1\u660e\u53c8\u4e00\u6751\u3002",
  fallbackAuthor: "\u9646\u6e38",
  offline: "\u7f51\u7edc\u8fde\u63a5\u6682\u4e0d\u53ef\u7528\uff0c\u5df2\u542f\u7528\u672c\u5730\u5b9e\u65f6\u515c\u5e95",
};

const fallbackQuotes = [
  {
    content: "\u8def\u867d\u8fdc\uff0c\u884c\u5219\u5c06\u81f3\uff1b\u4e8b\u867d\u96be\uff0c\u505a\u5219\u5fc5\u6210\u3002",
    author: "\u300a\u8340\u5b50\u300b",
  },
  {
    content: "\u535a\u89c2\u800c\u7ea6\u53d6\uff0c\u539a\u79ef\u800c\u8584\u53d1\u3002",
    author: "\u82cf\u8f7c",
  },
  {
    content: "\u5c71\u91cd\u6c34\u590d\u7591\u65e0\u8def\uff0c\u67f3\u6697\u82b1\u660e\u53c8\u4e00\u6751\u3002",
    author: "\u9646\u6e38",
  },
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function nowFromSync() {
  if (!syncedAtMs) return new Date();
  return new Date(syncedAtMs + (performance.now() - syncedBrowserMs));
}

function computeProgress(date) {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1, 0, 0, 0);
  const end = new Date(year + 1, 0, 1, 0, 0, 0);
  const dayStart = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date - dayStart) / 86400000) + 1;
  const daysTotal = Math.round((end - start) / 86400000);

  return {
    year,
    percent: ((date - start) / (end - start)) * 100,
    dayOfYear,
    daysTotal,
    daysRemaining: daysTotal - dayOfYear,
  };
}

function buildYearDots() {
  const dots = $("yearDots");
  if (!dots || dotCount === DOT_TOTAL) return;

  dotCount = DOT_TOTAL;
  dots.innerHTML = "";

  for (let index = 0; index < DOT_TOTAL; index += 1) {
    const dot = document.createElement("span");
    dot.className = "year-dot";
    dot.style.setProperty("--dot-index", index);
    dots.appendChild(dot);
  }
}

function renderDots(progress) {
  const dots = $("yearDots");
  if (!dots) return;

  if (dotsYear !== progress.year) {
    dotsYear = progress.year;
    buildYearDots();
  }

  const activeCount = Math.max(1, Math.ceil((progress.percent / 100) * DOT_TOTAL));
  [...dots.children].forEach((dot, index) => {
    const isActive = index < activeCount;
    const isCurrent = index === activeCount - 1;
    const isNext = index >= activeCount && index < activeCount + 8;
    dot.classList.toggle("is-active", isActive);
    dot.classList.toggle("is-current", isCurrent);
    dot.classList.toggle("is-next", isNext);
  });
}

function render() {
  const date = nowFromSync();
  const progress = computeProgress(date);

  $("clock").textContent = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  $("date").textContent = `${date.getFullYear()}\u5e74${pad(date.getMonth() + 1)}\u6708${pad(date.getDate())}\u65e5`;
  $("yearLabel").textContent = `${text.year} ${progress.year}`;
  $("percent").textContent = `${progress.percent.toFixed(4)}%`;
  $("progressFill").style.width = `${Math.min(progress.percent, 100)}%`;
  $("dayOfYear").textContent = progress.dayOfYear;
  $("daysTotal").textContent = progress.daysTotal;
  $("daysRemaining").textContent = progress.daysRemaining;
  $("heroYear").textContent = progress.year;
  $("heroDay").textContent = progress.dayOfYear;
  $("heroTotal").textContent = progress.daysTotal;
  $("heroPercent").textContent = `${progress.percent.toFixed(1)}%`;
  renderDots(progress);
}

function setSyncedTime(isoTime) {
  syncedAtMs = new Date(isoTime).getTime();
  syncedBrowserMs = performance.now();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function fetchInternetTime() {
  const sources = [
    async () => {
      const data = await fetchJson("https://worldtimeapi.org/api/ip");
      return {
        iso: data.datetime || data.utc_datetime,
        timezone: data.timezone || "\u4e92\u8054\u7f51\u65f6\u95f4",
        source: "worldtimeapi.org",
      };
    },
    async () => {
      const data = await fetchJson("https://timeapi.io/api/Time/current/ip?ipAddress=");
      return {
        iso: data.dateTime,
        timezone: data.timeZone || "\u4e92\u8054\u7f51\u65f6\u95f4",
        source: "timeapi.io",
      };
    },
  ];

  for (const source of sources) {
    try {
      const result = await source();
      if (result.iso) return result;
    } catch (error) {
      continue;
    }
  }

  return {
    iso: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || text.localTimeSource,
    source: text.localTimeSource,
  };
}

async function fetchChineseQuote() {
  const sources = [
    async () => {
      const data = await fetchJson("https://v1.hitokoto.cn/?c=i&encode=json");
      return {
        content: data.hitokoto,
        author: data.from_who || data.from || "\u4f5a\u540d",
        source: "\u4e00\u8a00",
      };
    },
    async () => {
      const data = await fetchJson("https://v1.hitokoto.cn/?c=d&encode=json");
      return {
        content: data.hitokoto,
        author: data.from_who || data.from || "\u4f5a\u540d",
        source: "\u4e00\u8a00",
      };
    },
  ];

  for (const source of sources) {
    try {
      const result = await source();
      if (result.content) return result;
    } catch (error) {
      continue;
    }
  }

  const quote = fallbackQuotes[new Date().getDate() % fallbackQuotes.length];
  return { ...quote, source: "\u672c\u5730\u4e2d\u6587\u515c\u5e95" };
}

async function syncStatus() {
  const [timePayload, quotePayload] = await Promise.all([
    fetchInternetTime(),
    fetchChineseQuote(),
  ]);

  setSyncedTime(timePayload.iso);
  $("quote").textContent = `\u201c${quotePayload.content}\u201d`;
  $("author").textContent = `- ${quotePayload.author}`;
  $("timezone").textContent = timePayload.timezone;
  $("source").textContent = `${text.timeSource}\uff1a${timePayload.source} / ${text.quoteSource}\uff1a${quotePayload.source}`;
  render();
}

syncStatus().catch(() => {
  setSyncedTime(new Date().toISOString());
  $("quote").textContent = `\u201c${text.fallbackQuote}\u201d`;
  $("author").textContent = `- ${text.fallbackAuthor}`;
  $("timezone").textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || text.localTimeSource;
  $("source").textContent = text.offline;
  render();
});

setInterval(render, 250);
setInterval(syncStatus, 60 * 1000);
