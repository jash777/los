# Third-Party API Simulator

This simulator provides mock implementations of external services required by the Loan Origination System.

## Services Provided

### 1. PAN Verification Service
- **Endpoint**: `POST /api/pan/verify`
- **Purpose**: Verify PAN card details
- **Response Time**: ~1 second

### 2. CIBIL Credit Score Service
- **Endpoint**: `POST /api/cibil/credit-score`
- **Purpose**: Fetch credit score and credit history
- **Response Time**: ~2 seconds

### 3. Account Aggregator Service
- **Endpoint**: `POST /api/account-aggregator/bank-statements`
- **Purpose**: Fetch bank statements and transaction history
- **Response Time**: ~1.5 seconds

### 4. Employment Verification Service
- **Endpoint**: `POST /api/employment/verify`
- **Purpose**: Verify employment details
- **Response Time**: ~1.2 seconds

### 5. GST Verification Service
- **Endpoint**: `POST /api/gst/verify`
- **Purpose**: Verify company GST details
- **Response Time**: ~0.8 seconds

### 6. Aadhar Verification Service
- **Endpoint**: `POST /api/aadhar/verify`
- **Purpose**: Verify Aadhar card details
- **Response Time**: ~1 second

## Setup

1. Install dependencies:
```bash
cd third-party-simulator
npm install
```

2. Start the simulator:
```bash
npm start
```

The simulator will run on port 4000 by default.

## Health Check

- **URL**: `GET http://localhost:4000/health`
- **Status**: `GET http://localhost:4000/api/status`

## Integration with LOS

The main LOS application integrates with these services during:
- **Pre-qualification**: PAN and Aadhar verification
- **Application Processing**: Employment and GST verification
- **Underwriting**: CIBIL credit score and bank statements
- **Credit Decision**: Final verification checks

## Mock Data Behavior

- **PAN Verification**: Returns success for valid format PANs
- **CIBIL Score**: Generates scores based on PAN last digit (550-850 range)
- **Bank Statements**: Generates realistic transaction history
- **Employment**: Verifies against predefined company list
- **GST**: Validates format and returns company details
- **Aadhar**: Validates 12-digit format and returns address

## Testing

All services include realistic delays and mock data to simulate real-world API behavior.