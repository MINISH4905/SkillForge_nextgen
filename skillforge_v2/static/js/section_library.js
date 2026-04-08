/**
 * ═══════════════════════════════════════════════
 * GSDS — Section Library v2.0
 * Rich exercise + concept data for all domains.
 * Referenced by plan_generator.js (exercise pool)
 * and remediation_screen.js (concept cards).
 *
 * Structure per section:
 *   id          — matches section_id in DB
 *   name        — display name
 *   concept_card — { title, bullets, example_code }
 *   exercises   — array of exercise objects
 *     type 1 = Bug Fix
 *     type 2 = Fill in the Blank
 *     type 3 = Multiple Choice
 *     type 4 = Reorder
 *     type 5 = Debug Challenge
 *     type 6 = Concept Card Q
 * ═══════════════════════════════════════════════
 */

const SECTION_LIBRARY = {

  // ════════════════════════════════════════════════════════════
  // WEB DEVELOPMENT
  // ════════════════════════════════════════════════════════════
  web: [

    {
      id: 'web-s1',
      name: 'Flexbox flow',
      concept_card: {
        title: 'CSS Flexbox',
        bullets: [
          'flex container: display:flex on parent',
          'Main axis controlled by flex-direction (row/column)',
          'justify-content aligns along main axis',
          'align-items aligns along cross axis',
          'flex-wrap allows items to wrap to new lines',
          'flex-grow / flex-shrink control how items resize',
        ],
        example_code:
`.container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.item { flex: 1 1 200px; }`,
      },
      exercises: [
        {
          type: 3,
          question: 'Which property centres flex items along the cross axis?',
          options: ['justify-content', 'align-items', 'flex-direction', 'align-content'],
          answer: 'align-items',
          explanation: 'align-items controls alignment on the cross axis (perpendicular to flex-direction).',
        },
        {
          type: 2,
          prompt: 'Complete the flex container rule that horizontally centres and vertically centres its children:',
          snippet: `.card {
  display: flex;
  justify-content: [ __ ];
  align-items: [ __ ];
}`,
          blanks: ['center', 'center'],
        },
        {
          type: 1,
          prompt: 'Find and fix the bug — items should be centred horizontally:',
          snippet: `.row {
  display: flex;
  align-items: center;    /* vertical */
  align-content: center;  /* BUG: wrong property for horizontal */
}`,
          bug_description: 'align-content is used instead of justify-content',
          fix: 'justify-content',
          fix_pattern: 'justify-content',
          model_solution:
`.row {
  display: flex;
  align-items: center;
  justify-content: center;
}`,
        },
        {
          type: 4,
          prompt: 'Put these flex layout steps in order:',
          lines: [
            'Set display:flex on the parent container',
            'Choose flex-direction (row or column)',
            'Set justify-content for main-axis alignment',
            'Set align-items for cross-axis alignment',
            'Add flex-wrap if items should wrap',
          ],
        },
        {
          type: 5,
          prompt: 'Items overflow instead of wrapping. Debug and fix:',
          snippet: `.gallery {
  display: flex;
  flex-direction: row;
  /* items overflow on small screens */
}
.gallery img { width: 200px; }`,
          expected: 'Items wrap to the next row when they overflow',
          fix_pattern: 'flex-wrap: wrap',
          model_solution:
`.gallery {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
}
.gallery img { width: 200px; }`,
        },
      ],
    },

    {
      id: 'web-s2',
      name: 'CSS specificity',
      concept_card: {
        title: 'CSS Specificity',
        bullets: [
          'Specificity determines which CSS rule wins conflicts',
          'Calculated as (inline, IDs, classes/attrs/pseudo, elements)',
          '!important overrides all — use sparingly',
          '#id > .class > element in specificity weight',
          'Later rules win when specificity is equal (cascade)',
          'Avoid over-specific selectors — they are hard to override',
        ],
        example_code:
`/* Specificity: 0,0,1,1 */
p.intro { color: blue; }

/* Specificity: 0,1,0,0 — wins */
#hero p { color: red; }

/* Specificity: 0,0,0,1 — loses */
p { color: green; }`,
      },
      exercises: [
        {
          type: 3,
          question: 'Which selector has the highest specificity?',
          options: ['p', '.text', '#main', 'div p'],
          answer: '#main',
          explanation: 'ID selectors (0,1,0,0) beat class (0,0,1,0) and element (0,0,0,1) selectors.',
        },
        {
          type: 2,
          prompt: 'A rule with only two class selectors has specificity (0, 0, [ __ ], 0):',
          snippet: `.card .title { font-size: 1.2rem; }`,
          blanks: ['2'],
        },
        {
          type: 1,
          prompt: 'The heading is not turning red. Fix the specificity issue:',
          snippet: `/* Both target h1 inside .hero */
h1 { color: blue; }          /* should lose */
.hero h1 { color: red; }     /* should win — BUG: not winning */

/* In HTML: <div class="hero"><h1>Title</h1></div> */`,
          bug_description: 'Nothing is actually wrong here — but the learner may be overriding with inline style',
          fix: 'remove inline style or add class',
          fix_pattern: 'color: red',
          model_solution:
`/* .hero h1 has higher specificity (0,0,1,1) than h1 (0,0,0,1) */
/* Remove any inline style="color:blue" from the h1 element */
h1 { color: blue; }
.hero h1 { color: red; } /* wins */`,
        },
        {
          type: 5,
          prompt: 'The button text stays black even with the class rule. Debug:',
          snippet: `<button style="color: black;" class="btn-primary">Click</button>

/* CSS */
.btn-primary { color: white; }`,
          expected: 'Button text should be white',
          fix_pattern: 'style',
          model_solution:
`/* Remove inline style OR use !important as last resort */
<button class="btn-primary">Click</button>
/* CSS */
.btn-primary { color: white; }`,
        },
      ],
    },

    {
      id: 'web-s3',
      name: 'Event delegation',
      concept_card: {
        title: 'Event Delegation',
        bullets: [
          'Attach ONE listener to a parent, not many to children',
          'Events bubble up the DOM from target to document',
          'Use event.target to identify the clicked element',
          'Matches dynamic elements added after page load',
          'Use closest() to find the right ancestor',
          'More efficient than per-element listeners',
        ],
        example_code:
`// Instead of: items.forEach(el => el.addEventListener(...))
document.querySelector('#list').addEventListener('click', (e) => {
  const item = e.target.closest('.list-item');
  if (!item) return;
  console.log('Clicked:', item.dataset.id);
});`,
      },
      exercises: [
        {
          type: 3,
          question: 'Why is event delegation preferred over per-element listeners for a dynamic list?',
          options: [
            'It fires events faster',
            'It works for elements added after the listener was attached',
            'It prevents event bubbling',
            'It only works with click events',
          ],
          answer: 'It works for elements added after the listener was attached',
          explanation: 'Delegation listens on a stable parent — new children automatically inherit the listener via bubbling.',
        },
        {
          type: 1,
          prompt: 'Fix the click handler — it should use event delegation instead of looping:',
          snippet: `const buttons = document.querySelectorAll('.action-btn');
buttons.forEach(btn => {          // BUG: breaks for dynamic buttons
  btn.addEventListener('click', handleAction);
});`,
          bug_description: 'Direct listeners do not work for dynamically added elements',
          fix_pattern: "addEventListener('click'",
          fix: 'Attach to parent with e.target check',
          model_solution:
`document.querySelector('.btn-container').addEventListener('click', (e) => {
  if (!e.target.matches('.action-btn')) return;
  handleAction(e);
});`,
        },
        {
          type: 2,
          prompt: 'Complete the delegated handler using closest():',
          snippet: `document.getElementById('table').addEventListener('click', (e) => {
  const row = e.target.[ __ ]('tr');
  if (!row) return;
  highlightRow(row);
});`,
          blanks: ['closest'],
        },
        {
          type: 5,
          prompt: 'The delete button inside a card does not fire. Debug:',
          snippet: `document.querySelector('.card-list').addEventListener('click', (e) => {
  if (e.target.className === 'delete-btn') {
    deleteCard(e.target.dataset.id);
  }
});
/* HTML: <button class="delete-btn icon-trash" data-id="5">Delete</button> */`,
          expected: 'Delete button click should trigger deleteCard()',
          fix_pattern: 'matches',
          model_solution:
`document.querySelector('.card-list').addEventListener('click', (e) => {
  // className exact match fails when element has multiple classes
  if (e.target.matches('.delete-btn')) {
    deleteCard(e.target.dataset.id);
  }
});`,
        },
      ],
    },

    {
      id: 'web-s4',
      name: 'Async/await errors',
      concept_card: {
        title: 'Async / Await',
        bullets: [
          'async functions always return a Promise',
          'await pauses execution until the Promise resolves',
          'Unhandled rejections crash silently — always use try/catch',
          'Promise.all() runs promises in parallel — faster',
          'await in a forEach does NOT pause the loop — use for…of',
          'Return values inside async functions are auto-wrapped in Promise',
        ],
        example_code:
`async function loadUser(id) {
  try {
    const res = await fetch('/api/users/' + id);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    console.error('Failed:', err);
    return null;
  }
}`,
      },
      exercises: [
        {
          type: 3,
          question: 'What happens if you use await inside forEach()?',
          options: [
            'Each iteration waits for the promise to resolve',
            'It throws a SyntaxError',
            'The awaits run concurrently — forEach does not await',
            'It works exactly like a for…of loop',
          ],
          answer: 'The awaits run concurrently — forEach does not await',
          explanation: 'forEach ignores returned promises, so async callbacks overlap. Use for…of for sequential async iteration.',
        },
        {
          type: 1,
          prompt: 'Fix the async function — it swallows errors silently:',
          snippet: `async function saveData(data) {
  const res = await fetch('/api/save', {   // BUG: no try/catch
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
}`,
          bug_description: 'No try/catch — network errors are unhandled',
          fix_pattern: 'try',
          model_solution:
`async function saveData(data) {
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Server error ' + res.status);
    return await res.json();
  } catch (err) {
    console.error('saveData failed:', err);
    throw err;
  }
}`,
        },
        {
          type: 2,
          prompt: 'Complete the sequential async loop:',
          snippet: `async function processItems(items) {
  for ([ __ ] const item of items) {
    await processOne(item);
  }
}`,
          blanks: ['const'],
        },
        {
          type: 5,
          prompt: 'Loading three resources is slow. Debug and parallelise:',
          snippet: `async function loadAll() {
  const users = await fetch('/api/users').then(r => r.json());
  const posts = await fetch('/api/posts').then(r => r.json());
  const tags  = await fetch('/api/tags').then(r => r.json());
  return { users, posts, tags };
}`,
          expected: 'All three fetches run in parallel',
          fix_pattern: 'Promise.all',
          model_solution:
`async function loadAll() {
  const [users, posts, tags] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/tags').then(r => r.json()),
  ]);
  return { users, posts, tags };
}`,
        },
      ],
    },

    {
      id: 'web-s5',
      name: 'DOM diffing',
      concept_card: {
        title: 'Virtual DOM & Reconciliation',
        bullets: [
          'Virtual DOM is an in-memory JS representation of the real DOM',
          'React diffs the new vDOM against the previous snapshot',
          'Only changed nodes are patched in the real DOM',
          'key prop helps React identify list items across re-renders',
          'Missing/wrong keys cause unnecessary unmount/remount',
          'Batched updates reduce expensive layout recalculations',
        ],
        example_code:
`// BAD: using array index as key
items.map((item, i) => <Card key={i} {...item} />)

// GOOD: using stable unique ID
items.map(item => <Card key={item.id} {...item} />)`,
      },
      exercises: [
        {
          type: 3,
          question: 'What is the main purpose of the key prop in React lists?',
          options: [
            'To apply CSS classes to each item',
            'To help React identify which items changed, were added, or removed',
            'To prevent re-rendering of child components',
            'To set the HTML id attribute on the element',
          ],
          answer: 'To help React identify which items changed, were added, or removed',
        },
        {
          type: 1,
          prompt: 'Fix the list rendering — items lose state on re-order:',
          snippet: `function List({ items }) {
  return (
    <ul>
      {items.map((item, index) => (
        <ListItem key={index} data={item} />  {/* BUG */}
      ))}
    </ul>
  );
}`,
          bug_description: 'Using array index as key causes incorrect reconciliation when items reorder',
          fix_pattern: 'key={item.id}',
          model_solution:
`function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <ListItem key={item.id} data={item} />
      ))}
    </ul>
  );
}`,
        },
        {
          type: 2,
          prompt: 'Complete: React only re-renders a component when its [ __ ] or [ __ ] change.',
          snippet: `// The two main triggers for a React re-render:
// 1. [ __ ] changes (passed from parent)
// 2. [ __ ] changes (internal useState/useReducer)`,
          blanks: ['props', 'state'],
        },
      ],
    },

    {
      id: 'web-s6',
      name: 'Responsive units',
      concept_card: {
        title: 'CSS Responsive Units',
        bullets: [
          'px — absolute, unaffected by user zoom preference',
          'em — relative to the element\'s own font-size',
          'rem — relative to root <html> font-size (default 16px)',
          'vw/vh — percentage of viewport width/height',
          '% — relative to parent element dimension',
          'Use rem for typography, px for borders/shadows, vw for full-width sections',
        ],
        example_code:
`:root { font-size: 16px; }
h1 { font-size: 2rem; }    /* 32px — scales with root */
.card { padding: 1.5em; }  /* relative to card's font-size */
.hero { height: 100vh; }   /* full viewport height */`,
      },
      exercises: [
        {
          type: 3,
          question: 'A user increases their browser default font size. Which unit scales accordingly?',
          options: ['px', 'rem', 'vw', 'pt'],
          answer: 'rem',
          explanation: 'rem is relative to the root font size, which respects the browser setting. px is absolute.',
        },
        {
          type: 2,
          prompt: 'Complete: 1.5rem when root is 16px equals [ __ ]px:',
          snippet: `/* root = 16px */
.heading { font-size: 1.5rem; /* = [ __ ]px */ }`,
          blanks: ['24'],
        },
        {
          type: 5,
          prompt: 'Text does not scale with user zoom. Debug:',
          snippet: `.body-text {
  font-size: 14px;   /* BUG: absolute unit */
  line-height: 20px;
}`,
          expected: 'Text scales when user changes browser font size',
          fix_pattern: 'rem',
          model_solution:
`.body-text {
  font-size: 0.875rem;  /* 14/16 = 0.875rem */
  line-height: 1.45;    /* unitless — scales with font-size */
}`,
        },
      ],
    },

  ], // end web

  // ════════════════════════════════════════════════════════════
  // DSA
  // ════════════════════════════════════════════════════════════
  dsa: [

    {
      id: 'dsa-s1',
      name: 'Loop invariants',
      concept_card: {
        title: 'Loop Invariants',
        bullets: [
          'A loop invariant is a condition that is true before, during, and after each iteration',
          'Used to prove correctness of iterative algorithms',
          'Initialisation: true before the first iteration',
          'Maintenance: if true before iteration, remains true after',
          'Termination: invariant + exit condition proves algorithm is correct',
          'Binary search invariant: target is always in [lo, hi] if it exists',
        ],
        example_code:
`// Binary search — invariant: if target exists, it is in [lo, hi]
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {              // invariant maintained
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
      },
      exercises: [
        {
          type: 3,
          question: 'What is the loop invariant of a simple linear search over arr[0..n-1]?',
          options: [
            'arr[i] equals the target value',
            'The target has not been found in arr[0..i-1]',
            'i is always less than arr.length',
            'The array is sorted up to index i',
          ],
          answer: 'The target has not been found in arr[0..i-1]',
          explanation: 'Each iteration extends the "not found" range. If the loop ends, the element is absent.',
        },
        {
          type: 1,
          prompt: 'Fix the binary search — it can miss the target:',
          snippet: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length;   // BUG: off-by-one in hi
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return -1;
}`,
          bug_description: 'hi should be arr.length - 1 and loop condition should be lo <= hi',
          fix_pattern: 'arr.length - 1',
          model_solution:
`function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
        },
        {
          type: 2,
          prompt: 'Complete: in binary search, after each step the search space is halved from O(n) to O([ __ ]):',
          snippet: `// Binary search time complexity
// Each step: eliminates half the remaining elements
// Total steps: O([ __ ])`,
          blanks: ['log n'],
        },
        {
          type: 5,
          prompt: 'This insertion sort has a broken invariant — the array is not sorted after completion:',
          snippet: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let j = i;
    while (j > 0 && arr[j] < arr[j - 1]) {
      // BUG: swap is incorrect
      arr[j] = arr[j - 1];
      j--;
    }
  }
  return arr;
}`,
          expected: 'Array is sorted in ascending order',
          fix_pattern: 'arr[j - 1] = arr[j]',
          model_solution:
`function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let j = i;
    while (j > 0 && arr[j] < arr[j - 1]) {
      [arr[j], arr[j - 1]] = [arr[j - 1], arr[j]]; // proper swap
      j--;
    }
  }
  return arr;
}`,
        },
      ],
    },

    {
      id: 'dsa-s2',
      name: 'Pointer arithmetic',
      concept_card: {
        title: 'Two-Pointer Technique',
        bullets: [
          'Use two indices to scan an array from different positions',
          'Often reduces O(n²) nested loops to O(n)',
          'Left+right pattern: move inward based on comparison',
          'Slow+fast pattern: detect cycles or find midpoints',
          'Requires sorted array for many classic problems (pair sum)',
          'Always check boundary conditions before accessing arr[ptr]',
        ],
        example_code:
`// Two-sum in sorted array
function twoSum(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const sum = nums[l] + nums[r];
    if (sum === target) return [l, r];
    if (sum < target) l++;
    else r--;
  }
  return null;
}`,
      },
      exercises: [
        {
          type: 3,
          question: 'What is the time complexity of the two-pointer approach for pair-sum in a sorted array?',
          options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'],
          answer: 'O(n)',
          explanation: 'Each pointer moves at most n times, totalling at most 2n steps → O(n).',
        },
        {
          type: 1,
          prompt: 'Fix the reverse-in-place function:',
          snippet: `function reverse(arr) {
  let l = 0, r = arr.length;   // BUG
  while (l < r) {
    [arr[l], arr[r]] = [arr[r], arr[l]];
    l++; r--;
  }
  return arr;
}`,
          bug_description: 'r should start at arr.length - 1, else arr[r] is undefined',
          fix_pattern: 'arr.length - 1',
          model_solution:
`function reverse(arr) {
  let l = 0, r = arr.length - 1;
  while (l < r) {
    [arr[l], arr[r]] = [arr[r], arr[l]];
    l++; r--;
  }
  return arr;
}`,
        },
        {
          type: 2,
          prompt: 'Complete the sliding-window max-sum of size k:',
          snippet: `function maxSum(arr, k) {
  let sum = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let max = sum;
  for (let i = k; i < arr.length; i++) {
    sum += arr[i] - arr[[ __ ]];  // slide window
    max = Math.max(max, sum);
  }
  return max;
}`,
          blanks: ['i - k'],
        },
      ],
    },

    {
      id: 'dsa-s3',
      name: 'Recursion base cases',
      concept_card: {
        title: 'Recursion & Base Cases',
        bullets: [
          'Every recursive function needs at least one base case',
          'Base case: the simplest input where the answer is known directly',
          'Without a base case, recursion produces a stack overflow',
          'Recursive case must move toward the base case',
          'Tail recursion can sometimes be optimised by the runtime',
          'Draw a recursion tree to trace call depth and return values',
        ],
        example_code:
`function factorial(n) {
  if (n <= 1) return 1;       // base case
  return n * factorial(n - 1); // recursive case → n decreases
}

