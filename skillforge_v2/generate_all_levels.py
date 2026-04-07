import json
import os

def get_frontend_templates():
    return [
        {
            "concept": "CSS Flexbox",
            "title": "Center Content with Flexbox",
            "desc": "Modify the container to center its children horizontally.",
            "starter": ".container {\n  display: flex;\n}",
            "solution": ".container {\n  display: flex;\n  justify-content: center;\n}"
        },
        {
            "concept": "CSS Grid",
            "title": "Create a 2-Column Grid",
            "desc": "Define two equal columns for the grid container.",
            "starter": ".grid {\n  display: grid;\n}",
            "solution": ".grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n}"
        },
        {
            "concept": "CSS Colors",
            "title": "Set Text Transparency",
            "desc": "Change the heading color to be 50% transparent white.",
            "starter": "h1 {\n  color: white;\n}",
            "solution": "h1 {\n  color: rgba(255, 255, 255, 0.5);\n}"
        },
        {
            "concept": "CSS Box Model",
            "title": "Fix Box Sizing",
            "desc": "Ensure padding doesn't increase the element's width.",
            "starter": ".box {\n  width: 100px;\n  padding: 20px;\n}",
            "solution": ".box {\n  width: 100px;\n  padding: 20px;\n  box-sizing: border-box;\n}"
        },
        {
            "concept": "CSS Transitions",
            "title": "Add Hover Smoothness",
            "desc": "Add a 0.3s transition for the background color.",
            "starter": "button {\n  background: blue;\n}",
            "solution": "button {\n  background: blue;\n  transition: background 0.3s;\n}"
        },
        {
            "concept": "CSS Positioning",
            "title": "Absolute Centering",
            "desc": "Set the child's position to absolute to allow centering.",
            "starter": ".child {\n  top: 50%;\n  left: 50%;\n}",
            "solution": ".child {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n}"
        },
        {
            "concept": "CSS Typography",
            "title": "Bold Heading",
            "desc": "Increase the weight of the heading text.",
            "starter": "h2 {\n  font-size: 2rem;\n}",
            "solution": "h2 {\n  font-size: 2rem;\n  font-weight: bold;\n}"
        },
        {
            "concept": "CSS Hover States",
            "title": "Button Hover Effect",
            "desc": "Change the cursor to a pointer when hovering over a button.",
            "starter": "button {\n  background: red;\n}",
            "solution": "button {\n  background: red;\n  cursor: pointer;\n}"
        },
        {
            "concept": "CSS Display",
            "title": "Hide Element Properly",
            "desc": "Remove the element from the layout entirely.",
            "starter": ".hidden {\n  opacity: 0;\n}",
            "solution": ".hidden {\n  display: none;\n}"
        },
        {
            "concept": "CSS Border",
            "title": "Rounded Corners",
            "desc": "Make the box corners perfectly rounded.",
            "starter": ".card {\n  border: 1px solid black;\n}",
            "solution": ".card {\n  border: 1px solid black;\n  border-radius: 8px;\n}"
        }
    ]

