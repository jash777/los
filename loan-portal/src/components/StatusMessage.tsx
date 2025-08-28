import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import './StatusMessage.css';

type IconComponent = React.ComponentType<any>;

interface StatusMessageProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  message, 
  type, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, duration]);

  const getIcon = (): React.ReactElement => {
    switch (type) {
      case 'success':
        return React.createElement(FaCheckCircle as IconComponent);
      case 'error':
        return React.createElement(FaTimes as IconComponent);
      case 'warning':
        return React.createElement(FaExclamationTriangle as IconComponent);
      case 'info':
        return React.createElement(FaInfoCircle as IconComponent);
      default:
        return React.createElement(FaInfoCircle as IconComponent);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Message';
    }
  };

  return (
    <div className={`status-message ${type}`}>
      <div className="status-icon">
        {getIcon()}
      </div>
      <div className="status-content">
        <div className="status-title">{getTitle()}</div>
        <div className="status-text">{message}</div>
      </div>
      {onClose && (
        <button className="status-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default StatusMessage;
