/**
 * ═══════════════════════════════════════════════
 * GSDS — Remediation Screen v2.0
 * Full 30-day plan UI:
 *   - Plan overview (heatmap + stats)
 *   - Day detail (concept card, exercises, resources)
 *   - Exercise runner (MCQ, fill-blank, bug-fix, reorder, debug)
 *   - Progress dashboard
 * ═══════════════════════════════════════════════
 */

const Remediation = (() => {

  // ── State ───────────────────────────────────────────────────────────────────
  let _plan = null;
  let _activeDayIndex = null;
  let _exerciseIndex = 0;
  let _sessionScores = [];
  let _baselineCompetency = 0;

  // ── Entry point ─────────────────────────────────────────────────────────────
  async function init() {
    try {
      const apiPlan = await API.fetchRemediationPlan();
      if (apiPlan) {
        _plan = {
          ...apiPlan,
          days: (apiPlan.days || []).map(d => ({
            ...d, day: d.day_number, completed: d.is_completed
          }))
        };
        _baselineCompetency = _plan.baseline_competency || 0;
        Store.update({ remediation_plan: _plan, remediation_baseline: _baselineCompetency });
        _renderOverview();
      } else {
        _fallbackToLocalPlan();
      }
    } catch (e) {
      console.warn("Failed to fetch plan from API, falling back to local:", e);
      _fallbackToLocalPlan();
    }
  }

  function _fallbackToLocalPlan() {
    const state = Store.get();
    _plan = state.remediation_plan || null;
    _baselineCompetency = state.remediation_baseline || 0;

    if (!_plan) {
      _generatePlan(state);
    } else {
      _renderOverview();
    }
  }

  function _generatePlan(state) {
    // Find weakest domain
    const scores = state.competency_by_domain || {};
    const weakestDomain = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]?.[0] || 'web';
    const baseline = scores[weakestDomain] || 0;

    _baselineCompetency = baseline;
    _plan = PlanGenerator.generate(weakestDomain, state.submissions || []);

    Store.update({
      remediation_plan: _plan,
      remediation_baseline: baseline
    });

    _renderOverview();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // OVERVIEW SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  function _renderOverview() {
    const container = document.getElementById('view-remediation');
    if (!container) return;
    const summary = PlanGenerator.getSummary(_plan);
    const domainLabel = { web: 'Web Development', dsa: 'DSA', database: 'Database', aiml: 'AI/ML', sysdesign: 'System Design' }[_plan.domain] || _plan.domain;

    container.innerHTML = `
      <div class="rem-shell">

        <!-- Header -->
        <div class="rem-header">
          <div class="rem-header-left">
            <div class="rem-domain-badge">${domainLabel}</div>
            <h2 class="rem-title">30-Day Recovery Plan</h2>
            <p class="rem-subtitle">Weak spots: <em>${_plan.weak_areas.join(', ')}</em></p>
          </div>
          <div class="rem-header-right">
            <div class="rem-day-counter">
              <span class="rem-day-num">Day ${_plan.current_day}</span>
              <span class="rem-day-of">of 30</span>
            </div>
            ${_plan.mastered ? '<div class="rem-mastered-badge">🏆 Mastered!</div>' : ''}
          </div>
        </div>

        <!-- Summary Bar -->
        <div id="rem-summary-bar"></div>

        <!-- Main grid -->
        <div class="rem-grid">

          <!-- Left: Heatmap + Phase strip -->
          <div class="rem-left-col">
            <div class="rem-card">
              <div class="rem-card-title">Daily Progress</div>
              <canvas id="rem-heatmap" style="width:100%;height:210px;"></canvas>
              <div class="heatmap-legend-note">Click a day cell to open it</div>
            </div>
            <div class="rem-card">
              <div class="rem-card-title">Phases</div>
              <div id="rem-phase-strip"></div>
            </div>
          </div>

          <!-- Centre: Trend + Skill Delta -->
          <div class="rem-centre-col">
            <div class="rem-card">
              <div class="rem-card-title">Performance Trend
                <span class="chart-legend">
                  <span class="leg-dot" style="background:#00d4a8"></span> Score &nbsp;
                  <span class="leg-dot" style="background:#AFA9EC;opacity:0.7"></span> Avg &nbsp;
                  <span class="leg-line" style="border-color:#f5a623"></span> 70% Target
                </span>
              </div>
              <canvas id="rem-trend" style="width:100%;height:180px;"></canvas>
            </div>
            <div class="rem-card">
              <div class="rem-card-title">Skill Improvement</div>
              <div id="rem-skill-delta"></div>
            </div>
            <div class="rem-card">
              <div class="rem-card-title">Streak</div>
              <div id="rem-streak"></div>
            </div>
          </div>

          <!-- Right: Day list + Topic breakdown -->
          <div class="rem-right-col">
            <div class="rem-card rem-card-scroll">
              <div class="rem-card-title">Day-by-Day</div>
              <div class="rem-day-list" id="rem-day-list"></div>
            </div>
            <div class="rem-card">
              <div class="rem-card-title">Topic Breakdown</div>
              <div id="rem-topic-table"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render sub-components
    ProgressTracker.renderSummaryBar(document.getElementById('rem-summary-bar'), _plan);
    ProgressTracker.renderPhaseStrip(document.getElementById('rem-phase-strip'), _plan);
    ProgressTracker.renderSkillDelta(document.getElementById('rem-skill-delta'), _plan, _baselineCompetency);
    ProgressTracker.renderStreakIndicator(document.getElementById('rem-streak'), _plan);
    ProgressTracker.renderTopicBreakdown(document.getElementById('rem-topic-table'), _plan);

    // Canvas renders (after DOM paint)
    requestAnimationFrame(() => {
      const heatCanvas = document.getElementById('rem-heatmap');
      const trendCanvas = document.getElementById('rem-trend');
      if (heatCanvas) ProgressTracker.drawHeatmap(heatCanvas, _plan);
      if (trendCanvas) ProgressTracker.drawTrendChart(trendCanvas, _plan);
    });

    _renderDayList();
    _attachHeatmapClickListener();
  }

  function _renderDayList() {
    const list = document.getElementById('rem-day-list');
    if (!list) return;

    list.innerHTML = _plan.days.map((day, i) => {
      const isToday = day.day === _plan.current_day;
      const isFuture = day.day > _plan.current_day;
      const statusIcon = day.completed
        ? (day.score >= 70 ? '✅' : '⚠️')
        : day.is_checkpoint ? '🏁'
        : isToday ? '▶️'
        : isFuture ? '🔒'
        : '○';

      const scoreTag = day.completed && day.score !== null
        ? `<span class="dl-score" style="color:${ProgressTracker._scoreColor(day.score)}">${day.score}%</span>`
        : '';

      return `
        <div class="day-list-item ${isToday ? 'day-today' : ''} ${day.completed ? 'day-done' : ''} ${isFuture ? 'day-future' : ''} ${day.is_checkpoint ? 'day-checkpoint' : ''}"
             onclick="${isFuture ? '' : `Remediation.openDay(${i})`}"
             style="${isFuture ? 'cursor:not-allowed;opacity:0.45' : 'cursor:pointer'}">
          <span class="dl-icon">${statusIcon}</span>
          <div class="dl-info">
            <div class="dl-label">${day.label}</div>
            <div class="dl-meta">${day.is_checkpoint ? 'Checkpoint Quiz' : (day.time_estimate_min ? `~${day.time_estimate_min} min` : '')}</div>
          </div>
          <div class="dl-right">
            ${scoreTag}
            ${!isFuture ? `<span class="dl-xp">${day.xp_earned ? '+' + day.xp_earned + ' XP' : ''}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Auto-scroll to today
    const todayEl = list.querySelector('.day-today');
    if (todayEl) todayEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function _attachHeatmapClickListener() {
    const canvas = document.getElementById('rem-heatmap');
    if (!canvas) return;
    canvas.style.cursor = 'pointer';
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cols = 6, gap = 6;
      const cellW = (canvas.clientWidth - gap * (cols + 1)) / cols;
      const cellH = cellW * 0.85;
      const col = Math.floor((x - gap) / (cellW + gap));
      const row = Math.floor((y - gap) / (cellH + gap));
      const dayIndex = row * cols + col;
      if (dayIndex >= 0 && dayIndex < _plan.days.length) {
        const day = _plan.days[dayIndex];
        if (day.day <= _plan.current_day) Remediation.openDay(dayIndex);
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DAY DETAIL SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  async function openDay(dayIndex) {
    _activeDayIndex = dayIndex;
    _exerciseIndex = 0;
    _sessionScores = [];
    const briefDay = _plan.days[dayIndex];
    if (!briefDay) return;

    try {
        const fullDay = await API.fetchRemediationDay(briefDay.day);
        const day = {
           ...fullDay,
           day: fullDay.day_number,
           completed: fullDay.is_completed
        };
        
        // Hydrate stub exercises
        if (day.exercises) {
            day.exercises = day.exercises.map(ex => {
                 if (ex._source === 'server_stub' && typeof PlanGenerator !== 'undefined') {
                     const section = (SECTION_LIBRARY[_plan.domain] || []).find(s => s.id === day.section_id);
                     if (section && section.exercises) {
                         const match = section.exercises.find(e => e.type === ex.type);
                         if (match) return { ...match, ...ex };
                     }
                     if (section && typeof PlanGenerator.buildSyntheticExercise === 'function') {
                         return { ...PlanGenerator.buildSyntheticExercise(ex.type, section), ...ex };
                     }
                 }
                 return ex;
            });
        }
        
        _plan.days[dayIndex] = day;
        _renderDayViewContent(day);
    } catch(e) {
        console.warn("Failed to fetch full day, using local", e);
        _renderDayViewContent(briefDay);
    }
  }

  function _renderDayViewContent(day) {
    const container = document.getElementById('view-remediation');

    container.innerHTML = `
      <div class="rem-day-shell">

        <!-- Top nav -->
        <div class="rem-day-nav">
          <button class="rem-back-btn" onclick="Remediation.backToOverview()">← Back to Plan</button>
          <div class="rem-day-breadcrumb">
            <span class="rdb-phase">${day.phase_name}</span>
            <span class="rdb-sep">›</span>
            <span class="rdb-day">${day.label}</span>
          </div>
          <div class="rem-day-status">
            ${day.completed
              ? `<span class="rds-done" style="color:${ProgressTracker._scoreColor(day.score)}">✅ ${day.score}% — Done</span>`
              : `<span class="rds-pending">⏳ In Progress</span>`}
          </div>
        </div>

        <!-- Objective banner -->
        <div class="rem-objective-banner">
          <div class="rob-icon">${day.is_checkpoint ? '🏁' : '🎯'}</div>
          <div class="rob-text">
            <div class="rob-label">${day.is_checkpoint ? 'Checkpoint Goal' : "Today's Goal"}</div>
            <div class="rob-objective">${day.objective}</div>
          </div>
          <div class="rob-meta">
            ${!day.is_checkpoint ? `<span>⏱ ~${day.time_estimate_min} min</span>` : ''}
            <span>⚡ ${day.xp_base} XP</span>
          </div>
        </div>

        <!-- Body -->
        <div class="rem-day-body">

          <!-- Left: Concept card + Resources -->
          <div class="rem-day-sidebar">

            ${day.concept_card ? `
            <div class="rem-card">
              <div class="rem-card-title">📖 Concept Card</div>
              <div class="concept-card-inner">
                <div class="cc-title">${day.concept_card.title || day.topic}</div>
                <ul class="cc-bullets">
                  ${(day.concept_card.bullets || []).map(b => `<li>${b}</li>`).join('')}
                </ul>
                ${day.concept_card.example_code ? `
                  <div class="cc-code-label">Example</div>
                  <pre class="cc-code">${_escHtml(day.concept_card.example_code)}</pre>
                ` : ''}
              </div>
            </div>
            ` : ''}

            ${(day.resources || []).length ? `
            <div class="rem-card">
              <div class="rem-card-title">📚 Study Resources</div>
              <div class="resource-list">
                ${day.resources.map(r => `
                  <a class="resource-link" href="${r.url}" target="_blank" rel="noopener">
                    <span class="rl-type-badge rl-${r.type}">${r.type}</span>
                    <span class="rl-title">${r.title}</span>
                    <span class="rl-arrow">↗</span>
                  </a>
                `).join('')}
              </div>
            </div>
            ` : ''}

          </div>

          <!-- Right: Exercise runner -->
          <div class="rem-day-exercises">
            <div class="rem-card">
              <div class="rem-card-title">
                ✏️ Exercises
                <span class="ex-progress-label" id="ex-progress-label">
                  ${day.exercises.length > 0 ? `1 of ${day.exercises.length}` : 'None today'}
                </span>
              </div>
              <div id="exercise-runner-area">
                ${day.exercises.length > 0
                  ? _renderExercise(day.exercises[0], 0, day.exercises.length)
                  : '<p class="ex-none">No exercises for this day — focus on the resources.</p>'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // EXERCISE RENDERER
  // ══════════════════════════════════════════════════════════════════════════════
  function _renderExercise(ex, index, total) {
    const typeNames = {
      1: '🐛 Bug Fix', 2: '✏️ Fill in the Blank',
      3: '💡 Multiple Choice', 4: '↕️ Reorder Lines',
      5: '🔍 Debug Challenge', 6: '📖 Concept Card Q'
    };

    return `
      <div class="exercise-card" id="exercise-card-${index}">
        <div class="ex-header">
          <span class="ex-type-tag">${typeNames[ex.type] || 'Exercise'}</span>
          <span class="ex-num">${index + 1} / ${total}</span>
        </div>
        <div class="ex-body" id="ex-body-${index}">
          ${_renderExerciseBody(ex, index)}
        </div>
        <div class="ex-footer" id="ex-footer-${index}">
          <button class="btn-primary ex-submit-btn" onclick="Remediation.submitExercise(${index})">
            Check Answer
          </button>
        </div>
      </div>
    `;
  }

  function _renderExerciseBody(ex, idx) {
    switch (ex.type) {
      case 3: // MCQ
        return `
          <div class="ex-question">${ex.question || ex.prompt}</div>
          <div class="ex-options" id="ex-options-${idx}">
            ${(ex.options || []).map((opt, oi) => `
              <label class="ex-option" id="opt-${idx}-${oi}">
                <input type="radio" name="mcq-${idx}" value="${_escHtml(opt)}">
                <span class="opt-text">${_escHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        `;
      case 2: // Fill-blank
        return `
          <div class="ex-question">${ex.prompt || 'Fill in the blank:'}</div>
          <pre class="ex-snippet">${_renderSnippetWithBlanks(ex.snippet || '', idx)}</pre>
        `;
      case 1: // Bug fix
        return `
          <div class="ex-question">Find and fix the bug in this code:</div>
          <pre class="ex-snippet ex-editable"><code id="ex-code-${idx}" contenteditable="true" spellcheck="false">${_escHtml(ex.snippet || '')}</code></pre>
          <div class="ex-hint-area" id="ex-hint-${idx}"></div>
        `;
      case 4: // Reorder
        return `
          <div class="ex-question">Drag to put these lines in the correct order:</div>
          <div class="ex-reorder-list" id="ex-reorder-${idx}">
            ${_shuffleArray([...(ex.lines || [])]).map((line, li) => `
              <div class="reorder-item" draggable="true" data-original="${_escHtml(line)}"
                   ondragstart="Remediation._dragStart(event)" ondragover="Remediation._dragOver(event)"
                   ondrop="Remediation._drop(event)">
                <span class="reorder-handle">⠿</span>
                <code>${_escHtml(line)}</code>
              </div>
            `).join('')}
          </div>
        `;
      case 5: // Debug
        return `
          <div class="ex-question">Debug this code. Expected: <code>${_escHtml(ex.expected || '')}</code></div>
          <pre class="ex-snippet ex-editable"><code id="ex-code-${idx}" contenteditable="true" spellcheck="false">${_escHtml(ex.snippet || '')}</code></pre>
          <div class="ex-hint-area" id="ex-hint-${idx}"></div>
        `;
      case 6: // Concept card Q
        return `
          <div class="ex-concept-review">
            <div class="cc-title">${ex.title || ''}</div>
            <ul class="cc-bullets">${(ex.bullets || []).map(b => `<li>${b}</li>`).join('')}</ul>
          </div>
          <div class="ex-question">${ex.question || 'Based on the above, which is correct?'}</div>
          <div class="ex-options" id="ex-options-${idx}">
            ${(ex.options || []).map((opt, oi) => `
              <label class="ex-option" id="opt-${idx}-${oi}">
                <input type="radio" name="mcq-${idx}" value="${_escHtml(opt)}">
                <span class="opt-text">${_escHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        `;
      default:
        return `<div class="ex-question">${ex.prompt || 'Complete the task.'}</div>`;
    }
  }

  function _renderSnippetWithBlanks(snippet, idx) {
    let blankIdx = 0;
    return _escHtml(snippet).replace(/\[ __ \]/g, () => {
      const i = blankIdx++;
      return `</span><input type="text" class="ex-blank-input" id="blank-${idx}-${i}" placeholder="?" autocomplete="off"><span>`;
    });
  }

  // ── Exercise Submission ────────────────────────────────────────────────────
  function submitExercise(exIdx) {
    const day = _plan.days[_activeDayIndex];
    const ex = day.exercises[exIdx];
    if (!ex) return;

    let score = 0;
    let feedback = '';
    let correct = false;

    switch (ex.type) {
      case 3:
      case 6: {
        const sel = document.querySelector(`input[name="mcq-${exIdx}"]:checked`);
        if (!sel) { _flashFeedback(exIdx, '⚠️ Select an answer first.', 'warn'); return; }
        correct = sel.value.trim() === (ex.answer || '').trim();
        score = correct ? 100 : 0;
        feedback = correct
          ? '✅ Correct! ' + (ex.explanation || '')
          : `❌ Incorrect. The answer is: <strong>${_escHtml(ex.answer)}</strong>`;
        _highlightOptions(exIdx, ex.answer, sel.value);
        break;
      }
      case 2: {
        const blanks = ex.blanks || [];
        let allCorrect = true;
        blanks.forEach((expected, bi) => {
          const input = document.getElementById(`blank-${exIdx}-${bi}`);
          if (!input) return;
          const userVal = input.value.trim().toLowerCase();
          const expVal = (expected || '').trim().toLowerCase();
          if (userVal === expVal) {
            input.style.borderColor = '#00d4a8';
          } else {
            input.style.borderColor = '#ff5c5c';
            allCorrect = false;
          }
          input.disabled = true;
        });
        correct = allCorrect;
        score = correct ? 100 : Math.round((blanks.filter((exp, bi) => {
          const input = document.getElementById(`blank-${exIdx}-${bi}`);
          return input && input.value.trim().toLowerCase() === exp.trim().toLowerCase();
        }).length / blanks.length) * 100);
        feedback = correct ? '✅ Correct!' : `Partially correct (${score}%). Review the blanks.`;
        break;
      }
      case 1:
      case 5: {
        const codeEl = document.getElementById(`ex-code-${exIdx}`);
        const code = codeEl ? codeEl.innerText : '';
        const fixPattern = (ex.fix_pattern || ex.fix || '').toLowerCase();
        const hasPattern = fixPattern && code.toLowerCase().includes(fixPattern.toLowerCase());
        const hasSnippet = ex.model_solution && code.trim().length > 10;
        correct = hasPattern || (code.trim() !== (ex.snippet || '').trim() && hasSnippet);
        score = correct ? 90 : 30;
        feedback = correct
          ? `✅ Good fix! The key was: <code>${_escHtml(ex.fix_pattern || ex.fix || 'correct pattern')}</code>`
          : `Not quite. Hint: look for <code>${_escHtml(ex.fix_pattern || ex.fix || '...')}</code>`;
        if (ex.model_solution) {
          feedback += `<details class="ex-solution"><summary>Show model solution</summary><pre>${_escHtml(ex.model_solution)}</pre></details>`;
        }
        break;
      }
      case 4: {
        const list = document.getElementById(`ex-reorder-${exIdx}`);
        const items = list ? [...list.querySelectorAll('.reorder-item')] : [];
        const userOrder = items.map(el => el.dataset.original);
        const correct_order = ex.lines || [];
        const matches = userOrder.filter((l, i) => l === correct_order[i]).length;
        score = Math.round((matches / correct_order.length) * 100);
        correct = score === 100;
        feedback = correct ? '✅ Perfect order!' : `${matches}/${correct_order.length} lines in correct position. Correct order: ${correct_order.map(l => `<code>${_escHtml(l)}</code>`).join(' → ')}`;
        break;
      }
    }

    _sessionScores.push(score);
    _showExerciseFeedback(exIdx, feedback, correct ? 'success' : 'error', score);

    // Change footer to "Next" button
    const footer = document.getElementById(`ex-footer-${exIdx}`);
    if (footer) {
      const nextIdx = exIdx + 1;
      const isLast = nextIdx >= day.exercises.length;
      footer.innerHTML = `
        <div class="ex-score-display" style="color:${ProgressTracker._scoreColor(score)}">
          ${score}% ${score >= 70 ? '⭐' : ''}
        </div>
        <button class="btn-primary" onclick="${isLast ? 'Remediation.completeDay()' : `Remediation.nextExercise(${nextIdx})`}">
          ${isLast ? '🏁 Complete Day' : 'Next Exercise →'}
        </button>
      `;
    }
  }

  function _showExerciseFeedback(exIdx, html, type, score) {
    // Insert feedback below the body
    const body = document.getElementById(`ex-body-${exIdx}`);
    if (!body) return;
    let fb = body.querySelector('.ex-feedback');
    if (!fb) {
      fb = document.createElement('div');
      fb.className = 'ex-feedback';
      body.appendChild(fb);
    }
    fb.className = `ex-feedback ex-feedback-${type}`;
    fb.innerHTML = html;
  }

  function _flashFeedback(exIdx, msg, type) {
    _showExerciseFeedback(exIdx, msg, type, null);
    setTimeout(() => {
      const body = document.getElementById(`ex-body-${exIdx}`);
      if (body) { const fb = body.querySelector('.ex-feedback'); if (fb) fb.innerHTML = ''; }
    }, 2000);
  }

  function _highlightOptions(exIdx, correctAnswer, selectedAnswer) {
    document.querySelectorAll(`[id^="opt-${exIdx}-"]`).forEach(el => {
      const val = el.querySelector('input')?.value;
      if (val === correctAnswer) el.classList.add('opt-correct');
      else if (val === selectedAnswer && val !== correctAnswer) el.classList.add('opt-wrong');
      el.querySelector('input')?.setAttribute('disabled', true);
    });
  }

  function nextExercise(nextIdx) {
    const day = _plan.days[_activeDayIndex];
    const area = document.getElementById('exercise-runner-area');
    const label = document.getElementById('ex-progress-label');
    if (!area || !day) return;
    _exerciseIndex = nextIdx;
    area.innerHTML = _renderExercise(day.exercises[nextIdx], nextIdx, day.exercises.length);
    if (label) label.textContent = `${nextIdx + 1} of ${day.exercises.length}`;
    area.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Day Completion ─────────────────────────────────────────────────────────
  async function completeDay() {
    const day = _plan.days[_activeDayIndex];
    if (!day) return;

    const avgScore = _sessionScores.length
      ? Math.round(_sessionScores.reduce((a, b) => a + b, 0) / _sessionScores.length)
      : 75;

    let xpEarned = day.xp_earned || 0;

    try {
        const fullDay = await API.completeRemediationDay(day.day, avgScore);
        if (fullDay && fullDay.xp_earned !== undefined) {
            xpEarned = fullDay.xp_earned;
        }
    } catch(e) {
        console.warn("Failed to sync completion with API", e);
    }

    if (day.is_checkpoint) {
      _plan = PlanGenerator.recordCheckpointCompletion(_plan, _activeDayIndex, avgScore);
    } else {
      _plan = PlanGenerator.recordDayCompletion(_plan, _activeDayIndex, _sessionScores);
    }

    // Persist
    Store.update({ remediation_plan: _plan });

    // XP
    Store.update({ xp_total: (Store.get().xp_total || 0) + xpEarned });

    // Show completion splash
    _renderDayComplete(day, avgScore, xpEarned);
  }

  function _renderDayComplete(day, score, xp) {
    const container = document.getElementById('view-remediation');
    const isExcellent = score >= 85;
    const isPassed = score >= 70;
    const nextDay = _plan.days.find(d => !d.completed);

    container.innerHTML = `
      <div class="rem-complete-splash">
        <div class="rcs-icon">${isExcellent ? '🌟' : isPassed ? '✅' : '📈'}</div>
        <h2 class="rcs-title">${isExcellent ? 'Outstanding!' : isPassed ? 'Day Complete!' : 'Keep Going!'}</h2>
        <p class="rcs-subtitle">${day.label}</p>

        <div class="rcs-score-ring">
          <svg viewBox="0 0 120 120" class="score-ring-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#1e2128" stroke-width="10"/>
            <circle cx="60" cy="60" r="52" fill="none"
              stroke="${ProgressTracker._scoreColor(score)}"
              stroke-width="10"
              stroke-dasharray="${2 * Math.PI * 52}"
              stroke-dashoffset="${2 * Math.PI * 52 * (1 - score / 100)}"
              stroke-linecap="round"
              transform="rotate(-90 60 60)"/>
            <text x="60" y="58" text-anchor="middle" dominant-baseline="middle"
              fill="#e8eaf0" font-size="22" font-weight="700">${score}%</text>
            <text x="60" y="77" text-anchor="middle" dominant-baseline="middle"
              fill="#7a7f8e" font-size="10">Score</text>
          </svg>
        </div>

        <div class="rcs-xp-earned">+${xp} XP</div>

        ${!isPassed ? `
        <div class="rcs-retry-note">
          Score 70%+ to fully complete this day. You can retry exercises anytime.
        </div>
        ` : ''}

        <div class="rcs-actions">
          ${nextDay && !_plan.mastered ? `
            <button class="btn-primary" onclick="Remediation.openDay(${_plan.days.indexOf(nextDay)})">
              Next: ${nextDay.label} →
            </button>
          ` : ''}
          <button class="btn-secondary" onclick="Remediation.backToOverview()">
            Back to Plan Overview
          </button>
        </div>
      </div>
    `;
  }

  function backToOverview() {
    _activeDayIndex = null;
    _exerciseIndex = 0;
    _sessionScores = [];
    _renderOverview();
  }

  // ── Drag & Drop (Reorder) ─────────────────────────────────────────────────
  let _dragSrc = null;
  function _dragStart(e) { _dragSrc = e.currentTarget; e.dataTransfer.effectAllowed = 'move'; }
  function _dragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; }
  function _drop(e) {
    e.stopPropagation();
    if (_dragSrc !== e.currentTarget) {
      const list = e.currentTarget.parentNode;
      const nodes = [...list.children];
      const srcIdx = nodes.indexOf(_dragSrc);
      const tgtIdx = nodes.indexOf(e.currentTarget);
      if (srcIdx < tgtIdx) list.insertBefore(_dragSrc, e.currentTarget.nextSibling);
      else list.insertBefore(_dragSrc, e.currentTarget);
    }
    return false;
  }

  // ── Utilities ─────────────────────────────────────────────────────────────
  function _escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  return {
    init,
    openDay,
    backToOverview,
    submitExercise,
    nextExercise,
    completeDay,
    _dragStart,
    _dragOver,
    _drop
  };
})();

window.Remediation = Remediation;