def get_backend_templates():
    return [
        {
            "concept": "Django Routing",
            "title": "Add URL Path",
            "desc": "Complete the path call to map 'profile/' to the profile view.",
            "starter": "urlpatterns = [\n    path('home/', views.index),\n]",
            "solution": "urlpatterns = [\n    path('home/', views.index),\n    path('profile/', views.profile),\n]"
        },
        {
            "concept": "Django Views",
            "title": "Return JSON Response",
            "desc": "Modify the view to return a JSON response instead of a plain string.",
            "starter": "def api_view(request):\n    return HttpResponse({'status': 'ok'})",
            "solution": "def api_view(request):\n    return JsonResponse({'status': 'ok'})"
        },
        {
            "concept": "Django Models",
            "title": "Define Foreign Key",
            "desc": "Link the Post model to a User using a foreign key.",
            "starter": "class Post(models.Model):\n    title = models.CharField(max_length=100)",
            "solution": "class Post(models.Model):\n    user = models.ForeignKey(User, on_delete=models.CASCADE)\n    title = models.CharField(max_length=100)"
        },
        {
            "concept": "Django ORM",
            "title": "Filter Active Users",
            "desc": "Update the query to only fetch users where is_active is True.",
            "starter": "users = User.objects.all()",
            "solution": "users = User.objects.filter(is_active=True)"
        },
        {
            "concept": "Django Templates",
            "title": "Pass Data to Render",
            "desc": "Include the 'items' list in the context dictionary.",
            "starter": "return render(request, 'list.html', {})",
            "solution": "return render(request, 'list.html', {'items': items})"
        },
        {
            "concept": "Django Auth",
            "title": "Protect View",
            "desc": "Add the decorator to ensure only logged-in users can access this view.",
            "starter": "def secret_dashboard(request):\n    return render(request, 'dashboard.html')",
            "solution": "@login_required\ndef secret_dashboard(request):\n    return render(request, 'dashboard.html')"
        },
        {
            "concept": "Django Forms",
            "title": "Validate Form",
            "desc": "Check if the submitted form data is valid before saving.",
            "starter": "if request.method == 'POST':\n    form = MyForm(request.POST)",
            "solution": "if request.method == 'POST':\n    form = MyForm(request.POST)\n    if form.is_valid():"
        },
        {
            "concept": "DRF Serializers",
            "title": "Specify Fields",
            "desc": "Tell the serializer to include all fields.",
            "starter": "class UserSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = User",
            "solution": "class UserSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = User\n        fields = '__all__'"
        },
        {
            "concept": "Django Middleware",
            "title": "Initialize Middleware",
            "desc": "Store the get_response callable in the middleware.",
            "starter": "class SimpleMiddleware:\n    def __init__(self, get_response):\n        pass",
            "solution": "class SimpleMiddleware:\n    def __init__(self, get_response):\n        self.get_response = get_response"
        },
        {
            "concept": "Django Signals",
            "title": "Connect Signal",
            "desc": "Register the post_save receiver using the decorator.",
            "starter": "def my_handler(sender, instance, **kwargs):\n    pass",
            "solution": "@receiver(post_save, sender=User)\ndef my_handler(sender, instance, **kwargs):\n    pass"
        }
    ]

def get_sql_templates():
    return [
        {
            "concept": "SQL Basics",
            "title": "Select Specific Columns",
            "desc": "Only retrieve the 'name' and 'email' columns from the users table.",
            "starter": "SELECT * FROM users;",
            "solution": "SELECT name, email FROM users;"
        },
        {
            "concept": "SQL Filtering",
            "title": "Filter by Condition",
            "desc": "Fetch users who are older than 18.",
            "starter": "SELECT * FROM users;",
            "solution": "SELECT * FROM users WHERE age > 18;"
        },
        {
            "concept": "SQL Sorting",
            "title": "Sort by Date",
            "desc": "Order the posts by created_at in descending order.",
            "starter": "SELECT * FROM posts;",
            "solution": "SELECT * FROM posts ORDER BY created_at DESC;"
        },
        {
            "concept": "SQL Aggregation",
            "title": "Count Records",
            "desc": "Get the total number of users in the table.",
            "starter": "SELECT name FROM users;",
            "solution": "SELECT COUNT(*) FROM users;"
        },
        {
            "concept": "SQL Joins",
            "title": "Inner Join",
            "desc": "Join posts with users on the user_id field.",
            "starter": "SELECT * FROM posts;",
            "solution": "SELECT * FROM posts JOIN users ON posts.user_id = users.id;"
        },
        {
            "concept": "SQL Distinct",
            "title": "Unique Values",
            "desc": "Get unique country values from the addresses table.",
            "starter": "SELECT country FROM addresses;",
            "solution": "SELECT DISTINCT country FROM addresses;"
        },
        {
            "concept": "SQL Updates",
            "title": "Update Record",
            "desc": "Change the status to 'active' for user with ID 5.",
            "starter": "UPDATE users SET status = 'active';",
            "solution": "UPDATE users SET status = 'active' WHERE id = 5;"
        },
        {
            "concept": "SQL Deletion",
            "title": "Delete Record",
            "desc": "Remove the post with ID 10.",
            "starter": "DELETE FROM posts;",
            "solution": "DELETE FROM posts WHERE id = 10;"
        },
        {
            "concept": "SQL Grouping",
            "title": "Group by Category",
            "desc": "Count items in each category.",
            "starter": "SELECT category, count(*) FROM products;",
            "solution": "SELECT category, count(*) FROM products GROUP BY category;"
        },
        {
            "concept": "SQL Limits",
            "title": "Paginate Results",
            "desc": "Retrieve only the first 5 records.",
            "starter": "SELECT * FROM activity_logs;",
            "solution": "SELECT * FROM activity_logs LIMIT 5;"
        }
    ]

