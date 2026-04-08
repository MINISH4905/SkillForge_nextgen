/**
 * ═══════════════════════════════════════════════
 * GSDS — Store v2.0
 * Lightweight client-side state management.
 * Persists state to localStorage and exposes
 * get/update/reset API for all modules to use.
 * ═══════════════════════════════════════════════
 */

const Store = (() => {

  const STORAGE_KEY = 'gsds_state_v2';

  // Default state shape
  const DEFAULT_STATE = {
    // Profile
    learner_id:            null,   // set after first API response
    xp_total:              0,
    level:                 1,
    lives:                 3,
    coins:                 100,
    streak_days:           0,

    // Domain competencies: { web: 0, dsa: 0, ... }
    competency_by_domain:  {},

    // Quest / submission history (kept in memory for weak-area detection)
    submissions:           [],     // [{ domain, section_id, score, timestamp }]

    // Remediation plan (full PlanGenerator output, kept client-side)
    remediation_plan:      null,
    remediation_baseline:  0,

    // UI
    active_view:           'home',
    last_updated:          null,
  };

  // ── Internal ──────────────────────────────────────────────────────────────

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const saved = JSON.parse(raw);
      // Merge with defaults so new fields are always present
      return { ...DEFAULT_STATE, ...saved };
    } catch (e) {
      console.warn('[Store] Failed to load state from localStorage:', e);
      return { ...DEFAULT_STATE };
    }
  }

  function _save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[Store] Failed to persist state:', e);
    }
  }

  // In-memory cache to avoid repeated JSON.parse on every get()
  let _cache = null;

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Get the current state (or a specific key).
   * @param {string} [key] - optional dot-notation key
   */
  function get(key) {
    if (!_cache) _cache = _load();
    if (!key) return { ..._cache };
    return _cache[key];
  }

  /**
   * Shallow-merge updates into state and persist.
   * @param {Object} updates - key/value pairs to merge
   */
  function update(updates) {
    if (!_cache) _cache = _load();
    _cache = { ..._cache, ...updates, last_updated: new Date().toISOString() };
    _save(_cache);
  }

  /**
   * Completely replace a top-level key.
   * Useful for replacing the entire plan object.
   */
  function set(key, value) {
    update({ [key]: value });
  }

  /**
   * Reset all state back to defaults.
   */
  function reset() {
    _cache = { ...DEFAULT_STATE };
    _save(_cache);
  }

  /**
   * Record a quest submission for weak-area tracking.
   * Keeps only the last 50 submissions.
   */
  function recordSubmission(domain, sectionId, score) {
    const state = get();
    const submissions = state.submissions || [];
    submissions.push({
      domain,
      section_id: sectionId,
      score,
      timestamp: Date.now(),
    });
    // Keep last 50
    if (submissions.length > 50) submissions.splice(0, submissions.length - 50);
    update({ submissions });
  }

  /**
   * Sync profile data from an API response.
   */
  function syncFromAPI(profileData) {
    const updates = {};
    if (profileData.xp_total   !== undefined) updates.xp_total    = profileData.xp_total;
    if (profileData.level      !== undefined) updates.level       = profileData.level;
    if (profileData.lives      !== undefined) updates.lives       = profileData.lives;
    if (profileData.coins      !== undefined) updates.coins       = profileData.coins;
    if (profileData.streak_days !== undefined) updates.streak_days = profileData.streak_days;
    if (Object.keys(updates).length) update(updates);
  }

  /**
   * Update a single domain competency score.
   */
  function setCompetency(domain, score) {
    const state = get();
    const map = { ...(state.competency_by_domain || {}), [domain]: score };
    update({ competency_by_domain: map });
  }

  return {
    get,
    update,
    set,
    reset,
    recordSubmission,
    syncFromAPI,
    setCompetency,
  };
})();

window.Store = Store;
