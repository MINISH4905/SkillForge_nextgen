import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from domains.models import Domain, Level
from progress.services import get_current_level, complete_level
from rewards.models import UserXP, Power, UserPower, UserHintUsage
from rewards.services import get_leaderboard_data, use_hint, use_power
import re

def normalize_code(code, domain_name):
    """
    Normalizes code by removing comments, extra whitespace, and unifying quotes.
    Special handling for SQL (case-insensitive).
    """
    if not code:
        return ""
    
    # Remove single-line comments // or # or --
    code = re.sub(r'(\/\/|#|--).*$', '', code, flags=re.MULTILINE)
    
    # Remove multi-line comments /* */
    code = re.sub(r'\/\*.*?\*\/', '', code, flags=re.DOTALL)
    
    # Case-insensitive for SQL
    if domain_name.upper() == 'SQL':
        code = code.upper()
    
    # Normalize whitespace: replace any whitespace sequence with a single space
    code = re.sub(r'\s+', ' ', code).strip()
    
    # Normalize quotes
    code = code.replace("'", '"')
    
    return code

def compare_code(submitted, solution, domain_name):
    """
    True if submitted code logic matches solution after normalization.
    """
    norm_submitted = normalize_code(submitted, domain_name)
    norm_solution = normalize_code(solution, domain_name)
    
    return norm_submitted == norm_solution

@login_required
def get_level(request):
    domain_name = request.GET.get('domain')
    if not domain_name:
        return JsonResponse({"error": "Missing domain parameter"}, status=400)
    
    try:
        domain = Domain.objects.get(name=domain_name)
        level_obj = get_current_level(request.user, domain)
        if not level_obj:
            return JsonResponse({"status": "completed", "message": "All levels completed for this domain!"})
        
        return JsonResponse({
            "status": "success",
            "domain": domain.name,
            "level_number": level_obj.level_number,
            "title": level_obj.title,
            "description": level_obj.description,
            "difficulty": level_obj.difficulty,
            "concept": level_obj.concept,
            "starter_code": level_obj.starter_code,
            "level_id": level_obj.id
        })
    except Domain.DoesNotExist:
        return JsonResponse({"error": "Invalid domain"}, status=404)