function fib(n) {
  if (n <= 1) return n;        // two base cases: 0 and 1
  return fib(n - 1) + fib(n - 2);
}`,
      },
      exercises: [
        {
          type: 3,
          question: 'What happens if a recursive function has no base case?',
          options: [
            'It returns undefined',
            'It runs once and stops',
            'It causes a stack overflow (infinite recursion)',
            'It skips the recursive call silently',
          ],
          answer: 'It causes a stack overflow (infinite recursion)',
        },
        {
          type: 1,
          prompt: 'Fix the recursive sum — it never terminates:',
          snippet: `function sum(n) {
  // BUG: missing base case
  return n + sum(n - 1);
}`,
          bug_description: 'No base case — recurses infinitely',
          fix_pattern: 'if (n <= 0)',
          model_solution:
`function sum(n) {
  if (n <= 0) return 0;   // base case
  return n + sum(n - 1);
}`,
        },
        {
          type: 2,
          prompt: 'Complete the recursive power function:',
          snippet: `function power(base, exp) {
  if (exp === [ __ ]) return 1;      // base case
  return base * power(base, exp - 1);
}`,
          blanks: ['0'],
        },
        {
          type: 5,
          prompt: 'The tree depth function crashes on null nodes:',
          snippet: `function maxDepth(node) {
  // BUG: no null check
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}`,
          expected: 'Returns correct depth; returns 0 for null nodes',
          fix_pattern: 'if (!node)',
          model_solution:
`function maxDepth(node) {
  if (!node) return 0;   // base case for null/leaf
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}`,
        },
      ],
    },

    {
      id: 'dsa-s4',
      name: 'Off-by-one errors',
      concept_card: {
        title: 'Off-by-One Errors',
        bullets: [
          'OBO errors are one of the most common bugs in loops and array access',
          'Ask: should the boundary be < or <=?',
          'Zero-indexed arrays: valid range is [0, n-1]',
          'Slice(start, end): end is exclusive',
          'For inclusive ranges, use <=; for exclusive, use <',
          'Test with n=0, n=1, and n=2 to catch boundary bugs early',
        ],
        example_code:
`const arr = [10, 20, 30, 40, 50]; // length 5

// WRONG — accesses arr[5] = undefined
for (let i = 0; i <= arr.length; i++) { ... }

// CORRECT
for (let i = 0; i < arr.length; i++) { ... }

// Slice: arr.slice(1, 3) → [20, 30]  (index 3 excluded)`,
      },
      exercises: [
        {
          type: 3,
          question: 'For an array of length n, what is the index of the last valid element?',
          options: ['n', 'n-1', 'n+1', 'n/2'],
          answer: 'n-1',
          explanation: 'Arrays are zero-indexed. Index 0 is first, index n-1 is last.',
        },
        {
          type: 1,
          prompt: 'Fix the array traversal — it throws "index out of bounds":',
          snippet: `function printAll(arr) {
  for (let i = 0; i <= arr.length; i++) {  // BUG
    console.log(arr[i]);
  }
}`,
          bug_description: '<= should be < — arr[arr.length] is undefined',
          fix_pattern: 'i < arr.length',
          model_solution:
`function printAll(arr) {
  for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]);
  }
}`,
        },
        {
          type: 2,
          prompt: 'arr.slice(1, 4) on [a,b,c,d,e] returns elements at indices 1,2,[ __ ]:',
          snippet: `const arr = ['a','b','c','d','e'];
arr.slice(1, 4); // → ['b','c',[ __ ]]`,
          blanks: ['d'],
        },
        {
          type: 5,
          prompt: 'The last pair is always skipped. Debug:',
          snippet: `function countPairs(arr) {
  let count = 0;
  for (let i = 0; i < arr.length - 1; i++) {  // BUG for counting all
    for (let j = i + 1; j < arr.length; j++) {
      count++;
    }
  }
  return count;
}
// countPairs([1,2,3]) should return 3 but something is wrong`,
          expected: 'Returns n*(n-1)/2 pairs correctly',
          fix_pattern: 'arr.length - 1',
          model_solution:
`// Actually this is correct for pairs: outer loop i < n-1,
// inner loop j = i+1 to n-1 covers all unique pairs.
// The issue might be test data; verify with [1,2,3] → 3 pairs.
function countPairs(arr) {
  let count = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      count++;
    }
  }
  return count; // correctly returns 3 for length-3 array
}`,
        },
      ],
    },

    {
      id: 'dsa-s5',
      name: 'Sorting stability',
      concept_card: {
        title: 'Stable vs Unstable Sorting',
        bullets: [
          'A stable sort preserves the relative order of equal elements',
          'Merge Sort is stable — O(n log n)',
          'Quick Sort is typically unstable — O(n log n) average',
          'Bubble Sort and Insertion Sort are stable — O(n²)',
          'JavaScript Array.sort() is stable in modern engines',
          'Use stable sort when secondary ordering (e.g., by name then age) matters',
        ],
        example_code:
`// Stable sort preserves original order for ties
const people = [
  { name: 'Alice', age: 30 },
  { name: 'Bob',   age: 25 },
  { name: 'Carol', age: 30 },
];
// Sort by age — stable sort keeps Alice before Carol (both 30)
people.sort((a, b) => a.age - b.age);
// → Bob(25), Alice(30), Carol(30)  ← Alice before Carol preserved`,
      },
      exercises: [
        {
          type: 3,
          question: 'You need to sort a list of employees: first by department, then by name within each department. Which algorithm property is essential?',
          options: ['In-place sorting', 'Stability', 'O(n log n) complexity', 'Descending order'],
          answer: 'Stability',
          explanation: 'Sorting by name first then by department needs stability to preserve the name ordering within each department.',
        },
        {
          type: 2,
          prompt: 'Merge sort is [ __ ] while quicksort is generally [ __ ]:',
          snippet: `// Fill: stable or unstable
// Merge Sort:   [ __ ]
// Quick Sort:   [ __ ]`,
          blanks: ['stable', 'unstable'],
        },
        {
          type: 5,
          prompt: 'After sorting by score, names in the same score band are scrambled. Debug:',
          snippet: `const scores = [
  { name: 'Alice', score: 90 },
  { name: 'Bob',   score: 85 },
  { name: 'Carol', score: 90 },
];
// Sorted by score desc using a random-pivot quicksort polyfill
scores.sort((a, b) => b.score - a.score);
// Expected: Alice before Carol (tied at 90, original order)`,
          expected: 'Alice should appear before Carol in the result',
          fix_pattern: '|| a.name.localeCompare',
          model_solution:
`// Use a tiebreaker to make sort deterministic
scores.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
// OR rely on native Array.sort which is stable in modern JS engines.`,
        },
      ],
    },

    {
      id: 'dsa-s6',
      name: 'Hash collisions',
      concept_card: {
        title: 'Hash Collisions',
        bullets: [
          'A hash collision occurs when two keys produce the same hash value',
          'Separate chaining: each bucket holds a linked list of entries',
          'Open addressing: probe for the next empty slot (linear, quadratic)',
          'Load factor = entries / buckets — high load factor → more collisions',
          'Rehashing: resize and rehash when load factor exceeds ~0.75',
          'Good hash functions distribute keys uniformly across buckets',
        ],
        example_code:
`// Separate chaining conceptually
class HashMap {
  constructor(size = 16) {
    this.buckets = new Array(size).fill(null).map(() => []);
  }
  _hash(key) {
    let h = 0;
    for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % this.buckets.length;
    return h;
  }
  set(key, val) {
    const bucket = this.buckets[this._hash(key)];
    const entry = bucket.find(e => e[0] === key);
    if (entry) entry[1] = val;
    else bucket.push([key, val]);
  }
}`,
      },
      exercises: [
        {
          type: 3,
          question: 'What is the worst-case time complexity of lookup in a HashMap with poor hash function?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
          answer: 'O(n)',
          explanation: 'If all keys collide into one bucket, it degenerates to a linked list — O(n) for lookup.',
        },
        {
          type: 2,
          prompt: 'Load factor = number of [ __ ] / number of [ __ ]:',
          snippet: `// Load factor formula:
// loadFactor = [ __ ] / [ __ ]
// Rehash when loadFactor > 0.75`,
          blanks: ['entries', 'buckets'],
        },
        {
          type: 5,
          prompt: 'This custom HashMap loses values after a collision. Debug:',
          snippet: `class BadMap {
  constructor() { this.data = {}; }
  hash(key) { return key.length % 5; }  // terrible hash
  set(key, val) {
    this.data[this.hash(key)] = val;  // BUG: overwrites on collision
  }
  get(key) { return this.data[this.hash(key)]; }
}`,
          expected: 'All key-value pairs are retrievable even if they hash to the same bucket',
          fix_pattern: 'key',
          model_solution:
`class BetterMap {
  constructor() { this.data = {}; }
  hash(key) { return key.length % 5; }
  set(key, val) {
    const h = this.hash(key);
    if (!this.data[h]) this.data[h] = [];
    const bucket = this.data[h];
    const existing = bucket.find(e => e[0] === key);
    if (existing) existing[1] = val;
    else bucket.push([key, val]);
  }
  get(key) {
    const bucket = this.data[this.hash(key)] || [];
    return bucket.find(e => e[0] === key)?.[1];
  }
}`,
        },
      ],
    },

  ], // end dsa

  // ════════════════════════════════════════════════════════════
  // DATABASE
  // ════════════════════════════════════════════════════════════
  database: [

    {
      id: 'db-s1',
      name: 'WHERE vs HAVING',
      concept_card: {
        title: 'WHERE vs HAVING',
        bullets: [
          'WHERE filters rows before grouping',
          'HAVING filters groups after GROUP BY',
          'Cannot use aggregate functions (COUNT, SUM…) in WHERE',
          'HAVING can reference GROUP BY columns or aggregates',
          'Execution order: FROM → WHERE → GROUP BY → HAVING → SELECT',
          'Always prefer WHERE when possible — it filters earlier (faster)',
        ],
        example_code:
`-- Count orders per customer, only for customers with > 5 orders
SELECT customer_id, COUNT(*) AS order_count
FROM orders
WHERE status = 'completed'          -- filter rows first
GROUP BY customer_id
HAVING COUNT(*) > 5;                -- filter groups after`,
      },
      exercises: [
        {
          type: 3,
          question: 'You want to show only departments with an average salary > 50000. Which clause do you use?',
          options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
          answer: 'HAVING',
          explanation: 'Average salary is an aggregate — calculated after grouping — so HAVING is required.',
        },
        {
          type: 1,
          prompt: 'Fix the query — it errors because aggregate is in WHERE:',
          snippet: `SELECT department, COUNT(*) AS cnt
FROM employees
WHERE COUNT(*) > 10     -- BUG
GROUP BY department;`,
          bug_description: 'COUNT(*) cannot appear in WHERE; use HAVING after GROUP BY',
          fix_pattern: 'HAVING',
          model_solution:
`SELECT department, COUNT(*) AS cnt
FROM employees
GROUP BY department
HAVING COUNT(*) > 10;`,
        },
        {
          type: 2,
          prompt: 'Complete: [ __ ] filters rows, while [ __ ] filters groups:',
          snippet: `SELECT city, COUNT(*) FROM orders
[ __ ] status = 'active'   -- row filter
GROUP BY city
[ __ ] COUNT(*) > 3;       -- group filter`,
          blanks: ['WHERE', 'HAVING'],
        },
      ],
    },

    {
      id: 'db-s2',
      name: 'JOIN types',
      concept_card: {
        title: 'SQL JOIN Types',
        bullets: [
          'INNER JOIN: only rows with matching keys in both tables',
          'LEFT JOIN: all rows from left table + matching from right (NULLs if no match)',
          'RIGHT JOIN: all rows from right + matching from left',
          'FULL OUTER JOIN: all rows from both tables',
          'CROSS JOIN: every combination (cartesian product)',
          'Self JOIN: join a table to itself (e.g., manager-employee hierarchy)',
        ],
        example_code:
`-- Left join: all users, even those with no orders
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id;
-- Users with no orders get o.total = NULL`,
      },
      exercises: [
        {
          type: 3,
          question: 'Which JOIN returns rows from the left table even when there is no matching row in the right table?',
          options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'CROSS JOIN'],
          answer: 'LEFT JOIN',
        },
        {
          type: 1,
          prompt: 'Fix the query — it should include users with no orders:',
          snippet: `SELECT u.name, COUNT(o.id)
FROM users u
INNER JOIN orders o ON o.user_id = u.id  -- BUG
GROUP BY u.name;`,
          bug_description: 'INNER JOIN excludes users with no orders; use LEFT JOIN',
          fix_pattern: 'LEFT JOIN',
          model_solution:
`SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.name;`,
        },
        {
          type: 2,
          prompt: 'Complete: INNER JOIN returns only rows where [ __ ] in both tables:',
          snippet: `SELECT * FROM a
INNER JOIN b ON a.id = b.a_id;
-- Result: only rows where [ __ ]`,
          blanks: ['a.id = b.a_id'],
        },
        {
          type: 5,
          prompt: 'The query returns duplicate rows. Debug:',
          snippet: `SELECT c.name, o.amount
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id;
-- Unexpectedly returns many duplicate customer rows`,
          expected: 'One row per order, no duplicates',
          fix_pattern: 'DISTINCT',
          model_solution:
`-- Each order can have multiple items → join multiplies rows
-- Fix: use DISTINCT, or aggregate, or only join what's needed
SELECT DISTINCT c.name, o.amount
FROM customers c
JOIN orders o ON o.customer_id = c.id;
-- OR: separate query for order items`,
        },
      ],
    },

    {
      id: 'db-s3',
      name: 'NULL behaviour',
      concept_card: {
        title: 'NULL in SQL',
        bullets: [
          'NULL means "unknown" — not zero, not empty string',
          'Any comparison with NULL returns UNKNOWN (not TRUE or FALSE)',
          'Use IS NULL / IS NOT NULL — never = NULL',
          'NULL propagates: NULL + 5 = NULL',
          'COALESCE(a, b) returns first non-null value',
          'COUNT(*) counts all rows; COUNT(col) ignores NULLs',
        ],
        example_code:
`-- WRONG: this returns 0 rows even when nulls exist
SELECT * FROM users WHERE phone = NULL;

-- CORRECT
SELECT * FROM users WHERE phone IS NULL;

-- Replace NULL with default
SELECT name, COALESCE(phone, 'N/A') AS phone FROM users;`,
      },
      exercises: [
        {
          type: 3,
          question: 'What does NULL = NULL evaluate to in SQL?',
          options: ['TRUE', 'FALSE', 'UNKNOWN', '1'],
          answer: 'UNKNOWN',
          explanation: 'NULL represents an unknown value. Two unknowns cannot be proven equal.',
        },
        {
          type: 1,
          prompt: 'Fix the query — it returns no rows even though nulls exist:',
          snippet: `SELECT * FROM employees
WHERE manager_id = NULL;   -- BUG`,
          bug_description: '= NULL never matches; use IS NULL',
          fix_pattern: 'IS NULL',
          model_solution:
`SELECT * FROM employees
WHERE manager_id IS NULL;`,
        },
        {
          type: 2,
          prompt: 'Complete: to replace NULL salary with 0, use [ __ ](salary, 0):',
          snippet: `SELECT name, [ __ ](salary, 0) AS salary FROM staff;`,
          blanks: ['COALESCE'],
        },
      ],
    },

    {
      id: 'db-s4',
      name: 'Index usage',
      concept_card: {
        title: 'Database Indexes',
        bullets: [
          'Index = data structure (B-Tree) for fast column lookups',
          'Without index: full table scan O(n)',
          'With index: O(log n) lookup',
          'Indexes slow down INSERT/UPDATE/DELETE (must update index)',
          'Composite index: (a, b) helps queries filtering on a or (a AND b) — not b alone',
          'EXPLAIN / EXPLAIN ANALYZE shows if an index is being used',
        ],
        example_code:
`-- Create index on frequently queried column
CREATE INDEX idx_orders_user ON orders(user_id);

-- Composite index for common filter pattern
CREATE INDEX idx_orders_status_date ON orders(status, created_at);

-- Check if index is used
EXPLAIN SELECT * FROM orders WHERE user_id = 42;`,
      },
      exercises: [
        {
          type: 3,
          question: 'You have a composite index on (status, created_at). Which query will use it?',
          options: [
            'WHERE created_at > "2024-01-01"',
            'WHERE status = "active"',
            'WHERE created_at = "2024-01-01" AND status = "active"',
            'Both B and C',
          ],
          answer: 'Both B and C',
          explanation: 'Composite indexes can be used when filtering on the leftmost prefix. "status" alone or "status + created_at" both qualify.',
        },
        {
          type: 2,
          prompt: 'The query tool for inspecting query execution plans is called [ __ ]:',
          snippet: `-- Usage:
[ __ ] SELECT * FROM orders WHERE user_id = 5;
-- Shows: Seq Scan vs Index Scan`,
          blanks: ['EXPLAIN'],
        },
        {
          type: 5,
          prompt: 'Query is slow even though an index exists. Debug:',
          snippet: `-- Table: products (1M rows)
-- Index: idx_products_name ON products(name)
SELECT * FROM products WHERE LOWER(name) = 'apple';
-- Still doing a full table scan`,
          expected: 'Query uses the index efficiently',
          fix_pattern: 'functional index',
          model_solution:
`-- Using LOWER() wraps the column in a function → index is bypassed
-- Fix 1: store names always lowercase
-- Fix 2: create a functional index
CREATE INDEX idx_products_name_lower ON products(LOWER(name));
SELECT * FROM products WHERE LOWER(name) = 'apple'; -- now uses index`,
        },
      ],
    },

    {
      id: 'db-s5',
      name: 'Subquery vs CTE',
      concept_card: {
        title: 'Subqueries vs CTEs',
        bullets: [
          'Subquery: nested SELECT inside a query — inline and reusable only once',
          'CTE (WITH clause): named, readable, can be referenced multiple times',
          'Recursive CTEs can traverse hierarchical data (trees, graphs)',
          'CTEs are evaluated once then referenced — improves readability',
          'Correlated subqueries run once per outer row — often slow',
          'Prefer CTEs for complex logic — easier to debug and maintain',
        ],
        example_code:
`-- Subquery (inline)
SELECT name FROM employees
WHERE dept_id IN (SELECT id FROM departments WHERE budget > 100000);

-- Equivalent CTE (more readable)
WITH rich_depts AS (
  SELECT id FROM departments WHERE budget > 100000
)
SELECT name FROM employees WHERE dept_id IN (SELECT id FROM rich_depts);`,
      },
      exercises: [
        {
          type: 3,
          question: 'When should you prefer a CTE over a subquery?',
          options: [
            'When the subquery is used only once',
            'When you need to reference the same result set multiple times in a query',
            'When you want the query to run faster always',
            'CTEs and subqueries are identical in all cases',
          ],
          answer: 'When you need to reference the same result set multiple times in a query',
        },
        {
          type: 2,
          prompt: 'Complete the CTE syntax:',
          snippet: `[ __ ] recent_orders AS (
  SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT customer_id, COUNT(*) FROM [ __ ] GROUP BY customer_id;`,
          blanks: ['WITH', 'recent_orders'],
        },
        {
          type: 5,
          prompt: 'This correlated subquery is extremely slow. Rewrite it:',
          snippet: `SELECT e.name,
  (SELECT AVG(salary) FROM employees e2 WHERE e2.dept_id = e.dept_id) AS dept_avg
FROM employees e;
-- Runs the subquery once per row!`,
          expected: 'Equivalent result using JOIN + GROUP BY or CTE — much faster',
          fix_pattern: 'WITH',
          model_solution:
`WITH dept_avgs AS (
  SELECT dept_id, AVG(salary) AS dept_avg FROM employees GROUP BY dept_id
)
SELECT e.name, da.dept_avg
FROM employees e
JOIN dept_avgs da ON da.dept_id = e.dept_id;`,
        },
      ],
    },

    {
      id: 'db-s6',
      name: 'Transaction isolation',
      concept_card: {
        title: 'Transaction Isolation Levels',
        bullets: [
          'READ UNCOMMITTED: can read dirty (uncommitted) data',
          'READ COMMITTED: only reads committed data (default in most DBs)',
          'REPEATABLE READ: same row returns same value within transaction',
          'SERIALIZABLE: strictest — transactions appear sequential',
          'Phantom read: another transaction inserts rows matching your query range',
          'Higher isolation = fewer anomalies, but more contention and slower',
        ],
        example_code:
`-- Set isolation level for a transaction
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1;
-- ... other operations ...
COMMIT;

-- READ COMMITTED prevents dirty reads
-- REPEATABLE READ also prevents non-repeatable reads
-- SERIALIZABLE prevents phantom reads`,
      },
      exercises: [
        {
          type: 3,
          question: 'Which isolation level prevents dirty reads but still allows non-repeatable reads?',
          options: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
          answer: 'READ COMMITTED',
          explanation: 'READ COMMITTED ensures you only read committed data (no dirty reads), but another transaction can still update a row between your two reads within the same transaction.',
        },
        {
          type: 2,
          prompt: 'Complete: A [ __ ] read occurs when a transaction reads data modified by another uncommitted transaction:',
          snippet: `-- Types of read anomalies:
-- [ __ ] read: reads uncommitted changes
-- Non-repeatable read: same query returns different rows
-- Phantom read: new rows appear between two identical range queries`,
          blanks: ['dirty'],
        },
        {
          type: 1,
          prompt: 'Fix the bank transfer — it can produce negative balances under concurrent load:',
          snippet: `-- Transaction 1 (withdraw 100):
BEGIN;
SELECT balance FROM accounts WHERE id = 1;   -- reads 150
-- (concurrent TX2 also reads 150 and deducts 100)
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;`,
          bug_description: 'No isolation level set; concurrent reads lead to lost update',
          fix_pattern: 'SERIALIZABLE',
          model_solution:
`BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE; -- row lock
UPDATE accounts SET balance = balance - 100
  WHERE id = 1 AND balance >= 100;  -- guard check
COMMIT;`,
        },
      ],
    },

  ], // end database

  // ════════════════════════════════════════════════════════════
  // AI/ML
  // ════════════════════════════════════════════════════════════
  aiml: [

    {
      id: 'aiml-s1',
      name: 'Overfitting signals',
      concept_card: {
        title: 'Overfitting & Underfitting',
        bullets: [
          'Overfitting: model memorises training data — high train acc, low val acc',
          'Underfitting: model too simple — high error on both train and val',
          'Bias-variance tradeoff: more complexity reduces bias but increases variance',
          'Signs of overfitting: val loss rises while train loss keeps falling',
          'Fix overfitting: dropout, L2 regularisation, more data, early stopping',
          'Fix underfitting: more layers, more epochs, better features',
        ],
        example_code:
`# Typical overfitting signal in training history:
# Epoch 1:  train_loss=0.8  val_loss=0.9
# Epoch 10: train_loss=0.2  val_loss=0.5  (good)
# Epoch 20: train_loss=0.05 val_loss=0.8  (overfit!)

# Early stopping callback (Keras)
from tensorflow.keras.callbacks import EarlyStopping
early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)`,
      },
      exercises: [
        {
          type: 3,
          question: 'Your model has 99% training accuracy but 62% validation accuracy. What is the most likely problem?',
          options: ['Underfitting', 'Overfitting', 'Data leakage', 'Vanishing gradient'],
          answer: 'Overfitting',
          explanation: 'Large gap between train and val accuracy is the classic overfitting signature.',
        },
        {
          type: 2,
          prompt: 'Complete: [ __ ] error is the model\'s inability to capture patterns, while [ __ ] error comes from sensitivity to small training fluctuations:',
          snippet: `# Bias-variance tradeoff:
# [ __ ] error: underfitting
# [ __ ] error: overfitting`,
          blanks: ['Bias', 'Variance'],
        },
        {
          type: 5,
          prompt: 'Training accuracy keeps improving but val accuracy stalls. Identify and fix:',
          snippet: `model = Sequential([
  Dense(2048, activation='relu'),
  Dense(2048, activation='relu'),
  Dense(2048, activation='relu'),
  Dense(10, activation='softmax')
])
# Training on 5000 samples for 200 epochs with no regularisation`,
          expected: 'Model generalises well — val accuracy close to train accuracy',
          fix_pattern: 'Dropout',
          model_solution:
`from tensorflow.keras.layers import Dropout
from tensorflow.keras.callbacks import EarlyStopping

model = Sequential([
  Dense(256, activation='relu'),
  Dropout(0.4),
  Dense(128, activation='relu'),
  Dropout(0.3),
  Dense(10, activation='softmax')
])
# Smaller network + dropout + early stopping`,
        },
      ],
    },

    {
      id: 'aiml-s2',
      name: 'Regularisation methods',
      concept_card: {
        title: 'Regularisation Techniques',
        bullets: [
          'L1 (Lasso): adds |weights| to loss — produces sparse models',
          'L2 (Ridge): adds weights² to loss — shrinks all weights evenly',
          'Dropout: randomly zeros out neurons during training',
          'Batch Normalisation: normalises layer inputs — acts as mild regulariser',
          'Data augmentation: artificially increases training set diversity',
          'Early stopping: stop training when val loss stops improving',
        ],
        example_code:
`from tensorflow.keras import regularizers
from tensorflow.keras.layers import Dropout, Dense

model = Sequential([
  Dense(128, activation='relu',
        kernel_regularizer=regularizers.l2(0.001)),  # L2
  Dropout(0.3),                                       # Dropout
  Dense(64, activation='relu'),
  Dense(1, activation='sigmoid')
])`,
      },
      exercises: [
        {
          type: 3,
          question: 'L1 regularisation tends to produce sparse models because:',
          options: [
            'It squares the weights, making them larger',
            'Its gradient is constant, pushing small weights all the way to zero',
            'It randomly removes neurons',
            'It normalises the input distribution',
          ],
          answer: 'Its gradient is constant, pushing small weights all the way to zero',
        },
        {
          type: 2,
          prompt: 'Complete: Dropout randomly sets neuron outputs to [ __ ] during training, with probability [ __ ]:',
          snippet: `# Dropout layer:
# During training: randomly sets outputs to [ __ ]
# During inference: scales outputs by (1 - dropout_rate)
Dropout(rate=[ __ ])  # e.g. 0.3 = 30% dropped`,
          blanks: ['0', '0.3'],
        },
        {
          type: 1,
          prompt: 'Fix the model — it applies dropout during inference too:',
          snippet: `class Model(nn.Module):
  def __init__(self):
    super().__init__()
    self.drop = nn.Dropout(0.5)
    self.fc = nn.Linear(128, 10)

  def forward(self, x):
    x = self.drop(x)    # BUG: always active
    return self.fc(x)`,
          bug_description: 'PyTorch Dropout respects model.train()/eval() mode — call model.eval() during inference',
          fix_pattern: 'model.eval()',
          model_solution:
`# Training
model.train()
output = model(x_train)

# Inference — dropout is automatically disabled
model.eval()
with torch.no_grad():
  output = model(x_test)`,
        },
      ],
    },

    {
      id: 'aiml-s3',
      name: 'Loss functions',
      concept_card: {
        title: 'Loss Functions',
        bullets: [
          'MSE (Mean Squared Error): regression tasks — penalises large errors heavily',
          'MAE (Mean Absolute Error): regression — robust to outliers',
          'Binary Cross-Entropy: binary classification (sigmoid output)',
          'Categorical Cross-Entropy: multi-class (softmax output)',
          'Sparse Categorical CE: same but labels are integers, not one-hot',
          'Choose loss based on output type: regression vs classification',
        ],
        example_code:
`# Regression
model.compile(loss='mse', optimizer='adam')

# Binary classification (one output neuron, sigmoid)
model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

# Multi-class (softmax output, one-hot labels)
model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

# Multi-class (integer labels)
model.compile(loss='sparse_categorical_crossentropy', optimizer='adam')`,
      },
      exercises: [
        {
          type: 3,
          question: 'For a 10-class classification problem with softmax output and one-hot encoded labels, which loss should you use?',
          options: ['MSE', 'Binary cross-entropy', 'Categorical cross-entropy', 'Sparse categorical cross-entropy'],
          answer: 'Categorical cross-entropy',
          explanation: 'Categorical CE is designed for multi-class problems with one-hot labels and softmax outputs.',
        },
        {
          type: 1,
          prompt: 'Fix the model — wrong loss for the problem type:',
          snippet: `# Binary sentiment classifier (positive/negative)
model = Sequential([Dense(64, activation='relu'), Dense(1, activation='sigmoid')])
model.compile(
  loss='categorical_crossentropy',  # BUG
  optimizer='adam', metrics=['accuracy']
)`,
          bug_description: 'Binary classification needs binary_crossentropy, not categorical_crossentropy',
          fix_pattern: 'binary_crossentropy',
          model_solution:
`model.compile(
  loss='binary_crossentropy',
  optimizer='adam',
  metrics=['accuracy']
)`,
        },
        {
          type: 2,
          prompt: 'MSE penalises large errors [ __ ] than small ones because it [ __ ] the error:',
          snippet: `# MSE formula: mean( (y_pred - y_true)^2 )
# A prediction error of 10 is penalised [ __ ] times more than an error of 1
# Because: 10^2 = 100 vs 1^2 = 1
# Error is [ __ ]`,
          blanks: ['100', 'squared'],
        },
      ],
    },

    {
      id: 'aiml-s4',
      name: 'Batch normalisation',
      concept_card: {
        title: 'Batch Normalisation',
        bullets: [
          'Normalises layer inputs to zero mean and unit variance per mini-batch',
          'Reduces internal covariate shift — speeds up training',
          'Acts as a mild regulariser — can reduce need for dropout',
          'Has learnable scale (γ) and shift (β) parameters',
          'Place after linear layer, before activation (most common)',
          'Uses running mean/variance at inference — not batch statistics',
        ],
        example_code:
`from tensorflow.keras.layers import BatchNormalization, Dense, ReLU

model = Sequential([
  Dense(128),
  BatchNormalization(),   # normalise
  ReLU(),                 # then activate
  Dense(64),
  BatchNormalization(),
  ReLU(),
  Dense(10, activation='softmax')
])`,
      },
      exercises: [
        {
          type: 3,
          question: 'Where is batch normalisation typically placed in a layer stack?',
          options: [
            'Before the linear (Dense) layer',
            'After the activation function',
            'After the linear layer, before the activation',
            'Only in the final output layer',
          ],
          answer: 'After the linear layer, before the activation',
        },
        {
          type: 2,
          prompt: 'Batch norm normalises inputs to have mean [ __ ] and variance [ __ ]:',
          snippet: `# BatchNorm formula:
# x_norm = (x - mean) / sqrt(variance + epsilon)
# Result: mean = [ __ ], variance ≈ [ __ ]`,
          blanks: ['0', '1'],
        },
        {
          type: 5,
          prompt: 'Model loss is NaN after adding BatchNorm. Debug:',
          snippet: `model = Sequential([
  Dense(256, activation='relu'),
  BatchNormalization(),
  Dense(128, activation='relu'),
  BatchNormalization(),
  Dense(1, activation='sigmoid')
])
model.compile(loss='binary_crossentropy', optimizer=Adam(learning_rate=0.1))
# Loss becomes NaN immediately`,
          expected: 'Stable training with decreasing loss',
          fix_pattern: 'learning_rate',
          model_solution:
`# Learning rate 0.1 is too high with BatchNorm — causes gradient explosion
model.compile(
  loss='binary_crossentropy',
  optimizer=Adam(learning_rate=0.001)  # lower LR
)
# Also: check for NaN in input data (model.fit with validation_data)`,
        },
      ],
    },

    {
      id: 'aiml-s5',
      name: 'Activation functions',
      concept_card: {
        title: 'Activation Functions',
        bullets: [
          'ReLU: max(0, x) — fast, sparse; suffers dying ReLU for negative inputs',
          'Leaky ReLU: allows small negative gradient — fixes dying ReLU',
          'Sigmoid: squashes to (0,1) — used in binary output layers',
          'Softmax: multi-class output — outputs sum to 1 (probabilities)',
          'Tanh: squashes to (-1,1) — centred around zero, better than sigmoid for hidden layers',
          'GELU / Swish: smooth activations used in modern transformers',
        ],
        example_code:
`# Hidden layers: ReLU or variants
Dense(128, activation='relu')
Dense(128, activation='leaky_relu')

# Binary output
Dense(1, activation='sigmoid')

# Multi-class output
Dense(10, activation='softmax')

# Regression output (no activation or linear)
Dense(1)  # linear`,
      },
      exercises: [
        {
          type: 3,
          question: 'Which activation function should be used for a multi-class output layer with 5 classes?',
          options: ['ReLU', 'Sigmoid', 'Tanh', 'Softmax'],
          answer: 'Softmax',
          explanation: 'Softmax converts raw scores into probabilities that sum to 1, appropriate for multi-class.',
        },
        {
          type: 1,
          prompt: 'Fix the output layer — it should produce probabilities for 3 classes:',
          snippet: `model = Sequential([
  Dense(64, activation='relu'),
  Dense(3, activation='sigmoid')  # BUG: each output independent, don't sum to 1
])`,
          bug_description: 'sigmoid on multi-class output — each neuron independent; use softmax',
          fix_pattern: 'softmax',
          model_solution:
`model = Sequential([
  Dense(64, activation='relu'),
  Dense(3, activation='softmax')  # probabilities sum to 1
])`,
        },
        {
          type: 2,
          prompt: 'The "dying ReLU" problem occurs because ReLU outputs [ __ ] for all negative inputs, so gradients are [ __ ]:',
          snippet: `# ReLU: f(x) = max(0, x)
# For x < 0: output = [ __ ], gradient = [ __ ]
# Neurons stuck at 0 never recover → dying ReLU`,
          blanks: ['0', '0'],
        },
      ],
    },

    {
      id: 'aiml-s6',
      name: 'Data leakage',
      concept_card: {
        title: 'Data Leakage in ML',
        bullets: [
          'Data leakage: test/future information leaks into training — inflates metrics',
          'Train/test split must happen BEFORE any preprocessing',
          'Scaling/normalisation fit on train set only — transform test separately',
          'Feature leakage: using a feature that encodes the label (e.g., account_closed → default)',
          'Temporal leakage: using future data to predict past events',
          'Use pipelines to prevent leakage in cross-validation',
        ],
        example_code:
`from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)   # fit on train only
X_test_scaled  = scaler.transform(X_test)         # transform only`,
      },
      exercises: [
        {
          type: 3,
          question: 'You scale all features using the full dataset before splitting. What problem does this cause?',
          options: [
            'Slower training',
            'Data leakage — test statistics leak into training',
            'Underfitting',
            'No problem — scaling is symmetric',
          ],
          answer: 'Data leakage — test statistics leak into training',
          explanation: 'Fitting the scaler on the full dataset uses test-set mean/variance during training, creating optimistic but invalid metrics.',
        },
        {
          type: 1,
          prompt: 'Fix the preprocessing pipeline to prevent leakage:',
          snippet: `scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)          # BUG: fit on all data
X_train, X_test = train_test_split(X_scaled, test_size=0.2)`,
          bug_description: 'Scaler fitted before split — test stats contaminate training',
          fix_pattern: 'X_train',
          model_solution:
`X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)   # fit ONLY on train
X_test_scaled  = scaler.transform(X_test)`,
        },
        {
          type: 2,
          prompt: 'To safely apply preprocessing in cross-validation without leakage, use a sklearn [ __ ]:',
          snippet: `from sklearn.pipeline import [ __ ]
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

pipe = [ __ ]([('scaler', StandardScaler()), ('clf', LogisticRegression())])
cross_val_score(pipe, X, y, cv=5)  # scaler fit/transform inside each fold`,
          blanks: ['Pipeline'],
        },
      ],
    },

  ], // end aiml

  // ════════════════════════════════════════════════════════════
  // SYSTEM DESIGN
  // ════════════════════════════════════════════════════════════
  sysdesign: [

    {
      id: 'sys-s1',
      name: 'Rate limiting patterns',
      concept_card: {
        title: 'Rate Limiting',
        bullets: [
          'Prevents abuse and ensures fair usage of APIs',
          'Token Bucket: tokens added at rate r; request consumes a token',
          'Leaky Bucket: requests queue, processed at fixed rate — smooths traffic',
          'Fixed Window Counter: count requests per fixed time window',
          'Sliding Window Log: precise but memory-intensive',
          'Sliding Window Counter: hybrid — accurate and memory efficient',
        ],
        example_code:
`// Token Bucket — simple pseudocode
class TokenBucket {
  constructor(capacity, refillRate) {
    this.tokens = capacity;
    this.capacity = capacity;
    this.refillRate = refillRate; // tokens/sec
    this.lastRefill = Date.now();
  }
  consume() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
    if (this.tokens < 1) return false;
    this.tokens--;
    return true;
  }
}`,
      },
      exercises: [
        {
          type: 3,
          question: 'Which rate limiting algorithm allows burst traffic up to a capacity limit?',
          options: ['Fixed Window', 'Leaky Bucket', 'Token Bucket', 'Sliding Window Log'],
          answer: 'Token Bucket',
          explanation: 'Token Bucket accumulates tokens up to capacity. If a burst hits while the bucket is full, all tokens can be consumed at once.',
        },
        {
          type: 2,
          prompt: 'Fixed window counter resets the count every [ __ ] boundary, which can allow [ __ ]× the intended rate at window edges:',
          snippet: `// Fixed Window flaw:
// Window: 0-60s → max 100 requests
// At t=59s: 100 requests → allowed
// At t=61s: another 100 → allowed
// Result: 200 requests in 2 seconds = [ __ ]× the limit`,
          blanks: ['2'],
        },
        {
          type: 5,
          prompt: 'This rate limiter has a race condition under concurrent requests. Debug:',
          snippet: `// Redis-based fixed window (pseudo-code)
async function isAllowed(userId) {
  const key = userId + ':' + Math.floor(Date.now() / 60000);
  const count = await redis.get(key) || 0;
  if (count >= 100) return false;
  await redis.set(key, count + 1, 'EX', 60);  // BUG: not atomic
  return true;
}`,
          expected: 'Thread-safe rate limiting — no race condition',
          fix_pattern: 'INCR',
          model_solution:
`async function isAllowed(userId) {
  const key = userId + ':' + Math.floor(Date.now() / 60000);
  // INCR is atomic — no race condition
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60); // set TTL on first increment
  return count <= 100;
}`,
        },
      ],
    },

    {
      id: 'sys-s2',
      name: 'CAP theorem',
      concept_card: {
        title: 'CAP Theorem',
        bullets: [
          'CAP: Consistency, Availability, Partition tolerance',
          'A distributed system can guarantee at most 2 of 3',
          'Partition tolerance is not optional in real networks — partitions happen',
          'CP systems: consistent under partitions, may reject requests (e.g., ZooKeeper)',
          'AP systems: always available under partitions, may return stale data (e.g., Cassandra)',
          'PACELC extends CAP: during normal operation, tradeoff is latency vs consistency',
        ],
        example_code:
`// CP System behaviour during partition:
// - Node A cannot reach Node B
// - Node A refuses writes (returns error)
// - Ensures no two nodes have conflicting data

// AP System behaviour during partition:
// - Node A cannot reach Node B
// - Node A accepts writes and returns stale reads
// - Reconciles ("heals") data when partition resolves`,
      },
      exercises: [
        {
          type: 3,
          question: 'A bank\'s account balance service must never show incorrect balances. Which CAP trade-off should it prioritise?',
          options: ['AP (Availability + Partition)', 'CP (Consistency + Partition)', 'CA (no partitions allowed)', 'None — all three are achievable'],
          answer: 'CP (Consistency + Partition)',
          explanation: 'Financial systems require consistency — it is acceptable to reject requests during a partition rather than show wrong balances.',
        },
        {
          type: 2,
          prompt: 'Cassandra is an [ __ ] system; ZooKeeper is a [ __ ] system:',
          snippet: `// During a network partition:
// Cassandra: accepts reads/writes (may return stale) → [ __ ]
// ZooKeeper: rejects requests if quorum lost → [ __ ]`,
          blanks: ['AP', 'CP'],
        },
        {
          type: 4,
          prompt: 'Order the steps a CP system takes when it detects a network partition:',
          lines: [
            'Network partition is detected between nodes',
            'Leader node checks if it still has quorum',
            'Without quorum, stop accepting writes',
            'Return error to client rather than risk inconsistency',
            'Partition heals — node catches up from leader',
          ],
        },
      ],
    },

    {
      id: 'sys-s3',
      name: 'Caching strategies',
      concept_card: {
        title: 'Caching Strategies',
        bullets: [
          'Cache-aside (Lazy): app checks cache first, loads from DB on miss, updates cache',
          'Write-through: write to cache AND DB simultaneously — strong consistency',
          'Write-back (Write-behind): write to cache first, async flush to DB — fast but risky',
          'Read-through: cache handles all reads — miss triggers automatic DB load',
          'Cache eviction: LRU (Least Recently Used), LFU, TTL-based',
          'Thundering herd: many requests miss cache simultaneously — use mutex/lock',
        ],
        example_code:
`// Cache-aside pattern
async function getUser(id) {
  const cacheKey = 'user:' + id;
  let user = await cache.get(cacheKey);
  if (!user) {
    user = await db.findUser(id);
    await cache.set(cacheKey, user, { ttl: 300 }); // cache for 5 min
  }
  return user;
}

// Invalidate on update
async function updateUser(id, data) {
  await db.updateUser(id, data);
  await cache.delete('user:' + id); // invalidate
}`,
      },
      exercises: [
        {
          type: 3,
          question: 'Which caching strategy risks data loss if the cache crashes before flushing to the database?',
          options: ['Cache-aside', 'Write-through', 'Write-back', 'Read-through'],
          answer: 'Write-back',
          explanation: 'Write-back delays the DB write — if the cache dies before flushing, the update is permanently lost.',
        },
        {
          type: 2,
          prompt: 'Cache-aside strategy: on a cache [ __ ], read from DB and then [ __ ] the cache:',
          snippet: `// Cache-aside steps:
// 1. Read from cache
// 2. On cache [ __ ]: read from DB
// 3. [ __ ] result into cache for next request`,
          blanks: ['miss', 'populate'],
        },
        {
          type: 5,
          prompt: 'After a cache flush, the DB is overwhelmed by simultaneous requests. Debug:',
          snippet: `async function getProduct(id) {
  let product = await redis.get('product:' + id);
  if (!product) {
    // All 10,000 concurrent requests hit here simultaneously
    product = await db.findProduct(id);
    await redis.set('product:' + id, product, 'EX', 300);
  }
  return product;
}`,
          expected: 'Only one DB request fires on cache miss; others wait for the result',
          fix_pattern: 'mutex',
          model_solution:
`const mutexes = new Map();

async function getProduct(id) {
  const cacheKey = 'product:' + id;
  let product = await redis.get(cacheKey);
  if (product) return product;

  // Only allow one DB call per key at a time
  if (!mutexes.has(cacheKey)) {
    mutexes.set(cacheKey, (async () => {
      const p = await db.findProduct(id);
      await redis.set(cacheKey, p, 'EX', 300);
      mutexes.delete(cacheKey);
      return p;
    })());
  }
  return mutexes.get(cacheKey);
}`,
        },
      ],
    },

    {
      id: 'sys-s4',
      name: 'Message queues',
      concept_card: {
        title: 'Message Queues',
        bullets: [
          'Decouple producers from consumers — async communication',
          'At-most-once delivery: message may be lost, never duplicated',
          'At-least-once delivery: may be delivered multiple times — idempotent consumer needed',
          'Exactly-once delivery: hard to achieve, requires distributed transactions',
          'Dead Letter Queue (DLQ): holds messages that fail repeatedly',
          'Kafka: log-based, retains messages, high throughput; RabbitMQ: broker model, routing',
        ],
        example_code:
`// Producer
await queue.send({ topic: 'order.created', payload: { orderId: 123 } });

// Consumer (idempotent)
queue.subscribe('order.created', async (msg) => {
  const { orderId } = msg.payload;
  // Idempotency check — in case message is delivered twice
  if (await db.orderAlreadyProcessed(orderId)) return;
  await processOrder(orderId);
  await db.markProcessed(orderId);
});`,
      },
      exercises: [
        {
          type: 3,
          question: 'A payment processor must not charge a customer twice even if a message is delivered twice. What property must the consumer implement?',
          options: ['Exactly-once delivery', 'Idempotency', 'Dead letter queue', 'At-most-once delivery'],
          answer: 'Idempotency',
          explanation: 'With at-least-once delivery (common default), duplicate messages can arrive. Idempotent consumers safely ignore already-processed messages.',
        },
        {
          type: 2,
          prompt: 'Messages that exceed the max retry count are sent to a [ __ ] Queue for manual inspection:',
          snippet: `// RabbitMQ DLQ config
channel.assertQueue('payments', {
  arguments: {
    'x-dead-letter-exchange': '[ __ ]-exchange',
    'x-message-ttl': 60000,
  }
});`,
          blanks: ['dead-letter'],
        },
        {
          type: 5,
          prompt: 'Consumers are processing orders out-of-order. Debug:',
          snippet: `// 3 consumer instances on 'orders' topic
// Messages: order_1, order_2, order_3 published in order
// But consumers process: order_3, order_1, order_2

const consumer = kafka.consumer({ groupId: 'order-group' });
await consumer.subscribe({ topic: 'orders' });
await consumer.run({
  eachMessage: async ({ message }) => processOrder(message.value),
});`,
          expected: 'Messages processed in order per partition',
          fix_pattern: 'partition',
          model_solution:
`// Kafka guarantees order only within a partition.
// To maintain order for a specific entity (e.g., customer), use a partition key:

// Producer side — route same customer to same partition:
await producer.send({
  topic: 'orders',
  messages: [{ key: String(order.customerId), value: JSON.stringify(order) }]
});
// All messages with the same key go to the same partition → ordered.`,
        },
      ],
    },

    {
      id: 'sys-s5',
      name: 'Load balancing',
      concept_card: {
        title: 'Load Balancing',
        bullets: [
          'Distributes traffic across multiple servers for scale and resilience',
          'Round Robin: rotate through servers equally',
          'Weighted Round Robin: send more traffic to more powerful servers',
          'Least Connections: send to server with fewest active connections',
          'IP Hash: same client IP always hits the same server (session affinity)',
          'Health checks: remove unhealthy servers from the pool automatically',
        ],
        example_code:
`# Nginx upstream block — round robin by default
upstream app_servers {
  server app1:3000;
  server app2:3000;
  server app3:3000;
}

# Least connections
upstream app_servers {
  least_conn;
  server app1:3000;
  server app2:3000;
}

# IP hash (session affinity)
upstream app_servers {
  ip_hash;
  server app1:3000;
  server app2:3000;
}`,
      },
      exercises: [
        {
          type: 3,
          question: 'A stateful application stores user sessions in server memory. Which load balancing algorithm maintains session affinity?',
          options: ['Round Robin', 'Least Connections', 'IP Hash', 'Weighted Round Robin'],
          answer: 'IP Hash',
          explanation: 'IP Hash routes the same client IP to the same server every time, preserving in-memory session state.',
        },
        {
          type: 2,
          prompt: 'Least Connections routes each new request to the server with the fewest [ __ ] connections:',
          snippet: `# Nginx config for Least Connections:
upstream backend {
  least_conn;
  # Routes new requests to the server with fewest [ __ ]
  server s1:8080;
  server s2:8080;
}`,
          blanks: ['active'],
        },
        {
          type: 5,
          prompt: 'Sessions are lost when users are routed to different servers on page reload. Debug:',
          snippet: `# Current nginx config:
upstream app {
  round_robin;          # default
  server app1:3000;
  server app2:3000;
}
# Sessions stored in-process memory on each server`,
          expected: 'Users always hit the same server, preserving their session',
          fix_pattern: 'ip_hash',
          model_solution:
`# Option 1: IP Hash (session affinity)
upstream app {
  ip_hash;
  server app1:3000;
  server app2:3000;
}

# Option 2 (better): externalise sessions to Redis — then any server can serve
# This removes the affinity requirement entirely.`,
        },
      ],
    },

    {
      id: 'sys-s6',
      name: 'Circuit breakers',
      concept_card: {
        title: 'Circuit Breaker Pattern',
        bullets: [
          'Prevents cascading failures by stopping calls to a failing service',
          'States: Closed (normal), Open (failing), Half-Open (testing recovery)',
          'Closed → Open: after threshold failures in a time window',
          'Open → Half-Open: after cooldown period, allows one probe request',
          'Half-Open → Closed: if probe succeeds; stays Open if probe fails',
          'Returns fallback response while Open — fast failure, no queuing',
        ],
        example_code:
`// Circuit Breaker with opossum (Node.js)
const CircuitBreaker = require('opossum');

const breaker = new CircuitBreaker(callPaymentService, {
  timeout: 3000,         // fail if call takes > 3s
  errorThresholdPct: 50, // open if 50%+ requests fail
  resetTimeout: 10000,   // try again after 10s
});

breaker.fallback(() => ({ error: 'Payment service unavailable', retry: true }));

const result = await breaker.fire(paymentData);`,
      },
      exercises: [
        {
          type: 3,
          question: 'What happens in the OPEN state of a circuit breaker?',
          options: [
            'All requests are forwarded normally',
            'Requests are immediately rejected without calling the service',
            'Only half the requests go through',
            'The service is permanently blocked',
          ],
          answer: 'Requests are immediately rejected without calling the service',
          explanation: 'In OPEN state, the breaker fast-fails all requests and returns a fallback — preventing further load on the failing service.',
        },
        {
          type: 4,
          prompt: 'Order the circuit breaker state transitions:',
          lines: [
            'Circuit starts in CLOSED state — requests pass normally',
            'Error rate exceeds threshold — circuit opens',
            'OPEN state — all requests fail-fast with fallback',
            'Cooldown expires — circuit enters HALF-OPEN',
            'Probe request succeeds — circuit returns to CLOSED',
          ],
        },
        {
          type: 2,
          prompt: 'Circuit breaker transitions CLOSED → OPEN when the error rate exceeds the configured [ __ ]:',
          snippet: `new CircuitBreaker(fn, {
  errorThresholdPct: 50,  // open if [ __ ]% of calls fail
  resetTimeout: 10000,    // stay open for [ __ ] ms before trying
})`,
          blanks: ['50', '10000'],
        },
        {
          type: 5,
          prompt: 'Service calls hang indefinitely instead of failing fast. Debug:',
          snippet: `async function callInventory(productId) {
  // No circuit breaker, no timeout
  const res = await fetch('http://inventory-service/stock/' + productId);
  return res.json();
}
// Under load, inventory-service becomes slow → all threads blocked`,
          expected: 'Fast failure after timeout; fallback response returned',
          fix_pattern: 'CircuitBreaker',
          model_solution:
`const CircuitBreaker = require('opossum');

const options = { timeout: 2000, errorThresholdPct: 50, resetTimeout: 15000 };
const breaker = new CircuitBreaker(
  (productId) => fetch('http://inventory-service/stock/' + productId).then(r => r.json()),
  options
);
breaker.fallback(() => ({ stock: -1, message: 'Inventory unavailable' }));

async function callInventory(productId) {
  return breaker.fire(productId);
}`,
        },
      ],
    },

  ], // end sysdesign

}; // end SECTION_LIBRARY

window.SECTION_LIBRARY = SECTION_LIBRARY;
