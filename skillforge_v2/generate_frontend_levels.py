import json

def generate_frontend_levels():
    levels = []
    
    # 1. Manually defined levels (Already created in previous turn)
    manual_levels = [
        {
            "level": 1, "title": "Center a Div Horizontally", "concept": "CSS Flexbox",
            "description": "Given a div element, modify the CSS to center it horizontally inside its parent container using Flexbox.",
            "starter_code": "<div class='container'>\n  <div class='box'></div>\n</div>\n\n<style>\n.container {\n  display: flex;\n}\n.box {\n  width: 100px;\n  height: 100px;\n  background: red;\n}\n</style>",
            "solution_code": "<div class='container'>\n  <div class='box'></div>\n</div>\n\n<style>\n.container {\n  display: flex;\n  justify-content: center;\n}\n.box {\n  width: 100px;\n  height: 100px;\n  background: red;\n}\n</style>",
            "difficulty": "easy"
        },
        {
            "level": 2, "title": "Change Text Color", "concept": "CSS Colors",
            "description": "Modify the CSS to change the color of the h1 element to blue.",
            "starter_code": "<h1>Hello SkillForge</h1>\n\n<style>\nh1 {\n  font-family: sans-serif;\n}\n</style>",
            "solution_code": "<h1>Hello SkillForge</h1>\n\n<style>\nh1 {\n  font-family: sans-serif;\n  color: blue;\n}\n</style>",
            "difficulty": "easy"
        },
        {
            "level": 3, "title": "Add Padding", "concept": "CSS Box Model",
            "description": "Give the box element a padding of 20px on all sides.",
            "starter_code": "<div class='box'>Content</div>\n\n<style>\n.box {\n  border: 1px solid black;\n}\n</style>",
            "solution_code": "<div class='box'>Content</div>\n\n<style>\n.box {\n  border: 1px solid black;\n  padding: 20px;\n}\n</style>",
            "difficulty": "easy"
        },
        {
            "level": 4, "title": "Set Font Size", "concept": "CSS Typography",
            "description": "Adjust the font size of the paragraph to 24 pixels.",
            "starter_code": "<p>Increase my size!</p>\n\n<style>\np {\n  color: #333;\n}\n</style>",
            "solution_code": "<p>Increase my size!</p>\n\n<style>\np {\n  color: #333;\n  font-size: 24px;\n}\n</style>",
            "difficulty": "easy"
        },
        {
            "level": 5, "title": "Create a Grid Layout", "concept": "CSS Grid",
            "description": "Change the container display property to 'grid' to enable grid layout.",
            "starter_code": "<div class='container'>\n  <div>1</div>\n  <div>2</div>\n</div>\n\n<style>\n.container {\n  border: 1px solid red;\n}\n</style>",
            "solution_code": "<div class='container'>\n  <div>1</div>\n  <div>2</div>\n</div>\n\n<style>\n.container {\n  border: 1px solid red;\n  display: grid;\n}\n</style>",
            "difficulty": "easy"
        }
    ]
    
    levels.extend(manual_levels)
    
    # 2. Add sequential levels based on common concepts
    concepts = [
        "Box Model", "Flexbox", "Grid", "Typography", "Colors", "Animations", 
        "Positioning", "Selectors", "Pseudo-classes", "Media Queries",
        "Responsive", "Z-index", "Specificity", "Inheritance", "Flex-grow",
        "Grid-areas", "Box-shadow", "Text-shadow", "Transitions", "Transforms"
    ]
    
    for i in range(6, 101):
        concept = concepts[i % len(concepts)]
        diff = "easy" if i <= 25 else "medium" if i <= 60 else "hard" if i <= 85 else "expert"
        
        levels.append({
            "level": i,
            "title": f"{concept} Task #{i}",
            "description": f"Master the basics of {concept} in challenge #{i}.",
            "difficulty": diff,
            "concept": concept,
            "starter_code": f"<div class='box_{i}'>Level {i}</div>\n\n<style>\n.box_{i} {{\n  display: block;\n}}\n</style>",
            "solution_code": f"<div class='box_{i}'>Level {i}</div>\n\n<style>\n.box_{i} {{\n  display: flex;\n}}\n</style>"
        })
        
    return {"domain": "Frontend", "levels": levels}

if __name__ == "__main__":
    data = generate_frontend_levels()
    with open('db/domains/frontend.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("Generated db/domains/frontend.json with 100 levels.")
