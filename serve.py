"""Friendly launcher — starts the app and shows how to open it on your phone.

    python serve.py            # binds to 0.0.0.0:8000 (reachable from your iPhone)
    python serve.py 9000       # use a different port

It prints your computer's Wi-Fi address and a scannable QR code, then hands off to
Django's normal `runserver`.
"""
import os
import socket
import sys

# Best-effort UTF-8 console so the box + QR render on Windows Terminal / modern shells.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def main():
    port = "8000"
    for arg in sys.argv[1:]:
        if arg.isdigit():
            port = arg

    ip = lan_ip()
    url = f"http://{ip}:{port}/"
    connect_url = f"{url}connect"

    # Django's autoreloader runs this file twice (parent + worker). Only the
    # parent process has RUN_MAIN unset — print the banner there, once.
    if os.environ.get("RUN_MAIN") == "true":
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
        from django.core.management import execute_from_command_line
        execute_from_command_line(["manage.py", "runserver", f"0.0.0.0:{port}"])
        return

    line = "-" * 58
    print(f"\n{line}")
    print("  Fitness Comeback is starting...\n")
    print(f"  On this computer :  http://127.0.0.1:{port}/")
    print(f"  On your phone    :  {url}")
    print(f"  Phone setup page :  {connect_url}")
    print(f"                      ^ open this on the computer for a big QR code")
    print(f"{line}\n")

    try:
        import qrcode
        qr = qrcode.QRCode(border=1)
        qr.add_data(url)
        qr.make(fit=True)
        qr.print_ascii(invert=True)
        print(f"\n  Scan with the iPhone Camera app  ->  {url}\n")
    except Exception:  # noqa: BLE001 - QR in the terminal is a nice-to-have, never fatal
        print(f"  Open {connect_url} on this computer to get a scannable QR code.\n")

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    from django.core.management import execute_from_command_line

    execute_from_command_line(["manage.py", "runserver", f"0.0.0.0:{port}"])


if __name__ == "__main__":
    main()
