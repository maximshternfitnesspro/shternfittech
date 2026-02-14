const STORAGE_KEY = "cc_state_v2";
const HYDRATION_TARGET_ML = 2500;
const GLASS_ML = 250;
const SUBSCRIPTION_DAYS = 30;
const LEVEL_UNLOCK_HOUR = 7;
const LEVEL_UNLOCK_TZ_LABEL = "МСК";
const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;
const PAYMENT_STATUS_POLL_MS = 15000;
const ONBOARDING_VERSION = 5;
const DEMO_LEVEL_CAP = 3;
const ALWAYS_SHOW_ONBOARDING = true;
const TIER_RANK = { DEMO: 0, CORE: 1, BOOST: 2, ELITE: 3 };
const STARTUP_SCREEN = (() => {
  const raw = new URLSearchParams(window.location.search).get("screen");
  const allowed = new Set(["home", "mission", "progress", "shop", "subscription", "settings"]);
  return raw && allowed.has(raw) ? raw : null;
})();

const TRIBUTE_PAYMENT_LINKS = {
  CORE: {
    telegram: "https://t.me/tribute/app?startapp=sNQO",
    web: "https://web.tribute.tg/s/NQO",
  },
  BOOST: {
    telegram: "https://t.me/tribute/app?startapp=sNQP",
    web: "https://web.tribute.tg/s/NQP",
  },
  ELITE: {
    telegram: "https://t.me/tribute/app?startapp=sNQQ",
    web: "https://web.tribute.tg/s/NQQ",
  },
};

const DEFAULT_STATE = {
  level: 1,
  chips: 0,
  syncSeries: 0,
  subscription: "DEMO",
  window: "19:30–22:30",
  mode: "Перезапуск",
  homeDetailsOpen: false,
  botMenuSent: false,
  sideQuestDone: false,
  modifier: "Не активен",
  completedHistory: [],
  purchases: {},
  onboardingDone: false,
  onboardingVersionSeen: 0,
  tourDone: false,
  remindersEnabled: true,
  currentLevelPassed: false,
  nextUnlockAt: null,
  subscriptionStartedAt: null,
  pendingUpgrade: null,
  quick: {
    hydrationMl: 1200,
  },
};

const MISSION_NAMES = [
  "Инициация",
  "Разгрузка шеи",
  "Импульс",
  "Открыть грудной отдел",
  "Тихий режим",
  "Лестничный маршрут",
  "Босс: Инициация",
  "Городской импульс",
  "Таз и бедра",
  "Кухонный сет",
  "Спина и поясница",
  "Ночной сброс",
  "Пульс города",
  "Босс: Разгон",
  "Марш-бросок",
  "Плечи и лопатки",
  "Силовой контур",
  "Ноги и икры",
  "Медленный режим",
  "Контур без прыжков",
  "Босс: Сжигание",
  "Финишный импульс",
  "Дыхание + спина",
  "Рестарт",
  "Комбо 15",
  "Шея + таз",
  "Городской круг",
  "Стабилизация",
  "Подготовка к финалу",
  "Босс: Контроль",
];

const MODIFIERS = ["Синхро-щит", "Ускорение", "Двойной бонус окна", "Стабилизация"];

const screens = document.querySelectorAll("[data-screen]");
const navButtons = document.querySelectorAll("[data-nav]");

const ctaStart = document.getElementById("cta-start");
const moduleSwitchBtn = document.getElementById("module-switch-btn");
const sideQuestBtn = document.getElementById("sidequest-btn");
const resultNextBtn = document.getElementById("result-next");

const missionStartBtn = document.getElementById("mission-start");
const missionWatchFill = document.getElementById("mission-watch-fill");

const shopButtons = document.querySelectorAll(".shop-buy");
const shopPreviewButtons = document.querySelectorAll(".shop-preview");
const shopMessage = document.getElementById("shop-message");

const bootScreen = document.getElementById("boot-screen");
const bootFill = document.getElementById("boot-fill");
const bootPercent = document.getElementById("boot-percent");
const bootMeta = document.getElementById("boot-meta");

const onboarding = document.getElementById("onboarding");
const onboardingScreens = document.querySelectorAll("[data-onboarding-step]");
const onboardingLabel = document.getElementById("onboarding-step-label");
const onboardingBack = document.getElementById("onboarding-back");
const onboardingNext = document.getElementById("onboarding-next");
const onboardingFinish = document.getElementById("onboarding-finish");
const onboardingActions = document.querySelector(".onboarding__actions");
const modeButtons = document.querySelectorAll("[data-mode]");
const windowButtons = document.querySelectorAll("[data-window]");

const layout = document.querySelector(".layout");
const hudLevel = document.getElementById("hud-level");
const hudTier = document.getElementById("hud-tier");
const hudFill = document.getElementById("hud-fill");
const hudMeta = document.getElementById("hud-meta");
const hudTitle = document.querySelector(".hud__title");
const hudNet = document.getElementById("hud-net");
const modeSwitch = document.querySelector(".mode-switch");
const sidebarPlan = document.getElementById("sidebar-plan");
const sidebarUpgradeBtn = document.getElementById("sidebar-upgrade-btn");
const sidebarUpgradeBenefits = document.getElementById("sidebar-upgrade-benefits");
const sidebarSubscriptionTerm = document.getElementById("sidebar-subscription-term");

const homeLevelChip = document.getElementById("home-level-chip");
const homeMissionTitle = document.getElementById("home-mission-title");
const homeMissionMeta = document.getElementById("home-mission-meta");
const homeSyncSeries = document.getElementById("home-sync-series");
const homeWindow = document.getElementById("home-window");
const sideQuestStatus = document.getElementById("sidequest-status");
const homeBonus = document.getElementById("home-bonus");
const homeAccessRule = document.getElementById("home-access-rule");
const homeDemoNote = document.getElementById("home-demo-note");
const homePaywallBlock = document.getElementById("home-paywall-block");
const homePaywallBtn = document.getElementById("home-paywall-btn");
const homeDetails = document.getElementById("home-details");
const homeDetailsToggle = document.getElementById("home-details-toggle");
const homeWindowDetails = document.getElementById("home-window-details");
const homeBonusDetails = document.getElementById("home-bonus-details");

const missionPanelTitle = document.getElementById("mission-panel-title");

const progressRing = document.getElementById("progress-ring");
const progressLevel = document.getElementById("progress-level");
const progressSyncSeries = document.getElementById("progress-sync-series");
const progressChips = document.getElementById("progress-chips");
const progressBoss = document.getElementById("progress-boss");
const progressLog = document.getElementById("progress-log");
const progressPaywallBlock = document.getElementById("progress-paywall-block");
const progressPaywallBtn = document.getElementById("progress-paywall-btn");
const progressShareBtn = document.getElementById("progress-share-btn");

const resultMainReward = document.getElementById("result-main-reward");
const resultBonusReward = document.getElementById("result-bonus-reward");
const resultBurst = document.getElementById("result-burst");
const resultTotal = document.getElementById("result-total");
const resultUnlockNote = document.getElementById("result-unlock-note");

const shopBalance = document.getElementById("shop-balance");
const modifierValue = document.getElementById("modifier-value");
const bossBanner = document.getElementById("boss-banner");
const arsenalWindow = document.getElementById("arsenal-window");
const arsenalChips = document.getElementById("arsenal-chips");
const arsenalModuleBtn = document.getElementById("arsenal-module-btn");

const energyBar = document.getElementById("energy-bar");
const energyValue = document.getElementById("energy-value");
const hydrationBar = document.getElementById("hydration-bar");
const hydrationValue = document.getElementById("hydration-value");

const hydrationInput = document.getElementById("hydration-input");
const hydrationFill = document.getElementById("hydration-fill");
const hydrationMeta = document.getElementById("hydration-meta");
const missionAvailability = document.getElementById("mission-availability");

const settingsRemindersBtn = document.getElementById("settings-reminders-btn");
const settingsWindowVal = document.getElementById("settings-window-val");
const settingsResetMission = document.getElementById("settings-reset-mission");
const settingsTourBtn = document.getElementById("settings-tour-btn");
const settingsBotMenuBtn = document.getElementById("settings-bot-menu-btn");
const settingsEffectsVal = document.getElementById("settings-effects-val");
const subscriptionCurrentChip = document.getElementById("subscription-current-chip");
const subscriptionHeadline = document.getElementById("subscription-headline");
const subscriptionPending = document.getElementById("subscription-pending");
const subscriptionPendingText = document.getElementById("subscription-pending-text");
const subscriptionCheckBtn = document.getElementById("subscription-check-btn");
const subscriptionResendBtn = document.getElementById("subscription-resend-btn");
const upgradeCoreBtn = document.getElementById("upgrade-core-btn");
const upgradeBoostBtn = document.getElementById("upgrade-boost-btn");
const upgradeEliteBtn = document.getElementById("upgrade-elite-btn");
const modulesModal = document.getElementById("modules-modal");
const modulesModalClose = document.getElementById("modules-modal-close");
const modulesModalBackdrop = document.getElementById("modules-modal-backdrop");
const demoPaywall = document.getElementById("demo-paywall");
const demoPaywallBackdrop = document.getElementById("demo-paywall-backdrop");
const demoPaywallClose = document.getElementById("demo-paywall-close");
const demoPaywallOpenBtn = document.getElementById("demo-paywall-open-btn");
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileDrawer = document.getElementById("mobile-drawer");
const mobileDrawerBackdrop = document.getElementById("mobile-drawer-backdrop");
const mobileDrawerClose = document.getElementById("mobile-drawer-close");
const tourOverlay = document.getElementById("tour-overlay");
const tourShadeTop = document.getElementById("tour-shade-top");
const tourShadeLeft = document.getElementById("tour-shade-left");
const tourShadeRight = document.getElementById("tour-shade-right");
const tourShadeBottom = document.getElementById("tour-shade-bottom");
const tourSpotlight = document.getElementById("tour-spotlight");
const tourStep = document.getElementById("tour-step");
const tourTitle = document.getElementById("tour-title");
const tourText = document.getElementById("tour-text");
const tourNextBtn = document.getElementById("tour-next-btn");
const tourSkipBtn = document.getElementById("tour-skip-btn");

const motifReady = Boolean(
  layout &&
    bootScreen &&
    hudLevel &&
    homeLevelChip &&
    missionPanelTitle &&
    progressRing &&
    shopBalance &&
    modifierValue &&
    bossBanner &&
    hydrationInput &&
    settingsRemindersBtn &&
    settingsResetMission,
);

