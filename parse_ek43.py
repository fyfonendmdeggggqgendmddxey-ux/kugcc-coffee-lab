import openpyxl
import json
import os

excel_path = "/Users/norokazuhito/Downloads/Mahlkonig_EK43_Corrected.xlsx"
json_path = os.path.join(os.path.dirname(__file__), "utils", "unified_grinders.json")

wb = openpyxl.load_workbook(excel_path, data_only=True)
sheet = wb['EK43 Corrected']

data = []
for row in sheet.iter_rows(min_row=5):
    gear = row[0].value
    grid = row[1].value
    micron = row[3].value
    
    if gear is not None and grid is not None and micron is not None:
        label = f"{int(gear)}ギア {int(grid)}グリッド"
        data.append({
            "label": label,
            "microns": float(micron)
        })

with open(json_path, "r", encoding="utf-8") as f:
    unified_data = json.load(f)

unified_data["Mahlkönig EK43"]["table"] = data
unified_data["Mahlkönig EK43"]["description"] = "Mahlkönig EK43 (0-16) 粒径対応表 [修正版]"

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(unified_data, f, ensure_ascii=False, indent=2)

print(f"Updated EK43 with {len(data)} rows.")
