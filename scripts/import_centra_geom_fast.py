"""
VMD SHP ģeometrijas ĀTRAIS imports uz Supabase meza_nogabali.geom

Izmanto psycopg2 tiešo PostgreSQL savienojumu ar batch UPDATE —
~200x ātrāk nekā REST API pa vienam ierakstam.

.env failā:
  DATABASE_URL=postgresql://postgres.[ref]:[PAROLE]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres

Palaist:
  python scripts/import_centra_geom_fast.py test [dir] [f1,f2,...]
  python scripts/import_centra_geom_fast.py all  [dir] [f1,f2,...]

Piemēri:
  python scripts/import_centra_geom_fast.py test   # Centra, 2000 ierakstu
  python scripts/import_centra_geom_fast.py all    # Centra, viss
  python scripts/import_centra_geom_fast.py test "data/shp/austrumu/austrumu" "2851,2852,2853,2854,2855"
  python scripts/import_centra_geom_fast.py all  "data/shp/austrumu/austrumu" "2851,2852,2853,2854,2855"
"""

import os, sys, json, time
import shapefile
from pyproj import Transformer
from shapely.geometry import shape
from dotenv import load_dotenv

load_dotenv()

# ── KONFIGURĀCIJA (noklusējums = Centra) ──────────────────────────────────────

DATABASE_URL   = os.environ.get("DATABASE_URL")
DEFAULT_SHP_DIR   = "C:/Users/User/Downloads/centra"
DEFAULT_SHP_FILES = ["2651", "2652", "2653", "2654", "2655"]
BATCH_SIZE     = 500   # ieraksti vienā UPDATE transakcijā

# ── KOORDINĀTU TRANSFORMĀCIJA LKS92 → WGS84 ──────────────────────────────────

transformer = Transformer.from_crs("EPSG:3059", "EPSG:4326", always_xy=True)

def transform_ring(ring):
    return [[round(lon, 8), round(lat, 8)] for x, y in ring
            for lon, lat in [transformer.transform(x, y)]]

def shp_to_geojson(geo):
    if geo.shapeType == 0:
        return None
    gi = geo.__geo_interface__
    if shape(gi).is_empty:
        return None
    if gi['type'] == 'Polygon':
        coords = [transform_ring(gi['coordinates'][0])]
        for inner in gi['coordinates'][1:]:
            coords.append(transform_ring(inner))
        return {"type": "Polygon", "coordinates": coords}
    elif gi['type'] == 'MultiPolygon':
        return {"type": "MultiPolygon",
                "coordinates": [[transform_ring(r) for r in poly]
                                for poly in gi['coordinates']]}
    return None

# ── PSYCOPG2 BATCH UPDATE ─────────────────────────────────────────────────────

