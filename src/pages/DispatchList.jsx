import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { downloadCsv } from '../utils/csv';

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

  const handleExport = () => {
    const headers = ['Transaction ID', 'Supplier', 'Dispatch Date & Time', 'Vehicle', 'Dispatch Submitted', 'Receipt Submitted', 'Status'];
    const rows = filtered.map((d) => [
      d.transaction_id,
      d.receiver_name,
      formatDateTime(d.dispatch_date_time),
      d.vehicle_no || 'N/A',
      formatDateTime(d.dispatch_submitted_at),
      formatDateTime(d.receipt_submitted_at),
      d.status.replace('_', ' ')
    ]);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`${(title || 'dispatches').toLowerCase().replace(/\s+/g, '-')}-${stamp}.csv`, headers, rows);
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
        <button type="button" className="btn-primary" style={{ marginLeft: 'auto' }} onClick={handleExport} disabled={filtered.length === 0}>
          Export CSV
        </button>
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
              <tr key={disp.id} className="clickable-row" onClick={() => onOpenDetail(disp.id)}>
                <td style={{ fontWeight: '700', color: 'var(--navy)' }}>{disp.transaction_id}</td>
                <td>{disp.receiver_name}</td>
                <td>{formatDateTime(disp.dispatch_date_time)}</td>
                <td>{disp.vehicle_no || 'N/A'}</td>
                <td>{formatDateTime(disp.dispatch_submitted_at)}</td>
                <td>{formatDateTime(disp.receipt_submitted_at)}</td>
                <td>
                  <span className={`dispatch-status ${disp.status}`}>
                    {disp.status.replace('_', ' ')}
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