let state = loadState();
let onboardingStep = 1;

const MISSION_TOTAL_SECONDS = 15 * 60;
const DEMO_TICK_MS = 300;
const DEMO_SECONDS_STEP = 18;
let missionRemaining = MISSION_TOTAL_SECONDS;
let missionInterval = null;
let previewTimer = null;
let sfxContext = null;
let sfxUnlocked = false;
let queuedBootClick = false;
let demoPaywallPresented = false;
let onboardingThemePlayed = false;
let cachedTelegramUserId = null;
let paymentStatusTimer = null;
let backendReachable = true;
let statusRequestInFlight = false;
let tourActive = false;
let tourIndex = 0;

const TOUR_STEPS = [
  {
    title: "Запуск миссии",
    text: "Главная кнопка дня: запускает тренировку текущего уровня.",
    prepare: () => {
      closeMobileDrawer();
      state.homeDetailsOpen = false;
      setActiveScreen("home");
    },
    target: () => ctaStart,
  },
  {
    title: "Дополнительное задание",
    text: "Необязательная активность. Даёт модификатор недели.",
    prepare: () => {
      closeMobileDrawer();
      state.homeDetailsOpen = true;
      setActiveScreen("home");
    },
    target: () => sideQuestBtn,
  },
  {
    title: "Подписка",
    text: "Здесь уровень доступа и апгрейд. Оплата идёт через Tribute.",
    prepare: () => {
      closeMobileDrawer();
      setActiveScreen("subscription");
    },
    target: () => upgradeBoostBtn || upgradeCoreBtn,
  },
  {
    title: "Прогресс",
    text: "Следи за закрытыми уровнями, синхронизацией и путём до босса.",
    prepare: () => {
      closeMobileDrawer();
      setActiveScreen("progress");
    },
    target: () => progressRing,
  },
  {
    title: "Готово",
    text: "План простой: 1 уровень в день, стабильный прогресс без перегруза.",
    prepare: () => {
      closeMobileDrawer();
      state.homeDetailsOpen = false;
      setActiveScreen("home");
    },
    target: () => ctaStart,
  },
];

function getTelegramWebApp() {
  return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
}

function triggerHaptic(kind = "soft") {
  const webApp = getTelegramWebApp();
  if (!webApp || !webApp.HapticFeedback) return;
  try {
    if (kind === "success") {
      webApp.HapticFeedback.notificationOccurred("success");
      return;
    }
    if (kind === "error") {
      webApp.HapticFeedback.notificationOccurred("error");
      return;
    }
    if (kind === "heavy") {
      webApp.HapticFeedback.impactOccurred("medium");
      return;
    }
    webApp.HapticFeedback.impactOccurred("light");
  } catch {
    // Ignore haptic API failures in non-Telegram web views.
  }
}

function openExternalLink(url) {
  if (!url) return;
  const webApp = getTelegramWebApp();
  if (webApp) {
    // t.me links should be opened via Telegram API, otherwise iOS may open them in an in-app browser
    // and break the intended "open another Mini App" flow (e.g., Tribute checkout).
    const lowered = String(url).toLowerCase();
    if (
      (lowered.startsWith("https://t.me/") || lowered.startsWith("http://t.me/")) &&
      typeof webApp.openTelegramLink === "function"
    ) {
      webApp.openTelegramLink(url);
      return;
    }
    if (typeof webApp.openLink === "function") {
      webApp.openLink(url, { try_instant_view: false });
      return;
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function buildShareText() {
  const completedLevels = completedLevelsCount();
  const progress =
    state.subscription === "DEMO"
      ? `DEMO ${completedDemoLevels()}/${DEMO_LEVEL_CAP}`
      : `уровни ${completedLevels}/30`;

  const bossReferenceLevel = clamp(state.currentLevelPassed ? state.level + 1 : state.level, 1, 30);
  if (state.subscription === "DEMO") {
    const left = demoLevelsLeft();
    const tail = left > 0 ? `До конца демо: ${formatLevelCount(left)}` : "Демо завершено";
    return `Чит-код на сушку — ${progress}. ${tail}.`;
  }

  const distance = levelsToBoss(bossReferenceLevel);
  const tail = distance > 0 ? `До босса: ${formatLevelCount(distance)}` : "Босс цикла пройден.";
  return `Чит-код на сушку — ${progress}. ${tail}`;
}

async function shareProgress() {
  const shareUrl = "https://t.me/cheatcodewith_bot";
  const text = buildShareText();
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    }
  } catch {
    // Ignore clipboard errors in restrictive webviews.
  }

  const tgShare = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
  openExternalLink(tgShare);
}

function pickPaymentLinkByTier(tier) {
  const entry = TRIBUTE_PAYMENT_LINKS[tier];
  if (!entry) return "";
  const webApp = getTelegramWebApp();
  if (webApp) {
    return entry.telegram || entry.web || "";
  }
  return entry.web || entry.telegram || "";
}

function normalizeTier(value) {
  if (!value) return null;
  const tier = String(value).trim().toUpperCase();
  return TIER_RANK[tier] !== undefined ? tier : null;
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getTelegramInitData() {
  const webApp = getTelegramWebApp();
  if (webApp && typeof webApp.initData === "string" && webApp.initData.trim()) {
    return webApp.initData;
  }

  // Some WebViews expose initData as tgWebAppData in URL hash/query.
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("tgWebAppData") || params.get("init_data");
  if (fromQuery) {
    return safeDecodeURIComponent(fromQuery);
  }

  const hash = window.location.hash || "";
  const match = hash.match(/(?:^|[#&])tgWebAppData=([^&]+)/);
  if (match && match[1]) {
    return safeDecodeURIComponent(match[1]);
  }

  return "";
}

function getTelegramUserId() {
  if (cachedTelegramUserId) return cachedTelegramUserId;

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("tg_user_id");
  if (fromQuery && /^\d+$/.test(fromQuery)) {
    cachedTelegramUserId = fromQuery;
    return cachedTelegramUserId;
  }

  const webApp = getTelegramWebApp();
  const fromTelegram = webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user ? webApp.initDataUnsafe.user.id : null;
  if (fromTelegram && String(fromTelegram).trim()) {
    cachedTelegramUserId = String(fromTelegram);
    return cachedTelegramUserId;
  }

  return null;
}

function applyConfirmedTier(tier) {
  const confirmedTier = normalizeTier(tier);
  if (!confirmedTier) return false;
  if (TIER_RANK[confirmedTier] <= TIER_RANK[state.subscription]) {
    return false;
  }

  const previous = state.subscription;
  const nowIso = new Date().toISOString();
  state.subscription = confirmedTier;
  if (confirmedTier === "CORE" || confirmedTier === "BOOST") {
    state.subscriptionStartedAt = nowIso;
  }
  state.pendingUpgrade = null;

  if (previous === "DEMO" && state.level >= DEMO_LEVEL_CAP && state.currentLevelPassed && !state.nextUnlockAt) {
    state.nextUnlockAt = getNextUnlockDate().toISOString();
  }

  return true;
}

async function markPendingUpgradeRemote(tier, { resend = false } = {}) {
  const tgUserId = getTelegramUserId();
  const initData = getTelegramInitData();
  if (!tgUserId && !initData) return;

  const headers = { "Content-Type": "application/json" };
  if (initData) headers["X-Tg-Init-Data"] = initData;

  const payload = tgUserId ? { tg_user_id: tgUserId, tier } : { tier };
  if (resend) payload.resend = true;
  const response = await fetch("/api/access/pending", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`pending_status_${response.status}`);
  backendReachable = true;
}

async function sendBotMenuRemote() {
  const tgUserId = getTelegramUserId();
  const initData = getTelegramInitData();
  if (!tgUserId && !initData) return false;

  const headers = { "Content-Type": "application/json" };
  if (initData) headers["X-Tg-Init-Data"] = initData;
  const payload = tgUserId ? { tg_user_id: tgUserId } : {};

  const response = await fetch("/api/bot/menu", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`bot_menu_${response.status}`);
  const data = await response.json().catch(() => ({}));
  return Boolean(data && data.ok);
}

async function maybeSendBotMenu({ force = false } = {}) {
  if (state.botMenuSent && !force) return false;
  try {
    const ok = await sendBotMenuRemote();
    if (ok) {
      state.botMenuSent = true;
      saveState();
    }
    return ok;
  } catch {
    return false;
  }
}

function applyAccessStatus(status, { manual = false } = {}) {
  if (!status || typeof status !== "object") return;

  const remoteTier = normalizeTier(status.tier);
  const remotePendingTier = normalizeTier(status.pending_tier);
  let changed = false;

  if (remoteTier && applyConfirmedTier(remoteTier)) {
    changed = true;
    if (shopMessage) {
      shopMessage.textContent = `Оплата подтверждена. Уровень ${remoteTier} активирован.`;
    }
    triggerHaptic("success");
  }

  if (remotePendingTier) {
    const currentPending = getPendingUpgradeTier();
    if (currentPending !== remotePendingTier) {
      state.pendingUpgrade = {
        tier: remotePendingTier,
        createdAt: status.pending_since || new Date().toISOString(),
      };
      changed = true;
    }
  } else {
    const localPending = getPendingUpgradeTier();
    if (localPending && remoteTier && TIER_RANK[remoteTier] >= TIER_RANK[localPending]) {
      state.pendingUpgrade = null;
      changed = true;
    }
  }

  if (changed) {
    saveState();
    render();
    return;
  }

  if (manual && shopMessage) {
    if (getPendingUpgradeTier()) {
      shopMessage.textContent = "Оплата ещё не подтверждена. Заверши платёж в Tribute и проверь снова.";
    } else {
      shopMessage.textContent = `Текущий уровень: ${state.subscription}. Новых оплат не найдено.`;
    }
  }
}

async function checkAccessStatus({ manual = false, refresh = false } = {}) {
  const tgUserId = getTelegramUserId();
  const initData = getTelegramInitData();
  const hasInitData = Boolean(initData && String(initData).trim());

  if (!tgUserId && !hasInitData) {
    if (manual && shopMessage) {
      shopMessage.textContent = "Проверка оплаты доступна только внутри Telegram Mini App.";
    }
    return;
  }
  if (statusRequestInFlight) return;
  if (!manual && !backendReachable) return;

  const wasReachable = backendReachable;
  statusRequestInFlight = true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);
  try {
    const shouldRefresh = manual || refresh;
    const url = hasInitData
      ? `/api/access/status?refresh=${shouldRefresh ? "1" : "0"}`
      : `/api/access/status?tg_user_id=${encodeURIComponent(tgUserId)}&refresh=${shouldRefresh ? "1" : "0"}`;
    const headers = hasInitData ? { "X-Tg-Init-Data": initData } : undefined;

    const response = await fetch(url, {
      signal: controller.signal,
      headers,
    });
    if (!response.ok) throw new Error(`status_http_${response.status}`);
    const payload = await response.json();
    backendReachable = true;
    applyAccessStatus(payload, { manual });
    if (!wasReachable) {
      try {
        render();
      } catch {}
    }
  } catch (error) {
    backendReachable = false;
    if (manual && shopMessage) {
      shopMessage.textContent = "Сервер проверки оплаты недоступен. Повтори попытку позже.";
    }
    if (wasReachable) {
      try {
        render();
      } catch {}
    }
  } finally {
    clearTimeout(timeoutId);
    statusRequestInFlight = false;
  }
}

function startAccessPolling() {
  if (paymentStatusTimer) clearInterval(paymentStatusTimer);
  paymentStatusTimer = setInterval(() => {
    const pendingTier = getPendingUpgradeTier();
    // While waiting for payment, periodically refresh using membership-based sync (if available).
    // This removes the need for the user to manually press "Проверить оплату" after checkout.
    checkAccessStatus({ manual: false, refresh: Boolean(pendingTier) });
  }, PAYMENT_STATUS_POLL_MS);
}

function getSfxContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sfxContext) sfxContext = new Ctx();
  return sfxContext;
}

function playTone(ctx, { start, duration, freq, toFreq, gain, type }) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, start);
  if (toFreq) oscillator.frequency.exponentialRampToValueAtTime(toFreq, start + duration);
  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function unlockSfxContext() {
  const ctx = getSfxContext();
  if (!ctx) return;
  if (ctx.state !== "suspended") {
    sfxUnlocked = true;
    return;
  }
  ctx
    .resume()
    .then(() => {
      sfxUnlocked = true;
      if (queuedBootClick) {
        queuedBootClick = false;
        playBootClick();
      }
    })
    .catch(() => {});
}

function playBootClick() {
  const ctx = getSfxContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    queuedBootClick = true;
    return;
  }
  const start = ctx.currentTime + 0.01;
  playTone(ctx, { start, duration: 0.08, freq: 900, toFreq: 560, gain: 0.055, type: "square" });
  playTone(ctx, { start: start + 0.015, duration: 0.12, freq: 280, toFreq: 200, gain: 0.04, type: "triangle" });
}

