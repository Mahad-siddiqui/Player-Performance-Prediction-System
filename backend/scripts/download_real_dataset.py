from pathlib import Path
import warnings

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")


def extract_position(positions_list):
    """Extract primary position name from StatsBomb positions list."""
    if positions_list and len(positions_list) > 0:
        return positions_list[0].get("position", "Unknown")
    return "Unknown"


def extract_minutes_from_positions(positions_list):
    """Calculate minutes played from position time intervals."""
    if not positions_list:
        return 90
    total = 0
    for p in positions_list:
        start = p.get("from", "00:00") or "00:00"
        end = p.get("to", "90:00") or "90:00"
        try:
            start_parts = start.split(":")
            end_parts = end.split(":")
            start_mins = int(start_parts[0]) + int(start_parts[1]) / 60
            end_mins = int(end_parts[0]) + int(end_parts[1]) / 60
            total += max(0, end_mins - start_mins)
        except (ValueError, IndexError, AttributeError):
            total += 90
            break
    return min(int(total), 90)


def main():
    try:
        from statsbombpy import sb
    except ImportError:
        print("Error: statsbombpy not installed. Run: pip install statsbombpy")
        return

    backend_root = Path(__file__).resolve().parents[1]
    out_dir = backend_root / "data" / "real_csv"
    out_dir.mkdir(parents=True, exist_ok=True)

    np.random.seed(42)

    competition_id = 11
    season_id = 90

    print(f"Fetching La Liga matches (competition_id={competition_id}, season_id={season_id})...")
    try:
        matches = sb.matches(competition_id=competition_id, season_id=season_id)
    except Exception as e:
        print(f"Error fetching matches: {e}")
        return

    if matches.empty:
        print("No matches found for the specified competition/season.")
        return

    print(f"Found {len(matches)} matches. Fetching lineups and events...")

    all_players = {}
    match_records = []
    player_appearances = {}

    for idx, match_row in matches.iterrows():
        match_id = match_row["match_id"]
        match_date = match_row["match_date"]
        home_team = match_row["home_team"]
        away_team = match_row["away_team"]

        print(f"  Processing match {idx + 1}/{len(matches)}: {home_team} vs {away_team} ({match_date})")

        try:
            lineups = sb.lineups(match_id=match_id)
        except Exception as e:
            print(f"    Skipping lineups for match {match_id}: {e}")
            continue

        try:
            events = sb.events(match_id=match_id)
        except Exception as e:
            print(f"    Skipping events for match {match_id}: {e}")
            continue

        for team_name, lineup_df in lineups.items():
            for _, player_row in lineup_df.iterrows():
                pid = player_row["player_id"]
                player_name = player_row["player_name"]
                jersey_number = player_row.get("jersey_number") or 1
                country = player_row.get("country") or "Unknown"
                positions_list = player_row["positions"]

                position = extract_position(positions_list)
                minutes_played = extract_minutes_from_positions(positions_list)

                if pid not in all_players:
                    all_players[pid] = {
                        "external_id": pid,
                        "name": player_name,
                        "position": position,
                        "number": jersey_number,
                        "age": np.random.randint(20, 36),
                        "nationality": country,
                        "team": team_name,
                    }

                player_appearances[pid] = player_appearances.get(pid, 0) + 1

                player_events = events[events["player_id"] == pid]

                shots = player_events[player_events["type"] == "Shot"]
                goals = int((shots["shot_outcome"] == "Goal").sum())

                passes = player_events[player_events["type"] == "Pass"]
                total_passes = len(passes)
                completed_passes = int(passes["pass_outcome"].isna().sum())
                pass_accuracy = (completed_passes / total_passes * 100) if total_passes > 0 else 0.0

                pass_assists = passes["pass_shot_assist"].dropna()
                assists = int(pass_assists.sum()) if len(pass_assists) > 0 else 0

                duels = player_events[player_events["type"] == "Duel"]
                tackles = int((duels["duel_type"] == "Tackle").sum())

                carries = player_events[player_events["type"] == "Carry"]
                distance_covered = carries["duration"].sum() if len(carries) > 0 else 0.0
                distance_covered = round(distance_covered, 2)
                if distance_covered <= 0:
                    distance_covered = 10.0

                num_shots = len(shots)
                speed = round(float(np.random.uniform(20, 32)), 2)

                opponent = away_team if team_name == home_team else home_team

                match_records.append({
                    "external_id": pid,
                    "match_date": str(match_date),
                    "opponent": opponent,
                    "goals": goals,
                    "assists": assists,
                    "tackles": tackles,
                    "distance_covered": distance_covered,
                    "speed": speed,
                    "shots": num_shots,
                    "pass_accuracy": round(pass_accuracy, 2),
                    "minutes_played": minutes_played,
                })

    if not all_players:
        print("No players found. Check your data source.")
        return

    top_players = sorted(player_appearances.items(), key=lambda x: x[1], reverse=True)[:40]
    top_ids = {pid for pid, _ in top_players}

    players_filtered = {pid: data for pid, data in all_players.items() if pid in top_ids}
    players_df = pd.DataFrame(players_filtered.values())
    players_df.to_csv(out_dir / "players.csv", index=False)

    match_df = pd.DataFrame(match_records)
    match_df = match_df[match_df["external_id"].isin(top_ids)]

    existing_match_dates = set()
    deduped_matches = []
    for _, row in match_df.iterrows():
        key = (row["external_id"], row["match_date"], row["opponent"])
        if key not in existing_match_dates:
            existing_match_dates.add(key)
            deduped_matches.append(row)
    match_df = pd.DataFrame(deduped_matches)
    match_df.to_csv(out_dir / "match_records.csv", index=False)

    wellness_rows = []
    for _, match_row in match_df.iterrows():
        pid = match_row["external_id"]
        match_date = match_row["match_date"]
        try:
            record_date = str(pd.Timestamp(match_date) + pd.Timedelta(days=1))
            record_date = record_date[:10]
        except Exception:
            record_date = match_date

        mins = match_row["minutes_played"]
        tackles_val = match_row["tackles"]
        dist = match_row["distance_covered"]

        fatigue_score = round(float(np.clip(10 - (mins / 90 * 8) + np.random.normal(0, 0.5), 1, 10)), 2)
        sleep_quality = round(float(np.clip(np.random.normal(7, 1.5), 1, 10)), 2)
        hydration = round(float(np.clip(np.random.normal(7, 1), 1, 10)), 2)
        muscle_soreness = round(float(np.clip(
            tackles_val * 0.6 + dist * 0.15 + np.random.normal(2, 0.8), 1, 10
        )), 2)
        heart_rate = int(np.clip(np.random.normal(68, 8), 55, 85))
        recovery_score = round(float(np.clip(
            (sleep_quality + hydration - fatigue_score / 2) + np.random.normal(0, 0.3), 1, 10
        )), 2)

        wellness_rows.append({
            "external_id": pid,
            "record_date": record_date,
            "heart_rate": heart_rate,
            "fatigue_score": fatigue_score,
            "sleep_quality": sleep_quality,
            "hydration": hydration,
            "muscle_soreness": muscle_soreness,
            "recovery_score": recovery_score,
        })

    wellness_df = pd.DataFrame(wellness_rows)
    wellness_df = wellness_df[wellness_df["external_id"].isin(top_ids)]
    wellness_df.to_csv(out_dir / "wellness_records.csv", index=False)

    print(f"\nDownload complete!")
    print(f"  Players: {len(players_df)}")
    print(f"  Match records: {len(match_df)}")
    print(f"  Wellness records: {len(wellness_df)}")
    print(f"  Output directory: {out_dir}")


if __name__ == "__main__":
    main()
