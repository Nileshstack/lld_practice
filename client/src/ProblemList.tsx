import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Problem } from './types';

function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/problems')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load problems');
        return response.json() as Promise<Problem[]>;
      })
      .then(setProblems)
      .catch(() => setError('Unable to load problems. Check that the server is running.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page-shell">
      <header className="page-heading">
        <p className="eyebrow">LLD practice platform</p>
        <h1>Choose a design problem.</h1>
        <p className="intro">Practice the decisions that turn a sketch into a system.</p>
      </header>

      {loading && <p className="feedback">Loading problems...</p>}
      {error && <p className="feedback error" role="alert">{error}</p>}

      {!loading && !error && (
        <div className="problem-grid">
          {problems.map((problem) => (
            <Link className="problem-card" to={`/problems/${problem.id}`} key={problem.id}>
              <div className="card-topline">
                <span className={`difficulty difficulty-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
                <span className="card-arrow" aria-hidden="true">↗</span>
              </div>
              <h2>{problem.title}</h2>
              <div className="tag-list">
                {problem.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProblemList;