@csrf_exempt
@login_required
def complete_current_level(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            domain_name = data.get('domain')
            if not domain_name:
                return JsonResponse({"error": "Missing domain parameter"}, status=400)
            
            domain = Domain.objects.get(name=domain_name)
            success = complete_level(request.user, domain)
            
            if success:
                return JsonResponse({"status": "success", "message": "Level up!"})
            else:
                return JsonResponse({"status": "error", "message": "No more levels to complete or error updating progress."}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except Domain.DoesNotExist:
            return JsonResponse({"error": "Invalid domain"}, status=404)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@login_required
def get_hints(request):
    level_id = request.GET.get('level_id')
    if not level_id:
        return JsonResponse({"error": "Missing level_id"}, status=400)
    
    try:
        level = Level.objects.get(pk=level_id)
        usage, created = UserHintUsage.objects.get_or_create(user=request.user, level=level)
        
        unlocked_hints = level.hints.filter(order__lte=usage.hints_used)
        hints_data = [{"order": h.order, "content": h.content} for h in unlocked_hints]
        
        return JsonResponse({
            "status": "success",
            "hints_used": usage.hints_used,
            "total_hints": level.hints.count(),
            "unlocked_hints": hints_data,
            "next_hint_cost": 5 if usage.hints_used < level.hints.count() else None
        })
    except Level.DoesNotExist:
        return JsonResponse({"error": "Invalid level_id"}, status=404)

@csrf_exempt
@login_required
def unlock_hint(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    try:
        data = json.loads(request.body)
        level_id = data.get('level_id')
        if not level_id:
            return JsonResponse({"error": "Missing level_id"}, status=400)
            
        result = use_hint(request.user, level_id)
        return JsonResponse(result)
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@login_required
def apply_power(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    try:
        data = json.loads(request.body)
        power_id = data.get('power_id')
        domain_name = data.get('domain')
        
        if not power_id:
            return JsonResponse({"error": "Missing power_id"}, status=400)
            
        user_power = UserPower.objects.get(user=request.user, power_id=power_id)
        power_name = user_power.power.name
        
        if power_name == "Skip Level":
            if not domain_name:
                return JsonResponse({"error": "Missing domain for Skip Level"}, status=400)
            domain = Domain.objects.get(name=domain_name)
            
            # Use power
            use_power(request.user, power_id)
            
            # Complete level without XP
            complete_level(request.user, domain, award_xp=False)
            
            return JsonResponse({
                "status": "success",
                "message": f"Power '{power_name}' used! Level skipped.",
                "next_url": f"/dashboard/domain/{domain.id}/"
            })
            
        elif power_name == "Double XP":
            if not domain_name:
                return JsonResponse({"error": "Missing domain for Double XP"}, status=400)
            
            # Use power
            use_power(request.user, power_id)
            
            # Set flag in session
            request.session[f'double_xp_{domain_name}'] = True
            
            return JsonResponse({
                "status": "success",
                "message": f"Power '{power_name}' activated! Your next completion will reward 2x XP."
            })
            
        elif power_name == "Reveal Hint":
            # This power is consumed inside rewards.services.use_hint
            return JsonResponse({
                "status": "info",
                "message": "Reveal Hint power will be used automatically when you click 'Get Hint'."
            })
            
    except UserPower.DoesNotExist:
        return JsonResponse({"error": "You don't have this power"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@login_required
def evaluate_current_level(request):
    """
    Receives submitted_code, compares with solution_code, and completes level if valid.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    try:
        data = json.loads(request.body)
        domain_name = data.get('domain')
        submitted_code = data.get('submitted_code', '')
        
        if not domain_name:
            return JsonResponse({"error": "Missing domain parameter"}, status=400)
            
        domain = Domain.objects.get(name=domain_name)
        level_obj = get_current_level(request.user, domain)
        
        if not level_obj:
            return JsonResponse({"error": "No active level found for this domain."}, status=404)
            
        is_correct = compare_code(submitted_code, level_obj.solution_code, domain.name)
        
        if is_correct:
            # Check for Double XP multiplier
            multiplier = 1
            if request.session.get(f'double_xp_{domain_name}'):
                multiplier = 2
                del request.session[f'double_xp_{domain_name}']
            
            # Trigger completion
            complete_level(request.user, domain, xp_multiplier=multiplier)
            return JsonResponse({
                "status": "success",
                "message": f"Excellent! Evaluation passed. Level up! {'(2x XP applied!)' if multiplier > 1 else ''}",
                "next_url": f"/dashboard/domain/{domain.id}/"
            })
        else:
            return JsonResponse({
                "status": "fail",
                "message": "Logic mismatch. Review your code and try again.",
                "hint": f"Focus on the {level_obj.concept} concept."
            })
            
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Domain.DoesNotExist:
        return JsonResponse({"error": "Invalid domain"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@login_required
def get_user_powers(request):
    powers = UserPower.objects.filter(user=request.user, quantity__gt=0)
    data = [{
        "id": up.power.id,
        "name": up.power.name,
        "description": up.power.description,
        "quantity": up.quantity
    } for up in powers]
    return JsonResponse({"status": "success", "powers": data})

@login_required
def get_progress(request):
    try:
        user_xp = request.user.xp_profile.xp
    except:
        user_xp = 0
    
    progresses = request.user.progress.all()
    domain_data = { p.domain.name: p.current_level for p in progresses }
    
    return JsonResponse({
        "status": "success",
        "total_xp": user_xp,
        "domain_progress": domain_data
    })

@login_required
def get_leaderboard(request):
    limit = request.GET.get('limit', 10)
    try:
        limit = int(limit)
    except ValueError:
        limit = 10
        
    data = get_leaderboard_data(limit=limit)
    return JsonResponse(data, safe=False)

