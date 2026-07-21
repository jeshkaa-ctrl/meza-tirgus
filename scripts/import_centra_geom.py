"""
Centra reģiona SHP ģeometrijas imports uz Supabase meza_nogabali.geom
Palaist: python scripts/import_centra_geom.py [test|all]

Nepieciešams: pip install shapefile pyproj shapely python-dotenv
Service key: .env failā → SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
"""

import os, shapefile, json, urllib.request, urllib.parse, sys, time
from dotenv import load_dotenv
from pyproj import Transformer
from shapely.geometry import shape, mapping

load_dotenv()  # ielādē .env no projekta saknes

# ── KONFIGURĀCIJA ─────────────────────────────────────────────────────────────

SUPABASE_URL  = "https://reuyrtiwzcxdknnmycev.supabase.co"
SERVICE_KEY   = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

SHP_DIR       = "C:/Users/User/Downloads/centra"
SHP_FILES     = ["2651", "2652", "2653", "2654", "2655"]

BATCH_SIZE    = 50     # ieraksti vienā PATCH gājienā (caur atsevišķiem HTTP sūtījumiem)
DRY_RUN       = False  # True = tikai statistika bez rakstīšanas

# ── KOORDINĀTU TRANSFORMĀCIJA LKS92 → WGS84 ──────────────────────────────────

transformer = Transformer.from_crs("EPSG:3059", "EPSG:4326", always_xy=True)

def transform_ring(ring):
    """Pārveido [[x,y],...] no LKS92 uz WGS84 [[lon,lat],...]"""
    result = []
    for x, y in ring:
        lon, lat = transformer.transform(x, y)
        result.append([round(lon, 8), round(lat, 8)])
    return result

def shp_to_wgs84_geojson(geo):
    """Pārveido shapefile ģeometriju uz WGS84 GeoJSON"""
    if geo.shapeType == 0:  # Null
        return None
    gi = geo.__geo_interface__
    geom = shape(gi)
    if geom.is_empty:
        return None

    # Pārvērš koordinātes
    if gi['type'] == 'Polygon':
        coords = [transform_ring(gi['coordinates'][0])]
        for inner in gi['coordinates'][1:]:
            coords.append(transform_ring(inner))
        return {"type": "Polygon", "coordinates": coords}
    elif gi['type'] == 'MultiPolygon':
        polys = []
        for poly in gi['coordinates']:
            rings = [transform_ring(ring) for ring in poly]
            polys.append(rings)
        return {"type": "MultiPolygon", "coordinates": polys}
    return None

# ── SUPABASE REST PALĪGFUNKCIJAS ──────────────────────────────────────────────

def sb_patch(record_id, geojson_dict):
    """Atjaunina geom lauku pēc id"""
    body = json.dumps({"geom": geojson_dict}).encode('utf-8')
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/meza_nogabali?id=eq.{record_id}",
        data=body,
        headers={
            "apikey":        SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type":  "application/json",
            "Prefer":        "return=minimal",
        },
        method="PATCH"
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status  # 204 = OK

def sb_fetch_by_kadastrs(kadastrs):
    """Iegūst visus ierakstus ar šo kadastra numuru (bez geom)"""
    q = urllib.parse.quote(kadastrs)
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/meza_nogabali?select=id,kvart,nog,anog&kadastrs=eq.{q}&limit=500",
        headers={
            "apikey":        SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
        }
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# ── IMPORTA GALVENĀ LOGIKA ────────────────────────────────────────────────────

