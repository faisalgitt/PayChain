// Chat UI Management System - FIXED INITIALIZATION
class ChatUI {
  constructor() {
    this.currentChannel = null;
    this.currentPrivateChat = null;
    this.mediaQueue = [];
    this.initialized = false;
  }
  
  // Initialize chat interface - FIXED VERSION
  initializeChat() {
    if (this.initialized) return;
    
    try {
      this.setupEventListeners();
      this.loadUserChannels();
      this.setupKeyboardShortcuts();
      this.initialized = true;
      console.log('Chat UI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize chat UI:', error);
      throw error;
    }
  }
  
  setupEventListeners() {
    // Setup message input enter key
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
    
    // Setup private chat phone input
    const privateChatInput = document.getElementById('privateChatPhone');
    if (privateChatInput) {
      privateChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.startPrivateChatFromInput();
        }
      });
    }
    
    // Setup search input
    const chatSearch = document.getElementById('chatSearch');
    if (chatSearch) {
      chatSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchMessages();
        }
      });
    }
  }
  
  // Start private chat from input - NEW METHOD
  startPrivateChatFromInput() {
    const phoneInput = document.getElementById('privateChatPhone');
    if (!phoneInput) return;
    
    const phoneNumber = phoneInput.value.trim();
    if (!phoneNumber) {
      alert('Please enter a phone number');
      return;
    }
    
    if (!security.validatePhoneNumber(phoneNumber)) {
      alert('Please enter a valid phone number');
      return;
    }
    
    // Check if recipient exists in blockchain
    if (!blockchain.userExists(phoneNumber)) {
      alert('Recipient not found in system. They need to register first.');
      return;
    }
    
    this.startPrivateChat(phoneNumber);
    phoneInput.value = '';
  }
  
  // Load user channels - FIXED VERSION
  loadUserChannels() {
    if (!app.currentUser) return;
    
    const channels = chatPlatform.getUserChannels(app.currentUser.phoneNumber);
    const channelsList = document.getElementById('channelsList');
    
    if (!channelsList) {
      console.error('Channels list element not found');
      return;
    }
    
    channelsList.innerHTML = channels.map(channel => `
            <div class="channel-item" onclick="chatUI.selectChannel('${channel.id}')">
                <div class="channel-icon">${this.getChannelIcon(channel.type)}</div>
                <div class="channel-info">
                    <div class="channel-name">${channel.name}</div>
                    <div class="channel-meta">
                        <span class="user-count">👥 ${channel.userCount || 0}</span>
                        <span class="channel-desc">${channel.description}</span>
                    </div>
                </div>
                <div class="unread-indicator" id="unread-${channel.id}" style="display: none;"></div>
            </div>
        `).join('');
    
    // Select global channel by default
    if (channels.length > 0 && !this.currentChannel) {
      this.selectChannel('global');
    }
  }
  
  // Select channel - FIXED VERSION
  selectChannel(channelId) {
    this.currentChannel = channelId;
    this.currentPrivateChat = null;
    
    // Update UI
    document.querySelectorAll('.channel-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const selectedItem = document.querySelector(`[onclick="chatUI.selectChannel('${channelId}')"]`);
    if (selectedItem) {
      selectedItem.classList.add('active');
    }
    
    // Load channel messages
    this.loadChannelMessages(channelId);
    
    // Update header
    const channel = chatPlatform.channels.get(channelId);
    if (channel) {
      const titleElement = document.getElementById('currentChatTitle');
      const descElement = document.getElementById('currentChatDescription');
      
      if (titleElement) titleElement.textContent = channel.name;
      if (descElement) descElement.textContent = channel.description;
    }
  }
  
  // Load channel messages - FIXED VERSION
  loadChannelMessages(channelId) {
    const channel = chatPlatform.channels.get(channelId);
    if (!channel) return;
    
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = channel.messages.map(message => this.renderMessage(message)).join('');
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Update app state
    if (app) {
      app.currentChatChannel = channelId;
    }
  }
  
  // Send message - FIXED VERSION
  sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    
    if (!message && this.mediaQueue.length === 0) return;
    
    try {
      let media = null;
      if (this.mediaQueue.length > 0) {
        media = this.mediaQueue[0];
        this.mediaQueue = [];
      }
      
      if (this.currentPrivateChat) {
        chatPlatform.sendPrivateMessage(this.currentPrivateChat, message, media);
      } else if (this.currentChannel) {
        chatPlatform.sendChannelMessage(this.currentChannel, message, media);
      } else {
        throw new Error('No active chat channel');
      }
      
      messageInput.value = '';
      this.clearMediaPreview();
      
    } catch (error) {
      console.error('Send message error:', error);
      if (app && app.showNotification) {
        app.showNotification(error.message, 'error');
      }
    }
  }
  
  // Update chat stats - FIXED VERSION
  updateChatStats() {
    if (!chatPlatform) return;
    
    const stats = chatPlatform.getChatStats();
    const statsElement = document.getElementById('chatStats');
    
    if (statsElement) {
      statsElement.innerHTML = `
                Users: ${stats.totalUsers} | 
                Messages: ${stats.totalMessages} | 
                Channels: ${stats.activeChannels}
            `;
    }
  }
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('chatSearch');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }
  
  // Show search modal
  showSearch() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
      searchModal.style.display = 'block';
      const searchInput = document.getElementById('chatSearch');
      if (searchInput) {
        searchInput.focus();
      }
    }
  }
  
  // Show settings
  showSettings() {
    alert('Chat settings would open here');
  }
  
  // Show stats
  showStats() {
    const stats = chatPlatform.getChatStats();
    alert(`Chat Statistics:\n\nTotal Users: ${stats.totalUsers}\nTotal Messages: ${stats.totalMessages}\nActive Channels: ${stats.activeChannels}\nPrivate Chats: ${stats.privateChats}`);
  }
  
  // The rest of your existing methods remain the same...
  // [Keep all other methods from the previous chat-ui.js file]
}

