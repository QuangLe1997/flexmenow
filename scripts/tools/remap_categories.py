#!/usr/bin/env python3
"""
Remap templates and stories to the new 10-category system.
Also adds targetGender/promptGender fields and standardizes tags.
"""
import json
import sys
import os
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_PATH = os.path.join(BASE, 'public', 'config', 'flexshot_templates.json')
STORIES_PATH = os.path.join(BASE, 'public', 'config', 'flextale_stories.json')

# ============================================================
# NEW 10 CATEGORIES (i18n)
# ============================================================
NEW_CATEGORIES = [
    {"id": "romance", "name": {"en": "Romance", "vi": "Tình Yêu", "es": "Romance", "pt": "Romance", "ja": "ロマンス", "ko": "로맨스"}},
    {"id": "travel", "name": {"en": "Travel", "vi": "Du Lịch", "es": "Viaje", "pt": "Viagem", "ja": "旅行", "ko": "여행"}},
    {"id": "luxury", "name": {"en": "Luxury", "vi": "Sang Trọng", "es": "Lujo", "pt": "Luxo", "ja": "ラグジュアリー", "ko": "럭셔리"}},
    {"id": "creative", "name": {"en": "Creative", "vi": "Sáng Tạo", "es": "Creativo", "pt": "Criativo", "ja": "クリエイティブ", "ko": "크리에이티브"}},
    {"id": "beauty", "name": {"en": "Beauty", "vi": "Làm Đẹp", "es": "Belleza", "pt": "Beleza", "ja": "ビューティー", "ko": "뷰티"}},
    {"id": "career", "name": {"en": "Career", "vi": "Sự Nghiệp", "es": "Carrera", "pt": "Carreira", "ja": "キャリア", "ko": "커리어"}},
    {"id": "emotion", "name": {"en": "Emotion", "vi": "Cảm Xúc", "es": "Emoción", "pt": "Emoção", "ja": "エモーション", "ko": "감정"}},
    {"id": "culture", "name": {"en": "Culture", "vi": "Văn Hóa", "es": "Cultura", "pt": "Cultura", "ja": "カルチャー", "ko": "문화"}},
    {"id": "lifestyle", "name": {"en": "Lifestyle", "vi": "Đời Sống", "es": "Estilo", "pt": "Estilo", "ja": "ライフスタイル", "ko": "라이프스타일"}},
    {"id": "active", "name": {"en": "Active", "vi": "Năng Động", "es": "Activo", "pt": "Ativo", "ja": "アクティブ", "ko": "액티브"}},
]

VALID_CATS = {c["id"] for c in NEW_CATEGORIES}

# ============================================================
# TEMPLATE CATEGORY MAPPING
# ============================================================
TEMPLATE_OVERRIDES = {
    # Romance (wedding, couple-themed, love)
    "t026": "romance", "t027": "romance", "t091": "romance", "t121": "romance",
    "t123": "romance", "t124": "romance", "t126": "romance", "t132": "romance",
    "t137": "romance", "t157": "romance", "t166": "romance",
    # Luxury extras
    "t007": "luxury", "t154": "luxury", "t155": "luxury", "t156": "luxury",
    "t158": "luxury", "t160": "luxury", "t170": "luxury", "t180": "luxury", "t187": "luxury",
    # Career/Professional
    "t021": "career", "t022": "career", "t029": "career", "t035": "career",
    "t036": "career", "t071": "career", "t087": "career", "t163": "career",
    "t171": "career", "t185": "career",
    # Culture/Traditional
    "t030": "culture", "t037": "culture", "t109": "culture", "t114": "culture",
    "t118": "culture", "t174": "culture", "t175": "culture",
    # Emotion
    "t143": "emotion", "t145": "emotion", "t146": "emotion", "t148": "emotion",
    "t150": "emotion", "t168": "emotion", "t183": "emotion", "t184": "emotion",
    # Beauty/Fashion
    "t010": "beauty", "t014": "beauty", "t020": "beauty", "t032": "beauty",
    "t034": "beauty", "t038": "beauty", "t039": "beauty", "t069": "beauty",
    "t098": "beauty", "t099": "beauty", "t100": "beauty", "t101": "beauty",
    "t102": "beauty", "t103": "beauty", "t130": "beauty", "t179": "beauty",
    "t181": "beauty", "t188": "beauty", "t191": "beauty", "t198": "beauty",
    "t197": "beauty",
    # Active/Sports
    "t080": "active", "t082": "active", "t092": "active", "t093": "active",
    "t095": "active", "t190": "active",
    # Lifestyle specifics
    "t005": "lifestyle", "t013": "lifestyle", "t019": "lifestyle", "t031": "lifestyle",
    "t078": "lifestyle", "t079": "lifestyle", "t081": "lifestyle",
    "t083": "lifestyle", "t084": "lifestyle", "t085": "lifestyle",
    "t086": "lifestyle", "t088": "lifestyle", "t089": "lifestyle", "t090": "lifestyle",
    "t094": "lifestyle", "t096": "lifestyle", "t097": "lifestyle",
    "t141": "lifestyle", "t142": "lifestyle", "t144": "lifestyle", "t147": "lifestyle",
    "t149": "lifestyle", "t151": "lifestyle", "t152": "lifestyle", "t153": "lifestyle",
    "t156": "lifestyle", "t159": "lifestyle", "t164": "lifestyle",
    "t177": "lifestyle", "t182": "lifestyle", "t186": "lifestyle",
    "t192": "lifestyle", "t193": "lifestyle", "t195": "lifestyle",
    "t196": "lifestyle", "t199": "lifestyle", "t200": "lifestyle",
    # Creative overrides
    "t028": "creative", "t033": "creative", "t040": "creative",
    "t161": "creative", "t162": "creative", "t165": "creative", "t167": "creative",
    "t169": "creative", "t172": "creative", "t173": "creative", "t176": "creative",
    "t178": "creative", "t189": "creative", "t194": "creative",
}

