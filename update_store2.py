import re

with open('frontend/src/stores/event.ts', 'r') as f:
    content = f.read()

# Replace basic fetch headers
content = re.sub(r"headers: \{ 'Content-Type': 'application/json' \}", r"headers: getAuthHeaders(eventId)", content)

# But createEvent does not have eventId. Let's fix that one specifically.
content = content.replace(
    "headers: getAuthHeaders(eventId)",
    "headers: { 'Content-Type': 'application/json' }",
    1 # Only replace the first occurrence which is inside createEvent
)

# For DELETE requests
content = re.sub(
    r"method: 'DELETE'\s*\n\s*\}\)",
    r"method: 'DELETE',\n        headers: getAuthHeaders(eventId),\n      })",
    content
)

# For the other DELETE request
content = re.sub(
    r"method: 'DELETE',?\s*\}\)",
    r"method: 'DELETE',\n        headers: getAuthHeaders(eventId),\n      })",
    content
)


with open('frontend/src/stores/event.ts', 'w') as f:
    f.write(content)
