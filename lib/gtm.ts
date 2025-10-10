type GtmEvent = Record<string, unknown>;

export type GtmWindow = Window & {
  dataLayer?: GtmEvent[];
  __gtmQueue?: GtmEvent[];
  __gtmLoaded?: boolean;
};

function getWindow(): GtmWindow | null {
  if (typeof window === "undefined") return null;
  return window as GtmWindow;
}

function ensureGlobals(win: GtmWindow) {
  if (!win.dataLayer) {
    win.dataLayer = [];
  }
  if (!win.__gtmQueue) {
    win.__gtmQueue = [];
  }
  if (typeof win.__gtmLoaded !== "boolean") {
    win.__gtmLoaded = false;
  }
}

function isDev() {
  return process.env.NODE_ENV !== "production";
}

function logDebug(message: string, payload: unknown) {
  if (!isDev()) return;
  try {
    // eslint-disable-next-line no-console -- development diagnostics
    console.info(`[GTM] ${message}`, payload);
  } catch {
    // ignore logging failures
  }
}

export function pushToDataLayer(event: GtmEvent) {
  const win = getWindow();
  if (!win) return;

  ensureGlobals(win);

  if (win.__gtmLoaded && win.dataLayer) {
    win.dataLayer.push(event);
    logDebug("pushed", event);
    return;
  }

  win.__gtmQueue!.push(event);

  if (win.dataLayer) {
    win.dataLayer.push(event);
  }

  logDebug("queued", event);
}

export function gtmHasLoaded(): boolean {
  const win = getWindow();
  return Boolean(win?.__gtmLoaded);
}