def map_template_category(t):
    tid = t["id"]
    old_cat = t["category"]
    num = int(tid[1:]) if tid[1:].isdigit() else 0

    if tid in TEMPLATE_OVERRIDES:
        return TEMPLATE_OVERRIDES[tid]

    # ID range rules
    if 41 <= num <= 60:
        return "travel"
    if 61 <= num <= 77:
        return "luxury"
    if 131 <= num <= 140:
        return "culture"

    # Fallback by old category
    if old_cat in ("art", "artistic", "creative"):
        return "creative"
    if old_cat == "professional":
        return "career"
    if old_cat in ("cultural", "seasonal"):
        return "culture"
    if old_cat == "lifestyle":
        return "lifestyle"
    if old_cat == "luxury":
        return "luxury"
    if old_cat == "travel":
        return "travel"

    return old_cat

# ============================================================
# STORY CATEGORY MAPPING
# ============================================================
STORY_OVERRIDES = {
    # Romance/Couple
    "s001": "romance", "s006": "romance", "s009": "romance", "s012": "romance",
    "s014": "romance", "s062": "romance", "s084": "romance",
    "s098": "romance", "s099": "romance", "s100": "romance", "s101": "romance",
    "s102": "romance", "s103": "romance", "s104": "romance", "s105": "romance",
    "s106": "romance", "s107": "romance", "s157": "romance", "s161": "romance",
    "s168": "romance", "s181": "romance",
    # Travel
    "s007": "travel", "s046": "travel", "s061": "travel", "s063": "travel",
    "s064": "travel", "s065": "travel", "s066": "travel", "s067": "travel",
    "s068": "travel", "s069": "travel", "s070": "travel", "s071": "travel",
    "s072": "travel", "s073": "travel", "s074": "travel", "s075": "travel",
    "s141": "travel", "s206": "travel", "s207": "travel", "s210": "travel",
    "s212": "travel", "s215": "travel", "s216": "travel", "s218": "travel",
    "s220": "travel", "s222": "travel", "s224": "travel",
    # Luxury/Wealth
    "s029": "luxury", "s076": "luxury", "s077": "luxury", "s078": "luxury",
    "s079": "luxury", "s080": "luxury", "s081": "luxury", "s082": "luxury",
    "s083": "luxury", "s085": "luxury", "s086": "luxury", "s087": "luxury",
    # Beauty
    "s088": "beauty", "s089": "beauty", "s090": "beauty", "s091": "beauty",
    "s092": "beauty", "s093": "beauty", "s094": "beauty", "s095": "beauty",
    "s096": "beauty", "s097": "beauty", "s134": "beauty",
    # Career
    "s011": "career", "s013": "career", "s015": "career", "s021": "career",
    "s024": "career", "s027": "career", "s035": "career", "s138": "career",
    "s139": "career", "s140": "career", "s142": "career",
    "s143": "career", "s144": "career", "s145": "career",
    # Emotion
    "s004": "emotion", "s116": "emotion", "s117": "emotion", "s118": "emotion",
    "s119": "emotion", "s120": "emotion", "s121": "emotion", "s122": "emotion",
    "s123": "emotion", "s124": "emotion", "s125": "emotion", "s126": "emotion",
    "s127": "emotion", "s162": "emotion", "s163": "emotion", "s165": "emotion",
    "s166": "emotion", "s170": "emotion", "s171": "emotion", "s172": "emotion",
    "s173": "emotion", "s177": "emotion", "s180": "emotion", "s185": "emotion",
    # Culture
    "s050": "culture", "s053": "culture", "s058": "culture", "s156": "culture",
    "s158": "culture", "s159": "culture", "s160": "culture", "s211": "culture",
    "s219": "culture", "s221": "culture", "s223": "culture", "s225": "culture",
    # Creative/Trending
    "s146": "creative", "s147": "creative", "s148": "creative", "s149": "creative",
    "s150": "creative", "s151": "creative", "s152": "creative", "s153": "creative",
    "s154": "creative", "s155": "creative",
    # Active/Fitness
    "s038": "active", "s048": "active", "s128": "active", "s189": "active",
    "s190": "active", "s193": "active", "s196": "active", "s199": "active",
    "s203": "active", "s205": "active", "s208": "active", "s214": "active",
    # Lifestyle (pet, family, hobby, social, food merges)
    "s108": "lifestyle", "s109": "lifestyle", "s110": "lifestyle", "s111": "lifestyle",
    "s112": "lifestyle", "s113": "lifestyle", "s114": "lifestyle", "s115": "lifestyle",
    "s167": "lifestyle",
    "s209": "lifestyle", "s213": "lifestyle", "s217": "lifestyle",
    "s022": "lifestyle", "s023": "lifestyle", "s025": "lifestyle", "s026": "lifestyle",
    "s028": "lifestyle", "s032": "lifestyle", "s039": "lifestyle", "s040": "lifestyle",
    "s041": "lifestyle", "s042": "lifestyle", "s043": "lifestyle", "s044": "lifestyle",
    "s045": "lifestyle", "s051": "lifestyle", "s052": "lifestyle", "s054": "lifestyle",
    "s055": "lifestyle", "s059": "lifestyle",
    "s186": "lifestyle", "s191": "lifestyle", "s192": "lifestyle", "s194": "lifestyle",
    "s195": "lifestyle", "s197": "lifestyle", "s198": "lifestyle", "s200": "lifestyle",
    "s201": "lifestyle", "s202": "lifestyle", "s204": "lifestyle",
}

