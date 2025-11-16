// Main Application Logic - FINAL CORRECTED VERSION
class PayChainApp {
  constructor() {
    this.currentUser = null;
    this.currentChatChannel = null;
    this.init();
  }
  
  init() {
    this.checkExistingSession();
    this.setupEventListeners();
    this.updateSecurityStatus();
    this.startPeriodicUpdates();
    this.startChatUpdates();
  }
  
  setupEventListeners() {
    // Enter key support for forms
    document.getElementById('password')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.login();
    });
    
    document.getElementById('regPassword')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.register();
    });
    
    document.getElementById('confirmPassword')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.register();
    });
    
    document.getElementById('txPassword')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMoney();
    });
    
    // Input validation
    document.getElementById('phoneNumber')?.addEventListener('input', this.formatPhoneNumber);
    document.getElementById('regPhone')?.addEventListener('input', this.formatPhoneNumber);
    document.getElementById('recipientPhone')?.addEventListener('input', this.formatPhoneNumber);
    document.getElementById('offlineRecipient')?.addEventListener('input', this.formatPhoneNumber);
    document.getElementById('privateChatPhone')?.addEventListener('input', this.formatPhoneNumber);
    
    // Send amount input for fee display
    document.getElementById('sendAmount')?.addEventListener('input', () => {
      if (document.getElementById('sendSection').classList.contains('active')) {
        this.updateFeeDisplay();
      }
    });
  }
  
  formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      value = '+' + value;
    }
    e.target.value = value;
  }
  
  checkExistingSession() {
    try {
      const session = database.getSession();
      if (session && session.phoneNumber) {
        const user = blockchain.users.get(session.phoneNumber);
        if (user) {
          this.currentUser = user;
          security.startSession(user);
          this.showDashboard();
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }
  
  // Authentication
  async login() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const password = document.getElementById('password').value;
    
    if (!phoneNumber || !password) {
      this.showNotification('Please enter phone number and password', 'error');
      return;
    }
    
    if (!security.validatePhoneNumber(phoneNumber)) {
      this.showNotification('Please enter a valid phone number', 'error');
      return;
    }
    
    try {
      console.log('Attempting login for:', phoneNumber);
      const user = blockchain.authenticateUser(phoneNumber, password);
      this.currentUser = user;
      security.startSession(user);
      
      database.saveSession({
        phoneNumber: user.phoneNumber,
        walletAddress: user.walletAddress,
        loginTime: new Date().toISOString()
      });
      
      this.showDashboard();
      this.showNotification('Login successful!', 'success');
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification(error.message, 'error');
    }
  }
  
  async register() {
    const phoneNumber = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!phoneNumber || !password || !confirmPassword) {
      this.showNotification('Please fill all fields', 'error');
      return;
    }
    
    if (!security.validatePhoneNumber(phoneNumber)) {
      this.showNotification('Please enter a valid phone number', 'error');
      return;
    }
    
    if (!security.validatePassword(password)) {
      this.showNotification('Password must be at least 6 characters', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showNotification('Passwords do not match', 'error');
      return;
    }
    
    try {
      const user = blockchain.registerUser(phoneNumber, password);
      this.currentUser = user;
      security.startSession(user);
      database.saveSession({
        phoneNumber: user.phoneNumber,
        walletAddress: user.walletAddress,
        loginTime: new Date().toISOString()
      });
      
      this.showDashboard();
      this.showNotification('Account created successfully! Welcome to PayChain!', 'success');
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }
  
  logout() {
    security.logout();
    database.clearSession();
    this.currentUser = null;
    this.showLogin();
    this.showNotification('Logged out successfully', 'success');
  }
  
  // Transaction handling
  async sendMoney() {
    if (!this.currentUser) {
      this.showNotification('Please login first', 'error');
      return;
    }
    
    const recipientPhone = document.getElementById('recipientPhone').value.trim();
    const amount = parseFloat(document.getElementById('sendAmount').value);
    const password = document.getElementById('txPassword').value;
    
    if (!recipientPhone || !amount || !password) {
      this.showNotification('Please fill all fields', 'error');
      return;
    }
    
    if (recipientPhone === this.currentUser.phoneNumber) {
      this.showNotification('Cannot send to yourself', 'error');
      return;
    }
    
    if (amount <= 0) {
      this.showNotification('Amount must be positive', 'error');
      return;
    }
    
    // Show fee information
    const fee = security.calculateTransactionFee(amount);
    const total = amount + fee;
    
    if (!confirm(`Send ${amount} PHONE to ${recipientPhone}?\nTransaction fee: ${fee.toFixed(2)} PHONE\nTotal: ${total.toFixed(2)} PHONE`)) {
      return;
    }
    
    try {
      const result = blockchain.sendMoney(
        this.currentUser.phoneNumber,
        recipientPhone,
        amount,
        password
      );
      
      this.hideSend();
      this.updateDashboard();
      this.showNotification(
        `Successfully sent ${amount} PHONE to ${recipientPhone}\nFee: ${fee.toFixed(2)} PHONE sent to ${security.getFeeCollector()}`,
        'success'
      );
      
      // Clear form
      document.getElementById('recipientPhone').value = '';
      document.getElementById('sendAmount').value = '';
      document.getElementById('txPassword').value = '';
      
    } catch (error) {
      console.error('Send money error:', error);
      this.showNotification(error.message, 'error');
    }
  }
  
  addFunds() {
    if (!this.currentUser) {
      this.showNotification('Please login first', 'error');
      return;
    }
    
    const amount = 50; // Demo amount
    try {
      blockchain.addFunds(this.currentUser.phoneNumber, amount);
      this.updateDashboard();
      this.showNotification(
        `Added ${amount} PHONE to your wallet (demo mode)`,
        'success'
      );
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }
  
  // Fee display
  updateFeeDisplay() {
    const amount = parseFloat(document.getElementById('sendAmount').value) || 0;
    const fee = security.calculateTransactionFee(amount);
    const total = amount + fee;
    
    const feeInfo = document.getElementById('feeInfo') || (() => {
      const div = document.createElement('div');
      div.id = 'feeInfo';
      div.style.cssText = 'background: #f0f8ff; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 14px;';
      document.querySelector('#sendSection .form-group').insertBefore(div, document.querySelector('#sendSection .btn'));
      return div;
    })();
    
    if (amount > 0) {
      feeInfo.innerHTML = `💰 Transaction Details:<br>
                                Amount: ${amount.toFixed(2)} PHONE<br>
                                Fee (1%): ${fee.toFixed(2)} PHONE<br>
                                <strong>Total: ${total.toFixed(2)} PHONE</strong><br>
                                <small>Fee goes to: ${security.getFeeCollector()}</small>`;
      feeInfo.style.display = 'block';
    } else {
      feeInfo.style.display = 'none';
    }
  }
  
  // UI Navigation
  showLogin() {
    this.hideAllScreens();
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('phoneNumber').value = '';
    document.getElementById('password').value = '';
  }
  
  showRegister() {
    this.hideAllScreens();
    document.getElementById('registerScreen').classList.add('active');
    document.getElementById('regPhone').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  }
  
  showDashboard() {
    this.hideAllScreens();
    document.getElementById('dashboard').classList.add('active');
    this.updateDashboard();
  }
  
  showSend() {
    this.hideAllSections();
    document.getElementById('sendSection').classList.add('active');
    this.updateFeeDisplay();
  }
  
  showReceive() {
    this.hideAllSections();
    document.getElementById('receiveSection').classList.add('active');
    if (this.currentUser) {
      document.getElementById('userAddress').textContent = this.currentUser.phoneNumber;
    }
  }
  
  showHistory() {
    this.hideAllSections();
    document.getElementById('historySection').classList.add('active');
    this.loadTransactionHistory();
  }
  
  hideSend() {
    document.getElementById('sendSection').classList.remove('active');
    const feeInfo = document.getElementById('feeInfo');
    if (feeInfo) feeInfo.style.display = 'none';
  }
  
  hideReceive() {
    document.getElementById('receiveSection').classList.remove('active');
  }
  
  hideHistory() {
    document.getElementById('historySection').classList.remove('active');
  }
  
  hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
  }
  
  hideAllSections() {
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
  }
  
  // Data updates
  updateDashboard() {
    if (!this.currentUser) return;
    
    try {
      // Refresh user data
      const freshUser = blockchain.users.get(this.currentUser.phoneNumber);
      if (freshUser) {
        this.currentUser.balance = parseFloat(freshUser.balance) || 0;
      }
      
      document.getElementById('userPhone').textContent = this.currentUser.phoneNumber;
      document.getElementById('balanceAmount').textContent = this.currentUser.balance.toFixed(2);
      document.getElementById('userAddress').textContent = this.currentUser.phoneNumber;
      
      this.updateSecurityStatus();
    } catch (error) {
      console.error('Dashboard update error:', error);
    }
  }
  
  loadTransactionHistory() {
    if (!this.currentUser) return;
    
    try {
      const transactions = blockchain.getUserTransactions(this.currentUser.phoneNumber);
      const historyContainer = document.getElementById('transactionHistory');
      
      if (transactions.length === 0) {
        historyContainer.innerHTML = '<div class="transaction-item">No transactions yet</div>';
        return;
      }
      
      historyContainer.innerHTML = transactions.map(transaction => {
        const isSend = transaction.from === this.currentUser.phoneNumber;
        const otherParty = isSend ? transaction.to : transaction.from;
        const amountClass = isSend ? 'negative' : 'positive';
        const typeIcon = transaction.type === 'fee' ? '💰' : (isSend ? '📤' : '📥');
        const typeText = transaction.type === 'fee' ? 'Fee' : (isSend ? 'Sent' : 'Received');
        
        return `
                    <div class="transaction-item ${isSend ? 'send' : 'receive'}">
                        <div class="transaction-info">
                            <div class="transaction-type">${typeIcon} ${typeText}</div>
                            <div class="transaction-party">${otherParty}</div>
                            <div class="transaction-date">${new Date(transaction.timestamp).toLocaleDateString()}</div>
                            ${transaction.type === 'fee' ? '<div class="transaction-fee">Network Fee</div>' : ''}
                        </div>
                        <div class="transaction-amount ${amountClass}">
                            ${isSend ? '-' : '+'}${transaction.amount.toFixed(2)} PHONE
                        </div>
                    </div>
                `;
      }).join('');
    } catch (error) {
      console.error('Load history error:', error);
      document.getElementById('transactionHistory').innerHTML = '<div class="transaction-item">Error loading transactions</div>';
    }
  }
  
  updateSecurityStatus() {
    const sessionStatus = document.getElementById('sessionStatus');
    if (security.isSessionValid()) {
      sessionStatus.innerHTML = '<span class="status good">●</span> Session Active';
    } else {
      sessionStatus.innerHTML = '<span class="status warning">●</span> Session Expired';
    }
  }
  
  
  
  // In the PayChainApp class, add this method for chat:
  
  // Chat Integration - FIXED VERSION
  initializeChat() {
    try {
      if (!this.currentUser) {
        throw new Error('Must be logged in to use chat');
      }
      
      // Register user in chat system if not already
      let chatUser = chatPlatform.users.get(this.currentUser.phoneNumber);
      if (!chatUser) {
        chatUser = chatPlatform.registerUser(this.currentUser.phoneNumber, {
          preferredName: this.currentUser.phoneNumber,
          displayName: `User${this.currentUser.phoneNumber.slice(-4)}`
        });
      }
      
      // Show chat interface
      this.showChatInterface();
      this.showNotification('Chat platform initialized!', 'success');
    } catch (error) {
      console.error('Chat initialization error:', error);
      this.showNotification('Failed to initialize chat: ' + error.message, 'error');
    }
  }
  
  showChatInterface() {
    this.hideAllScreens();
    document.getElementById('chatScreen').classList.add('active');
    
    // Initialize chat UI if not already done
    if (chatUI && typeof chatUI.initializeChat === 'function') {
      chatUI.initializeChat();
    }
    
    this.updateChatStats();
  }
  
  // Add to existing methods:
  showChat() {
    this.initializeChat();
  }
  
  // Also update the startChatUpdates method:
  startChatUpdates() {
    setInterval(() => {
      if (document.getElementById('chatScreen') &&
        document.getElementById('chatScreen').classList.contains('active')) {
        this.updateChatStats();
      }
    }, 10000);
  }
  
  
  
  
  
  // Offline Transactions
  showOfflineOptions() {
    this.hideAllSections();
    document.getElementById('offlineSection').classList.add('active');
  }
  
  hideOffline() {
    document.getElementById('offlineSection').classList.remove('active');
  }
  
  createOfflineTransaction() {
    if (!this.currentUser) {
      this.showNotification('Please login first', 'error');
      return;
    }
    
    const recipientPhone = document.getElementById('offlineRecipient').value.trim();
    const amount = parseFloat(document.getElementById('offlineAmount').value);
    const password = document.getElementById('offlinePassword').value;
    const connectionType = document.getElementById('connectionType').value;
    
    if (!recipientPhone || !amount || !password) {
      this.showNotification('Please fill all fields', 'error');
      return;
    }
    
    if (recipientPhone === this.currentUser.phoneNumber) {
      this.showNotification('Cannot send to yourself', 'error');
      return;
    }
    
    if (amount <= 0) {
      this.showNotification('Amount must be positive', 'error');
      return;
    }
    
    try {
      // Set connection mode if specified
      if (connectionType !== 'auto') {
        offlineManager.setConnectionMode(connectionType);
      }
      
      const transaction = offlineManager.createOfflineTransaction(
        recipientPhone,
        amount,
        password
      );
      
      // Clear form
      document.getElementById('offlineRecipient').value = '';
      document.getElementById('offlineAmount').value = '';
      document.getElementById('offlinePassword').value = '';
      
      this.hideOffline();
      this.showNotification(
        `Offline transaction created! Looking for ${recipientPhone} via ${offlineManager.connectionMode}...`,
        'success'
      );
      
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }
  
  showOfflineDashboard() {
    this.updateOfflineDashboard();
    document.getElementById('offlineDashboard').style.display = 'block';
  }
  
  hideOfflineDashboard() {
    document.getElementById('offlineDashboard').style.display = 'none';
  }
  
  updateOfflineDashboard() {
    if (!offlineManager) return;
    
    const status = offlineManager.getConnectionStatus();
    const history = offlineManager.getOfflineTransactionHistory();
    
    // Update connection status
    document.getElementById('onlineStatus').textContent =
      status.connectionMode.toUpperCase();
    document.getElementById('availablePeers').textContent = status.availablePeers;
    document.getElementById('pendingSent').textContent = history.sent.length;
    document.getElementById('pendingReceived').textContent = history.received.length;
    
    // Update UI connection status
    this.updateConnectionStatusDisplay(status);
    
    // Update offline transactions list
    this.updateOfflineTransactionsList(history);
    
    // Update peers list
    this.updatePeersList();
  }
  
  updateConnectionStatusDisplay(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;
    
    const indicator = statusElement.querySelector('.status-indicator');
    const text = statusElement.querySelector('span:last-child');
    
    // Remove all classes
    indicator.className = 'status-indicator';
    
    // Add appropriate class
    indicator.classList.add(status.connectionMode);
    
    text.textContent = status.connectionMode.toUpperCase() + ' Mode';
  }
  
  updateOfflineTransactionsList(history) {
    const container = document.getElementById('offlineTransactionsList');
    if (!container) return;
    
    const allTransactions = [...history.sent, ...history.received];
    
    if (allTransactions.length === 0) {
      container.innerHTML = '<div class="no-data">No offline transactions</div>';
      return;
    }
    
    container.innerHTML = allTransactions.map(tx => {
      const isSent = tx.from === this.currentUser.phoneNumber;
      const isExpired = new Date(tx.expiresAt) < new Date();
      const statusClass = isExpired ? 'expired' : (tx.status === 'pending_offline' ? 'pending' : '');
      
      return `
                <div class="offline-transaction ${statusClass}">
                    <div class="tx-direction">${isSent ? '📤 Sent' : '📥 Received'}</div>
                    <div class="tx-parties">${isSent ? `To: ${tx.to}` : `From: ${tx.from}`}</div>
                    <div class="tx-amount">Amount: ${tx.amount} PHONE</div>
                    <div class="tx-status">Status: ${tx.status}</div>
                    <div class="tx-expiry">Expires: ${new Date(tx.expiresAt).toLocaleTimeString()}</div>
                </div>
            `;
    }).join('');
  }
  
  updatePeersList() {
    const container = document.getElementById('peersList');
    if (!container) return;
    
    const peers = Array.from(offlineManager.peers.values());
    
    if (peers.length === 0) {
      container.innerHTML = '<div class="no-data">No nearby peers found</div>';
      return;
    }
    
    container.innerHTML = peers.map(peer => `
            <div class="peer-item">
                <div class="peer-info">
                    <div class="peer-name">${peer.name}</div>
                    <div class="peer-phone">${peer.phoneNumber}</div>
                </div>
                <div class="peer-details">
                    <div class="peer-type">${peer.type.toUpperCase()}</div>
                    <div class="peer-strength">
                        ${peer.type === 'bluetooth' ? `Distance: ${peer.distance.toFixed(1)}m` : `Signal: ${peer.signalStrength.toFixed(0)}%`}
                    </div>
                </div>
            </div>
        `).join('');
  }
  
  // Security Dashboard
  showSecurityDashboard() {
    this.updateSecurityDashboard();
    document.getElementById('securityDashboard').style.display = 'block';
  }
  
  hideSecurityDashboard() {
    document.getElementById('securityDashboard').style.display = 'none';
  }
  
  updateSecurityDashboard() {
    if (!enhancedSecurity) return;
    
    const report = enhancedSecurity.getSecurityReport();
    
    document.getElementById('lockedAccounts').textContent = report.lockedAccounts.length;
    document.getElementById('failedAttempts').textContent = report.failedAttempts.length;
    document.getElementById('suspiciousActivities').textContent = report.recentSuspiciousActivities.length;
    
    // Calculate security score (simplified)
    const securityScore = Math.max(0, 100 - (report.lockedAccounts.length * 10) - (report.failedAttempts.length * 2));
    document.getElementById('securityScore').textContent = securityScore + '%';
    
    this.updateSecurityEvents(report.recentSuspiciousActivities);
  }
  
  updateSecurityEvents(events) {
    const container = document.getElementById('securityEvents');
    if (!container) return;
    
    if (events.length === 0) {
      container.innerHTML = '<div class="no-data">No recent security events</div>';
      return;
    }
    
    container.innerHTML = events.map(event => `
            <div class="security-event">
                <div class="event-info">
                    <div class="event-type">${event.type}</div>
                    <div class="event-time">${new Date(event.timestamp).toLocaleString()}</div>
                </div>
                <div class="event-severity ${event.severity}">${event.severity.toUpperCase()}</div>
            </div>
        `).join('');
  }
  
  // AI Dashboard
  showAIDashboard() {
    this.updateAIDashboard();
    document.getElementById('aiDashboard').style.display = 'block';
  }
  
  hideAIDashboard() {
    document.getElementById('aiDashboard').style.display = 'none';
  }
  
  updateAIDashboard() {
    if (!aiMonitor) return;
    
    const report = aiMonitor.getSystemReport();
    
    // Update metrics
    document.getElementById('totalErrors').textContent = aiMonitor.errors.length;
    document.getElementById('totalCorrections').textContent =
      aiMonitor.corrections.filter(c => c.status === 'applied').length;
    document.getElementById('systemUptime').textContent = '100%';
    document.getElementById('activeUsers').textContent = blockchain.users.size;
    
    // Update real-time AI panel
    document.getElementById('aiCorrections').textContent =
      aiMonitor.corrections.filter(c => c.status === 'applied').length;
    document.getElementById('aiHealth').textContent = '100%';
    
    // Update error logs
    this.updateErrorLogs();
    
    // Update correction logs
    this.updateCorrectionLogs();
  }
  
  updateErrorLogs() {
    const container = document.getElementById('errorLogs');
    if (!container) return;
    
    const recentErrors = aiMonitor.errors.slice(-10).reverse();
    
    if (recentErrors.length === 0) {
      container.innerHTML = '<div class="no-data">No recent errors</div>';
      return;
    }
    
    container.innerHTML = recentErrors.map(error => `
            <div class="error-log">
                <strong>${error.type}</strong><br>
                ${error.message}<br>
                <small>${new Date(error.timestamp).toLocaleString()}</small>
            </div>
        `).join('');
  }
  
  updateCorrectionLogs() {
    const container = document.getElementById('correctionLogs');
    if (!container) return;
    
    const recentCorrections = aiMonitor.corrections.slice(-10).reverse();
    
    if (recentCorrections.length === 0) {
      container.innerHTML = '<div class="no-data">No recent corrections</div>';
      return;
    }
    
    container.innerHTML = recentCorrections.map(correction => `
            <div class="correction-log">
                <strong>${correction.type}</strong><br>
                ${correction.message}<br>
                <small>${new Date(correction.timestamp).toLocaleString()} - ${correction.status}</small>
            </div>
        `).join('');
  }
  
  // Connection Management
  switchConnectionMode(mode) {
    if (offlineManager.setConnectionMode(mode)) {
      this.showNotification(`Switched to ${mode.toUpperCase()} mode`, 'success');
      this.updateOfflineDashboard();
    } else {
      this.showNotification('Invalid connection mode', 'error');
    }
  }
  
  // Emergency Functions
  emergencyCleanup() {
    if (confirm('🚨 EMERGENCY CLEANUP\n\nThis will release all reserved balances from stuck offline transactions. Continue?')) {
      const released = offlineManager.emergencyCleanup();
      this.showNotification(`Released ${released.toFixed(2)} PHONE from stuck transactions`, 'success');
      this.updateOfflineDashboard();
      this.updateDashboard();
    }
  }
  
  emergencyUnlockAll() {
    if (confirm('🔓 EMERGENCY UNLOCK\n\nThis will unlock all locked accounts. Continue?')) {
      const unlocked = enhancedSecurity.emergencyUnlockAll();
      this.showNotification(`Unlocked ${unlocked} accounts`, 'success');
      this.updateSecurityDashboard();
    }
  }
  
  runSecurityScan() {
    const results = enhancedSecurity.securityScan();
    this.showNotification(`Security scan completed. Found ${results.issues.length} issues.`, 'success');
    this.updateSecurityDashboard();
  }
  
  // Periodic updates
  startPeriodicUpdates() {
    // Update connection status every 5 seconds
    setInterval(() => {
      if (offlineManager) {
        this.updateConnectionStatusDisplay(offlineManager.getConnectionStatus());
      }
    }, 5000);
    
    // Update offline dashboard if open
    setInterval(() => {
      const offlineDashboard = document.getElementById('offlineDashboard');
      if (offlineDashboard && offlineDashboard.style.display === 'block') {
        this.updateOfflineDashboard();
      }
    }, 3000);
  }
  
  startChatUpdates() {
    setInterval(() => {
      if (document.getElementById('chatScreen').classList.contains('active')) {
        chatUI.updateChatStats();
      }
    }, 10000);
  }
  
  // Notification system
  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    setTimeout(() => {
      notification.classList.remove('success', 'error', 'warning');
    }, 5000);
  }
  
  // Utility functions
  formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
  }
  
  formatPhone(phone) {
    return phone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
}

// Global functions for HTML onclick handlers
function login() { app.login(); }

function register() { app.register(); }

function logout() { app.logout(); }

function showRegister() { app.showRegister(); }

function showLogin() { app.showLogin(); }

function showSend() { app.showSend(); }

function showReceive() { app.showReceive(); }

function showHistory() { app.showHistory(); }

function hideSend() { app.hideSend(); }

function hideReceive() { app.hideReceive(); }

function hideHistory() { app.hideHistory(); }

function sendMoney() { app.sendMoney(); }

function addFunds() { app.addFunds(); }

function showChat() { app.showChat(); }

function showOfflineOptions() { app.showOfflineOptions(); }

function hideOffline() { app.hideOffline(); }

function createOfflineTransaction() { app.createOfflineTransaction(); }

function showOfflineDashboard() { app.showOfflineDashboard(); }

function hideOfflineDashboard() { app.hideOfflineDashboard(); }

function showSecurityDashboard() { app.showSecurityDashboard(); }

function hideSecurityDashboard() { app.hideSecurityDashboard(); }

function showAIDashboard() { app.showAIDashboard(); }

function hideAIDashboard() { app.hideAIDashboard(); }

function switchConnectionMode(mode) { app.switchConnectionMode(mode); }

function emergencyCleanup() { app.emergencyCleanup(); }

function emergencyUnlockAll() { app.emergencyUnlockAll(); }

function runSecurityScan() { app.runSecurityScan(); }

// Initialize app when page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new PayChainApp();
});