import React, { useState, useEffect } from 'react';
import './UnderwritingDashboard.css';

interface ApplicationInfo {
  application_number: string;
  created_at: string;
  current_stage: string;
  status: string;
  loan_amount: number;
  loan_purpose: string;
  preferred_tenure: number;
}

interface PersonalDetails {
  full_name?: string;
  mobile?: string;
  email?: string;
  pan_number?: string;
  date_of_birth?: string;
}

interface EmploymentDetails {
  employment_type?: string;
  company_name?: string;
  designation?: string;
  work_experience_years?: number;
  monthly_salary?: number;
}

interface IncomeDetails {
  monthly_salary?: number;
  other_income?: number;
  total_monthly_income?: number;
  existing_emi?: number;
  net_monthly_income?: number;
}

interface BankingDetails {
  primary_bank?: string;
  account_number?: string;
  account_type?: string;
  average_monthly_balance?: number;
  banking_relationship_years?: number;
}

interface ThirdPartyData {
  cibil_data?: {
    score?: number;
    grade?: string;
    report?: any;
  };
  bank_analysis?: any;
  employment_verification?: any;
  pan_verification?: any;
}

interface RiskAssessment {
  risk_factors: {
    credit_score: number;
    income_stability: number;
    employment_history: number;
    debt_to_income: number;
    banking_behavior: number;
    loan_to_value: number;
    external_factors: number;
  };
  overall_score: number;
  risk_category: string;
  recommendation: string;
}

interface FinancialAnalysis {
  monthly_income: number;
  existing_emi: number;
  proposed_emi: number;
  total_emi: number;
  debt_to_income_ratio: number;
  foir: number;
  disposable_income: number;
  dti_category: string;
  affordability_score: number;
}

interface RuleBasedChecks {
  individual_checks: Record<string, { status: string; message: string }>;
  total_checks: number;
  passed_checks: number;
  compliance_score: number;
  overall_status: string;
}

interface Recommendation {
  recommendation: string;
  confidence: number;
  reasons: string[];
  suggested_conditions: string[];
}

interface UnderwritingData {
  application_info: ApplicationInfo;
  personal_details: PersonalDetails;
  employment_details: EmploymentDetails;
  income_details: IncomeDetails;
  banking_details: BankingDetails;
  third_party_data: ThirdPartyData;
  risk_assessment: RiskAssessment;
  financial_analysis: FinancialAnalysis;
  rule_based_checks: RuleBasedChecks;
  underwriting_score: number;
  recommendation: Recommendation;
  underwriting_history: any[];
  manual_decisions: any[];
}

interface UnderwritingDashboardProps {
  applicationNumber: string;
}