// Global chat UI instance
const chatUI = new ChatUI();



















// Chat UI Management System
class ChatUI {
  constructor() {
    this.currentChannel = null;
    this.currentPrivateChat = null;
    this.mediaQueue = [];
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // These will be setup when the UI is initialized
  }
  
  // Initialize chat interface
  initializeChat() {
    if (!app.currentUser) {
      throw new Error('Must be logged in to use chat');
    }
    
    // Register user in chat system if not already
    let chatUser = chatPlatform.users.get(app.currentUser.phoneNumber);
    if (!chatUser) {
      chatUser = chatPlatform.registerUser(app.currentUser.phoneNumber, {
        preferredName: app.currentUser.phoneNumber,
        displayName: `User${app.currentUser.phoneNumber.slice(-4)}`
      });
    }
    
    this.showChatInterface();
    this.loadUserChannels();
  }
  
  showChatInterface() {
    document.getElementById('chatScreen').classList.add('active');
    this.updateChatStats();
  }
  
  hideChatInterface() {
    document.getElementById('chatScreen').classList.remove('active');
  }
  
  loadUserChannels() {
    const channels = chatPlatform.getUserChannels(app.currentUser.phoneNumber);
    const channelsList = document.getElementById('channelsList');
    
    channelsList.innerHTML = channels.map(channel => `
            <div class="channel-item" onclick="chatUI.selectChannel('${channel.id}')">
                <div class="channel-icon">${this.getChannelIcon(channel.type)}</div>
                <div class="channel-info">
                    <div class="channel-name">${channel.name}</div>
                    <div class="channel-meta">
                        <span class="user-count">👥 ${channel.userCount}</span>
                        <span class="channel-desc">${channel.description}</span>
                    </div>
                </div>
                <div class="unread-indicator" id="unread-${channel.id}" style="display: none;"></div>
            </div>
        `).join('');
  }
  
  getChannelIcon(type) {
    const icons = {
      'global': '🌍',
      'regional': '📍',
      'topic': '💬'
    };
    return icons[type] || '💬';
  }
  
