import re

with open('frontend/src/views/LiveView.vue', 'r') as f:
    content = f.read()

# 1. State changes
state_changes = """
const livePin = ref('')
const liveToken = ref('')
const unlockError = ref('')
"""

content = content.replace("const isLiveEnabled = ref(true)", f"const isLiveEnabled = ref(true)\n{state_changes}")

# 2. Add unlock UI to template
# Right after "<!-- Track List -->" title, or at the top of the track list?
# Let's put an overlay in the template if !liveToken.value
# Wait, the user said "make the buttons disablabled, add a unlock option just like in admin page to unlock the live endpint."
# Okay, we will disable buttons and show an Unlock box.

template_changes = """
      <!-- Unlock Banner -->
      <div v-if="!liveToken" class="bg-gray-800 rounded-xl p-4 mb-6 border border-yellow-500/50">
        <h3 class="text-lg font-semibold text-white mb-2">Unlock Controls</h3>
        <p class="text-sm text-gray-400 mb-4">You must enter the Live PIN to select or control tracks.</p>
        <div class="flex gap-2">
          <input v-model="livePin" type="password" placeholder="Enter Live PIN" class="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-player-accent" @keyup.enter="unlockLiveView" />
          <button @click="unlockLiveView" class="bg-player-accent text-black font-medium px-4 py-2 rounded hover:bg-green-400">Unlock</button>
        </div>
        <p v-if="unlockError" class="text-red-400 text-sm mt-2">{{ unlockError }}</p>
      </div>
"""

content = content.replace("<!-- Track List -->", template_changes + "\n      <!-- Track List -->")

# 3. Disable buttons
# The stop button
content = content.replace(
    ':disabled="!currentTrackId"',
    ':disabled="!currentTrackId || !liveToken"'
)
# The play/pause button
content = content.replace(
    ":class=\"currentTrackId ? 'bg-player-accent text-black hover:scale-105 shadow-lg shadow-player-accent/30' : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'\"",
    ":class=\"currentTrackId && liveToken ? 'bg-player-accent text-black hover:scale-105 shadow-lg shadow-player-accent/30' : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'\""
)
content = content.replace(
    ":class=\"currentTrackId ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700' : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'\"",
    ":class=\"currentTrackId && liveToken ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700' : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'\""
)
# Select buttons
content = content.replace(
    '<button @click="selectTrack(track)"',
    '<button @click="selectTrack(track)" :disabled="!liveToken"'
)
content = content.replace(
    "track.id === currentTrackId ? 'bg-player-accent/20 text-player-accent' : 'bg-gray-700 text-white hover:bg-gray-600'",
    "track.id === currentTrackId ? 'bg-player-accent/20 text-player-accent' : (!liveToken ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600')"
)


# 4. update active_live_state to lock on performance change
perf_logic = """
      // Reset lock if performance changed
      if (activePerformance.value && state.performance && activePerformance.value.id !== state.performance.id) {
        liveToken.value = ''
      }
      activePerformance.value = state.performance
"""
content = content.replace("activePerformance.value = state.performance", perf_logic)

# 5. sendCommand and selectTrack to include token
content = content.replace(
    "socket.emit('performer_send_command', { action, eventId: activeEventId.value })",
    "if (!liveToken.value) return;\n  socket.emit('performer_send_command', { action, eventId: activeEventId.value, token: liveToken.value })"
)

content = content.replace(
    "socket.emit('performer_send_command', { action: 'loadTrack', track: trackWithUrl, eventId: activeEventId.value })",
    "if (!liveToken.value) return;\n    socket.emit('performer_send_command', { action: 'loadTrack', track: trackWithUrl, eventId: activeEventId.value, token: liveToken.value })"
)

# 6. Add unlockLiveView function
unlock_func = """
async function unlockLiveView() {
  if (!livePin.value.trim()) return
  
  try {
    const response = await fetch(`/api/events/${props.eventId}/verify-live-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livePin: livePin.value.trim() })
    })
    
    if (response.ok) {
      const data = await response.json()
      liveToken.value = data.token
      livePin.value = ''
      unlockError.value = ''
    } else {
      unlockError.value = 'Incorrect PIN'
      livePin.value = ''
    }
  } catch (error) {
    unlockError.value = 'Server error'
  }
}
"""
content = content.replace("function sendCommand", unlock_func + "\nfunction sendCommand")


# Add listener for unauthorized live access
socket_error_logic = """
  socket.on('live_unauthorized', (data: any) => {
    liveToken.value = ''
    unlockError.value = data.error || 'Session expired. Please unlock again.'
  })
"""
content = content.replace("socket.on('play_state_updated', (data: any) => {", socket_error_logic + "\n  socket.on('play_state_updated', (data: any) => {")

socket_unmount_logic = """
  socket.off('event_state_updated')
  socket.off('live_unauthorized')
"""
content = content.replace("socket.off('event_state_updated')", socket_unmount_logic)

with open('frontend/src/views/LiveView.vue', 'w') as f:
    f.write(content)
