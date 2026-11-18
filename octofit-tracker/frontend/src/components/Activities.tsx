import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };
type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; activities: Activity[] };

export default function Activities() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((body) => { if (active) setState({ status: 'ready', activities: body.activities }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {state.status === 'loading' && <p role="status">Loading activities...</p>}
        {state.status === 'error' && <p role="alert">Unable to load activities.</p>}
        {state.status === 'ready' && state.activities.length === 0 && <p>No activities yet.</p>}
        {state.status === 'ready' && state.activities.length > 0 && (
          <ul>
            {state.activities.map((activity, index) => (
              <li key={index}>{activity.type}: {activity.minutes} min, {activity.points} pts</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
