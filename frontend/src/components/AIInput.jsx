import { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import '../styles/components/AIInput.css';

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

        </div>
    );
}

export default AIInput;
