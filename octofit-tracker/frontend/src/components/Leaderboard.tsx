import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; leaderboard: Entry[] };

export default function Leaderboard() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then((body) => { if (active) setState({ status: 'ready', leaderboard: body.leaderboard }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
        {state.status === 'error' && <p role="alert">Unable to load the leaderboard.</p>}
        {state.status === 'ready' && state.leaderboard.length === 0 && <p>No rankings yet.</p>}
        {state.status === 'ready' && state.leaderboard.length > 0 && (
          <ol>
            {state.leaderboard.map((entry) => (
              <li key={entry.teamName}>{entry.teamName}: {entry.totalPoints} pts</li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
