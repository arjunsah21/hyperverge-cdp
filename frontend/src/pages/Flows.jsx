import { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Play, Pause, Edit2, Clock, Users, MousePointer, Eye, X } from 'lucide-react';
import { flowsAPI, segmentsAPI } from '../services/api';

const STATUS_COLORS = {
    active: 'shipped',
    paused: 'pending',
    draft: 'regular',
    archived: 'cancelled',
};

function Flows() {
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingFlow, setEditingFlow] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchFlows();
    }, [activeTab]);

    const fetchFlows = async () => {
        try {
            setLoading(true);
            const statusFilter = activeTab === 'all' ? null : activeTab;
            const data = await flowsAPI.getAll(statusFilter);
            setFlows(data.flows);
        } catch (error) {
            console.error('Failed to fetch flows:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this flow?')) {
            try {
                await flowsAPI.delete(id);
                fetchFlows();
            } catch (error) {
                console.error('Failed to delete flow:', error);
            }
        }
    };

    const handleStatusChange = async (flow, newStatus) => {
        try {
            await flowsAPI.update(flow.id, { status: newStatus });
            fetchFlows();
        } catch (error) {
            console.error('Failed to update flow status:', error);
        }
    };

    const handleEdit = (flow) => {
        setEditingFlow(flow);
    };

    const calcOpenRate = (flow) => {
        if (flow.total_sent === 0) return 0;
        return ((flow.total_opened / flow.total_sent) * 100).toFixed(1);
    };

    const calcClickRate = (flow) => {
        if (flow.total_sent === 0) return 0;
        return ((flow.total_clicked / flow.total_sent) * 100).toFixed(1);
    };

    return (
        <div className="flows-page">
            <div className="page-header-actions">
                <div>
                    <h1 className="page-title">Email Flows</h1>
                    <p className="page-subtitle">Create automated email sequences for customer engagement</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} />
                    <span>Create Flow</span>
                </button>
            </div>

            {/* Status Tabs */}
            <div className="filter-bar">
                <div className="filter-tabs">
                    {['all', 'active', 'paused', 'draft'].map((tab) => (
                        <button
                            key={tab}
                            className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Flows List */}
            <div className="flows-list">
                {loading ? (
                    <div className="loading-state">Loading flows...</div>
                ) : flows.length === 0 ? (
                    <div className="empty-state">
                        <Mail size={48} />
                        <h3>No flows found</h3>
                        <p>Create your first email flow to automate customer communication</p>
                    </div>
                ) : (
                    flows.map((flow) => (
                        <div key={flow.id} className="flow-card">
                            <div className="flow-card-main">
                                <div className="flow-card-header">
                                    <div className="flow-card-icon">
                                        <Mail size={20} />
                                    </div>
                                    <div className="flow-card-info">
                                        <h3 className="flow-card-title">{flow.name}</h3>
                                        <p className="flow-card-description">{flow.description || 'No description'}</p>
                                    </div>
                                    <div className={`status-badge ${STATUS_COLORS[flow.status]}`}>
                                        {flow.status.toUpperCase()}
                                    </div>
                                </div>

                                <div className="flow-card-steps">
                                    {flow.steps.map((step, idx) => (
                                        <div key={step.id} className="flow-step">
                                            <div className="flow-step-icon">
                                                <Mail size={14} />
                                            </div>
                                            <div className="flow-step-content">
                                                <span className="flow-step-subject">{step.subject}</span>
                                                {(step.delay_days > 0 || step.delay_hours > 0) && (
                                                    <span className="flow-step-delay">
                                                        <Clock size={12} />
                                                        {step.delay_days > 0 && `${step.delay_days}d`}
                                                        {step.delay_hours > 0 && `${step.delay_hours}h`}
                                                    </span>
                                                )}
                                            </div>
                                            {idx < flow.steps.length - 1 && <div className="flow-step-connector" />}
                                        </div>
                                    ))}
                                </div>

                                <div className="flow-card-stats">
                                    <div className="flow-stat">
                                        <Users size={16} />
                                        <span>{flow.total_sent.toLocaleString()}</span>
                                        <span className="flow-stat-label">Sent</span>
                                    </div>
                                    <div className="flow-stat">
                                        <Eye size={16} />
                                        <span>{calcOpenRate(flow)}%</span>
                                        <span className="flow-stat-label">Open Rate</span>
                                    </div>
                                    <div className="flow-stat">
                                        <MousePointer size={16} />
                                        <span>{calcClickRate(flow)}%</span>
                                        <span className="flow-stat-label">Click Rate</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flow-card-actions">
                                {flow.status === 'active' ? (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleStatusChange(flow, 'paused')}
                                    >
                                        <Pause size={16} /> Pause
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleStatusChange(flow, 'active')}
                                    >
                                        <Play size={16} /> Activate
                                    </button>
                                )}
                                <button className="btn-icon" onClick={() => handleEdit(flow)}>
                                    <Edit2 size={16} />
                                </button>
                                <button className="btn-icon" onClick={() => handleDelete(flow.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Flow Modal */}
            {showCreateModal && (
                <FlowModal
                    onClose={() => setShowCreateModal(false)}
                    onSaved={() => {
                        setShowCreateModal(false);
                        fetchFlows();
                    }}
                />
            )}

            {/* Edit Flow Modal */}
            {editingFlow && (
                <FlowModal
                    flow={editingFlow}
                    onClose={() => setEditingFlow(null)}
                    onSaved={() => {
                        setEditingFlow(null);
                        fetchFlows();
                    }}
                />
            )}

            <style>{`
        .flows-page {
          max-width: 100%;
        }

        .flows-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .flow-card {
          background-color: var(--color-bg-card);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          border: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          gap: var(--spacing-lg);
        }

        .flow-card-main {
          flex: 1;
        }

        .flow-card-header {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .flow-card-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--color-accent-green), var(--color-accent-cyan));
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .flow-card-info {
          flex: 1;
        }

        .flow-card-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .flow-card-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .flow-card-steps {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          flex-wrap: wrap;
        }

        .flow-step {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          position: relative;
        }

        .flow-step-icon {
          width: 28px;
          height: 28px;
          background-color: var(--color-bg-tertiary);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent-blue);
        }

        .flow-step-content {
          display: flex;
          flex-direction: column;
        }

        .flow-step-subject {
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .flow-step-delay {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .flow-step-connector {
          width: 30px;
          height: 2px;
          background-color: var(--color-border);
          margin-left: var(--spacing-sm);
        }

        .flow-card-stats {
          display: flex;
          gap: var(--spacing-xl);
        }

        .flow-stat {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
        }

        .flow-stat svg {
          color: var(--color-text-muted);
        }

        .flow-stat-label {
          color: var(--color-text-muted);
          font-size: var(--font-size-xs);
        }

        .flow-card-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          align-items: flex-end;
        }

        .empty-state, .loading-state {
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

// Flow Modal Component (Create / Edit)
function FlowModal({ flow, onClose, onSaved }) {
    const isEditing = !!flow;
    const [name, setName] = useState(flow?.name || '');
    const [description, setDescription] = useState(flow?.description || '');
    const [triggerType, setTriggerType] = useState(flow?.trigger_type || 'segment');
    const [segmentId, setSegmentId] = useState(flow?.segment_id?.toString() || '');
    const [segments, setSegments] = useState([]);
    const [steps, setSteps] = useState(
        flow?.steps?.length > 0
            ? flow.steps.map(s => ({ ...s }))
            : [{ order: 1, subject: '', delay_days: 0, delay_hours: 0 }]
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        segmentsAPI.getAll().then(data => setSegments(data.segments)).catch(console.error);
    }, []);

    const addStep = () => {
        setSteps([...steps, {
            order: steps.length + 1,
            subject: '',
            delay_days: 1,
            delay_hours: 0
        }]);
    };

    const removeStep = (index) => {
        if (steps.length > 1) {
            const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
            setSteps(newSteps);
        }
    };

    const updateStep = (index, field, value) => {
        const newSteps = [...steps];
        newSteps[index][field] = value;
        setSteps(newSteps);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || steps.some(s => !s.subject.trim())) return;

        setLoading(true);
        try {
            if (isEditing) {
                await flowsAPI.update(flow.id, {
                    name,
                    description,
                    trigger_type: triggerType,
                    segment_id: segmentId ? parseInt(segmentId) : null,
                });
            } else {
                await flowsAPI.create({
                    name,
                    description,
                    trigger_type: triggerType,
                    segment_id: segmentId ? parseInt(segmentId) : null,
                    status: 'draft',
                    steps
                });
            }
            onSaved();
        } catch (error) {
            console.error('Failed to save flow:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flow-modal-overlay" onClick={onClose}>
            <div className="flow-modal" onClick={(e) => e.stopPropagation()}>
                <div className="flow-modal-header">
                    <h2>{isEditing ? 'Edit Flow' : 'Create Email Flow'}</h2>
                    <button className="flow-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flow-modal-form">
                    <div className="flow-form-row">
                        <div className="flow-form-group">
                            <label>Flow Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Welcome Series"
                                required
                            />
                        </div>
                        <div className="flow-form-group">
                            <label>Trigger Type</label>
                            <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
                                <option value="segment">Segment Entry</option>
                                <option value="event">Event Trigger</option>
                                <option value="manual">Manual</option>
                            </select>
                        </div>
                    </div>

                    <div className="flow-form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                            rows={2}
                        />
                    </div>

                    {triggerType === 'segment' && (
                        <div className="flow-form-group">
                            <label>Target Segment</label>
                            <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
                                <option value="">Select a segment...</option>
                                {segments.map((seg) => (
                                    <option key={seg.id} value={seg.id}>
                                        {seg.name} ({seg.customer_count} customers)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!isEditing && (
                        <div className="flow-steps-section">
                            <label>Email Steps</label>
                            <div className="flow-steps-list">
                                {steps.map((step, index) => (
                                    <div key={index} className="flow-step-row">
                                        <div className="flow-step-number">{step.order}</div>
                                        <div className="flow-step-fields">
                                            <input
                                                type="text"
                                                value={step.subject}
                                                onChange={(e) => updateStep(index, 'subject', e.target.value)}
                                                placeholder="Email subject line"
                                                required
                                            />
                                            <div className="flow-step-delay">
                                                <span>Delay:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={step.delay_days}
                                                    onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                                                />
                                                <span>days</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={step.delay_hours}
                                                    onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)}
                                                />
                                                <span>hours</span>
                                            </div>
                                        </div>
                                        {steps.length > 1 && (
                                            <button type="button" className="flow-step-remove" onClick={() => removeStep(index)}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="btn btn-secondary" onClick={addStep}>
                                <Plus size={16} /> Add Step
                            </button>
                        </div>
                    )}

                    <div className="flow-modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Flow')}
                        </button>
                    </div>
                </form>

                <style>{`
          .flow-modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 200;
            padding: var(--spacing-lg);
          }

          .flow-modal {
            background-color: var(--color-bg-secondary);
            border-radius: var(--radius-lg);
            width: 100%;
            max-width: 640px;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid var(--color-border);
          }

          .flow-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-lg);
            border-bottom: 1px solid var(--color-border);
          }

          .flow-modal-header h2 {
            font-size: var(--font-size-xl);
            font-weight: 600;
            color: var(--color-text-primary);
            margin: 0;
          }

          .flow-modal-close {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-md);
            color: var(--color-text-muted);
            transition: all var(--transition-fast);
          }

          .flow-modal-close:hover {
            background-color: var(--color-bg-tertiary);
            color: var(--color-text-primary);
          }

          .flow-modal-form {
            padding: var(--spacing-lg);
          }

          .flow-form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-md);
          }

          .flow-form-group {
            margin-bottom: var(--spacing-md);
          }

          .flow-form-group label {
            display: block;
            font-size: var(--font-size-sm);
            font-weight: 500;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-xs);
          }

          .flow-form-group input,
          .flow-form-group textarea,
          .flow-form-group select {
            width: 100%;
            padding: var(--spacing-sm) var(--spacing-md);
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
          }

          .flow-form-group input:focus,
          .flow-form-group textarea:focus,
          .flow-form-group select:focus {
            outline: none;
            border-color: var(--color-accent-blue);
          }

          .flow-steps-section {
            margin-bottom: var(--spacing-lg);
          }

          .flow-steps-section > label {
            display: block;
            font-size: var(--font-size-sm);
            font-weight: 500;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-sm);
          }

          .flow-steps-list {
            margin-bottom: var(--spacing-md);
          }

          .flow-step-row {
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-md);
            padding: var(--spacing-md);
            background-color: var(--color-bg-tertiary);
            border-radius: var(--radius-md);
          }

          .flow-step-number {
            width: 28px;
            height: 28px;
            background-color: var(--color-accent-blue);
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: var(--font-size-sm);
            font-weight: 600;
            flex-shrink: 0;
          }

          .flow-step-fields {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
          }

          .flow-step-fields input[type="text"] {
            width: 100%;
            padding: var(--spacing-sm) var(--spacing-md);
            background-color: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
          }

          .flow-step-delay {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
          }

          .flow-step-delay input {
            width: 60px;
            padding: var(--spacing-xs) var(--spacing-sm);
            background-color: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            text-align: center;
          }

          .flow-step-remove {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-sm);
            color: var(--color-text-muted);
            transition: all var(--transition-fast);
          }

          .flow-step-remove:hover {
            background-color: rgba(239, 68, 68, 0.2);
            color: var(--color-accent-red);
          }

          .flow-modal-actions {
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

export default Flows;
