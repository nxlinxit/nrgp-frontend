import React from 'react';

export default function Header({ title, breadcrumb }) {
  return (
    <header className="top-header">
      <div className="header-breadcrumbs">
        <span className="breadcrumb-root">Portal</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{breadcrumb || title}</span>
      </div>

      <div className="header-right">
        <span className="live-indicator">• System Live</span>
      </div>
    </header>
  );
}