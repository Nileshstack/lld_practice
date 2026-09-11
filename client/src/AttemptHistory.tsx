import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { AttemptDetail } from './types';

interface AttemptHistoryProps {
  problemId: number;
}

function AttemptHistory({ problemId }: AttemptHistoryProps) {
  const location = useLocation();
  const [attempts, setAttempts] = useState<AttemptDetail[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/attempts?problemId=${problemId}`)
      .then((response) => {
        if (!response.ok) throw new Error('Could not load attempt history');
        return response.json() as Promise<AttemptDetail[]>;
      })
      .then((nextAttempts) => {
        if (!cancelled) setAttempts(nextAttempts);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load attempt history.');
      });

    return () => {
      cancelled = true;
    };
  }, [problemId, location.key]);

  return (
    <section className="history-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Practice log</p>
          <h2>Past attempts</h2>
        </div>
        <span className="history-count">{attempts.length}</span>
      </div>
      {error && <p className="form-message error" role="alert">{error}</p>}
      {!error && attempts.length === 0 && <p className="history-empty">Your completed attempts will appear here.</p>}
      {attempts.length > 0 && (
        <div className="history-list">
          {attempts.map((attempt) => (
            <Link className="history-row" to={`/attempts/${attempt.id}/feedback`} key={attempt.id}>
              <span>
                <strong>Attempt #{attempt.id}</strong>
                <small>{new Date(attempt.createdAt).toLocaleString()}</small>
              </span>
              <span className={`history-status ${attempt.status.toLowerCase()}`}>
                {attempt.evaluation ? `${Math.round(attempt.evaluation.overallScore)}/100` : attempt.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default AttemptHistory;
