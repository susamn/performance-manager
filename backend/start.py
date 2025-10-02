#!/usr/bin/env python3
import sys
import subprocess
import os
import argparse
from pathlib import Path

def setup_venv():
    # Get project root directory (backend parent)
    project_root = Path(__file__).parent.parent
    backend_dir = Path(__file__).parent
    os.chdir(project_root)
    venv_path = project_root / "venv"

    if not venv_path.exists():
        print("Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print("✓ Virtual environment created")

    # Get pip path
    if os.name == 'nt':  # Windows
        pip_path = venv_path / "Scripts" / "pip.exe"
        python_path = venv_path / "Scripts" / "python.exe"
    else:  # Unix/Linux/macOS
        pip_path = venv_path / "bin" / "pip"
        python_path = venv_path / "bin" / "python"

    # Install requirements
    requirements_file = backend_dir / "requirements.txt"
    if requirements_file.exists():
        print("Installing requirements...")
        subprocess.run([str(pip_path), "install", "-r", str(requirements_file)], check=True)
        print("✓ Requirements installed")

    return python_path, backend_dir

def start_server(port=5000):
    print("Setting up Performance Manager...")

    try:
        python_path, backend_dir = setup_venv()

        # Create config directory
        config_dir = Path.home() / ".config" / "performance-manager"
        config_dir.mkdir(parents=True, exist_ok=True)

        # Create PID file in config directory
        pid_file = config_dir / "performance-manager.pid"
        port_file = config_dir / ".port"
        log_file = config_dir / "performance-manager.log"

        # Check if already running
        if pid_file.exists():
            try:
                with open(pid_file, "r") as f:
                    existing_pid = int(f.read().strip())
                # Check if process is actually running
                os.kill(existing_pid, 0)  # This will raise OSError if process doesn't exist
                print(f"❌ Performance Manager is already running (PID: {existing_pid})")
                if port_file.exists():
                    with open(port_file, "r") as f:
                        current_port = f.read().strip()
                    print(f"📍 Access at: http://127.0.0.1:{current_port}")
                return
            except (OSError, ProcessLookupError):
                # Process not running, clean up stale PID file
                pid_file.unlink()

        # Write port to port file
        with open(port_file, "w") as f:
            f.write(str(port))

        # Write PID file
        with open(pid_file, "w") as f:
            f.write(str(os.getpid()))

        print("\n" + "="*60)
        print("🎵 Starting Performance Manager")
        print(f"📍 Server: http://127.0.0.1:{port}")
        print("🎭 Cultural Events Performance Management System")
        print("📁 Config: " + str(config_dir))
        print("📝 Logs: " + str(log_file))
        print("="*60 + "\n")

        # Change to backend directory and start the Flask app
        os.chdir(backend_dir)

        # Redirect output to log file
        with open(log_file, "w") as log:
            process = subprocess.Popen(
                [str(python_path), "app.py", "--port", str(port)],
                stdout=log,
                stderr=subprocess.STDOUT,
                cwd=backend_dir
            )

            # Update PID file with the actual process PID
            with open(pid_file, "w") as f:
                f.write(str(process.pid))

            print(f"✅ Performance Manager started successfully (PID: {process.pid})")
            print(f"📍 Access at: http://127.0.0.1:{port}")
            print(f"📝 Logs: tail -f {log_file}")

            # Wait for process to complete
            process.wait()

    except KeyboardInterrupt:
        print("\n⏹️  Server stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Clean up PID and port files
        config_dir = Path.home() / ".config" / "performance-manager"
        pid_file = config_dir / "performance-manager.pid"
        port_file = config_dir / ".port"

        if pid_file.exists():
            pid_file.unlink()
        if port_file.exists():
            port_file.unlink()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Start Performance Manager")
    parser.add_argument("--port", type=int, default=5000, help="Port to run the server on (default: 5000)")
    args = parser.parse_args()

    start_server(args.port)