def import_shp(shp_name):
    print(f"\n{'='*60}")
    print(f"Apstrādā: {SHP_DIR}/{shp_name}.shp")

    sf = shapefile.Reader(f"{SHP_DIR}/{shp_name}.shp")
    fields = [f[0] for f in sf.fields[1:]]
    kad_idx  = fields.index('kadastrs')
    kvart_idx = fields.index('kvart')
    nog_idx   = fields.index('nog')
    anog_idx  = fields.index('anog')

    total_shp   = 0
    matched     = 0
    updated     = 0
    not_found   = 0
    errors      = 0
    skip_null   = 0

    # Grupē pēc kadastrs lai samazinātu API pieprasījumu skaitu
    by_kadastrs = {}
    print(f"Lasa SHP failu...")
    for sr, geo in zip(sf.iterRecords(), sf.iterShapes()):
        total_shp += 1
        kad   = str(sr[kad_idx]).strip()
        kvart = str(sr[kvart_idx]).strip()
        nog   = str(sr[nog_idx]).strip()
        anog  = str(sr[anog_idx]).strip()
        if kad not in by_kadastrs:
            by_kadastrs[kad] = []
        by_kadastrs[kad].append((kvart, nog, anog, geo))

    print(f"SHP: {total_shp} ieraksti, {len(by_kadastrs)} unikāli kadastri")

    kad_list = list(by_kadastrs.items())
    for i, (kad, shp_rows) in enumerate(kad_list):
        if i % 100 == 0:
            pct = round(i / len(kad_list) * 100, 1)
            print(f"  {i}/{len(kad_list)} kadastri ({pct}%) | matched={matched} updated={updated} not_found={not_found}", flush=True)

        # Iegūst DB ierakstus šim kadastram
        try:
            db_rows = sb_fetch_by_kadastrs(kad)
        except Exception as e:
            errors += 1
            continue

        # Indeksē DB pēc (kvart, nog, anog)
        db_idx = {}
        for row in db_rows:
            key = (str(row['kvart']).strip(), str(row['nog']).strip(), str(row.get('anog','0')).strip())
            db_idx[key] = row['id']

        # Sasparo katru SHP rindi ar DB
        for kvart, nog, anog, geo in shp_rows:
            matched += 1
            key = (kvart, nog, anog)
            db_id = db_idx.get(key)
            if not db_id:
                not_found += 1
                continue

            geojson = shp_to_wgs84_geojson(geo)
            if not geojson:
                skip_null += 1
                continue

            if DRY_RUN:
                updated += 1
                continue

            # Atjaunina DB
            try:
                status = sb_patch(db_id, geojson)
                if status == 204:
                    updated += 1
                else:
                    errors += 1
            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"  KĻŪDA id={db_id}: {e}")

        # Mazs pauze lai nenoslogotu API
        if i % 200 == 199:
            time.sleep(0.5)

    print(f"\n{shp_name} REZULTĀTS:")
    print(f"  SHP ieraksti:   {total_shp}")
    print(f"  Saskaņoti:      {matched}")
    print(f"  Atjaunināti:    {updated}")
    print(f"  Nav DB:         {not_found}")
    print(f"  Null ģeom:      {skip_null}")
    print(f"  Kļūdas:         {errors}")
    print(f"  Match rate:     {matched/total_shp*100:.1f}%" if total_shp else "")

    return {"total": total_shp, "matched": matched, "updated": updated, "not_found": not_found, "errors": errors}

# ── GALVENAIS IEEJAS PUNKTS ──────────────────────────────────────────────────

