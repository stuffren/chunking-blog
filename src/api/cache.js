const PREFIX = 'ck_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5分钟

export const cache = {
  get(key) {
    try {
      const item = localStorage.getItem(PREFIX + key);
      if (!item) return null;
      const { data, exp } = JSON.parse(item);
      if (Date.now() > exp) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  set(key, data, ttl = DEFAULT_TTL) {
    localStorage.setItem(PREFIX + key, JSON.stringify({
      data,
      exp: Date.now() + ttl
    }));
  },

  clear(pattern) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX) && (!pattern || key.includes(pattern))) {
        localStorage.removeItem(key);
      }
    }
  }
};