function playStartClick() {
  const ctx = getSfxContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx
      .resume()
      .then(() => playStartClick())
      .catch(() => {});
    return;
  }
  const start = ctx.currentTime + 0.01;
  playTone(ctx, { start, duration: 0.07, freq: 640, toFreq: 880, gain: 0.05, type: "sawtooth" });
  playTone(ctx, { start: start + 0.05, duration: 0.09, freq: 880, toFreq: 1120, gain: 0.045, type: "square" });
}

function playUiClick(kind = "default") {
  const ctx = getSfxContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx
      .resume()
      .then(() => playUiClick(kind))
      .catch(() => {});
    return;
  }

  const start = ctx.currentTime + 0.008;
  if (kind === "nav") {
    playTone(ctx, { start, duration: 0.05, freq: 560, toFreq: 480, gain: 0.026, type: "triangle" });
    return;
  }
  if (kind === "primary") {
    playTone(ctx, { start, duration: 0.06, freq: 420, toFreq: 610, gain: 0.036, type: "sawtooth" });
    playTone(ctx, { start: start + 0.035, duration: 0.05, freq: 760, toFreq: 980, gain: 0.026, type: "square" });
    return;
  }
  if (kind === "ghost") {
    playTone(ctx, { start, duration: 0.045, freq: 700, toFreq: 620, gain: 0.022, type: "triangle" });
    return;
  }
  if (kind === "upgrade") {
    playTone(ctx, { start, duration: 0.06, freq: 380, toFreq: 540, gain: 0.038, type: "square" });
    playTone(ctx, { start: start + 0.045, duration: 0.07, freq: 680, toFreq: 980, gain: 0.034, type: "sawtooth" });
    return;
  }
  if (kind === "mode") {
    playTone(ctx, { start, duration: 0.05, freq: 510, toFreq: 760, gain: 0.03, type: "triangle" });
    playTone(ctx, { start: start + 0.03, duration: 0.04, freq: 880, toFreq: 740, gain: 0.018, type: "square" });
    return;
  }
  if (kind === "danger") {
    playTone(ctx, { start, duration: 0.08, freq: 220, toFreq: 160, gain: 0.028, type: "sawtooth" });
    return;
  }

  playTone(ctx, { start, duration: 0.05, freq: 620, toFreq: 700, gain: 0.024, type: "triangle" });
}

function playOnboardingTheme() {
  if (onboardingThemePlayed) return;
  const ctx = getSfxContext();
  if (!ctx) return;

  const runTheme = () => {
    onboardingThemePlayed = true;
    const start = ctx.currentTime + 0.02;
    const notes = [
      [0.0, 523],
      [0.11, 659],
      [0.22, 784],
      [0.35, 659],
      [0.5, 880],
      [0.65, 784],
      [0.8, 659],
      [0.95, 523],
      [1.12, 392],
      [1.26, 523],
      [1.4, 659],
    ];
    notes.forEach(([offset, freq]) => {
      playTone(ctx, {
        start: start + offset,
        duration: 0.12,
        freq,
        toFreq: freq * 1.015,
        gain: 0.035,
        type: "square",
      });
      playTone(ctx, {
        start: start + offset,
        duration: 0.15,
        freq: Math.max(110, freq / 2),
        toFreq: Math.max(110, (freq / 2) * 1.01),
        gain: 0.016,
        type: "triangle",
      });
    });
  };

  if (ctx.state === "suspended") {
    ctx
      .resume()
      .then(runTheme)
      .catch(() => {});
    return;
  }

  runTheme();
}

function loadState() {
  let raw = null;
  try {
    raw = window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null;
  } catch {
    raw = null;
  }
  const nowIso = new Date().toISOString();
  if (!raw) {
    return {
      ...DEFAULT_STATE,
      completedHistory: defaultHistoryByLevel(DEFAULT_STATE.level),
      subscriptionStartedAt: nowIso,
    };
  }
  try {
    const parsed = JSON.parse(raw);
    const parsedQuick = parsed.quick || {};
    const legacyHydration = Number(parsedQuick.hydration);
    const hydrationMl = Number.isFinite(parsedQuick.hydrationMl)
      ? parsedQuick.hydrationMl
      : Number.isFinite(legacyHydration)
        ? legacyHydration <= 100
          ? Math.round((legacyHydration / 100) * HYDRATION_TARGET_ML)
          : legacyHydration
        : DEFAULT_STATE.quick.hydrationMl;

    const parsedHistory = Array.isArray(parsed.completedHistory) ? parsed.completedHistory : [];
    const parsedNextUnlock = parsed.nextUnlockAt ? new Date(parsed.nextUnlockAt) : null;
    const nextUnlockAt =
      parsedNextUnlock && !Number.isNaN(parsedNextUnlock.getTime()) ? parsedNextUnlock.toISOString() : null;
    const parsedStartedAt = parsed.subscriptionStartedAt ? new Date(parsed.subscriptionStartedAt) : null;
    const subscriptionStartedAt =
      parsedStartedAt && !Number.isNaN(parsedStartedAt.getTime()) ? parsedStartedAt.toISOString() : nowIso;
    const parsedPending = parsed.pendingUpgrade && typeof parsed.pendingUpgrade === "object" ? parsed.pendingUpgrade : null;
    const pendingTier = parsedPending && ["CORE", "BOOST", "ELITE"].includes(parsedPending.tier) ? parsedPending.tier : null;
    const pendingCreatedAt = pendingTier && parsedPending.createdAt ? String(parsedPending.createdAt) : nowIso;

    return {
      ...DEFAULT_STATE,
      ...parsed,
      subscription: parsed.subscription || DEFAULT_STATE.subscription,
      tourDone: Boolean(parsed.tourDone),
      homeDetailsOpen: Boolean(parsed.homeDetailsOpen),
      botMenuSent: Boolean(parsed.botMenuSent),
      completedHistory: parsedHistory.length ? parsedHistory.slice(-8) : defaultHistoryByLevel(parsed.level || DEFAULT_STATE.level),
      currentLevelPassed: Boolean(parsed.currentLevelPassed),
      nextUnlockAt,
      subscriptionStartedAt,
      pendingUpgrade: pendingTier ? { tier: pendingTier, createdAt: pendingCreatedAt } : null,
      quick: {
        hydrationMl: clamp(Math.round(hydrationMl), 0, HYDRATION_TARGET_ML),
      },
    };
  } catch {
    return {
      ...DEFAULT_STATE,
      completedHistory: defaultHistoryByLevel(DEFAULT_STATE.level),
      subscriptionStartedAt: nowIso,
    };
  }
}

function applyDebugStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  let changed = false;

  if (params.get("reset") === "1") {
    const nowIso = new Date().toISOString();
    state = {
      ...DEFAULT_STATE,
      completedHistory: defaultHistoryByLevel(DEFAULT_STATE.level),
      subscriptionStartedAt: nowIso,
    };
    changed = true;
  }

  if (params.get("tour") === "1") {
    state.tourDone = false;
    changed = true;
  }

  const forcedTier = normalizeTier(params.get("tier"));
  if (forcedTier) {
    const nowIso = new Date().toISOString();
    state.subscription = forcedTier;
    state.pendingUpgrade = null;
    if (forcedTier === "CORE" || forcedTier === "BOOST") {
      state.subscriptionStartedAt = nowIso;
    }
    if (forcedTier === "DEMO") {
      state.level = 1;
      state.currentLevelPassed = false;
      state.nextUnlockAt = null;
      state.completedHistory = [];
    }
    changed = true;
  }

  const demoMode = params.get("demo");
  if (demoMode === "end") {
    state.subscription = "DEMO";
    state.level = DEMO_LEVEL_CAP;
    state.currentLevelPassed = true;
    state.nextUnlockAt = null;
    state.syncSeries = Math.max(state.syncSeries, DEMO_LEVEL_CAP);
    state.chips = Math.max(state.chips, 450);
    state.sideQuestDone = false;
    state.modifier = "Не активен";
    state.pendingUpgrade = null;
    state.completedHistory = [
      { level: 1, boss: false, reward: 120 },
      { level: 2, boss: false, reward: 120 },
      { level: 3, boss: false, reward: 120 },
    ];
    changed = true;
  }

  if (changed) saveState();
  return changed;
}

