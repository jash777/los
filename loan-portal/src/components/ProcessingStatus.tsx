import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaClock, 
  FaTimes, 
  FaPause, 
  FaClipboardList, 
  FaInfoCircle, 
  FaMobile, 
  FaLock,
  FaChartBar 
} from 'react-icons/fa';
import './ProcessingStatus.css';



interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration?: number;
}

interface ProcessingStatusProps {
  applicationId: string;
  onComplete?: (result: any) => void;
  stage2Result?: any; // Added for immediate result display
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ applicationId, onComplete, stage2Result }) => {
  const [stages, setStages] = useState<ProcessingStage[]>([
    {
      id: 'pre_qualification',
      name: 'Pre-Qualification',
      description: 'Basic eligibility check completed',
      status: 'completed',
      duration: 2
    },
    {
      id: 'application_processing',
      name: 'Application Processing',
      description: 'Processing loan application details',
      status: stage2Result ? 'completed' : 'processing',
      duration: 3
    },
    {
      id: 'underwriting',
      name: 'Underwriting',
      description: 'Risk assessment and credit evaluation',
      status: 'pending'
    },
    {
      id: 'credit_decision',
      name: 'Credit Decision',
      description: 'Final approval decision',
      status: 'pending'
    },
    {
      id: 'quality_check',
      name: 'Quality Check',
      description: 'Document verification and compliance',
      status: 'pending'
    },
    {
      id: 'loan_funding',
      name: 'Loan Funding',
      description: 'Disbursement processing',
      status: 'pending'
    }
  ]);

  const [currentStageIndex, setCurrentStageIndex] = useState(stage2Result ? 2 : 1);
  const [processingTime, setProcessingTime] = useState(0);
  const [result, setResult] = useState<any>(stage2Result);

  useEffect(() => {
    const timer = setInterval(() => {
      setProcessingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // If we have stage2Result, show it immediately
  useEffect(() => {
    if (stage2Result) {
      console.log('Stage 2 Result available:', stage2Result);
      setResult(stage2Result);
      
      // Update stages to show application processing as completed
      setStages(prev => prev.map((stage, index) => 
        index === 1 ? { ...stage, status: 'completed' } : stage
      ));
      
      // Show results after a short delay
      setTimeout(() => {
        if (onComplete) {
          onComplete(stage2Result);
        }
      }, 2000);
    }
  }, [stage2Result, onComplete]);

  const simulateProcessing = async (stageId: string, stageIndex: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          // Update current stage to processing
          setCurrentStageIndex(stageIndex);
          setStages(prev => prev.map(stage => 
            stage.id === stageId ? { ...stage, status: 'processing' } : stage
          ));

          // Simulate API call
          const response = await fetch(`http://localhost:3000/api/${stageId.replace('_', '-')}/${applicationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });

          const result = await response.json();

          // Mark stage as completed
          setStages(prev => prev.map(stage => 
            stage.id === stageId ? { ...stage, status: 'completed', duration: 2 } : stage
          ));

          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 2000); // 2 second delay for each stage
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string): React.ReactElement => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle />;
      case 'processing':
        return <FaClock />;
      case 'failed':
        return <FaTimes />;
      default:
        return <FaPause />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'processing':
        return '#2196F3';
      case 'failed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <div className="processing-status-container">
      <div className="processing-header">
        <h2>Processing Your Application</h2>
        <p>Application ID: {applicationId}</p>
        <div className="processing-time">
          <span className="time-label">Processing Time:</span>
          <span className="time-value">{formatTime(processingTime)}</span>
        </div>
      </div>

      <div className="stages-container">
        {stages.map((stage, index) => (
          <div key={stage.id} className={`stage-item ${stage.status}`}>
            <div className="stage-icon" style={{ color: getStatusColor(stage.status) }}>
              {getStatusIcon(stage.status)}
            </div>
            <div className="stage-content">
              <h3>{stage.name}</h3>
              <p>{stage.description}</p>
              {stage.duration && (
                <span className="stage-duration">~{stage.duration} seconds</span>
              )}
            </div>
            {stage.status === 'processing' && (
              <div className="processing-indicator">
                <div className="pulse"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {result && (
        <div className="result-container">
          <div className="result-header">
            <h3>Application Complete!</h3>
          </div>
          <div className="result-content">
            {result.status === 'funded' ? (
              <div className="success-result">
                <div className="success-icon"><FaCheckCircle /></div>
                <h4>Congratulations! Your loan has been approved and funded.</h4>
                <p>Loan Account: {result.loan_account_number}</p>
                <p>Total Processing Time: {formatTime(processingTime)}</p>
              </div>
            ) : (
              <div className="pending-result">
                <div className="pending-icon"><FaClipboardList /></div>
                <h4>Application processing completed.</h4>
                <p>Your application is being reviewed by our team.</p>
                <p>Total Processing Time: {formatTime(processingTime)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="processing-info">
        <div className="info-item">
          <span className="info-icon"><FaInfoCircle /></span>
          <span>This process typically takes 2-5 minutes</span>
        </div>
        <div className="info-item">
          <span className="info-icon"><FaMobile /></span>
          <span>You'll receive SMS/Email updates</span>
        </div>
        <div className="info-item">
          <span className="info-icon"><FaLock /></span>
          <span>Your data is secure and encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;
