/**
 * ═══════════════════════════════════════════════
 * GSDS — Plan Generator v2.0
 * Generates a structured 30-day remediation plan
 * based on the learner's weak topic areas within
 * a domain. Each day has: topic, exercises,
 * resources, and a clear learning objective.
 * ═══════════════════════════════════════════════
 */

// ── Phase Definitions ────────────────────────────────────────────────────────
const PHASE_CONFIG = [
  {
    phase: 1, name: 'Foundation', days: [1, 7],
    description: 'Build conceptual clarity through concept cards and guided practice.',
    exerciseTypes: [6, 3],        // Concept card → MCQ
    exerciseCount: 2,
    xpMultiplier: 1.0,
    checkpointDay: 7
  },
  {
    phase: 2, name: 'Application', days: [8, 16],
    description: 'Apply concepts to real-world patterns via fill-blanks and bug hunts.',
    exerciseTypes: [2, 1],        // Fill-blank → Bug fix
    exerciseCount: 3,
    xpMultiplier: 1.25,
    checkpointDay: 14
  },
  {
    phase: 3, name: 'Stress Test', days: [17, 24],
    description: 'Handle edge cases, debug complex code, and reorder logic correctly.',
    exerciseTypes: [5, 4, 1],     // Debug → Reorder → Bug fix
    exerciseCount: 3,
    xpMultiplier: 1.5,
    checkpointDay: 21
  },
  {
    phase: 4, name: 'Mastery', days: [25, 30],
    description: 'Full-scale synthesis: multi-concept tasks and capstone challenges.',
    exerciseTypes: [5, 2],        // Debug → Fill-blank (harder)
    exerciseCount: 2,
    xpMultiplier: 2.0,
    checkpointDay: 28
  }
];

