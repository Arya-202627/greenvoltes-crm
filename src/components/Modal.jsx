// Modal.jsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content-wrap glass-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '0px', overflow: 'hidden' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>

      <style>{`
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          background: rgba(27, 35, 54, 0.4);
        }

        .modal-title {
          font-size: 18px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: color var(--transition-fast), transform var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
        }

        .modal-close-btn:hover {
          color: var(--status-danger);
          background: rgba(239, 68, 68, 0.08);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(85vh - 70px);
        }
      `}</style>
    </div>
  );
}
