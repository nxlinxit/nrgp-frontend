import React, { useState } from 'react';
import { downloadCsv, parseCsv } from '../utils/csv';

export default function BulkUploadModal({ title, sampleFilename, sampleHeaders, sampleRows, onUpload, onClose, onDone }) {
  const [fileName, setFileName] = useState('');
  const [records, setRecords] = useState(null);
  const [parseError, setParseError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownloadSample = () => {
    downloadCsv(sampleFilename, sampleHeaders, sampleRows);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    setResult(null);
    setParseError('');
    setRecords(null);
    if (!file) return;

    setFileName(file.name);
    try {
      const text = await file.text();
      const { records: parsed } = parseCsv(text);
      if (parsed.length === 0) {
        setParseError('This file has no data rows.');
        return;
      }
      setRecords(parsed);
    } catch (err) {
      console.error('CSV parse error:', err);
      setParseError('Could not read this file. Make sure it is a valid CSV.');
    }
  };

  const handleSubmit = async () => {
    if (!records || records.length === 0) return;
    setSubmitting(true);
    try {
      const data = await onUpload(records);
      setResult(data);
    } catch (err) {
      console.error('Bulk upload error:', err);
      setResult({ created: 0, errors: [{ row: '-', message: 'Unable to reach the server. Please try again.' }] });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (result && result.created > 0) onDone();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '560px' }}>
        <h3>{title}</h3>

        {!result && (
          <>
            <ol style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              <li>Download the sample CSV and fill it in (one row per record).</li>
              <li>Upload the filled CSV.</li>
              <li>Click Submit.</li>
            </ol>

            <button type="button" className="btn-action" onClick={handleDownloadSample} style={{ marginBottom: '16px' }}>
              Download sample CSV
            </button>

            <div className="form-field">
              <label>Upload filled CSV</label>
              <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
            </div>

            {parseError && (
              <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '12px' }}>
                {parseError}
              </div>
            )}

            {records && !parseError && (
              <p className="sub">{fileName}: {records.length} row{records.length === 1 ? '' : 's'} ready to submit.</p>
            )}

            <div className="modal-footer">
              <button type="button" className="btn-action" onClick={onClose}>Cancel</button>
              <button type="button" className="btn-primary" disabled={!records || submitting} onClick={handleSubmit}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </>
        )}

        {result && (
          <>
            <div style={{ padding: '10px 12px', background: result.created > 0 ? '#DCFCE7' : '#FEF3C7', color: result.created > 0 ? '#15803D' : '#B45309', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '12px' }}>
              {result.created} record{result.created === 1 ? '' : 's'} created successfully.
              {result.created > 0 && result.defaultPassword && ` Default login password: ${result.defaultPassword}`}
            </div>

            {result.errors && result.errors.length > 0 && (
              <>
                <p className="sub">{result.errors.length} row{result.errors.length === 1 ? '' : 's'} skipped:</p>
                <table className="custom-table" style={{ boxShadow: 'none', marginBottom: '16px' }}>
                  <thead>
                    <tr>
                      <th>ROW</th>
                      <th>ISSUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, idx) => (
                      <tr key={idx}>
                        <td>{e.row}</td>
                        <td>{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={handleClose}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
