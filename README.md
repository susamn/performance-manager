# Performance Manager

A complete web application for managing performances at cultural events. Built with Vue.js + TypeScript + Tailwind CSS frontend and Python Flask backend.

## Features

- **Performance Management**: Create, edit, and organize performances
- **Media Player**: Browser controls local MPD playback on the server machine (seek/play/pause/stop)
- **File Upload**: Support for MP3, MP4, AAC, M4A, WAV, FLAC audio formats
- **Drag & Drop**: Reorder performances with intuitive drag and drop
- **Keyboard Controls**: Space for play/pause, double-space for stop
- **Local MPD Playback**: Original audio files decoded by MPD; browsers do not stream/play audio
- **Data Persistence**: All data stored in `~/.config/performance-manager`
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### 🚀 One-Command Start (Recommended)

```bash
./quick-start.sh start
```

Requires `mpd` with PipeWire output support installed and an active PipeWire session on the server machine. MPD starts on demand in a **separate private instance**, not your existing MPD setup. Audio comes from the server machine's speakers, even when controlling the web page remotely.

This single command will:
- Install all dependencies (frontend + backend)
- Build the frontend
- Start the server on port 5000
- Create all necessary config directories

### 📋 Available Commands

```bash
./quick-start.sh start [port]     # Start Performance Manager (default: 5000)
./quick-start.sh stop             # Stop Performance Manager
./quick-start.sh restart [port]   # Restart Performance Manager
./quick-start.sh status           # Check if running
./quick-start.sh logs             # Show recent logs
./quick-start.sh build            # Build frontend + setup backend
./quick-start.sh dev              # Development mode (hot reload)
./quick-start.sh help             # Show help
```

### 🔧 Advanced Usage

```bash
# Start on custom port
./quick-start.sh start 3000

# Development mode (separate frontend/backend)
./quick-start.sh dev

# Manual backend management
cd backend
python3 start.py --port 8080     # Start backend only
python3 stop.py                  # Stop backend
python3 stop.py status           # Check status
```

## Project Structure

```
performance-manager/
├── frontend/                 # Vue.js frontend
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── stores/          # Pinia stores
│   │   ├── types/           # TypeScript types
│   │   └── views/           # Page components
│   ├── tests/               # Frontend tests
│   └── package.json
├── backend/                 # Flask backend
│   ├── app.py              # Main Flask application
│   ├── mpd_player.py       # Private MPD daemon, queue, and control protocol
│   └── requirements.txt
└── tests/                   # Integration tests
```

## Usage

### Creating Performances

1. Enter a performance name in the "Add Performance" form
2. Click "Create Performance"
3. The new performance appears in the list

### Adding Tracks

1. Select a performance from the list
2. Enter performer name
3. Choose audio files (MP3, MP4, AAC, etc.)
4. Click "Upload" to add tracks

### Playing Music

1. Click on a performance to select it
2. Click on any track to load it into the player
3. Press Play in the browser control panel; the sound comes from the **server machine**, not the browser.
4. Continuous Play queues tracks in performance order, repeats from the first track, and asks MPD to crossfade for 10 seconds. MPD crossfades only between tracks with compatible audio formats; we do not force resampling to preserve audio quality.

### Managing Performances

- **Drag & Drop**: Use the drag handle (⋮⋮) to reorder performances
- **Mark Done**: Click "Mark Done" to gray out completed performances
- **Delete**: Click the trash icon to remove a performance

## Data Storage

All data is stored in `~/.config/performance-manager/`:
- `performances.json`: Performance metadata
- `<performance-id>/`: Audio files for each performance

## Playback API

- `GET /api/events/<event_id>/player/state` - Current MPD track, position, and status
- `POST /api/events/<event_id>/player/load` - Queue a track without starting it
- `POST /api/events/<event_id>/player/control` - Play, pause, stop, seek, rewind
- `POST /api/events/<event_id>/player/continuous` - Repeat queue and set MPD crossfade

Mutating endpoints require the event's admin bearer token (obtained when unlocking). A validated Live PIN also permits remote playback commands over Socket.IO. The dedicated MPD config, log, and UNIX socket are in `~/.config/performance-manager/mpd/`. Playback errors appear in the player UI; startup diagnostics are in `mpd/startup.log`. The existing audio-file endpoint remains available for downloads but is not used for playback.

## Testing

Run the comprehensive test suite:

```bash
cd frontend
npm test
```

Run backend tests with `cd backend && ../venv/bin/pytest -q`. MPD audio playback itself requires a local PipeWire session.

Tests cover:
- Component functionality
- Store logic
- API integration
- Keyboard controls
- File upload/playback

## Development

### Adding New Features

1. Update TypeScript types in `frontend/src/types/`
2. Add/modify Vue components in `frontend/src/components/`
3. Update Pinia stores for state management
4. Add backend API endpoints if needed
5. Write tests for new functionality

### Code Style

- Frontend: Vue 3 Composition API with TypeScript
- Backend: Python with Flask
- Styling: Tailwind CSS with custom performance manager theme
- Testing: Vitest for frontend, Python unittest for backend

## System Requirements

- Node.js 16+ (for frontend development)
- Python 3.8+ (for backend)
- MPD with PipeWire output on the machine running the backend
- Modern browser (controls only; no browser audio required)

## Browser Compatibility

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - see LICENSE file for details.# performance-manager
