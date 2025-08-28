import React, { useState, useEffect } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import './LoanApplication.css';

interface PersonalInfo {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  mobile: string;
  email: string;
  pan_number: string;
}

interface LoanDetails {
  loan_amount: number;
  loan_tenure: number;
  monthly_income: number;
  employment_type: string;
}

interface BusinessInfo {
  business_name: string;
  business_type: string;
  business_vintage: number;
  annual_turnover: number;
}

interface EducationInfo {
  course_name: string;
  institute_name: string;
  course_duration: number;
  course_country: string;
}

type LoanType = 'personal' | 'business' | 'education';
type ApplicationStage = 'prequalification' | 'loan_details' | 'processing';
type StatusType = 'info' | 'success' | 'error';

interface StatusMessage {
  message: string;
  type: StatusType;
}

const API_BASE_URL = 'http://localhost:3000/api';

const LoanApplication: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<ApplicationStage>('prequalification');
  const [loanType, setLoanType] = useState<LoanType>('personal');
  const [applicationId, setApplicationId] = useState<string>('');

  // Debug applicationId changes
  useEffect(() => {
    console.log('ApplicationId changed to:', applicationId);
  }, [applicationId]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    mobile: '',
    email: '',
    pan_number: ''
  });

  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    loan_amount: 0,
    loan_tenure: 0,
    monthly_income: 0,
    employment_type: ''
  });

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    business_name: '',
    business_type: '',
    business_vintage: 0,
    annual_turnover: 0
  });

  const [educationInfo, setEducationInfo] = useState<EducationInfo>({
    course_name: '',
    institute_name: '',
    course_duration: 0,
    course_country: ''
  });

  const showStatus = (message: string, type: StatusType) => {
    setStatus({ message, type });
  };

  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleLoanDetailsChange = (field: keyof LoanDetails, value: string | number) => {
    setLoanDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleBusinessInfoChange = (field: keyof BusinessInfo, value: string | number) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleEducationInfoChange = (field: keyof EducationInfo, value: string | number) => {
    setEducationInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePrequalification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    showStatus('Processing pre-qualification...', 'info');

    try {
      // Format data to match backend validation expectations
      const preQualData = {
        applicantName: `${personalInfo.first_name} ${personalInfo.last_name}`,
        dateOfBirth: personalInfo.date_of_birth,
        phone: personalInfo.mobile,
        panNumber: personalInfo.pan_number,
        email: personalInfo.email,
        loan_type: loanType
      };

      const response = await fetch(`${API_BASE_URL}/pre-qualification/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preQualData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Pre-qualification failed');
      }

      if (result.status === 'rejected') {
        showStatus(`Pre-qualification rejected: ${result.rejection_reason}`, 'error');
        return;
      }

      console.log('Pre-qualification result:', result);
      console.log('Setting applicationId to:', result.data.applicationNumber);
      setApplicationId(result.data.applicationNumber);
      showStatus('Pre-qualification successful! Please provide loan details to continue...', 'success');
      setCurrentStage('loan_details');

    } catch (error: any) {
      console.error('Pre-qualification error:', error);
      showStatus(`Pre-qualification failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoanApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted! ApplicationId:', applicationId);
    
    if (!applicationId) {
      console.error('No applicationId found!');
      showStatus('Error: No application ID found. Please restart the process.', 'error');
      return;
    }

    setIsLoading(true);
    setCurrentStage('processing');
    showStatus('Submitting loan application...', 'info');

    try {
      // Prepare loan application data
      const applicationData = {
        personal_info: personalInfo,
        loan_details: loanDetails,
        ...(loanType === 'business' && { business_info: businessInfo }),
        ...(loanType === 'education' && { education_info: educationInfo })
      };

      console.log('Sending loan application data:', applicationData);
      console.log('API URL:', `${API_BASE_URL}/loan-application/${applicationId}`);

      // Stage 2: Loan Application
      const loanResponse = await fetch(`${API_BASE_URL}/loan-application/${applicationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      });

      console.log('Loan response status:', loanResponse.status);
      const loanResult = await loanResponse.json();
      console.log('Loan response data:', loanResult);

      if (!loanResponse.ok) {
        throw new Error(loanResult.message || 'Loan application failed');
      }

      // Process remaining stages
      await processRemainingStages(applicationId);

    } catch (error: any) {
      console.error('Loan application error:', error);
      showStatus(`Loan application failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const processRemainingStages = async (appId: string) => {
    try {
      // Stage 3: Application Processing
      showStatus('Processing documents and verification...', 'info');
      await fetch(`${API_BASE_URL}/application-processing/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      // Stage 4: Underwriting
      showStatus('Underwriting and risk assessment...', 'info');
      await fetch(`${API_BASE_URL}/underwriting/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      // Stage 5: Credit Decision
      showStatus('Making credit decision...', 'info');
      const creditResponse = await fetch(`${API_BASE_URL}/credit-decision/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const creditResult = await creditResponse.json();

      if (creditResult.decision === 'rejected') {
        showStatus(`Loan application rejected: ${creditResult.rejection_reason}`, 'error');
        return;
      }

      // Stage 6: Quality Check
      showStatus('Performing quality checks...', 'info');
      await fetch(`${API_BASE_URL}/quality-check/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      // Stage 7: Loan Funding
      showStatus('Processing loan funding...', 'info');
      const fundingResponse = await fetch(`${API_BASE_URL}/loan-funding/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const fundingResult = await fundingResponse.json();

      if (fundingResult.status === 'funded') {
        showStatus(`Congratulations! Your loan has been approved and funded. Loan Account: ${fundingResult.loan_account_number}`, 'success');
      } else {
        showStatus('Loan processing completed but funding is pending.', 'info');
      }

    } catch (error: any) {
      console.error('Processing error:', error);
      showStatus(`Processing failed: ${error.message}`, 'error');
    }
  };

  const renderPersonalInfoForm = () => (
    <div className="form-section">
      <h3>Personal Information</h3>
      <div className="form-row">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            value={personalInfo.first_name}
            onChange={(e) => handlePersonalInfoChange('first_name', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            value={personalInfo.last_name}
            onChange={(e) => handlePersonalInfoChange('last_name', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Date of Birth *</label>
          <input
            type="date"
            value={personalInfo.date_of_birth}
            onChange={(e) => handlePersonalInfoChange('date_of_birth', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Mobile Number *</label>
          <input
            type="tel"
            value={personalInfo.mobile}
            onChange={(e) => handlePersonalInfoChange('mobile', e.target.value)}
            pattern="[0-9]{10}"
            required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Email Address *</label>
          <input
            type="email"
            value={personalInfo.email}
            onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>PAN Number *</label>
          <input
            type="text"
            value={personalInfo.pan_number}
            onChange={(e) => handlePersonalInfoChange('pan_number', e.target.value)}
            pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderLoanDetailsForm = () => (
    <div className="form-section">
      <h3>Loan Details</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Loan Amount (₹) *</label>
          <input
            type="number"
            value={loanDetails.loan_amount || ''}
            onChange={(e) => handleLoanDetailsChange('loan_amount', parseInt(e.target.value) || 0)}
            min="50000"
            max="10000000"
            required
          />
        </div>
        <div className="form-group">
          <label>Loan Tenure (months) *</label>
          <input
            type="number"
            value={loanDetails.loan_tenure || ''}
            onChange={(e) => handleLoanDetailsChange('loan_tenure', parseInt(e.target.value) || 0)}
            min="12"
            max="360"
            required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Monthly Income (₹) *</label>
          <input
            type="number"
            value={loanDetails.monthly_income || ''}
            onChange={(e) => handleLoanDetailsChange('monthly_income', parseInt(e.target.value) || 0)}
            min="15000"
            required
          />
        </div>
        <div className="form-group">
          <label>Employment Type *</label>
          <select
            value={loanDetails.employment_type}
            onChange={(e) => handleLoanDetailsChange('employment_type', e.target.value)}
            required
          >
            <option value="">Select Employment Type</option>
            <option value="salaried">Salaried</option>
            <option value="self_employed">Self Employed</option>
            <option value="business">Business Owner</option>
            <option value="professional">Professional</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderBusinessFields = () => (
    loanType === 'business' && (
      <div className="form-section">
        <h3>Business Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              value={businessInfo.business_name}
              onChange={(e) => handleBusinessInfoChange('business_name', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Business Type</label>
            <select
              value={businessInfo.business_type}
              onChange={(e) => handleBusinessInfoChange('business_type', e.target.value)}
            >
              <option value="">Select Business Type</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="trading">Trading</option>
              <option value="services">Services</option>
              <option value="retail">Retail</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Business Vintage (years)</label>
            <input
              type="number"
              value={businessInfo.business_vintage || ''}
              onChange={(e) => handleBusinessInfoChange('business_vintage', parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          <div className="form-group">
            <label>Annual Turnover (₹)</label>
            <input
              type="number"
              value={businessInfo.annual_turnover || ''}
              onChange={(e) => handleBusinessInfoChange('annual_turnover', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    )
  );

  const renderEducationFields = () => (
    loanType === 'education' && (
      <div className="form-section">
        <h3>Education Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Course Name</label>
            <input
              type="text"
              value={educationInfo.course_name}
              onChange={(e) => handleEducationInfoChange('course_name', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Institute Name</label>
            <input
              type="text"
              value={educationInfo.institute_name}
              onChange={(e) => handleEducationInfoChange('institute_name', e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Course Duration (years)</label>
            <input
              type="number"
              value={educationInfo.course_duration || ''}
              onChange={(e) => handleEducationInfoChange('course_duration', parseInt(e.target.value) || 0)}
              min="1"
              max="10"
            />
          </div>
          <div className="form-group">
            <label>Course Country</label>
            <select
              value={educationInfo.course_country}
              onChange={(e) => handleEducationInfoChange('course_country', e.target.value)}
            >
              <option value="">Select Country</option>
              <option value="india">India</option>
              <option value="usa">USA</option>
              <option value="uk">UK</option>
              <option value="canada">Canada</option>
              <option value="australia">Australia</option>
            </select>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="container">
      <div className="header">
        <h1>Loan Application Portal</h1>
        <p>Apply for Personal, Business, or Education Loans</p>
      </div>

      <div className="loan-types">
        <div 
          className={`loan-type ${loanType === 'personal' ? 'active' : ''}`}
          onClick={() => setLoanType('personal')}
        >
          <h3>Personal Loan</h3>
          <p>For personal expenses</p>
        </div>
        <div 
          className={`loan-type ${loanType === 'business' ? 'active' : ''}`}
          onClick={() => setLoanType('business')}
        >
          <h3>Business Loan</h3>
          <p>For business growth</p>
        </div>
        <div 
          className={`loan-type ${loanType === 'education' ? 'active' : ''}`}
          onClick={() => setLoanType('education')}
        >
          <h3>Education Loan</h3>
          <p>For educational purposes</p>
        </div>
      </div>

      <div className="form-container">
        {currentStage === 'prequalification' && (
          <form onSubmit={handlePrequalification}>
            {renderPersonalInfoForm()}
            
            <div className="form-section">
              <h3>Loan Type</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Loan Type *</label>
                  <select
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value as LoanType)}
                    required
                  >
                    <option value="personal">Personal Loan</option>
                    <option value="business">Business Loan</option>
                    <option value="education">Education Loan</option>
                  </select>
                </div>
              </div>
              <p style={{ color: '#666', fontSize: '0.9em', marginTop: '10px' }}>
                <strong>Note:</strong> This is a preliminary eligibility check based on your personal information.
              </p>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <><span className="loading"></span>Checking Eligibility...</>
              ) : (
                'Check Eligibility'
              )}
            </button>
          </form>
        )}

        {currentStage === 'loan_details' && (
          <form onSubmit={handleLoanApplication}>
            {renderLoanDetailsForm()}
            {renderBusinessFields()}
            {renderEducationFields()}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <><span className="loading"></span>Submitting Application...</>
              ) : (
                'Submit Loan Application'
              )}
            </button>
          </form>
        )}

        {currentStage === 'processing' && (
          <div className="processing-stage">
            <h3>Processing Your Application</h3>
            <p>Please wait while we process your loan application through all stages...</p>
            {isLoading && <span className="loading"></span>}
          </div>
        )}

        {status && (
          <div className={`status-container show status-${status.type}`}>
            <div>{status.message}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanApplication;