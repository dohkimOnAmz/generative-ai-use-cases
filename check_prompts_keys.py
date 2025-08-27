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
print(f"번역 완료율: {len(ko_keys)/len(en_keys)*100:.1f}%")

missing_keys = en_keys - ko_keys
if missing_keys:
    print(f"\n누락된 키 개수: {len(missing_keys)}")
    print("누락된 키들:")
    for key in sorted(missing_keys)[:10]:
        print(f"  - {key}")
    if len(missing_keys) > 10:
        print(f"  ... 및 {len(missing_keys)-10}개 더")
else:
    print("\n✅ 모든 키가 번역되었습니다!")
