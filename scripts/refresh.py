"""Extract scheduled service from the agency feed and preserve date exceptions."""
import argparse
import csv
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from io import BytesIO, TextIOWrapper
import json
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
URL = "https://gtfs-static.translink.ca/gtfs/google_transit.zip"

def rows(archive, name):
    with archive.open(name + ".txt") as stream:
        yield from csv.DictReader(TextIOWrapper(stream, encoding="utf-8-sig"))

def minute(value):
    h, m, s = map(int, value.split(":"))
    if s != 0:
        raise ValueError("Schedule gained sub-minute times")
    return h * 60 + m

def calendar(archive, start, end):
    services = defaultdict(set)
    for row in rows(archive, "calendar"):
        low, high = row["start_date"], row["end_date"]
        day = start
        while day <= end:
            stamp = day.strftime("%Y%m%d")
            if low <= stamp <= high and row[day.strftime("%A").lower()] == "1":
                services[day.isoformat()].add(row["service_id"])
            day += timedelta(days=1)
    for row in rows(archive, "calendar_dates"):
        day = datetime.strptime(row["date"], "%Y%m%d").date()
        if start <= day <= end:
            bag = services[day.isoformat()]
            if row["exception_type"] == "1":
                bag.add(row["service_id"])
            elif row["exception_type"] == "2":
                bag.discard(row["service_id"])
            else:
                raise ValueError("Unknown GTFS service exception")
    return {d:sorted(ids) for d,ids in sorted(services.items())}

def snapshot(archive):
    feed = next(rows(archive,"feed_info"))
    start, end = [datetime.strptime(feed[k],"%Y%m%d").date() for k in ("feed_start_date","feed_end_date")]
    services = calendar(archive,start,end)
    data = extract(archive)
    active = set(data["events"])
    if not active or not any(active.intersection(ids) for ids in services.values()):
        raise ValueError("No matching scheduled service")
    data.update(calendar={day:[i for i in ids if i in active] for day,ids in services.items()},
                start=start.isoformat(), end=end.isoformat(), version=feed["feed_version"],
                retrieved=datetime.now(timezone.utc).date().isoformat(), source=URL)
    return data

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--feed",type=Path,help="Existing official GTFS ZIP for offline validation")
    args = parser.parse_args()
    raw = args.feed.read_bytes() if args.feed else urlopen(URL,timeout=100).read()
    with ZipFile(BytesIO(raw)) as archive:
        data = snapshot(archive)
    output = ROOT/"web/data"
    output.mkdir(parents=True,exist_ok=True)
    for file,obj in [("schedule",data),("status",{**{k:data[k] for k in ("start","end","version","retrieved")},"routes":len({label[1] for label in data["labels"]})})]:
        stage = output/(file+".tmp")
        stage.write_text(json.dumps(obj,ensure_ascii=False,separators=(",",":"))+"\n")
        stage.replace(output/(file+".json"))

def extract(archive):
    hubs = {}
    for row in rows(archive, "stops"):
        name = row["stop_name"]
        for prefix, hub in (("Carvolth Exchange @ ", "Carvolth"), ("Lougheed Station @ ", "Lougheed"), ("Lougheed Town Centre Station @ Platform ", "Lougheed")):
            if name.startswith(prefix):
                hubs[row["stop_id"]] = [hub, name.split(" @ ")[-1]]
    routes = {r["route_id"]: r["route_short_name"] or r["route_long_name"] for r in rows(archive,"routes")}
    trips = {r["trip_id"]: r for r in rows(archive,"trips")}
    bounds, visits = {}, []
    for row in rows(archive,"stop_times"):
        trip, seq = row["trip_id"], int(row["stop_sequence"])
        low, high = bounds.get(trip,(seq,seq))
        bounds[trip] = min(low,seq), max(high,seq)
        if row["stop_id"] in hubs:
            hub = hubs[row["stop_id"]][0]
            if hub == "Carvolth" or routes[trips[trip]["route_id"]] in ("555","Expo Line","Millennium Line"):
                visits.append(row)
    labels, events = [], defaultdict(lambda: defaultdict(set))
    for row in visits:
        trip = trips[row["trip_id"]]
        hub, bay = hubs[row["stop_id"]]
        route = routes[trip["route_id"]]
        low, high = bounds[row["trip_id"]]
        seq = int(row["stop_sequence"])
        for role, timefield, usable in (("in","arrival_time",seq>low and row["drop_off_type"] in ("","0")),("out","departure_time",seq<high and row["pickup_type"] in ("","0"))):
            if usable:
                label = [hub, route, trip["trip_headsign"], bay, role]
                if label not in labels:
                    labels.append(label)
                events[trip["service_id"]][str(labels.index(label))].add(minute(row[timefield]))
    if not all(any(r[0]==hub and r[1]=="555" and r[-1]==role for r in labels) for hub in ("Carvolth","Lougheed") for role in ("in","out")):
        raise ValueError("Route 555 coverage incomplete")
    return {"events":{k:{label: sorted(times) for label,times in v.items()} for k,v in events.items()},"labels":labels}

if __name__ == "__main__":
    main()