function saveState() {
  try {
    if (window.localStorage) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage может быть недоступен (например, встроенные webview с ограничениями).
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatTimer(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function toMoscowDate(date) {
  return new Date(date.getTime() + MOSCOW_OFFSET_MS);
}

function formatUnlockDate(date) {
  const moscowDate = toMoscowDate(date);
  const day = pad2(moscowDate.getUTCDate());
  const month = pad2(moscowDate.getUTCMonth() + 1);
  const hours = pad2(moscowDate.getUTCHours());
  const minutes = pad2(moscowDate.getUTCMinutes());
  return `${day}.${month} в ${hours}:${minutes} ${LEVEL_UNLOCK_TZ_LABEL}`;
}

function getNextUnlockDate(from = new Date()) {
  const moscowClock = new Date(from.getTime() + MOSCOW_OFFSET_MS);
  moscowClock.setUTCDate(moscowClock.getUTCDate() + 1);
  moscowClock.setUTCHours(LEVEL_UNLOCK_HOUR, 0, 0, 0);
  return new Date(moscowClock.getTime() - MOSCOW_OFFSET_MS);
}

function getSubscriptionInfo() {
  if (state.subscription === "DEMO") {
    return { daysLeft: null, expiresAt: null, expired: false, oneTime: false, demo: true };
  }
  if (state.subscription === "ELITE") {
    return { daysLeft: null, expiresAt: null, expired: false, oneTime: true, demo: false };
  }

  const now = new Date();
  const startedAt = state.subscriptionStartedAt ? new Date(state.subscriptionStartedAt) : now;
  const safeStart = Number.isNaN(startedAt.getTime()) ? now : startedAt;
  const startedDay = startOfDay(safeStart);
  const nowDay = startOfDay(now);
  const elapsedDays = Math.max(0, Math.floor((nowDay.getTime() - startedDay.getTime()) / (24 * 60 * 60 * 1000)));
  const expiresAt = new Date(safeStart);
  expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DAYS);
  const daysLeft = Math.max(0, SUBSCRIPTION_DAYS - elapsedDays);
  const expired = now.getTime() >= expiresAt.getTime();
  return { daysLeft, expiresAt, expired, oneTime: false, demo: false };
}

function completedDemoLevels() {
  return Math.min(completedLevelsCount(), DEMO_LEVEL_CAP);
}

function isDemoFinished() {
  return state.subscription === "DEMO" && completedDemoLevels() >= DEMO_LEVEL_CAP;
}

function demoLevelsLeft() {
  return Math.max(0, DEMO_LEVEL_CAP - completedDemoLevels());
}

function completedLevelsCount() {
  const base = state.level - 1 + (state.currentLevelPassed ? 1 : 0);
  return clamp(base, 0, 30);
}

function syncDailyUnlock() {
  if (!state.currentLevelPassed || !state.nextUnlockAt) return;
  const unlockAt = new Date(state.nextUnlockAt);
  if (Number.isNaN(unlockAt.getTime()) || Date.now() < unlockAt.getTime()) return;

  const levelCap = state.subscription === "DEMO" ? DEMO_LEVEL_CAP : 30;
  if (state.level < levelCap) state.level += 1;
  state.currentLevelPassed = false;
  state.nextUnlockAt = null;
  saveState();
}

function getMissionName(level) {
  return MISSION_NAMES[clamp(level - 1, 0, MISSION_NAMES.length - 1)];
}

function isBossLevel(level) {
  return level === 7 || level === 14 || level === 21 || level === 30;
}

function levelsToBoss(level) {
  const bossLevels = [7, 14, 21, 30];
  const next = bossLevels.find((bossLevel) => bossLevel >= level);
  if (next) return next - level + 1;
  return 0;
}

function formatLevelCount(count) {
  const value = Math.abs(count) % 100;
  const tail = value % 10;
  if (value > 10 && value < 20) return `${count} уровней`;
  if (tail > 1 && tail < 5) return `${count} уровня`;
  if (tail === 1) return `${count} уровень`;
  return `${count} уровней`;
}

function defaultHistoryByLevel(level) {
  const completed = clamp(level - 1, 0, 30);
  const history = [];
  for (let value = Math.max(1, completed - 5); value <= completed; value += 1) {
    history.push({ level: value, boss: isBossLevel(value), reward: isBossLevel(value) ? 300 : 120 });
  }
  return history;
}

function moduleLabel(mode) {
  return `МОДУЛЬ: ${mode.toUpperCase()}`;
}

function nextTier(tier) {
  if (tier === "DEMO") return "CORE";
  if (tier === "CORE") return "BOOST";
  if (tier === "BOOST") return "ELITE";
  return null;
}

function canUpgradeTo(current, target) {
  if (current === target) return false;
  if (current === "ELITE") return false;
  if (current === "DEMO") return ["CORE", "BOOST", "ELITE"].includes(target);
  if (current === "CORE") return ["BOOST", "ELITE"].includes(target);
  if (current === "BOOST") return target === "ELITE";
  return false;
}

function getPendingUpgradeTier() {
  if (!state.pendingUpgrade || typeof state.pendingUpgrade !== "object") return null;
  const tier = String(state.pendingUpgrade.tier || "").toUpperCase();
  if (!["CORE", "BOOST", "ELITE"].includes(tier)) return null;
  return tier;
}

function tierLabel(tier) {
  return tier;
}

function nextTierBenefits(tier) {
  if (tier === "DEMO") return "CORE: полный доступ после 3 бесплатных уровней демо.";
  if (tier === "CORE") return "BOOST: всё, что есть в CORE и: разборы куратора, закрытая группа, приоритетная поддержка.";
  if (tier === "BOOST") return "ELITE: всё, что есть в BOOST и: личный контроль 24/7, персональная стратегия, консьерж.";
  return "Максимальный уровень уже активен.";
}

function missionAccessNote(subscriptionInfo) {
  if (state.subscription === "DEMO") {
    if (isDemoFinished()) {
      return "Демо завершено: 3/3 уровня пройдено. Выбери тариф, чтобы открыть уровень 4+.";
    }
    const left = demoLevelsLeft();
    if (state.currentLevelPassed && state.nextUnlockAt) {
      const unlockAt = new Date(state.nextUnlockAt);
      return `Демо активировано: ${completedDemoLevels()}/${DEMO_LEVEL_CAP}. Следующий демо-уровень откроется ${formatUnlockDate(unlockAt)}.`;
    }
    return `Демо активировано: доступно ${DEMO_LEVEL_CAP} бесплатных уровня. Осталось ${left}.`;
  }
  if (subscriptionInfo.expired) {
    return `Подписка завершена ${formatDate(subscriptionInfo.expiresAt)}. Продли доступ для новых уровней.`;
  }
  if (state.currentLevelPassed && !state.nextUnlockAt && state.level >= 30) {
    return "Цикл 01 завершен. Ожидай следующий цикл или новый модуль.";
  }
  if (state.currentLevelPassed && state.nextUnlockAt) {
    const unlockAt = new Date(state.nextUnlockAt);
    return `Сегодня уровень уже пройден. Следующий откроется ${formatUnlockDate(unlockAt)}.`;
  }
  return `Доступен 1 уровень на сегодня. После прохождения новый откроется завтра в ${pad2(LEVEL_UNLOCK_HOUR)}:00 ${LEVEL_UNLOCK_TZ_LABEL}.`;
}

function clearPreviewMode() {
  const classes = [
    "preview-neon_lab",
    "preview-blackout_red",
    "preview-cold_cyan",
    "preview-hacker_noire",
    "preview-btn_pulse",
    "preview-scan_lines",
    "preview-glitch_glow",
    "preview-light_trail",
  ];
  document.body.classList.remove(...classes);
}

function triggerPreview(previewId) {
  clearPreviewMode();
  if (previewTimer) clearTimeout(previewTimer);
  document.body.classList.add(`preview-${previewId}`);
  shopMessage.textContent = "Превью активно: 3 секунды.";
  previewTimer = setTimeout(() => {
    clearPreviewMode();
    previewTimer = null;
    shopMessage.textContent = "Выбери улучшение.";
  }, 3000);
}

function energyStatus(completedLevels) {
  return `${completedLevels}/30 уровней пройдено`;
}

function hydrationStatus(percent, hydrationMl) {
  if (percent < 45) return `${hydrationMl} мл · ниже цели`;
  if (percent < 75) return `${hydrationMl} мл · рабочий баланс`;
  return `${hydrationMl} мл · цель закрыта`;
}

function metricsSnapshot() {
  const completedLevels = completedLevelsCount();
  const mainProgress = clamp(completedLevels, 0, 30);
  const mainContribution = Math.round((mainProgress / 30) * 30);
  const sideContribution = state.sideQuestDone ? 15 : 0;
  const energy = clamp(50 + mainContribution + sideContribution, 20, 100);

  const hydrationMl = clamp(Math.round(state.quick.hydrationMl), 0, HYDRATION_TARGET_ML);
  const hydrationPercent = clamp(Math.round((hydrationMl / HYDRATION_TARGET_ML) * 100), 0, 100);

  return { energy, hydrationMl, hydrationPercent, completedLevels };
}

function missionProgress() {
  return 1 - missionRemaining / MISSION_TOTAL_SECONDS;
}

function updateMissionProgressUI() {
  const progress = clamp(missionProgress(), 0, 1);
  missionWatchFill.style.width = `${Math.round(progress * 100)}%`;
}

function setActiveScreen(name) {
  if (name !== "mission" && missionInterval) {
    stopMissionTimer();
    if (missionRemaining > 0) resetMission();
  }
  if (name !== "result" && resultBurst && resultTotal) {
    resultBurst.classList.add("hidden");
    resultBurst.classList.remove("show");
    resultTotal.classList.remove("show");
  }
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === name);
  });
  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === name);
  });
}

