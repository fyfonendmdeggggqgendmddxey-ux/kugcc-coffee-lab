import json
import os

unified_path = os.path.join(os.path.dirname(__file__), "utils", "unified_grinders.json")
with open(unified_path, "r", encoding="utf-8") as f:
    unified_data = json.load(f)

# 1. Fellow Ode Gen 2 (1 to 11, 3 grids) -> label: X Yグリッド
ode_table = []
for gear in range(1, 12):
    max_grid = 1 if gear == 11 else 3
    for grid in range(max_grid):
        micron = (gear + grid/3.0) * 45 + 495
        ode_table.append({
            "label": f"{gear} {grid}グリッド",
            "microns": round(micron, 2)
        })
unified_data["Fellow Ode Gen 2"]["table"] = ode_table
unified_data["Fellow Ode Gen 2"]["description"] = "Virtual Micron Formula: Setting * 45 + 495"

# 2. Lagom P64 (0 to 10, 10 grids) -> label: Xギア Yグリッド
p64_table = []
for gear in range(0, 11):
    max_grid = 1 if gear == 10 else 10
    for grid in range(max_grid):
        micron = (gear + grid/10.0) * 64 + 336
        p64_table.append({
            "label": f"{gear}ギア {grid}グリッド",
            "microns": round(micron, 2)
        })
unified_data["Lagom P64"]["table"] = p64_table
unified_data["Lagom P64"]["description"] = "Virtual Micron Formula: Setting * 64 + 336"

# 3. Lagom casa (0 to 5 turns, 60 clicks per turn) -> label: X周目 Yクリック
casa_table = []
for turn in range(0, 6):
    max_click = 1 if turn == 5 else 60
    for click in range(max_click):
        micron = (turn * 60 + click) * 3.2 + 240
        casa_table.append({
            "label": f"{turn}周目 {click}クリック",
            "microns": round(micron, 2)
        })
unified_data["Lagom casa"]["table"] = casa_table
unified_data["Lagom casa"]["description"] = "Virtual Micron Formula: Total Clicks * 3.2 + 240"

# 4. XBLOOM FW-02C (1 to 80) -> label: X
xbloom_table = []
for setting in range(1, 81):
    micron = setting * 10.6 + 240
    xbloom_table.append({
        "label": str(setting),
        "microns": round(micron, 2)
    })
unified_data["XBLOOM FW-02C"]["table"] = xbloom_table
unified_data["XBLOOM FW-02C"]["description"] = "Virtual Micron Formula: Setting * 10.6 + 240"

# 5. Hario Mini Mill Slim (1 to 20) -> label: X
mini_table = []
for setting in range(1, 21):
    micron = setting * 44 + 280
    mini_table.append({
        "label": str(setting),
        "microns": round(micron, 2)
    })
unified_data["Hario Mini Mill Slim"]["table"] = mini_table
unified_data["Hario Mini Mill Slim"]["description"] = "Virtual Micron Formula: Setting * 44 + 280"

with open(unified_path, "w", encoding="utf-8") as f:
    json.dump(unified_data, f, indent=2, ensure_ascii=False)

print("Successfully updated unified_grinders.json with math formula tables!")
