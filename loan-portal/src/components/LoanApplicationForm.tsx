import React, { useState } from 'react';
import { 
  FaRupeeSign, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaBriefcase, 
  FaUsers, 
  FaIndustry,
  FaHome, 
  FaMapMarkerAlt, 
  FaCity, 
  FaMapPin,
  FaCreditCard, 
  FaPhone, 
  FaUniversity, 
  FaBuilding,
  FaUser, 
  FaIdBadge,
  FaExclamationTriangle,
  FaCheckCircle,
  FaLink,
  FaArrowRight,
  FaCheck
} from 'react-icons/fa';
import './LoanApplicationForm.css';

interface LoanDetails {
  loan_amount: number;
  loan_tenure: number;
  monthly_income: number;
  employment_type: string;
  number_of_dependents: number;
  street_address: string;
  city: string;
  state: string;
  pincode: string;
  permanent_street_address: string;
  permanent_city: string;
  permanent_state: string;
  permanent_pincode: string;
  it_software: string;
  // Banking details for auto-fetching statements
  account_number: string;
  mobile_number: string;
  ifsc_code: string;
  bank_name: string;
  // Employment details for verification
  company_name: string;
  designation: string;
  employee_name: string;
}

interface LoanApplicationFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  applicationId: string;
  stage1Data?: any;
}

