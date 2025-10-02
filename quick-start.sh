#!/bin/bash

# Performance Manager - Quick Start Script
# Usage: ./quick-start.sh {start|stop|restart|status|logs|build|help} [port]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

# Config directory setup
CONFIG_DIR="$HOME/.config/performance-manager"
PID_FILE="$CONFIG_DIR/performance-manager.pid"
LOG_FILE="$CONFIG_DIR/performance-manager.log"
PORT_FILE="$CONFIG_DIR/.port"
PORT=${PORT:-5000}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to ensure config directory exists
ensure_config_dir() {
    if [ ! -d "$CONFIG_DIR" ]; then
        echo -e "${YELLOW}📁 Creating config directory: $CONFIG_DIR${NC}"
        mkdir -p "$CONFIG_DIR"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Config directory created successfully${NC}"
        else
            echo -e "${RED}❌ Failed to create config directory${NC}"
            exit 1
        fi
    fi
}

# Function to check if process is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            rm -f "$PORT_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to build frontend
build_frontend() {
    echo -e "${BLUE}🏗️  Building frontend...${NC}"

    if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        cd "$PROJECT_DIR/frontend"
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
            exit 1
        fi
    fi

    cd "$PROJECT_DIR/frontend"
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend built successfully${NC}"
    else
        echo -e "${RED}❌ Frontend build failed${NC}"
        exit 1
    fi

    cd "$PROJECT_DIR"
}

# Function to setup backend dependencies
setup_backend() {
    echo -e "${YELLOW}🐍 Setting up backend dependencies...${NC}"

    # Check if virtual environment exists
    if [ ! -d "$PROJECT_DIR/venv" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv "$PROJECT_DIR/venv"
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to create virtual environment${NC}"
            exit 1
        fi
    fi

    # Install backend dependencies
    "$PROJECT_DIR/venv/bin/pip" install -r "$PROJECT_DIR/backend/requirements.txt" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend dependencies ready${NC}"
    else
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
}

# Function to start the application
start_app() {
    # Ensure config directory exists
    ensure_config_dir

    # Parse port argument
    local start_port="$PORT"
    for arg in "$@"; do
        if [[ "$arg" =~ ^[0-9]+$ ]]; then
            start_port="$arg"
            echo -e "${BLUE}🔧 Using specified port: $start_port${NC}"
        fi
    done

    if is_running; then
        local pid=$(cat "$PID_FILE")
        local current_port="$start_port"
        if [ -f "$PORT_FILE" ]; then
            current_port=$(cat "$PORT_FILE")
        fi
        echo -e "${YELLOW}Performance Manager is already running (PID: $pid)${NC}"
        echo -e "${BLUE}📍 Access at: http://127.0.0.1:$current_port${NC}"
        return
    fi

    # Check if frontend is built
    if [ ! -d "$PROJECT_DIR/frontend/dist" ]; then
        echo -e "${YELLOW}⚠️  Frontend not built. Building now...${NC}"
        build_frontend
    fi

    # Setup backend
    setup_backend

    echo -e "${PURPLE}🎵 Starting Performance Manager on port $start_port...${NC}"

    # Start using Python start script
    cd "$PROJECT_DIR/backend"
    python3 start.py --port "$start_port" &
    local start_pid=$!

    # Wait a moment and check if it started successfully
    sleep 3
    if is_running; then
        local pid=$(cat "$PID_FILE")
        echo -e "${GREEN}✅ Performance Manager started successfully (PID: $pid)${NC}"
        echo -e "${BLUE}📍 Access at: http://127.0.0.1:$start_port${NC}"
        echo -e "${PURPLE}🎭 Cultural Events Performance Management System${NC}"
        echo -e "${YELLOW}📝 Logs: $LOG_FILE${NC}"
        echo -e "${BLUE}📁 Config: $CONFIG_DIR${NC}"
    else
        echo -e "${RED}❌ Failed to start Performance Manager${NC}"
        echo -e "${YELLOW}Check logs: $LOG_FILE${NC}"
    fi
}

# Function to stop the application
stop_app() {
    echo -e "${YELLOW}⏹️  Stopping Performance Manager...${NC}"
    cd "$PROJECT_DIR/backend"
    python3 stop.py
}

# Function to show status
show_status() {
    cd "$PROJECT_DIR/backend"
    python3 stop.py status
}

# Function to show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}📝 Recent logs:${NC}"
        tail -20 "$LOG_FILE"
    else
        echo -e "${RED}❌ No log file found${NC}"
    fi
}

