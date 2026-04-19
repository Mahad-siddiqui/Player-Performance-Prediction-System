from pathlib import Path
import numpy as np
import pandas as pd


def main() -> None:
    np.random.seed(42)
    backend_root = Path(__file__).resolve().parents[1]
    out_dir = backend_root / 'data' / 'dummy_csv'
    out_dir.mkdir(parents=True, exist_ok=True)

    players = []
    positions = ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LW', 'RW', 'ST']
    nationalities = ['Spain', 'Brazil', 'Germany', 'England', 'Argentina', 'Japan', 'Egypt', 'Mexico', 'Senegal']
    teams = ['FC United', 'City FC', 'Rovers FC']

    for i in range(1, 41):
        players.append({
            'external_id': f'p{i:03d}',
            'name': f'Player {i}',
            'position': positions[i % len(positions)],
            'number': (i % 30) + 1,
            'age': np.random.randint(18, 36),
            'nationality': nationalities[i % len(nationalities)],
            'team': teams[i % len(teams)],
        })

    players_df = pd.DataFrame(players)
    players_df.to_csv(out_dir / 'players.csv', index=False)

    match_rows = []
    for p in players_df.to_dict('records'):
        for w in range(1, 13):
            match_rows.append({
                'external_id': p['external_id'],
                'match_date': (pd.Timestamp('2026-01-01') + pd.Timedelta(days=7 * w)).date().isoformat(),
                'opponent': f'Opponent {w}',
                'goals': int(np.clip(np.random.poisson(0.35), 0, 3)),
                'assists': int(np.clip(np.random.poisson(0.25), 0, 3)),
                'tackles': int(np.random.randint(0, 8)),
                'distance_covered': float(np.round(np.random.uniform(7.5, 13.5), 2)),
                'speed': float(np.round(np.random.uniform(24, 36), 2)),
                'shots': int(np.random.randint(0, 7)),
                'pass_accuracy': float(np.round(np.random.uniform(70, 96), 2)),
                'minutes_played': int(np.random.choice([60, 70, 75, 80, 85, 90])),
            })

    pd.DataFrame(match_rows).to_csv(out_dir / 'match_records.csv', index=False)

    wellness_rows = []
    for p in players_df.to_dict('records'):
        for d in range(1, 13):
            wellness_rows.append({
                'external_id': p['external_id'],
                'record_date': (pd.Timestamp('2026-01-01') + pd.Timedelta(days=7 * d - 1)).date().isoformat(),
                'heart_rate': int(np.random.randint(55, 92)),
                'fatigue_score': float(np.round(np.random.uniform(15, 85), 2)),
                'sleep_quality': float(np.round(np.random.uniform(55, 98), 2)),
                'hydration': float(np.round(np.random.uniform(58, 99), 2)),
                'muscle_soreness': float(np.round(np.random.uniform(8, 80), 2)),
                'recovery_score': float(np.round(np.random.uniform(45, 97), 2)),
            })

    pd.DataFrame(wellness_rows).to_csv(out_dir / 'wellness_records.csv', index=False)
    print('Dummy CSV files generated in data/dummy_csv')


if __name__ == '__main__':
    main()
