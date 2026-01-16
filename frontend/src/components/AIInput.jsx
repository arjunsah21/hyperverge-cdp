import { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';

function AIInput({ onGenerate, placeholder, className = '' }) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || loading) return;

        setLoading(true);
        try {
            await onGenerate(prompt);
            setPrompt(''); // Clear after success? Optional.
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`ai-input-container ${className}`}>
            <div className="ai-input-wrapper">
                <div className="ai-icon">
                    <Sparkles size={16} />
                </div>
                <input
                    type="text"
                    className="ai-input-field"
                    placeholder={placeholder || "Describe what you want to create..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                    disabled={loading}
                />
                <button
                    type="button"
                    className="ai-submit-btn"
                    onClick={handleSubmit}
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <ArrowRight size={16} />
                    )}
                </button>
            </div>
            <style>{`
                .ai-input-container {
                    margin-bottom: var(--spacing-lg);
                }
                .ai-input-wrapper {
                    display: flex;
                    align-items: center;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1));
                    border: 1px solid var(--color-accent-purple);
                    border-radius: var(--radius-lg);
                    padding: 4px;
                    transition: all 0.2s;
                }
                .ai-input-wrapper:focus-within {
                    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
                }
                .ai-icon {
                    padding: 0 12px;
                    color: var(--color-accent-purple);
                    display: flex;
                }
                .ai-input-field {
                    flex: 1;
                    border: none;
                    background: transparent;
                    padding: 12px 0;
                    font-size: var(--font-size-md);
                    color: var(--color-text-primary);
                    min-width: 0;
                }
                .ai-input-field:focus {
                    outline: none;
                }
                .ai-submit-btn {
                    padding: 8px 16px;
                    background-color: var(--color-accent-purple);
                    color: white;
                    border: none;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.2s;
                }
                .ai-submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default AIInput;
