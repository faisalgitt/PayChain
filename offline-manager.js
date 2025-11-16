// Offline Transaction Manager with Bluetooth & WiFi Simulation - FINAL CORRECTED
class OfflineManager {
  constructor() {
    this.offlineTransactions = [];
    this.pendingReceipts = [];
    this.isOnline = navigator.onLine;
    this.connectionMode = 'online';
    this.peers = new Map();
    this.setupOfflineDetection();
    this.setupConnectionSimulation();
    this.loadOfflineData();
  }
  
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.connectionMode = 'online';
      this.syncOfflineTransactions();
      if (typeof showNotification === 'function') {
        showNotification('Back Online. Syncing offline transactions...', 'success');
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.connectionMode = 'offline';
      if (typeof showNotification === 'function') {
        showNotification('Offline Mode. Using offline transfer methods.', 'warning');
      }
    });
    
    this.isOnline = navigator.onLine;
    this.connectionMode = this.isOnline ? 'online' : 'offline';
  }
  
  setupConnectionSimulation() {
    setInterval(() => this.discoverPeers(), 10000);
    setInterval(() => this.processPendingTransactions(), 5000);
  }
  
  discoverPeers() {
    if (!this.isOnline) {
      const simulatedPeers = this.getSimulatedPeers();
      simulatedPeers.forEach(peer => {
        if (!this.peers.has(peer.id)) {
          this.peers.set(peer.id, {
            ...peer,
            lastSeen: Date.now(),
            signalStrength: Math.random() * 100
          });
        }
      });
      
      // Remove old peers
      const now = Date.now();
      for (let [id, peer] of this.peers) {
        if (now - peer.lastSeen > 60000) {
          this.peers.delete(id);
        }
      }
    }
  }
  
  getSimulatedPeers() {
    return [
    {
      id: 'peer_bluetooth_001',
      name: 'Samsung Galaxy',
      type: 'bluetooth',
      phoneNumber: '+254712345678',
      publicKey: '0xsimulated_public_key_001',
      distance: Math.random() * 50
    },
    {
      id: 'peer_wifi_002',
      name: 'iPhone 15',
      type: 'wifi',
      phoneNumber: '+254798765432',
      publicKey: '0xsimulated_public_key_002',
      signalStrength: Math.random() * 100
    }];
  }
  
  // Create offline transaction
  createOfflineTransaction(recipientPhone, amount, password) {
    if (!app || !app.currentUser) {
      throw new Error('Must be logged in to create offline transaction');
    }
    
    if (!recipientPhone || !amount || !password) {
      throw new Error('Recipient, amount, and password are required');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // Verify password
    const fromUser = blockchain.users.get(app.currentUser.phoneNumber);
    if (!fromUser || !security.verifyPassword(password, fromUser.passwordHash)) {
      throw new Error('Invalid transaction password');
    }
    
    // Check balance
    const currentBalance = parseFloat(app.currentUser.balance) || 0;
    const transactionFee = security.calculateTransactionFee(amount);
    const totalDeduction = amount + transactionFee;
    
    if (currentBalance < totalDeduction) {
      throw new Error(`Insufficient balance. Need ${totalDeduction.toFixed(2)} PHONE (including ${transactionFee.toFixed(2)} PHONE fee)`);
    }
    
    // Create offline transaction
    const transaction = {
      id: 'OFFLINE_TX_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      from: app.currentUser.phoneNumber,
      to: recipientPhone,
      fromAddress: app.currentUser.walletAddress,
      amount: parseFloat(amount),
      fee: transactionFee,
      total: totalDeduction,
      timestamp: new Date().toISOString(),
      status: 'pending_offline',
      type: 'offline_transfer',
      connectionMode: this.connectionMode,
      signature: this.signOfflineTransaction(app.currentUser.phoneNumber, recipientPhone, amount, password),
      encryption: this.encryptTransactionData(recipientPhone, amount),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Reserve the balance
    this.reserveBalance(amount, transactionFee);
    
    // Add to offline transactions
    this.offlineTransactions.push(transaction);
    this.saveOfflineData();
    
    // Try to send immediately if peers available
    this.broadcastToPeers(transaction);
    
    if (typeof showNotification === 'function') {
      showNotification(`Offline transfer of ${amount} PHONE to ${recipientPhone} created. Looking for recipient...`, 'success');
    }
    
    return transaction;
  }
  
  // Sign offline transaction
  signOfflineTransaction(fromPhone, toPhone, amount, password) {
    const dataToSign = `${fromPhone}-${toPhone}-${amount}-${Date.now()}`;
    return security.hashPassword(dataToSign + password);
  }
  
  // Encrypt transaction data for recipient
  encryptTransactionData(recipientPhone, amount) {
    const data = JSON.stringify({
      amount: amount,
      timestamp: new Date().toISOString(),
      recipient: recipientPhone
    });
    return btoa(data);
  }
  
  // Reserve balance for offline transaction
  reserveBalance(amount, fee) {
    if (!app.currentUser) return;
    
    const currentBalance = parseFloat(app.currentUser.balance) || 0;
    app.currentUser.balance = currentBalance - amount - fee;
    
    // Update UI
    if (app.updateDashboard) {
      app.updateDashboard();
    }
    
    console.log(`Reserved ${amount + fee} PHONE for offline transaction`);
  }
  
  // Release reserved balance (if transaction fails)
  releaseBalance(amount, fee) {
    if (!app.currentUser) return;
    
    const currentBalance = parseFloat(app.currentUser.balance) || 0;
    app.currentUser.balance = currentBalance + amount + fee;
    
    // Update UI
    if (app.updateDashboard) {
      app.updateDashboard();
    }
    
    console.log(`Released ${amount + fee} PHONE reservation`);
  }
  
  // Broadcast transaction to available peers
  broadcastToPeers(transaction) {
    let broadcastCount = 0;
    
    this.peers.forEach(peer => {
      if (this.shouldSendToPeer(peer, transaction)) {
        this.sendToPeer(peer, transaction);
        broadcastCount++;
      }
    });
    
    if (broadcastCount > 0) {
      console.log(`Broadcasted transaction to ${broadcastCount} peers`);
    }
    
    return broadcastCount;
  }
  
  shouldSendToPeer(peer, transaction) {
    if (!app.currentUser) return false;
    if (peer.phoneNumber === app.currentUser.phoneNumber) return false;
    if (peer.phoneNumber === transaction.to) return true;
    if (!this.isOnline && peer.signalStrength > 50) return true;
    return false;
  }
  
  sendToPeer(peer, transaction) {
    console.log(`Sending transaction to ${peer.name} (${peer.phoneNumber}) via ${peer.type}`);
    
    const peerTransaction = {
      ...transaction,
      receivedVia: peer.type,
      receivedAt: new Date().toISOString(),
      peerId: peer.id
    };
    
    // Store in simulated peer storage
    this.storeInPeerStorage(peer.id, peerTransaction);
    
    // Simulate network delay
    setTimeout(() => {
      this.simulatePeerReceipt(peer, transaction);
    }, Math.random() * 3000 + 1000);
  }
  
  storeInPeerStorage(peerId, transaction) {
    const key = `paychain_peer_${peerId}_transactions`;
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(transaction);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to store in peer storage:', error);
    }
  }
  
  simulatePeerReceipt(peer, transaction) {
    if (peer.phoneNumber === transaction.to) {
      this.receiveOfflineTransaction(transaction);
    } else {
      setTimeout(() => {
        this.broadcastToPeers(transaction);
      }, 1000);
    }
  }
  
  // Receive offline transaction
  receiveOfflineTransaction(transaction) {
    if (!app.currentUser || app.currentUser.phoneNumber !== transaction.to) {
      return false;
    }
    
    if (!this.verifyOfflineTransaction(transaction)) {
      console.warn('Invalid offline transaction received');
      return false;
    }
    
    if (this.isTransactionProcessed(transaction.id)) {
      console.log('Transaction already processed');
      return true;
    }
    
    // Add to pending receipts
    this.pendingReceipts.push({
      ...transaction,
      receivedAt: new Date().toISOString(),
      status: 'received_offline'
    });
    
    this.saveOfflineData();
    
    // Notify user
    if (typeof showNotification === 'function') {
      showNotification(`You received ${transaction.amount} PHONE from ${transaction.from} via offline transfer`, 'success');
    }
    
    console.log('Offline transaction received:', transaction);
    return true;
  }
  
  // Verify offline transaction
  verifyOfflineTransaction(transaction) {
    try {
      if (new Date(transaction.expiresAt) < new Date()) {
        console.warn('Transaction expired');
        return false;
      }
      
      if (!transaction.from || !transaction.to || !transaction.amount || !transaction.signature) {
        return false;
      }
      
      if (transaction.amount <= 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return false;
    }
  }
  
  // Check if transaction was already processed
  isTransactionProcessed(transactionId) {
    return this.pendingReceipts.some(tx => tx.id === transactionId) ||
      blockchain.transactions.some(tx => tx.offlineId === transactionId);
  }
  
  // Process pending transactions when online
  async processPendingTransactions() {
    if (!this.isOnline || this.pendingReceipts.length === 0) {
      return;
    }
    
    const processed = [];
    
    for (const receipt of this.pendingReceipts) {
      try {
        await this.processPendingTransaction(receipt);
        processed.push(receipt.id);
      } catch (error) {
        console.error('Failed to process pending transaction:', error);
      }
    }
    
    // Remove processed transactions
    this.pendingReceipts = this.pendingReceipts.filter(
      receipt => !processed.includes(receipt.id)
    );
    
    this.saveOfflineData();
    
    if (processed.length > 0) {
      console.log(`Processed ${processed.length} pending offline transactions`);
    }
  }
  
  async processPendingTransaction(receipt) {
    const transaction = {
      id: security.generateTransactionId(),
      offlineId: receipt.id,
      from: receipt.from,
      to: receipt.to,
      fromAddress: receipt.fromAddress,
      toAddress: app.currentUser.walletAddress,
      amount: receipt.amount,
      fee: receipt.fee,
      total: receipt.total,
      timestamp: receipt.timestamp,
      status: 'confirmed',
      type: 'transfer',
      offline: true,
      connectionMode: receipt.connectionMode,
      confirmedAt: new Date().toISOString()
    };
    
    // Add to blockchain
    blockchain.transactions.push(transaction);
    
    // Update recipient balance
    const recipient = blockchain.users.get(receipt.to);
    if (recipient) {
      recipient.balance = parseFloat(recipient.balance || 0) + receipt.amount;
      if (!recipient.transactions) recipient.transactions = [];
      recipient.transactions.push(transaction.id);
    }
    
    // Update fee collector
    const feeCollector = blockchain.users.get(security.getFeeCollector());
    if (feeCollector) {
      feeCollector.balance = parseFloat(feeCollector.balance || 0) + receipt.fee;
    }
    
    blockchain.saveToStorage();
    
    if (typeof showNotification === 'function') {
      showNotification(`Offline transfer of ${receipt.amount} PHONE from ${receipt.from} confirmed`, 'success');
    }
    
    // Update UI if user is viewing dashboard
    if (app.currentUser && app.currentUser.phoneNumber === receipt.to && app.updateDashboard) {
      app.updateDashboard();
    }
    
    return transaction;
  }
  
  // Sync offline transactions when coming online
  async syncOfflineTransactions() {
    if (!this.isOnline) return;
    await this.processPendingTransactions();
    this.cleanupExpiredTransactions();
    this.connectionMode = 'online';
  }
  
  // Cleanup expired transactions
  cleanupExpiredTransactions() {
    const now = new Date();
    let releasedCount = 0;
    
    this.offlineTransactions = this.offlineTransactions.filter(transaction => {
      if (new Date(transaction.expiresAt) < now) {
        this.releaseBalance(transaction.amount, transaction.fee);
        releasedCount++;
        return false;
      }
      return true;
    });
    
    if (releasedCount > 0) {
      this.saveOfflineData();
      console.log(`Cleaned up ${releasedCount} expired offline transactions`);
    }
  }
  
  // Get connection status
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      connectionMode: this.connectionMode,
      availablePeers: this.peers.size,
      pendingTransactions: this.offlineTransactions.length,
      pendingReceipts: this.pendingReceipts.length,
      bluetoothAvailable: true,
      wifiDirectAvailable: true
    };
  }
  
  // Switch connection mode (for testing)
  setConnectionMode(mode) {
    const validModes = ['online', 'bluetooth', 'wifi', 'offline'];
    if (validModes.includes(mode)) {
      this.connectionMode = mode;
      return true;
    }
    return false;
  }
  
  // Save offline data
  saveOfflineData() {
    try {
      const data = {
        offlineTransactions: this.offlineTransactions,
        pendingReceipts: this.pendingReceipts,
        peers: Array.from(this.peers.entries())
      };
      localStorage.setItem('paychain_offline_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }
  
  // Load offline data
  loadOfflineData() {
    try {
      const data = localStorage.getItem('paychain_offline_data');
      if (data) {
        const parsed = JSON.parse(data);
        this.offlineTransactions = parsed.offlineTransactions || [];
        this.pendingReceipts = parsed.pendingReceipts || [];
        this.peers = new Map(parsed.peers || []);
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
      this.offlineTransactions = [];
      this.pendingReceipts = [];
      this.peers = new Map();
    }
  }
  
  // Get offline transaction history
  getOfflineTransactionHistory() {
    const currentUserPhone = app.currentUser ? app.currentUser.phoneNumber : null;
    return {
      sent: this.offlineTransactions.filter(tx => tx.from === currentUserPhone),
      received: this.pendingReceipts.filter(tx => tx.to === currentUserPhone),
      connectionStatus: this.getConnectionStatus()
    };
  }
  
  // Emergency cleanup
  emergencyCleanup() {
    const currentUser = app.currentUser?.phoneNumber;
    let totalReleased = 0;
    
    this.offlineTransactions = this.offlineTransactions.filter(transaction => {
      if (transaction.from === currentUser) {
        this.releaseBalance(transaction.amount, transaction.fee);
        totalReleased += transaction.amount + transaction.fee;
        return false;
      }
      return true;
    });
    
    this.saveOfflineData();
    return totalReleased;
  }
}

// Global offline manager instance
const offlineManager = new OfflineManager();