def get_dsa_templates():
    return [
        {
            "concept": "Arrays",
            "title": "Find Sum",
            "desc": "Complete the function to return the sum of the list.",
            "starter": "def total(nums):\n    return sum()",
            "solution": "def total(nums):\n    return sum(nums)"
        },
        {
            "concept": "Strings",
            "title": "Reverse String",
            "desc": "Use slicing to reverse the input string.",
            "starter": "def reverse(s):\n    return s",
            "solution": "def reverse(s):\n    return s[::-1]"
        },
        {
            "concept": "Loops",
            "title": "Find Maximum",
            "desc": "Update the loop to check if the current num is greater than the max.",
            "starter": "for num in nums:\n    if num < m:\n        m = num",
            "solution": "for num in nums:\n    if num > m:\n        m = num"
        },
        {
            "concept": "Recursion",
            "title": "Base Case",
            "desc": "Add the base case for n == 0 to return 1.",
            "starter": "def fact(n):\n    return n * fact(n-1)",
            "solution": "def fact(n):\n    if n == 0: return 1\n    return n * fact(n-1)"
        },
        {
            "concept": "Stacks",
            "title": "Stack Pop",
            "desc": "Remove and return the last item from the stack.",
            "starter": "def pop_item(stack):\n    stack.append(1)",
            "solution": "def pop_item(stack):\n    return stack.pop()"
        },
        {
            "concept": "Queues",
            "title": "Queue Enqueue",
            "desc": "Add an item to the beginning of the list to simulate a queue.",
            "starter": "def enqueue(q, val):\n    q.append(val)",
            "solution": "def enqueue(q, val):\n    q.insert(0, val)"
        },
        {
            "concept": "Dictionaries",
            "title": "Check Key",
            "desc": "Check if the key exists in the dictionary before accessing.",
            "starter": "def get_val(d, k):\n    return d[k]",
            "solution": "def get_val(d, k):\n    if k in d: return d[k]"
        },
        {
            "concept": "Sorting",
            "title": "Bubble Sort Swap",
            "desc": "Swap the two elements if the first is larger.",
            "starter": "if arr[j] < arr[j+1]:\n    arr[j], arr[j+1] = arr[j+1], arr[j]",
            "solution": "if arr[j] > arr[j+1]:\n    arr[j], arr[j+1] = arr[j+1], arr[j]"
        },
        {
            "concept": "Binary Search",
            "title": "Midpoint Calculation",
            "desc": "Calculate the middle index correctly.",
            "starter": "mid = (low + high)",
            "solution": "mid = (low + high) // 2"
        },
        {
            "concept": "Linked Lists",
            "title": "Next Pointer",
            "desc": "Move the current pointer to the next node.",
            "starter": "while curr:\n    print(curr.val)",
            "solution": "while curr:\n    print(curr.val)\n    curr = curr.next"
        }
    ]

