import { X } from 'lucide-react';
import { useEffect } from 'react';

function Drawer({ isOpen, onClose, title, children, width = '500px', actions }) {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div
                className="drawer-panel"
                onClick={(e) => e.stopPropagation()}
                style={{ width }}
            >
                <div className="drawer-header">
                    <h2>{title}</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="drawer-content">
                    {children}
                </div>

                {actions && (
                    <div className="drawer-actions">
                        {actions}
                    </div>
                )}
            </div>

            <style>{`
                .drawer-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 200;
                    display: flex;
                    justify-content: flex-end;
                    animation: fadeIn 0.2s ease-out;
                }

                .drawer-panel {
                    height: 100%;
                    background-color: var(--color-bg-secondary);
                    border-left: 1px solid var(--color-border);
                    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .drawer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--spacing-lg);
                    border-bottom: 1px solid var(--color-border);
                    flex-shrink: 0;
                }

                .drawer-header h2 {
                    font-size: var(--font-size-xl);
                    font-weight: 600;
                    color: var(--color-text-primary);
                    margin: 0;
                }

                .drawer-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: var(--spacing-lg);
                }

                .drawer-actions {
                    padding: var(--spacing-lg);
                    border-top: 1px solid var(--color-border);
                    background-color: var(--color-bg-tertiary);
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--spacing-md);
                    flex-shrink: 0;
                }
            `}</style>
        </div>
    );
}

export default Drawer;