const LoanApplicationForm: React.FC<LoanApplicationFormProps> = ({ onSubmit, isLoading, applicationId, stage1Data }) => {
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    loan_amount: stage1Data?.loanAmount || 500000,
    loan_tenure: 36,
    monthly_income: 50000,
    employment_type: stage1Data?.employmentType || 'salaried',
    number_of_dependents: 0,
    street_address: '',
    city: '',
    state: '',
    pincode: '',
    permanent_street_address: '',
    permanent_city: '',
    permanent_state: '',
    permanent_pincode: '',
    it_software: 'IT',
    // Banking details for auto-fetching statements
    account_number: '',
    mobile_number: stage1Data?.phone || '',
    ifsc_code: '',
    bank_name: '',
    // Employment details for verification
    company_name: '',
    designation: '',
    employee_name: stage1Data?.applicantName || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validFields, setValidFields] = useState<Set<string>>(new Set());
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Loan amount validation
    if (!loanDetails.loan_amount || loanDetails.loan_amount < 50000) {
      newErrors.loan_amount = 'Loan amount must be at least ₹50,000';
    } else if (loanDetails.loan_amount > 10000000) {
      newErrors.loan_amount = 'Loan amount cannot exceed ₹1,00,00,000';
    }

    // Loan tenure validation
    if (!loanDetails.loan_tenure || loanDetails.loan_tenure < 12) {
      newErrors.loan_tenure = 'Loan tenure must be at least 12 months';
    } else if (loanDetails.loan_tenure > 360) {
      newErrors.loan_tenure = 'Loan tenure cannot exceed 360 months (30 years)';
    }

    // Monthly income validation
    if (!loanDetails.monthly_income || loanDetails.monthly_income < 15000) {
      newErrors.monthly_income = 'Monthly income must be at least ₹15,000';
    }

    // Employment type validation
    if (!loanDetails.employment_type) {
      newErrors.employment_type = 'Employment type is required';
    }

    // Number of dependents validation
    if (loanDetails.number_of_dependents < 0) {
      newErrors.number_of_dependents = 'Number of dependents cannot be negative';
    }

    // Address validation
    if (!loanDetails.street_address.trim()) {
      newErrors.street_address = 'Current street address is required';
    }
    if (!loanDetails.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!loanDetails.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!loanDetails.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(loanDetails.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    // Permanent address validation
    if (!loanDetails.permanent_street_address.trim()) {
      newErrors.permanent_street_address = 'Permanent street address is required';
    }
    if (!loanDetails.permanent_city.trim()) {
      newErrors.permanent_city = 'Permanent city is required';
    }
    if (!loanDetails.permanent_state.trim()) {
      newErrors.permanent_state = 'Permanent state is required';
    }
    if (!loanDetails.permanent_pincode.trim()) {
      newErrors.permanent_pincode = 'Permanent pincode is required';
    } else if (!/^\d{6}$/.test(loanDetails.permanent_pincode)) {
      newErrors.permanent_pincode = 'Please enter a valid 6-digit pincode';
    }

    // Industry type validation
    if (!loanDetails.it_software.trim()) {
      newErrors.it_software = 'Industry type is required';
    }

    // Banking details validation
    if (!loanDetails.account_number) {
      newErrors.account_number = 'Account number is required';
    }
    if (!loanDetails.mobile_number) {
      newErrors.mobile_number = 'Mobile number linked to bank account is required';
    } else if (!/^[6-9]\d{9}$/.test(loanDetails.mobile_number)) {
      newErrors.mobile_number = 'Please enter a valid 10-digit mobile number';
    }
    if (!loanDetails.ifsc_code) {
      newErrors.ifsc_code = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(loanDetails.ifsc_code)) {
      newErrors.ifsc_code = 'Please enter a valid IFSC code';
    }
    if (!loanDetails.bank_name) {
      newErrors.bank_name = 'Bank name is required';
    }

    // Employment details validation
    if (!loanDetails.company_name) {
      newErrors.company_name = 'Company name is required';
    }
    if (!loanDetails.designation) {
      newErrors.designation = 'Designation is required';
    }
    if (!loanDetails.employee_name) {
      newErrors.employee_name = 'Employee name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const applicationData = {
      // Personal details (from Stage 1)
      personal_details: {
        aadhaar_number: '123456789012', // Will be collected in Stage 2
        marital_status: 'single',
        spouse_name: '', // Empty for single status
        number_of_dependents: loanDetails.number_of_dependents,
        education_level: 'graduate'
      },
      
      // Employment details for verification
      employment_details: {
        employment_type: loanDetails.employment_type,
        company_name: loanDetails.company_name,
        designation: loanDetails.designation,
        employee_name: loanDetails.employee_name,
        monthly_gross_income: loanDetails.monthly_income,
        monthly_net_income: Math.round(loanDetails.monthly_income * 0.8), // Estimate
        work_experience_years: 3, // Default
        current_job_experience_years: 2, // Default
        industry_type: loanDetails.it_software,
        employment_status: 'active'
      },
      
      // Address details
      address_details: {
        current_address: {
          street_address: loanDetails.street_address,
          city: loanDetails.city,
          state: loanDetails.state,
          pincode: loanDetails.pincode,
          residence_type: 'rented',
          years_at_address: 2
        },
        permanent_address: {
          street_address: loanDetails.permanent_street_address,
          city: loanDetails.permanent_city,
          state: loanDetails.permanent_state,
          pincode: loanDetails.permanent_pincode
        }
      },
      
      // Banking details for auto-fetching statements
      banking_details: {
        account_number: loanDetails.account_number,
        mobile_number: loanDetails.mobile_number,
        ifsc_code: loanDetails.ifsc_code,
        bank_name: loanDetails.bank_name
      },
      
      // Required documents (simplified)
      required_documents: {
        identity_proof: { document_type: 'pan_card', document_url: 'auto_verified' },
        address_proof: { document_type: 'aadhaar_card', document_url: 'auto_verified' }
      },
      
      // Additional information
      additional_information: {
        loan_purpose_details: 'Personal loan for various purposes',
        repayment_source: 'Monthly salary',
        preferred_tenure_months: loanDetails.loan_tenure,
        existing_relationship_with_bank: false,
        co_applicant_required: false,
        property_owned: false
      },
      
      // References (simplified)
      references: [
        {
          name: 'Reference 1',
          mobile: '9876543210',
          relationship: 'friend',
          address: 'Mumbai, Maharashtra',
          years_known: 5
        },
        {
          name: 'Reference 2',
          mobile: '9876543211',
          relationship: 'colleague',
          address: 'Mumbai, Maharashtra',
          years_known: 3
        }
      ]
    };

    await onSubmit(applicationData);
  };

  const validateField = (field: string, value: any): boolean => {
    switch (field) {
      case 'loan_amount':
        return value >= 50000 && value <= 10000000;
      case 'loan_tenure':
        return value >= 12 && value <= 360;
      case 'monthly_income':
        return value >= 15000;
      case 'employment_type':
        return value && value.trim() !== '';
      case 'number_of_dependents':
        return value >= 0;
      case 'street_address':
      case 'city':
      case 'state':
      case 'permanent_street_address':
      case 'permanent_city':
      case 'permanent_state':
      case 'it_software':
      case 'bank_name':
      case 'company_name':
      case 'designation':
      case 'employee_name':
        return value && value.trim() !== '';
      case 'pincode':
      case 'permanent_pincode':
        return /^\d{6}$/.test(value);
      case 'account_number':
        return value && value.trim() !== '';
      case 'mobile_number':
        return /^[6-9]\d{9}$/.test(value);
      case 'ifsc_code':
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value);
      default:
        return true;
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => new Set([...prev, field]));
    const value = loanDetails[field as keyof LoanDetails];
    
    if (validateField(field, value)) {
      setValidFields(prev => new Set([...prev, field]));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } else {
      setValidFields(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(field);
        return newSet;
      });
    }
  };

  const getFieldStatus = (field: string): string => {
    if (errors[field]) return 'error';
    if (validFields.has(field) && touched.has(field)) return 'success';
    return '';
  };

  const handleInputChange = (field: keyof LoanDetails, value: string | number) => {
    setLoanDetails(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    if (validateField(field, value)) {
      setValidFields(prev => new Set([...prev, field]));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } else {
      setValidFields(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(field);
        return newSet;
      });
    }
  };

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli',
    'Daman and Diu', 'Lakshadweep', 'Puducherry', 'Andaman and Nicobar Islands'
  ];

  return (
    <div className="loan-application-container">
      <div className="form-header">
        <div className="step-indicator">
          <div className="step completed">
            <FaCheckCircle className="step-icon" />
            <span className="step-number">1</span>
          </div>
          <div className="step-line completed"></div>
          <div className="step active">
            <span className="step-number">2</span>
          </div>
        </div>
        <h2>Loan Application Details</h2>
        <p>Application ID: {applicationId}</p>
      </div>

      <form onSubmit={handleSubmit} className={`loan-application-form ${isLoading ? 'loading' : ''}`}>
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
                  value={loanDetails.loan_amount || ''}
                  onChange={(e) => handleInputChange('loan_amount', parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur('loan_amount')}
                  className={getFieldStatus('loan_amount')}
                  placeholder="50000"
                  min="50000"
                  max="10000000"
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
              <label htmlFor="loan_tenure">
                <FaCalendarAlt className="label-icon" />
                Loan Tenure (months) *
              </label>
              <div className="input-wrapper">
                <input
                  id="loan_tenure"
                  type="number"
                  value={loanDetails.loan_tenure || ''}
                  onChange={(e) => handleInputChange('loan_tenure', parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur('loan_tenure')}
                  className={getFieldStatus('loan_tenure')}
                  placeholder="24"
                  min="12"
                  max="360"
                />
                {getFieldStatus('loan_tenure') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.loan_tenure && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.loan_tenure}
                </span>
              )}
              {getFieldStatus('loan_tenure') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Valid loan tenure
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="monthly_income">
                <FaMoneyBillWave className="label-icon" />
                Monthly Income (₹) *
              </label>
              <div className="input-wrapper">
                <input
                  id="monthly_income"
                  type="number"
                  value={loanDetails.monthly_income || ''}
                  onChange={(e) => handleInputChange('monthly_income', parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur('monthly_income')}
                  className={getFieldStatus('monthly_income')}
                  placeholder="50000"
                  min="15000"
                />
                {getFieldStatus('monthly_income') === 'success' && (
                  <FaCheck className="success-icon" />
                )}
              </div>
              {errors.monthly_income && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.monthly_income}
                </span>
              )}
              {getFieldStatus('monthly_income') === 'success' && (
                <span className="success-message">
                  <FaCheck className="success-icon" />
                  Valid monthly income
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
                  value={loanDetails.employment_type}
                  onChange={(e) => handleInputChange('employment_type', e.target.value)}
                  className={errors.employment_type ? 'error' : ''}
                >
                  <option value="">Select Employment Type</option>
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="business">Business Owner</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              {errors.employment_type && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.employment_type}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="number_of_dependents">
                <FaUsers className="label-icon" />
                Number of Dependents
              </label>
              <div className="input-wrapper">
                <input
                  id="number_of_dependents"
                  type="number"
                  value={loanDetails.number_of_dependents || ''}
                  onChange={(e) => handleInputChange('number_of_dependents', parseInt(e.target.value) || 0)}
                  className={errors.number_of_dependents ? 'error' : ''}
                  placeholder="0"
                  min="0"
                  max="10"
                />
              </div>
              {errors.number_of_dependents && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.number_of_dependents}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="it_software">
                <FaIndustry className="label-icon" />
                Industry Type *
              </label>
              <div className="input-wrapper">
                <select
                  id="it_software"
                  value={loanDetails.it_software}
                  onChange={(e) => handleInputChange('it_software', e.target.value)}
                  className={errors.it_software ? 'error' : ''}
                >
                  <option value="">Select Industry Type</option>
                  <option value="it_software">IT & Software</option>
                  <option value="banking_finance">Banking & Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {errors.it_software && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.it_software}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Current Address</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="street_address">
                <FaHome className="label-icon" />
                Street Address *
              </label>
              <div className="input-wrapper">
                <input
                  id="street_address"
                  type="text"
                  value={loanDetails.street_address}
                  onChange={(e) => handleInputChange('street_address', e.target.value)}
                  className={errors.street_address ? 'error' : ''}
                  placeholder="Enter your complete street address"
                />
              </div>
              {errors.street_address && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.street_address}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="city">
                <FaCity className="label-icon" />
                City *
              </label>
              <div className="input-wrapper">
                <input
                  id="city"
                  type="text"
                  value={loanDetails.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={errors.city ? 'error' : ''}
                  placeholder="Enter city name"
                />
              </div>
              {errors.city && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.city}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="state">
                <FaMapMarkerAlt className="label-icon" />
                State *
              </label>
              <div className="input-wrapper">
                <select
                  id="state"
                  value={loanDetails.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={errors.state ? 'error' : ''}
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              {errors.state && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.state}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="pincode">
                <FaMapPin className="label-icon" />
                Pincode *
              </label>
              <div className="input-wrapper">
                <input
                  id="pincode"
                  type="text"
                  value={loanDetails.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  className={errors.pincode ? 'error' : ''}
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              {errors.pincode && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.pincode}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Permanent Address</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="permanent_street_address">
                <FaHome className="label-icon" />
                Street Address *
              </label>
              <div className="input-wrapper">
                <input
                  id="permanent_street_address"
                  type="text"
                  value={loanDetails.permanent_street_address}
                  onChange={(e) => handleInputChange('permanent_street_address', e.target.value)}
                  className={errors.permanent_street_address ? 'error' : ''}
                  placeholder="Enter your complete permanent address"
                />
              </div>
              {errors.permanent_street_address && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.permanent_street_address}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="permanent_city">
                <FaCity className="label-icon" />
                City *
              </label>
              <div className="input-wrapper">
                <input
                  id="permanent_city"
                  type="text"
                  value={loanDetails.permanent_city}
                  onChange={(e) => handleInputChange('permanent_city', e.target.value)}
                  className={errors.permanent_city ? 'error' : ''}
                  placeholder="Enter city name"
                />
              </div>
              {errors.permanent_city && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.permanent_city}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="permanent_state">
                <FaMapMarkerAlt className="label-icon" />
                State *
              </label>
              <div className="input-wrapper">
                <select
                  id="permanent_state"
                  value={loanDetails.permanent_state}
                  onChange={(e) => handleInputChange('permanent_state', e.target.value)}
                  className={errors.permanent_state ? 'error' : ''}
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              {errors.permanent_state && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.permanent_state}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="permanent_pincode">
                <FaMapPin className="label-icon" />
                Pincode *
              </label>
              <div className="input-wrapper">
                <input
                  id="permanent_pincode"
                  type="text"
                  value={loanDetails.permanent_pincode}
                  onChange={(e) => handleInputChange('permanent_pincode', e.target.value)}
                  className={errors.permanent_pincode ? 'error' : ''}
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              {errors.permanent_pincode && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.permanent_pincode}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Banking Details (Auto-Fetch Statements)</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="account_number">
                <FaCreditCard className="label-icon" />
                Account Number *
              </label>
              <div className="input-wrapper">
                <input
                  id="account_number"
                  type="text"
                  value={loanDetails.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                  className={errors.account_number ? 'error' : ''}
                  placeholder="Enter account number"
                />
              </div>
              {errors.account_number && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.account_number}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="mobile_number">
                <FaPhone className="label-icon" />
                Mobile Number (Linked to Bank) *
              </label>
              <div className="input-wrapper">
                <input
                  id="mobile_number"
                  type="tel"
                  value={loanDetails.mobile_number}
                  onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                  className={errors.mobile_number ? 'error' : ''}
                  placeholder="Enter mobile number"
                  maxLength={10}
                />
              </div>
              {errors.mobile_number && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.mobile_number}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="ifsc_code">
                <FaUniversity className="label-icon" />
                IFSC Code *
              </label>
              <div className="input-wrapper">
                <input
                  id="ifsc_code"
                  type="text"
                  value={loanDetails.ifsc_code}
                  onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
                  className={errors.ifsc_code ? 'error' : ''}
                  placeholder="HDFC0001234"
                  maxLength={11}
                />
              </div>
              {errors.ifsc_code && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.ifsc_code}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="bank_name">
                <FaBuilding className="label-icon" />
                Bank Name *
              </label>
              <div className="input-wrapper">
                <input
                  id="bank_name"
                  type="text"
                  value={loanDetails.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                  className={errors.bank_name ? 'error' : ''}
                  placeholder="Enter bank name"
                />
              </div>
              {errors.bank_name && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.bank_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Employment Details (Auto-Verification)</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="company_name">
                <FaBuilding className="label-icon" />
                Company Name *
              </label>
              <div className="input-wrapper">
                <input
                  id="company_name"
                  type="text"
                  value={loanDetails.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className={errors.company_name ? 'error' : ''}
                  placeholder="Enter company name"
                />
              </div>
              {errors.company_name && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.company_name}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="designation">
                <FaIdBadge className="label-icon" />
                Designation *
              </label>
              <div className="input-wrapper">
                <input
                  id="designation"
                  type="text"
                  value={loanDetails.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  className={errors.designation ? 'error' : ''}
                  placeholder="Enter your designation"
                />
              </div>
              {errors.designation && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.designation}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="employee_name">
                <FaUser className="label-icon" />
                Employee Name *
              </label>
              <div className="input-wrapper">
                <input
                  id="employee_name"
                  type="text"
                  value={loanDetails.employee_name}
                  onChange={(e) => handleInputChange('employee_name', e.target.value)}
                  className={errors.employee_name ? 'error' : ''}
                  placeholder="Enter employee name as per records"
                />
              </div>
              {errors.employee_name && (
                <span className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  {errors.employee_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="info-box">
          <div className="info-icon">
            <FaLink />
          </div>
          <div className="info-content">
            <h4>Auto-Verification Process</h4>
            <p>We'll automatically fetch your bank statements and verify employment details using secure third-party services. No manual document upload required!</p>
          </div>
        </div>

        <button type="submit" className={`submit-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Submitting Application...
            </>
          ) : (
            <>
              Submit Loan Application
              <FaArrowRight className="btn-icon" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoanApplicationForm;
