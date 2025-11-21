// In the ChatPlatform class, fix the registerUser method:

// User registration for chat - FIXED VERSION
registerUser(phoneNumber, userData)
{
  // Check if user already exists
  if (this.users.has(phoneNumber)) {
    return this.users.get(phoneNumber);
  }
  
  const chatUser = {
    phoneNumber,
    username: this.generateUniqueUsername(userData.preferredName),
    displayName: userData.displayName || userData.preferredName,
    avatar: this.generateAvatar(phoneNumber),
    region: this.detectRegion(phoneNumber),
    joinedAt: new Date().toISOString(),
    isOnline: true,
    lastSeen: new Date().toISOString(),
    reputation: 100,
    isBanned: false,
    banReason: null,
    settings: {
      allowPrivateMessages: true,
      showOnlineStatus: true,
      receiveNotifications: true,
      language: 'en'
    }
  };
  
  this.users.set(phoneNumber, chatUser);
  this.saveChatData();
  
  console.log('New chat user registered:', chatUser.username);
  return chatUser;
}


// Comprehensive Chat Platform with AI Moderation
class ChatPlatform {
  constructor() {
    this.channels = new Map();
    this.privateChats = new Map();
    this.users = new Map();
    this.mediaFiles = new Map();
    this.moderatedMessages = new Set();
    this.setupChatSystem();
    this.loadChatData();
  }
  
  setupChatSystem() {
    // Initialize default channels
    this.initializeChannels();
    
    // Setup AI moderation
    this.setupAIModeration();
    
    // Setup real-time updates (simulated)
    this.setupRealTimeUpdates();
    
    // Setup media handling
    this.setupMediaHandling();
    
    // Periodic cleanup
    setInterval(() => this.cleanupOldMessages(), 300000); // 5 minutes
  }
  