function render() {
  syncDailyUnlock();

  const subscriptionInfo = getSubscriptionInfo();
  const completedLevels = completedLevelsCount();
  const cycleComplete = state.level >= 30 && state.currentLevelPassed && !state.nextUnlockAt;
  const missionName = getMissionName(state.level);
  const levelPercent = Math.round((completedLevels / 30) * 100);
  const bossReferenceLevel = clamp(state.currentLevelPassed ? state.level + 1 : state.level, 1, 30);
  const bossDistance = levelsToBoss(bossReferenceLevel);
  const bossDistanceText = bossDistance > 0 ? formatLevelCount(bossDistance) : "босс цикла пройден";
  const metrics = metricsSnapshot();
  const demoFinished = isDemoFinished();
  const pendingTier = getPendingUpgradeTier();
  const missionBlocked = subscriptionInfo.expired || state.currentLevelPassed || cycleComplete || demoFinished;

  if (hudNet) {
    const initData = getTelegramInitData();
    const canVerify = Boolean(getTelegramUserId() || (initData && String(initData).trim()));
    hudNet.classList.toggle("hidden", !canVerify || backendReachable);
  }

  if (!demoFinished) {
    demoPaywallPresented = false;
    closeDemoPaywall();
  } else if (!demoPaywallPresented && onboarding && onboarding.classList.contains("hidden")) {
    demoPaywallPresented = true;
    setActiveScreen("subscription");
    openDemoPaywall();
  }

  if (layout) layout.dataset.progress = String(levelPercent);

  if (hudTitle) hudTitle.textContent = moduleLabel(state.mode);
  if (modeSwitch) modeSwitch.textContent = moduleLabel(state.mode);
  if (sidebarPlan) sidebarPlan.textContent = tierLabel(state.subscription);
  if (hudTier) hudTier.textContent = tierLabel(state.subscription);
  if (subscriptionCurrentChip) subscriptionCurrentChip.textContent = tierLabel(state.subscription);
  if (subscriptionHeadline) {
    if (state.subscription === "DEMO") {
      subscriptionHeadline.innerHTML = `<span class="sub-highlight">ТЕКУЩИЙ УРОВЕНЬ</span>: DEMO (${completedDemoLevels()}/${DEMO_LEVEL_CAP}). <span class="sub-highlight">МОДУЛЬ ТРЕНИРОВОК</span>: ${state.mode.toUpperCase()}.`;
    } else {
      subscriptionHeadline.innerHTML = `<span class="sub-highlight">ТЕКУЩИЙ УРОВЕНЬ</span>: ${tierLabel(state.subscription)}. <span class="sub-highlight">МОДУЛЬ ТРЕНИРОВОК</span>: ${state.mode.toUpperCase()}.`;
    }
  }
  if (sidebarUpgradeBenefits) sidebarUpgradeBenefits.textContent = nextTierBenefits(state.subscription);
  if (sidebarSubscriptionTerm) {
    if (subscriptionInfo.demo) {
      sidebarSubscriptionTerm.textContent = `3 бесплатных уровня · ${completedDemoLevels()}/${DEMO_LEVEL_CAP}`;
    } else if (subscriptionInfo.oneTime) {
      sidebarSubscriptionTerm.textContent = "Разовая покупка · активен";
    } else {
      sidebarSubscriptionTerm.textContent = subscriptionInfo.expired
        ? `Подписка завершена ${formatDate(subscriptionInfo.expiresAt)}`
        : `Осталось ${subscriptionInfo.daysLeft} дн.`;
    }
  }

  const next = nextTier(state.subscription);
  if (sidebarUpgradeBtn) {
    sidebarUpgradeBtn.disabled = !next;
    if (!next) {
      sidebarUpgradeBtn.textContent = "Максимальный уровень";
    } else {
      if (next === "CORE") sidebarUpgradeBtn.textContent = "Открыть CORE (1 490 ₽/мес)";
      else if (next === "BOOST") sidebarUpgradeBtn.textContent = "Оформить BOOST (3 490 ₽/мес)";
      else sidebarUpgradeBtn.textContent = "Купить ELITE (34 990 ₽)";
    }
  }
  if (upgradeCoreBtn) {
    if (state.subscription === "DEMO") {
      upgradeCoreBtn.disabled = false;
      upgradeCoreBtn.textContent = pendingTier === "CORE" ? "Ожидается оплата CORE" : "Открыть CORE · 1 490 ₽/мес";
    } else if (state.subscription === "CORE") {
      upgradeCoreBtn.disabled = true;
      upgradeCoreBtn.textContent = "Текущий уровень";
    } else {
      upgradeCoreBtn.disabled = true;
      upgradeCoreBtn.textContent = "Базовый уровень";
    }
  }
  if (upgradeBoostBtn) {
    if (state.subscription === "DEMO" || state.subscription === "CORE") {
      upgradeBoostBtn.disabled = false;
      upgradeBoostBtn.textContent =
        pendingTier === "BOOST" ? "Ожидается оплата BOOST" : "Открыть BOOST · 3 490 ₽/мес";
    } else if (state.subscription === "BOOST") {
      upgradeBoostBtn.disabled = true;
      upgradeBoostBtn.textContent = "Текущий уровень";
    } else {
      upgradeBoostBtn.disabled = true;
      upgradeBoostBtn.textContent = "Включено в ELITE";
    }
  }
  if (upgradeEliteBtn) {
    if (state.subscription === "ELITE") {
      upgradeEliteBtn.disabled = true;
      upgradeEliteBtn.textContent = "Текущий уровень";
    } else {
      upgradeEliteBtn.disabled = false;
      upgradeEliteBtn.textContent = pendingTier === "ELITE" ? "Ожидается оплата ELITE" : "Купить ELITE · 34 990 ₽";
    }
  }

  if (subscriptionPending && subscriptionPendingText && subscriptionCheckBtn) {
    const tgUserId = getTelegramUserId();
    const initData = getTelegramInitData();
    const canVerify = Boolean(tgUserId || (initData && String(initData).trim()));
    if (pendingTier) {
      subscriptionPending.classList.remove("hidden");
      if (!canVerify) {
        subscriptionPendingText.textContent = `Открыта оплата ${pendingTier}. Для авто-проверки открой Mini App из Telegram.`;
      } else if (!backendReachable) {
        subscriptionPendingText.textContent = `Открыта оплата ${pendingTier}. Сервер проверки временно недоступен. Нажми «Проверить оплату».`;
      } else {
        subscriptionPendingText.textContent = `Открыта оплата ${pendingTier}. После оплаты нажми «Проверить оплату».`;
      }
      subscriptionCheckBtn.textContent = `Проверить оплату ${pendingTier}`;
      subscriptionCheckBtn.disabled = !canVerify;
    } else {
      subscriptionPending.classList.add("hidden");
      subscriptionCheckBtn.disabled = true;
    }
  }

  hudLevel.textContent = pad2(state.level);
  hudFill.style.width = `${levelPercent}%`;
  hudMeta.textContent = `${levelPercent}%`;

  homeLevelChip.textContent = `УРОВЕНЬ ${pad2(state.level)}`;
  homeMissionTitle.textContent = missionName;
  homeMissionMeta.textContent = `15 минут · ${state.mode} · Без инвентаря`;
  if (homeDemoNote) {
    if (state.subscription === "DEMO") {
      homeDemoNote.textContent = `ДЕМО РЕЖИМ АКТИВИРОВАН: ${completedDemoLevels()}/${DEMO_LEVEL_CAP} уровней пройдено.`;
      homeDemoNote.classList.remove("hidden");
    } else {
      homeDemoNote.classList.add("hidden");
    }
  }
  homeSyncSeries.textContent = `${formatLevelCount(state.syncSeries)} подряд`;
  homeWindow.textContent = state.window;
  homeBonus.textContent = "Осталось 2ч 14м";
  if (homeWindowDetails) homeWindowDetails.textContent = state.window;
  if (homeBonusDetails) homeBonusDetails.textContent = homeBonus.textContent;
  if (homeDetails) homeDetails.classList.toggle("hidden", !state.homeDetailsOpen);
  if (homeDetailsToggle) {
    homeDetailsToggle.textContent = state.homeDetailsOpen ? "Скрыть показатели" : "Показатели системы";
  }
  if (homeAccessRule) homeAccessRule.textContent = missionAccessNote(subscriptionInfo);
  if (homePaywallBlock) homePaywallBlock.classList.toggle("hidden", !demoFinished);

  missionPanelTitle.textContent = `Миссия: ${missionName}`;
  if (missionAvailability) missionAvailability.textContent = missionAccessNote(subscriptionInfo);
  if (missionStartBtn) {
    if (demoFinished) {
      missionStartBtn.disabled = false;
      missionStartBtn.textContent = "Демо завершено — открыть тарифы";
    } else {
      missionStartBtn.disabled = missionBlocked;
    }
    if (subscriptionInfo.expired) {
      missionStartBtn.textContent = "Подписка завершена";
    } else if (cycleComplete) {
      missionStartBtn.textContent = "Цикл завершен";
    } else if (demoFinished) {
      missionStartBtn.textContent = "Демо завершено — открыть тарифы";
    } else if (state.currentLevelPassed) {
      missionStartBtn.textContent = "Уровень на сегодня пройден";
    } else {
      missionStartBtn.textContent = "Запустить миссию";
    }
  }

  if (state.subscription === "DEMO") {
    progressLevel.textContent = `${completedDemoLevels()}/${DEMO_LEVEL_CAP}`;
    progressRing.style.setProperty("--value", String(completedDemoLevels() / DEMO_LEVEL_CAP));
  } else {
    progressLevel.textContent = `${completedLevels}/30`;
    progressRing.style.setProperty("--value", String(completedLevels / 30));
  }
  progressSyncSeries.textContent = `Синхронизация: ${state.syncSeries}`;
  progressChips.textContent = String(state.chips);
  if (state.subscription === "DEMO") {
    const left = demoLevelsLeft();
    progressBoss.textContent = left > 0 ? `До конца демо ${formatLevelCount(left)}` : "Демо завершено";
  } else {
    progressBoss.textContent = bossDistance > 0 ? bossDistanceText : "Босс цикла пройден";
  }
  if (progressLog) {
    progressLog.innerHTML = state.completedHistory
      .slice(-6)
      .reverse()
      .map((entry) => {
        const label = entry.boss ? "Босс" : "Уровень";
        const reward = entry.boss ? 300 : 120;
        return `<div class="progress-log__item">${label}<strong>${pad2(entry.level)}</strong>+${reward} чипов</div>`;
      })
      .join("");
  }
  if (progressPaywallBlock) progressPaywallBlock.classList.toggle("hidden", !demoFinished);

  shopBalance.textContent = `ЧИПЫ ${state.chips}`;
  modifierValue.textContent = state.modifier;
  if (state.subscription === "DEMO") {
    bossBanner.textContent = demoFinished
      ? "Демо завершено: 3/3. Открой доступ к полному циклу."
      : `Демо активировано: осталось ${demoLevelsLeft()} ${demoLevelsLeft() === 1 ? "уровень" : "уровня"}.`;
  } else if (subscriptionInfo.expired) {
    bossBanner.textContent = `Подписка завершена ${formatDate(subscriptionInfo.expiresAt)}. Продли доступ.`;
  } else if (cycleComplete) {
    bossBanner.textContent = "Цикл 01 завершен. Жди обновление модуля.";
  } else if (state.currentLevelPassed && state.nextUnlockAt) {
    const unlockAt = new Date(state.nextUnlockAt);
    bossBanner.textContent = `Уровень пройден. Следующий откроется ${formatUnlockDate(unlockAt)}.`;
  } else {
    bossBanner.textContent = bossDistance > 0 ? `До встречи с боссом ${bossDistanceText}.` : "Босс цикла пройден.";
  }
  arsenalWindow.textContent = state.window;
  arsenalChips.textContent = String(state.chips);
  if (arsenalModuleBtn) {
    arsenalModuleBtn.textContent = demoFinished ? "Демо завершено — открыть тарифы" : `Программа: ${state.mode}`;
    arsenalModuleBtn.classList.toggle("btn--primary", demoFinished);
    arsenalModuleBtn.classList.toggle("btn--ghost", !demoFinished);
  }

  energyBar.style.width = `${metrics.energy}%`;
  energyValue.textContent = `${metrics.energy}% · ${energyStatus(metrics.completedLevels)}`;

  hydrationBar.style.width = `${metrics.hydrationPercent}%`;
  hydrationValue.textContent = `${metrics.hydrationPercent}% · ${hydrationStatus(metrics.hydrationPercent, metrics.hydrationMl)}`;

  hydrationInput.value = String(metrics.hydrationMl);
  hydrationFill.style.width = `${metrics.hydrationPercent}%`;
  if (hydrationMeta) {
    const glasses = Math.max(0, Math.round(metrics.hydrationMl / GLASS_ML));
    hydrationMeta.textContent = `${metrics.hydrationMl} мл / ${HYDRATION_TARGET_ML} мл · ${glasses} стаканов`;
  }

  settingsRemindersBtn.textContent = state.remindersEnabled ? "Включены" : "Отключены";
  settingsWindowVal.textContent = state.window;
  if (settingsEffectsVal) settingsEffectsVal.textContent = `${metrics.hydrationMl} мл / ${HYDRATION_TARGET_ML} мл`;

  sideQuestStatus.textContent = state.sideQuestDone ? `Статус: выполнено (${state.modifier})` : "Статус: не выполнено";
  sideQuestBtn.disabled = state.sideQuestDone || subscriptionInfo.expired || demoFinished;

  if (resultUnlockNote) {
    if (state.subscription === "DEMO" && demoFinished) {
      resultUnlockNote.textContent = "Демо завершено: 3/3 уровня. Чтобы открыть уровень 4+, выбери тариф.";
    } else if (subscriptionInfo.expired) {
      resultUnlockNote.textContent = `Подписка завершена ${formatDate(subscriptionInfo.expiresAt)}. Продли доступ для новых уровней.`;
    } else if (cycleComplete) {
      resultUnlockNote.textContent = "Цикл 01 завершен. Дальше — новый цикл после обновления.";
    } else if (state.currentLevelPassed && state.nextUnlockAt) {
      const unlockAt = new Date(state.nextUnlockAt);
      resultUnlockNote.textContent = `Следующий уровень откроется ${formatUnlockDate(unlockAt)}. Лимит: 1 уровень в день.`;
    } else {
      resultUnlockNote.textContent = `Лимит: 1 уровень в день. Следующий уровень открывается завтра в ${pad2(LEVEL_UNLOCK_HOUR)}:00 ${LEVEL_UNLOCK_TZ_LABEL}.`;
    }
  }

  if (resultNextBtn) {
    resultNextBtn.textContent = state.subscription === "DEMO" && demoFinished ? "Открыть тарифы" : "На Дом";
  }

  syncShopButtons();
  updateMissionProgressUI();
}

