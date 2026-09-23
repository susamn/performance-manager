import os
import re

def update_file(path):
    with open(path, 'r') as f:
        content = f.read()

    original = content
    
    # 1. Update PUT/POST with application/json
    content = re.sub(
        r"headers:\s*\{\s*'Content-Type':\s*'application/json'\s*\}",
        r"headers: useEventStore().getAuthHeaders(eventId || props.eventId)",
        content
    )
    
    # 2. Update DELETE
    content = re.sub(
        r"method:\s*'DELETE'(?!\s*,)",
        r"method: 'DELETE',\n        headers: useEventStore().getAuthHeaders(eventId || props.eventId)",
        content
    )
    
    # 3. Update POST with formData (no content-type)
    content = re.sub(
        r"method:\s*'POST',\s*body:\s*formData",
        r"method: 'POST',\n        headers: useEventStore().getAuthHeaders(eventId || props.eventId, true),\n        body: formData",
        content
    )

    if content != original:
        # Check if we need to import useEventStore
        if "import { useEventStore" not in content and "getAuthHeaders" in content:
            if "setup lang=\"ts\"" in content:
                content = content.replace("<script setup lang=\"ts\">", "<script setup lang=\"ts\">\nimport { useEventStore } from '@/stores/event'")
        
        # We need to make sure we don't accidentally do this for store files
        if "stores/" not in path:
            with open(path, 'w') as f:
                f.write(content)
            print(f"Updated {path}")

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.vue') or file.endswith('.ts'):
            update_file(os.path.join(root, file))