  selectChannel(channelId) {
    this.currentChannel = channelId;
    this.currentPrivateChat = null;
    
    // Update UI
    document.querySelectorAll('.channel-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[onclick="chatUI.selectChannel('${channelId}')"]`).classList.add('active');
    
    // Load channel messages
    this.loadChannelMessages(channelId);
    
    // Update header
    const channel = chatPlatform.channels.get(channelId);
    document.getElementById('currentChatTitle').textContent = channel.name;
    document.getElementById('currentChatDescription').textContent = channel.description;
  }
  
  loadChannelMessages(channelId) {
    const channel = chatPlatform.channels.get(channelId);
    if (!channel) return;
    
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = channel.messages.map(message => this.renderMessage(message)).join('');
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Update app state
    app.currentChatChannel = channelId;
  }
  
  renderMessage(message) {
    const isOwn = message.userId === app.currentUser.phoneNumber;
    const messageClass = isOwn ? 'message own' : 'message';
    const avatarStyle = `background-color: ${message.avatar.color}`;
    
    return `
            <div class="${messageClass}" id="msg-${message.id}">
                <div class="message-avatar" style="${avatarStyle}">
                    ${message.avatar.initial}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${message.displayName}</span>
                        <span class="message-time">${this.formatTime(message.timestamp)}</span>
                    </div>
                    <div class="message-text">
                        ${this.formatMessageText(message.message)}
                        ${message.media ? this.renderMedia(message.media) : ''}
                        ${message.moderated ? '<span class="moderation-badge">⚠️ Moderated</span>' : ''}
                    </div>
                    ${message.reactions ? this.renderReactions(message.reactions) : ''}
                    <div class="message-actions">
                        ${!isOwn ? `<button onclick="chatUI.addReaction('${message.id}', '👍')">👍</button>` : ''}
                        ${!isOwn ? `<button onclick="chatUI.reportMessage('${message.id}')">🚩 Report</button>` : ''}
                    </div>
                </div>
            </div>
        `;
  }
  
  renderMedia(media) {
    if (media.type === 'image') {
      return `<div class="media-container"><img src="${media.url}" alt="${media.name}" class="chat-media image" onclick="chatUI.viewMedia('${media.id}')"></div>`;
    } else if (media.type === 'video') {
      return `<div class="media-container"><video src="${media.url}" controls class="chat-media video"></video></div>`;
    } else {
      return `<div class="media-container file"><a href="${media.url}" download="${media.name}" class="file-download">📎 ${media.name}</a></div>`;
    }
  }
  
  renderReactions(reactions) {
    const reactionElements = [];
    reactions.forEach((count, reaction) => {
      reactionElements.push(`<span class="reaction">${reaction} ${count}</span>`);
    });
    return `<div class="message-reactions">${reactionElements.join('')}</div>`;
  }
  
  formatMessageText(text) {
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
  }
  
  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Message sending
  sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message && this.mediaQueue.length === 0) return;
    
