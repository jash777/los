# Rule Engine Module

This module contains specialized rule engines for different phases of the loan origination process. Each rule engine is designed to evaluate specific aspects of loan applications based on business logic and regulatory requirements.

## Architecture

### Base Rule Engine
The `BaseRuleEngine` class provides the foundational functionality for all rule engines:
- Rule management (add, execute, reset)
- Condition evaluation (including string-based conditions)
- Result processing and scoring
- Decision calculation

### Specialized Rule Engines

#### 1. KYC Rule Engine (`kyc-rule-engine.js`)
**Purpose**: Know Your Customer verification and Anti-Money Laundering checks

**Key Rules**:
- Document verification (Aadhar, PAN, Address proof, Income proof)
- Digital verification (Aadhar OTP, PAN validation)
- Age eligibility checks
- Employment type verification
- AML screening (negative database, PEP, sanctions list)
- Document quality assessment

**Usage**:
```javascript
const { KYCRuleEngine } = require('./rule-engine');
const kycEngine = new KYCRuleEngine();
const result = await kycEngine.performKYCVerification(applicationData);
```

#### 2. CIBIL Rule Engine (`cibil-rule-engine.js`)
**Purpose**: Credit Bureau analysis and credit score evaluation

**Key Rules**:
- CIBIL score ranges (300-900)
- Credit history length assessment
- Payment history (DPD - Days Past Due)
- Credit utilization ratio
- Account mix evaluation
- Recent credit inquiries
- Settled/written-off accounts
- Current EMI burden analysis

**Usage**:
```javascript
const { CIBILRuleEngine } = require('./rule-engine');
const cibilEngine = new CIBILRuleEngine();
const result = await cibilEngine.performCreditAnalysis(applicationData);
```

#### 3. Eligibility Rule Engine (`eligibility-rule-engine.js`)
**Purpose**: Basic loan eligibility assessment

**Key Rules**:
- Age criteria (21-65 years)
- Minimum income requirements
- Employment type and stability
- Loan amount limits
- Loan purpose validation
- Geographical restrictions
- Net take-home calculations
- Professional qualifications
- ITR (Income Tax Return) requirements

**Usage**:
```javascript
const { EligibilityRuleEngine } = require('./rule-engine');
const eligibilityEngine = new EligibilityRuleEngine();
const result = await eligibilityEngine.assessEligibility(applicationData);
```

#### 4. Risk Assessment Rule Engine (`risk-assessment-rule-engine.js`)
**Purpose**: Comprehensive risk evaluation and scoring

**Key Rules**:
- Income stability and variance analysis
- Monthly surplus calculations
- Banking behavior (bounce analysis)
- Debt-to-Income (DTI) ratio
- Employment sector risk
- Age-based risk factors
- Loan amount vs income ratio
- Banking relationship duration
- Existing loan performance
- Geographic risk assessment
- Fraud indicators

**Usage**:
```javascript
const { RiskAssessmentRuleEngine } = require('./rule-engine');
const riskEngine = new RiskAssessmentRuleEngine();
const result = await riskEngine.performRiskAssessment(applicationData);
```

## Rule Structure

Each rule follows a consistent structure:

```javascript
{
    id: 'UNIQUE_RULE_ID',
    name: 'Human Readable Rule Name',
    condition: (data) => {
        // Rule logic that returns true/false
        return data.someField >= someValue;
    },
    action: 'approve|reject|conditional|flag',
    severity: 'positive|low|medium|high|critical',
    message: 'Description of what this rule checks',
    flag: 'RULE_FLAG_NAME',
    score: 10 // Positive or negative score impact
}
```

## Decision Logic

### Actions
- **approve**: Rule passed, positive contribution
- **reject**: Rule failed, should reject application
- **conditional**: Rule requires manual review
- **flag**: Rule creates a warning flag

### Severity Levels
- **positive**: Good indicator, adds to score
- **low**: Minor concern, small negative impact
- **medium**: Moderate concern, requires attention
- **high**: Serious concern, significant negative impact
- **critical**: Deal breaker, automatic rejection

### Final Decisions
- **approve**: Application meets all criteria
- **reject**: Application fails critical rules
- **conditional**: Application requires manual review

## Integration with Phases

Rule engines are designed to integrate seamlessly with the existing phase structure:

```javascript
// In phase service files
const { createRuleEngine } = require('../rule-engine');

class PhaseService {
    constructor() {
        this.ruleEngine = createRuleEngine('kyc'); // or 'cibil', 'eligibility', 'risk-assessment'
    }
    
    async processApplication(applicationData) {
        const ruleResult = await this.ruleEngine.executeRules(applicationData);
        
        // Process based on rule result
        if (ruleResult.decision === 'reject') {
            return this.handleRejection(ruleResult);
        } else if (ruleResult.decision === 'conditional') {
            return this.handleConditionalApproval(ruleResult);
        } else {
            return this.handleApproval(ruleResult);
        }
    }
}
```

## Factory Pattern Usage

The module provides a factory function for easy rule engine creation:

```javascript
const { createRuleEngine } = require('./rule-engine');

// Create different rule engines
const kycEngine = createRuleEngine('kyc');
const cibilEngine = createRuleEngine('cibil');
const eligibilityEngine = createRuleEngine('eligibility');
const riskEngine = createRuleEngine('risk-assessment');
```

## Configuration

Rule engines can be configured with custom parameters:

```javascript
const customConfig = {
    minCibilScore: 650,
    maxLoanAmount: 1000000,
    enableStrictMode: true
};

const engine = createRuleEngine('cibil', customConfig);
```

## Error Handling

All rule engines include comprehensive error handling:
- Input validation
- Rule execution errors
- Logging and monitoring
- Graceful degradation

## Testing

Each rule engine should be tested with:
- Valid application data
- Edge cases and boundary conditions
- Invalid/missing data scenarios
- Performance benchmarks

## Extending Rule Engines

To add new rules to existing engines:

```javascript
const engine = new KYCRuleEngine();

engine.addRule({
    id: 'CUSTOM_001',
    name: 'Custom Business Rule',
    condition: (data) => {
        // Custom logic
        return data.customField === 'expectedValue';
    },
    action: 'conditional',
    severity: 'medium',
    message: 'Custom rule validation',
    flag: 'CUSTOM_FLAG',
    score: 5
});
```

## Performance Considerations

- Rule engines are designed for high-throughput processing
- Rules are evaluated in parallel where possible
- Results are cached for repeated evaluations
- Logging is optimized for production environments

## Compliance

All rule engines are designed to comply with:
- RBI (Reserve Bank of India) guidelines
- KYC/AML regulations
- Data protection requirements
- Audit trail maintenance

## Version History

- **v1.0.0**: Initial implementation with KYC, CIBIL, Eligibility, and Risk Assessment engines
- Based on existing business logic from `src/stages` folder
- Integrated with multi-phase loan origination system