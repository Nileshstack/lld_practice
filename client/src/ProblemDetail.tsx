import { FormEvent, useEffect, useState } from 'react';
import AttemptHistory from './AttemptHistory';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Attempt, Problem } from './types';

function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionType, setSubmissionType] = useState<'text' | 'code'>('text');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then((response) => {
        if (response.status === 404) throw new Error('Problem not found');
        if (!response.ok) throw new Error('Could not load problem');
        return response.json() as Promise<Problem>;
      })
      .then(setProblem)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !submissionText.trim()) {
      setError('Add a submission before sending it.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: Number(id),
          submissionText: submissionText.trim(),
          submissionType
        })
      });
      if (!response.ok) {
        const body = await response.json() as { error?: string };
        throw new Error(body.error || 'Could not submit attempt');
      }
      const attempt = await response.json() as Attempt;
      setSubmissionText('');
      navigate(`/attempts/${attempt.id}/feedback`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit attempt');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <section className="page-shell"><p className="feedback">Loading problem...</p></section>;
  if (error && !problem) return <section className="page-shell"><p className="feedback error" role="alert">{error}</p><Link className="text-link" to="/problems">Back to problems</Link></section>;
  if (!problem) return null;

  return (
    <section className="page-shell detail-page">
      <Link className="back-link" to="/problems">← All problems</Link>
      <header className="detail-heading">
        <div className="card-topline">
          <span className={`difficulty difficulty-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
        </div>
        <h1>{problem.title}</h1>
        <div className="tag-list">
          {problem.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
        </div>
      </header>

      <p className="description">{problem.description}</p>

      <form className="submission-form" onSubmit={handleSubmit}>
        <div className="form-heading">
          <div>
            <p className="eyebrow">Your response</p>
            <h2>Show your design thinking.</h2>
          </div>
          <label>
            Format
            <select value={submissionType} onChange={(event) => setSubmissionType(event.target.value as 'text' | 'code')}>
              <option value="text">Text</option>
              <option value="code">Code</option>
            </select>
          </label>
        </div>
        <textarea
          value={submissionText}
          onChange={(event) => setSubmissionText(event.target.value)}
          placeholder="Describe your classes, relationships, and key design decisions..."
          rows={10}
          required
        />
        {error && <p className="form-message error" role="alert">{error}</p>}
        {success && <p className="form-message success" role="status">{success}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit attempt'}</button>
      </form>
      <AttemptHistory problemId={problem.id} />
    </section>
  );
}

export default ProblemDetail;
