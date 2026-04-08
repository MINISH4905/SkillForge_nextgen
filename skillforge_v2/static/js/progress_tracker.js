/**
 * ═══════════════════════════════════════════════
 * GSDS — Progress Tracker v2.0
 * Full performance analytics for the remediation
 * 30-day plan:
 *  - Heatmap (30-cell day grid)
 *  - Trend chart (score over time with avg line)
 *  - Phase progress strip
 *  - Skill delta (before vs current competency)
 *  - Per-topic breakdown table
 *  - Streak indicator
 * ═══════════════════════════════════════════════
 */

const ProgressTracker = {

  // ── Colour Helpers ─────────────────────────────────────────────────────────
  _scoreColor: function (score) {
    if (score === null || score === undefined) return '#1e2128';  // untouched
    if (score >= 85) return '#00d4a8';   // excellent
    if (score >= 70) return '#f5a623';   // good
    if (score >= 50) return '#AFA9EC';   // partial
    return '#ff5c5c';                    // struggling
  },

  _phaseColor: function (phase) {
    return ['#5DCAA5', '#FAC775', '#AFA9EC', '#D4537E'][phase - 1] || '#7a7f8e';
  },

  // ── 1. Heatmap ─────────────────────────────────────────────────────────────
  /**
   * Renders a 6-column × 5-row grid of 30 day cells on a canvas.
   * Colour = score band. Outline = today. Pulsing = checkpoint.
   */
  drawHeatmap: function (canvas, plan) {
    if (!canvas || !plan) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.clientWidth || 280;
    const displayH = canvas.clientHeight || 210;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.scale(dpr, dpr);

    const cols = 6;
    const gap = 6;
    const cellW = (displayW - gap * (cols + 1)) / cols;
    const cellH = cellW * 0.85;

    ctx.clearRect(0, 0, displayW, displayH);

    plan.days.forEach((day, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gap + col * (cellW + gap);
      const y = gap + row * (cellH + gap);

      const isToday = day.day === plan.current_day;
      const isCheckpoint = day.is_checkpoint;
      const fillColor = day.completed ? this._scoreColor(day.score) : '#1e2128';

      // Cell fill
      ctx.fillStyle = fillColor;
      this._roundRect(ctx, x, y, cellW, cellH, 5);
      ctx.fill();

      // Checkpoint hatch pattern
      if (isCheckpoint && !day.completed) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = '#2a2d36';
        ctx.lineWidth = 1;
        for (let lx = x - cellH; lx < x + cellW; lx += 5) {
          ctx.beginPath();
          ctx.moveTo(lx, y);
          ctx.lineTo(lx + cellH, y + cellH);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Today outline
      if (isToday) {
        ctx.strokeStyle = '#00d4a8';
        ctx.lineWidth = 2;
        this._roundRect(ctx, x + 1, y + 1, cellW - 2, cellH - 2, 4);
        ctx.stroke();
      }

      // Checkpoint flag
      if (isCheckpoint) {
        ctx.fillStyle = day.completed && day.score >= 70 ? '#00d4a8' : '#f5a623';
        ctx.font = `bold ${Math.max(8, cellW * 0.22)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏁', x + cellW / 2, y + cellH / 2);
      } else {
        // Day number
        ctx.fillStyle = day.completed ? '#0e0f11' : '#4a4f5c';
        ctx.font = `${Math.max(8, cellW * 0.22)}px "DM Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(day.day), x + cellW / 2, y + cellH / 2);
      }
    });

    // Legend
    const legendY = displayH - 14;
    const swatchW = 10;
    const items = [
      { color: '#00d4a8', label: '85%+' },
      { color: '#f5a623', label: '70%+' },
      { color: '#AFA9EC', label: '50%+' },
      { color: '#ff5c5c', label: '<50%' }
    ];
    ctx.font = '9px "DM Sans", sans-serif';
    let lx = 4;
    items.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, legendY, swatchW, swatchW);
      ctx.fillStyle = '#7a7f8e';
      ctx.fillText(item.label, lx + swatchW + 3, legendY + 8);
      lx += swatchW + 30;
    });
  },

  // ── 2. Trend Chart ─────────────────────────────────────────────────────────
  /**
   * Line chart of score per completed day, with a rolling average band
   * and a dotted 70% threshold line.
   */
  drawTrendChart: function (canvas, plan) {
    if (!canvas || !plan) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 340;
    const H = canvas.clientHeight || 180;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const padL = 36, padR = 12, padT = 14, padB = 28;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Axes
    ctx.strokeStyle = '#2a2d36';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + chartH);
    ctx.lineTo(padL + chartW, padT + chartH);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#4a4f5c';
    ctx.font = '9px "DM Sans", sans-serif';
    ctx.textAlign = 'right';
    [0, 25, 50, 75, 100].forEach(v => {
      const y = padT + chartH - (v / 100) * chartH;
      ctx.fillText(v + '%', padL - 4, y + 3);
      if (v > 0) {
        ctx.strokeStyle = '#1e2128';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(padL + 1, y);
        ctx.lineTo(padL + chartW, y);
        ctx.stroke();
      }
    });

    // 70% threshold line (dashed)
    const threshY = padT + chartH - (70 / 100) * chartH;
    ctx.strokeStyle = '#f5a623';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, threshY);
    ctx.lineTo(padL + chartW, threshY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f5a623';
    ctx.font = '8px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('70%', padL + chartW - 20, threshY - 3);

    // Data points from snapshots
    const snaps = (plan.skill_snapshots || []).filter(s => s.score !== null && s.score !== undefined);
    if (snaps.length < 2) {
      ctx.fillStyle = '#4a4f5c';
      ctx.textAlign = 'center';
      ctx.font = '11px "DM Sans", sans-serif';
      ctx.fillText('Complete more days to see your trend', padL + chartW / 2, padT + chartH / 2);
      return;
    }

    const toX = (day) => padL + ((day - 1) / 29) * chartW;
    const toY = (score) => padT + chartH - (score / 100) * chartH;

    // Gradient fill under line
    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    grad.addColorStop(0, 'rgba(0, 212, 168, 0.25)');
    grad.addColorStop(1, 'rgba(0, 212, 168, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(toX(snaps[0].day), padT + chartH);
    snaps.forEach(s => ctx.lineTo(toX(s.day), toY(s.score)));
    ctx.lineTo(toX(snaps[snaps.length - 1].day), padT + chartH);
    ctx.closePath();
    ctx.fill();

    // Score line
    ctx.strokeStyle = '#00d4a8';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    snaps.forEach((s, i) => {
      const x = toX(s.day), y = toY(s.score);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Rolling average (5-day window)
    if (snaps.length >= 3) {
      const avgPoints = snaps.map((s, i) => {
        const window = snaps.slice(Math.max(0, i - 2), i + 3);
        const avg = window.reduce((sum, p) => sum + p.score, 0) / window.length;
        return { day: s.day, avg };
      });
      ctx.strokeStyle = 'rgba(175, 169, 236, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      avgPoints.forEach((p, i) => {
        const x = toX(p.day), y = toY(p.avg);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Dot markers
    snaps.forEach(s => {
      ctx.fillStyle = this._scoreColor(s.score);
      ctx.beginPath();
      ctx.arc(toX(s.day), toY(s.score), 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // X-axis day labels (sparse)
    ctx.fillStyle = '#4a4f5c';
    ctx.font = '8px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    [1, 7, 14, 21, 28, 30].forEach(d => {
      ctx.fillText('D' + d, toX(d), padT + chartH + 14);
    });
  },

  // ── 3. Phase Progress Strip ────────────────────────────────────────────────
  renderPhaseStrip: function (container, plan) {
    if (!container || !plan) return;
    const phases = [
      { phase: 1, name: 'Foundation',  range: '1–7',   icon: '🧱' },
      { phase: 2, name: 'Application', range: '8–16',  icon: '⚙️' },
      { phase: 3, name: 'Stress Test', range: '17–24', icon: '🔥' },
      { phase: 4, name: 'Mastery',     range: '25–30', icon: '🏆' }
    ];

    container.innerHTML = phases.map(p => {
      const unlocked = (plan.phase_unlocked || [1]).includes(p.phase);
      const active = plan.current_phase === p.phase;
      const done = plan.current_phase > p.phase;

      // Compute phase completion %
      const phaseDays = plan.days.filter(d => d.phase === p.phase && !d.is_checkpoint);
      const completedInPhase = phaseDays.filter(d => d.completed).length;
      const pct = phaseDays.length ? Math.round((completedInPhase / phaseDays.length) * 100) : 0;

      return `
        <div class="phase-card ${active ? 'active' : ''} ${done ? 'completed' : ''} ${!unlocked ? 'locked' : ''}" title="${p.name} — Days ${p.range}">
          <div class="phase-icon">${!unlocked ? '🔒' : done ? '✅' : p.icon}</div>
          <div class="phase-info">
            <div class="phase-name">${p.name}</div>
            <div class="phase-days">Days ${p.range}</div>
            ${unlocked ? `
              <div class="phase-bar-wrap">
                <div class="phase-bar" style="width:${pct}%; background:${this._phaseColor(p.phase)};"></div>
              </div>
              <div class="phase-pct">${pct}%</div>
            ` : '<div class="phase-locked-hint">Complete previous checkpoint</div>'}
          </div>
        </div>
      `;
    }).join('');
  },

  // ── 4. Skill Delta Panel ───────────────────────────────────────────────────
  /**
   * Shows before-vs-now competency as a pair of horizontal bars.
   * baselineScore = competency_score at plan start.
   */
  renderSkillDelta: function (container, plan, baselineScore) {
    if (!container || !plan) return;
    const current = plan.overall_competency || 0;
    const baseline = baselineScore || 0;
    const delta = current - baseline;
    const deltaLabel = delta >= 0 ? `+${delta}` : String(delta);
    const deltaColor = delta > 0 ? '#00d4a8' : delta < 0 ? '#ff5c5c' : '#7a7f8e';

    container.innerHTML = `
      <div class="skill-delta-panel">
        <div class="sd-row">
          <span class="sd-label">Before plan</span>
          <div class="sd-bar-wrap">
            <div class="sd-bar sd-before" style="width:${baseline}%"></div>
          </div>
          <span class="sd-value">${baseline}%</span>
        </div>
        <div class="sd-row">
          <span class="sd-label">Current</span>
          <div class="sd-bar-wrap">
            <div class="sd-bar sd-current" style="width:${current}%"></div>
          </div>
          <span class="sd-value">${current}%</span>
        </div>
        <div class="sd-delta" style="color:${deltaColor}">
          ${delta >= 0 ? '↑' : '↓'} <strong>${deltaLabel} pts</strong>
          ${delta > 10 ? '— Great improvement!' : delta > 0 ? '— Improving!' : delta === 0 ? '— Keep going!' : '— More practice needed'}
        </div>
      </div>
    `;
  },

  // ── 5. Per-Topic Breakdown Table ───────────────────────────────────────────
  renderTopicBreakdown: function (container, plan) {
    if (!container || !plan) return;

    // Aggregate scores by topic
    const topicMap = {};
    plan.days.forEach(d => {
      if (!d.topic || d.is_checkpoint) return;
      if (!topicMap[d.topic]) topicMap[d.topic] = { scores: [], days: 0 };
      topicMap[d.topic].days++;
      if (d.completed && d.score !== null) topicMap[d.topic].scores.push(d.score);
    });

    const rows = Object.entries(topicMap).map(([topic, data]) => {
      const avg = data.scores.length
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : null;
      const status = avg === null ? 'pending'
        : avg >= 85 ? 'excellent'
        : avg >= 70 ? 'good'
        : avg >= 50 ? 'partial'
        : 'struggling';

      const statusConfig = {
        pending:    { icon: '⏳', label: 'Not started', color: '#4a4f5c' },
        excellent:  { icon: '⭐', label: `${avg}% — Excellent`, color: '#00d4a8' },
        good:       { icon: '✅', label: `${avg}% — Good`, color: '#f5a623' },
        partial:    { icon: '📈', label: `${avg}% — Improving`, color: '#AFA9EC' },
        struggling: { icon: '⚠️', label: `${avg}% — Needs work`, color: '#ff5c5c' }
      };
      const cfg = statusConfig[status];
      return { topic, avg, days: data.days, attempted: data.scores.length, cfg };
    });

    // Sort: worst first (needs most attention at top)
    rows.sort((a, b) => {
      if (a.avg === null && b.avg === null) return 0;
      if (a.avg === null) return -1;
      if (b.avg === null) return 1;
      return a.avg - b.avg;
    });

    container.innerHTML = `
      <table class="topic-breakdown-table">
        <thead>
          <tr>
            <th>Topic</th>
            <th>Days</th>
            <th>Progress</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td class="tb-topic">${r.topic}</td>
              <td class="tb-days">${r.attempted}/${r.days}</td>
              <td class="tb-bar-cell">
                <div class="tb-bar-wrap">
                  <div class="tb-bar" style="width:${r.avg || 0}%; background:${r.cfg.color};"></div>
                </div>
              </td>
              <td class="tb-status" style="color:${r.cfg.color}">${r.cfg.icon} ${r.cfg.label}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  // ── 6. Streak Indicator ────────────────────────────────────────────────────
  renderStreakIndicator: function (container, plan) {
    if (!container || !plan) return;
    const snaps = plan.skill_snapshots || [];

    // Compute current streak from consecutive days
    let streak = 0;
    const today = new Date();
    for (let i = snaps.length - 1; i >= 0; i--) {
      const snap = snaps[i];
      const snapDate = new Date(plan.last_active || today);
      // Check if snap was "today" or consecutive — simplified: count consecutive snaps
      streak++;
      if (i < snaps.length - 1) {
        // In a real app, compare dates — for now just count
      }
    }

    const streakDisplay = Math.min(streak, 30);
    const flames = streakDisplay >= 7 ? '🔥🔥🔥' : streakDisplay >= 3 ? '🔥🔥' : streakDisplay >= 1 ? '🔥' : '';

    container.innerHTML = `
      <div class="streak-panel">
        <div class="streak-number">${streakDisplay}</div>
        <div class="streak-label">day streak ${flames}</div>
        <div class="streak-sub">${streakDisplay >= 7 ? "You're on fire!" : streakDisplay >= 3 ? "Keep going!" : "Start your streak!"}</div>
      </div>
    `;
  },

  // ── 7. Summary Stats Bar ───────────────────────────────────────────────────
  renderSummaryBar: function (container, plan) {
    if (!container || !plan) return;
    const summary = PlanGenerator.getSummary(plan);
    if (!summary) return;

    container.innerHTML = `
      <div class="summary-bar">
        <div class="sb-stat">
          <div class="sb-val">${summary.days_done}<span class="sb-of">/30</span></div>
          <div class="sb-key">Days Done</div>
        </div>
        <div class="sb-stat">
          <div class="sb-val">${summary.overall_competency}%</div>
          <div class="sb-key">Competency</div>
        </div>
        <div class="sb-stat">
          <div class="sb-val">${summary.checkpoints_passed}<span class="sb-of">/4</span></div>
          <div class="sb-key">Checkpoints</div>
        </div>
        <div class="sb-stat">
          <div class="sb-val">${summary.total_xp_earned}</div>
          <div class="sb-key">XP Earned</div>
        </div>
        <div class="sb-stat">
          <div class="sb-val">${summary.best_score !== null ? summary.best_score + '%' : '—'}</div>
          <div class="sb-key">Best Score</div>
        </div>
      </div>
    `;
  },

  // ── Utility: Rounded Rect ──────────────────────────────────────────────────
  _roundRect: function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
};

window.ProgressTracker = ProgressTracker;
