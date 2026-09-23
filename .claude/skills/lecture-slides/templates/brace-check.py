#!/usr/bin/env python3
"""Flag dimension braces that point the wrong way. Run it on every deck you touch.

    python3 brace-check.py <deck>.tex [...]

TikZ's decoration={brace} puts the brace's central TIP on the LEFT-HAND SIDE of the
direction of travel, so the same two coordinates give opposite braces depending only
on which one is written first. Both compile clean and the source looks right either
way, which is why this defect keeps coming back: it is invisible until the page is
rendered, and at slide scale a brace is about 40 px.

The rule, and what this script checks:

    label BELOW a horizontal brace  ->  draw right to left
    label ABOVE a horizontal brace  ->  draw left to right
    label LEFT of a vertical brace  ->  draw bottom to top
    label RIGHT of a vertical brace ->  draw top to bottom

It pairs each brace with the first label node that follows it in the source (the
style whose name contains "lab", e.g. dimlab), reads both sets of coordinates, and
reports any pair whose label sits on the side the brace's tip points away from.

Limits: it only sees literal numeric coordinates in the same file, so a brace whose
path is built from named anchors or a calc expression is reported as "unchecked" and
has to be eyeballed on a rendered page.
"""
import re
import sys

NUM = r"[-+]?\d*\.?\d+"
BRACE = re.compile(
    r"\\draw\[[^\]]*\bdimbrace\b[^\]]*\]\s*\((" + NUM + r"),(" + NUM + r")\)\s*"
    r"-" + r"-\s*\((" + NUM + r"),(" + NUM + r")\)")
LABEL = re.compile(r"\\node\[[^\]]*lab[^\]]*\][^;]*?at\s*\((" + NUM + r"),(" + NUM + r")\)")
UNCHECKABLE = re.compile(r"\\draw\[[^\]]*\bdimbrace\b")


def check(path):
    src = open(path, encoding="utf-8").read()
    problems, checked = [], 0
    for m in BRACE.finditer(src):
        x1, y1, x2, y2 = (float(g) for g in m.groups())
        label = LABEL.search(src, m.end(), m.end() + 400)
        if not label:
            problems.append((line_of(src, m.start()), "no label found after this brace"))
            continue
        lx, ly = float(label.group(1)), float(label.group(2))
        checked += 1
        line = line_of(src, m.start())
        if abs(x1 - x2) < 1e-6:                      # vertical brace
            tip_is_left = y2 > y1                    # travelling up, tip points left
            label_is_left = lx < x1
            if tip_is_left != label_is_left:
                problems.append((line, "vertical brace: label is on the %s, so draw %s"
                                 % ("left" if label_is_left else "right",
                                    "bottom to top" if label_is_left else "top to bottom")))
        elif abs(y1 - y2) < 1e-6:                    # horizontal brace
            tip_is_up = x2 > x1                      # travelling right, tip points up
            label_is_up = ly > y1
            if tip_is_up != label_is_up:
                problems.append((line, "horizontal brace: label is %s, so draw %s"
                                 % ("above" if label_is_up else "below",
                                    "left to right" if label_is_up else "right to left")))
    total = len(UNCHECKABLE.findall(src))
    return problems, checked, total


def line_of(src, pos):
    return src.count("\n", 0, pos) + 1


def main(paths):
    bad = 0
    for path in paths:
        problems, checked, total = check(path)
        for line, why in problems:
            print("%s:%d  %s" % (path, line, why))
            bad += 1
        skipped = total - checked - len([p for p in problems if "no label" in p[1]])
        note = ", %d not checkable from the source" % skipped if skipped > 0 else ""
        print("%s: %d brace(s) checked%s" % (path, checked, note))
    print("%d brace(s) to fix" % bad)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
