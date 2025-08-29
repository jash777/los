#!/usr/bin/env node

/**
 * Command-line script for managing underwriting application statuses
 * Usage: node src/scripts/manage-underwriting-status.js [command] [options]
 */

const UnderwritingStatusManager = require('../utils/underwriting-status-manager');
const logger = require('../utils/logger');

class UnderwritingStatusCLI {
    constructor() {
        this.statusManager = new UnderwritingStatusManager();
    }

    async run() {
        const args = process.argv.slice(2);
        const command = args[0];

        try {
            switch (command) {
                case 'stats':
                    await this.showStats();
                    break;
                case 'list':
                    await this.listApplications(args[1], args[2]);
                    break;
                case 'move':
                    await this.moveToUnderwriting(args.slice(1));
                    break;
                case 'update':
                    await this.updateStatus(args.slice(1));
                    break;
                case 'demo':
                    await this.setupDemo();
                    break;
                case 'help':
                default:
                    this.showHelp();
                    break;
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }

    async showStats() {
        console.log('📊 Getting underwriting statistics...\n');
        
        const result = await this.statusManager.getUnderwritingStats();
        
        if (result.success) {
            const stats = result.stats;
            console.log('📈 Underwriting Dashboard Statistics:');
            console.log('=====================================');
            console.log(`Total Applications: ${stats.total_applications}`);
            console.log(`In Underwriting: ${stats.in_underwriting}`);
            console.log('');
            console.log('Status Breakdown:');
            console.log(`  📋 Pending: ${stats.pending}`);
            console.log(`  🔍 Under Review: ${stats.under_review}`);
            console.log(`  ✅ Approved: ${stats.approved}`);
            console.log(`  ❌ Rejected: ${stats.rejected}`);
            console.log(`  ➡️  Moved to Credit Decision: ${stats.moved_to_credit_decision}`);
        } else {
            console.error('❌ Failed to get statistics');
        }
    }

    async listApplications(stage = 'underwriting', status = null) {
        console.log(`📋 Listing applications for stage: ${stage}${status ? `, status: ${status}` : ''}\n`);
        
        const result = await this.statusManager.getApplicationsByStageAndStatus(stage, status);
        
        if (result.success) {
            console.log(`Found ${result.count} applications:\n`);
            
            if (result.applications.length === 0) {
                console.log('No applications found.');
                return;
            }

            console.log('Application Number'.padEnd(25) + 'Status'.padEnd(15) + 'Applicant'.padEnd(20) + 'Amount'.padEnd(12) + 'Created');
            console.log('='.repeat(90));
            
            result.applications.forEach(app => {
                console.log(
                    app.application_number.padEnd(25) +
                    app.status.padEnd(15) +
                    (app.applicant_name || 'N/A').padEnd(20) +
                    `₹${(app.loan_amount || 0).toLocaleString()}`.padEnd(12) +
                    new Date(app.created_at).toLocaleDateString()
                );
            });
        } else {
            console.error('❌ Failed to get applications');
        }
    }

    async moveToUnderwriting(args) {
        if (args.length < 1) {
            console.error('❌ Usage: move <application_numbers...> [status]');
            console.error('   Example: move EL_123 EL_456 pending');
            return;
        }

        const lastArg = args[args.length - 1];
        const validStatuses = ['pending', 'in_progress', 'under_review'];
        
        let applicationNumbers, status;
        
        if (validStatuses.includes(lastArg)) {
            applicationNumbers = args.slice(0, -1);
            status = lastArg;
        } else {
            applicationNumbers = args;
            status = 'pending';
        }

        if (applicationNumbers.length === 0) {
            console.error('❌ No application numbers provided');
            return;
        }

        console.log(`🔄 Moving ${applicationNumbers.length} applications to underwriting with status: ${status}\n`);
        
        const result = await this.statusManager.moveToUnderwriting(applicationNumbers, status);
        
        console.log(`📊 Results: ${result.successful} successful, ${result.failed} failed\n`);
        
        result.results.forEach(r => {
            if (r.success) {
                console.log(`✅ ${r.applicationNumber}: ${r.oldStage}(${r.oldStatus}) → ${r.newStage}(${r.newStatus})`);
            } else {
                console.log(`❌ ${r.applicationNumber}: ${r.error}`);
            }
        });
    }

    async updateStatus(args) {
        if (args.length < 2) {
            console.error('❌ Usage: update <status> <application_numbers...>');
            console.error('   Valid statuses: approved, rejected, under_review, pending');
            console.error('   Example: update approved EL_123 EL_456');
            return;
        }

        const [status, ...applicationNumbers] = args;
        const validStatuses = ['approved', 'rejected', 'under_review', 'pending'];
        
        if (!validStatuses.includes(status)) {
            console.error(`❌ Invalid status: ${status}`);
            console.error(`   Valid statuses: ${validStatuses.join(', ')}`);
            return;
        }

        console.log(`🔄 Updating ${applicationNumbers.length} applications to status: ${status}\n`);
        
        const result = await this.statusManager.updateUnderwritingStatus(
            applicationNumbers, 
            status, 
            { 
                reviewer: 'CLI Script', 
                comments: `Batch update via CLI to ${status}` 
            }
        );
        
        console.log(`📊 Results: ${result.successful} successful, ${result.failed} failed\n`);
        
        result.results.forEach(r => {
            if (r.success) {
                console.log(`✅ ${r.applicationNumber}: ${r.oldStatus} → ${r.newStatus} (${r.newStage})`);
            } else {
                console.log(`❌ ${r.applicationNumber}: ${r.error}`);
            }
        });
    }

    async setupDemo() {
        console.log('🎭 Setting up underwriting demo with realistic distribution...\n');
        
        const result = await this.statusManager.setupUnderwritingDemo();
        
        if (result.success) {
            console.log('✅ Demo setup completed successfully!\n');
            console.log('📊 Results:');
            console.log(`  📋 Moved to underwriting: ${result.results.moved_to_underwriting}`);
            console.log(`  ⏳ Set to pending: ${result.results.set_to_pending}`);
            console.log(`  🔍 Set to under review: ${result.results.set_to_review}`);
            console.log(`  ✅ Set to approved: ${result.results.set_to_approved}`);
            console.log(`  ❌ Set to rejected: ${result.results.set_to_rejected}`);
            
            if (result.results.errors.length > 0) {
                console.log('\n⚠️  Errors:');
                result.results.errors.forEach(error => {
                    console.log(`  ${error}`);
                });
            }
            
            console.log('\n🎯 Your underwriting dashboard now has applications in various statuses!');
        } else {
            console.error(`❌ Demo setup failed: ${result.error}`);
        }
    }

    showHelp() {
        console.log(`
🏦 Underwriting Status Management CLI
====================================

Commands:
  stats                           Show underwriting statistics
  list [stage] [status]          List applications by stage and status
  move <apps...> [status]        Move applications to underwriting
  update <status> <apps...>      Update status for underwriting applications
  demo                           Setup demo with realistic distribution
  help                           Show this help

Examples:
  # Show statistics
  node src/scripts/manage-underwriting-status.js stats

  # List all underwriting applications
  node src/scripts/manage-underwriting-status.js list underwriting

  # List pending applications
  node src/scripts/manage-underwriting-status.js list underwriting pending

  # Move applications to underwriting
  node src/scripts/manage-underwriting-status.js move EL_123 EL_456 pending

  # Approve applications
  node src/scripts/manage-underwriting-status.js update approved EL_123 EL_456

  # Setup demo
  node src/scripts/manage-underwriting-status.js demo

Statuses:
  pending       - Waiting for review
  under_review  - Currently being reviewed
  approved      - Approved (moves to credit_decision)
  rejected      - Rejected (stays in underwriting)

Stages:
  pre_qualification    - Initial stage
  underwriting        - Underwriting review
  credit_decision     - Final credit decision
  quality_check       - Quality verification
  loan_funding        - Loan disbursement
        `);
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new UnderwritingStatusCLI();
    cli.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = UnderwritingStatusCLI;
