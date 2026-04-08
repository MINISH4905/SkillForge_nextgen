import json
import re
import math
from datetime import date, timedelta
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User

from .models import (
    LearnerProfile, DomainCompetency,
    Task, GameSession, CodeSubmission,
    RemediationPlan, RemediationDay,
)
from .serializers import (
    LearnerProfileSerializer, DomainCompetencySerializer,
    GameSessionSerializer, TaskSerializer,
    RemediationPlanSerializer, RemediationPlanFullSerializer,
    RemediationDaySerializer,
)

# ═══════════════════════════════════════════════════════════════════════════════
# SHARED HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def normalise_code(code):
    if not code:
        return ''
    code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
    code = re.sub(r'--.*$', '', code, flags=re.MULTILINE)
    code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    code = re.sub(r'\s+', ' ', code)
    return code.lower().strip()


def get_user_profile(request):
    if request.user.is_authenticated:
        user = request.user
    else:
        learner_id = request.headers.get('X-Learner-ID', 'default_user')
        user, _ = User.objects.get_or_create(username=learner_id)
    
    profile, created = LearnerProfile.objects.get_or_create(user=user)
    if created or not profile.competencies.exists():
        for domain in ['web', 'dsa', 'database', 'aiml', 'sysdesign']:
            DomainCompetency.objects.get_or_create(
                learner=profile, domain=domain,
                defaults={'tier': 1, 'xp': 0, 'competency_score': 0}
            )
    return profile


# ═══════════════════════════════════════════════════════════════════════════════
# PROFILE & DOMAIN VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
def get_profile(request):
    profile = get_user_profile(request)
    serializer = LearnerProfileSerializer(profile)
    return Response(serializer.data)


@api_view(['GET'])
def get_domains(request):
    profile = get_user_profile(request)
    domains = DomainCompetency.objects.filter(learner=profile)
    serializer = DomainCompetencySerializer(domains, many=True)
    return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════════════════════
# QUEST / TASK VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
def get_next_quest(request):
    profile = get_user_profile(request)
    domains = DomainCompetency.objects.filter(learner=profile).order_by('competency_score')
    completed_ids = GameSession.objects.filter(
        learner=profile, status='completed'
    ).values_list('task_id', flat=True)

    for domain_comp in domains:
        tasks = Task.objects.filter(
            domain=domain_comp.domain, tier=domain_comp.tier
        ).exclude(id__in=completed_ids)
        if tasks.exists():
            t = tasks.first()
            return Response({'id': t.id, 'domain': t.domain, 'tier': t.tier, 'title': t.title})

    task = Task.objects.exclude(id__in=completed_ids).first() or Task.objects.first()
    if task:
        return Response({'id': task.id, 'domain': task.domain, 'tier': task.tier, 'title': task.title})
    return Response({'error': 'No tasks available'}, status=404)


@api_view(['GET'])
def get_task(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
        return Response(TaskSerializer(task).data)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=404)


@api_view(['POST'])
def start_quest(request, task_id):
    profile = get_user_profile(request)
    if profile.lives <= 0:
        return Response({'error': 'No lives left'}, status=400)
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=404)

    profile.lives -= 1
    profile.save()
    session = GameSession.objects.create(learner=profile, task=task)
    return Response(GameSessionSerializer(session).data)


@api_view(['POST'])
def evaluate_quest(request, session_id):
    profile = get_user_profile(request)
    try:
        session = GameSession.objects.get(id=session_id, learner=profile)
    except GameSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)

    if session.status == 'completed':
        return Response({'error': 'Session already completed'}, status=400)

    code = request.data.get('code', '')
    task = session.task

    bugs = list(task.bugs.values_list('text', flat=True))
    total_bugs = len(bugs)
    bugs_fixed = 0
    normalised = normalise_code(code)

    if total_bugs > 0:
        for bug in bugs:
            if normalise_code(bug) in normalised:
                bugs_fixed += 1

    semantic_score  = int(20 * bugs_fixed / total_bugs) if total_bugs else 20
    given_lines     = len(task.given_code.split('\n'))
    sub_lines       = len(code.split('\n'))
    quality_score   = 5 if sub_lines > given_lines * 1.5 else 15
    functional_score = 50 if bugs_fixed == total_bugs else (bugs_fixed * 10)
    efficiency = 10
    partial    = 5
    total_score = min(100, functional_score + semantic_score + quality_score + efficiency + partial)

    CodeSubmission.objects.create(
        session=session, code=code,
        score_total=total_score,
        score_breakdown={
            'functional': functional_score, 'semantic': semantic_score,
            'quality': quality_score, 'efficiency': efficiency, 'partial': partial,
        },
        bugs_fixed=bugs_fixed,
    )

    xp_earned = 0
    if total_score >= 60:
        session.status = 'completed'
        session.completed_at = timezone.now()
        session.score = total_score
        session.save()

        xp_earned = total_score * task.tier
        profile.xp_total += xp_earned

        # Update domain competency score (rolling average of last 5 submissions)
        _update_competency(profile, task.domain, total_score)
        profile.save()

    return Response({
        'status': 'success',
        'total_score': total_score,
        'xp_earned': xp_earned,
        'bugs_fixed': bugs_fixed,
        'bugs_total': total_bugs,
        'functional': functional_score,
        'semantic': semantic_score,
        'quality': quality_score,
        'efficiency': efficiency,
        'partial': partial,
    })


def _update_competency(profile, domain, new_score):
    """Rolling average of the last 5 quest scores for a domain."""
    comp, _ = DomainCompetency.objects.get_or_create(
        learner=profile, domain=domain,
        defaults={'tier': 1, 'xp': 0, 'competency_score': 0}
    )
    recent_sessions = (
        GameSession.objects
        .filter(learner=profile, task__domain=domain, status='completed')
        .order_by('-completed_at')[:5]
    )
    scores = [s.score for s in recent_sessions if s.score is not None]
    if scores:
        comp.competency_score = round(sum(scores) / len(scores))
    comp.xp += new_score
    comp.save()


# ═══════════════════════════════════════════════════════════════════════════════
# REMEDIATION — PLAN DATA
# ═══════════════════════════════════════════════════════════════════════════════

# Topic-to-resource map (mirrors plan_generator.js TOPIC_RESOURCES)
TOPIC_RESOURCES = {
    'web-s1': [
        {'title': 'CSS Flexbox — MDN', 'url': 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox', 'type': 'docs'},
        {'title': 'Flexbox Froggy (interactive)', 'url': 'https://flexboxfroggy.com/', 'type': 'interactive'},
        {'title': 'A Complete Guide to Flexbox — CSS-Tricks', 'url': 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', 'type': 'article'},
    ],
    'web-s2': [
        {'title': 'CSS Specificity — MDN', 'url': 'https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity', 'type': 'docs'},
        {'title': 'CSS Specificity Calculator', 'url': 'https://specificity.keegan.st/', 'type': 'interactive'},
    ],
    'web-s3': [
        {'title': 'Event Delegation — JavaScript.info', 'url': 'https://javascript.info/event-delegation', 'type': 'article'},
    ],
    'web-s4': [
        {'title': 'Async/Await — MDN', 'url': 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises', 'type': 'docs'},
        {'title': 'Async/Await — javascript.info', 'url': 'https://javascript.info/async-await', 'type': 'article'},
    ],
    'web-s5': [{'title': 'How Virtual DOM Works', 'url': 'https://www.geeksforgeeks.org/reactjs/reactjs-virtual-dom/', 'type': 'article'}],
    'web-s6': [{'title': 'CSS Values & Units — MDN', 'url': 'https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units', 'type': 'docs'}],
    'dsa-s1': [
        {'title': 'Loop Invariants — GFG', 'url': 'https://www.geeksforgeeks.org/dsa/loop-invariant-condition-examples/', 'type': 'article'},
        {'title': 'Binary Search & Invariants', 'url': 'https://www.khanacademy.org/computing/computer-science/algorithms/binary-search/a/binary-search', 'type': 'article'},
    ],
    'dsa-s2': [{'title': 'Pointer Arithmetic — GFG', 'url': 'https://www.geeksforgeeks.org/dsa/pointer-arithmetics-in-c-with-examples/', 'type': 'article'}],
    'dsa-s3': [{'title': 'Introduction to Recursion — GFG', 'url': 'https://www.geeksforgeeks.org/dsa/introduction-to-recursion-2/', 'type': 'article'}],
    'dsa-s4': [{'title': 'Off-by-one Errors Explained', 'url': 'https://www.geeksforgeeks.org/dsa/off-by-one-error/', 'type': 'article'}],
    'dsa-s5': [
        {'title': 'Stable vs Unstable Sorting — GFG', 'url': 'https://www.geeksforgeeks.org/dsa/stability-in-sorting-algorithms/', 'type': 'article'},
        {'title': 'Sorting Algorithms Visualised', 'url': 'https://visualgo.net/en/sorting', 'type': 'interactive'},
    ],
    'dsa-s6': [{'title': 'Hash Collisions & Chaining', 'url': 'https://www.geeksforgeeks.org/dsa/separate-chaining-collision-handling-technique-in-hashing/', 'type': 'article'}],
    'db-s1':  [{'title': 'WHERE vs HAVING — Mode', 'url': 'https://mode.com/sql-tutorial/sql-having/', 'type': 'article'}],
    'db-s2':  [
        {'title': 'SQL JOINs Explained Visually', 'url': 'https://www.geeksforgeeks.org/sql/sql-join-types/', 'type': 'article'},
        {'title': 'Interactive SQL JOIN Practice', 'url': 'https://sqlzoo.net/wiki/The_JOIN_operation', 'type': 'interactive'},
    ],
    'db-s3':  [{'title': 'NULL in SQL — GFG', 'url': 'https://www.geeksforgeeks.org/sql/sql-null-values/', 'type': 'article'}],
    'db-s4':  [
        {'title': 'Indexing in Databases', 'url': 'https://www.geeksforgeeks.org/indexing-in-databases-sql/', 'type': 'article'},
        {'title': 'Use The Index, Luke!', 'url': 'https://use-the-index-luke.com/sql/preface', 'type': 'article'},
    ],
    'db-s5':  [{'title': 'CTEs vs Subqueries — GFG', 'url': 'https://www.geeksforgeeks.org/sql/sql-with-clause/', 'type': 'article'}],
    'db-s6':  [{'title': 'Transaction Isolation Levels', 'url': 'https://www.geeksforgeeks.org/dbms/transaction-isolation-levels-dbms/', 'type': 'article'}],
    'aiml-s1': [{'title': 'Overfitting & Underfitting — GFG', 'url': 'https://www.geeksforgeeks.org/machine-learning/underfitting-and-overfitting-in-machine-learning/', 'type': 'article'}],
    'aiml-s2': [{'title': 'Regularisation Techniques', 'url': 'https://www.geeksforgeeks.org/machine-learning/regularization-in-machine-learning/', 'type': 'article'}],
    'aiml-s3': [{'title': 'Loss Functions for ML', 'url': 'https://www.geeksforgeeks.org/machine-learning/loss-functions-in-deep-learning/', 'type': 'article'}],
    'aiml-s4': [{'title': 'Batch Normalisation — GFG', 'url': 'https://www.geeksforgeeks.org/machine-learning/batch-normalization-ml/', 'type': 'article'}],
    'aiml-s5': [
        {'title': 'Activation Functions Guide', 'url': 'https://www.geeksforgeeks.org/machine-learning/activation-functions-neural-networks/', 'type': 'article'},
        {'title': 'TF Playground', 'url': 'https://playground.tensorflow.org/', 'type': 'interactive'},
    ],
    'aiml-s6': [{'title': 'Data Leakage in ML', 'url': 'https://www.geeksforgeeks.org/machine-learning/data-leakage-in-machine-learning/', 'type': 'article'}],
    'sys-s1':  [{'title': 'Rate Limiting Patterns — GFG', 'url': 'https://www.geeksforgeeks.org/system-design/what-is-api-rate-limiting/', 'type': 'article'}],
    'sys-s2':  [{'title': 'CAP Theorem Explained', 'url': 'https://www.geeksforgeeks.org/system-design/cap-theorem-in-dbms/', 'type': 'article'}],
    'sys-s3':  [{'title': 'Caching Strategies — GFG', 'url': 'https://www.geeksforgeeks.org/system-design/caching-strategies-system-design/', 'type': 'article'}],
    'sys-s4':  [{'title': 'Message Queues — GFG', 'url': 'https://www.geeksforgeeks.org/system-design/what-is-message-queue-and-where-do-we-use-it/', 'type': 'article'}],
    'sys-s5':  [{'title': 'Load Balancing Algorithms', 'url': 'https://www.geeksforgeeks.org/system-design/load-balancer-system-design/', 'type': 'article'}],
    'sys-s6':  [{'title': 'Circuit Breaker Pattern', 'url': 'https://www.geeksforgeeks.org/system-design/circuit-breaker-pattern-in-microservices/', 'type': 'article'}],
}

# Section definitions — mirrors section_library.js (subset for server-side plan gen)
SECTION_LIBRARY = {
    'web':      [('web-s1','Flexbox flow'),('web-s2','CSS specificity'),('web-s3','Event delegation'),('web-s4','Async/await errors'),('web-s5','DOM diffing'),('web-s6','Responsive units')],
    'dsa':      [('dsa-s1','Loop invariants'),('dsa-s2','Pointer arithmetic'),('dsa-s3','Recursion base cases'),('dsa-s4','Off-by-one errors'),('dsa-s5','Sorting stability'),('dsa-s6','Hash collisions')],
    'database': [('db-s1','WHERE vs HAVING'),('db-s2','JOIN types'),('db-s3','NULL behaviour'),('db-s4','Index usage'),('db-s5','Subquery vs CTE'),('db-s6','Transaction isolation')],
    'aiml':     [('aiml-s1','Overfitting signals'),('aiml-s2','Regularisation methods'),('aiml-s3','Loss functions'),('aiml-s4','Batch normalisation'),('aiml-s5','Activation functions'),('aiml-s6','Data leakage')],
    'sysdesign':[('sys-s1','Rate limiting patterns'),('sys-s2','CAP theorem'),('sys-s3','Caching strategies'),('sys-s4','Message queues'),('sys-s5','Load balancing'),('sys-s6','Circuit breakers')],
}

PHASE_CONFIG = [
    {'phase': 1, 'name': 'Foundation',   'days': (1,  7),  'xp_base': 100, 'ex_count': 2},
    {'phase': 2, 'name': 'Application',  'days': (8,  16), 'xp_base': 125, 'ex_count': 3},
    {'phase': 3, 'name': 'Stress Test',  'days': (17, 24), 'xp_base': 150, 'ex_count': 3},
    {'phase': 4, 'name': 'Mastery',      'days': (25, 30), 'xp_base': 200, 'ex_count': 2},
]
CHECKPOINT_DAYS = {7, 14, 21, 28}


def _phase_for_day(day_num):
    for p in PHASE_CONFIG:
        if p['days'][0] <= day_num <= p['days'][1]:
            return p
    return PHASE_CONFIG[-1]


def _detect_weak_sections(profile, domain):
    """
    Score each section by averaging recent quest results on tasks tagged
    with that section_id. Sections never attempted score -1 (weakest).
    Returns ordered list of (section_id, section_name, avg_score).
    """
    sections = SECTION_LIBRARY.get(domain, [])
    section_scores = {}
    for sid, sname in sections:
        section_scores[sid] = {'name': sname, 'total': 0, 'count': 0}

    # Pull recent completed sessions for domain tasks with section_id set
    sessions = (
        GameSession.objects
        .filter(learner=profile, task__domain=domain, status='completed', score__isnull=False)
        .select_related('task')
        .order_by('-completed_at')[:30]
    )
    for sess in sessions:
        sid = sess.task.section_id
        if sid and sid in section_scores:
            section_scores[sid]['total'] += sess.score
            section_scores[sid]['count'] += 1

    ordered = sorted(
        [(sid, data['name'], data['total'] / data['count'] if data['count'] else -1)
         for sid, data in section_scores.items()],
        key=lambda x: x[2]
    )
    return ordered  # weakest first


def _build_checkpoint_exercises(covered_section_ids, sections_map):
    """One MCQ per covered section as a review checkpoint quiz."""
    exercises = []
    for sid in covered_section_ids[:4]:
        sname = sections_map.get(sid, sid)
        exercises.append({
            'type': 3,
            'label': 'Multiple Choice',
            'question': f'Which statement best describes {sname}?',
            'options': [
                f'{sname} has no practical use cases.',
                f'{sname} follows a specific pattern or rule.',
                f'{sname} only applies in advanced scenarios.',
                f'{sname} can be replaced by any other technique.',
            ],
            'answer': f'{sname} follows a specific pattern or rule.',
            '_source': 'checkpoint',
        })
    return exercises


def _build_plan_days(profile, domain, ordered_sections):
    """
    Create 30 RemediationDay objects for the plan.
    ordered_sections: [(sid, sname, avg_score), ...] weakest first.
    """
    days = []
    sections_map = {sid: sname for sid, sname, _ in ordered_sections}
    phase_covered = {}  # phase_num -> [sid, ...]

    for day_num in range(1, 31):
        phase = _phase_for_day(day_num)
        p_num = phase['phase']
        if p_num not in phase_covered:
            phase_covered[p_num] = []

        if day_num in CHECKPOINT_DAYS:
            # Checkpoint reviews all sections seen so far in this phase
            covered = phase_covered.get(p_num, [])
            exercises = _build_checkpoint_exercises(covered, sections_map)
            days.append({
                'day_number': day_num,
                'phase': p_num,
                'phase_name': phase['name'],
                'is_checkpoint': True,
                'label': f'🏁 Phase {p_num} Checkpoint',
                'topic': f"Review: {', '.join(sections_map.get(s,'') for s in covered[:3])}",
                'section_id': '',
                'objective': f'Consolidate everything from the {phase["name"]} phase. Score 70%+ to unlock the next phase.',
                'concept_card': None,
                'exercises': exercises,
                'resources': [],
                'xp_base': phase['xp_base'] + 50,
                'time_estimate_min': len(exercises) * 8,
            })
            continue

        # Normal day: pick section (rotate through ordered_sections)
        phase_offset = (p_num - 1) * 2
        rotated = ordered_sections[phase_offset:] + ordered_sections[:phase_offset]
        idx = (day_num - phase['days'][0]) % len(rotated)
        sid, sname, _ = rotated[idx]

        if sid not in phase_covered[p_num]:
            phase_covered[p_num].append(sid)

        # Build generic exercises (real exercises come from section_library.js on client)
        # Server stores typed stubs; the client merges with its richer library data.
        exercises = _build_day_exercises(phase, sname, sid)
        resources = TOPIC_RESOURCES.get(sid, [])

        objectives = {
            1: f'Understand the core concept of {sname} and recognise it in code.',
            2: f'Apply {sname} patterns in realistic code scenarios.',
            3: f'Handle edge cases and debug complex {sname} code.',
            4: f'Demonstrate mastery of {sname} in multi-step challenges.',
        }

        days.append({
            'day_number': day_num,
            'phase': p_num,
            'phase_name': phase['name'],
            'is_checkpoint': False,
            'label': f'Day {day_num} — {sname}',
            'topic': sname,
            'section_id': sid,
            'objective': objectives[p_num],
            'concept_card': None,   # client fills from section_library.js
            'exercises': exercises,
            'resources': resources,
            'xp_base': phase['xp_base'],
            'time_estimate_min': phase['ex_count'] * 8,
        })

    return days


def _build_day_exercises(phase, section_name, section_id):
    """Build exercise stubs appropriate to the phase."""
    p = phase['phase']
    type_map = {1: [6, 3], 2: [2, 1, 3], 3: [5, 4, 1], 4: [5, 2]}
    types = type_map.get(p, [3])
    ex_count = phase['ex_count']
    label_map = {1: 'Bug Fix', 2: 'Fill in the Blank', 3: 'Multiple Choice',
                 4: 'Reorder', 5: 'Debug Challenge', 6: 'Concept Card Q'}
    exercises = []
    for i in range(ex_count):
        ex_type = types[i % len(types)]
        exercises.append({
            'type': ex_type,
            'label': label_map.get(ex_type, 'Exercise'),
            'section_id': section_id,
            'prompt': f'Exercise {i+1} for {section_name}',
            '_source': 'server_stub',
            # Client will replace this stub with rich content from section_library.js
        })
    return exercises


# ═══════════════════════════════════════════════════════════════════════════════
# REMEDIATION — API VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
def get_remediation_plan(request):
    """
    Returns the learner's active remediation plan (overview with brief day list).
    Generates a new plan if none exists.
    """
    profile = get_user_profile(request)
    plan = RemediationPlan.objects.filter(learner=profile, is_active=True).first()

    if not plan:
        plan = _create_remediation_plan(profile)

    return Response(RemediationPlanSerializer(plan).data)


@api_view(['GET'])
def get_remediation_day(request, day_number):
    """
    Returns full detail for a single day including exercises and resources.
    """
    profile = get_user_profile(request)
    plan = RemediationPlan.objects.filter(learner=profile, is_active=True).first()
    if not plan:
        return Response({'error': 'No active plan'}, status=404)

    try:
        day = RemediationDay.objects.get(plan=plan, day_number=day_number)
    except RemediationDay.DoesNotExist:
        return Response({'error': 'Day not found'}, status=404)

    # Gate: can't access future days beyond current_day
    if day_number > plan.current_day and not day.is_completed:
        return Response({'error': 'Day not yet unlocked', 'current_day': plan.current_day}, status=403)

    return Response(RemediationDaySerializer(day).data)


@api_view(['POST'])
def complete_remediation_day(request, day_number):
    """
    Mark a day complete.
    Body: { "score": 85, "exercise_scores": [100, 80, 75] }

    Updates:
    - RemediationDay: is_completed, score, xp_earned
    - RemediationPlan: current_day, overall_competency, skill_snapshots
    - If checkpoint passed (score >= 70): unlocks next phase
    - DomainCompetency: competency_score updated for the domain
    """
    profile = get_user_profile(request)
    plan = RemediationPlan.objects.filter(learner=profile, is_active=True).first()
    if not plan:
        return Response({'error': 'No active plan'}, status=404)

    try:
        day = RemediationDay.objects.get(plan=plan, day_number=day_number)
    except RemediationDay.DoesNotExist:
        return Response({'error': 'Day not found'}, status=404)

    if day_number > plan.current_day:
        return Response({'error': 'Day not yet unlocked'}, status=403)

    exercise_scores = request.data.get('exercise_scores', [])
    if exercise_scores:
        avg_score = round(sum(exercise_scores) / len(exercise_scores))
    else:
        avg_score = request.data.get('score', 0)

    avg_score = max(0, min(100, int(avg_score)))

    # XP calculation
    xp_multiplier = 1.5 if avg_score >= 85 else 1.0 if avg_score >= 70 else 0.5
    xp_earned = round(day.xp_base * xp_multiplier)

    # Update day
    day.is_completed = True
    day.score = avg_score
    day.exercises_done = len(exercise_scores) if exercise_scores else 1
    day.xp_earned = xp_earned
    day.save()

    # Update plan
    plan.skill_snapshots = plan.skill_snapshots or []
    plan.skill_snapshots.append({
        'day': day_number,
        'score': avg_score,
        'topic': day.topic,
        'xp': xp_earned,
    })

    # Recalculate overall competency from all completed days
    completed_days = RemediationDay.objects.filter(
        plan=plan, is_completed=True, score__isnull=False
    )
    scores = [d.score for d in completed_days if d.score is not None]
    if scores:
        plan.overall_competency = round(sum(scores) / len(scores))

    # Advance current_day
    if plan.current_day == day_number:
        plan.current_day = min(30, plan.current_day + 1)

    # Checkpoint logic: unlock next phase
    phase_unlocked = plan.phase_unlocked or [1]
    if day.is_checkpoint and avg_score >= 70:
        next_phase = day.phase + 1
        if next_phase <= 4 and next_phase not in phase_unlocked:
            phase_unlocked.append(next_phase)
        plan.current_phase = day.phase
    plan.phase_unlocked = phase_unlocked

    # Mastery check
    all_done = RemediationDay.objects.filter(plan=plan).count() == 30
    all_completed = RemediationDay.objects.filter(plan=plan, is_completed=True).count() == 30
    if all_completed and plan.overall_competency >= 70:
        plan.mastered = True

    plan.save()

    # Propagate improvement to DomainCompetency
    comp, _ = DomainCompetency.objects.get_or_create(
        learner=profile, domain=plan.domain,
        defaults={'tier': 1, 'xp': 0, 'competency_score': 0}
    )
    comp.competency_score = plan.overall_competency
    comp.xp += xp_earned
    comp.save()

    # Grant XP to learner profile
    profile.xp_total += xp_earned
    profile.save()

    return Response({
        'status': 'success',
        'day': day_number,
        'score': avg_score,
        'xp_earned': xp_earned,
        'current_day': plan.current_day,
        'current_phase': plan.current_phase,
        'phase_unlocked': plan.phase_unlocked,
        'overall_competency': plan.overall_competency,
        'mastered': plan.mastered,
        'checkpoint_passed': day.is_checkpoint and avg_score >= 70,
    })


@api_view(['GET'])
def get_remediation_progress(request):
    """
    Returns performance analytics for the active plan:
    - overall_competency
    - skill_snapshots (for trend chart)
    - per-topic breakdown
    - skill delta (baseline vs current)
    - phase status
    """
    profile = get_user_profile(request)
    plan = RemediationPlan.objects.filter(learner=profile, is_active=True).first()
    if not plan:
        return Response({'error': 'No active plan'}, status=404)

    completed_days = RemediationDay.objects.filter(plan=plan, is_completed=True)

    # Per-topic breakdown
    topic_map = {}
    for d in RemediationDay.objects.filter(plan=plan):
        if d.is_checkpoint or not d.topic:
            continue
        if d.topic not in topic_map:
            topic_map[d.topic] = {'days': 0, 'scores': []}
        topic_map[d.topic]['days'] += 1
        if d.is_completed and d.score is not None:
            topic_map[d.topic]['scores'].append(d.score)

    topic_breakdown = []
    for topic, data in topic_map.items():
        avg = round(sum(data['scores']) / len(data['scores'])) if data['scores'] else None
        topic_breakdown.append({
            'topic': topic,
            'days_total': data['days'],
            'days_attempted': len(data['scores']),
            'avg_score': avg,
            'status': (
                'excellent' if avg and avg >= 85 else
                'good'      if avg and avg >= 70 else
                'partial'   if avg and avg >= 50 else
                'struggling' if avg is not None else
                'pending'
            ),
        })
    topic_breakdown.sort(key=lambda x: (x['avg_score'] or -1))

    # Phase status
    phase_status = []
    for pc in PHASE_CONFIG:
        p_num = pc['phase']
        p_days = RemediationDay.objects.filter(plan=plan, phase=p_num, is_checkpoint=False)
        p_completed = p_days.filter(is_completed=True).count()
        p_total = p_days.count()
        checkpoint_day = RemediationDay.objects.filter(plan=plan, phase=p_num, is_checkpoint=True).first()
        phase_status.append({
            'phase': p_num,
            'name': pc['name'],
            'days_done': p_completed,
            'days_total': p_total,
            'pct': round(p_completed / p_total * 100) if p_total else 0,
            'unlocked': p_num in (plan.phase_unlocked or [1]),
            'active': p_num == plan.current_phase,
            'checkpoint_passed': checkpoint_day.is_completed and checkpoint_day.score >= 70 if checkpoint_day else False,
        })

    return Response({
        'domain': plan.domain,
        'baseline_competency': plan.baseline_competency,
        'overall_competency': plan.overall_competency,
        'skill_delta': plan.overall_competency - plan.baseline_competency,
        'current_day': plan.current_day,
        'current_phase': plan.current_phase,
        'days_completed': completed_days.count(),
        'mastered': plan.mastered,
        'skill_snapshots': plan.skill_snapshots or [],
        'topic_breakdown': topic_breakdown,
        'phase_status': phase_status,
        'weak_areas': plan.weak_areas,
    })


@api_view(['POST'])
def reset_remediation_plan(request):
    """
    Deactivate the current plan and generate a fresh one.
    Useful when the learner wants to restart or switch domains.
    """
    profile = get_user_profile(request)
    RemediationPlan.objects.filter(learner=profile, is_active=True).update(is_active=False)
    plan = _create_remediation_plan(profile)
    return Response(RemediationPlanSerializer(plan).data)


# ── Internal plan creation ────────────────────────────────────────────────────

def _create_remediation_plan(profile):
    """Detect weakest domain, analyse weak sections, build 30-day plan in DB."""
    # Find weakest domain
    domains = DomainCompetency.objects.filter(learner=profile).order_by('competency_score')
    weakest_domain = domains.first().domain if domains.exists() else 'web'
    baseline = domains.first().competency_score if domains.exists() else 0

    # Detect weak sections within the domain
    ordered_sections = _detect_weak_sections(profile, weakest_domain)
    weak_area_names = [sname for _, sname, avg in ordered_sections[:3]]

    plan = RemediationPlan.objects.create(
        learner=profile,
        domain=weakest_domain,
        is_active=True,
        current_day=1,
        current_phase=1,
        phase_unlocked=[1],
        weak_areas=weak_area_names,
        baseline_competency=baseline,
        overall_competency=baseline,
        skill_snapshots=[],
    )

    # Build and persist all 30 days
    day_data_list = _build_plan_days(profile, weakest_domain, ordered_sections)
    RemediationDay.objects.bulk_create([
        RemediationDay(plan=plan, **day_data)
        for day_data in day_data_list
    ])

    return plan
