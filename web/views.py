import io
import socket

import qrcode
import qrcode.image.svg
from django.shortcuts import render


def spa(request, *args, **kwargs):
    """Serve the single-page app shell. The Vue router handles the rest."""
    return render(request, "web/index.html")


def lan_ip():
    """Best guess at this machine's address on the local network."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))  # no packets sent; just picks the outbound iface
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def _qr_svg(data):
    factory = qrcode.image.svg.SvgPathImage
    img = qrcode.make(data, image_factory=factory, box_size=11, border=2)
    buf = io.BytesIO()
    img.save(buf)
    return buf.getvalue().decode()


def _is_local_host(host):
    """True when the app is being served off this machine / the LAN, not the internet."""
    name = host.split(":")[0].lower()
    if name in ("localhost", "127.0.0.1", "0.0.0.0", "[::1]"):
        return True
    # Private IPv4 ranges used by home routers.
    return name.startswith(("10.", "192.168.", "172.16.", "172.17.", "172.18.",
                            "172.19.", "172.2", "172.30.", "172.31."))


def connect(request):
    """A phone-friendly landing page with a QR code to open the app on iOS/Android.

    When the app is deployed, the phone reaches it over the internet, so the QR
    must point at the public URL. Falling back to the machine's LAN IP is only
    correct for local development — on a host like Railway that IP is a private
    container address the phone can never reach.
    """
    host = request.get_host()
    hosted = not _is_local_host(host)

    if hosted:
        url = f"{request.scheme}://{host}/"
    else:
        host_ip = lan_ip()
        url = f"http://{host_ip}:{request.get_port() or '8000'}/"

    return render(request, "web/connect.html", {
        "url": url,
        "hosted": hosted,
        "port": request.get_port() or "8000",
        "qr_svg": _qr_svg(url),
        "same_network": hosted or lan_ip() != "127.0.0.1",
    })