function syncShopButtons() {
  shopButtons.forEach((button) => {
    const cost = Number(button.dataset.cost);
    const itemId = button.dataset.item;
    const purchased = Boolean(state.purchases[itemId]);
    if (purchased) {
      button.textContent = "Активировано";
      button.classList.add("is-purchased");
      button.disabled = true;
      return;
    }
    button.textContent = `Купить за ${cost} чипов`;
    button.classList.remove("is-purchased");
    button.disabled = false;
  });
}

function resetMission() {
  missionRemaining = MISSION_TOTAL_SECONDS;
  updateMissionProgressUI();
}

function stopMissionTimer() {
  if (missionInterval) {
    clearInterval(missionInterval);
    missionInterval = null;
  }
}

async function startMissionTimer() {
  if (missionInterval) return;
  const subscriptionInfo = getSubscriptionInfo();
  if (isDemoFinished()) {
    openSubscriptionPaywall();
    return;
  }
  if (subscriptionInfo.expired) {
    if (shopMessage) shopMessage.textContent = "Подписка завершена. Продли доступ для новых уровней.";
    return;
  }
  if (state.level >= 30 && state.currentLevelPassed && !state.nextUnlockAt) {
    if (shopMessage) shopMessage.textContent = "Цикл 01 завершен. Ожидай новый цикл.";
    return;
  }
  if (state.currentLevelPassed) {
    if (shopMessage) {
      shopMessage.textContent = `Уровень на сегодня уже пройден. Новый откроется завтра в ${pad2(LEVEL_UNLOCK_HOUR)}:00 ${LEVEL_UNLOCK_TZ_LABEL}.`;
    }
    return;
  }
  missionInterval = setInterval(() => {
    missionRemaining = clamp(missionRemaining - DEMO_SECONDS_STEP, 0, MISSION_TOTAL_SECONDS);
    updateMissionProgressUI();
    if (missionRemaining === 0) {
      completeMission();
    }
  }, DEMO_TICK_MS);
}

async function completeMission() {
  stopMissionTimer();

  const currentLevel = state.level;
  if (state.currentLevelPassed) return;
  const boss = isBossLevel(currentLevel);
  const mainReward = boss ? 300 : 120;
  const bonusReward = 30;

  resultMainReward.textContent = `+${mainReward} чипов`;
  resultBonusReward.textContent = `+${bonusReward} чипов`;
  if (resultTotal) resultTotal.textContent = `+${mainReward + bonusReward} чипов`;

  state.chips += mainReward + bonusReward;
  state.syncSeries += 1;
  state.currentLevelPassed = true;
  const levelCap = state.subscription === "DEMO" ? DEMO_LEVEL_CAP : 30;
  state.nextUnlockAt = currentLevel < levelCap ? getNextUnlockDate().toISOString() : null;
  state.sideQuestDone = false;
  state.completedHistory = [...state.completedHistory, { level: currentLevel, boss, reward: mainReward }].slice(-8);

  saveState();
  render();
  setActiveScreen("result");
  playResultFx();
  resetMission();
}

function playResultFx() {
  if (!resultBurst || !resultTotal) return;
  resultBurst.classList.remove("hidden", "show");
  resultTotal.classList.remove("show");
  requestAnimationFrame(() => {
    resultBurst.classList.add("show");
    resultTotal.classList.add("show");
  });
}

function handleShopPurchase(event) {
  const button = event.currentTarget;
  const cost = Number(button.dataset.cost);
  const itemId = button.dataset.item;

  if (state.purchases[itemId]) return;

  if (state.chips < cost) {
    shopMessage.textContent = "Недостаточно чипов. Заверши миссию и вернись в магазин.";
    return;
  }

  state.chips -= cost;
  state.purchases[itemId] = true;
  shopMessage.textContent = "Активировано. Интерфейс обновлён.";

  saveState();
  render();
}

function handleShopPreview(event) {
  const previewId = event.currentTarget.dataset.preview;
  if (!previewId) return;
  triggerPreview(previewId);
}

async function upgradeSubscription(target) {
  const current = state.subscription;
  if (!canUpgradeTo(current, target)) return;

  state.pendingUpgrade = { tier: target, createdAt: new Date().toISOString() };
  saveState();
  render();

  try {
    await markPendingUpgradeRemote(target);
  } catch {
    backendReachable = false;
  }

  const paymentLink = pickPaymentLinkByTier(target);
  if (paymentLink) openExternalLink(paymentLink);

  setActiveScreen("subscription");
  closeDemoPaywall();
  if (shopMessage) {
    shopMessage.textContent = `Оплата ${target} открыта в Tribute. После оплаты нажми «Проверить оплату».`;
  }
}

function handleSidebarUpgrade() {
  const next = nextTier(state.subscription);
  if (!next) return;
  upgradeSubscription(next);
}

function activateSideQuest() {
  if (state.sideQuestDone) return;
  const modifierIndex = Math.floor(Math.random() * MODIFIERS.length);
  state.sideQuestDone = true;
  state.modifier = MODIFIERS[modifierIndex];
  saveState();
  render();
}

function updateHydration(value) {
  state.quick.hydrationMl = clamp(Math.round(Number(value)), 0, HYDRATION_TARGET_ML);
  saveState();
  render();
}

function toggleReminders() {
  state.remindersEnabled = !state.remindersEnabled;
  saveState();
  render();
}

function resetCurrentMission() {
  stopMissionTimer();
  resetMission();
  shopMessage.textContent = "Миссия сброшена.";
}

function syncBodyLock() {
  const modulesOpen = modulesModal && !modulesModal.classList.contains("hidden");
  const paywallOpen = demoPaywall && !demoPaywall.classList.contains("hidden");
  const drawerOpen = mobileDrawer && !mobileDrawer.classList.contains("hidden");
  const tourOpen = tourOverlay && !tourOverlay.classList.contains("hidden");
  document.body.classList.toggle("modal-open", Boolean(modulesOpen || paywallOpen || drawerOpen || tourOpen));
}

