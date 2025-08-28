# Indian Loan Portal - Frontend Application

A modern, professional loan application system designed specifically for the Indian market. This React-based frontend provides a seamless user experience for loan applications with real-time processing status and comprehensive form validation.

## 🏗️ Architecture

The application is built with a modular component architecture:

### Core Components

- **`App.tsx`** - Main application orchestrator
- **`PreQualificationForm.tsx`** - Stage 1: Pre-qualification form
- **`LoanApplicationForm.tsx`** - Stage 2: Complete loan application form
- **`ProcessingStatus.tsx`** - Real-time processing status display
- **`StatusMessage.tsx`** - Reusable notification component

### Features

#### 🎯 Stage 1: Pre-Qualification
- Personal information collection
- Indian market-specific validations (PAN, mobile, age)
- Real-time form validation
- Professional UI with step indicators

#### 📋 Stage 2: Loan Application
- Comprehensive loan details form
- Address information (current & permanent)
- Employment and income details
- Document requirements specification
- Indian states dropdown
- Industry type selection

#### ⏱️ Processing Status
- Real-time stage progression
- Processing time tracking
- Visual status indicators
- Progress animations
- Completion notifications

#### 🔔 Status Notifications
- Toast-style notifications
- Auto-dismiss functionality
- Multiple message types (success, error, info, warning)
- Responsive design

## 🎨 Design Features

### Indian Market Focus
- Professional color scheme (blues and greens)
- Indian states and cities
- Rupee (₹) currency display
- PAN and Aadhaar validation patterns
- Mobile number validation (10-digit Indian format)

### User Experience
- Step-by-step progression
- Real-time validation feedback
- Loading states and animations
- Responsive design for all devices
- Accessibility features (focus indicators, ARIA labels)

### Professional Styling
- Gradient backgrounds
- Card-based layouts
- Smooth transitions and animations
- Modern typography
- Consistent spacing and colors

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

1. Navigate to the loan-portal directory:
```bash
cd loan-portal
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

### Building for Production

```bash
npm run build
```

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🔧 Configuration

### API Configuration
The application connects to the backend API at `http://localhost:3000/api`. Update the `API_BASE_URL` in `App.tsx` if needed.

### Form Validation
- PAN number: 10-character format (ABCDE1234F)
- Mobile number: 10-digit Indian format
- Age: 18-65 years
- Loan amount: ₹50,000 - ₹1,00,00,000
- Loan tenure: 12-360 months

## 🎯 User Flow

1. **Pre-Qualification** - User enters basic personal information
2. **Eligibility Check** - System validates and approves/rejects
3. **Loan Application** - User provides detailed loan information
4. **Processing** - Real-time status updates through all stages
5. **Completion** - Final result and next steps

## 🛠️ Technical Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **CSS3** - Styling with modern features
- **Fetch API** - HTTP requests
- **Local State Management** - React hooks

## 📁 File Structure

```
src/
├── components/
│   ├── PreQualificationForm.tsx
│   ├── PreQualificationForm.css
│   ├── LoanApplicationForm.tsx
│   ├── LoanApplicationForm.css
│   ├── ProcessingStatus.tsx
│   ├── ProcessingStatus.css
│   ├── StatusMessage.tsx
│   └── StatusMessage.css
├── App.tsx
├── App.css
├── index.tsx
└── index.css
```

## 🔒 Security Features

- Input sanitization
- Form validation
- Secure API communication
- No sensitive data storage in frontend

## 🎨 Customization

### Colors
The application uses a professional color palette:
- Primary: `#1e3c72` (Dark Blue)
- Secondary: `#2a5298` (Medium Blue)
- Success: `#27ae60` (Green)
- Error: `#f44336` (Red)
- Warning: `#ff9800` (Orange)

### Styling
All components use CSS modules for scoped styling. Global styles are in `App.css` and `index.css`.

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error**
   - Ensure backend is running on port 3000
   - Check CORS configuration
   - Verify API endpoints

2. **Form Validation Errors**
   - Check input formats (PAN, mobile, etc.)
   - Ensure all required fields are filled
   - Verify age requirements

3. **Styling Issues**
   - Clear browser cache
   - Check CSS file imports
   - Verify responsive breakpoints

## 📞 Support

For technical support or feature requests, please refer to the main project documentation.

## 📄 License

This project is part of the Indian Loan Origination System (LOS) and follows the same licensing terms.
