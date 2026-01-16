import { useState, useEffect } from 'react';
import { Users, Plus, Filter, Trash2, Edit2, Eye, ChevronRight, X } from 'lucide-react';
import { segmentsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Drawer from '../components/Drawer';
import AIInput from '../components/AIInput';

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

            {/* Create Segment Drawer */}
            <SegmentDrawer
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSaved={() => {
                    setShowCreateModal(false);
                    fetchSegments();
                }}
            />

            {/* Edit Segment Drawer */}
            <SegmentDrawer
                isOpen={!!editingSegment}
                segment={editingSegment}
                onClose={() => setEditingSegment(null)}
                onSaved={() => {
                    setEditingSegment(null);
                    fetchSegments();
                }}
            />

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

// Segment Drawer Component (Create / Edit)
function SegmentDrawer({ segment, isOpen, onClose, onSaved }) {
    const isEditing = !!segment;
    // Hooks should be executed regardless of conditions, BUT props changes should be handled
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [logic, setLogic] = useState('AND');
    const [rules, setRules] = useState([{ field: 'state', operator: 'equals', value: '' }]);
    const [loading, setLoading] = useState(false);

    // Reset form when segment changes or drawer re-opens
    useEffect(() => {
        if (isOpen) {
            if (segment) {
                setName(segment.name || '');
                setDescription(segment.description || '');
                setLogic(segment.logic || 'AND');
                setRules(segment.rules?.length > 0
                    ? segment.rules.map(r => ({ field: r.field, operator: r.operator, value: r.value }))
                    : [{ field: 'state', operator: 'equals', value: '' }]
                );
            } else {
                setName('');
                setDescription('');
                setLogic('AND');
                setRules([{ field: 'state', operator: 'equals', value: '' }]);
            }
        }
    }, [isOpen, segment]);

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
        if (e) e.preventDefault();
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

    const handleAIGenerate = async (promptText) => {
        try {
            const data = await segmentsAPI.generateFromAI(promptText);

            if (data.name) setName(data.name);
            if (data.description) setDescription(data.description);
            if (data.logic) setLogic(data.logic);
            if (data.rules && data.rules.length > 0) {
                setRules(data.rules.map(r => ({
                    field: r.field,
                    operator: r.operator,
                    value: r.value
                })));
            }
        } catch (error) {
            console.error('Failed to generate segment from AI:', error);
        }
    };

    const drawerActions = (
        <>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Segment')}
            </button>
        </>
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Segment' : 'Create New Segment'}
            actions={drawerActions}
            width="600px"
        >
            <div className="segment-drawer-content">
                <AIInput
                    onGenerate={handleAIGenerate}
                    placeholder="e.g. Active VIP customers from Texas who spent over $500"
                    className="mb-lg"
                />

                <div className="form-divider" />

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
            </div>

            <style>{`
                .form-divider {
                    height: 1px;
                    background-color: var(--color-border);
                    margin: var(--spacing-lg) 0;
                }
                .mb-lg { margin-bottom: var(--spacing-lg); }
                .segment-form-group { margin-bottom: var(--spacing-md); }
                .segment-form-group label { display: block; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-secondary); margin-bottom: 4px; }
                .segment-form-group input, .segment-form-group select, .segment-form-group textarea {
                    width: 100%; padding: 8px 12px; background: var(--color-bg-tertiary);
                    border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text-primary);
                }
                .segment-rules-section > label { display: block; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-secondary); margin-bottom: 8px; }
                .segment-rules-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
                .segment-rule-row { display: grid; grid-template-columns: 1.5fr 1.5fr 2fr auto; gap: 8px; align-items: center; }
                .segment-rule-row select, .segment-rule-row input {
                    width: 100%; padding: 8px 12px; background: var(--color-bg-tertiary);
                    border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text-primary);
                }
                .segment-rule-remove { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); cursor: pointer; border: none; background: none; border-radius: 4px; }
                .segment-rule-remove:hover { color: var(--color-accent-red); background-color: rgba(255,0,0,0.1); }
            `}</style>
        </Drawer>
    );
}

export default Segments;