def map_story_category(s):
    sid = s["id"]
    old_cat = s["category"]

    if sid in STORY_OVERRIDES:
        return STORY_OVERRIDES[sid]

    # Fallback by old category
    if old_cat == "couple":
        return "romance"
    if old_cat == "travel":
        return "travel"
    if old_cat == "wealth":
        return "luxury"
    if old_cat == "beauty":
        return "beauty"
    if old_cat == "career":
        return "career"
    if old_cat == "emotion":
        return "emotion"
    if old_cat in ("seasonal", "culture"):
        return "culture"
    if old_cat == "trending":
        return "creative"
    if old_cat in ("fitness", "adventure"):
        return "active"
    if old_cat in ("lifestyle", "social", "food", "hobby", "pet", "family"):
        return "lifestyle"

    return old_cat

# ============================================================
# PROMPT GENDER DETECTION
# ============================================================
FEMALE_KEYWORDS = [
    "dress", "gown", "bridal", "wedding dress", "maternity", "pregnant",
    "lingerie", "skirt", "flowing dress", "silk dress", "ao dai", "hanbok",
    "tiara", "bows", "lace dress", "tulle", "corset", "heels",
    "feminine silhouette", "ballgown",
]
MALE_KEYWORDS = [
    "suit", "motorcycle", "leather jacket", "beard", "muscular", "whiskey",
    "cigar", "tactical", "armor", "boxing gloves", "shirtless",
]

def detect_prompt_gender(prompt_text):
    """Return 'female', 'male', or 'neutral' based on prompt content."""
    lower = prompt_text.lower()
    has_female = any(kw in lower for kw in FEMALE_KEYWORDS)
    has_male = any(kw in lower for kw in MALE_KEYWORDS)
    if has_female and not has_male:
        return "female"
    if has_male and not has_female:
        return "male"
    return "neutral"

# ============================================================
# MAIN
# ============================================================
def safe_read_json(path):
    """Read JSON file handling potential surrogate characters."""
    with open(path, "rb") as f:
        raw = f.read()
    text = raw.decode("utf-8")
    return json.loads(text)

