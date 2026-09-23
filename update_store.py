with open('frontend/src/stores/event.ts', 'r') as f:
    content = f.read()

# Replace all occurrences of headers: { 'Content-Type': 'application/json' }
# with headers: getAuthHeaders(eventId) for specific functions

replacements = [
    (r"method: 'DELETE'", r"method: 'DELETE',\n        headers: getAuthHeaders(eventId)"),
    (r"headers: { 'Content-Type': 'application/json' },", r"headers: getAuthHeaders(eventId),"),
]

# We need to be careful not to replace createEvent's headers since it doesn't have an eventId yet.
# Let's write it back out.

# Read file, find functions, replace inside them
import re

def update_function(match):
    # match.group(0) is the entire function block
    block = match.group(0)
    
    # createEvent does not have eventId parameter
    if "async function createEvent" in block:
        return block
        
    block = re.sub(r"headers:\s*\{\s*'Content-Type':\s*'application/json'\s*\}", "headers: getAuthHeaders(eventId)", block)
    block = re.sub(r"method:\s*'DELETE'(?!,)", "method: 'DELETE',\n        headers: getAuthHeaders(eventId)", block)
    return block

# Find all async functions
new_content = re.sub(r"async function \w+\([^)]*\)\s*\{[^}]+\}", update_function, content)

with open('frontend/src/stores/event.ts', 'w') as f:
    f.write(new_content)
