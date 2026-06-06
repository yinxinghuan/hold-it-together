#!/usr/bin/env python3
"""Generate the 11-step 内耗 face ladder for Hold It Together「撑住别崩」.

Unlike Build-a-Boyfriend (11 DIFFERENT men), this is ONE recurring character whose
expression degrades from calm & rested (0) to totally burnt out & shattered (10).
So every prompt repeats the SAME character anchor and only the expression / signs of
burnout (eye bags, messy hair, tears, steam) escalate. txt2img via the aigram transit.
Run from this folder.  cut_bg.py then turns each into a head-only die-cut sticker."""
import json, os, ssl, subprocess, sys, time, urllib.request, urllib.error

_SSL = ssl.create_default_context(); _SSL.check_hostname = False; _SSL.verify_mode = ssl.CERT_NONE

# Transit endpoint: flat {prompt, ref_url?}, no user_id, no {query,params} wrapper.
# REQUIRED from non-browser clients: Origin must be aigram.app or you get 403.
API_URL = "https://chat.aiwaves.tech/aigram/api/gen-image"
HEADERS = {
    "Content-Type": "application/json",
    "Origin": "https://aigram.app",
    "Referer": "https://aigram.app/",
    "User-Agent": "Mozilla/5.0",
}
TIMEOUT = int(os.environ.get("GEN_TIMEOUT", "360"))
OUT_DIR = os.path.join(os.path.dirname(__file__), "public", "faces")

# Fixed identity, repeated verbatim so the 11 frames read as ONE person.
# Kept deliberately simple (easy for txt2img to reproduce): round face, messy short
# black hair, thick brows, no glasses (so the eyes can carry the emotion).
CHAR = ("the SAME single recurring cartoon character throughout: ONE young person with a "
        "round soft face, messy short black hair, thick dark eyebrows, a small simple nose, "
        "no glasses, an ordinary relatable young office worker")

STYLE = ("a single die-cut STICKER of this person's HEAD, bold thick clean black ink outline, "
         "flat cel-shaded solid color fills, simple chunky cartoon shapes, playful comedic "
         "caricature, a clean white sticker border hugging the silhouette. "
         "CRITICAL: draw ONLY the head and hair — the silhouette ENDS AT THE JAW AND CHIN like "
         "a single emoji head. NO neck, NO neck stub, NO shoulders, NO collar, NO body. "
         "Big expressive head facing camera, head centered, FLAT SOLID UNIFORM MEDIUM GREY "
         "background, no gradient, no texture, no scenery, no drop shadow, no text, no "
         "watermark, no logo")

# 0 = full 心力 (calm) → 10 = 心力 zero (shattered). Hair gets messier & eye-bags deepen
# as it worsens, so the arc reads even at a glance.
TIERS = [
    # 0 状态在线
    "calm and well-rested, bright clear eyes, a genuine relaxed gentle confident smile, "
    "neat tidy hair, looking fresh and put-together",
    # 1 略微疲惫
    "a little tired but still fine, a small polite closed-lip smile, very faintly droopy "
    "eyelids, hair still mostly neat",
    # 2 有点烦
    "a flat unimpressed neutral expression, lips pressed into a straight line, one eyebrow "
    "faintly raised, mildly annoyed and over it",
    # 3 emo初期
    "quietly down and gloomy, a faint downturned frown, a distant tired far-off gaze, the "
    "first faint shadows under the eyes, hair slightly messier",
    # 4 内耗中
    "anxious and overthinking, worried brows furrowed together, lightly biting the lower lip, "
    "a nervous sideways worried glance, light eye bags",
    # 5 精神内耗
    "visibly stressed and frazzled, a tense forced strained smile that does not reach the "
    "eyes, clear dark circles under the eyes, messy hair",
    # 6 重度内耗
    "exhausted and hollow, a blank dead thousand-yard stare, heavy puffy eye bags, drained "
    "and pale, noticeably messy unkempt hair",
    # 7 心力告急
    "on the verge of tears, glassy watery shining eyes, a trembling wobbling lower lip, "
    "eyebrows raised in distress, unable to fake a smile anymore, tired messy hair",
    # 8 濒临崩溃
    "crying, one big tear rolling down the cheek, a scrunched-up anguished face, a quivering "
    "frown, deep dark circles, disheveled messy hair",
    # 9 一点就炸
    "furious and about to snap, gritted bared teeth, one twitching bloodshot eye, a red "
    "flushed face, eyebrows slammed down in rage, frazzled hair sticking up, a tiny puff of "
    "steam from the head",
    # 10 已崩
    "completely shattered and burnt out, blank empty hollow swirling spiral eyes, a wide "
    "open silent-scream mouth, totally fried and falling apart, heavy dark circles, wild "
    "chaotic disheveled hair, utterly broken",
]


def call(prompt, retries=3):
    payload = json.dumps({"prompt": prompt}).encode()
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(API_URL, data=payload, headers=HEADERS, method="POST")
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=_SSL) as r:
                body = json.loads(r.read())
            url = body.get("url")
            if not url:
                raise RuntimeError(f"no url in response: {body}")
            return url
        except urllib.error.HTTPError as e:
            try:
                msg = e.read().decode("utf-8", "replace")[:200]
            except Exception:
                msg = ""
            last = RuntimeError(f"HTTP {e.code}: {msg}")
            print(f"  retry {attempt+1}/{retries} after HTTP {e.code}")
        except Exception as e:
            last = e
            print(f"  retry {attempt+1}/{retries} after {e}")
        time.sleep(8 * (attempt + 1))
    print(f"  FAILED: {last}")
    return None


def download(url, out):
    src = os.path.splitext(url.split("?")[0])[1].lower() or ".png"
    tmp = out + src
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60, context=_SSL) as r:
        data = r.read()
    with open(tmp, "wb") as f:
        f.write(data)
    if src != ".png":
        subprocess.run(["sips", "-s", "format", "png", tmp, "--out", out], check=True, capture_output=True)
        os.remove(tmp)
    else:
        os.rename(tmp, out)
    print(f"  saved {out} ({os.path.getsize(out)//1024} KB)")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    only = [int(a) for a in sys.argv[1:]] if len(sys.argv) > 1 else list(range(len(TIERS)))
    for i in only:
        out = os.path.join(OUT_DIR, f"face{i}.png")
        if os.path.isfile(out) and os.path.getsize(out) > 1024:
            print(f"[face{i}] already exists, skip"); continue
        prompt = f"{CHAR}, {TIERS[i]}, {STYLE}"
        print(f"\n[face{i}] {TIERS[i][:60]}...")
        url = call(prompt)
        if not url:
            print(f"  FAILED face{i}"); continue
        print(f"  -> {url}")
        download(url, out)
        time.sleep(3)
    print("\ndone")


if __name__ == "__main__":
    main()