# Function to build everything
build_all() {
    echo -e "${BLUE}🏗️  Building Performance Manager...${NC}"
    build_frontend
    setup_backend
    echo -e "${GREEN}✅ Build completed successfully${NC}"
}

# Function to run development mode
dev_mode() {
    echo -e "${BLUE}🔧 Starting Development Mode...${NC}"
    echo -e "${YELLOW}This will start frontend and backend in development mode${NC}"
    echo -e "${YELLOW}Frontend: http://localhost:5173${NC}"
    echo -e "${YELLOW}Backend: http://localhost:5000${NC}"
    echo ""

    # Start backend in background
    echo -e "${BLUE}Starting backend...${NC}"
    cd "$PROJECT_DIR/backend"
    python3 app.py &
    BACKEND_PID=$!

    # Wait a moment for backend to start
    sleep 2

    # Start frontend
    echo -e "${BLUE}Starting frontend...${NC}"
    cd "$PROJECT_DIR/frontend"
    npm run dev &
    FRONTEND_PID=$!

    echo -e "${GREEN}✅ Development servers started${NC}"
    echo -e "${BLUE}📍 Frontend: http://localhost:5173${NC}"
    echo -e "${BLUE}📍 Backend: http://localhost:5000${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

    # Wait for user interrupt
    trap "echo -e '${YELLOW}\n⏹️  Stopping development servers...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
    wait
}

# Function to show help
show_help() {
    echo -e "${PURPLE}🎵 Performance Manager - Quick Start${NC}"
    echo -e "${BLUE}Usage: $0 {command} [port]${NC}"
    echo ""
    echo -e "${BLUE}Available commands:${NC}"
    echo -e "  ${YELLOW}start [port]${NC}     - Start Performance Manager (default port: 5000)"
    echo -e "  ${YELLOW}stop${NC}             - Stop Performance Manager"
    echo -e "  ${YELLOW}restart [port]${NC}   - Restart Performance Manager"
    echo -e "  ${YELLOW}status${NC}           - Check if Performance Manager is running"
    echo -e "  ${YELLOW}logs${NC}             - Show recent logs"
    echo -e "  ${YELLOW}build${NC}            - Build frontend and setup backend"
    echo -e "  ${YELLOW}dev${NC}              - Start development mode (hot reload)"
    echo -e "  ${YELLOW}help${NC}             - Show this help message"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo -e "  ${YELLOW}./quick-start.sh start${NC}       # Start on default port (5000)"
    echo -e "  ${YELLOW}./quick-start.sh start 3000${NC}  # Start on port 3000"
    echo -e "  ${YELLOW}./quick-start.sh restart 8080${NC} # Restart on port 8080"
    echo -e "  ${YELLOW}./quick-start.sh dev${NC}         # Development mode"
    echo ""
    echo -e "${PURPLE}🎯 Features:${NC}"
    echo -e "  • Performance Management System for Cultural Events"
    echo -e "  • Audio File Upload & Streaming (MP3, MP4, AAC, etc.)"
    echo -e "  • Drag & Drop Performance Reordering"
    echo -e "  • Media Player with Keyboard Controls"
    echo -e "  • Automatic Data Persistence"
    echo ""
    echo -e "${BLUE}📁 Data Storage: ~/.config/performance-manager/${NC}"
}

# Main script logic
case "${1:-help}" in
    "start")
        shift
        start_app "$@"
        ;;
    "stop")
        stop_app
        ;;
    "restart")
        stop_app
        sleep 2
        shift
        start_app "$@"
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "build")
        build_all
        ;;
    "dev")
        dev_mode
        ;;
    "help"|*)
        show_help
        ;;
esac