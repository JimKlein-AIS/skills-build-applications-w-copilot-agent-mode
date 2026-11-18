import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot: string; members: string[] };
type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; teams: Team[] };

export default function Teams() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((body) => { if (active) setState({ status: 'ready', teams: body.teams }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {state.status === 'loading' && <p role="status">Loading teams...</p>}
        {state.status === 'error' && <p role="alert">Unable to load teams.</p>}
        {state.status === 'ready' && state.teams.length === 0 && <p>No teams yet.</p>}
        {state.status === 'ready' && state.teams.length > 0 && (
          <ul>
            {state.teams.map((team) => (
              <li key={team.name}>{team.name} ({team.members.length} members)</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
