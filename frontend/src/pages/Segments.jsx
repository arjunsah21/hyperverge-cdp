import { useState, useEffect } from 'react';
import { Users, Plus, Filter, Trash2, Edit2, Eye, ChevronRight, X } from 'lucide-react';
import { segmentsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const OPERATORS = {
    equals: 'equals',
    not_equals: 'not equals',
    contains: 'contains',
    greater_than: 'greater than',
    less_than: 'less than',
    within_days: 'within days',
};

const FIELDS = [
    { value: 'email', label: 'Email' },
    { value: 'state', label: 'State' },
    { value: 'city', label: 'City' },
    { value: 'status', label: 'Status' },
    { value: 'total_spend', label: 'Total Spend' },
    { value: 'total_orders', label: 'Total Orders' },
    { value: 'email_opt_in', label: 'Email Opt-in' },
    { value: 'source', label: 'Source' },
    { value: 'last_order_date', label: 'Last Order Date' },
];

function Segments() {
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingSegment, setEditingSegment] = useState(null);
    const [selectedSegment, setSelectedSegment] = useState(null);
    const [previewCustomers, setPreviewCustomers] = useState([]);
    const [previewPage, setPreviewPage] = useState(1);
    const [previewTotal, setPreviewTotal] = useState(0);
    const [previewLoading, setPreviewLoading] = useState(false);

    const PER_PAGE = 10;

    useEffect(() => {
        fetchSegments();
    }, []);

    const fetchSegments = async () => {
        try {
            setLoading(true);
            const data = await segmentsAPI.getAll();
            setSegments(data.segments);
        } catch (error) {
            console.error('Failed to fetch segments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this segment?')) {
            try {
                await segmentsAPI.delete(id);
                if (selectedSegment?.id === id) {
                    setSelectedSegment(null);
                }
                fetchSegments();
            } catch (error) {
                console.error('Failed to delete segment:', error);
            }
        }
    };

    const handlePreview = async (segment) => {
        setSelectedSegment(segment);
        setPreviewLoading(true);
        try {
            const data = await segmentsAPI.getCustomers(segment.id, { page: 1, per_page: PER_PAGE });
            setPreviewCustomers(data.customers || []);
            setPreviewTotal(data.total || 0);
            setPreviewPage(1);
        } catch (error) {
            console.error('Failed to fetch preview:', error);
            setPreviewCustomers([]);
            setPreviewTotal(0);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handlePreviewPageChange = async (page) => {
        if (!selectedSegment) return;
        setPreviewLoading(true);
        try {
            const data = await segmentsAPI.getCustomers(selectedSegment.id, { page, per_page: PER_PAGE });
            setPreviewCustomers(data.customers || []);
            setPreviewPage(page);
        } catch (error) {
            console.error('Failed to fetch preview page:', error);
        } finally {
            setPreviewLoading(false);
        }
    };

    const getCustomerDisplayName = (customer) => {
        if (customer.first_name && customer.last_name) {
            return `${customer.first_name} ${customer.last_name}`;
        }
        if (customer.first_name) return customer.first_name;
        if (customer.last_name) return customer.last_name;
        return customer.email;
    };

    const totalPages = Math.ceil(previewTotal / PER_PAGE);
    const startItem = previewTotal > 0 ? (previewPage - 1) * PER_PAGE + 1 : 0;
    const endItem = Math.min(previewPage * PER_PAGE, previewTotal);

    return (
        <div className="segments-page">
            <div className="page-header-actions">
                <div>
                    <h1 className="page-title">Customer Segments</h1>
                    <p className="page-subtitle">Create and manage customer segments for targeted marketing</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} />
                    <span>Create Segment</span>
                </button>
            </div>

            <div className="segments-grid">
                {loading ? (
                    <div className="loading-state">Loading segments...</div>
                ) : segments.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <h3>No segments yet</h3>
                        <p>Create your first segment to start targeting customers</p>
                    </div>
                ) : (
                    segments.map((segment) => (
                        <div key={segment.id} className="segment-card">
                            <div className="segment-card-header">
                                <div className="segment-card-icon">
                                    <Filter size={20} />
                                </div>
                                <div className="segment-card-actions">
                                    <button className="btn-icon-sm" onClick={() => handlePreview(segment)} title="Preview">
                                        <Eye size={16} />
                                    </button>
                                    <button className="btn-icon-sm" onClick={() => setEditingSegment(segment)} title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="btn-icon-sm" onClick={() => handleDelete(segment.id)} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="segment-card-title">{segment.name}</h3>
                            <p className="segment-card-description">{segment.description || 'No description'}</p>
                            <div className="segment-card-stats">
                                <div className="segment-stat">
                                    <span className="segment-stat-value">{segment.customer_count?.toLocaleString() || 0}</span>
                                    <span className="segment-stat-label">Customers</span>
                                </div>
                                <div className="segment-stat">
                                    <span className="segment-stat-value">{segment.rules?.length || 0}</span>
                                    <span className="segment-stat-label">Rules</span>
                                </div>
                            </div>
                            <div className="segment-card-rules">
                                {segment.rules?.slice(0, 2).map((rule, idx) => (
                                    <div key={idx} className="segment-rule-tag">
                                        {rule.field} {OPERATORS[rule.operator]} "{rule.value}"
                                    </div>
                                ))}
                                {segment.rules?.length > 2 && (
                                    <div className="segment-rule-more">+{segment.rules.length - 2} more</div>
                                )}
                            </div>
                            <button className="segment-card-view-btn" onClick={() => handlePreview(segment)}>
                                View Customers <ChevronRight size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Preview Panel */}
            {selectedSegment && (
                <div className="segment-preview-panel">
                    <div className="preview-header">
                        <h3>Preview: {selectedSegment.name}</h3>
                        <button className="btn-icon-sm" onClick={() => setSelectedSegment(null)}>
                            <X size={18} />
                        </button>
                    </div>
                    <p className="preview-count">{previewTotal} customers match this segment</p>

                    {previewLoading ? (
                        <div className="preview-loading">Loading...</div>
                    ) : (
                        <>
                            <div className="preview-customers">
                                {previewCustomers.map((customer) => (
                                    <div key={customer.id} className="preview-customer-row">
                                        <div className="avatar">
                                            {customer.avatar_url ? (
                                                <img src={customer.avatar_url} alt="" />
                                            ) : (
                                                (customer.first_name?.[0] || customer.email[0]).toUpperCase()
                                            )}
                                        </div>
                                        <div className="preview-customer-info">
                                            <div className="preview-customer-name">{getCustomerDisplayName(customer)}</div>
                                            <div className="preview-customer-meta">
                                                {customer.state && <span>{customer.state}</span>}
                                                <span>${(customer.total_spend || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <StatusBadge status={customer.status} />
                                    </div>
                                ))}
                            </div>

                            {/* Custom Pagination for Preview */}
                            {previewTotal > PER_PAGE && (
                                <div className="preview-pagination">
                                    <div className="pagination-info">
                                        Showing {startItem} to {endItem} of {previewTotal} items
                                    </div>
                                    <div className="pagination-controls">
                                        <button
                                            onClick={() => handlePreviewPageChange(previewPage - 1)}
                                            disabled={previewPage === 1}
                                            className="pagination-btn"
                                        >
                                            Previous
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => handlePreviewPageChange(page)}
                                                className={`pagination-btn ${previewPage === page ? 'active' : ''}`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        {totalPages > 4 && <span className="pagination-ellipsis">...</span>}
                                        <button
                                            onClick={() => handlePreviewPageChange(previewPage + 1)}
                                            disabled={previewPage === totalPages}
                                            className="pagination-btn"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Create Segment Modal */}
            {showCreateModal && (
                <SegmentModal
                    onClose={() => setShowCreateModal(false)}
                    onSaved={() => {
                        setShowCreateModal(false);
                        fetchSegments();
                    }}
                />
            )}

            {/* Edit Segment Modal */}
            {editingSegment && (
                <SegmentModal
                    segment={editingSegment}
                    onClose={() => setEditingSegment(null)}
                    onSaved={() => {
                        setEditingSegment(null);
                        fetchSegments();
                    }}
                />
            )}

            <style>{`
        .segments-page {
          max-width: 100%;
        }

        .segments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--spacing-lg);
          margin-top: var(--spacing-xl);
        }

        .segment-card {
          background-color: var(--color-bg-card);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          border: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
        }

        .segment-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-md);
        }

        .segment-card-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple));
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .segment-card-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .btn-icon-sm {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--color-text-muted);
          transition: all var(--transition-fast);
        }

        .btn-icon-sm:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }

        .segment-card-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .segment-card-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-md);
        }

        .segment-card-stats {
          display: flex;
          gap: var(--spacing-xl);
          margin-bottom: var(--spacing-md);
        }

        .segment-stat {
          display: flex;
          flex-direction: column;
        }

        .segment-stat-value {
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .segment-stat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .segment-card-rules {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-md);
        }

        .segment-rule-tag {
          font-size: var(--font-size-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          background-color: var(--color-bg-tertiary);
          border-radius: var(--radius-full);
          color: var(--color-text-secondary);
        }

        .segment-rule-more {
          font-size: var(--font-size-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          color: var(--color-accent-blue);
        }

        .segment-card-view-btn {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm);
          background-color: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .segment-card-view-btn:hover {
          background-color: var(--color-accent-blue);
          color: white;
        }

        .segment-preview-panel {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 400px;
          background-color: var(--color-bg-secondary);
          border-left: 1px solid var(--color-border);
          padding: var(--spacing-lg);
          z-index: 100;
          overflow-y: auto;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .preview-header h3 {
          font-size: var(--font-size-lg);
          font-weight: 600;
        }

        .preview-count {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-lg);
        }

        .preview-loading {
          text-align: center;
          color: var(--color-text-muted);
          padding: var(--spacing-xl);
        }

        .preview-customers {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .preview-customer-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-sm);
          background-color: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
        }

        .preview-customer-info {
          flex: 1;
        }

        .preview-customer-name {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .preview-customer-meta {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          display: flex;
          gap: var(--spacing-sm);
        }

        .preview-pagination {
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border);
        }

        .pagination-info {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-sm);
        }

        .pagination-controls {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .pagination-btn {
          padding: var(--spacing-xs) var(--spacing-sm);
          background-color: var(--color-bg-tertiary);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }

        .pagination-btn:hover:not(:disabled) {
          background-color: var(--color-bg-primary);
          color: var(--color-text-primary);
        }

        .pagination-btn.active {
          background-color: var(--color-accent-blue);
          color: white;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-ellipsis {
          color: var(--color-text-muted);
          padding: var(--spacing-xs);
        }

        .empty-state, .loading-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: var(--spacing-2xl);
          color: var(--color-text-muted);
        }

        .empty-state h3 {
          margin-top: var(--spacing-md);
          color: var(--color-text-primary);
        }
      `}</style>
        </div>
    );
}

// Segment Modal Component (Create / Edit)
function SegmentModal({ segment, onClose, onSaved }) {
    const isEditing = !!segment;
    const [name, setName] = useState(segment?.name || '');
    const [description, setDescription] = useState(segment?.description || '');
    const [logic, setLogic] = useState(segment?.logic || 'AND');
    const [rules, setRules] = useState(
        segment?.rules?.length > 0
            ? segment.rules.map(r => ({ field: r.field, operator: r.operator, value: r.value }))
            : [{ field: 'state', operator: 'equals', value: '' }]
    );
    const [loading, setLoading] = useState(false);

    const addRule = () => {
        setRules([...rules, { field: 'state', operator: 'equals', value: '' }]);
    };

    const removeRule = (index) => {
        if (rules.length > 1) {
            setRules(rules.filter((_, i) => i !== index));
        }
    };

    const updateRule = (index, field, value) => {
        const newRules = [...rules];
        newRules[index][field] = value;
        setRules(newRules);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || rules.some(r => !r.value.trim())) return;

        setLoading(true);
        try {
            if (isEditing) {
                await segmentsAPI.update(segment.id, { name, description, logic, rules });
            } else {
                await segmentsAPI.create({ name, description, logic, rules });
            }
            onSaved();
        } catch (error) {
            console.error('Failed to save segment:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="segment-modal-overlay" onClick={onClose}>
            <div className="segment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="segment-modal-header">
                    <h2>{isEditing ? 'Edit Segment' : 'Create New Segment'}</h2>
                    <button className="btn-icon-sm" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="segment-modal-form">
                    <div className="segment-form-group">
                        <label>Segment Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., High-Value Customers"
                            required
                        />
                    </div>

                    <div className="segment-form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                            rows={2}
                        />
                    </div>

                    <div className="segment-form-group">
                        <label>Rule Logic</label>
                        <select value={logic} onChange={(e) => setLogic(e.target.value)}>
                            <option value="AND">Match ALL rules (AND)</option>
                            <option value="OR">Match ANY rule (OR)</option>
                        </select>
                    </div>

                    <div className="segment-rules-section">
                        <label>Rules</label>
                        <div className="segment-rules-list">
                            {rules.map((rule, index) => (
                                <div key={index} className="segment-rule-row">
                                    <select
                                        value={rule.field}
                                        onChange={(e) => updateRule(index, 'field', e.target.value)}
                                    >
                                        {FIELDS.map((f) => (
                                            <option key={f.value} value={f.value}>{f.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={rule.operator}
                                        onChange={(e) => updateRule(index, 'operator', e.target.value)}
                                    >
                                        {Object.entries(OPERATORS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={rule.value}
                                        onChange={(e) => updateRule(index, 'value', e.target.value)}
                                        placeholder="Value"
                                        required
                                    />
                                    {rules.length > 1 && (
                                        <button type="button" className="segment-rule-remove" onClick={() => removeRule(index)}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={addRule}>
                            <Plus size={16} /> Add Rule
                        </button>
                    </div>

                    <div className="segment-modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Segment')}
                        </button>
                    </div>
                </form>

                <style>{`
          .segment-modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 200;
            padding: var(--spacing-lg);
          }

          .segment-modal {
            background-color: var(--color-bg-secondary);
            border-radius: var(--radius-lg);
            width: 100%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid var(--color-border);
          }

          .segment-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-lg);
            border-bottom: 1px solid var(--color-border);
          }

          .segment-modal-header h2 {
            font-size: var(--font-size-xl);
            font-weight: 600;
            color: var(--color-text-primary);
            margin: 0;
          }

          .segment-modal-form {
            padding: var(--spacing-lg);
          }

          .segment-form-group {
            margin-bottom: var(--spacing-md);
          }

          .segment-form-group label {
            display: block;
            font-size: var(--font-size-sm);
            font-weight: 500;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-xs);
          }

          .segment-form-group input,
          .segment-form-group textarea,
          .segment-form-group select {
            width: 100%;
            padding: var(--spacing-sm) var(--spacing-md);
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
          }

          .segment-form-group input:focus,
          .segment-form-group textarea:focus,
          .segment-form-group select:focus {
            outline: none;
            border-color: var(--color-accent-blue);
          }

          .segment-rules-section {
            margin-bottom: var(--spacing-lg);
          }

          .segment-rules-section > label {
            display: block;
            font-size: var(--font-size-sm);
            font-weight: 500;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-sm);
          }

          .segment-rules-list {
            margin-bottom: var(--spacing-md);
          }

          .segment-rule-row {
            display: flex;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-sm);
            align-items: center;
          }

          .segment-rule-row select,
          .segment-rule-row input {
            flex: 1;
            padding: var(--spacing-sm);
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
          }

          .segment-rule-remove {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-sm);
            color: var(--color-text-muted);
            transition: all var(--transition-fast);
            flex-shrink: 0;
          }

          .segment-rule-remove:hover {
            background-color: rgba(239, 68, 68, 0.2);
            color: var(--color-accent-red);
          }

          .segment-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-md);
            padding-top: var(--spacing-md);
            border-top: 1px solid var(--color-border);
          }
        `}</style>
            </div>
        </div>
    );
}

export default Segments;
