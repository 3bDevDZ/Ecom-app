import React from 'react';
import { Document } from '../types/order.types';
import { OrderService } from '../services/order.service';
import './DocumentsSection.css';

interface DocumentsSectionProps {
  documents: Document[];
}

/**
 * DocumentsSection Component
 * Displays order-related documents in a card-based layout
 */
export const DocumentsSection: React.FC<DocumentsSectionProps> = ({ documents }) => {
  const getDocumentIcon = (type: string): string => {
    const icons: Record<string, string> = {
      INVOICE: '📄',
      DELIVERY_NOTE: '📦',
      RETURN_LABEL: '🔙',
      RECEIPT: '🧾',
    };
    return icons[type] || '📋';
  };

  const handleDownload = (document: Document) => {
    window.open(document.url, '_blank');
  };

  const handleView = (document: Document) => {
    window.open(document.url, '_blank');
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="documents-section">
      <h2 className="documents-title">Documents</h2>
      <div className="documents-grid">
        {documents.map((document) => (
          <div key={document.id} className="document-card">
            <div className="document-icon">{getDocumentIcon(document.type)}</div>
            <div className="document-info">
              <div className="document-name">{document.name}</div>
              <div className="document-date">
                {OrderService.formatDate(document.createdAt)}
              </div>
            </div>
            <div className="document-actions">
              <button
                onClick={() => handleView(document)}
                className="btn-action btn-view"
                title="View document"
              >
                <span className="action-icon">👁️</span>
                View
              </button>
              <button
                onClick={() => handleDownload(document)}
                className="btn-action btn-download"
                title="Download document"
              >
                <span className="action-icon">⬇️</span>
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