  initializeChannels() {
    const defaultChannels = [
    {
      id: 'global',
      name: '🌍 Global Chat',
      type: 'global',
      region: 'worldwide',
      description: 'Chat with users worldwide',
      rules: 'Be respectful. No spam or harassment.',
      userCount: 0,
      messages: []
    },
    {
      id: 'africa',
      name: '🌍 Africa',
      type: 'regional',
      region: 'africa',
      description: 'Chat with users in Africa',
      rules: 'Regional discussions with Africans',
      userCount: 0,
      messages: []
    },
    {
      id: 'europe',
      name: '🌍 Europe',
      type: 'regional',
      region: 'europe',
      description: 'Chat with users in Europe',
      rules: 'Regional discussions with Europeons',
      userCount: 0,
      messages: []
    },
    {
      id: 'asia',
      name: '🌍 Asia',
      type: 'regional',
      region: 'asia',
      description: 'Chat with users in Asia',
      rules: 'Regional discussions with Asians',
      userCount: 0,
      messages: []
    },
    {
      id: 'americas',
      name: '🌍 Americas',
      type: 'regional',
      region: 'americas',
      description: 'Chat with users in Americas',
      rules: 'Regional discussions with Amaricans',
      userCount: 0,
      messages: []
    },
    {
      id: 'trading',
      name: '💰 Trading',
      type: 'topic',
      region: 'global',
      description: 'Discuss trading and markets',
      rules: 'No financial advice. Trade at your own risk.',
      userCount: 0,
      messages: []
    },
    {
      id: 'support',
      name: '🆘 Support',
      type: 'topic',
      region: 'global',
      description: 'Get help and support',
      rules: 'Be helpful and patient',
      userCount: 0,
      messages: []
    }];
    
    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });
  }
  
  // User registration for chat
  registerUser(phoneNumber, userData) {
    const chatUser = {
      phoneNumber,
      username: this.generateUniqueUsername(userData.preferredName),
      displayName: userData.displayName || userData.preferredName,
      avatar: this.generateAvatar(phoneNumber),
      region: this.detectRegion(phoneNumber),
      joinedAt: new Date().toISOString(),
      isOnline: true,
      lastSeen: new Date().toISOString(),
      reputation: 100,
      isBanned: false,
      banReason: null,
      settings: {
        allowPrivateMessages: true,
        showOnlineStatus: true,
        receiveNotifications: true,
        language: 'en'
      }
    };
    
    this.users.set(phoneNumber, chatUser);
    this.saveChatData();
    
    return chatUser;
  }
  
  generateUniqueUsername(preferredName) {
    const baseName = preferredName?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
    let username = baseName;
    let counter = 1;
    
    // Check if username exists
    while (Array.from(this.users.values()).some(user => user.username === username)) {
      username = `${baseName}${counter}`;
      counter++;
    }
    
    return username;
  }
  
  generateAvatar(phoneNumber) {
    // Generate consistent color based on phone number
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    const colorIndex = parseInt(phoneNumber.replace(/\D/g, '')) % colors.length;
    
    return {
      color: colors[colorIndex],
      initial: phoneNumber.charAt(phoneNumber.length - 1).toUpperCase(),
      type: 'generated'
    };
  }
  
  detectRegion(phoneNumber) {
    // Simple region detection based on country code
    const countryCodes = {
      '+1': 'americas',
      '+44': 'europe',
      '+49': 'europe',
      '+33': 'europe',
      '+86': 'asia',
      '+81': 'asia',
      '+91': 'asia',
      '+254': 'africa',
      '+234': 'africa',
      '+27': 'africa'
    };
    
    for (const [code, region] of Object.entries(countryCodes)) {
      if (phoneNumber.startsWith(code)) {
        return region;
      }
    }
    
    return 'global';
  }
  
  // Message sending
  sendChannelMessage(channelId, message, media = null) {
    if (!app.currentUser) {
      throw new Error('Must be logged in to send messages');
    }
    
    const user = this.users.get(app.currentUser.phoneNumber);
    if (!user || user.isBanned) {
      throw new Error('User not registered or banned from chat');
    }
    
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }
    
    // AI Moderation
    const moderationResult = this.moderateMessage(message, user);
    if (!moderationResult.allowed) {
      throw new Error(`Message blocked: ${moderationResult.reason}`);
    }
    
    const chatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      channelId,
      userId: user.phoneNumber,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      message: moderationResult.modifiedMessage || message,
      timestamp: new Date().toISOString(),
      type: 'text',
      status: 'sent',
      moderated: moderationResult.moderated,
      moderationReason: moderationResult.reason,
      reactions: new Map(),
      media: media ? this.processMedia(media) : null
    };
    
    // Add to channel
    channel.messages.push(chatMessage);
    
    // Update user count
    this.updateChannelUserCount(channelId);
    
    // AI Learning from message patterns
    this.learnFromMessage(user, chatMessage);
    
    this.saveChatData();
    
    // Notify subscribers
    this.notifyMessage(chatMessage, channel);
    
    return chatMessage;
  }
  
  // Private messaging
  sendPrivateMessage(toPhoneNumber, message, media = null) {
    if (!app.currentUser) {
      throw new Error('Must be logged in to send messages');
    }
    
    const fromUser = this.users.get(app.currentUser.phoneNumber);
    const toUser = this.users.get(toPhoneNumber);
    
    if (!fromUser || fromUser.isBanned) {
      throw new Error('User not registered or banned from chat');
    }
    
    if (!toUser) {
      throw new Error('Recipient not found in chat system');
    }
    
    if (!toUser.settings.allowPrivateMessages) {
      throw new Error('Recipient does not accept private messages');
    }
    
    // AI Moderation for private messages too
    const moderationResult = this.moderateMessage(message, fromUser);
    if (!moderationResult.allowed) {
      throw new Error(`Message blocked: ${moderationResult.reason}`);
    }
    
    const chatId = this.getPrivateChatId(app.currentUser.phoneNumber, toPhoneNumber);
    
    if (!this.privateChats.has(chatId)) {
      this.privateChats.set(chatId, {
        id: chatId,
        participants: [app.currentUser.phoneNumber, toPhoneNumber],
        messages: [],
        created: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });
    }
    
    const privateChat = this.privateChats.get(chatId);
    
    const privateMessage = {
      id: 'pmsg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      chatId,
      from: app.currentUser.phoneNumber,
      to: toPhoneNumber,
      message: moderationResult.modifiedMessage || message,
      timestamp: new Date().toISOString(),
      type: 'private',
      status: 'sent',
      read: false,
      moderated: moderationResult.moderated,
      media: media ? this.processMedia(media) : null
    };
    
    privateChat.messages.push(privateMessage);
    privateChat.lastActivity = new Date().toISOString();
    
    this.saveChatData();
    
    // Notify recipient if online
    this.notifyPrivateMessage(privateMessage);
    
    return privateMessage;
  }
  
  getPrivateChatId(phone1, phone2) {
    return [phone1, phone2].sort().join('_');
  }
  
  // AI Moderation System
  setupAIModeration() {
    console.log('🤖 AI Chat Moderation System Activated');
    
    // Bad words/phrases database
    this.badWords = [
      'hate', 'kill', 'violence', 'attack', 'scam', 'fraud',
      'cheat', 'steal', 'drugs', 'weapons', 'porn', 'adult'
    ];
    
    // Suspicious patterns
    this.suspiciousPatterns = [
      /(\d{16})/, // Credit card numbers
      /send.*money/i,
      /bank.*account/i,
      /password.*send/i,
      /click.*link/i
    ];
    
    // Learning from user reports
    this.reportedMessages = new Set();
  }
  
  moderateMessage(message, user) {
    const result = {
      allowed: true,
      moderated: false,
      modifiedMessage: null,
      reason: null,
      confidence: 0
    };
    
    const lowerMessage = message.toLowerCase();
    
    // Check for bad words
    const badWordFound = this.badWords.some(word => lowerMessage.includes(word));
    if (badWordFound) {
      result.allowed = false;
      result.reason = 'Contains inappropriate language';
      result.confidence = 0.9;
      return result;
    }
    
    // Check for suspicious patterns
    const suspiciousPattern = this.suspiciousPatterns.some(pattern => pattern.test(message));
    if (suspiciousPattern) {
      result.allowed = false;
      result.reason = 'Suspicious content detected';
      result.confidence = 0.8;
      return result;
    }
    
    // Check message length (anti-spam)
    if (message.length > 500) {
      result.allowed = false;
      result.reason = 'Message too long';
      result.confidence = 0.7;
      return result;
    }
    
    // Check for excessive capital letters
    const capitalRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capitalRatio > 0.7) {
      result.modifiedMessage = message.toLowerCase();
      result.moderated = true;
      result.reason = 'Excessive capitalization removed';
      result.confidence = 0.6;
    }
    
    // Check user reputation
    if (user.reputation < 50) {
      result.allowed = false;
      result.reason = 'Low reputation score';
      result.confidence = 0.8;
      return result;
    }
    
    // Rate limiting (simplified)
    const recentMessages = this.getUserRecentMessages(user.phoneNumber);
    if (recentMessages.length > 10) { // More than 10 messages in last minute
      result.allowed = false;
      result.reason = 'Message rate limit exceeded';
      result.confidence = 0.9;
      return result;
    }
    
    return result;
  }
  
  getUserRecentMessages(phoneNumber) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    let recentMessages = [];
    
    // Check channel messages
    for (const channel of this.channels.values()) {
      const userMessages = channel.messages.filter(msg =>
        msg.userId === phoneNumber &&
        new Date(msg.timestamp).getTime() > oneMinuteAgo
      );
      recentMessages.push(...userMessages);
    }
    
    // Check private messages
    for (const chat of this.privateChats.values()) {
      const userMessages = chat.messages.filter(msg =>
        (msg.from === phoneNumber || msg.to === phoneNumber) &&
        new Date(msg.timestamp).getTime() > oneMinuteAgo
      );
      recentMessages.push(...userMessages);
    }
    
    return recentMessages;
  }
  
  // Media handling
  setupMediaHandling() {
    this.supportedMediaTypes = {
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      video: ['mp4', 'webm', 'ogg'],
      file: ['pdf', 'txt', 'doc', 'docx', 'zip']
    };
    
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }
  
  processMedia(mediaFile) {
    return {
      id: 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: mediaFile.name,
      type: this.getMediaType(mediaFile.name),
      size: mediaFile.size,
      url: URL.createObjectURL(mediaFile),
      uploadedAt: new Date().toISOString(),
      safe: this.scanMediaSafety(mediaFile)
    };
  }
  
  getMediaType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    for (const [type, extensions] of Object.entries(this.supportedMediaTypes)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }
    
    return 'file';
  }
  
  scanMediaSafety(mediaFile) {
    // Basic safety scan (in real implementation, this would use proper scanning)
    const unsafePatterns = [
      'exe', 'bat', 'cmd', 'scr', 'msi' // Executable files
    ];
    
    const filename = mediaFile.name.toLowerCase();
    const isSafe = !unsafePatterns.some(pattern => filename.endsWith('.' + pattern));
    
    if (!isSafe) {
      aiMonitor.logError('UNSAFE_MEDIA', `Potentially unsafe file detected: ${mediaFile.name}`);
    }
    
    return isSafe;
  }
  
  // Real-time updates simulation
  setupRealTimeUpdates() {
    // Simulate receiving messages from other users
    setInterval(() => {
      this.simulateIncomingMessages();
    }, 15000); // Every 15 seconds
    
    // Simulate user activity
    setInterval(() => {
      this.simulateUserActivity();
    }, 30000); // Every 30 seconds
  }
  
  simulateIncomingMessages() {
    if (Math.random() < 0.3) { // 30% chance of simulated message
      const channels = Array.from(this.channels.values());
      const randomChannel = channels[Math.floor(Math.random() * channels.length)];
      
      const simulatedUsers = [
        { username: 'crypto_trader', displayName: 'Crypto Trader' },
        { username: 'blockchain_dev', displayName: 'Blockchain Dev' },
        { username: 'paychain_user', displayName: 'PayChain User' },
        { username: 'tech_enthusiast', displayName: 'Tech Enthusiast' }
      ];
      
      const simulatedUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
      const messages = [
        "Anyone trading PHONE tokens today?",
        "The blockchain technology here is impressive!",
        "Just received my first offline payment - works great!",
        "How secure are the private messages?",
        "Any upcoming features we should know about?",
        "The AI moderation is really effective",
        "Love the regional chat channels!",
        "Has anyone tried the media sharing feature?"
      ];
      
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      const simulatedMessage = {
        id: 'sim_msg_' + Date.now(),
        channelId: randomChannel.id,
        userId: 'simulated_user',
        username: simulatedUser.username,
        displayName: simulatedUser.displayName,
        avatar: { color: '#667eea', initial: 'S', type: 'generated' },
        message: message,
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'received',
        moderated: false,
        isSimulated: true
      };
      
      randomChannel.messages.push(simulatedMessage);
      this.updateChannelUserCount(randomChannel.id);
      
      // Notify UI if user is viewing this channel
      if (app && app.currentChatChannel === randomChannel.id) {
        app.updateChatMessages();
      }
    }
  }
  
  simulateUserActivity() {
    // Update user counts randomly
    this.channels.forEach(channel => {
      const baseCount = Math.floor(Math.random() * 50) + 10;
      const variation = Math.floor(Math.random() * 20) - 10;
      channel.userCount = Math.max(5, baseCount + variation);
    });
  }
  
  // AI Learning system
  learnFromMessage(user, message) {
    // Analyze message patterns for user behavior
    const messageLength = message.message.length;
    const hasLinks = /http/.test(message.message);
    const hasMentions = /@/.test(message.message);
    
    // Update user reputation based on message quality
    if (messageLength < 10) {
      user.reputation = Math.max(0, user.reputation - 1);
    } else if (messageLength > 100 && !hasLinks) {
      user.reputation = Math.min(200, user.reputation + 1);
    }
    
    // Learn new suspicious patterns
    if (message.moderated) {
      this.learnSuspiciousPattern(message.message);
    }
  }
  
  learnSuspiciousPattern(message) {
    // Simple pattern learning - in real implementation would use ML
    console.log('🤖 Learning from moderated message:', message);
  }
  
  // User management
  updateUserStatus(phoneNumber, isOnline) {
    const user = this.users.get(phoneNumber);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date().toISOString();
      this.saveChatData();
    }
  }
  
  updateChannelUserCount(channelId) {
    // In real implementation, this would track actual connected users
    // For simulation, we'll use random numbers
    const channel = this.channels.get(channelId);
    if (channel) {
      const baseCount = Math.floor(Math.random() * 50) + 10;
      channel.userCount = baseCount;
    }
  }
  
  // Message reactions
  addReaction(messageId, channelId, reaction) {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    
    const message = channel.messages.find(msg => msg.id === messageId);
    if (!message) return false;
    
    if (!message.reactions) {
      message.reactions = new Map();
    }
    
    const currentCount = message.reactions.get(reaction) || 0;
    message.reactions.set(reaction, currentCount + 1);
    
    this.saveChatData();
    return true;
  }
  
  // Reporting system
  reportMessage(messageId, reason) {
    this.reportedMessages.add(messageId);
    
    aiMonitor.logError('CHAT_REPORT', `Message reported: ${reason}`, {
      messageId,
      reason,
      timestamp: new Date().toISOString()
    });
    
    // AI analyzes reported message
    this.analyzeReportedMessage(messageId, reason);
    
    return true;
  }
  
  analyzeReportedMessage(messageId, reason) {
    // Find the message across all channels and private chats
    let foundMessage = null;
    let source = null;
    
    // Check channels
    for (const channel of this.channels.values()) {
      const message = channel.messages.find(msg => msg.id === messageId);
      if (message) {
        foundMessage = message;
        source = { type: 'channel', id: channel.id };
        break;
      }
    }
    
    // Check private chats
    if (!foundMessage) {
      for (const chat of this.privateChats.values()) {
        const message = chat.messages.find(msg => msg.id === messageId);
        if (message) {
          foundMessage = message;
          source = { type: 'private', id: chat.id };
          break;
        }
      }
    }
    
    if (foundMessage) {
      // Take action based on severity
      const severity = this.assessReportSeverity(foundMessage, reason);
      
      if (severity === 'high') {
        this.banUser(foundMessage.userId, `Multiple violations: ${reason}`);
      } else if (severity === 'medium') {
        this.warnUser(foundMessage.userId, `Reported content: ${reason}`);
      }
      
      // Learn from this report to improve moderation
      this.improveModerationFromReport(foundMessage, reason);
    }
  }
  
  assessReportSeverity(message, reason) {
    // Simple severity assessment
    const highSeverityReasons = ['harassment', 'threats', 'scam'];
    const mediumSeverityReasons = ['spam', 'inappropriate'];
    
    if (highSeverityReasons.includes(reason)) return 'high';
    if (mediumSeverityReasons.includes(reason)) return 'medium';
    return 'low';
  }
  
  banUser(phoneNumber, reason) {
    const user = this.users.get(phoneNumber);
    if (user) {
      user.isBanned = true;
      user.banReason = reason;
      
      aiMonitor.logError('USER_BANNED', `User banned from chat: ${reason}`, {
        phoneNumber,
        reason,
        timestamp: new Date().toISOString()
      });
      
      notificationSystem.addNotification({
        type: 'MODERATION',
        title: '🚫 User Banned',
        message: `User ${user.username} was banned: ${reason}`,
        priority: 'high',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  warnUser(phoneNumber, reason) {
    const user = this.users.get(phoneNumber);
    if (user) {
      user.reputation = Math.max(0, user.reputation - 20);
      
      notificationSystem.addNotification({
        type: 'MODERATION',
        title: '⚠️ User Warned',
        message: `User ${user.username} received warning: ${reason}`,
        priority: 'medium',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  improveModerationFromReport(message, reason) {
    // Improve AI moderation based on reports
    console.log('🤖 Improving moderation from report:', { message: message.message, reason });
    
    // Add to learning database
    if (reason === 'spam') {
      this.learnSpamPattern(message.message);
    } else if (reason === 'inappropriate') {
      this.badWords.push(...this.extractKeywords(message.message));
    }
  }
  
  learnSpamPattern(message) {
    // Simple spam pattern learning
    const words = message.split(' ');
    if (words.length > 10) {
      this.suspiciousPatterns.push(new RegExp(words.slice(0, 3).join('.*'), 'i'));
    }
  }
  
  extractKeywords(message) {
    return message.toLowerCase().split(' ').filter(word =>
      word.length > 3 && !['the', 'and', 'you', 'your', 'this', 'that'].includes(word)
    );
  }
  
  // Notifications
  notifyMessage(message, channel) {
    // Notify AI system
    aiMonitor.logError('CHAT_MESSAGE', `New message in ${channel.name}`, {
      channel: channel.name,
      user: message.username,
      message: message.message.substring(0, 50) + '...',
      moderated: message.moderated
    });
    
    // Notify UI if channel is active
    if (app && app.currentChatChannel === channel.id) {
      app.updateChatMessages();
    }
    
    // Send push notification to subscribers
    if (channel.id !== app?.currentChatChannel) {
      notificationSystem.addNotification({
        type: 'CHAT_MESSAGE',
        title: `💬 ${channel.name}`,
        message: `${message.username}: ${message.message}`,
        priority: 'low',
        timestamp: new Date().toISOString(),
        data: { channelId: channel.id }
      });
    }
  }
  
  notifyPrivateMessage(message) {
    // Notify recipient if they have notifications enabled
    const recipient = this.users.get(message.to);
    if (recipient && recipient.settings.receiveNotifications) {
      notificationSystem.addNotification({
        type: 'PRIVATE_MESSAGE',
        title: `📩 Message from ${this.users.get(message.from)?.username}`,
        message: message.message,
        priority: 'medium',
        timestamp: new Date().toISOString(),
        data: { from: message.from, chatId: message.chatId }
      });
    }
  }
  
  // Data management
  saveChatData() {
    try {
      const data = {
        channels: Array.from(this.channels.entries()),
        privateChats: Array.from(this.privateChats.entries()),
        users: Array.from(this.users.entries()),
        badWords: this.badWords,
        suspiciousPatterns: this.suspiciousPatterns.map(p => p.toString()),
        reportedMessages: Array.from(this.reportedMessages)
      };
      localStorage.setItem('paychain_chat_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save chat data:', error);
      aiMonitor.logError('CHAT_SAVE_ERROR', error.message);
    }
  }
  
  loadChatData() {
    try {
      const data = localStorage.getItem('paychain_chat_data');
      if (data) {
        const parsed = JSON.parse(data);
        this.channels = new Map(parsed.channels || []);
        this.privateChats = new Map(parsed.privateChats || []);
        this.users = new Map(parsed.users || []);
        this.badWords = parsed.badWords || this.badWords;
        this.suspiciousPatterns = (parsed.suspiciousPatterns || []).map(p => {
          const match = p.match(/\/(.*)\/([a-z]*)/);
          return match ? new RegExp(match[1], match[2]) : new RegExp(p);
        });
        this.reportedMessages = new Set(parsed.reportedMessages || []);
      }
    } catch (error) {
      console.error('Failed to load chat data:', error);
      this.initializeChannels();
    }
  }
  
  cleanupOldMessages() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Clean channel messages
    this.channels.forEach(channel => {
      channel.messages = channel.messages.filter(msg =>
        new Date(msg.timestamp) > oneWeekAgo
      );
    });
    
    // Clean private chats
    this.privateChats.forEach(chat => {
      chat.messages = chat.messages.filter(msg =>
        new Date(msg.timestamp) > oneWeekAgo
      );
    });
    
    this.saveChatData();
  }
  
  // Search and filtering
  searchMessages(query, channelId = null) {
    let results = [];
    const lowerQuery = query.toLowerCase();
    
    if (channelId) {
      const channel = this.channels.get(channelId);
      if (channel) {
        results = channel.messages.filter(msg =>
          msg.message.toLowerCase().includes(lowerQuery)
        );
      }
    } else {
      // Search all channels
      for (const channel of this.channels.values()) {
        const channelResults = channel.messages.filter(msg =>
          msg.message.toLowerCase().includes(lowerQuery)
        );
        results.push(...channelResults.map(msg => ({ ...msg, channel: channel.name })));
      }
    }
    
    return results;
  }
  
  // Get user's relevant channels based on region
  getUserChannels(phoneNumber) {
    const user = this.users.get(phoneNumber);
    if (!user) return Array.from(this.channels.values());
    
    const userRegion = user.region;
    
    return Array.from(this.channels.values()).filter(channel =>
      channel.type === 'global' ||
      channel.type === 'topic' ||
      channel.region === userRegion
    );
  }
  
  // Statistics
  getChatStats() {
    let totalMessages = 0;
    let totalUsers = this.users.size;
    let activeChannels = 0;
    
    this.channels.forEach(channel => {
      totalMessages += channel.messages.length;
      if (channel.userCount > 0) activeChannels++;
    });
    
    return {
      totalMessages,
      totalUsers,
      activeChannels,
      privateChats: this.privateChats.size,
      moderatedMessages: this.moderatedMessages.size
    };
  }
}

// Global chat platform instance
const chatPlatform = new ChatPlatform();
