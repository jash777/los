ui// Test the scoring calculation logic
const weights = {
    documents: 0.20,
    employment: 0.30,
    financial: 0.30,
    banking: 0.15,
    references: 0.05
};

// Test scores (the ones I set as defaults)
const docScore = 85;
const empScore = 75;
const finScore = 70;
const bankScore = 65;
const refScore = 80;

const weightedScore = 
    (docScore * weights.documents) +
    (empScore * weights.employment) +
    (finScore * weights.financial) +
    (bankScore * weights.banking) +
    (refScore * weights.references);

const overallScore = Math.round(weightedScore);

console.log('Test Scoring Calculation:');
console.log('=======================');
console.log(`Document Score: ${docScore} (weight: ${weights.documents}) = ${docScore * weights.documents}`);
console.log(`Employment Score: ${empScore} (weight: ${weights.employment}) = ${empScore * weights.employment}`);
console.log(`Financial Score: ${finScore} (weight: ${weights.financial}) = ${finScore * weights.financial}`);
console.log(`Banking Score: ${bankScore} (weight: ${weights.banking}) = ${bankScore * weights.banking}`);
console.log(`Reference Score: ${refScore} (weight: ${weights.references}) = ${refScore * weights.references}`);
console.log(`Total Weighted Score: ${weightedScore}`);
console.log(`Overall Score (rounded): ${overallScore}`);

// Test decision logic
let decision = 'rejected';
let reason = 'Application does not meet minimum criteria';

if (overallScore >= 85) {
    decision = 'approved';
    reason = 'Application meets all criteria for approval';
} else if (overallScore >= 70) {
    decision = 'conditional_approval';
    reason = 'Application approved with conditions';
} else if (overallScore >= 55) {
    decision = 'conditional_approval';
    reason = 'Application conditionally approved with significant conditions';
} else {
    decision = 'rejected';
    reason = 'Application does not meet minimum criteria';
}

console.log(`\nDecision Logic Test:`);
console.log(`===================`);
console.log(`Score: ${overallScore}`);
console.log(`Decision: ${decision}`);
console.log(`Reason: ${reason}`);
