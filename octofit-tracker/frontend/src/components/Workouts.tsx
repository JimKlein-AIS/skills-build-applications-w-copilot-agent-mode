import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason: string };
type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; suggestions: Suggestion[] };

const demoUserEmail = 'mona@example.com';

export default function Workouts() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(demoUserEmail)}`)
      .then((body) => { if (active) setState({ status: 'ready', suggestions: body.suggestions }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
        {state.status === 'error' && <p role="alert">Unable to load workout suggestions.</p>}
        {state.status === 'ready' && state.suggestions.length === 0 && <p>No workout suggestions yet.</p>}
        {state.status === 'ready' && state.suggestions.length > 0 && (
          <ul>
            {state.suggestions.map((suggestion) => (
              <li key={suggestion.title}>{suggestion.title}: {suggestion.reason}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