def main():
    if not SERVICE_KEY:
        print("KĻŪDA: SUPABASE_SERVICE_ROLE_KEY nav iestatīts!")
        print("  Pievieno .env failā:")
        print("  SUPABASE_SERVICE_ROLE_KEY=sb_secret_...")
        print("  (Supabase Dashboard -> Settings -> API -> service_role)")
        sys.exit(1)

    if DRY_RUN:
        print("⚠️  DRY RUN — rakstīšana IZSLĒGTA, tikai statistika")

    print(f"Supabase: {SUPABASE_URL}")
    print(f"SHP faili: {', '.join(SHP_FILES)}")
    print(f"Batch size: {BATCH_SIZE}")

    # Vispirms testē uz VIENA faila
    test_file = SHP_FILES[0]  # 2651
    print(f"\n{'*'*60}")
    print(f"1. TESTS uz {test_file}.shp (pirmie 500 kadastri)...")
    print(f"{'*'*60}")

    all_results = []

    # Ja tests ir norādīts kā 'test', apstrādā tikai pirmo
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'

    if mode == 'test':
        # Tikai pirmie 500 kadastri no 2651
        sf = shapefile.Reader(f"{SHP_DIR}/{test_file}.shp")
        fields = [f[0] for f in sf.fields[1:]]
        kad_idx = fields.index('kadastrs')
        sample_kads = set()
        for sr in sf.iterRecords():
            sample_kads.add(str(sr[kad_idx]).strip())
            if len(sample_kads) >= 500:
                break
        print(f"TEST: {len(sample_kads)} unikāli kadastri no {test_file}")
        # importē tikai šos kadastrus
        res = import_shp_filtered(test_file, sample_kads)
        all_results.append(res)
    else:
        for shp_name in SHP_FILES:
            res = import_shp(shp_name)
            all_results.append(res)

    print(f"\n{'='*60}")
    print("KOPĒJAIS REZULTĀTS:")
    total_all = sum(r['total'] for r in all_results)
    updated_all = sum(r['updated'] for r in all_results)
    errors_all = sum(r['errors'] for r in all_results)
    print(f"  Kopā SHP:     {total_all}")
    print(f"  Atjaunināti:  {updated_all}")
    print(f"  Kļūdas:       {errors_all}")

def import_shp_filtered(shp_name, allowed_kads):
    """Kā import_shp, bet tikai norādītajiem kadastriem"""
    sf = shapefile.Reader(f"{SHP_DIR}/{shp_name}.shp")
    fields = [f[0] for f in sf.fields[1:]]
    kad_idx   = fields.index('kadastrs')
    kvart_idx = fields.index('kvart')
    nog_idx   = fields.index('nog')
    anog_idx  = fields.index('anog')

    by_kadastrs = {}
    for sr, geo in zip(sf.iterRecords(), sf.iterShapes()):
        kad = str(sr[kad_idx]).strip()
        if kad not in allowed_kads:
            continue
        kvart = str(sr[kvart_idx]).strip()
        nog   = str(sr[nog_idx]).strip()
        anog  = str(sr[anog_idx]).strip()
        if kad not in by_kadastrs:
            by_kadastrs[kad] = []
        by_kadastrs[kad].append((kvart, nog, anog, geo))

    matched = updated = not_found = errors = skip_null = 0
    total_shp = sum(len(v) for v in by_kadastrs.values())

    for i, (kad, shp_rows) in enumerate(by_kadastrs.items()):
        try:
            db_rows = sb_fetch_by_kadastrs(kad)
        except Exception as e:
            errors += 1
            continue

        db_idx = {}
        for row in db_rows:
            key = (str(row['kvart']).strip(), str(row['nog']).strip(), str(row.get('anog','0')).strip())
            db_idx[key] = row['id']

        for kvart, nog, anog, geo in shp_rows:
            matched += 1
            key = (kvart, nog, anog)
            db_id = db_idx.get(key)
            if not db_id:
                not_found += 1
                continue

            geojson = shp_to_wgs84_geojson(geo)
            if not geojson:
                skip_null += 1
                continue

            if DRY_RUN:
                updated += 1
                continue

            try:
                status = sb_patch(db_id, geojson)
                if status == 204:
                    updated += 1
                else:
                    errors += 1
            except Exception as e:
                errors += 1
                if errors <= 3:
                    print(f"  KĻŪDA: {e}")

    print(f"\nTEST {shp_name} REZULTĀTS:")
    print(f"  SHP ieraksti:  {total_shp}")
    print(f"  Saskaņoti:     {matched}")
    print(f"  Atjaunināti:   {updated}")
    print(f"  Nav DB:        {not_found}")
    print(f"  Kļūdas:        {errors}")
    if matched > 0:
        match_rate = (matched - not_found) / matched * 100
        print(f"  Match rate:    {match_rate:.1f}%")
    return {"total": total_shp, "matched": matched, "updated": updated, "not_found": not_found, "errors": errors}

if __name__ == "__main__":
    main()
