#!/usr/bin/env python3
import tkinter as tk
from tkinter import messagebox
import subprocess
import json
import urllib.request
import os
import sys

APPSTORE_URL = "https://camcookie876.github.io/appstore.json"
HOME = os.path.expanduser("~")
LOCAL_DB = os.path.join(HOME, ".camcookie_installed.json")

# ---------- Installed versions database ----------

def load_local_versions():
    if not os.path.exists(LOCAL_DB):
        return {}
    try:
        with open(LOCAL_DB, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def save_local_versions(db):
    with open(LOCAL_DB, "w") as f:
        json.dump(db, f)

# ---------- Expand $HOME in commands ----------

def expand_home(text):
    if isinstance(text, str):
        return text.replace("$HOME", HOME)
    return text

def expand_list(cmds):
    return [expand_home(c) for c in cmds]

# ---------- Remote catalog ----------

def load_catalog():
    with urllib.request.urlopen(APPSTORE_URL) as response:
        data = response.read().decode()
        return json.loads(data)["apps"]

# ---------- File creation from JSON ----------

def create_files(app):
    files = app.get("files", [])
    for file in files:
        path = expand_home(file["path"])
        content = file["content"]
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w") as f:
                f.write(content)
            os.chmod(path, 0o755)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to write file {path}:\n{e}")

# ---------- Install logic ----------

def install_app(app):
    create_files(app)

    try:
        cmds = expand_list(app["install"])
        for cmd in cmds:
            subprocess.run(cmd, shell=True, check=True)

        local_versions[app["id"]] = app["version"]
        save_local_versions(local_versions)

        messagebox.showinfo(
            "Installed",
            f"{app['name']} v{app['version']} installed successfully."
        )
    except Exception as e:
        messagebox.showerror("Error", f"Install failed:\n{e}")

# ---------- Launch logic ----------

def launch_app(app):
    try:
        launch_cmd = expand_home(app["launch"])
        subprocess.Popen(launch_cmd, shell=True)
    except Exception as e:
        messagebox.showerror("Error", f"Launch failed:\n{e}")

# ---------- Install button handler (version logic) ----------

def handle_install(app):
    app_id = app["id"]
    remote_version = app["version"]
    local_version = local_versions.get(app_id)

    if local_version is None:
        install_app(app)
        return

    if local_version == remote_version:
        messagebox.showinfo(
            "Installed",
            f"{app['name']} v{remote_version} is already installed."
        )
        return

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

# ---------- Self-update for appstore ----------

def check_self_update(apps):
    appstore_entry = None
    for app in apps:
        if app["id"] == "appstore":
            appstore_entry = app
            break

    if appstore_entry is None:
        return

    remote_version = appstore_entry["version"]
    local_version = local_versions.get("appstore")

    if local_version != remote_version:
        messagebox.showinfo(
            "Appstore Update Required",
            f"A new version of Camcookie Appstore is available.\n\n"
            f"Installed: {local_version}\n"
            f"Available: {remote_version}\n\n"
            "Updating now..."
        )

        create_files(appstore_entry)

        try:
            cmds = expand_list(appstore_entry["install"])
            for cmd in cmds:
                subprocess.run(cmd, shell=True, check=True)

            local_versions["appstore"] = remote_version
            save_local_versions(local_versions)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to update Appstore:\n{e}")
            sys.exit(1)

        os.execv(sys.executable, ["python3"] + sys.argv)

# ---------- Main ----------

def main():
    global local_versions

    if not os.path.exists(LOCAL_DB):
        with open(LOCAL_DB, "w") as f:
            f.write("{}")

    local_versions = load_local_versions()

    try:
        apps = load_catalog()
    except Exception as e:
        tk.Tk().withdraw()
        messagebox.showerror("Error", f"Failed to load app catalog:\n{e}")
        return

    check_self_update(apps)

    root = tk.Tk()
    root.title("Camcookie Appstore")
    root.geometry("600x520")

    title = tk.Label(root, text="Camcookie Appstore", font=("Arial", 20))
    title.pack(pady=10)

    canvas = tk.Canvas(root)
    scrollbar = tk.Scrollbar(root, orient="vertical", command=canvas.yview)
    scroll_frame = tk.Frame(canvas)

    scroll_frame.bind(
        "<Configure>",
        lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
    )

    canvas.create_window((0, 0), window=scroll_frame, anchor="nw")
    canvas.configure(yscrollcommand=scrollbar.set)

    canvas.pack(side="left", fill="both", expand=True)
    scrollbar.pack(side="right", fill="y")

    for app in apps:
        box = tk.Frame(scroll_frame, bd=2, relief="groove", padx=10, pady=10)
        box.pack(fill="x", pady=5)

        tk.Label(box, text=app["name"], font=("Arial", 16)).pack(anchor="w")
        tk.Label(box, text=app["description"], font=("Arial", 10), wraplength=550).pack(anchor="w")

        local_version = local_versions.get(app["id"])
        if local_version:
            version_text = f"Installed: {local_version} | Available: {app['version']}"
        else:
            version_text = f"Available: {app['version']}"

        tk.Label(box, text=version_text, font=("Arial", 9)).pack(anchor="w")

        btn_frame = tk.Frame(box)
        btn_frame.pack(anchor="e", pady=(5, 0))

        tk.Button(btn_frame, text="Install", command=lambda a=app: handle_install(a)).pack(side="left", padx=5)
        tk.Button(btn_frame, text="Launch", command=lambda a=app: launch_app(a)).pack(side="left", padx=5)

    root.mainloop()

if __name__ == "__main__":
    main()