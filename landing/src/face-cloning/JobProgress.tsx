import {useEffect, useState} from 'react';

type Props = {kind: string; status: string; createdAt?: string};

export default function JobProgress({kind, status, createdAt}: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const start = createdAt ? Date.parse(createdAt) : NaN;
  const elapsed = Number.isFinite(start) ? Math.max(0, Math.floor((now - start) / 1000)) : null;
  const title = status === 'queued' ? 'Waiting to start'
    : status === 'launching' || status === 'submitting' ? 'Starting your job'
    : kind === 'voice' ? 'Creating your voice' : 'Generating audio and video';
  return <div className="face-job-progress">
    <div className="face-job-progress-heading">
      <strong role="status">{title}</strong>
      {elapsed !== null && <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} elapsed</span>}
    </div>
    <div className="face-job-progress-track" role="progressbar" aria-label={title}>
      <span />
    </div>
    <p className="face-meta">This can take a few minutes. You can leave this page; it will update automatically when your job finishes.</p>
  </div>;
}
