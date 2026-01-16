import { X } from 'lucide-react';
import { useEffect } from 'react';
import '../styles/components/Drawer.css';

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


        </div>
    );
}

export default Drawer;