function openModulesModal() {
  if (!modulesModal) return;
  modulesModal.classList.remove("hidden");
  modulesModal.setAttribute("aria-hidden", "false");
  syncBodyLock();
}

function closeModulesModal() {
  if (!modulesModal) return;
  modulesModal.classList.add("hidden");
  modulesModal.setAttribute("aria-hidden", "true");
  syncBodyLock();
}

function openDemoPaywall() {
  if (!demoPaywall) return;
  demoPaywall.classList.remove("hidden");
  demoPaywall.setAttribute("aria-hidden", "false");
  syncBodyLock();
}

function closeDemoPaywall() {
  if (!demoPaywall) return;
  demoPaywall.classList.add("hidden");
  demoPaywall.setAttribute("aria-hidden", "true");
  syncBodyLock();
}

function openMobileDrawer() {
  if (!mobileDrawer) return;
  mobileDrawer.classList.remove("hidden");
  mobileDrawer.setAttribute("aria-hidden", "false");
  syncBodyLock();
}

function closeMobileDrawer() {
  if (!mobileDrawer) return;
  mobileDrawer.classList.add("hidden");
  mobileDrawer.setAttribute("aria-hidden", "true");
  syncBodyLock();
}

function openSubscriptionPaywall() {
  closeMobileDrawer();
  closeModulesModal();
  setActiveScreen("subscription");
  if (shopMessage) shopMessage.textContent = "Демо завершено. Выбери тариф для доступа к уровню 4+.";
  if (isDemoFinished()) openDemoPaywall();
  else closeDemoPaywall();
}

function clearTourHighlight() {
  document.querySelectorAll(".tour-highlight").forEach((node) => node.classList.remove("tour-highlight"));
}

function setTourMaskRect(rect) {
  if (!tourSpotlight || !tourShadeTop || !tourShadeLeft || !tourShadeRight || !tourShadeBottom) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = clamp(Math.round(rect.left), 0, vw);
  const top = clamp(Math.round(rect.top), 0, vh);
  const width = clamp(Math.round(rect.width), 0, vw - left);
  const height = clamp(Math.round(rect.height), 0, vh - top);
  const right = left + width;
  const bottom = top + height;

  tourSpotlight.style.left = `${left}px`;
  tourSpotlight.style.top = `${top}px`;
  tourSpotlight.style.width = `${width}px`;
  tourSpotlight.style.height = `${height}px`;
  tourSpotlight.style.transform = "none";

  tourShadeTop.style.left = "0px";
  tourShadeTop.style.top = "0px";
  tourShadeTop.style.width = `${vw}px`;
  tourShadeTop.style.height = `${top}px`;

  tourShadeLeft.style.left = "0px";
  tourShadeLeft.style.top = `${top}px`;
  tourShadeLeft.style.width = `${left}px`;
  tourShadeLeft.style.height = `${height}px`;

  tourShadeRight.style.left = `${right}px`;
  tourShadeRight.style.top = `${top}px`;
  tourShadeRight.style.width = `${Math.max(0, vw - right)}px`;
  tourShadeRight.style.height = `${height}px`;

  tourShadeBottom.style.left = "0px";
  tourShadeBottom.style.top = `${bottom}px`;
  tourShadeBottom.style.width = `${vw}px`;
  tourShadeBottom.style.height = `${Math.max(0, vh - bottom)}px`;
}

function refreshTourMask() {
  if (!tourActive) return;
  const step = TOUR_STEPS[tourIndex];
  const target = resolveTourTarget(step);
  if (!target) {
    setTourMaskRect({
      left: Math.round(window.innerWidth * 0.2),
      top: Math.round(window.innerHeight * 0.35),
      width: Math.round(window.innerWidth * 0.6),
      height: 88,
    });
    return;
  }

  const rect = target.getBoundingClientRect();
  const padX = 10;
  const padY = 8;
  setTourMaskRect({
    left: rect.left - padX,
    top: rect.top - padY,
    width: rect.width + padX * 2,
    height: rect.height + padY * 2,
  });
}

function openTourOverlay() {
  if (!tourOverlay) return;
  tourOverlay.classList.remove("hidden");
  tourOverlay.setAttribute("aria-hidden", "false");
  syncBodyLock();
}

function closeTourOverlay() {
  if (!tourOverlay) return;
  tourOverlay.classList.add("hidden");
  tourOverlay.setAttribute("aria-hidden", "true");
  clearTourHighlight();
  syncBodyLock();
}

function resolveTourTarget(step) {
  if (!step || typeof step.target !== "function") return null;
  const target = step.target();
  if (!target) return null;
  if (target.classList && target.classList.contains("hidden")) return null;
  if (target.offsetParent === null) return null;
  return target;
}

function renderTourStep() {
  if (!tourActive) return;
  const step = TOUR_STEPS[tourIndex];
  if (!step) {
    finishTour(true);
    return;
  }

  if (typeof step.prepare === "function") step.prepare();
  render();

  requestAnimationFrame(() => {
    if (!tourActive) return;
    const currentStep = TOUR_STEPS[tourIndex];
    const target = resolveTourTarget(currentStep);
    clearTourHighlight();
    if (target) {
      target.classList.add("tour-highlight");
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    refreshTourMask();
    setTimeout(refreshTourMask, 220);

    if (tourStep) tourStep.textContent = `Шаг ${tourIndex + 1} / ${TOUR_STEPS.length}`;
    if (tourTitle) tourTitle.textContent = currentStep.title;
    if (tourText) tourText.textContent = currentStep.text;
    if (tourNextBtn) {
      tourNextBtn.textContent = tourIndex === TOUR_STEPS.length - 1 ? "Завершить" : "Дальше";
    }
  });
}

function startTour() {
  if (tourActive) return;
  tourActive = true;
  tourIndex = 0;
  openTourOverlay();
  renderTourStep();
}

function nextTourStep() {
  if (!tourActive) return;
  tourIndex += 1;
  if (tourIndex >= TOUR_STEPS.length) {
    finishTour(true);
    return;
  }
  renderTourStep();
}

function finishTour(markDone) {
  tourActive = false;
  if (markDone) {
    state.tourDone = true;
    saveState();
  }
  closeTourOverlay();
}

function showOnboardingStep(step) {
  onboardingStep = clamp(step, 1, 3);
  onboardingLabel.textContent = onboardingStep === 1 ? "Первый запуск" : `Шаг ${onboardingStep} / 3`;

  onboardingScreens.forEach((screen) => {
    const active = Number(screen.dataset.onboardingStep) === onboardingStep;
    screen.classList.toggle("active", active);
  });

  onboardingBack.classList.toggle("hidden", onboardingStep === 1);
  onboardingNext.classList.toggle("hidden", onboardingStep === 3);
  onboardingFinish.classList.toggle("hidden", onboardingStep !== 3);
  onboardingNext.textContent = onboardingStep === 1 ? "Начать игру" : "Дальше";
  onboardingNext.classList.toggle("onboarding-next--launch", onboardingStep === 1);
  if (onboardingActions) onboardingActions.classList.toggle("is-launch", onboardingStep === 1);
}

function finishOnboarding() {
  onboarding.classList.add("hidden");
  state.onboardingDone = true;
  state.onboardingVersionSeen = ONBOARDING_VERSION;
  saveState();
  if (isDemoFinished()) {
    demoPaywallPresented = true;
    openSubscriptionPaywall();
    return;
  }
  render();
  if (STARTUP_SCREEN) {
    setActiveScreen(STARTUP_SCREEN);
  }
  if (!state.tourDone) {
    setTimeout(() => startTour(), 260);
  }
}

function runBootSequence() {
  const bootTarget = 100;
  const duration = 1400;
  const forceOnboarding = new URLSearchParams(window.location.search).get("onboarding") === "1";

  if (!bootScreen || !bootFill || !bootPercent || !bootMeta) return;

  let finished = false;
  const finalize = () => {
    if (finished) return;
    finished = true;

    setTimeout(() => {
      bootScreen.classList.add("is-hidden");
      setTimeout(() => {
        bootScreen.remove();
        if (
          ALWAYS_SHOW_ONBOARDING ||
          forceOnboarding ||
          !state.onboardingDone ||
          state.onboardingVersionSeen !== ONBOARDING_VERSION
        ) {
          onboarding.classList.remove("hidden");
          showOnboardingStep(1);
          playBootClick();
        }
      }, 600);
    }, 250);
  };

  // Fallback: если rAF по какой-то причине не отрабатывает в webview — всё равно снимаем экран.
  const fallbackTimer = setTimeout(() => {
    bootFill.style.width = "100%";
    bootPercent.textContent = "100%";
    bootMeta.textContent = "Подготовка интерфейса";
    finalize();
  }, duration + 2400);

  let start = null;
  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = clamp((timestamp - start) / duration, 0, 1);
    const current = Math.round(bootTarget * progress);

    bootFill.style.width = `${current}%`;
    bootPercent.textContent = `${current}%`;
    bootMeta.textContent =
      current < 30 ? "Загрузка ядра" : current < 60 ? "Синхронизация данных" : "Подготовка интерфейса";

    if (progress < 1) {
      requestAnimationFrame(step);
      return;
    }

    clearTimeout(fallbackTimer);
    finalize();
  }

  if (typeof requestAnimationFrame !== "function") {
    clearTimeout(fallbackTimer);
    bootFill.style.width = "100%";
    bootPercent.textContent = "100%";
    bootMeta.textContent = "Подготовка интерфейса";
    finalize();
    return;
  }

  requestAnimationFrame(step);
}

function initLegacyPrototype() {
  const legacyScreens = document.querySelectorAll("[data-screen]");
  const legacyNav = document.querySelectorAll("[data-nav]");
  if (!legacyScreens.length || !legacyNav.length) return;

  const showLegacyScreen = (name) => {
    legacyScreens.forEach((screen) => {
      screen.classList.toggle("active", screen.dataset.screen === name);
    });
    legacyNav.forEach((button) => {
      button.classList.toggle("active", button.dataset.nav === name);
    });
  };

  legacyNav.forEach((button) => {
    button.addEventListener("click", () => showLegacyScreen(button.dataset.nav));
  });

  const legacyStart = document.getElementById("cta-start");
  if (legacyStart) {
    legacyStart.addEventListener("click", () => showLegacyScreen("mission"));
  }
}

