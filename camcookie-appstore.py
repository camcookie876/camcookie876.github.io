import tkinter as tk
from tkinter import messagebox
import subprocess
import json
import urllib.request
import os
import sys

APPSTORE_URL = "https://camcookie876.github.io/appstore.json"
LOCAL_DB = os.path.expanduser("~/.camcookie_installed.json")

# ------------------------------
# Load installed versions
# ------------------------------
def load_local_versions():
    if not os.path.exists(LOCAL_DB):
        return {}
    with open(LOCAL_DB, "r") as f:
        return json.load(f)

def save_local_versions(db):
    with open(LOCAL_DB, "w") as f:
        json.dump(db, f)

# ------------------------------
# Load remote app catalog
# ------------------------------
def load_catalog():
    try:
        with urllib.request.urlopen(APPSTORE_URL) as response:
            data = response.read().decode()
            return json.loads(data)["apps"]
    except Exception as e:
        messagebox.showerror("Error", f"Failed to load appstore: {e}")
        return []

# ------------------------------
# Create files from JSON
# ------------------------------
def create_files(app):
    if "files" not in app:
        return
    for file in app["files"]:
        path = file["path"]
        content = file["content"]
        try:
            with open(path, "w") as f:
                f.write(content)
            os.chmod(path, 0o755)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to write file {path}: {e}")

# ------------------------------
# Install an app
# ------------------------------
def install_app(app):
    create_files(app)

    try:
        for cmd in app["install"]:
            subprocess.run(cmd, shell=True, check=True)

        local_versions[app["id"]] = app["version"]
        save_local_versions(local_versions)

        messagebox.showinfo("Installed", f"{app['name']} v{app['version']} installed successfully.")
    except Exception as e:
        messagebox.showerror("Error", f"Install failed: {e}")

# ------------------------------
# Launch an app
# ------------------------------
def launch_app(app):
    try:
        subprocess.Popen(app["launch"], shell=True)
    except Exception as e:
        messagebox.showerror("Error", f"Launch failed: {e}")

# ------------------------------
# Handle install button logic
# ------------------------------
def handle_install(app):
    app_id = app["id"]
    remote_version = app["version"]
    local_version = local_versions.get(app_id)

    # Not installed
    if local_version is None:
        install_app(app)
        return

    # Same version
    if local_version == remote_version:
        messagebox.showinfo("Installed", f"{app['name']} v{remote_version} is already installed.")
        return

    # Version conflict
    choice = messagebox.askyesno(
        "Version Conflict",
        f"{app['name']} has a different version installed.\n\n"
        f"Installed: {local_version}\n"
        f"Available: {remote_version}\n\n"
        "Install the new version?"
    )

    if choice:
        install_app(app)
    else:
        messagebox.showinfo("Keeping Version", "Keeping installed version.")

# ------------------------------
# Self-update logic
# ------------------------------
def check_self_update(apps):
    for app in apps:
        if app["id"] == "appstore":
            remote_version = app["version"]
            local_version = local_versions.get("appstore")

            if local_version != remote_version:
                messagebox.showinfo(
                    "Appstore Update Required",
                    f"A new version of Camcookie Appstore is available.\n\n"
                    f"Installed: {local_version}\n"
                    f"Available: {remote_version}\n\n"
                    "Updating now..."
                )
                install_app(app)
                os.execv(sys.executable, ["python3"] + sys.argv)

# ------------------------------
# MAIN PROGRAM
# ------------------------------
local_versions = load_local_versions()
apps = load_catalog()

check_self_update(apps)

root = tk.Tk()
root.title("Camcookie Appstore")
root.geometry("550x500")

title = tk.Label(root, text="Camcookie Appstore", font=("Arial", 20))
title.pack(pady=10)

frame = tk.Frame(root)
frame.pack(fill="both", expand=True)

for app in apps:
    box = tk.Frame(frame, bd=2, relief="groove", padx=10, pady=10)
    box.pack(fill="x", pady=5)

    tk.Label(box, text=app["name"], font=("Arial", 16)).pack(anchor="w")
    tk.Label(box, text=app["description"], font=("Arial", 10)).pack(anchor="w")

    local_version = local_versions.get(app["id"])
    if local_version:
        version_text = f"Installed: {local_version} | Available: {app['version']}"
    else:
        version_text = f"Available: {app['version']}"

    tk.Label(box, text=version_text, font=("Arial", 9)).pack(anchor="w")

    btn_frame = tk.Frame(box)
    btn_frame.pack(anchor="e")

    tk.Button(btn_frame, text="Install", command=lambda a=app: handle_install(a)).pack(side="left", padx=5)
    tk.Button(btn_frame, text="Launch", command=lambda a=app: launch_app(a)).pack(side="left", padx=5)

root.mainloop()