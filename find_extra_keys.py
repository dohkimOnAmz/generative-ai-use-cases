#!/usr/bin/env python3
import yaml

def get_all_keys(data, prefix=''):
    keys = set()
    if isinstance(data, dict):
        for key, value in data.items():
            current_key = f"{prefix}.{key}" if prefix else key
            keys.add(current_key)
            if isinstance(value, dict):
                keys.update(get_all_keys(value, current_key))
    return keys

# 영어 파일 키 추출
with open('/Users/dohkim/Data/Code/genu/packages/web/public/locales/prompts/en.yaml', 'r', encoding='utf-8') as f:
    en_data = yaml.safe_load(f)
en_keys = get_all_keys(en_data)

# 한국어 파일 키 추출
with open('/Users/dohkim/Data/Code/genu/packages/web/public/locales/prompts/ko.yaml', 'r', encoding='utf-8') as f:
    ko_data = yaml.safe_load(f)
ko_keys = get_all_keys(ko_data)

print(f"영어 키 개수: {len(en_keys)}")
print(f"한국어 키 개수: {len(ko_keys)}")

# 한국어에만 있는 키들
extra_ko_keys = ko_keys - en_keys
if extra_ko_keys:
    print(f"\n한국어에만 있는 추가 키들 ({len(extra_ko_keys)}개):")
    for key in sorted(extra_ko_keys):
        print(f"  - {key}")

# 영어에만 있는 키들 (혹시 누락된 것이 있는지)
missing_ko_keys = en_keys - ko_keys
if missing_ko_keys:
    print(f"\n영어에만 있고 한국어에 누락된 키들 ({len(missing_ko_keys)}개):")
    for key in sorted(missing_ko_keys):
        print(f"  - {key}")
