import json
import os

base_microns = [(34 + i) * 15 for i in range(27)]

raw_data = {
    "Comandante C40 MK4": [17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 30],
    "Comandante C40 MK4 (Red Clix)": [34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
    "1Zpresso K-Ultra": [54, 55, 57, 59, 61, 63, 64, 66, 68, 70, 72, 73, 75, 77, 79, 81, 82, 84, 86, 88, 90, 91, 93, 95, 97, 99, 100],
    "KINGrinder K6": [60, 62, 64, 67, 69, 71, 73, 75, 78, 80, 82, 84, 86, 89, 91, 93, 95, 97, 100, 102, 104, 106, 108, 111, 113, 115, 117],
    "Timemore C2": [15, 16, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19, 20, 20, 21, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 31],
    "Timemore C3": [11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 22, 22],
    "Timemore Chestnut X": [7, 7.5, 8, 8.5, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 17.5, 18],
    "Timemore S3": [2.6, 2.8, 3.1, 3.3, 3.6, 3.8, 4.1, 4.3, 4.6, 4.8, 5.1, 5.3, 5.6, 5.8, 6.1, 6.3, 6.6, 6.8, 7.1, 7.3, 7.6, 7.8, 8.1, 8.3, 8.6, 8.8, None],
    "Epeios Essense Go": [34, 35, 37, 38, 39, 41, 42, 44, 45, 46, 48, 49, 51, 52, 53, 55, 56, 58, 59, 60, 62, 63, 65, 66, 67, 69, 70]
}

hand_mills_sync = {}

for grinder_name, values in raw_data.items():
    mapping = {}
    for i, val in enumerate(values):
        if val is None: continue
        if val not in mapping:
            mapping[val] = []
        mapping[val].append(base_microns[i])
    
    table = []
    for val in sorted(mapping.keys()):
        avg_micron = sum(mapping[val]) / len(mapping[val])
        table.append({
            "label": str(val),
            "microns": round(avg_micron, 2)
        })
        
    hand_mills_sync[grinder_name] = {
        "description": "Ver 4.0 Sync Table (REDCLIX 15µm Base)",
        "table": table
    }

out_path = os.path.join(os.path.dirname(__file__), "utils", "hand_mills_sync.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(hand_mills_sync, f, indent=2, ensure_ascii=False)

unified_path = os.path.join(os.path.dirname(__file__), "utils", "unified_grinders.json")
with open(unified_path, "r", encoding="utf-8") as f:
    unified_data = json.load(f)

ek43_table = []
for gear in range(0, 17):
    max_grid = 1 if gear == 16 else 10
    for grid in range(max_grid):
        micron = (gear + grid/10.0) * 60 + 120
        ek43_table.append({
            "label": f"{gear}ギア {grid}グリッド",
            "microns": round(micron, 2)
        })

unified_data["Mahlkönig EK43"]["table"] = ek43_table
unified_data["Mahlkönig EK43"]["description"] = "Custom Dial Linear Formula: Setting * 60 + 120"

with open(unified_path, "w", encoding="utf-8") as f:
    json.dump(unified_data, f, indent=2, ensure_ascii=False)

print("Generated hand_mills_sync.json and updated EK43 in unified_grinders.json")
