/**
 * InsightCache — cache simples em memória para insights.
 */
class InsightCache {
  constructor({ ttl = 300 } = {}) {
    this.ttl = ttl;
    this._entries = new Map();
  }

  set(key, value) {
    this._entries.set(key, {
      value,
      expiresAt: Date.now() + this.ttl * 1000
    });
  }

  get(key) {
    const entry = this._entries.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this._entries.delete(key);
      return null;
    }

    return entry.value;
  }

  invalidate(key) {
    this._entries.delete(key);
  }

  refresh(key, value) {
    this.set(key, value);
  }

  clear() {
    this._entries.clear();
  }
}

module.exports = InsightCache;
