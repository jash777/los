import React, { useState } from 'react';
import { 
  FaUniversity, 
  FaBars, 
  FaTimes, 
  FaQuestionCircle, 
  FaHome, 
  FaServicestack, 
  FaInfoCircle, 
  FaEnvelope,
  FaBolt,
  FaLock,
  FaChartBar,
  FaBriefcase,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import PreQualificationForm from './components/PreQualificationForm';
import LoanApplicationForm from './components/LoanApplicationForm';
import ProcessingStatus from './components/ProcessingStatus';
import StatusMessage from './components/StatusMessage';
import './App.css';

type ApplicationStage = 'pre_qualification' | 'loan_application' | 'processing' | 'complete';

interface StatusMessageType {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ApplicationData {
  stage1Data?: any;
  stage2Data?: any;
  applicationNumber?: string;
  stage1Result?: any;
  stage2Result?: any;
}

const API_BASE_URL = 'http://localhost:3000/api';

function App() {
  const [currentStage, setCurrentStage] = useState<ApplicationStage>('pre_qualification');
  const [applicationData, setApplicationData] = useState<ApplicationData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessages, setStatusMessages] = useState<StatusMessageType[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const addStatusMessage = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now().toString();
    setStatusMessages(prev => [...prev, { id, message, type }]);
  };

  const removeStatusMessage = (id: string) => {
    setStatusMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const handlePreQualification = async (data: any) => {
    setIsLoading(true);
    addStatusMessage('Processing pre-qualification...', 'info');

    try {
      console.log('🚀 Making API call to:', `${API_BASE_URL}/pre-qualification/process`);
      console.log('📤 Request data:', data);
      
      const response = await fetch(`${API_BASE_URL}/pre-qualification/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      console.log('📥 Response status:', response.status);
      const result = await response.json();
      console.log('📥 Response data:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Pre-qualification failed');
      }

      if (result.status === 'rejected') {
        addStatusMessage(`Pre-qualification rejected: ${result.reason || result.message}`, 'error');
        return;
      }

      // Store the application data
      const applicationNumber = result.applicationNumber || result.data?.applicationNumber;
      setApplicationData(prev => ({
        ...prev,
        stage1Data: data,
        applicationNumber,
        stage1Result: result
      }));

      addStatusMessage('✅ Pre-qualification successful! Please provide loan details to continue...', 'success');
      setCurrentStage('loan_application');

    } catch (error: any) {
      console.error('❌ Pre-qualification error:', error);
      addStatusMessage(`Pre-qualification failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoanApplication = async (data: any) => {
    if (!applicationData.applicationNumber) {
      addStatusMessage('Error: No application ID found. Please restart the process.', 'error');
      return;
    }

    setIsLoading(true);
    setCurrentStage('processing');
    addStatusMessage('Submitting loan application...', 'info');

    try {
      const response = await fetch(`${API_BASE_URL}/loan-application/${applicationData.applicationNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      console.log('📥 Stage 2 Response:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Loan application failed');
      }

      // Store the stage 2 result
      setApplicationData(prev => ({
        ...prev,
        stage2Data: data,
        stage2Result: result
      }));

      addStatusMessage('✅ Loan application submitted successfully! Processing...', 'success');

      // Show processing results
      if (result.success) {
        const score = result.application_score?.overall_score || 'N/A';
        const decision = result.decision || result.status || 'pending';
        addStatusMessage(`📊 Application Score: ${score} | Decision: ${decision}`, 'info');
      }

    } catch (error: any) {
      console.error('Loan application error:', error);
      addStatusMessage(`Loan application failed: ${error.message}`, 'error');
      setCurrentStage('loan_application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessingComplete = (result: any) => {
    if (result.status === 'funded' || result.decision === 'approved') {
      addStatusMessage(`🎉 Congratulations! Your loan has been approved and funded.`, 'success');
    } else if (result.decision === 'conditional_approval') {
      addStatusMessage('✅ Application approved with conditions. Please check your email for next steps.', 'success');
    } else {
      addStatusMessage('Application processing completed. Your application is being reviewed.', 'info');
    }
    setCurrentStage('complete');
  };

  const resetApplication = () => {
    setCurrentStage('pre_qualification');
    setApplicationData({});
    setIsLoading(false);
    addStatusMessage('Application reset. You can start a new application.', 'info');
  };

  return (
    <div className="App">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="brand-logo">
              <FaUniversity className="logo-icon" />
              <span className="brand-text">LoanPortal</span>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className={`navbar-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <div className="navbar-nav">
              <a href="#home" className="nav-link active">
                <FaHome className="nav-icon" />
                <span>Home</span>
              </a>
              <a href="#services" className="nav-link">
                <FaServicestack className="nav-icon" />
                <span>Services</span>
              </a>
              <a href="#about" className="nav-link">
                <FaInfoCircle className="nav-icon" />
                <span>About</span>
              </a>
              <a href="#contact" className="nav-link">
                <FaEnvelope className="nav-icon" />
                <span>Contact</span>
              </a>
            </div>
            
            <div className="navbar-actions">
              {applicationData.applicationNumber && (
                <div className="application-badge">
                  <span className="badge-label">App ID:</span>
                  <span className="badge-value">{applicationData.applicationNumber}</span>
                </div>
              )}
              <button className="help-btn" title="Help & Support">
                <FaQuestionCircle />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {/* <header className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Professional Loan Application System</h1>
            <p className="hero-subtitle">Secure, Fast, and Reliable Financial Solutions</p>
            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-icon"><FaBolt /></span>
                <span>Quick Processing</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon"><FaLock /></span>
                <span>Secure Platform</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon"><FaChartBar /></span>
                <span>Real-time Status</span>
              </div>
            </div>
          </div>
        </div>
      </header> */}

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-container">
        {currentStage === 'pre_qualification' && (
          <PreQualificationForm 
            onSubmit={handlePreQualification}
            isLoading={isLoading}
          />
        )}

        {currentStage === 'loan_application' && (
          <LoanApplicationForm 
            onSubmit={handleLoanApplication}
            isLoading={isLoading}
            applicationId={applicationData.applicationNumber || ''}
            stage1Data={applicationData.stage1Data}
          />
        )}

        {currentStage === 'processing' && (
          <ProcessingStatus 
            applicationId={applicationData.applicationNumber || ''}
            onComplete={handleProcessingComplete}
            stage2Result={applicationData.stage2Result}
          />
        )}

        {currentStage === 'complete' && (
          <div className="completion-container">
            <div className="completion-content">
              <div className="completion-icon"><FaCheckCircle /></div>
              <h2>Application Process Complete!</h2>
              <p>Thank you for using our loan application system.</p>
              
              {applicationData.stage2Result && (
                <div className="result-summary">
                  <h3>Application Summary</h3>
                  <div className="result-details">
                    <p><strong>Application ID:</strong> {applicationData.applicationNumber}</p>
                    <p><strong>Overall Score:</strong> {applicationData.stage2Result.application_score?.overall_score || 'N/A'}</p>
                    <p><strong>Decision:</strong> {applicationData.stage2Result.decision || applicationData.stage2Result.status || 'Pending'}</p>
                    <p><strong>Processing Time:</strong> {applicationData.stage2Result.processing_time_ms || 'N/A'} ms</p>
                  </div>
                </div>
              )}
              
              <button onClick={resetApplication} className="reset-btn">
                Start New Application
              </button>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-title">LoanPortal</h3>
              <p className="footer-description">
                Your trusted partner for professional loan applications and financial solutions.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link" title="LinkedIn">
                  <span><FaBriefcase /></span>
                </a>
                <a href="#" className="social-link" title="Twitter">
                  <span>🐦</span>
                </a>
                <a href="#" className="social-link" title="Facebook">
                  <span>📘</span>
                </a>
              </div>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-subtitle">Services</h4>
              <ul className="footer-links">
                <li><a href="#">Personal Loans</a></li>
                <li><a href="#">Business Loans</a></li>
                <li><a href="#">Home Loans</a></li>
                <li><a href="#">Education Loans</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-subtitle">Support</h4>
              <ul className="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Live Chat</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-subtitle">Legal</h4>
              <ul className="footer-links">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-copyright">
              <p>&copy; 2024 LoanPortal. All rights reserved.</p>
            </div>
            <div className="footer-badges">
              <span className="security-badge"><FaLock /> SSL Secured</span>
              <span className="compliance-badge">✓ RBI Compliant</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Status Messages */}
      {statusMessages.map(message => (
        <StatusMessage
          key={message.id}
          message={message.message}
          type={message.type}
          onClose={() => removeStatusMessage(message.id)}
          autoClose={message.type !== 'error'}
        />
      ))}
    </div>
  );
}

export default App;
