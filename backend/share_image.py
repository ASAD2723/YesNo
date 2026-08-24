"""Renders a clean, branded 1200x630 YES/NO share card as a PNG."""
import io
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASSETS = Path(__file__).parent / "assets" / "fonts"

BG = (253, 253, 253)
FG = (10, 10, 10)
GRAY = (115, 115, 115)
LIGHT = (165, 165, 165)
BORDER = (225, 225, 225)


def _font(filename: str, size: int, weight: int | None = None) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(ASSETS / filename), size)
    if weight is not None:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def _wrap(draw, text, font, max_width, max_lines=2):
    words = text.split()
    lines, current = [], ""
    for w in words:
        trial = f"{current} {w}".strip()
        if draw.textlength(trial, font=font) <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = w
            if len(lines) == max_lines:
                break
    if current and len(lines) < max_lines:
        lines.append(current)
    # Ellipsis if truncated
    if len(lines) == max_lines:
        remaining = len(" ".join(words))
        shown = len(" ".join(lines))
        if shown < remaining:
            last = lines[-1]
            while draw.textlength(last + "…", font=font) > max_width and last:
                last = last[:-1]
            lines[-1] = last.rstrip() + "…"
    return lines


def render_card(question: str, result: dict) -> bytes:
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    d.rectangle([26, 26, W - 26, H - 26], outline=BORDER, width=2)

    logo_font = _font("PlayfairDisplay.ttf", 46, 800)
    small_font = _font("Outfit.ttf", 22, 600)
    q_font = _font("Outfit.ttf", 38, 500)
    answer_font = _font("PlayfairDisplay.ttf", 230, 900)
    prob_font = _font("Outfit.ttf", 34, 600)
    tag_font = _font("Outfit.ttf", 23, 400)

    pad = 72

    # Header
    d.text((pad, 52), "yesno", font=logo_font, fill=FG)
    tn = "YES · NO"
    tw = d.textlength(tn, font=small_font)
    d.text((W - pad - tw, 70), tn, font=small_font, fill=LIGHT, features=[])

    # Question (centered, up to 2 lines)
    q = (question or "").strip().strip('"')
    lines = _wrap(d, q, q_font, W - pad * 2, max_lines=2)
    y = 170
    for line in lines:
        lw = d.textlength(line, font=q_font)
        d.text(((W - lw) / 2, y), line, font=q_font, fill=GRAY)
        y += 50

    # Big answer
    answer = result.get("answer", "YES")
    ab = d.textbbox((0, 0), answer, font=answer_font)
    aw = ab[2] - ab[0]
    ah = ab[3] - ab[1]
    ax = (W - aw) / 2 - ab[0]
    ay = 300 - ab[1]
    d.text((ax, ay), answer, font=answer_font, fill=FG)

    # Probability line for non-definite answers
    certainty = result.get("certainty", "")
    definite = certainty in ("DEFINITE_YES", "DEFINITE_NO")
    if not definite:
        yes = result.get("yesProbability", 50)
        no = result.get("noProbability", 100 - yes)
        prob = f"{yes}% YES   ·   {no}% NO"
        pw = d.textlength(prob, font=prob_font)
        d.text(((W - pw) / 2, 512), prob, font=prob_font, fill=FG)

    # Footer tagline
    tag = "Ask anything. Get a clear answer."
    tgw = d.textlength(tag, font=tag_font)
    d.text(((W - tgw) / 2, 560), tag, font=tag_font, fill=LIGHT)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
