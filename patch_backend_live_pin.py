import re

with open('backend/app.py', 'r') as f:
    content = f.read()

# 1. Update EventManager.create_event
content = content.replace(
    "def create_event(self, name: str, description: str = '', unlock_code: str = '12345') -> Dict[str, Any]:",
    "def create_event(self, name: str, description: str = '', unlock_code: str = '12345', live_pin: str = '0000') -> Dict[str, Any]:"
)

create_event_save_logic = """
        # Save unlock code to file
        unlock_code_file = event_dir / 'unlock_code'
        with open(unlock_code_file, 'w') as f:
            f.write(unlock_code)

        # Save live pin to file
        live_pin_file = event_dir / 'live_pin'
        with open(live_pin_file, 'w') as f:
            f.write(live_pin)
"""
content = re.sub(
    r"\s*# Save unlock code to file\s*unlock_code_file = event_dir / 'unlock_code'\s*with open\(unlock_code_file, 'w'\) as f:\s*f\.write\(unlock_code\)",
    create_event_save_logic,
    content
)

# 2. Update POST /api/events
content = content.replace(
    "unlock_code = request.form.get('unlockCode', '12345')",
    "unlock_code = request.form.get('unlockCode', '12345')\n        live_pin = request.form.get('livePin', '0000')"
)
content = content.replace(
    "event = em.create_event(name, description, unlock_code)",
    "event = em.create_event(name, description, unlock_code, live_pin)"
)
content = content.replace(
    "event = em.create_event(data['name'], data.get('description', ''), data.get('unlockCode', '12345'))",
    "event = em.create_event(data['name'], data.get('description', ''), data.get('unlockCode', '12345'), data.get('livePin', '0000'))"
)

# 3. Add live token functions at the top where generate_auth_token is
live_token_logic = """
def generate_live_token(event_id: str) -> str:
    s = URLSafeTimedSerializer(current_app.secret_key)
    return s.dumps({'event_id': event_id, 'type': 'live_pin'})

def verify_live_token(token: str, expected_event_id: str) -> bool:
    if not token: return False
    s = URLSafeTimedSerializer(current_app.secret_key)
    try:
        # Valid for 2 hours
        data = s.loads(token, max_age=7200)
    except (SignatureExpired, BadSignature):
        return False
    return data.get('event_id') == expected_event_id and data.get('type') == 'live_pin'
"""

content = content.replace(
    "def generate_auth_token(event_id: str) -> str:",
    f"{live_token_logic}\ndef generate_auth_token(event_id: str) -> str:"
)

# 4. Add verify-live-pin endpoint right after verify-unlock endpoint
verify_live_endpoint = """
@app.route('/api/events/<event_id>/verify-live-pin', methods=['POST'])
def verify_live_pin(event_id: str):
    \"\"\"Verify live pin for an event\"\"\"
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    data = request.get_json()
    if not data or 'livePin' not in data:
        return jsonify({'error': 'Live PIN is required'}), 400

    live_pin_file = em.get_event_dir(event_id) / 'live_pin'
    if not live_pin_file.exists():
        with open(live_pin_file, 'w') as f:
            f.write('0000')
        stored_code = '0000'
    else:
        with open(live_pin_file, 'r') as f:
            stored_code = f.read().strip()

    if data['livePin'] == stored_code:
        token = generate_live_token(event_id)
        return jsonify({'success': True, 'token': token}), 200
    else:
        return jsonify({'error': 'Incorrect live PIN'}), 401
"""
content = re.sub(
    r"(@app\.route\('/api/events/<event_id>/performances', methods=\['GET'\]\))",
    verify_live_endpoint + r"\n\1",
    content
)

# 5. Update socketio performer_send_command to require token
socket_logic = """
@socketio.on('performer_send_command')
def handle_performer_send_command(data):
    \"\"\"Performer sent a command (play, pause, stop, etc.)\"\"\"
    event_id = data.get('eventId')
    token = data.get('token')
    
    # We must require a valid live token before forwarding commands
    if not event_id or not verify_live_token(token, event_id):
        # We could emit an error back to the client, but for security, silent failure is okay, 
        # or we emit a specific unauthorized event.
        emit('live_unauthorized', {'error': 'Invalid or expired Live PIN'}, to=request.sid)
        return

    # Forward this command to all clients (including admin)
    emit('admin_receive_command', data, broadcast=True)
"""
content = re.sub(
    r"@socketio\.on\('performer_send_command'\)\ndef handle_performer_send_command\(data\):[\s\S]*?emit\('admin_receive_command', data, broadcast=True\)",
    socket_logic.strip(),
    content
)

with open('backend/app.py', 'w') as f:
    f.write(content)
