/**
 * Start All Services Script
 * Starts both the main LOS server and the third-party simulator
 */

const { spawn } = require('child_process');
const path = require('path');

class ServiceManager {
    constructor() {
        this.processes = [];
    }

    /**
     * Start all services
     */
    async startAll() {
        console.log('🚀 Starting Loan Origination System Services');
        console.log('=' .repeat(60));

        try {
            // Start third-party simulator first
            await this.startThirdPartySimulator();
            
            // Wait a moment for simulator to start
            await this.sleep(2000);
            
            // Start main LOS server
            await this.startMainServer();

            // Setup graceful shutdown
            this.setupGracefulShutdown();

            console.log('\n✅ All services started successfully!');
            console.log('\n📋 Service URLs:');
            console.log('   🏦 Main LOS API: http://localhost:3000/api');
            console.log('   🔧 Third-Party Simulator: http://localhost:4000/api');
            console.log('   📊 Health Checks:');
            console.log('      • LOS Health: http://localhost:3000/api/health');
            console.log('      • Simulator Health: http://localhost:4000/health');
            
            console.log('\n🧪 Quick Test:');
            console.log('   npm run quick-start (in another terminal)');
            
            console.log('\n⏹️  To stop all services: Ctrl+C');

        } catch (error) {
            console.error('\n❌ Failed to start services:', error.message);
            this.stopAll();
        }
    }

    /**
     * Start third-party simulator
     */
    async startThirdPartySimulator() {
        console.log('\n🔧 Starting Third-Party API Simulator...');
        
        return new Promise((resolve, reject) => {
            const simulatorProcess = spawn('node', ['server.js'], {
                cwd: path.join(__dirname, 'third-party-simulator'),
                stdio: ['inherit', 'pipe', 'pipe']
            });

            simulatorProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`[SIMULATOR] ${output.trim()}`);
                
                if (output.includes('Third-Party API Simulator running')) {
                    console.log('   ✅ Third-Party Simulator started on port 4000');
                    resolve();
                }
            });

            simulatorProcess.stderr.on('data', (data) => {
                console.error(`[SIMULATOR ERROR] ${data.toString().trim()}`);
            });

            simulatorProcess.on('error', (error) => {
                console.error('   ❌ Failed to start simulator:', error.message);
                reject(error);
            });

            simulatorProcess.on('exit', (code) => {
                if (code !== 0) {
                    console.log(`   ⚠️  Simulator exited with code ${code}`);
                }
            });

            this.processes.push({
                name: 'Third-Party Simulator',
                process: simulatorProcess,
                port: 4000
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!simulatorProcess.killed) {
                    console.log('   ✅ Third-Party Simulator started (timeout reached)');
                    resolve();
                }
            }, 10000);
        });
    }

    /**
     * Start main LOS server
     */
    async startMainServer() {
        console.log('\n🏦 Starting Main LOS Server...');
        
        return new Promise((resolve, reject) => {
            const serverProcess = spawn('node', ['server.js'], {
                cwd: __dirname,
                stdio: ['inherit', 'pipe', 'pipe'],
                env: { ...process.env, THIRD_PARTY_API_URL: 'http://localhost:4000/api' }
            });

            serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`[LOS] ${output.trim()}`);
                
                if (output.includes('Server running on port') || output.includes('listening on port')) {
                    console.log('   ✅ Main LOS Server started on port 3000');
                    resolve();
                }
            });

            serverProcess.stderr.on('data', (data) => {
                console.error(`[LOS ERROR] ${data.toString().trim()}`);
            });

            serverProcess.on('error', (error) => {
                console.error('   ❌ Failed to start main server:', error.message);
                reject(error);
            });

            serverProcess.on('exit', (code) => {
                if (code !== 0) {
                    console.log(`   ⚠️  Main server exited with code ${code}`);
                }
            });

            this.processes.push({
                name: 'Main LOS Server',
                process: serverProcess,
                port: 3000
            });

            // Timeout after 15 seconds
            setTimeout(() => {
                if (!serverProcess.killed) {
                    console.log('   ✅ Main LOS Server started (timeout reached)');
                    resolve();
                }
            }, 15000);
        });
    }

    /**
     * Setup graceful shutdown
     */
    setupGracefulShutdown() {
        const shutdown = () => {
            console.log('\n\n🛑 Shutting down all services...');
            this.stopAll();
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('SIGQUIT', shutdown);
    }

    /**
     * Stop all processes
     */
    stopAll() {
        console.log('\n⏹️  Stopping all services...');
        
        this.processes.forEach(({ name, process }) => {
            if (process && !process.killed) {
                console.log(`   Stopping ${name}...`);
                process.kill('SIGTERM');
            }
        });

        // Force kill after 5 seconds
        setTimeout(() => {
            this.processes.forEach(({ name, process }) => {
                if (process && !process.killed) {
                    console.log(`   Force killing ${name}...`);
                    process.kill('SIGKILL');
                }
            });
            
            console.log('✅ All services stopped');
            process.exit(0);
        }, 5000);
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run if this file is executed directly
if (require.main === module) {
    const serviceManager = new ServiceManager();
    serviceManager.startAll().catch(console.error);
}

module.exports = ServiceManager;