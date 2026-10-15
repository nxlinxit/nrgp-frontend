import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { downloadCsv } from '../utils/csv';
import { buildDispatchRows, buildHistoryRows } from '../utils/dispatchExport';
import { getStatusLabel } from '../constants/statuses';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

const toLocalDateStr = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function DispatchList({ token, status, title, breadcrumb, emptyMessage, onOpenDetail }) {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getDispatches(token, status ? { status } : {});
      setDispatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status]);

  useEffect(() => {
    setSupplierFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  }, [status]);

  const suppliers = useMemo(
    () => Array.from(new Set(dispatches.map((d) => d.receiver_name))).sort(),
    [dispatches]
  );

  const filtered = useMemo(() => {
    return dispatches.filter((d) => {
      if (supplierFilter && d.receiver_name !== supplierFilter) return false;

      if (dateFrom || dateTo) {
        const dispatchDate = toLocalDateStr(d.dispatch_date_time);
        if (dateFrom && dispatchDate < dateFrom) return false;
        if (dateTo && dispatchDate > dateTo) return false;
      }

      if (search) {
        const needle = search.trim().toLowerCase();
        const haystack = `${d.transaction_id || ''} ${d.vehicle_no || ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [dispatches, supplierFilter, dateFrom, dateTo, search]);

  const hasActiveFilters = supplierFilter || dateFrom || dateTo || search;

  const clearFilters = () => {
    setSupplierFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  // Exports re-fetch with package lines and history, then keep only the rows
  // currently shown so the file matches the filters on screen.
  const handleExport = async (kind) => {
    setExporting(true);
    try {
      const data = await api.getDispatches(token, { status, details: true });
      const shownIds = new Set(filtered.map((d) => d.id));
      const rows = (Array.isArray(data) ? data : []).filter((d) => shownIds.has(d.id));
      const { headers, rows: cells } = kind === 'history' ? buildHistoryRows(rows) : buildDispatchRows(rows);
      const stamp = new Date().toISOString().slice(0, 10);
      const base = (title || 'dispatches').toLowerCase().replace(/\s+/g, '-');
      downloadCsv(`${base}${kind === 'history' ? '-history' : ''}-${stamp}.csv`, headers, cells);
    } catch (err) {
      console.error('Export error:', err);
      alert('Could not export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">{title}</h1>
        <span className="breadcrumb-code">{breadcrumb}</span>
      </div>

      <div className="filter-bar">
        <div className="filter-field">
          <label>Supplier</label>
          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="form-select">
            <option value="">All suppliers</option>
            {suppliers.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Dispatch date from</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-field">
          <label>Dispatch date to</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="filter-field">
          <label>Search</label>
          <input type="text" placeholder="Transaction ID or vehicle no." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {hasActiveFilters && (
          <button type="button" className="btn-action" onClick={clearFilters}>Clear filters</button>
        )}
        <div className="action-btn-group" style={{ marginLeft: 'auto' }}>
          <button type="button" className="btn-action" onClick={() => handleExport('history')} disabled={filtered.length === 0 || exporting}>
            Export history
          </button>
          <button type="button" className="btn-primary" onClick={() => handleExport('dispatches')} disabled={filtered.length === 0 || exporting}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <table className="custom-table" style={{ marginTop: '16px' }}>
        <thead>
          <tr>
            <th>TRANSACTION ID</th>
            <th>SUPPLIER</th>
            <th>DISPATCH DATE &amp; TIME</th>
            <th>VEHICLE</th>
            <th>DISPATCH SUBMITTED</th>
            <th>RECEIPT SUBMITTED</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading dispatches...</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan="7" style={{ textAlign: 'center' }}>{dispatches.length === 0 ? (emptyMessage || 'No dispatches found.') : 'No dispatches match the current filters.'}</td></tr>
          ) : (
            filtered.map((disp) => (
              <tr key={disp.id} className={`clickable-row ${disp.unread ? 'unread' : ''}`} onClick={() => onOpenDetail(disp.id)}>
                <td style={{ fontWeight: '700', color: 'var(--navy)' }}>
                  {disp.unread && <span className="unread-dot" title="New activity" />}
                  {disp.transaction_id}
                </td>
                <td>{disp.receiver_name}</td>
                <td>{formatDateTime(disp.dispatch_date_time)}</td>
                <td>{disp.vehicle_no || 'N/A'}</td>
                <td>{formatDateTime(disp.dispatch_submitted_at)}</td>
                <td>{formatDateTime(disp.receipt_submitted_at)}</td>
                <td>
                  <span className={`dispatch-status ${disp.status}`}>
                    {getStatusLabel(disp.status)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
