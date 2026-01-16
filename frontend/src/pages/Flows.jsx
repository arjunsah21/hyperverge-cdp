import { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Play, Pause, Edit2, Clock, Users, MousePointer, Eye, X } from 'lucide-react';
import { flowsAPI, segmentsAPI } from '../services/api';
import Drawer from '../components/Drawer';
import AIInput from '../components/AIInput';

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

            {/* Create Flow Drawer */}
            <FlowDrawer
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSaved={() => {
                    setShowCreateModal(false);
                    fetchFlows();
                }}
            />

            {/* Edit Flow Drawer */}
            <FlowDrawer
                isOpen={!!editingFlow}
                flow={editingFlow}
                onClose={() => setEditingFlow(null)}
                onSaved={() => {
                    setEditingFlow(null);
                    fetchFlows();
                }}
            />

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

// Flow Drawer Component (Create / Edit)
function FlowDrawer({ flow, isOpen, onClose, onSaved }) {
    const isEditing = !!flow;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState('segment');
    const [segmentId, setSegmentId] = useState('');
    const [segments, setSegments] = useState([]);
    const [steps, setSteps] = useState([{ order: 1, subject: '', content: '', delay_days: 0, delay_hours: 0 }]);
    const [previewStep, setPreviewStep] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            segmentsAPI.getAll().then(data => setSegments(data.segments)).catch(console.error);

            if (flow) {
                setName(flow.name);
                setDescription(flow.description || '');
                setTriggerType(flow.trigger_type);
                setSegmentId(flow.segment_id?.toString() || '');
                setSteps(flow.steps?.length > 0 ? flow.steps.map(s => ({ ...s, content: s.content || '' })) : [{ order: 1, subject: '', content: '', delay_days: 0, delay_hours: 0 }]);
            } else {
                setName('');
                setDescription('');
                setTriggerType('segment');
                setSegmentId('');
                setSteps([{ order: 1, subject: '', content: '', delay_days: 0, delay_hours: 0 }]);
            }
        }
    }, [isOpen, flow]);

    const addStep = () => {
        setSteps([...steps, {
            order: steps.length + 1,
            subject: '',
            content: '',
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
        if (e) e.preventDefault();
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

    const handleAIGenerate = async (prompt) => {
        try {
            const flowData = await flowsAPI.aiGenerate(prompt);

            if (flowData.name) setName(flowData.name);
            if (flowData.description) setDescription(flowData.description);
            if (flowData.trigger_type) setTriggerType(flowData.trigger_type);
            if (flowData.segment_id) setSegmentId(flowData.segment_id.toString());

            if (flowData.steps && flowData.steps.length > 0) {
                const formattedSteps = flowData.steps.map(s => ({
                    ...s,
                    content: s.content || '',
                    delay_days: s.delay_days || 0,
                    delay_hours: s.delay_hours || 0,
                    step_type: s.step_type || 'email'
                }));
                setSteps(formattedSteps);
            }
        } catch (error) {
            console.error("AI Generation failed:", error);
            // Ideally use a toast notification here
            alert("Failed to generate flow. The AI service might be busy or miss-configured.");
        }
    };

    const drawerActions = (
        <>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Flow')}
            </button>
        </>
    );

    return (
        <>
            <Drawer
                isOpen={isOpen}
                onClose={onClose}
                title={isEditing ? 'Edit Flow' : 'Create Email Flow'}
                actions={drawerActions}
                width="800px" // Wider for flows
            >
                <div className="flow-drawer-content">
                    <AIInput
                        onGenerate={handleAIGenerate}
                        placeholder="e.g. Welcome series for new signups with 3 emails"
                        className="mb-lg"
                    />

                    <div className="form-divider" />

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
                                        <textarea
                                            value={step.content}
                                            onChange={(e) => updateStep(index, 'content', e.target.value)}
                                            placeholder="Email body content..."
                                            rows={3}
                                            className="flow-step-body"
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

                                            <button
                                                type="button"
                                                className="btn-text btn-sm"
                                                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                onClick={() => setPreviewStep(step)}
                                            >
                                                <Eye size={14} /> Preview
                                            </button>
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
                </div>

                <style>{`
                    .form-divider {
                        height: 1px;
                        background-color: var(--color-border);
                        margin: var(--spacing-lg) 0;
                    }
                    .mb-lg { margin-bottom: var(--spacing-lg); }
                    .flow-form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: var(--spacing-md);
                    }
                    .flow-form-group { margin-bottom: var(--spacing-md); }
                    .flow-form-group label { display: block; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-secondary); margin-bottom: 4px; }
                    .flow-form-group input, .flow-form-group select, .flow-form-group textarea {
                        width: 100%; padding: 8px 12px; background: var(--color-bg-tertiary);
                        border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text-primary);
                    }
                    .flow-steps-section > label { display: block; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-secondary); margin-bottom: 8px; }
                    .flow-steps-list { margin-bottom: 12px; }
                    .flow-step-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; padding: 16px; background: var(--color-bg-tertiary); border-radius: 8px; border: 1px solid var(--color-border); }
                    .flow-step-number { width: 28px; height: 28px; background: var(--color-accent-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 600; flex-shrink: 0; margin-top: 2px; }
                    .flow-step-fields { flex: 1; display: flex; flex-direction: column; gap: 12px; }
                    .flow-step-fields input, .flow-step-fields textarea {
                        width: 100%; padding: 10px 12px; background: var(--color-bg-primary);
                        border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text-primary);
                    }
                    .flow-step-fields input:focus, .flow-step-fields textarea:focus { border-color: var(--color-accent-blue); outline: none; }
                    .flow-step-delay { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-secondary); margin-top: 4px; }
                    .flow-step-delay input { width: 60px; padding: 4px 8px; text-align: center; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-text-primary); }
                    .flow-step-remove { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: var(--color-text-muted); transition: all 0.2s; }
                    .flow-step-remove:hover { background: rgba(239, 68, 68, 0.2); color: var(--color-accent-red); }
                    .flow-step-body { resize: vertical; min-height: 100px; font-family: inherit; }
                    .flow-step-delay { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-secondary); margin-top: 8px; }
                    .flow-step-delay button {
                        margin-left: auto; display: flex; align-items: center; gap: 6px;
                        padding: 6px 12px; border-radius: 6px; border: 1px solid var(--color-border);
                        background: var(--color-bg-secondary); color: var(--color-text-primary);
                        font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
                    }
                    .flow-step-delay button:hover {
                        background: var(--color-bg-primary); border-color: var(--color-accent-blue); color: var(--color-accent-blue);
                    }

                `}</style>
            </Drawer>

            {previewStep && (
                <EmailPreviewModal
                    step={previewStep}
                    onClose={() => setPreviewStep(null)}
                />
            )}
        </>
    );
}


function EmailPreviewModal({ step, onClose }) {
    return (
        <div className="preview-modal-overlay" onClick={onClose}>
            <div className="preview-modal" onClick={e => e.stopPropagation()}>
                <div className="preview-header">
                    <h3>Email Preview</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="preview-body">
                    <div className="preview-field">
                        <span className="label">Subject:</span>
                        <span className="value subject">{step.subject || '(No Subject)'}</span>
                    </div>
                    <div className="preview-field">
                        <span className="label">From:</span>
                        <span className="value">HyperVerge &lt;hello@hyperverge.co&gt;</span>
                    </div>
                    <div className="preview-content">
                        {step.content ? (
                            <div style={{ whiteSpace: 'pre-wrap' }}>{step.content}</div>
                        ) : (
                            <em style={{ color: 'var(--color-text-muted)' }}>No content...</em>
                        )}
                    </div>
                </div>
                <style>{`
                    .preview-modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0,0,0,0.8);
                        z-index: 300;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .preview-modal {
                        background: white;
                        color: #333;
                        width: 90%;
                        max-width: 500px;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    .preview-header {
                        padding: 16px;
                        background: #f5f5f5;
                        border-bottom: 1px solid #ddd;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .preview-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #333; }
                    .preview-header button { background: none; border: none; cursor: pointer; color: #666; }
                    .preview-body { padding: 20px; }
                    .preview-field { margin-bottom: 12px; font-size: 14px; }
                    .preview-field .label { color: #666; margin-right: 8px; }
                    .preview-field .value.subject { font-weight: 600; }
                    .preview-content {
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        min-height: 100px;
                        line-height: 1.5;
                        font-family: sans-serif;
                    }
                `}</style>
            </div>
        </div>
    );
}

export default Flows;