if (!motifReady) {
  initLegacyPrototype();
} else {
  document.addEventListener("pointerdown", unlockSfxContext, { passive: true, capture: true });
  document.addEventListener("touchstart", unlockSfxContext, { passive: true, capture: true });
  document.addEventListener("mousedown", unlockSfxContext, { passive: true, capture: true });
  document.addEventListener("click", unlockSfxContext, { passive: true, capture: true });
  document.addEventListener("keydown", unlockSfxContext, { capture: true });

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      playUiClick("nav");
      triggerHaptic("soft");
      setActiveScreen(button.dataset.nav);
      closeMobileDrawer();
    });
  });

  ctaStart.addEventListener("click", () => {
    playUiClick("primary");
    triggerHaptic("heavy");
    if (isDemoFinished()) {
      openSubscriptionPaywall();
      return;
    }
    setActiveScreen("mission");
  });
  if (homeDetailsToggle) {
    homeDetailsToggle.addEventListener("click", () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      state.homeDetailsOpen = !state.homeDetailsOpen;
      saveState();
      render();
      refreshTourMask();
    });
  }
  if (homePaywallBtn) {
    homePaywallBtn.addEventListener("click", () => {
      playUiClick("upgrade");
      triggerHaptic("heavy");
      openSubscriptionPaywall();
    });
  }
  if (progressPaywallBtn) {
    progressPaywallBtn.addEventListener("click", () => {
      playUiClick("upgrade");
      triggerHaptic("heavy");
      openSubscriptionPaywall();
    });
  }
  if (progressShareBtn) {
    progressShareBtn.addEventListener("click", async () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      const original = progressShareBtn.textContent;
      progressShareBtn.textContent = "Открываю…";
      try {
        await shareProgress();
      } finally {
        setTimeout(() => {
          progressShareBtn.textContent = original;
        }, 900);
      }
    });
  }
  if (arsenalModuleBtn) {
    arsenalModuleBtn.addEventListener("click", () => {
      if (isDemoFinished()) {
        playUiClick("upgrade");
        triggerHaptic("heavy");
        openSubscriptionPaywall();
        return;
      }
      playUiClick("ghost");
      triggerHaptic("soft");
      openModulesModal();
    });
  }
  if (moduleSwitchBtn) {
    moduleSwitchBtn.addEventListener("click", () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      openModulesModal();
    });
  }
  if (modulesModalClose) {
    modulesModalClose.addEventListener("click", () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      closeModulesModal();
    });
  }
  if (modulesModalBackdrop) {
    modulesModalBackdrop.addEventListener("click", closeModulesModal);
  }
  if (demoPaywallOpenBtn) {
    demoPaywallOpenBtn.addEventListener("click", () => {
      playUiClick("upgrade");
      triggerHaptic("heavy");
      setActiveScreen("subscription");
      closeDemoPaywall();
    });
  }
  if (demoPaywallClose) {
    demoPaywallClose.addEventListener("click", () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      closeDemoPaywall();
    });
  }
  if (demoPaywallBackdrop) {
    demoPaywallBackdrop.addEventListener("click", closeDemoPaywall);
  }
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      openMobileDrawer();
    });
  }
  if (mobileDrawerClose) {
    mobileDrawerClose.addEventListener("click", () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      closeMobileDrawer();
    });
  }
  if (mobileDrawerBackdrop) {
    mobileDrawerBackdrop.addEventListener("click", closeMobileDrawer);
  }
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeModulesModal();
    closeDemoPaywall();
    closeMobileDrawer();
    if (tourActive) finishTour(true);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkAccessStatus({ manual: false });
    }
  });
  window.addEventListener("focus", () => {
    checkAccessStatus({ manual: false });
  });
  window.addEventListener("online", () => {
    backendReachable = true;
    try {
      render();
    } catch {}
    checkAccessStatus({ manual: false, refresh: true });
  });
  window.addEventListener("offline", () => {
    backendReachable = false;
    try {
      render();
    } catch {}
  });
  window.addEventListener("resize", () => {
    refreshTourMask();
  });
  window.addEventListener(
    "scroll",
    () => {
      refreshTourMask();
    },
    true,
  );

  missionStartBtn.addEventListener("click", () => {
    playUiClick("primary");
    triggerHaptic("heavy");
    startMissionTimer();
  });
  resultNextBtn.addEventListener("click", () => {
    playUiClick("primary");
    triggerHaptic("soft");
    if (isDemoFinished()) {
      openSubscriptionPaywall();
      return;
    }
    setActiveScreen("home");
  });

  sideQuestBtn.addEventListener("click", () => {
    playUiClick("ghost");
    triggerHaptic("soft");
    activateSideQuest();
  });
  shopButtons.forEach((button) =>
    button.addEventListener("click", (event) => {
      playUiClick("upgrade");
      triggerHaptic("heavy");
      handleShopPurchase(event);
    }),
  );
  shopPreviewButtons.forEach((button) =>
    button.addEventListener("click", (event) => {
      playUiClick("ghost");
      triggerHaptic("soft");
      handleShopPreview(event);
    }),
  );
  if (sidebarUpgradeBtn) {
    sidebarUpgradeBtn.addEventListener("click", () => {
      playUiClick("upgrade");
      triggerHaptic("heavy");
      handleSidebarUpgrade();
    });
  }
  if (upgradeCoreBtn) {
    upgradeCoreBtn.addEventListener("click", () => {
      playUiClick("upgrade");
      triggerHaptic("heavy");
      upgradeSubscription("CORE");
    });
  }
  if (upgradeBoostBtn) {
    upgradeBoostBtn.addEventListener("click", () => {
      playUiClick("upgrade");
      triggerHaptic("heavy");
      upgradeSubscription("BOOST");
    });
  }
  if (upgradeEliteBtn) {
    upgradeEliteBtn.addEventListener("click", () => {
      playUiClick("upgrade");
      triggerHaptic("heavy");
      upgradeSubscription("ELITE");
    });
  }
  if (subscriptionCheckBtn) {
    subscriptionCheckBtn.addEventListener("click", async () => {
      playUiClick("primary");
      triggerHaptic("heavy");
      await checkAccessStatus({ manual: true });
    });
  }
  if (subscriptionResendBtn) {
    subscriptionResendBtn.addEventListener("click", async () => {
      playUiClick("ghost");
      triggerHaptic("soft");

      const pendingTier = getPendingUpgradeTier();
      const targetLabel = subscriptionPendingText || shopMessage;
      if (!pendingTier) {
        if (targetLabel) targetLabel.textContent = "Сначала выбери тариф для оплаты.";
        return;
      }

      try {
        await markPendingUpgradeRemote(pendingTier, { resend: true });
        backendReachable = true;
        if (targetLabel) targetLabel.textContent = "Кнопка оплаты отправлена в бот. Открой чат и нажми «Оплатить».";
        triggerHaptic("success");
      } catch {
        backendReachable = false;
        if (targetLabel) {
          targetLabel.textContent =
            "Не удалось отправить кнопку. Открой Mini App из Telegram или попробуй позже (сервер проверки недоступен).";
        }
        triggerHaptic("error");
      }
    });
  }
  hydrationInput.addEventListener("input", (event) => updateHydration(event.target.value));
  settingsRemindersBtn.addEventListener("click", () => {
    playUiClick("ghost");
    triggerHaptic("soft");
    toggleReminders();
  });
  settingsResetMission.addEventListener("click", () => {
    playUiClick("danger");
    triggerHaptic("error");
    resetCurrentMission();
  });
  if (settingsTourBtn) {
    settingsTourBtn.addEventListener("click", () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      startTour();
    });
  }
  if (settingsBotMenuBtn) {
    settingsBotMenuBtn.addEventListener("click", async () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      const original = settingsBotMenuBtn.textContent;
      settingsBotMenuBtn.textContent = "Отправляю…";
      settingsBotMenuBtn.disabled = true;
      const ok = await maybeSendBotMenu({ force: true });
      settingsBotMenuBtn.textContent = ok ? "Отправлено" : "Ошибка";
      setTimeout(() => {
        settingsBotMenuBtn.textContent = original;
        settingsBotMenuBtn.disabled = false;
      }, 1200);
    });
  }
  if (tourNextBtn) {
    tourNextBtn.addEventListener("click", () => {
      playUiClick("primary");
      triggerHaptic("soft");
      nextTourStep();
    });
  }
  if (tourSkipBtn) {
    tourSkipBtn.addEventListener("click", () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      finishTour(true);
    });
  }

  onboardingBack.addEventListener("click", () => {
    playUiClick("ghost");
    triggerHaptic("soft");
    showOnboardingStep(onboardingStep - 1);
  });
  onboardingNext.addEventListener("click", () => {
    triggerHaptic("heavy");
    if (onboardingStep === 1) {
      // Autoplay restrictions: we can only start audio after a user gesture.
      // On the very first tap, avoid stacking multiple sounds (click + theme).
      playOnboardingTheme();
    } else {
      playUiClick("primary");
    }
    showOnboardingStep(onboardingStep + 1);
  });
  onboardingFinish.addEventListener("click", () => {
    playUiClick("primary");
    triggerHaptic("success");
    finishOnboarding();
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      playUiClick("mode");
      triggerHaptic("heavy");
      modeButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      button.classList.add("is-pressed");
      setTimeout(() => button.classList.remove("is-pressed"), 220);
      state.mode = button.dataset.mode;
      saveState();
      render();
    });
  });

  windowButtons.forEach((button) => {
    button.addEventListener("click", () => {
      playUiClick("ghost");
      triggerHaptic("soft");
      windowButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.window = button.dataset.window;
      saveState();
      render();
    });
  });

  (async () => {
    runBootSequence();
    try {
      const webApp = getTelegramWebApp();
      if (webApp && typeof webApp.ready === "function") webApp.ready();
    } catch {
      // Ignore
    }

    applyDebugStateFromUrl();
    try {
      render();
    } catch (error) {
      // Не даём приложению "зависнуть" на boot-экране из-за runtime-ошибки.
      // В обычном режиме это не должно происходить, но webview бывает капризным.
      // eslint-disable-next-line no-console
      console.error("render_failed", error);
    }

    // Allow Telegram `web_app` buttons to open directly on a specific screen.
    if (STARTUP_SCREEN && onboarding && onboarding.classList.contains("hidden")) {
      setActiveScreen(STARTUP_SCREEN);
    }
    startAccessPolling();
    checkAccessStatus({ manual: false, refresh: true });
  })();
}
