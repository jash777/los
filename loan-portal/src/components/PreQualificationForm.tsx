import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaCalendarAlt, 
  FaPhone, 
  FaEnvelope, 
  FaIdCard, 
  FaRupeeSign, 
  FaBriefcase, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaArrowRight,
  FaCheck 
} from 'react-icons/fa';
import './PreQualificationForm.css';

interface PersonalInfo {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  mobile: string;
  email: string;
  pan_number: string;
  loan_amount: string;
  loan_purpose: string;
  employment_type: string;
}

interface PreQualificationFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

const PreQualificationForm: React.FC<PreQualificationFormProps> = ({ onSubmit, isLoading }) => {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    mobile: '',
    email: '',
    pan_number: '',
    loan_amount: '500000',
    loan_purpose: 'personal',
    employment_type: 'salaried'
  });

  const [errors, setErrors] = useState<Partial<PersonalInfo>>({});
  const [validFields, setValidFields] = useState<Partial<Record<keyof PersonalInfo, boolean>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PersonalInfo, boolean>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<PersonalInfo> = {};

    // Name validation
    if (!personalInfo.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (personalInfo.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (!personalInfo.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    // Date of birth validation
    if (!personalInfo.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const age = new Date().getFullYear() - new Date(personalInfo.date_of_birth).getFullYear();
      if (age < 18 || age > 65) {
        newErrors.date_of_birth = 'Age must be between 18 and 65 years';
      }
    }

    // Mobile validation (Indian format)
    if (!personalInfo.mobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(personalInfo.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    // Email validation
    if (!personalInfo.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // PAN validation
    if (!personalInfo.pan_number) {
      newErrors.pan_number = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(personalInfo.pan_number)) {
      newErrors.pan_number = 'Please enter a valid PAN number (e.g., ABCDE1234F)';
    }

    // Loan amount validation
    if (!personalInfo.loan_amount) {
      newErrors.loan_amount = 'Loan amount is required';
    } else {
      const amount = parseInt(personalInfo.loan_amount);
      if (isNaN(amount) || amount < 50000 || amount > 5000000) {
        newErrors.loan_amount = 'Loan amount must be between ₹50,000 and ₹50,00,000';
      }
    }

    // Loan purpose validation
    if (!personalInfo.loan_purpose) {
      newErrors.loan_purpose = 'Loan purpose is required';
    }

    // Employment type validation
    if (!personalInfo.employment_type) {
      newErrors.employment_type = 'Employment type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Format data exactly as expected by the backend
    const preQualData = {
      applicantName: `${personalInfo.first_name} ${personalInfo.last_name}`.trim(),
      dateOfBirth: personalInfo.date_of_birth,
      phone: personalInfo.mobile,
      panNumber: personalInfo.pan_number.toUpperCase(),
      email: personalInfo.email,
      loanAmount: parseInt(personalInfo.loan_amount) || 500000,
      loanPurpose: personalInfo.loan_purpose,
      employmentType: personalInfo.employment_type
    };

    console.log('📤 Sending pre-qualification data:', preQualData);
    await onSubmit(preQualData);
  };

  const validateField = (field: keyof PersonalInfo, value: string): boolean => {
    switch (field) {
      case 'first_name':
      case 'last_name':
        return value.trim().length >= 2;
      case 'date_of_birth':
        if (!value) return false;
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return age >= 18 && age <= 65;
      case 'mobile':
        return /^[6-9]\d{9}$/.test(value);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'pan_number':
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);
      case 'loan_amount':
        const amount = parseInt(value);
        return !isNaN(amount) && amount >= 50000 && amount <= 5000000;
      case 'loan_purpose':
      case 'employment_type':
        return value.trim().length > 0;
      default:
        return false;
    }
  };

  const handleInputChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Real-time validation for success feedback
    const isValid = validateField(field, value);
    setValidFields(prev => ({ ...prev, [field]: isValid }));
  };

  const handleBlur = (field: keyof PersonalInfo) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = personalInfo[field];
    const isValid = validateField(field, value);
    
    if (!isValid && value) {
      // Show error only if field has value but is invalid
      const newErrors = { ...errors };
      switch (field) {
        case 'first_name':
        case 'last_name':
          newErrors[field] = 'Name must be at least 2 characters';
          break;
        case 'date_of_birth':
          newErrors[field] = 'Age must be between 18 and 65 years';
          break;
        case 'mobile':
          newErrors[field] = 'Please enter a valid 10-digit mobile number';
          break;
        case 'email':
          newErrors[field] = 'Please enter a valid email address';
          break;
        case 'pan_number':
          newErrors[field] = 'Please enter a valid PAN number (e.g., ABCDE1234F)';
          break;
        case 'loan_amount':
          newErrors[field] = 'Loan amount must be between ₹50,000 and ₹50,00,000';
          break;
      }
      setErrors(newErrors);
    }
  };

  const getFieldStatus = (field: keyof PersonalInfo) => {
    if (errors[field]) return 'error';
    if (validFields[field] && touched[field]) return 'success';
    return 'default';
  };

  return (
    <div className="pre-qualification-container">
      <div className="form-header">
        <div className="step-indicator">
          <div className="step active">
            <FaCheckCircle className="step-icon" />
            <span className="step-number">1</span>
          </div>
          <div className="step-line"></div>
          <div className="step">
            <span className="step-number">2</span>
          </div>
        </div>
        <h2>Pre-Qualification Check</h2>
        <p>Complete this step to check your loan eligibility</p>
      </div>

      <form onSubmit={handleSubmit} className={`pre-qual-form ${isLoading ? 'loading' : ''}`}>
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="first_name">
                <FaUser className="label-icon" />
                First Name *
              </label>
              <div className="input-wrapper">
                <input
                  id="first_name"
                  type="text"
                  value={personalInfo.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  onBlur={() => handleBlur('first_name')}
                  className={getFieldStatus('first_name')}
                  placeholder="Enter your first name"
                />
                {getFieldStatus('first_name') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.first_name && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.first_name}
                </span>
              )}
              {getFieldStatus('first_name') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Looks good!
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                <FaUser className="label-icon" />
                Last Name *
              </label>
              <div className="input-wrapper">
                <input
                  id="last_name"
                  type="text"
                  value={personalInfo.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  onBlur={() => handleBlur('last_name')}
                  className={getFieldStatus('last_name')}
                  placeholder="Enter your last name"
                />
                {getFieldStatus('last_name') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.last_name && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.last_name}
                </span>
              )}
              {getFieldStatus('last_name') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Looks good!
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="date_of_birth">
                <FaCalendarAlt className="label-icon" />
                Date of Birth *
              </label>
              <div className="input-wrapper">
                <input
                  id="date_of_birth"
                  type="date"
                  value={personalInfo.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  onBlur={() => handleBlur('date_of_birth')}
                  className={getFieldStatus('date_of_birth')}
                  max={new Date().toISOString().split('T')[0]}
                />
                {getFieldStatus('date_of_birth') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.date_of_birth && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.date_of_birth}
                </span>
              )}
              {getFieldStatus('date_of_birth') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Valid date of birth
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="mobile">
                <FaPhone className="label-icon" />
                Mobile Number *
              </label>
              <div className="input-wrapper">
                <input
                  id="mobile"
                  type="tel"
                  value={personalInfo.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  onBlur={() => handleBlur('mobile')}
                  className={getFieldStatus('mobile')}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
                {getFieldStatus('mobile') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.mobile && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.mobile}
                </span>
              )}
              {getFieldStatus('mobile') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Valid mobile number
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope className="label-icon" />
                Email Address *
              </label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={getFieldStatus('email')}
                  placeholder="Enter your email address"
                />
                {getFieldStatus('email') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.email && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.email}
                </span>
              )}
              {getFieldStatus('email') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Valid email address
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="pan_number">
                <FaIdCard className="label-icon" />
                PAN Number *
              </label>
              <div className="input-wrapper">
                <input
                  id="pan_number"
                  type="text"
                  value={personalInfo.pan_number}
                  onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('pan_number')}
                  className={getFieldStatus('pan_number')}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                {getFieldStatus('pan_number') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.pan_number && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.pan_number}
                </span>
              )}
              {getFieldStatus('pan_number') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Valid PAN number
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Loan Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="loan_amount">
                <FaRupeeSign className="label-icon" />
                Loan Amount (₹) *
              </label>
              <div className="input-wrapper">
                <input
                  id="loan_amount"
                  type="number"
                  value={personalInfo.loan_amount}
                  onChange={(e) => handleInputChange('loan_amount', e.target.value)}
                  onBlur={() => handleBlur('loan_amount')}
                  className={getFieldStatus('loan_amount')}
                  placeholder="Enter loan amount"
                  min="50000"
                  max="5000000"
                />
                {getFieldStatus('loan_amount') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.loan_amount && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.loan_amount}
                </span>
              )}
              {getFieldStatus('loan_amount') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Valid loan amount
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="loan_purpose">
                <FaBriefcase className="label-icon" />
                Loan Purpose *
              </label>
              <div className="input-wrapper">
                <select
                  id="loan_purpose"
                  value={personalInfo.loan_purpose}
                  onChange={(e) => handleInputChange('loan_purpose', e.target.value)}
                  onBlur={() => handleBlur('loan_purpose')}
                  className={getFieldStatus('loan_purpose')}
                >
                  <option value="personal">Personal Loan</option>
                  <option value="home_improvement">Home Improvement</option>
                  <option value="medical">Medical</option>
                  <option value="education">Education</option>
                  <option value="business">Business</option>
                  <option value="debt_consolidation">Debt Consolidation</option>
                  <option value="travel">Travel</option>
                  <option value="wedding">Wedding</option>
                  <option value="other">Other</option>
                </select>
                {getFieldStatus('loan_purpose') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.loan_purpose && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.loan_purpose}
                </span>
              )}
              {getFieldStatus('loan_purpose') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Valid loan purpose
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="employment_type">
                <FaBriefcase className="label-icon" />
                Employment Type *
              </label>
              <div className="input-wrapper">
                <select
                  id="employment_type"
                  value={personalInfo.employment_type}
                  onChange={(e) => handleInputChange('employment_type', e.target.value)}
                  onBlur={() => handleBlur('employment_type')}
                  className={getFieldStatus('employment_type')}
                >
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="business_owner">Business Owner</option>
                  <option value="professional">Professional</option>
                  <option value="retired">Retired</option>
                </select>
                {getFieldStatus('employment_type') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.employment_type && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.employment_type}
                </span>
              )}
              {getFieldStatus('employment_type') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Valid employment type
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="info-box">
          <div className="info-icon">
            <FaInfoCircle />
          </div>
          <div className="info-content">
            <h4>What happens next?</h4>
            <p>We'll verify your basic eligibility based on age, PAN, and contact details. This is a quick preliminary check that takes 2-3 minutes.</p>
          </div>
        </div>

        <button type="submit" className={`submit-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Checking Eligibility...
            </>
          ) : (
            <>
              Check Eligibility
              <FaArrowRight className="btn-icon" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PreQualificationForm;
