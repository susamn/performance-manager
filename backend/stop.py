#!/usr/bin/env python3
import os
import signal
import time
from pathlib import Path

def stop_server():
    config_dir = Path.home() / ".config" / "performance-manager"
    pid_file = config_dir / "performance-manager.pid"
    port_file = config_dir / ".port"

    if not pid_file.exists():
        from mpd_player import MPDPlayer
        MPDPlayer(config_dir).shutdown()
        print("❌ Performance Manager is not running (no PID file found)")
        return

    try:
        with open(pid_file, "r") as f:
            pid = int(f.read().strip())

        # Read current port for display
        current_port = "5000"
        if port_file.exists():
            with open(port_file, "r") as f:
                current_port = f.read().strip()

        print(f"⏹️  Stopping Performance Manager (PID: {pid}, Port: {current_port})...")

        # Try graceful shutdown first (SIGTERM)
        try:
            os.kill(pid, signal.SIGTERM)
            print("Sending graceful shutdown signal...")

            # Wait up to 10 seconds for graceful shutdown
            for i in range(10):
                time.sleep(1)
                try:
                    # Check if process still exists
                    os.kill(pid, 0)
                except ProcessLookupError:
                    # Process has stopped
                    print(f"✅ Performance Manager stopped gracefully")
                    break
            else:
                # Process still running after 10 seconds, force kill
                print("⚠️  Graceful shutdown timed out, force stopping...")
                os.kill(pid, signal.SIGKILL)
                time.sleep(1)
                print(f"✅ Performance Manager force stopped")

        except ProcessLookupError:
            print("❌ Process not found (may have already stopped)")

        # Stop only Performance Manager's private MPD instance.
        from mpd_player import MPDPlayer
        MPDPlayer(config_dir).shutdown()

        # Clean up PID and port files
        if pid_file.exists():
            pid_file.unlink()
        if port_file.exists():
            port_file.unlink()

        print("🧹 Cleaned up PID and port files")

    except ValueError:
        print("❌ Invalid PID file format")
        pid_file.unlink()  # Clean up corrupted PID file
    except PermissionError:
        print("❌ Permission denied - cannot stop process")
    except Exception as e:
        print(f"❌ Error stopping server: {e}")

def show_status():
    """Show current status of the Performance Manager"""
    config_dir = Path.home() / ".config" / "performance-manager"
    pid_file = config_dir / "performance-manager.pid"
    port_file = config_dir / ".port"

    if not pid_file.exists():
        print("❌ Performance Manager is not running")
        return False

    try:
        with open(pid_file, "r") as f:
            pid = int(f.read().strip())

        # Check if process is actually running
        try:
            os.kill(pid, 0)  # This will raise OSError if process doesn't exist

            # Read current port
            current_port = "5000"
            if port_file.exists():
                with open(port_file, "r") as f:
                    current_port = f.read().strip()

            print(f"✅ Performance Manager is running (PID: {pid})")
            print(f"📍 Access at: http://127.0.0.1:{current_port}")
            print(f"📁 Config: {config_dir}")
            return True

        except (OSError, ProcessLookupError):
            print("❌ Performance Manager process not found (stale PID file)")
            # Clean up stale PID file
            pid_file.unlink()
            if port_file.exists():
                port_file.unlink()
            return False

    except (ValueError, FileNotFoundError):
        print("❌ Invalid or missing PID file")
        if pid_file.exists():
            pid_file.unlink()
        return False

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "status":
        show_status()
    else:
        stop_server()