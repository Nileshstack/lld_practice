import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AttemptDetail, Evaluation } from './types';

function FeedbackView() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState('');
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    let intervalId: number | undefined;
    let latestStatus: string | undefined;

    const fetchAttempt = async () => {
      const response = await fetch(`/api/attempts/${id}`);
      if (!response.ok) throw new Error('Could not load attempt feedback');
      const nextAttempt = await response.json() as AttemptDetail;
      if (cancelled) return;

      setAttempt(nextAttempt);
      latestStatus = nextAttempt.status;
      if (nextAttempt.evaluation) {
        setEvaluation(nextAttempt.evaluation);
      }
      if (nextAttempt.status === 'Completed' || nextAttempt.status === 'Failed') {
        setIsPolling(false);
        if (intervalId !== undefined) window.clearInterval(intervalId);
      }
    };

    const startEvaluation = async () => {
      try {
        await fetch(`/api/attempts/${id}/evaluate`, { method: 'POST' });
      } catch {
        // The status endpoint remains the source of truth for completion or failure.
      }
    };

    const initialize = async () => {
      try {
        await fetchAttempt();
        if (!cancelled && latestStatus !== 'Completed' && latestStatus !== 'Failed') {
          await startEvaluation();
        }
      } catch {
        if (!cancelled) setError('Unable to load this attempt.');
      }

      if (!cancelled && latestStatus !== 'Completed' && latestStatus !== 'Failed') {
        intervalId = window.setInterval(() => {
          fetchAttempt().catch(() => {
            if (!cancelled) setError('Unable to refresh evaluation status.');
          });
        }, 1500);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [id]);

  if (error) {
    return <section className="page-shell"><p className="feedback error" role="alert">{error}</p><Link className="text-link" to="/problems">Back to problems</Link></section>;
  }

  const statusLabel = attempt?.status === 'Evaluating' ? 'Reviewing your design...' : 'Preparing your feedback...';

  return (
    <section className="page-shell feedback-page">
      <Link className="back-link" to="/problems">← All problems</Link>
      <header className="page-heading">
        <p className="eyebrow">Attempt #{id}</p>
        <h1>{evaluation ? 'Your design review.' : 'Your submission is in review.'}</h1>
        <p className="intro">{isPolling ? statusLabel : attempt?.status === 'Failed' ? 'This attempt could not be evaluated.' : 'Here is the feedback on your design.'}</p>
      </header>

      {evaluation ? (
        <>
          <section className="score-panel">
            <span className="eyebrow">Overall score</span>
            <strong className={evaluation.overallScore >= 80 ? 'score-high' : evaluation.overallScore >= 60 ? 'score-medium' : 'score-low'}>{Math.round(evaluation.overallScore)}<small>/100</small></strong>
          </section>
          <section className="criteria-list" aria-label="Evaluation criteria">
            {evaluation.criteriaResults.map((result) => (
              <article className="criteria-card" key={result.criterion}>
                <div className="criteria-card-heading">
                  <h2>{result.criterion}</h2>
                  <span className="criteria-score">{Math.round(result.score)}/100</span>
                </div>
                <p><b>Evidence</b>{result.evidence}</p>
                <p><b>Suggestion</b>{result.suggestion}</p>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section className={`status-panel ${attempt?.status === 'Failed' ? 'error' : ''}`} aria-live="polite">
          <span className={`status-dot ${attempt?.status === 'Failed' ? '' : 'spinner'}`} />
          {attempt?.status === 'Failed' ? 'Evaluation failed. Please try again.' : statusLabel}
        </section>
      )}

      <Link className="button-link" to={attempt ? `/problems/${attempt.problemId}` : '/problems'}>Try Again</Link>
    </section>
  );
}

export default FeedbackView;
