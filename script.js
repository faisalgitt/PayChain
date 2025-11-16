// Simple animation for feature cards
document.addEventListener('DOMContentLoaded', function() {
  const featureCards = document.querySelectorAll('.feature-card');
  
  featureCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
  
  // Add animation to the Get Wallet button
  const walletButton = document.querySelector('.pulse');
  setInterval(() => {
    walletButton.classList.toggle('pulse');
    setTimeout(() => {
      walletButton.classList.toggle('pulse');
    }, 4000);
  }, 8000);
  
  // Add click event for demo buttons
  const demoButtons = document.querySelectorAll('.btn-outline');
  demoButtons.forEach(button => {
    button.addEventListener('click', function() {
      alert('This feature is currently in demo mode. The full version will be available soon!');
    });
  });
  
  // Add click event for primary buttons
  const primaryButtons = document.querySelectorAll('.btn-primary');
  primaryButtons.forEach(button => {
    button.addEventListener('click', function() {
      alert('Thank you for your interest! You will be redirected to the download page.');
    });
  });
});