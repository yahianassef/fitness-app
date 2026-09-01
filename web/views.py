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


def connect(request):
    """A phone-friendly landing page with a QR code to open the app on iOS/Android."""
    port = request.get_port() or "8000"
    host_ip = lan_ip()
    url = f"http://{host_ip}:{port}/"
    same_network = host_ip != "127.0.0.1"
    return render(request, "web/connect.html", {
        "url": url,
        "host_ip": host_ip,
        "port": port,
        "qr_svg": _qr_svg(url),
        "same_network": same_network,
    })
