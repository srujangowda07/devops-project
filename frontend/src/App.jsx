import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Cloud,
  Cpu,
  Database,
  DollarSign,
  Edit2,
  HardDrive,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  createIncident,
  createResource,
  deleteIncident,
  deleteResource,
  fetchHealth,
  fetchIncidents,
  fetchResources,
  fetchStats,
  updateIncident,
  updateResource,
} from './api';
import './App.css';

export default function App() {
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const [backendHealthy, setBackendHealthy] = useState(null);

  // Filters & Tabs
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('resources'); // 'resources' | 'incidents'

  // Modals state
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    name: '',
    resource_type: 'Kubernetes Cluster',
    cloud_provider: 'AWS',
    region: 'ap-south-1',
    status: 'running',
    cost_per_month: 120,
  });

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    resource_id: '',
    title: '',
    severity: 'medium',
    status: 'open',
    description: '',
  });

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async (isManualSync = false) => {
    if (isManualSync) {
      setSyncing(true);
    } else {
      setLoading(true);
    }

    try {
      try {
        await fetchHealth();
        setBackendHealthy(true);
      } catch {
        setBackendHealthy(false);
      }

      const [statsData, resourcesData, incidentsData] = await Promise.all([
        fetchStats(),
        fetchResources({ provider: providerFilter, status: statusFilter }),
        fetchIncidents(),
      ]);

      setStats(statsData);
      setResources(resourcesData);
      setIncidents(incidentsData);

      if (isManualSync) {
        notify('Telemetry synchronized successfully');
      }
    } catch (err) {
      notify(err.message || 'Error communicating with CloudPulse API', 'error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [providerFilter, statusFilter]);

  // Keyboard accessibility: Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isResourceModalOpen) setIsResourceModalOpen(false);
        if (isIncidentModalOpen) setIsIncidentModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResourceModalOpen, isIncidentModalOpen]);

  // Open resource modal for create
  const handleOpenCreateResource = () => {
    setEditingResource(null);
    setResourceForm({
      name: '',
      resource_type: 'Kubernetes Cluster',
      cloud_provider: 'AWS',
      region: 'ap-south-1',
      status: 'running',
      cost_per_month: 120,
    });
    setIsResourceModalOpen(true);
  };

  // Open resource modal for edit
  const handleOpenEditResource = (resource) => {
    setEditingResource(resource);
    setResourceForm({
      name: resource.name,
      resource_type: resource.resource_type,
      cloud_provider: resource.cloud_provider,
      region: resource.region,
      status: resource.status,
      cost_per_month: resource.cost_per_month,
    });
    setIsResourceModalOpen(true);
  };

  // Save resource (create or update)
  const handleSaveResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.name.trim()) {
      notify('Resource name is required', 'error');
      return;
    }
    if (Number(resourceForm.cost_per_month) < 0) {
      notify('Monthly cost cannot be negative', 'error');
      return;
    }

    setIsSubmittingResource(true);
    try {
      const payload = {
        ...resourceForm,
        cost_per_month: parseFloat(resourceForm.cost_per_month),
      };

      if (editingResource) {
        await updateResource(editingResource.id, payload);
        notify(`Updated resource: ${resourceForm.name}`);
      } else {
        await createResource(payload);
        notify(`Registered resource: ${resourceForm.name}`);
      }
      setIsResourceModalOpen(false);
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setIsSubmittingResource(false);
    }
  };

  // Delete resource
  const handleDeleteResource = async (resource) => {
    const confirmed = window.confirm(
      `Are you sure you want to decommission "${resource.name}"? All associated incident logs will also be removed.`
    );
    if (!confirmed) return;

    try {
      await deleteResource(resource.id);
      notify(`Decommissioned asset: ${resource.name}`);
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Open incident modal
  const handleOpenCreateIncident = (targetResourceId = '') => {
    setIncidentForm({
      resource_id: targetResourceId || (resources.length > 0 ? resources[0].id : ''),
      title: '',
      severity: 'medium',
      status: 'open',
      description: '',
    });
    setIsIncidentModalOpen(true);
  };

  // Save incident
  const handleSaveIncident = async (e) => {
    e.preventDefault();
    if (!incidentForm.title.trim()) {
      notify('Incident title is required', 'error');
      return;
    }
    if (!incidentForm.resource_id) {
      notify('Target resource must be selected', 'error');
      return;
    }

    setIsSubmittingIncident(true);
    try {
      await createIncident({
        ...incidentForm,
        resource_id: parseInt(incidentForm.resource_id, 10),
      });
      notify(`Logged incident: ${incidentForm.title}`);
      setIsIncidentModalOpen(false);
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  // Resolve incident
  const handleResolveIncident = async (incident) => {
    try {
      await updateIncident(incident.id, { status: 'resolved' });
      notify(`Resolved incident #${incident.id}`);
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Delete incident
  const handleDeleteIncident = async (incident) => {
    const confirmed = window.confirm(`Permanently delete incident record #${incident.id}?`);
    if (!confirmed) return;

    try {
      await deleteIncident(incident.id);
      notify(`Deleted incident #${incident.id}`);
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Filtered resources based on search query
  const filteredResources = resources.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper for consistent resource vector icons
  const renderResourceIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('kubernetes') || t.includes('cluster') || t.includes('container')) {
      return <Layers size={16} />;
    }
    if (t.includes('database') || t.includes('redis') || t.includes('sql')) {
      return <Database size={16} />;
    }
    if (t.includes('warehouse') || t.includes('analytics') || t.includes('storage') || t.includes('s3')) {
      return <HardDrive size={16} />;
    }
    if (t.includes('compute') || t.includes('vm') || t.includes('ec2')) {
      return <Cpu size={16} />;
    }
    return <Cloud size={16} />;
  };

  return (
    <div className="app-layout">
      {/* Top Enterprise Navigation Header */}
      <header className="top-nav">
        <div className="top-nav-inner">
          <div className="brand-section">
            <div className="brand-logo-icon" aria-hidden="true">
              <Activity size={20} />
            </div>
            <div className="brand-details">
              <span className="brand-title">CloudPulse</span>
              <span className="brand-subtitle">Cloud Infrastructure Operations</span>
            </div>
          </div>

          <div className="header-status-area">
            <div className="connectivity-pill">
              <span
                className={`status-dot ${backendHealthy ? 'connected' : 'disconnected'}`}
                aria-hidden="true"
              ></span>
              <span>{backendHealthy ? 'API Connected' : 'API Disconnected'}</span>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => loadData(true)}
              disabled={syncing}
              title="Synchronize real-time telemetry"
            >
              <RefreshCw size={14} className={syncing ? 'spin-icon' : ''} />
              <span>{syncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* KPI Summary Cards Grid */}
        <section className="summary-grid" aria-label="Operational Metrics Summary">
          {/* Card 1: Total Infrastructure Assets */}
          <div className="summary-card">
            <div className="summary-card-accent blue"></div>
            <div className="summary-card-header">
              <span className="summary-card-label">Total Assets</span>
              <div className="summary-icon-box blue" aria-hidden="true">
                <Server size={18} />
              </div>
            </div>
            <div className="summary-card-value">
              {stats ? stats.total_resources : '—'}
            </div>
            <div className="summary-card-footer">
              <span>AWS: {stats?.by_provider.AWS || 0}</span>
              <span>•</span>
              <span>GCP: {stats?.by_provider.GCP || 0}</span>
              <span>•</span>
              <span>Azure: {stats?.by_provider.Azure || 0}</span>
            </div>
          </div>

          {/* Card 2: Estimated Monthly Spend */}
          <div className="summary-card">
            <div className="summary-card-accent violet"></div>
            <div className="summary-card-header">
              <span className="summary-card-label">Monthly Spend</span>
              <div className="summary-icon-box violet" aria-hidden="true">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="summary-card-value">
              ${stats ? Number(stats.total_monthly_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <div className="summary-card-footer">
              <span>Projected run-rate across active clouds</span>
            </div>
          </div>

          {/* Card 3: Running Resources Health */}
          <div className="summary-card">
            <div className="summary-card-accent teal"></div>
            <div className="summary-card-header">
              <span className="summary-card-label">Active Resources</span>
              <div className="summary-icon-box teal" aria-hidden="true">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="summary-card-value">
              {stats ? stats.by_status.running || 0 : '0'}
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '6px' }}>
                / {stats ? stats.total_resources : 0} running
              </span>
            </div>
            <div className="summary-card-footer">
              <span>Degraded: {stats?.by_status.degraded || 0} • Stopped: {stats?.by_status.stopped || 0}</span>
            </div>
          </div>

          {/* Card 4: Open Incidents */}
          <div className="summary-card">
            <div className="summary-card-accent amber"></div>
            <div className="summary-card-header">
              <span className="summary-card-label">Open Incidents</span>
              <div className="summary-icon-box amber" aria-hidden="true">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="summary-card-value">
              {stats ? stats.open_incidents : 0}
            </div>
            <div className="summary-card-footer">
              <span>{incidents.filter((i) => i.status !== 'resolved').length} requiring operational attention</span>
            </div>
          </div>
        </section>

        {/* Control & Filter Bar */}
        <section className="control-bar" aria-label="Table Controls and Filters">
          <div className="search-and-filters">
            <div className="search-box">
              <Search size={16} className="search-box-icon" aria-hidden="true" />
              <input
                type="text"
                className="search-input"
                placeholder="Search resources, types, regions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              aria-label="Filter by cloud provider"
            >
              <option value="ALL">All Providers</option>
              <option value="AWS">AWS</option>
              <option value="GCP">GCP</option>
              <option value="Azure">Azure</option>
            </select>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by operational status"
            >
              <option value="ALL">All Statuses</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="degraded">Degraded</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="control-actions">
            <button className="btn btn-primary" onClick={handleOpenCreateResource}>
              <Plus size={16} />
              <span>Register Resource</span>
            </button>
            <button className="btn btn-secondary" onClick={() => handleOpenCreateIncident('')}>
              <AlertTriangle size={16} />
              <span>Log Incident</span>
            </button>
          </div>
        </section>

        {/* View Tabs */}
        <div className="view-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'resources'}
            className={`view-tab ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            <span>Infrastructure Inventory</span>
            <span className="tab-counter">{filteredResources.length}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'incidents'}
            className={`view-tab ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <span>Incident Command Log</span>
            <span className="tab-counter">{incidents.length}</span>
          </button>
        </div>

        {/* Tab 1: Infrastructure Inventory Table */}
        {activeTab === 'resources' && (
          <div className="table-panel">
            {loading && resources.length === 0 ? (
              <div className="empty-state-panel">
                <div className="empty-state-icon">
                  <RefreshCw size={24} className="spin-icon" />
                </div>
                <div className="empty-state-title">Querying infrastructure telemetry...</div>
                <div className="empty-state-description">Retrieving active asset catalog from CloudPulse API.</div>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="empty-state-panel">
                <div className="empty-state-icon">
                  <Server size={24} />
                </div>
                <div className="empty-state-title">No resources found</div>
                <div className="empty-state-description">
                  {searchQuery || providerFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? 'No cloud infrastructure assets matched your selected filters.'
                    : 'Get started by registering your first cloud infrastructure asset.'}
                </div>
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID</th>
                      <th>Resource Name</th>
                      <th>Type</th>
                      <th>Provider</th>
                      <th>Region</th>
                      <th>Status</th>
                      <th>Est. Monthly</th>
                      <th>Alerts</th>
                      <th style={{ textAlign: 'right', width: '160px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.map((res) => (
                      <tr key={res.id}>
                        <td>
                          <span className="code-badge">#{res.id}</span>
                        </td>
                        <td>
                          <div className="resource-cell">
                            <div className="resource-icon-wrapper" aria-hidden="true">
                              {renderResourceIcon(res.resource_type)}
                            </div>
                            <div className="resource-title-group">
                              <span className="resource-name-text">{res.name}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                            {res.resource_type}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-provider-${res.cloud_provider.toLowerCase()}`}>
                            {res.cloud_provider}
                          </span>
                        </td>
                        <td>
                          <code className="code-badge">{res.region}</code>
                        </td>
                        <td>
                          <span className={`badge badge-status-${res.status}`}>
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 'currentColor',
                              }}
                            ></span>
                            {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <span className="cost-figure">
                            ${Number(res.cost_per_month).toFixed(2)}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '3px' }}>/mo</span>
                          </span>
                        </td>
                        <td>
                          {(() => {
                            const activeCount = incidents.filter(
                              (i) => i.resource_id === res.id && i.status !== 'resolved'
                            ).length;

                            return activeCount > 0 ? (
                              <button
                                className="alert-count-pill"
                                onClick={() => setActiveTab('incidents')}
                                title="Inspect active incident alerts"
                              >
                                <AlertTriangle size={13} />
                                <span>{activeCount} alert{activeCount > 1 ? 's' : ''}</span>
                              </button>
                            ) : (
                              <span className="alert-clean-pill">
                                <CheckCircle2 size={13} color="var(--status-success)" />
                                <span>Clear</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-icon-only"
                              onClick={() => handleOpenCreateIncident(res.id)}
                              title="Attach Incident Alert"
                              aria-label={`Attach incident alert to ${res.name}`}
                            >
                              <Bell size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-icon-only"
                              onClick={() => handleOpenEditResource(res)}
                              title="Edit Resource"
                              aria-label={`Edit ${res.name}`}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-danger-outline btn-icon-only"
                              onClick={() => handleDeleteResource(res)}
                              title="Decommission Resource"
                              aria-label={`Decommission ${res.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Incident Command Log */}
        {activeTab === 'incidents' && (
          <div className="incidents-container">
            {incidents.length === 0 ? (
              <div className="table-panel">
                <div className="empty-state-panel">
                  <div className="empty-state-icon">
                    <CheckCircle2 size={24} color="var(--status-success)" />
                  </div>
                  <div className="empty-state-title">Zero active incident logs recorded</div>
                  <div className="empty-state-description">
                    All connected cloud infrastructure telemetry is operating nominally.
                  </div>
                </div>
              </div>
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} className={`incident-item ${inc.severity}`}>
                  <div className="incident-main">
                    <div className="incident-header">
                      <span className={`badge badge-severity-${inc.severity}`}>
                        {inc.severity.toUpperCase()}
                      </span>
                      <span className="incident-title">#{inc.id}: {inc.title}</span>
                      <span className={`badge badge-status-${inc.status === 'resolved' ? 'running' : 'degraded'}`}>
                        {inc.status.toUpperCase()}
                      </span>
                    </div>

                    {inc.description && (
                      <p className="incident-description">{inc.description}</p>
                    )}

                    <div className="incident-meta-row">
                      <span className="incident-meta-item">
                        Target Asset: <strong>Resource #{inc.resource_id}</strong>
                      </span>
                      <span>•</span>
                      <span className="incident-meta-item">
                        Detected: {new Date(inc.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="incident-actions">
                    {inc.status !== 'resolved' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleResolveIncident(inc)}
                      >
                        <CheckCircle2 size={14} color="var(--status-success)" />
                        <span>Resolve</span>
                      </button>
                    )}
                    <button
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => handleDeleteIncident(inc)}
                      title="Delete Incident"
                      aria-label={`Delete incident ${inc.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal: Register / Edit Resource */}
      {isResourceModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsResourceModalOpen(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-modal-title"
          >
            <div className="modal-header">
              <h2 id="resource-modal-title" className="modal-title">
                {editingResource ? 'Edit Infrastructure Asset' : 'Register Cloud Resource'}
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsResourceModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResource}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="res-name">
                    Resource Name<span className="form-label-required">*</span>
                  </label>
                  <input
                    id="res-name"
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. prod-api-gateway"
                    value={resourceForm.name}
                    onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="res-type">Resource Type</label>
                    <select
                      id="res-type"
                      className="form-control"
                      value={resourceForm.resource_type}
                      onChange={(e) => setResourceForm({ ...resourceForm, resource_type: e.target.value })}
                    >
                      <option value="Kubernetes Cluster">Kubernetes Cluster</option>
                      <option value="In-Memory Database">In-Memory Database</option>
                      <option value="Relational Database">Relational Database</option>
                      <option value="Data Warehouse">Data Warehouse</option>
                      <option value="Object Storage">Object Storage</option>
                      <option value="Virtual Machine">Virtual Machine</option>
                      <option value="Serverless Function">Serverless Function</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="res-provider">Cloud Provider</label>
                    <select
                      id="res-provider"
                      className="form-control"
                      value={resourceForm.cloud_provider}
                      onChange={(e) => setResourceForm({ ...resourceForm, cloud_provider: e.target.value })}
                    >
                      <option value="AWS">AWS</option>
                      <option value="GCP">GCP</option>
                      <option value="Azure">Azure</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="res-region">Region</label>
                    <input
                      id="res-region"
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. ap-south-1"
                      value={resourceForm.region}
                      onChange={(e) => setResourceForm({ ...resourceForm, region: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="res-status">Status</label>
                    <select
                      id="res-status"
                      className="form-control"
                      value={resourceForm.status}
                      onChange={(e) => setResourceForm({ ...resourceForm, status: e.target.value })}
                    >
                      <option value="running">Running</option>
                      <option value="stopped">Stopped</option>
                      <option value="degraded">Degraded</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="res-cost">
                    Estimated Monthly Cost ($ USD)<span className="form-label-required">*</span>
                  </label>
                  <input
                    id="res-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    required
                    value={resourceForm.cost_per_month}
                    onChange={(e) => setResourceForm({ ...resourceForm, cost_per_month: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsResourceModalOpen(false)}
                  disabled={isSubmittingResource}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingResource}
                >
                  {isSubmittingResource ? 'Saving...' : editingResource ? 'Save Changes' : 'Register Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Incident */}
      {isIncidentModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsIncidentModalOpen(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-modal-title"
          >
            <div className="modal-header">
              <h2 id="incident-modal-title" className="modal-title">Log Operational Incident</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsIncidentModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveIncident}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="inc-resource">
                    Target Resource<span className="form-label-required">*</span>
                  </label>
                  <select
                    id="inc-resource"
                    className="form-control"
                    required
                    value={incidentForm.resource_id}
                    onChange={(e) => setIncidentForm({ ...incidentForm, resource_id: e.target.value })}
                  >
                    <option value="" disabled>Select target infrastructure asset</option>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        #{r.id} — {r.name} ({r.cloud_provider} / {r.region})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="inc-title">
                    Incident Title<span className="form-label-required">*</span>
                  </label>
                  <input
                    id="inc-title"
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Memory saturation on worker node pool"
                    value={incidentForm.title}
                    onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="inc-severity">Severity</label>
                    <select
                      id="inc-severity"
                      className="form-control"
                      value={incidentForm.severity}
                      onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="inc-status">Status</label>
                    <select
                      id="inc-status"
                      className="form-control"
                      value={incidentForm.status}
                      onChange={(e) => setIncidentForm({ ...incidentForm, status: e.target.value })}
                    >
                      <option value="open">Open</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="inc-desc">Operational Details & Diagnosis</label>
                  <textarea
                    id="inc-desc"
                    className="form-control"
                    rows={3}
                    placeholder="Describe error patterns, latency metrics, or mitigation steps..."
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsIncidentModalOpen(false)}
                  disabled={isSubmittingIncident}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingIncident}
                >
                  {isSubmittingIncident ? 'Logging...' : 'Log Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert Notification */}
      {toast && (
        <div className={`toast-alert ${toast.type}`} role="alert">
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} color="var(--status-success)" />
          ) : (
            <AlertTriangle size={16} color="var(--status-error)" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