const UnderwritingDashboard: React.FC<UnderwritingDashboardProps> = ({ applicationNumber }) => {
  const [data, setData] = useState<UnderwritingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [decisionModal, setDecisionModal] = useState(false);
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [reviewer] = useState('Current User'); // This would come from auth context
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUnderwritingData();
  }, [applicationNumber]);

  const fetchUnderwritingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/underwriting/${applicationNumber}/dashboard`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch underwriting data');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async () => {
    if (!decision || !reviewer) {
      alert('Please select a decision and ensure reviewer is set');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/underwriting/${applicationNumber}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          comments,
          reviewer,
          conditions: conditions.filter(c => c.trim())
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Decision recorded successfully: ${decision.toUpperCase()}`);
        setDecisionModal(false);
        fetchUnderwritingData(); // Refresh data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const addCondition = () => {
    setConditions([...conditions, '']);
  };

  const updateCondition = (index: number, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = value;
    setConditions(newConditions);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#fd7e14';
      case 'very_high': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'approve': return '#28a745';
      case 'conditional_approve': return '#ffc107';
      case 'reject': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="underwriting-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading underwriting data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="underwriting-dashboard error">
        <div className="error-message">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={fetchUnderwritingData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="underwriting-dashboard error">
        <div className="error-message">
          <h3>No Data Available</h3>
          <p>Unable to load underwriting data for application {applicationNumber}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="underwriting-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Underwriting Review</h1>
          <div className="application-info">
            <h2>{data.application_info.application_number}</h2>
            <div className="info-badges">
              <span className={`status-badge ${data.application_info.status}`}>
                {data.application_info.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className="stage-badge">
                {data.application_info.current_stage.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="header-actions">
          <button
            onClick={() => setDecisionModal(true)}
            className="decision-btn primary"
            disabled={data.application_info.status === 'approved' || data.application_info.status === 'rejected'}
          >
            Make Decision
          </button>
          <button onClick={fetchUnderwritingData} className="refresh-btn">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="key-metrics">
        <div className="metric-card">
          <h3>Loan Amount</h3>
          <div className="metric-value">{formatCurrency(data.application_info.loan_amount)}</div>
        </div>
        <div className="metric-card">
          <h3>Risk Score</h3>
          <div className="metric-value" style={{ color: getRiskColor(data.risk_assessment.risk_category) }}>
            {data.underwriting_score}/100
          </div>
          <div className="metric-label">{data.risk_assessment.risk_category} RISK</div>
        </div>
        <div className="metric-card">
          <h3>DTI Ratio</h3>
          <div className="metric-value">{data.financial_analysis.debt_to_income_ratio}%</div>
          <div className="metric-label">{data.financial_analysis.dti_category}</div>
        </div>
        <div className="metric-card">
          <h3>CIBIL Score</h3>
          <div className="metric-value">
            {data.third_party_data.cibil_data?.score || 'N/A'}
          </div>
          <div className="metric-label">
            {data.third_party_data.cibil_data?.grade || 'Not Available'}
          </div>
        </div>
        <div className="metric-card recommendation">
          <h3>System Recommendation</h3>
          <div 
            className="metric-value" 
            style={{ color: getRecommendationColor(data.recommendation.recommendation) }}
          >
            {data.recommendation.recommendation.replace('_', ' ')}
          </div>
          <div className="metric-label">
            {data.recommendation.confidence}% Confidence
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'application' ? 'active' : ''}
          onClick={() => setActiveTab('application')}
        >
          Application Details
        </button>
        <button 
          className={activeTab === 'risk' ? 'active' : ''}
          onClick={() => setActiveTab('risk')}
        >
          Risk Assessment
        </button>
        <button 
          className={activeTab === 'financial' ? 'active' : ''}
          onClick={() => setActiveTab('financial')}
        >
          Financial Analysis
        </button>
        <button 
          className={activeTab === 'verification' ? 'active' : ''}
          onClick={() => setActiveTab('verification')}
        >
          Verification Data
        </button>
        <button 
          className={activeTab === 'rules' ? 'active' : ''}
          onClick={() => setActiveTab('rules')}
        >
          Rule Checks
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="overview-section">
                <h3>Application Summary</h3>
                <div className="summary-item">
                  <label>Purpose:</label>
                  <span>{data.application_info.loan_purpose}</span>
                </div>
                <div className="summary-item">
                  <label>Tenure:</label>
                  <span>{data.application_info.preferred_tenure} months</span>
                </div>
                <div className="summary-item">
                  <label>Applied On:</label>
                  <span>{formatDate(data.application_info.created_at)}</span>
                </div>
              </div>

              <div className="overview-section">
                <h3>System Recommendation</h3>
                <div className="recommendation-box">
                  <div 
                    className="recommendation-badge"
                    style={{ backgroundColor: getRecommendationColor(data.recommendation.recommendation) }}
                  >
                    {data.recommendation.recommendation.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="recommendation-reasons">
                    <h4>Reasons:</h4>
                    <ul>
                      {data.recommendation.reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  {data.recommendation.suggested_conditions.length > 0 && (
                    <div className="suggested-conditions">
                      <h4>Suggested Conditions:</h4>
                      <ul>
                        {data.recommendation.suggested_conditions.map((condition, index) => (
                          <li key={index}>{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'application' && (
          <div className="application-tab">
            <div className="application-sections">
              <div className="app-section">
                <h3>Personal Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Full Name:</label>
                    <span>{data.personal_details.full_name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Mobile:</label>
                    <span>{data.personal_details.mobile || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{data.personal_details.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>PAN:</label>
                    <span>{data.personal_details.pan_number || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date of Birth:</label>
                    <span>{data.personal_details.date_of_birth || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="app-section">
                <h3>Employment Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Employment Type:</label>
                    <span>{data.employment_details.employment_type || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Company:</label>
                    <span>{data.employment_details.company_name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Designation:</label>
                    <span>{data.employment_details.designation || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Experience:</label>
                    <span>{data.employment_details.work_experience_years || 'N/A'} years</span>
                  </div>
                  <div className="detail-item">
                    <label>Monthly Salary:</label>
                    <span>{data.employment_details.monthly_salary ? formatCurrency(data.employment_details.monthly_salary) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="app-section">
                <h3>Income & Banking Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Total Monthly Income:</label>
                    <span>{data.income_details.total_monthly_income ? formatCurrency(data.income_details.total_monthly_income) : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Existing EMI:</label>
                    <span>{data.income_details.existing_emi ? formatCurrency(data.income_details.existing_emi) : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Primary Bank:</label>
                    <span>{data.banking_details.primary_bank || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Account Type:</label>
                    <span>{data.banking_details.account_type || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Avg Monthly Balance:</label>
                    <span>{data.banking_details.average_monthly_balance ? formatCurrency(data.banking_details.average_monthly_balance) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="risk-tab">
            <div className="risk-overview">
              <div className="risk-score-card">
                <h3>Overall Risk Score</h3>
                <div className="score-display">
                  <div 
                    className="score-circle"
                    style={{ borderColor: getRiskColor(data.risk_assessment.risk_category) }}
                  >
                    <span className="score-value">{data.risk_assessment.overall_score}</span>
                    <span className="score-max">/100</span>
                  </div>
                  <div className="risk-category" style={{ color: getRiskColor(data.risk_assessment.risk_category) }}>
                    {data.risk_assessment.risk_category} RISK
                  </div>
                </div>
              </div>

              <div className="risk-factors">
                <h3>Risk Factor Breakdown</h3>
                <div className="factors-grid">
                  {Object.entries(data.risk_assessment.risk_factors).map(([factor, score]) => (
                    <div key={factor} className="factor-item">
                      <label>{factor.replace('_', ' ').toUpperCase()}:</label>
                      <div className="factor-score">
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ 
                              width: `${score}%`,
                              backgroundColor: score >= 70 ? '#28a745' : score >= 50 ? '#ffc107' : '#dc3545'
                            }}
                          ></div>
                        </div>
                        <span className="score-text">{Math.round(score)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="financial-tab">
            <div className="financial-analysis">
              <div className="financial-section">
                <h3>Income & EMI Analysis</h3>
                <div className="financial-grid">
                  <div className="financial-item">
                    <label>Monthly Income:</label>
                    <span className="amount">{formatCurrency(data.financial_analysis.monthly_income)}</span>
                  </div>
                  <div className="financial-item">
                    <label>Existing EMI:</label>
                    <span className="amount">{formatCurrency(data.financial_analysis.existing_emi)}</span>
                  </div>
                  <div className="financial-item">
                    <label>Proposed EMI:</label>
                    <span className="amount">{formatCurrency(data.financial_analysis.proposed_emi)}</span>
                  </div>
                  <div className="financial-item">
                    <label>Total EMI:</label>
                    <span className="amount highlight">{formatCurrency(data.financial_analysis.total_emi)}</span>
                  </div>
                </div>
              </div>

              <div className="financial-section">
                <h3>Key Ratios</h3>
                <div className="ratios-grid">
                  <div className="ratio-card">
                    <h4>Debt-to-Income Ratio</h4>
                    <div className="ratio-value">
                      <span className="percentage">{data.financial_analysis.debt_to_income_ratio}%</span>
                      <span className={`category ${data.financial_analysis.dti_category.toLowerCase()}`}>
                        {data.financial_analysis.dti_category}
                      </span>
                    </div>
                  </div>
                  <div className="ratio-card">
                    <h4>FOIR</h4>
                    <div className="ratio-value">
                      <span className="percentage">{data.financial_analysis.foir}%</span>
                    </div>
                  </div>
                  <div className="ratio-card">
                    <h4>Disposable Income</h4>
                    <div className="ratio-value">
                      <span className="amount">{formatCurrency(data.financial_analysis.disposable_income)}</span>
                    </div>
                  </div>
                  <div className="ratio-card">
                    <h4>Affordability Score</h4>
                    <div className="ratio-value">
                      <span className="score">{data.financial_analysis.affordability_score}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="verification-tab">
            <div className="verification-sections">
              <div className="verification-section">
                <h3>CIBIL Report</h3>
                {data.third_party_data.cibil_data ? (
                  <div className="cibil-info">
                    <div className="cibil-score">
                      <span className="score-label">Score:</span>
                      <span className="score-value">{data.third_party_data.cibil_data.score}</span>
                      <span className="score-grade">({data.third_party_data.cibil_data.grade})</span>
                    </div>
                    <div className="verification-status success">
                      ✓ CIBIL verification completed
                    </div>
                  </div>
                ) : (
                  <div className="verification-status error">
                    ✗ CIBIL data not available
                  </div>
                )}
              </div>

              <div className="verification-section">
                <h3>Bank Statement Analysis</h3>
                {data.third_party_data.bank_analysis ? (
                  <div className="verification-status success">
                    ✓ Bank analysis completed
                  </div>
                ) : (
                  <div className="verification-status error">
                    ✗ Bank analysis not available
                  </div>
                )}
              </div>

              <div className="verification-section">
                <h3>Employment Verification</h3>
                {data.third_party_data.employment_verification ? (
                  <div className="verification-status success">
                    ✓ Employment verification completed
                  </div>
                ) : (
                  <div className="verification-status error">
                    ✗ Employment verification not available
                  </div>
                )}
              </div>

              <div className="verification-section">
                <h3>PAN Verification</h3>
                {data.third_party_data.pan_verification ? (
                  <div className="verification-status success">
                    ✓ PAN verification completed
                  </div>
                ) : (
                  <div className="verification-status error">
                    ✗ PAN verification not available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="rules-tab">
            <div className="rules-overview">
              <div className="compliance-summary">
                <h3>Compliance Summary</h3>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-value">{data.rule_based_checks.passed_checks}</span>
                    <span className="stat-label">Passed</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{data.rule_based_checks.total_checks - data.rule_based_checks.passed_checks}</span>
                    <span className="stat-label">Failed</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{data.rule_based_checks.compliance_score}%</span>
                    <span className="stat-label">Score</span>
                  </div>
                  <div className="stat-item">
                    <span className={`stat-value ${data.rule_based_checks.overall_status.toLowerCase()}`}>
                      {data.rule_based_checks.overall_status}
                    </span>
                    <span className="stat-label">Status</span>
                  </div>
                </div>
              </div>

              <div className="individual-checks">
                <h3>Individual Rule Checks</h3>
                <div className="checks-grid">
                  {Object.entries(data.rule_based_checks.individual_checks).map(([rule, check]) => (
                    <div key={rule} className={`check-item ${check.status.toLowerCase()}`}>
                      <div className="check-header">
                        <span className="check-name">{rule.replace('_', ' ').toUpperCase()}</span>
                        <span className={`check-status ${check.status.toLowerCase()}`}>
                          {check.status === 'PASS' ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="check-message">{check.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {decisionModal && (
        <div className="modal-overlay">
          <div className="decision-modal">
            <div className="modal-header">
              <h3>Make Underwriting Decision</h3>
              <button 
                className="close-btn" 
                onClick={() => setDecisionModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="decision-options">
                <label>
                  <input 
                    type="radio" 
                    value="approve" 
                    checked={decision === 'approve'}
                    onChange={(e) => setDecision(e.target.value)}
                  />
                  <span className="option-label approve">Approve</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    value="reject" 
                    checked={decision === 'reject'}
                    onChange={(e) => setDecision(e.target.value)}
                  />
                  <span className="option-label reject">Reject</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    value="review" 
                    checked={decision === 'review'}
                    onChange={(e) => setDecision(e.target.value)}
                  />
                  <span className="option-label review">Send for Review</span>
                </label>
              </div>

              <div className="comments-section">
                <label htmlFor="comments">Comments:</label>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add your comments here..."
                  rows={4}
                />
              </div>

              {decision === 'approve' && (
                <div className="conditions-section">
                  <label>Conditions (if any):</label>
                  {conditions.map((condition, index) => (
                    <div key={index} className="condition-input">
                      <input
                        type="text"
                        value={condition}
                        onChange={(e) => updateCondition(index, e.target.value)}
                        placeholder="Enter condition..."
                      />
                      <button 
                        type="button" 
                        onClick={() => removeCondition(index)}
                        className="remove-condition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={addCondition}
                    className="add-condition"
                  >
                    Add Condition
                  </button>
                </div>
              )}

              <div className="reviewer-info">
                <label>Reviewer:</label>
                <span>{reviewer}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setDecisionModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleDecision}
                className="submit-btn"
                disabled={!decision || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnderwritingDashboard;
