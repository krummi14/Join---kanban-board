import { extractIDs } from "./list.js";
import { insertNewContactData, editCurrentContactData } from "./assets.js";

const FIREBASE_CACHE_PREFIX = "join-cache:";
const FIREBASE_CACHE_META_PREFIX = "join-cache-meta:";

export async function getData(path = "", options = {}) {
    const normalizedPath = normalizePath(path);
    const requestOptions = normalizeGetDataOptions(options);
    const cachedData = readCachedData(normalizedPath);

    if (requestOptions.preferCache && cachedData !== null) {
        refreshCachedDataInBackground(normalizedPath, requestOptions);
        return cachedData;
    }

    try {
        return await fetchAndCacheData(normalizedPath);
    } catch (error) {
        return readCachedFallback(normalizedPath, error);
    }
}

export async function putNewData(path = "", contactsIndex) {
    let newId = extractIDs();
    let newContact = insertNewContactData(contactsIndex);
    newContact.id = newId;
    const normalizedPath = normalizePath(path + (newId - 1));
    await putJson(normalizedPath, newContact);
    syncCachedWrite(normalizedPath, newContact);
    contactsList.push(newContact);
    return newId;
}

export async function putEditData(path = "", contactsIndex) {
    let editContact = editCurrentContactData(contactsIndex); // Daten aus dem Dialog holen
    let currentId = editContact.id
    const normalizedPath = normalizePath(path + (currentId - 1));
    await fetch(buildUrl(normalizedPath), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editContact)
    });
    writeCachedData(normalizedPath, editContact);
    mergeCachedParent(normalizedPath, editContact);
    contactsList[contactsIndex] = editContact; // in Liste speichern
    return currentId;
}

export async function deleteData(path = "") {
    const normalizedPath = normalizePath(path);
    let response = await fetch(buildUrl(normalizedPath), {
        method: "DELETE",
    });
    removeCachedData(normalizedPath);
    removeFromCachedParent(normalizedPath);
    return await response.json();
}

export async function putUserData(path = "", data = {}) {
    const normalizedPath = normalizePath(path);
    await fetch(buildUrl(normalizedPath), {
        method: "PATCH", //PUT BEDEUTET „Ersetze ALLES an diesem Pfad komplett“
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const cachedEntry = readCachedData(normalizedPath);
    const nextData = isPlainObject(cachedEntry) && isPlainObject(data)
        ? { ...cachedEntry, ...data }
        : data;
    writeCachedData(normalizedPath, nextData);
    mergeCachedParent(normalizedPath, nextData);
}

function buildUrl(path = "") {
    return `${BASE_URL}${path}.json`;
}

async function fetchAndCacheData(normalizedPath) {
    let response = await fetch(buildUrl(normalizedPath));
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    let responseToJson = await response.json();
    writeCachedData(normalizedPath, responseToJson);
    return responseToJson;
}

function readCachedFallback(normalizedPath, error) {
    const cachedData = readCachedData(normalizedPath);
    if (cachedData === null) throw error;
    console.warn(`Using cached Firebase data for ${normalizedPath || "root"}.`, error);
    return cachedData;
}

async function putJson(normalizedPath, data) {
    await fetch(buildUrl(normalizedPath), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

function syncCachedWrite(normalizedPath, data) {
    writeCachedData(normalizedPath, data);
    mergeCachedParent(normalizedPath, data);
}

function normalizePath(path = "") {
    return String(path || "").replace(/^\/+|\/+$/g, "");
}

function getCacheKey(path = "") {
    return `${FIREBASE_CACHE_PREFIX}${path || "__root__"}`;
}

function getCacheMetaKey(path = "") {
    return `${FIREBASE_CACHE_META_PREFIX}${path || "__root__"}`;
}

function readCachedData(path = "") {
    try {
        const cached = localStorage.getItem(getCacheKey(path));
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

function writeCachedData(path = "", data = null) {
    try {
        localStorage.setItem(getCacheKey(path), JSON.stringify(data));
        writeCachedMeta(path);
    } catch {
        return;
    }
}

function removeCachedData(path = "") {
    try {
        localStorage.removeItem(getCacheKey(path));
        localStorage.removeItem(getCacheMetaKey(path));
    } catch {
        return;
    }
}

function writeCachedMeta(path = "") {
    try {
        localStorage.setItem(getCacheMetaKey(path), String(Date.now()));
    } catch {
        return;
    }
}

function readCachedAge(path = "") {
    try {
        const value = localStorage.getItem(getCacheMetaKey(path));
        if (!value) return Number.POSITIVE_INFINITY;
        const timestamp = Number(value);
        if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
        return Date.now() - timestamp;
    } catch {
        return Number.POSITIVE_INFINITY;
    }
}

function normalizeGetDataOptions(options = {}) {
    return {
        preferCache: Boolean(options.preferCache),
        refreshInBackground: Boolean(options.refreshInBackground),
        maxAgeMs: Number.isFinite(options.maxAgeMs) ? options.maxAgeMs : 0,
    };
}

function refreshCachedDataInBackground(normalizedPath, options) {
    if (!shouldRefreshCache(normalizedPath, options)) return;
    void fetchAndCacheData(normalizedPath).catch(() => undefined);
}

function shouldRefreshCache(normalizedPath, options) {
    if (!options.refreshInBackground) return false;
    if (options.maxAgeMs <= 0) return true;
    return readCachedAge(normalizedPath) >= options.maxAgeMs;
}

function mergeCachedParent(path, data) {
    const { parentPath, leafKey } = splitPath(path);
    if (!leafKey) return;
    const parentData = readCachedData(parentPath);
    if (!isPlainObject(parentData)) return;
    writeCachedData(parentPath, { ...parentData, [leafKey]: data });
}

function removeFromCachedParent(path) {
    const { parentPath, leafKey } = splitPath(path);
    if (!leafKey) return;
    const parentData = readCachedData(parentPath);
    if (!isPlainObject(parentData)) return;
    const nextParentData = { ...parentData };
    delete nextParentData[leafKey];
    writeCachedData(parentPath, nextParentData);
}

function splitPath(path = "") {
    const segments = normalizePath(path).split("/").filter(Boolean);
    return {
        parentPath: segments.slice(0, -1).join("/"),
        leafKey: segments.at(-1) || "",
    };
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}