def safe_write_json(path, data):
    """Write JSON file handling potential surrogate characters (emoji)."""
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    # Always round-trip through utf-16 to fix lone surrogates -> proper emoji
    json_bytes = json_str.encode("utf-16", "surrogatepass")
    json_str_fixed = json_bytes.decode("utf-16", "replace")
    # Write as utf-8 bytes directly
    with open(path, "wb") as f:
        f.write(json_str_fixed.encode("utf-8"))

def main():
    # --- Templates ---
    tdata = safe_read_json(TEMPLATES_PATH)

    templates = tdata["templates"]

    old_tcats = Counter(t["category"] for t in templates)
    print("=== TEMPLATES: OLD CATEGORIES ===")
    for k, v in sorted(old_tcats.items()):
        print(f"  {k}: {v}")

    for t in templates:
        t["category"] = map_template_category(t)
        # Detect prompt gender
        base_prompt = t.get("prompt", {}).get("base", "")
        t["promptGender"] = detect_prompt_gender(base_prompt)

    new_tcats = Counter(t["category"] for t in templates)
    print("\n=== TEMPLATES: NEW CATEGORIES ===")
    for k, v in sorted(new_tcats.items()):
        print(f"  {k}: {v}")

    t_unmapped = [t for t in templates if t["category"] not in VALID_CATS]
    if t_unmapped:
        print(f"\nUNMAPPED TEMPLATES: {len(t_unmapped)}")
        for t in t_unmapped:
            print(f"  {t['id']} -> {t['category']}")
        return

    print(f"\nAll {len(templates)} templates mapped OK!")

    # Prompt gender stats
    pg = Counter(t["promptGender"] for t in templates)
    print(f"\nPrompt Gender: {dict(pg)}")

    # Show gender mismatches (target=female but prompt=neutral)
    mismatches = [(t["id"], t["name"]["en"], t["gender"], t["promptGender"])
                  for t in templates if t["gender"] != "all" and t["promptGender"] == "neutral"]
    print(f"\nGender targets with neutral prompts: {len(mismatches)}")

    # Update categories header
    tdata["categories"] = NEW_CATEGORIES
    tdata["updatedAt"] = "2026-03-04T10:00:00.000Z"

    # Write templates
    safe_write_json(TEMPLATES_PATH, tdata)
    print(f"\nWrote {TEMPLATES_PATH}")

    # --- Stories ---
    sdata = safe_read_json(STORIES_PATH)

    stories = sdata["stories"]

    old_scats = Counter(s["category"] for s in stories)
    print("\n\n=== STORIES: OLD CATEGORIES ===")
    for k, v in sorted(old_scats.items()):
        print(f"  {k}: {v}")

    for s in stories:
        s["category"] = map_story_category(s)
        # Detect prompt gender from first chapter
        chapters = s.get("chapters", [])
        if chapters:
            base_prompt = chapters[0].get("prompt", {}).get("base", "")
            s["promptGender"] = detect_prompt_gender(base_prompt)
        else:
            s["promptGender"] = "neutral"

    new_scats = Counter(s["category"] for s in stories)
    print("\n=== STORIES: NEW CATEGORIES ===")
    for k, v in sorted(new_scats.items()):
        print(f"  {k}: {v}")

    s_unmapped = [s for s in stories if s["category"] not in VALID_CATS]
    if s_unmapped:
        print(f"\nUNMAPPED STORIES: {len(s_unmapped)}")
        for s in s_unmapped:
            print(f"  {s['id']} -> {s['category']}")
        return

    print(f"\nAll {len(stories)} stories mapped OK!")

    # Update categories header
    sdata["categories"] = NEW_CATEGORIES
    sdata["updatedAt"] = "2026-03-04T10:00:00.000Z"

    # Write stories
    safe_write_json(STORIES_PATH, sdata)
    print(f"\nWrote {STORIES_PATH}")

    # --- Final summary ---
    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE")
    print("=" * 60)
    print(f"Templates: {len(templates)} items -> 10 categories")
    print(f"Stories: {len(stories)} items -> 10 categories")
    print("\nNew category distribution:")
    combined = Counter()
    for cat in VALID_CATS:
        tc = sum(1 for t in templates if t["category"] == cat)
        sc = sum(1 for s in stories if s["category"] == cat)
        combined[cat] = tc + sc
        print(f"  {cat:12s}: {tc:3d} templates + {sc:3d} stories = {tc+sc:3d} total")
    print(f"  {'TOTAL':12s}: {len(templates):3d} templates + {len(stories):3d} stories = {len(templates)+len(stories):3d} total")


if __name__ == "__main__":
    main()
