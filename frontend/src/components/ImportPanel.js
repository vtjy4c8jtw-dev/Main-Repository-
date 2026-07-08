import React, { useRef, useState } from 'react';
import { uploadStravaExport, clearImportedData } from '../api/client';

export default function ImportPanel({ importStatus, onChange }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const res = await uploadStravaExport(file, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      setResult(res);
      onChange();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function handleClear() {
    await clearImportedData();
    setResult(null);
    onChange();
  }

  return (
    <div>
      <div className="card-title" style={{ marginBottom: 6 }}>
        Import a Strava data export
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
        Downloaded your Strava archive (Settings → My Account → Download or Delete Your Account)?
        Upload the <code>.zip</code> or its <code>activities.csv</code> to use it here — no Strava API
        connection required.
      </div>

      {importStatus?.imported && (
        <div className="pill pill-long_run" style={{ display: 'inline-block', marginBottom: 12 }}>
          {importStatus.count} runs imported ({importStatus.dateRange?.from} – {importStatus.dateRange?.to})
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          ref={fileInput}
          type="file"
          accept=".zip,.csv"
          onChange={handleFile}
          disabled={uploading}
        />
        {uploading && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Uploading… {progress}%</span>}
        {importStatus?.imported && !uploading && (
          <button onClick={handleClear} title="Remove imported data">
            Clear imported data
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: 'var(--critical)', fontSize: 13, marginTop: 8 }}>{error}</div>
      )}
      {result && (
        <div style={{ fontSize: 13, marginTop: 8, color: 'var(--text-secondary)' }}>
          Imported {result.count} runs
          {result.dateRange ? ` from ${result.dateRange.from} to ${result.dateRange.to}` : ''}.
          Detected distance unit: {result.detectedUnit}
          {!result.unitConfident && ' (low confidence — check your recent activities look right)'}.
        </div>
      )}
    </div>
  );
}
