from pathlib import Path

from mpd_player import MPDPlayer, MPDError
from test_app import client  # isolated temporary config fixture


def test_queue_selection_and_crossfade(monkeypatch, tmp_path):
    player = MPDPlayer(tmp_path)
    calls = []
    status = {'state': 'stop', 'repeat': '0'}

    def command(name, *args):
        calls.append((name, *args))
        if name == 'status':
            return status
        if name == 'repeat':
            status['repeat'] = str(args[0])
        if name == 'play':
            status.update(state='play', song=str(args[0]), elapsed='0', duration='20')
        if name == 'stop':
            status.update(state='stop', elapsed='0')
        return {}

    monkeypatch.setattr(player, '_ensure_running', lambda: None)
    monkeypatch.setattr(player, '_command', command)
    tracks = [({'id': f't-{n}', 'filename': f'{n}.mp3', 'duration': 20}, Path(f'/tmp/{n}.mp3'))
              for n in range(3)]

    state = player.load('event-1', 'perf-1', tracks, 1, True)
    assert state['track']['id'] == 't-1'
    assert state['playState']['isPlaying'] is False
    assert ('crossfade', 10) in calls
    assert ('repeat', 1) in calls
    assert ('play', 1) not in calls  # selection is not playback
    assert [call[1] for call in calls if call[0] == 'add'] == [str(path) for _, path in tracks]

    state = player.control('event-1', 'play')
    assert ('play', 1) in calls
    assert state['playState']['isPlaying'] is True
    player.control('event-1', 'seek', 50)
    assert ('seekcur', 10.0) in calls
    player.set_continuous('event-1', 'perf-1', False)
    assert ('crossfade', 0) in calls
    assert ('repeat', 0) in calls


def test_event_isolation(monkeypatch, tmp_path):
    player = MPDPlayer(tmp_path)
    player.event_id = 'event-1'
    player.tracks = [{'id': 't-1', 'duration': 20}]
    monkeypatch.setattr(player, '_command', lambda *args: {'state': 'stop'})
    try:
        player.control('another-event', 'play')
    except MPDError as exc:
        assert 'this event' in str(exc)
    else:
        assert False, 'another event must not control the shared speakers'


def test_mpd_quoting():
    assert MPDPlayer._quote('/tmp/a "song".mp3') == '"/tmp/a \\"song\\".mp3"'


def test_player_api_and_live_remote(client, monkeypatch, tmp_path):
    import app as backend
    player = MPDPlayer(tmp_path)
    status = {'state': 'stop', 'repeat': '0'}

    def command(name, *args):
        if name == 'status':
            return status
        if name == 'repeat':
            status['repeat'] = str(args[0])
        if name == 'play':
            status.update(state='play', song=str(args[0]), elapsed='0', duration='1')
        if name == 'stop':
            status.update(state='stop', elapsed='0')
        return {}

    monkeypatch.setattr(player, '_ensure_running', lambda: None)
    monkeypatch.setattr(player, '_command', command)
    monkeypatch.setattr(backend, 'mpd_player', player)
    monkeypatch.setattr(backend, 'start_player_watch', lambda: None)

    event = client.post('/api/events', json={'name': 'Stage'}).get_json()
    event_id = event['id']
    performance = backend.em.create_performance(event_id, 'Act')
    import wave
    path = backend.em.get_performance_dir(event_id, performance['id']) / 'one.wav'
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(44100)
        output.writeframes(b'\0\0' * 44100)
    track = backend.em.add_track(event_id, performance['id'], path.name, 'Artist', path)
    url = f'/api/events/{event_id}/player'
    request_data = {'performanceId': performance['id'], 'trackId': track['id'], 'continuous': True}

    assert client.post(f'{url}/load', json=request_data).status_code == 401
    assert client.post(f'{url}/load', json={**request_data, 'trackId': 'not-a-track'},
                       headers={'Authorization': 'Bearer ' + event['token']}).status_code == 400
    result = client.post(f'{url}/load', json=request_data,
                         headers={'Authorization': 'Bearer ' + event['token']})
    assert result.status_code == 200
    assert result.get_json()['playState']['isPlaying'] is False
    assert client.get(f'{url}/state').get_json()['track']['id'] == track['id']
    live = client.post(f'/api/events/{event_id}/verify-live-pin', json={'livePin': event['livePin']})
    token = live.get_json()['token']
    remote = backend.socketio.test_client(backend.app)
    try:
        remote.emit('performer_send_command', {'eventId': event_id, 'token': 'bad', 'action': 'play'})
        assert status['state'] == 'stop'
        remote.emit('performer_send_command', {'eventId': event_id, 'token': token, 'action': 'play'})
        assert status['state'] == 'play'
    finally:
        remote.disconnect()
