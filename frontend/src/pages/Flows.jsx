import { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Play, Pause, Edit2, Clock, Users, MousePointer, Eye, X } from 'lucide-react';
import { flowsAPI, segmentsAPI } from '../services/api';
import Drawer from '../components/Drawer';
import AIInput from '../components/AIInput';
import '../styles/pages/Flows.css';

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
                                                className="btn-preview"
                                                onClick={() => setPreviewStep(step)}
                                            >
                                                <Eye size={14} />
                                                <span className="preview-text">Preview</span>
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

            </div>
        </div>
    );
}

export default Flows;
