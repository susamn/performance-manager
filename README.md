# Performance Manager

A complete web application for managing performances at cultural events. Built with Vue.js + TypeScript + Tailwind CSS frontend and Python Flask backend.

## Features

- **Performance Management**: Create, edit, and organize performances
- **Media Player**: Built-in audio player with seekbar, play/pause/stop controls
- **File Upload**: Support for MP3, MP4, AAC, M4A, WAV, FLAC audio formats
- **Drag & Drop**: Reorder performances with intuitive drag and drop
- **Keyboard Controls**: Space for play/pause, double-space for stop
- **Audio Streaming**: Range request support for efficient audio streaming
- **Data Persistence**: All data stored in `~/.config/performance-manager`
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### 🚀 One-Command Start (Recommended)

```bash
./quick-start.sh start
```

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
3. Use player controls or keyboard shortcuts:
   - **Space**: Play/Pause
   - **Space x2**: Stop and reset to beginning

### Managing Performances

- **Drag & Drop**: Use the drag handle (⋮⋮) to reorder performances
- **Mark Done**: Click "Mark Done" to gray out completed performances
- **Delete**: Click the trash icon to remove a performance

## Data Storage

All data is stored in `~/.config/performance-manager/`:
- `performances.json`: Performance metadata
- `<performance-id>/`: Audio files for each performance

## API Endpoints

- `GET /api/performances` - List all performances
- `POST /api/performances` - Create new performance
- `PUT /api/performances/<id>` - Update performance
- `DELETE /api/performances/<id>` - Delete performance
- `POST /api/performances/<id>/upload` - Upload track file
- `GET /api/performances/<id>/files/<filename>` - Stream audio file
- `POST /api/performances/reorder` - Reorder performances

## Testing

Run the comprehensive test suite:

```bash
cd frontend
npm test
```

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
- Modern web browser with HTML5 audio support

## Browser Compatibility

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - see LICENSE file for details.# performance-manager