// ── Topic-to-Resource Map ─────────────────────────────────────────────────────
// Each section id maps to specific curated resources for that exact topic.
const TOPIC_RESOURCES = {
  // Web
  'web-s1': [
    { title: 'CSS Flexbox — MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox', type: 'docs' },
    { title: 'Flexbox Froggy (interactive)', url: 'https://flexboxfroggy.com/', type: 'interactive' },
    { title: 'A Complete Guide to Flexbox — CSS-Tricks', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', type: 'article' }
  ],
  'web-s2': [
    { title: 'CSS Specificity — MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity', type: 'docs' },
    { title: 'CSS Specificity Calculator', url: 'https://specificity.keegan.st/', type: 'interactive' },
    { title: 'Specificity Wars (visual guide)', url: 'https://www.geeksforgeeks.org/css/css-specificity/', type: 'article' }
  ],
  'web-s3': [
    { title: 'Event Delegation — JavaScript.info', url: 'https://javascript.info/event-delegation', type: 'article' },
    { title: 'MDN — EventTarget.addEventListener', url: 'https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener', type: 'docs' }
  ],
  'web-s4': [
    { title: 'Async/Await — MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises', type: 'docs' },
    { title: 'Async/Await — javascript.info', url: 'https://javascript.info/async-await', type: 'article' }
  ],
  'web-s5': [
    { title: 'How Virtual DOM Works', url: 'https://www.geeksforgeeks.org/reactjs/reactjs-virtual-dom/', type: 'article' },
    { title: 'React Reconciliation — Docs', url: 'https://react.dev/learn/preserving-and-resetting-state', type: 'docs' }
  ],
  'web-s6': [
    { title: 'CSS Values & Units — MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units', type: 'docs' },
    { title: 'rem vs em explained', url: 'https://www.geeksforgeeks.org/css/difference-between-em-and-rem-in-css/', type: 'article' }
  ],
  // DSA
  'dsa-s1': [
    { title: 'Loop Invariants — CS Fundamentals', url: 'https://www.geeksforgeeks.org/dsa/loop-invariant-condition-examples/', type: 'article' },
    { title: 'Binary Search & Invariants — Khan Academy', url: 'https://www.khanacademy.org/computing/computer-science/algorithms/binary-search/a/binary-search', type: 'article' }
  ],
  'dsa-s2': [
    { title: 'Pointer Arithmetic — GFG', url: 'https://www.geeksforgeeks.org/dsa/pointer-arithmetics-in-c-with-examples/', type: 'article' },
    { title: 'Two Pointer Technique', url: 'https://www.geeksforgeeks.org/dsa/two-pointers-technique/', type: 'article' }
  ],
  'dsa-s3': [
    { title: 'Recursion & Base Cases — MDN', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Recursion', type: 'docs' },
    { title: 'Introduction to Recursion — GFG', url: 'https://www.geeksforgeeks.org/dsa/introduction-to-recursion-2/', type: 'article' }
  ],
  'dsa-s4': [
    { title: 'Off-by-one Errors Explained', url: 'https://www.geeksforgeeks.org/dsa/off-by-one-error/', type: 'article' },
    { title: 'Array Traversal Patterns', url: 'https://www.geeksforgeeks.org/dsa/array-traversal/', type: 'article' }
  ],
  'dsa-s5': [
    { title: 'Stable vs Unstable Sorting — GFG', url: 'https://www.geeksforgeeks.org/dsa/stability-in-sorting-algorithms/', type: 'article' },
    { title: 'Sorting Algorithms Visualised', url: 'https://visualgo.net/en/sorting', type: 'interactive' }
  ],
  'dsa-s6': [
    { title: 'Hash Collisions & Chaining', url: 'https://www.geeksforgeeks.org/dsa/separate-chaining-collision-handling-technique-in-hashing/', type: 'article' },
    { title: 'Open Addressing — GFG', url: 'https://www.geeksforgeeks.org/dsa/open-addressing-collision-handling-technique-in-hashing/', type: 'article' }
  ],
  // Database
  'db-s1': [
    { title: 'WHERE vs HAVING — Mode Analytics', url: 'https://mode.com/sql-tutorial/sql-having/', type: 'article' },
    { title: 'SQL Aggregates — GFG', url: 'https://www.geeksforgeeks.org/sql/sql-aggregate-functions/', type: 'article' }
  ],
  'db-s2': [
    { title: 'SQL JOINs Explained Visually', url: 'https://www.geeksforgeeks.org/sql/sql-join-types/', type: 'article' },
    { title: 'Interactive SQL JOIN Practice', url: 'https://sqlzoo.net/wiki/The_JOIN_operation', type: 'interactive' }
  ],
  'db-s3': [
    { title: 'NULL in SQL — GFG', url: 'https://www.geeksforgeeks.org/sql/sql-null-values/', type: 'article' },
    { title: 'NULL Handling — Mode SQL School', url: 'https://mode.com/sql-tutorial/sql-is-null/', type: 'article' }
  ],
  'db-s4': [
    { title: 'Indexing in Databases', url: 'https://www.geeksforgeeks.org/indexing-in-databases-sql/', type: 'article' },
    { title: 'Use The Index, Luke!', url: 'https://use-the-index-luke.com/sql/preface', type: 'article' }
  ],
  'db-s5': [
    { title: 'CTEs vs Subqueries — GFG', url: 'https://www.geeksforgeeks.org/sql/sql-with-clause/', type: 'article' },
    { title: 'Recursive CTEs Explained', url: 'https://www.geeksforgeeks.org/sql/recursive-join-in-sql/', type: 'article' }
  ],
  'db-s6': [
    { title: 'Transaction Isolation Levels', url: 'https://www.geeksforgeeks.org/dbms/transaction-isolation-levels-dbms/', type: 'article' },
    { title: 'ACID Properties', url: 'https://www.geeksforgeeks.org/dbms/acid-properties-in-dbms/', type: 'article' }
  ],
  // AI/ML
  'aiml-s1': [
    { title: 'Overfitting & Underfitting — GFG', url: 'https://www.geeksforgeeks.org/machine-learning/underfitting-and-overfitting-in-machine-learning/', type: 'article' },
    { title: 'ML Crash Course — Google', url: 'https://developers.google.com/machine-learning/crash-course/overfitting/overfitting', type: 'docs' }
  ],
  'aiml-s2': [
    { title: 'Regularisation Techniques', url: 'https://www.geeksforgeeks.org/machine-learning/regularization-in-machine-learning/', type: 'article' },
    { title: 'Dropout in Keras', url: 'https://www.tensorflow.org/api_docs/python/tf/keras/layers/Dropout', type: 'docs' }
  ],
  'aiml-s3': [
    { title: 'Loss Functions for ML', url: 'https://www.geeksforgeeks.org/machine-learning/loss-functions-in-deep-learning/', type: 'article' },
    { title: 'Cross-Entropy Loss Explained', url: 'https://www.geeksforgeeks.org/machine-learning/binary-cross-entropy-log-loss-for-binary-classification/', type: 'article' }
  ],
  'aiml-s4': [
    { title: 'Batch Normalisation — GFG', url: 'https://www.geeksforgeeks.org/machine-learning/batch-normalization-ml/', type: 'article' },
    { title: 'Keras BatchNorm Docs', url: 'https://www.tensorflow.org/api_docs/python/tf/keras/layers/BatchNormalization', type: 'docs' }
  ],
  'aiml-s5': [
    { title: 'Activation Functions Guide', url: 'https://www.geeksforgeeks.org/machine-learning/activation-functions-neural-networks/', type: 'article' },
    { title: 'ReLU, Sigmoid, Softmax — Visualised', url: 'https://playground.tensorflow.org/', type: 'interactive' }
  ],
  'aiml-s6': [
    { title: 'Data Leakage in ML', url: 'https://www.geeksforgeeks.org/machine-learning/data-leakage-in-machine-learning/', type: 'article' },
    { title: 'Train/Test Split Best Practices', url: 'https://www.geeksforgeeks.org/machine-learning/how-to-split-your-dataset-to-train-and-test-datasets-using-scikit-learn/', type: 'article' }
  ],
  // System Design
  'sys-s1': [
    { title: 'Rate Limiting Patterns — GFG', url: 'https://www.geeksforgeeks.org/system-design/what-is-api-rate-limiting/', type: 'article' },
    { title: 'Token Bucket Algorithm', url: 'https://www.geeksforgeeks.org/system-design/token-bucket-algorithm/', type: 'article' }
  ],
  'sys-s2': [
    { title: 'CAP Theorem Explained', url: 'https://www.geeksforgeeks.org/system-design/cap-theorem-in-dbms/', type: 'article' },
    { title: 'CP vs AP Databases', url: 'https://www.geeksforgeeks.org/system-design/consistency-and-availability-tradeoffs/', type: 'article' }
  ],
  'sys-s3': [
    { title: 'Caching Strategies — GFG', url: 'https://www.geeksforgeeks.org/system-design/caching-strategies-system-design/', type: 'article' },
    { title: 'Redis Caching Guide', url: 'https://www.geeksforgeeks.org/system-design/introduction-to-redis/', type: 'article' }
  ],
  'sys-s4': [
    { title: 'Message Queues — GFG', url: 'https://www.geeksforgeeks.org/system-design/what-is-message-queue-and-where-do-we-use-it/', type: 'article' },
    { title: 'Kafka vs RabbitMQ', url: 'https://www.geeksforgeeks.org/system-design/apache-kafka-vs-rabbitmq/', type: 'article' }
  ],
  'sys-s5': [
    { title: 'Load Balancing Algorithms', url: 'https://www.geeksforgeeks.org/system-design/load-balancer-system-design/', type: 'article' },
    { title: 'NGINX Load Balancer Guide', url: 'https://www.geeksforgeeks.org/system-design/nginx-vs-apache-server/', type: 'article' }
  ],
  'sys-s6': [
    { title: 'Circuit Breaker Pattern', url: 'https://www.geeksforgeeks.org/system-design/circuit-breaker-pattern-in-microservices/', type: 'article' },
    { title: 'Resilience Patterns Overview', url: 'https://www.geeksforgeeks.org/system-design/resilience-patterns-in-microservices/', type: 'article' }
  ]
};

// ── Weak Area Detection ───────────────────────────────────────────────────────
/**
 * Analyses a learner's submission history for a domain to identify
 * which section IDs they are weakest in.
 * Returns an ordered array of section IDs (weakest first).
 */
function detectWeakSections(domain, submissions) {
  const sections = (SECTION_LIBRARY[domain] || []);
  const sectionScores = {};

  // Init all sections with a neutral score
  sections.forEach(s => { sectionScores[s.id] = { total: 0, count: 0, name: s.name }; });

  // Tally scores from past submissions tagged with a section
  (submissions || []).forEach(sub => {
    if (sub.domain === domain && sub.section_id && sectionScores[sub.section_id] !== undefined) {
      sectionScores[sub.section_id].total += (sub.score || 0);
      sectionScores[sub.section_id].count += 1;
    }
  });

  // Sort: sections with lowest average score (or never attempted) come first
  return sections
    .map(s => {
      const data = sectionScores[s.id];
      const avg = data.count > 0 ? data.total / data.count : -1; // -1 = never attempted → treat as weakest
      return { ...s, avgScore: avg };
    })
    .sort((a, b) => a.avgScore - b.avgScore);
}

// ── Phase Resolver ────────────────────────────────────────────────────────────
function getPhaseForDay(day) {
  return PHASE_CONFIG.find(p => day >= p.days[0] && day <= p.days[1]) || PHASE_CONFIG[0];
}

// ── Exercise Builder ──────────────────────────────────────────────────────────
function buildExercisesForDay(phase, section) {
  const pool = (section.exercises || []);
  const exerciseTypes = phase.exerciseTypes;
  const count = phase.exerciseCount;
  const chosen = [];

  for (let i = 0; i < count; i++) {
    const preferredType = exerciseTypes[i % exerciseTypes.length];
    const match = pool.find(e => e.type === preferredType && !chosen.includes(e));
    if (match) {
      chosen.push({ ...match, _source: 'library' });
    } else {
      // Fallback: any unused exercise from pool, or generate synthetic
      const fallback = pool.find(e => !chosen.includes(e));
      chosen.push(fallback ? { ...fallback, _source: 'library' } : buildSyntheticExercise(preferredType, section));
    }
  }
  return chosen;
}

function buildSyntheticExercise(type, section) {
  const name = section.name;
  const maps = {
    1: { type: 1, label: 'Bug Fix', prompt: `Find and fix the bug related to ${name}.`, snippet: `// BUG: This code has an error related to ${name}\nfunction example() {\n  // Fix me\n  return null;\n}`, bug_description: `Common mistake in ${name}`, fix: `Apply the correct pattern for ${name}` },
    2: { type: 2, label: 'Fill in the Blank', prompt: `Complete the code involving ${name}.`, snippet: `// Fill in the blank:\nconst result = [ __ ]; // related to ${name}`, blanks: ['correct_value'] },
    3: { type: 3, label: 'Multiple Choice', prompt: `Which of the following is true about ${name}?`, question: `Which statement is correct about ${name}?`, options: [`${name} is always synchronous`, `${name} only works in strict mode`, `${name} requires a specific pattern`, `${name} has no edge cases`], answer: `${name} requires a specific pattern` },
    4: { type: 4, label: 'Reorder', prompt: `Arrange these steps for ${name} in the correct order.`, lines: [`Step 1: Initialize ${name}`, `Step 2: Configure parameters`, `Step 3: Execute the operation`, `Step 4: Handle the result`] },
    5: { type: 5, label: 'Debug Challenge', prompt: `Debug this code block involving ${name}.`, snippet: `// Debug this:\nfunction broken_${name.replace(/\s/g, '_')}() {\n  // Contains a logic error\n  return undefined;\n}`, expected: 'A correctly working implementation', fix_pattern: 'correct', model_solution: `// Corrected version\nfunction fixed() {\n  // Correct implementation of ${name}\n}` },
    6: { type: 6, label: 'Concept Card', prompt: `Review the concept, then answer.`, ...section.concept_card, question: `Based on the concept above, which statement is correct?`, options: ['The concept is always applied globally', 'The concept has specific usage rules', 'The concept never affects performance', 'The concept is optional in all cases'], answer: 'The concept has specific usage rules' }
  };
  return maps[type] || maps[3];
}

// ── Checkpoint Day Builder ────────────────────────────────────────────────────
function buildCheckpointDay(day, phaseConfig, coveredSections) {
  // A checkpoint reviews all sections covered in the phase so far
  const reviewExercises = coveredSections.flatMap(section => {
    const pool = section.exercises || [];
    // Pick one MCQ per section for the checkpoint quiz
    const mcq = pool.find(e => e.type === 3) || buildSyntheticExercise(3, section);
    return [{ ...mcq, _source: 'checkpoint' }];
  });

  return {
    day,
    phase: phaseConfig.phase,
    phase_name: phaseConfig.name,
    is_checkpoint: true,
    label: `🏁 Phase ${phaseConfig.phase} Checkpoint`,
    topic: `Review: ${coveredSections.map(s => s.name).join(', ')}`,
    section_id: null,
    objective: `Consolidate everything learned in the ${phaseConfig.name} phase. Score 70%+ to unlock the next phase.`,
    exercises: reviewExercises.slice(0, 4), // cap at 4 for checkpoints
    resources: [],
    completed: false,
    score: null,
    xp_base: Math.round(150 * phaseConfig.xpMultiplier),
    xp_earned: 0,
    unlocks_next_phase: true
  };
}

// ── Main Plan Generator ───────────────────────────────────────────────────────
const PlanGenerator = {

  /**
   * Generate a complete 30-day remediation plan.
   *
   * @param {string} domain  - e.g. 'web', 'dsa', 'database', 'aiml', 'sysdesign'
   * @param {Array}  submissions - learner's past submission records (from Store)
   * @returns {Object} plan object with .days[] and metadata
   */
  generate: function (domain, submissions = []) {
    const orderedSections = detectWeakSections(domain, submissions);
    if (!orderedSections.length) return null;

    const now = new Date().toISOString();
    const plan = {
      domain,
      weak_areas: orderedSections.slice(0, 3).map(s => s.name),
      started_at: now,
      last_active: now,
      current_day: 1,
      current_phase: 1,
      phase_unlocked: [1],           // phases unlocked by checkpoint passes
      days: [],
      skill_snapshots: [],           // { day, score, competency } — for trend chart
      overall_competency: 0,
      mastered: false
    };

    // Track which sections have been covered per phase (for checkpoint reviews)
    let phaseCoveredSections = [];
    let lastPhase = 1;

    for (let dayNum = 1; dayNum <= 30; dayNum++) {
      const phaseConfig = getPhaseForDay(dayNum);
      const checkpointDays = [7, 14, 21, 28];

      // Reset coverage tracking when phase changes
      if (phaseConfig.phase !== lastPhase) {
        phaseCoveredSections = [];
        lastPhase = phaseConfig.phase;
      }

      if (checkpointDays.includes(dayNum)) {
        plan.days.push(buildCheckpointDay(dayNum, phaseConfig, phaseCoveredSections));
        continue;
      }

      // Pick section — cycle through weak→strong within each phase
      // Use different slices per phase so each phase covers different emphasis
      const phaseOffset = (phaseConfig.phase - 1) * 2;
      const sectionPool = [...orderedSections.slice(phaseOffset), ...orderedSections.slice(0, phaseOffset)];
      const sectionIndex = (dayNum - phaseConfig.days[0]) % sectionPool.length;
      const section = sectionPool[sectionIndex] || orderedSections[0];

      // Track for checkpoint
      if (!phaseCoveredSections.find(s => s.id === section.id)) {
        phaseCoveredSections.push(section);
      }

      const exercises = buildExercisesForDay(phaseConfig, section);
      const resources = TOPIC_RESOURCES[section.id] || [];

      plan.days.push({
        day: dayNum,
        phase: phaseConfig.phase,
        phase_name: phaseConfig.name,
        is_checkpoint: false,
        label: `Day ${dayNum} — ${section.name}`,
        topic: section.name,
        section_id: section.id,
        concept_card: section.concept_card || null,
        objective: this._buildObjective(phaseConfig, section),
        exercises,
        resources,
        completed: false,
        score: null,
        exercises_done: 0,
        xp_base: Math.round(100 * phaseConfig.xpMultiplier),
        xp_earned: 0,
        time_estimate_min: phaseConfig.exerciseCount * 8  // ~8 min per exercise
      });
    }

    return plan;
  },

  _buildObjective: function (phaseConfig, section) {
    const templates = {
      1: `Understand the core concept of ${section.name} and recognise it in code. No pressure — focus on reading and absorbing.`,
      2: `Apply ${section.name} patterns in context. You'll fill gaps and spot bugs in real snippets.`,
      3: `Handle tricky edge cases in ${section.name}. Debug complex code and restore broken logic.`,
      4: `Demonstrate mastery of ${section.name} by solving multi-step challenges without hints.`
    };
    return templates[phaseConfig.phase] || templates[1];
  },

  /**
   * Record a day's completion and update skill snapshot.
   * Call this whenever a learner completes a day.
   */
  recordDayCompletion: function (plan, dayIndex, exerciseScores) {
    const day = plan.days[dayIndex];
    if (!day) return plan;

    const avgScore = exerciseScores.length
      ? Math.round(exerciseScores.reduce((a, b) => a + b, 0) / exerciseScores.length)
      : 0;

    day.completed = true;
    day.score = avgScore;
    day.exercises_done = exerciseScores.length;
    day.xp_earned = avgScore >= 85
      ? day.xp_base * 1.5        // Excellence bonus
      : avgScore >= 70
        ? day.xp_base
        : day.xp_base * 0.5;    // Partial credit for attempts

    day.xp_earned = Math.round(day.xp_earned);

    // Snapshot for trend chart
    plan.skill_snapshots.push({
      day: day.day,
      score: avgScore,
      topic: day.topic,
      xp: day.xp_earned
    });

    // Move current_day forward
    if (plan.current_day === day.day) {
      plan.current_day = Math.min(30, plan.current_day + 1);
    }

    // Recalculate overall competency (weighted rolling average)
    const completed = plan.days.filter(d => d.completed && d.score !== null);
    if (completed.length) {
      plan.overall_competency = Math.round(
        completed.reduce((sum, d) => sum + d.score, 0) / completed.length
      );
    }

    // Check mastery
    const lastDay = plan.days[plan.days.length - 1];
    if (lastDay && lastDay.completed && plan.overall_competency >= 70) {
      plan.mastered = true;
    }

    plan.last_active = new Date().toISOString();
    return plan;
  },

  /**
   * Handle checkpoint completion. Unlocks the next phase if passed.
   */
  recordCheckpointCompletion: function (plan, dayIndex, score) {
    const day = plan.days[dayIndex];
    if (!day || !day.is_checkpoint) return plan;

    day.completed = true;
    day.score = score;
    day.xp_earned = score >= 70 ? day.xp_base : Math.round(day.xp_base * 0.4);

    // Unlock next phase if checkpoint passed
    if (score >= 70) {
      const nextPhase = day.phase + 1;
      if (nextPhase <= 4 && !plan.phase_unlocked.includes(nextPhase)) {
        plan.phase_unlocked.push(nextPhase);
      }
      if (plan.current_phase < day.phase) {
        plan.current_phase = day.phase;
      }
    }

    plan.skill_snapshots.push({
      day: day.day,
      score,
      topic: 'Checkpoint',
      xp: day.xp_earned
    });

    plan.last_active = new Date().toISOString();
    return plan;
  },

  /**
   * Get a summary of the learner's progress for the profile card.
   */
  getSummary: function (plan) {
    if (!plan) return null;
    const completed = plan.days.filter(d => d.completed);
    const checkpointsPassed = plan.days.filter(d => d.is_checkpoint && d.completed && d.score >= 70).length;
    const totalXp = plan.days.reduce((sum, d) => sum + (d.xp_earned || 0), 0);
    const bestDay = completed.sort((a, b) => (b.score || 0) - (a.score || 0))[0];

    return {
      days_done: completed.length,
      days_remaining: 30 - completed.length,
      overall_competency: plan.overall_competency,
      checkpoints_passed: checkpointsPassed,
      total_xp_earned: totalXp,
      best_score: bestDay ? bestDay.score : null,
      best_topic: bestDay ? bestDay.topic : null,
      mastered: plan.mastered,
      current_phase: plan.current_phase,
      phase_name: PHASE_CONFIG.find(p => p.phase === plan.current_phase)?.name || 'Foundation'
    };
  },

  buildSyntheticExercise: buildSyntheticExercise
};

window.PlanGenerator = PlanGenerator;
window.TOPIC_RESOURCES = TOPIC_RESOURCES;
window.detectWeakSections = detectWeakSections;
