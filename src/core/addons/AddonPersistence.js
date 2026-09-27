const STORAGE_KEY = 'indigo-addons';
const ADDON_DATA_KEY = 'indigo-addon-data';

export function persistAddons(addons) {
  try {
    const addonList = addons.map(addon => ({
      id: addon.id,
      url: addon.url,
    }));

    const state = {
      loadedAddons: addonList,
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('[Persistence] Addons saved', addonList.length);
  } catch (error) {
    console.error('[Persistence] Failed to save addons:', error);
  }
}

export function loadPersistedAddons() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const state = JSON.parse(stored);
    const addons = state.loadedAddons || [];

    console.log('[Persistence] Loaded', addons.length, 'addon URLs');
    return addons;
  } catch (error) {
    console.error('[Persistence] Failed to load addons:', error);
    return [];
  }
}

export function saveAddonData(addonId, key, value) {
  try {
    let allData = {};
    const stored = localStorage.getItem(ADDON_DATA_KEY);
    if (stored) {
      allData = JSON.parse(stored);
    }

    if (!allData[addonId]) {
      allData[addonId] = {};
    }

    allData[addonId][key] = value;

    localStorage.setItem(ADDON_DATA_KEY, JSON.stringify(allData));
    console.log(`[Persistence] Saved addon data: ${addonId}/${key}`);
  } catch (error) {
    console.error('[Persistence] Failed to save addon data:', error);
  }
}

export function getAddonData(addonId, key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(ADDON_DATA_KEY);
    if (!stored) return defaultValue;

    const allData = JSON.parse(stored);
    const addonData = allData[addonId];

    if (!addonData) return defaultValue;

    const value = addonData[key];
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    console.error('[Persistence] Failed to get addon data:', error);
    return defaultValue;
  }
}

export function getAllAddonData(addonId) {
  try {
    const stored = localStorage.getItem(ADDON_DATA_KEY);
    if (!stored) return {};

    const allData = JSON.parse(stored);
    return allData[addonId] || {};
  } catch (error) {
    console.error('[Persistence] Failed to get addon data:', error);
    return {};
  }
}

export function clearAddonData(addonId) {
  try {
    let allData = {};
    const stored = localStorage.getItem(ADDON_DATA_KEY);
    if (stored) {
      allData = JSON.parse(stored);
    }

    delete allData[addonId];

    if (Object.keys(allData).length === 0) {
      localStorage.removeItem(ADDON_DATA_KEY);
    } else {
      localStorage.setItem(ADDON_DATA_KEY, JSON.stringify(allData));
    }

    console.log(`[Persistence] Cleared data for addon: ${addonId}`);
  } catch (error) {
    console.error('[Persistence] Failed to clear addon data:', error);
  }
}

export function clearAllAddonData() {
  try {
    localStorage.removeItem(ADDON_DATA_KEY);
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Persistence] Cleared all addon data');
  } catch (error) {
    console.error('[Persistence] Failed to clear all data:', error);
  }
}

export function getAddonStorageInfo() {
  try {
    const addons = localStorage.getItem(STORAGE_KEY);
    const data = localStorage.getItem(ADDON_DATA_KEY);

    return {
      addonUrls: addons ? JSON.parse(addons) : null,
      addonData: data ? JSON.parse(data) : null,
      storageSize: (addons?.length || 0) + (data?.length || 0),
    };
  } catch (error) {
    console.error('[Persistence] Failed to get storage info:', error);
    return null;
  }
}
