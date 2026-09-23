with open('frontend/src/components/AddEventForm.vue', 'r') as f:
    content = f.read()

live_pin_html = """
      <div>
        <label for="livePin" class="block text-sm font-medium text-gray-300 mb-2">
          Live Endpoint PIN *
        </label>
        <input
          id="livePin"
          v-model="livePin"
          type="password"
          required
          placeholder="Enter live endpoint PIN (min 4 characters)"
          minlength="4"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
        />
        <p class="text-xs text-gray-500 mt-1">This PIN is required for performers to control the live view</p>
      </div>
"""

content = content.replace(
    '        <p class="text-xs text-gray-500 mt-1">This code will be required to unlock and edit the event</p>\n      </div>',
    f'        <p class="text-xs text-gray-500 mt-1">This code will be required to unlock and edit the event</p>\n      </div>\n{live_pin_html}'
)

content = content.replace(
    "const unlockCode = ref('')",
    "const unlockCode = ref('')\nconst livePin = ref('')"
)

content = content.replace(
    "if (!eventName.value.trim() || !unlockCode.value.trim()) return",
    "if (!eventName.value.trim() || !unlockCode.value.trim() || !livePin.value.trim()) return"
)

content = content.replace(
    "formData.append('unlockCode', unlockCode.value.trim())",
    "formData.append('unlockCode', unlockCode.value.trim())\n    formData.append('livePin', livePin.value.trim())"
)

content = content.replace(
    "unlockCode.value = ''",
    "unlockCode.value = ''\n  livePin.value = ''"
)

with open('frontend/src/components/AddEventForm.vue', 'w') as f:
    f.write(content)