def load_db_index(conn):
    """Ielādē VISUS ierakstus bez ģeometrijas vienā vaicājumā → atmiņā."""
    print("Ielādē DB indeksu (visi ieraksti bez geom)...", flush=True)
    t0 = time.time()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, kadastrs, kvart, nog, COALESCE(anog, '0')
        FROM meza_nogabali
        WHERE geom IS NULL
    """)
    idx = {}
    for id_, kad, kvart, nog, anog in cur:
        key = (str(kad).strip(), str(kvart).strip(),
               str(nog).strip(), str(anog).strip())
        idx[key] = id_
    cur.close()
    elapsed = time.time() - t0
    print(f"  Ielādēts: {len(idx):,} ieraksti {elapsed:.1f}s laikā", flush=True)
    return idx

def batch_update(conn, pairs):
    """
    pairs = [(id, geojson_dict), ...]
    Veic batch UPDATE ar psycopg2.extras.execute_values.
    """
    import psycopg2.extras
    cur = conn.cursor()
    psycopg2.extras.execute_values(
        cur,
        """
        UPDATE meza_nogabali SET geom = ST_SetSRID(ST_GeomFromGeoJSON(v.g::text), 4326)
        FROM (VALUES %s) AS v(id, g)
        WHERE meza_nogabali.id = v.id
        """,
        [(id_, json.dumps(geom)) for id_, geom in pairs],
        template="(%s, %s::jsonb)"
    )
    conn.commit()
    cur.close()

# ── SHP APSTRĀDE ─────────────────────────────────────────────────────────────

def process_shp_files(shp_files, db_idx, mode='all', shp_dir=DEFAULT_SHP_DIR):
    """
    Lasa SHP failus, sasaista ar db_idx, atgriež [(id, geojson), ...].
    mode='test' → tikai pirmie 2000 maches.
    """
    updates = []
    limit   = 2000 if mode == 'test' else None

    for shp_name in shp_files:
        path = f"{shp_dir}/{shp_name}.shp"
        if not os.path.exists(path):
            print(f"  IZLAISTS (nav faila): {path}")
            continue

        print(f"\nLasa {shp_name}.shp...", flush=True)
        sf     = shapefile.Reader(path)
        fields = [f[0] for f in sf.fields[1:]]
        ki = fields.index('kadastrs')
        vi = fields.index('kvart')
        ni = fields.index('nog')
        ai = fields.index('anog') if 'anog' in fields else None

        matched = not_found = skip_null = 0

        for sr, geo in zip(sf.iterRecords(), sf.iterShapes()):
            kad   = str(sr[ki]).strip()
            kvart = str(sr[vi]).strip()
            nog   = str(sr[ni]).strip()
            anog  = str(sr[ai]).strip() if ai is not None else '0'

            key   = (kad, kvart, nog, anog)
            db_id = db_idx.get(key)
            if not db_id:
                not_found += 1
                continue

            geojson = shp_to_geojson(geo)
            if not geojson:
                skip_null += 1
                continue

            updates.append((db_id, geojson))
            matched += 1

            if limit and len(updates) >= limit:
                print(f"  TEST: sasniegts {limit} ierakstu limits")
                print(f"  Saskaņoti: {matched}, Nav DB: {not_found}, Null: {skip_null}")
                return updates

        print(f"  {shp_name}: saskaņoti={matched}, nav_db={not_found}, null={skip_null}")

    return updates

# ── GALVENAIS ─────────────────────────────────────────────────────────────────

def main():
    if not DATABASE_URL:
        print("KĻŪDA: DATABASE_URL nav iestatīts .env failā!")
        print()
        print("Pievieno .env failā:")
        print("  DATABASE_URL=postgresql://postgres:[PAROLE]@db.reuyrtiwzcxdknnmycev.supabase.co:5432/postgres")
        print()
        print("Paroli atrodi: Supabase Dashboard → Settings → Database → Connection string")
        sys.exit(1)

    import psycopg2

    mode      = sys.argv[1] if len(sys.argv) > 1 else 'all'
    SHP_DIR   = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_SHP_DIR
    SHP_FILES = sys.argv[3].split(',') if len(sys.argv) > 3 else DEFAULT_SHP_FILES

    print(f"Režīms:     {mode.upper()}")
    print(f"SHP mape:   {SHP_DIR}")
    print(f"SHP faili:  {SHP_FILES}")
    print(f"Batch:      {BATCH_SIZE}")
    print()

    conn = psycopg2.connect(DATABASE_URL)

    # 1. Ielādē DB indeksu (viens SELECT)
    db_idx = load_db_index(conn)
    print()

    # 2. Apstrādā SHP failus → savāc (id, geojson) pārus
    t1 = time.time()
    print("Apstrādā SHP failus...", flush=True)
    shp_to_run = [SHP_FILES[0]] if mode == 'test' else SHP_FILES
    updates = process_shp_files(shp_to_run, db_idx, mode, SHP_DIR)
    shp_elapsed = time.time() - t1
    print(f"\nSHP apstrāde: {len(updates):,} ieraksti {shp_elapsed:.1f}s laikā", flush=True)

    if not updates:
        print("Nav ko atjaunināt.")
        conn.close()
        return

    # 3. Batch UPDATE
    print(f"\nSāk batch UPDATE ({len(updates):,} ieraksti, partijās pa {BATCH_SIZE})...", flush=True)
    t2     = time.time()
    done   = 0
    errors = 0

    for i in range(0, len(updates), BATCH_SIZE):
        chunk = updates[i : i + BATCH_SIZE]
        try:
            batch_update(conn, chunk)
            done += len(chunk)
        except Exception as e:
            conn.rollback()
            errors += len(chunk)
            print(f"  KĻŪDA batch {i//BATCH_SIZE}: {e}", flush=True)

        if (i // BATCH_SIZE) % 10 == 0 or i + BATCH_SIZE >= len(updates):
            elapsed = time.time() - t2
            rate    = done / elapsed if elapsed > 0 else 0
            eta_s   = (len(updates) - done) / rate if rate > 0 else 0
            print(f"  {done:,}/{len(updates):,} ({done/len(updates)*100:.1f}%) "
                  f"| {rate:.0f} ier/s | ETA {eta_s/60:.1f} min",
                  flush=True)

    total_elapsed = time.time() - t2
    print(f"\nPABEIGTS!")
    print(f"  Atjaunināti:  {done:,}")
    print(f"  Kļūdas:       {errors:,}")
    print(f"  Laiks:        {total_elapsed:.0f}s ({total_elapsed/60:.1f} min)")
    if done > 0:
        print(f"  Ātrums:       {done/total_elapsed:.0f} ieraksti/s")

    conn.close()

if __name__ == "__main__":
    main()
