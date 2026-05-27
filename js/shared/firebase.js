import { extractIDs } from "./list.js";
import { insertNewContactData, editCurrentContactData } from "./assets.js";

const FIREBASE_CACHE_PREFIX = "join-cache:";
const FIREBASE_CACHE_META_PREFIX = "join-cache-meta:";

/**
 * Reads data from Firebase with optional cache support.
 * 
 * Normalizes the requested path, consults the configured cache behavior,
 * and falls back to cached data when network requests fail.
 * 
 * @param {string} [path=""] - Firebase path to read.
 * @param {Object} [options={}] - Cache and refresh options.
 * @returns {Promise<*>} The loaded Firebase data.
 */
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

/**
 * Creates a new contact entry and updates the local cache.
 * 
 * Generates a new contact id, builds the payload from the current form,
 * persists it to Firebase, and synchronizes local cache state.
 * 
 * @param {string} [path=""] - Base Firebase path for contacts.
 * @param {number} contactsIndex - Contact form index used to read inputs.
 * @returns {Promise<number>} The newly created contact id.
 */
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

/**
 * Updates an existing contact entry and synchronizes the cache.
 * 
 * Reads the edited contact values from the dialog, writes them back
 * to Firebase, and updates both cache and in-memory contact state.
 * 
 * @param {string} [path=""] - Base Firebase path for contacts.
 * @param {number} contactsIndex - Contact index being edited.
 * @returns {Promise<number>} The id of the updated contact.
 */
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

/**
 * Deletes data at the given Firebase path.
 * 
 * Removes the remote record and clears matching cache entries
 * in both the direct path and cached parent object.
 * 
 * @param {string} [path=""] - Firebase path to delete.
 * @returns {Promise<*>} The Firebase delete response payload.
 */
export async function deleteData(path = "") {
    const normalizedPath = normalizePath(path);
    let response = await fetch(buildUrl(normalizedPath), {
        method: "DELETE",
    });
    removeCachedData(normalizedPath);
    removeFromCachedParent(normalizedPath);
    return await response.json();
}

/**
 * Writes partial user data to Firebase and merges the cache.
 * 
 * Sends a PATCH request for the provided fields and keeps the local
 * cache synchronized with the merged result.
 * 
 * @param {string} [path=""] - Firebase path to update.
 * @param {Object} [data={}] - Partial data to merge into the record.
 * @returns {Promise<void>}
 */
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

/** Builds the Firebase REST URL for a normalized path. */
function buildUrl(path = "") {
    return `${BASE_URL}${path}.json`;
}

/** Fetches data from Firebase and stores it in the cache. */
async function fetchAndCacheData(normalizedPath) {
    let response = await fetch(buildUrl(normalizedPath));
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    let responseToJson = await response.json();
    writeCachedData(normalizedPath, responseToJson);
    return responseToJson;
}

/** Falls back to cached data when a request fails. */
function readCachedFallback(normalizedPath, error) {
    const cachedData = readCachedData(normalizedPath);
    if (cachedData === null) throw error;
    console.warn(`Using cached Firebase data for ${normalizedPath || "root"}.`, error);
    return cachedData;
}

/** Writes a full JSON document to Firebase. */
async function putJson(normalizedPath, data) {
    await fetch(buildUrl(normalizedPath), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

/** Synchronizes a successful write into the relevant cache entries. */
function syncCachedWrite(normalizedPath, data) {
    writeCachedData(normalizedPath, data);
    mergeCachedParent(normalizedPath, data);
}

/** Normalizes a Firebase path string. */
function normalizePath(path = "") {
    return String(path || "").replace(/^\/+|\/+$/g, "");
}

/** Returns the local-storage cache key for a path. */
function getCacheKey(path = "") {
    return `${FIREBASE_CACHE_PREFIX}${path || "__root__"}`;
}

/** Returns the local-storage metadata key for a path. */
function getCacheMetaKey(path = "") {
    return `${FIREBASE_CACHE_META_PREFIX}${path || "__root__"}`;
}

/** Reads cached JSON data for a path. */
function readCachedData(path = "") {
    try {
        const cached = localStorage.getItem(getCacheKey(path));
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

/** Stores JSON data in the cache and updates its metadata. */
function writeCachedData(path = "", data = null) {
    try {
        localStorage.setItem(getCacheKey(path), JSON.stringify(data));
        writeCachedMeta(path);
    } catch {
        return;
    }
}

/** Removes cached data and metadata for a path. */
function removeCachedData(path = "") {
    try {
        localStorage.removeItem(getCacheKey(path));
        localStorage.removeItem(getCacheMetaKey(path));
    } catch {
        return;
    }
}

/** Stores the cache timestamp metadata for a path. */
function writeCachedMeta(path = "") {
    try {
        localStorage.setItem(getCacheMetaKey(path), String(Date.now()));
    } catch {
        return;
    }
}

/** Returns the current age of a cached entry in milliseconds. */
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

/** Normalizes the getData option object. */
function normalizeGetDataOptions(options = {}) {
    return {
        preferCache: Boolean(options.preferCache),
        refreshInBackground: Boolean(options.refreshInBackground),
        maxAgeMs: Number.isFinite(options.maxAgeMs) ? options.maxAgeMs : 0,
    };
}

/** Starts a background cache refresh when configured to do so. */
function refreshCachedDataInBackground(normalizedPath, options) {
    if (!shouldRefreshCache(normalizedPath, options)) return;
    void fetchAndCacheData(normalizedPath).catch(() => undefined);
}

/** Returns whether the cache should be refreshed in the background. */
function shouldRefreshCache(normalizedPath, options) {
    if (!options.refreshInBackground) return false;
    if (options.maxAgeMs <= 0) return true;
    return readCachedAge(normalizedPath) >= options.maxAgeMs;
}

/** Merges a written child record into its cached parent object. */
function mergeCachedParent(path, data) {
    const { parentPath, leafKey } = splitPath(path);
    if (!leafKey) return;
    const parentData = readCachedData(parentPath);
    if (!isPlainObject(parentData)) return;
    writeCachedData(parentPath, { ...parentData, [leafKey]: data });
}

/** Removes a deleted child record from its cached parent object. */
function removeFromCachedParent(path) {
    const { parentPath, leafKey } = splitPath(path);
    if (!leafKey) return;
    const parentData = readCachedData(parentPath);
    if (!isPlainObject(parentData)) return;
    const nextParentData = { ...parentData };
    delete nextParentData[leafKey];
    writeCachedData(parentPath, nextParentData);
}

/** Splits a Firebase path into parent and leaf segments. */
function splitPath(path = "") {
    const segments = normalizePath(path).split("/").filter(Boolean);
    return {
        parentPath: segments.slice(0, -1).join("/"),
        leafKey: segments.at(-1) || "",
    };
}

/** Returns whether a value is a plain object. */
function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}