    try {
      let media = null;
      if (this.mediaQueue.length > 0) {
        media = this.mediaQueue[0]; // Take first media file
        this.mediaQueue = []; // Clear queue after sending
      }
      
      if (this.currentPrivateChat) {
        chatPlatform.sendPrivateMessage(this.currentPrivateChat, message, media);
      } else if (this.currentChannel) {
        chatPlatform.sendChannelMessage(this.currentChannel, message, media);
      }
      
      messageInput.value = '';
      this.clearMediaPreview();
      
    } catch (error) {
      app.showNotification(error.message, 'error');
    }
  }
  
  // Private messaging
  startPrivateChat(phoneNumber) {
    this.currentPrivateChat = phoneNumber;
    this.currentChannel = null;
    
    const user = chatPlatform.users.get(phoneNumber);
    document.getElementById('currentChatTitle').textContent = `Private: ${user.username}`;
    document.getElementById('currentChatDescription').textContent = 'Private conversation';
    
    this.loadPrivateMessages(phoneNumber);
  }
  
  loadPrivateMessages(phoneNumber) {
    const chatId = chatPlatform.getPrivateChatId(app.currentUser.phoneNumber, phoneNumber);
    const privateChat = chatPlatform.privateChats.get(chatId);
    
    const messagesContainer = document.getElementById('chatMessages');
    
    if (!privateChat) {
      messagesContainer.innerHTML = '<div class="no-messages">No messages yet. Start the conversation!</div>';
      return;
    }
    
    messagesContainer.innerHTML = privateChat.messages.map(message => this.renderPrivateMessage(message)).join('');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  renderPrivateMessage(message) {
    const isOwn = message.from === app.currentUser.phoneNumber;
    const messageClass = isOwn ? 'message own' : 'message';
    
    return `
            <div class="${messageClass}" id="msg-${message.id}">
                <div class="message-content">
                    <div class="message-text">
                        ${message.message}
                        ${message.media ? this.renderMedia(message.media) : ''}
                    </div>
                    <div class="message-time">${this.formatTime(message.timestamp)}</div>
                </div>
            </div>
        `;
  }
  
  // Media handling
  handleMediaUpload(event) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (this.validateMediaFile(file)) {
        this.mediaQueue.push(file);
        this.showMediaPreview(file);
      }
    });
    
    event.target.value = ''; // Reset input
  }
  
  validateMediaFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    
    if (file.size > maxSize) {
      app.showNotification('File too large. Maximum size is 10MB.', 'error');
      return false;
    }
    
    if (!supportedTypes.includes(file.type)) {
      app.showNotification('File type not supported.', 'error');
      return false;
    }
    
    return true;
  }
  
  showMediaPreview(file) {
    const previewContainer = document.getElementById('mediaPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      let previewHTML = '';
      
      if (file.type.startsWith('image/')) {
        previewHTML = `<img src="${e.target.result}" alt="Preview" class="media-preview">`;
      } else if (file.type.startsWith('video/')) {
        previewHTML = `<video src="${e.target.result}" controls class="media-preview"></video>`;
      } else {
        previewHTML = `<div class="file-preview">📄 ${file.name}</div>`;
      }
      
      previewHTML += `<button onclick="chatUI.removeMediaPreview()" class="remove-media">×</button>`;
      
      previewContainer.innerHTML = previewHTML;
      previewContainer.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
  }
  
  clearMediaPreview() {
    document.getElementById('mediaPreview').style.display = 'none';
    document.getElementById('mediaPreview').innerHTML = '';
    this.mediaQueue = [];
  }
  
  removeMediaPreview() {
    this.clearMediaPreview();
  }
  
  viewMedia(mediaId) {
    // In a real app, this would open a media viewer
    alert('Media viewer would open here in production');
  }
  
  // Reactions and interactions
  addReaction(messageId, reaction) {
    if (this.currentChannel) {
      chatPlatform.addReaction(messageId, this.currentChannel, reaction);
      this.loadChannelMessages(this.currentChannel);
    }
  }
  
  reportMessage(messageId) {
    const reason = prompt('Please specify the reason for reporting this message:');
    if (reason) {
      chatPlatform.reportMessage(messageId, reason);
      app.showNotification('Message reported. Thank you for helping keep the community safe.', 'success');
    }
  }
  
  // Search functionality
  searchMessages() {
    const query = document.getElementById('chatSearch').value.trim();
    if (!query) return;
    
    const results = chatPlatform.searchMessages(query, this.currentChannel);
    this.displaySearchResults(results);
  }
  
  displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No messages found</div>';
    } else {
      resultsContainer.innerHTML = results.map(result => `
                <div class="search-result" onclick="chatUI.highlightMessage('${result.id}')">
                    <div class="result-sender">${result.username}</div>
                    <div class="result-message">${result.message}</div>
                    <div class="result-context">in ${result.channel || 'private'}</div>
                </div>
            `).join('');
    }
    
    document.getElementById('searchModal').style.display = 'block';
  }
  
  highlightMessage(messageId) {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
      messageElement.style.backgroundColor = '#fff3cd';
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 3000);
    }
    this.closeSearch();
  }
  
  closeSearch() {
    document.getElementById('searchModal').style.display = 'none';
  }
  
  // User management
  showUserProfile(phoneNumber) {
    const user = chatPlatform.users.get(phoneNumber);
    if (!user) return;
    
    const profileHTML = `
            <div class="user-profile">
                <div class="profile-avatar" style="background-color: ${user.avatar.color}">
                    ${user.avatar.initial}
                </div>
                <div class="profile-info">
                    <h3>${user.displayName}</h3>
                    <p>@${user.username}</p>
                    <p>Region: ${user.region}</p>
                    <p>Reputation: ${user.reputation}</p>
                    <p>Joined: ${new Date(user.joinedAt).toLocaleDateString()}</p>
                    <p>Status: ${user.isOnline ? '🟢 Online' : '🔴 Offline'}</p>
                </div>
                <div class="profile-actions">
                    <button onclick="chatUI.startPrivateChat('${phoneNumber}')" class="btn primary">Send Message</button>
                </div>
            </div>
        `;
    
    // Show in modal or dedicated area
    this.showModal('User Profile', profileHTML);
  }
  
  showModal(title, content) {
    const modal = document.getElementById('chatModal');
    const modalContent = document.getElementById('chatModalContent');
    
    modalContent.innerHTML = `
            <div class="modal-header">
                <h2>${title}</h2>
                <button onclick="chatUI.closeModal()" class="close-btn">×</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        `;
    
    modal.style.display = 'block';
  }
  
  closeModal() {
    document.getElementById('chatModal').style.display = 'none';
  }
  
  // Statistics and updates
  updateChatStats() {
    const stats = chatPlatform.getChatStats();
    document.getElementById('chatStats').innerHTML = `
            Users: ${stats.totalUsers} | 
            Messages: ${stats.totalMessages} | 
            Channels: ${stats.activeChannels}
        `;
  }
  
  // Keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('chatSearch').focus();
      }
      
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }
}

// Global chat UI instance
const chatUI = new ChatUI();