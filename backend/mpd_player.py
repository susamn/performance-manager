"""Private MPD instance for local, server-side performance playback.

No browser audio is involved. Never connects to the user's existing MPD daemon.
"""
import json
import socket
import subprocess
import threading
import time
from pathlib import Path


class MPDError(Exception):
    pass


class MPDPlayer:
    def __init__(self, config_dir: Path):
        self.directory = config_dir / 'mpd'
        self.socket_path = self.directory / 'mpd.sock'
        self.lock = threading.RLock()
        self.event_id = None
        self.performance_id = None
        self.tracks = []
        self.selected_index = 0
        self.session_file = self.directory / 'session.json'
        if self.session_file.is_file():
            try:
                session = json.loads(self.session_file.read_text())
                self.event_id = session['eventId']
                self.performance_id = session['performanceId']
                self.tracks = session['tracks']
                self.selected_index = session['selectedIndex']
            except (KeyError, ValueError, TypeError):
                pass

    def _save_session(self):
        self.directory.mkdir(parents=True, exist_ok=True)
        self.directory.chmod(0o700)
        self.session_file.write_text(json.dumps({
            'eventId': self.event_id, 'performanceId': self.performance_id,
            'tracks': self.tracks, 'selectedIndex': self.selected_index,
        }))
        self.session_file.chmod(0o600)

    @staticmethod
    def _quote(value):
        return '"' + str(value).replace('\\', '\\\\').replace('"', '\\"').replace('\r', ' ').replace('\n', ' ') + '"'

    def _command(self, name, *args):
        line = name + ''.join(' ' + self._quote(arg) for arg in args) + '\n'
        try:
            with socket.socket(socket.AF_UNIX) as client:
                client.settimeout(2)
                client.connect(str(self.socket_path))
                with client.makefile('rwb') as stream:
                    if not stream.readline().startswith(b'OK MPD '):
                        raise MPDError('Invalid MPD greeting')
                    stream.write(line.encode('utf-8'))
                    stream.flush()
                    result = {}
                    while True:
                        raw = stream.readline()
                        if not raw:
                            raise MPDError('MPD closed the connection')
                        text = raw.decode('utf-8', errors='replace').rstrip('\n')
                        if text == 'OK':
                            return result
                        if text.startswith('ACK '):
                            raise MPDError(text)
                        if ': ' in text:
                            key, value = text.split(': ', 1)
                            result[key] = value
        except (OSError, ValueError) as exc:
            raise MPDError(f'MPD unavailable: {exc}') from exc

    def _ensure_running(self):
        if self.socket_path.exists():
            try:
                self._command('ping')
                return
            except MPDError:
                self.socket_path.unlink(missing_ok=True)
        self.directory.mkdir(parents=True, exist_ok=True)
        self.directory.chmod(0o700)
        (self.directory / 'music').mkdir(exist_ok=True)
        (self.directory / 'playlists').mkdir(exist_ok=True)
        q = self._quote
        config = '\n'.join([
            f'music_directory {q(self.directory / "music")}',
            f'playlist_directory {q(self.directory / "playlists")}',
            f'db_file {q(self.directory / "database")}',
            f'state_file {q(self.directory / "state")}',
            f'log_file {q(self.directory / "mpd.log")}',
            f'bind_to_address {q(self.socket_path)}',
            'audio_output {',
            '  type "pipewire"',
            '  name "Performance Manager"',
            '}',
            'zeroconf_enabled "no"',
            '',
        ])
        config_path = self.directory / 'mpd.conf'
        config_path.write_text(config)
        config_path.chmod(0o600)
        try:
            with open(self.directory / 'startup.log', 'ab') as log:
                subprocess.Popen(['mpd', '--no-daemon', str(config_path)], stdout=log,
                                 stderr=subprocess.STDOUT, start_new_session=True)
        except OSError as exc:
            raise MPDError('Install MPD with PipeWire output support') from exc
        for _ in range(30):
            time.sleep(0.1)
            try:
                self._command('ping')
                return
            except MPDError:
                pass
        raise MPDError(f'Could not start dedicated MPD; see {self.directory / "startup.log"}')

    def load(self, event_id, performance_id, tracks, selected_index, continuous):
        """tracks: ordered (track metadata, resolved local file path) pairs."""
        with self.lock:
            self._ensure_running()
            self._command('stop')
            self._command('clear')
            self._command('random', 0)
            self._command('single', 0)
            self._command('repeat', int(continuous))
            self._command('crossfade', 10 if continuous else 0)
            for _, path in tracks:
                self._command('add', str(path))
            self.event_id = event_id
            self.performance_id = performance_id
            self.tracks = [track for track, _ in tracks]
            self.selected_index = selected_index
            self._save_session()
            return self.state()

    def set_continuous(self, event_id, performance_id, enabled):
        with self.lock:
            if self.event_id == event_id and self.performance_id == performance_id:
                self._command('repeat', int(enabled))
                self._command('crossfade', 10 if enabled else 0)
            return self.state()

    def control(self, event_id, action, percentage=None):
        with self.lock:
            if self.event_id != event_id or not self.tracks:
                raise MPDError('Load a track from this event first')
            status = self._command('status')
            state = status.get('state', 'stop')
            if action == 'play':
                if state == 'pause':
                    self._command('pause', 0)
                elif state == 'stop':
                    self._command('play', self.selected_index)
            elif action == 'pause':
                if state == 'play':
                    self._command('pause', 1)
            elif action == 'stop':
                if state != 'stop':
                    self.selected_index = int(status.get('song', self.selected_index))
                    self._command('stop')
                    self._save_session()
            elif action in ('seek', 'rewind'):
                if state == 'stop':
                    raise MPDError('Press Play before seeking')
                duration = float(status.get('duration', self.tracks[self.selected_index].get('duration', 0)))
                if action == 'seek':
                    if not isinstance(percentage, (int, float)) or not 0 <= percentage <= 100:
                        raise MPDError('Seek percentage must be between 0 and 100')
                    position = duration * percentage / 100
                else:
                    position = 0
                self._command('seekcur', round(position, 3))
            else:
                raise MPDError('Unknown playback command')
            return self.state()

    def shutdown(self):
        """Stop only this application's private MPD instance, never the user's MPD."""
        with self.lock:
            if self.socket_path.exists():
                try:
                    self._command('stop')
                    self._command('kill')
                except MPDError:
                    pass  # MPD closes the socket without a final OK on kill.
            self.session_file.unlink(missing_ok=True)
            self.tracks = []
            self.event_id = None
            self.performance_id = None

    def state(self):
        with self.lock:
            try:
                status = self._command('status') if self.tracks else {}
            except MPDError as exc:
                status = {'error': str(exc)}
            index = int(status.get('song', self.selected_index))
            if self.tracks and 0 <= index < len(self.tracks):
                track = self.tracks[index]
                if status.get('state') == 'play':
                    self.selected_index = index
            else:
                track = None
            duration = float(status.get('duration') or (track or {}).get('duration') or 0)
            return {
                'eventId': self.event_id,
                'track': track,
                'continuous': status.get('repeat') == '1',
                'playState': {
                    'isPlaying': status.get('state') == 'play',
                    'currentTime': float(status.get('elapsed', 0)) if status.get('state') != 'stop' else 0,
                    'duration': duration,
                    'currentEventId': self.event_id,
                    'currentPerformanceId': self.performance_id,
                    'currentTrackId': track.get('id') if track else None,
                },
                'error': status.get('error'),
            }
