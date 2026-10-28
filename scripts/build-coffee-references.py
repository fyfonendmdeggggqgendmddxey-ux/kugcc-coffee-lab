"""Build the small runtime index from the reviewed, versioned source snapshots.

Run with: python3 scripts/build-coffee-references.py
Raw review gates remain authoritative; timer adapters are reviewed separately.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'data' / 'coffee'
baristas = json.loads((ROOT / 'raw/barista_recipe_knowledge.json').read_text())
beans = json.loads((ROOT / 'raw/bean_condition_knowledge.json').read_text())
catalog = json.loads((ROOT / 'raw/coffee_knowledge_catalog.json').read_text())
decisions = {(x['collection'], x['id']): x['review'] for x in catalog['items']}
references = []
PROFILE_NAMES = {
    'dak_default': '浅煎り・基本プロファイル', 'dak_natural_fermented': 'ナチュラル・発酵系の出発点',
    'dak_dense': '高密度向け（条件要確認）', '20grams_washed': 'April / ウォッシュト・2投',
    '20grams_natural': 'April / ナチュラル・4投', 'ply_pacamara_body': 'CCD N21 Pacamara / ボディを狙う',
    'ply_pacamara_acidity': 'CCD N21 Pacamara / 酸を狙う', 'piritu_gesha': 'Yellow / Red Gesha',
    'piritu_sl09': 'SL09 Inca', 'wonderstate_kamavindi': 'Kamavindi Gesha',
    'wonderstate_gamba_washed': 'Gamba Carbonic Washed', 'tq_koppi_placer': 'Koppi / El Placer',
    'tq_swerl_duwancho': 'Swerl / Arbergona Duwancho', 'tq_dak_darling': 'DAK / Darling Peach',
    'tq_koppi_lalia': 'Koppi / La Lia SL28',
}
BYPASS_LABELS = {
    'george-wac-2024': '温水で液量130–135gまで希釈後、常温水20–30gを追加。仕上がり150–165gは指示範囲からの算術値で、実測ではない。',
    'tay-wac-2023-original': '常温水で液量115gまで希釈し、続けて湯で約155gまで。115g・155gは追加する水の量ではない。',
    'jibbi-wac-2022-organizer': '90°Cの湯で仕上がり液量150gまで希釈。追加水量150gという意味ではない。',
    'wendelien-wac-2019': '水100gを加えて味見し、追加水合計120gに調整。追加水を100+120gに合算しない。',
}

for item in baristas['recipes']:
    review = decisions[('barista', item['id'])]
    refs = [baristas['sources'][sid] for sid in item['source_ids']]
    references.append(dict(
        id=item['id'], collection='barista', name=item['name'], author=item['attribution']['name'],
        brewer=item['brewer'], doseG=item['dose_g'], waterValue=item['water']['value'],
        waterUnit=item['water']['unit'], temperatureC=item['temperature']['value_c'],
        temperatureRangeC=item['temperature']['range_c'], temperatureLabel=item['temperature']['original'] or '記載なし',
        grindLabel=item['grind']['description_original'], bean=item['bean'], applicability=item.get('source_applicability'),
        context=item['recipe_context'], scope=item['version_note'], paper=item.get('equipment_details', {}).get('paper'),
        timeRangeS=([item['target_total_time_s']['min'], item['target_total_time_s']['max']]
                    if item.get('target_total_time_s') else None),
        timeSemantics=item.get('target_total_time_s', {}).get('status') if item.get('target_total_time_s') else None,
        claims=[dict(text=c['text_ja'], classification=c['classification'], scope=c['scope'],
                     sourceUrl=baristas['sources'][c['source_id']]['url']) for c in item['claims']],
        sources=[dict(title=s['title'], url=s['url'], verifiedOn=s['verified_on']) for s in refs],
        canSuggest=review['can_suggest_initial_candidate'], holdReason=review.get('specific_limit'),
        notes=item['quality_notes'], steps=item['steps'],
    ))

for item in beans['profiles']:
    review = decisions[('bean', item['id'])]
    source = beans['sources'][item['source_id']]
    grind = item.get('grind')
    grind_label = (' / '.join(str(grind[k]) for k in ['model', 'setting', 'setting_range', 'unit'] if grind.get(k) is not None)
                   if grind else '記載なし')
    references.append(dict(
        id=item['id'], collection='bean_condition', name=PROFILE_NAMES[item['id']], author=source['title'].split(' — ')[0],
        brewer=item['brewer'], doseG=item['dose_g'], waterValue=item['contact_water_g'], waterUnit='g',
        temperatureC=None, temperatureRangeC=item['temperature_c_range'],
        temperatureLabel='–'.join(f'{t:g}' for t in dict.fromkeys(item['temperature_c_range']))+'°C',
        grindLabel=grind_label, bean=item['bean'], applicability=item.get('source_applicability'),
        context=item['record_kind'], scope=item['scope'], paper=item.get('paper'),
        timeRangeS=item.get('target_total_time_s_range') or item.get('source_reported_total_time_s_range'),
        timeSemantics=item['total_time_semantics'],
        claims=([dict(text=item['intent_ja'], classification=item['classification'], scope=item['scope'], sourceUrl=source['url'])]
                if item.get('intent_ja') else []),
        sources=[dict(title=source['title'], url=source['url'], verifiedOn=source['verified_on'])],
        canSuggest=review['can_suggest_initial_candidate'], holdReason=review.get('archive_use'),
        notes=item['notes'], steps=item['steps'],
    ))

assert len(references) == 39
assert len({r['id'] for r in references}) == 39
for ref in references:
    ref['bypassLabel'] = BYPASS_LABELS.get(ref['id'])
    ref['schedule'] = [dict(startS=s.get('start_s'), waterIncrement=s.get('water_increment_g', s.get('water_increment')),
                            waterUnit=s.get('water_unit', 'g'), action=s.get('action', 'pour'), trigger=s.get('trigger'),
                            pourDurationSec=s.get('source_pour_duration_s'), flowGPerS=s.get('source_pour_flow_g_per_s'))
                       for s in ref.pop('steps')]
guidance = [{**g, 'source': beans['sources'][g['source_id']]} for g in beans['conditional_guidance']]
output = dict(version='2026-10-29.1', reviewedOn=catalog['reviewed_on'],
              purpose='参照・原条件比較。抽出率・精製効果の学習データではない。',
              references=references, guidance=guidance)
(ROOT / 'references.json').write_text(json.dumps(output, ensure_ascii=False, indent=2)+'\n')
print(f'Built {len(references)} reference records')
