/**
 * ═══════════════════════════════════════════════
 * GSDS — API v2.0
 * Centralised HTTP layer. All server calls go
 * through this module. Handles auth headers,
 * error normalisation, and response parsing.
 * ═══════════════════════════════════════════════
 */

const API = (() => {

  // Base URL — adjust for production deployment
  const BASE_URL = (window.GSDS_API_BASE || '') + '/api/v1/learner';

  // ── Internal ──────────────────────────────────────────────────────────────

  function _headers() {
    const learnerId = Store.get('learner_id') || 'default_user';
    return {
      'Content-Type':  'application/json',
      'X-Learner-ID':  learnerId,
    };
  }

  async function _call(path, options = {}) {
    const url = BASE_URL + path;
    const config = {
      ...options,
      headers: { ..._headers(), ...(options.headers || {}) },
    };

    let res;
    try {
      res = await fetch(url, config);
    } catch (networkErr) {
      throw new APIError('Network error — is the server running?', 0, path);
    }

    let data;
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    if (!res.ok) {
      throw new APIError(
        data.error || data.detail || `HTTP ${res.status}`,
        res.status,
        path,
        data
      );
    }

    return data;
  }

  // ── Error Class ───────────────────────────────────────────────────────────

  class APIError extends Error {
    constructor(message, status, path, data = {}) {
      super(message);
      this.name = 'APIError';
      this.status = status;
      this.path = path;
      this.data = data;
    }
  }

  // ── Profile & Domains ────────────────────────────────────────────────────

  async function fetchProfile() {
    const data = await _call('/profile/');
    Store.syncFromAPI(data);
    return data;
  }

  async function fetchDomains() {
    const data = await _call('/domains/');
    // Sync competency scores into store
    if (Array.isArray(data)) {
      data.forEach(d => Store.setCompetency(d.domain, d.competency_score));
    }
    return data;
  }

  // ── Quest / Tasks ────────────────────────────────────────────────────────

  async function fetchNextQuest() {
    return _call('/quest/next/', { method: 'POST' });
  }

  async function fetchTask(taskId) {
    return _call(`/quest/task/${taskId}/`);
  }

  async function startQuest(taskId) {
    return _call(`/quest/start/${taskId}/`, { method: 'POST' });
  }

  async function evaluateQuest(sessionId, code) {
    return _call(`/quest/evaluate/${sessionId}/`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // ── Remediation — Plan ───────────────────────────────────────────────────

  /**
   * GET /remediation/plan/
   * Returns the active plan overview (brief day list).
   * Creates a new plan if none exists.
   */
  async function fetchRemediationPlan() {
    return _call('/remediation/plan/');
  }

  /**
   * GET /remediation/plan/progress/
   * Returns full analytics: snapshots, topic breakdown, phase status, deltas.
   */
  async function fetchRemediationProgress() {
    return _call('/remediation/plan/progress/');
  }

  /**
   * POST /remediation/plan/reset/
   * Deactivates current plan and generates a new one.
   */
  async function resetRemediationPlan() {
    return _call('/remediation/plan/reset/', { method: 'POST' });
  }

  // ── Remediation — Days ───────────────────────────────────────────────────

  /**
   * GET /remediation/day/<N>/
   * Returns full detail for a single day including exercises and resources.
   * @param {number} dayNumber - 1–30
   */
  async function fetchRemediationDay(dayNumber) {
    return _call(`/remediation/day/${dayNumber}/`);
  }

  /**
   * POST /remediation/day/<N>/complete/
   * Submit exercise scores to mark a day complete.
   *
   * @param {number}   dayNumber      - 1–30
   * @param {number[]} exerciseScores - array of per-exercise scores (0–100)
   *
   * Response: { status, day, score, xp_earned, current_day, current_phase,
   *             phase_unlocked, overall_competency, mastered, checkpoint_passed }
   */
  async function completeRemediationDay(dayNumber, exerciseScores) {
    const body = { exercise_scores: exerciseScores };
    return _call(`/remediation/day/${dayNumber}/complete/`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  /**
   * Ping the server — returns true if reachable.
   */
  async function ping() {
    try {
      await fetchProfile();
      return true;
    } catch (_) {
      return false;
    }
  }

  return {
    // Profile
    fetchProfile,
    fetchDomains,

    // Quest
    fetchNextQuest,
    fetchTask,
    startQuest,
    evaluateQuest,

    // Remediation v2
    fetchRemediationPlan,
    fetchRemediationProgress,
    resetRemediationPlan,
    fetchRemediationDay,
    completeRemediationDay,

    // Utils
    ping,
    APIError,
  };
})();

window.API = API;