def get_cs_templates():
    return [
        {
            "concept": "Logic Gates",
            "title": "AND Gate",
            "desc": "Implement the logical AND operation.",
            "starter": "def gate_and(a, b):\n    return a | b",
            "solution": "def gate_and(a, b):\n    return a & b"
        },
        {
            "concept": "Number Systems",
            "title": "Binary to Decimal",
            "desc": "Convert a binary string to an integer.",
            "starter": "def to_dec(b_str):\n    return int(b_str)",
            "solution": "def to_dec(b_str):\n    return int(b_str, 2)"
        },
        {
            "concept": "OS Concepts",
            "title": "File Permissions",
            "desc": "Set the permission string for a fully accessible file (777).",
            "starter": "perm = '644'",
            "solution": "perm = '777'"
        },
        {
            "concept": "Networking",
            "title": "HTTP Success Code",
            "desc": "Return the standard HTTP status code for 'OK'.",
            "starter": "return 302",
            "solution": "return 200"
        },
        {
            "concept": "Data Units",
            "title": "KB to Bytes",
            "desc": "Convert Kilobytes to Bytes.",
            "starter": "def kb_to_b(kb):\n    return kb * 100",
            "solution": "def kb_to_b(kb):\n    return kb * 1024"
        },
        {
            "concept": "CPU Scheduling",
            "title": "FIFO Logic",
            "desc": "Pick the first process from the list.",
            "starter": "next_p = processes[-1]",
            "solution": "next_p = processes[0]"
        },
        {
            "concept": "Memory Management",
            "title": "Pointer Dereference",
            "desc": "Return the value at the pointer address (psuedo).",
            "starter": "def get_ptr_val(p):\n    return p",
            "solution": "def get_ptr_val(p):\n    return *p"
        },
        {
            "concept": "Encryption",
            "title": "Caesar Cipher Shift",
            "desc": "Shift the character code by 1.",
            "starter": "return chr(ord(c))",
            "solution": "return chr(ord(c) + 1)"
        },
        {
            "concept": "Process States",
            "title": "Waiting State",
            "desc": "Change the state to 'WAITING'.",
            "starter": "state = 'RUNNING'",
            "solution": "state = 'WAITING'"
        },
        {
            "concept": "Character Encoding",
            "title": "ASCII Code",
            "desc": "Get the ASCII code for character 'A'.",
            "starter": "code = ord('B')",
            "solution": "code = ord('A')"
        }
    ]

def generate_domain(domain_name, templates):
    levels = []
    # Difficulty distribution: 1-20 (easy), 21-50 (medium), 51-80 (hard), 81-100 (expert)
    for i in range(1, 101):
        if i <= 20: diff = "easy"
        elif i <= 50: diff = "medium"
        elif i <= 80: diff = "hard"
        else: diff = "expert"
        
        # Pick template deterministically
        tpl = templates[(i-1) % len(templates)]
        
        # Add variation based on level number to ensure uniqueness
        title = f"{tpl['title']} #{i}"
        
        # For Python/Code based ones, we can inject the level number into comments/variables
        s_code = tpl['starter'].replace("{i}", str(i))
        sol_code = tpl['solution'].replace("{i}", str(i))
        
        levels.append({
            "level": i,
            "title": title,
            "description": tpl['desc'],
            "difficulty": diff,
            "concept": tpl['concept'],
            "starter_code": s_code,
            "solution_code": sol_code
        })
    return {"domain": domain_name, "levels": levels}

def run():
    os.makedirs('db/domains', exist_ok=True)
    
    domains = [
        ("Frontend", get_frontend_templates()),
        ("Backend", get_backend_templates()),
        ("SQL", get_sql_templates()),
        ("DSA", get_dsa_templates()),
        ("CS_Fundamentals", get_cs_templates())
    ]
    
    for name, tpls in domains:
        data = generate_domain(name, tpls)
        file_path = f'db/domains/{name.lower()}.json'
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"✅ Generated {file_path}")

if __name__ == "__main__":
    run()
