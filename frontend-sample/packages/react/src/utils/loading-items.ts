const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function setWithExpiry(key: string, value: any, ttlMs: number = ONE_WEEK_MS) {
    const now = Date.now();
    const item = {
        value,
        expiry: now + ttlMs,
    };
    localStorage.setItem(key, JSON.stringify(item));
}

export function getWithExpiry<T = any>(key: string): T | null {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
        const item = JSON.parse(itemStr);
        if (Date.now() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return item.value as T;
    } catch {
        return null;
    }
}

export { ONE_WEEK_MS };
