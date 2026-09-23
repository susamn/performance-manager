import re

with open('backend/app.py', 'r') as f:
    content = f.read()

# Endpoints that mutate state (not including /api/events POST or /api/events/<event_id>/verify-unlock POST)
# We look for @app.route followed by PUT, POST, DELETE.
# We also need to add @require_auth right under it.

def replace_func(match):
    route_decorator = match.group(0)
    
    # Exclude open endpoints
    if "'/api/events'" in route_decorator and "'POST'" in route_decorator:
        return route_decorator
    if "'/api/events/<event_id>/verify-unlock'" in route_decorator:
        return route_decorator

    # For endpoints that have <event_id> in the route, we can use @require_auth
    if "<event_id>" in route_decorator and any(m in route_decorator for m in ["'PUT'", "'POST'", "'DELETE'"]):
        return f"{route_decorator}\n@require_auth"
    
    return route_decorator

# Match @app.route(...)
new_content = re.sub(r"@app\.route\([^)]+\)", replace_func, content)

with open('backend/app.py', 'w') as f:
    f.write(new_content)
