
import { AddonUI, removeAddonPanel } from "./AddonsUI.jsx";
import {
  saveAddonData,
  getAddonData,
  getAllAddonData,
  clearAddonData,
} from "./AddonPersistence.js";

export const addons = new Map();
const hooks = new Map();

export function registerHook(hookName, callback) {
  if (!hooks.has(hookName)) {
    hooks.set(hookName, []);
  }
  hooks.get(hookName).push(callback);
}

export async function executeHook(hookName, data) {
  const callbacks = hooks.get(hookName) || [];
  let result = data;

  for (const callback of callbacks) {
    try {
      result = await callback(result);
    } catch (error) {
      console.error(`Error executing hook ${hookName}:`, error);
    }
  }

  return result;
}

function getAddonIdForUrl(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 31 + url.charCodeAt(i)) | 0;
  }
  return `addon-${Math.abs(hash).toString(36)}`;
}

export async function loadAddon(url) {
  const addonId = getAddonIdForUrl(url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch addon: ${response.status}`);
    }

    const code = await response.text();

    const addonAPI = {
      registerHook,
      executeHook,
      id: addonId,
      UIClass: AddonUI,
      persistence: {
        saveAddonData: (key, value) => saveAddonData(addonId, key, value),
        getAddonData: (key, defaultValue) =>
          getAddonData(addonId, key, defaultValue),
        getAllAddonData: () => getAllAddonData(addonId),
      },
      utils: {
        replaceText: (text, from, to) =>
          text.replace(new RegExp(from, "g"), to),
        contains: (text, substring) => text.includes(substring),
      },
    };

    const addonFunction = new Function(
      "addon",
      `${code}\nreturn typeof onLoad !== 'undefined' ? onLoad(addon) : null;`,
    );

    const addonExports = await addonFunction(addonAPI);

    addons.set(addonId, {
      id: addonId,
      url,
      loadedAt: Date.now(),
      exports: addonExports,
      code,
    });

    console.log(`[Addon] Loaded addon: ${addonId}`);
    return addonId;
  } catch (error) {
    console.error(`[Addon] Failed to load addon from ${url}:`, error);
    throw error;
  }
}

export function unloadAddon(addonId) {
  if (!addons.has(addonId)) {
    console.warn(`[Addon] Addon not found: ${addonId}`);
    return false;
  }

  const addon = addons.get(addonId);

  const panelId = `panel-${addonId}`;
  removeAddonPanel(panelId);

  addons.delete(addonId);

  for (const [hookName, callbacks] of hooks.entries()) {
    hooks.set(
      hookName,
      callbacks.filter((cb) => cb.__addonId !== addonId),
    );
  }

  console.log(`[Addon] Unloaded addon: ${addonId}`);
  return true;
}

export function getLoadedAddons() {
  return Array.from(addons.values());
}

export function getAddon(addonId) {
  return addons.get(addonId);
}

export function hasAddon(addonId) {
  return addons.has(addonId);
}
