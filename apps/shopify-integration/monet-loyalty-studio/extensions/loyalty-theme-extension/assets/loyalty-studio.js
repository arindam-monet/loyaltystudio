// loyalty-studio.js
class LoyaltyStudio {
  constructor() {
    this.apiBase = '/apps/loyalty-studio/api';
    this.init();
  }
  
  init() {
    this.initPointsDisplay();
    this.initRewardsCatalog();
    this.initCheckoutIntegration();
  }
  
  initPointsDisplay() {
    const pointsElements = document.querySelectorAll('[data-loyalty-studio-points]');
    if (pointsElements.length && window.customer) {
      this.fetchPointsBalance().then(balance => {
        pointsElements.forEach(el => {
          el.textContent = balance;
        });
      });
    }
  }
  
  async fetchPointsBalance() {
    try {
      const response = await fetch(`${this.apiBase}/points-balance`);
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Error fetching points balance:', error);
      return 0;
    }
  }
  
  initRewardsCatalog() {
    const catalogElement = document.querySelector('[data-loyalty-studio-rewards-catalog]');
    if (catalogElement && window.customer) {
      this.fetchRewards().then(rewards => {
        this.renderRewardsCatalog(catalogElement, rewards);
      });
    }
  }
  
  async fetchRewards() {
    try {
      const response = await fetch(`${this.apiBase}/rewards`);
      const data = await response.json();
      return data.rewards || [];
    } catch (error) {
      console.error('Error fetching rewards:', error);
      return [];
    }
  }
  
  renderRewardsCatalog(element, rewards) {
    if (rewards.length === 0) {
      element.innerHTML = '<p>No rewards available at this time.</p>';
      return;
    }
    
    let html = '<div class="rewards-grid">';
    
    rewards.forEach(reward => {
      html += `
        <div class="reward-item">
          <h4>${reward.name}</h4>
          <p class="reward-description">${reward.description}</p>
          <p class="reward-points">${reward.pointsCost} Points</p>
          <button class="reward-redeem-button" data-reward-id="${reward.id}">Redeem</button>
        </div>
      `;
    });
    
    html += '</div>';
    element.innerHTML = html;
    
    // Add event listeners to redeem buttons
    element.querySelectorAll('.reward-redeem-button').forEach(button => {
      button.addEventListener('click', e => {
        const rewardId = e.target.getAttribute('data-reward-id');
        this.redeemReward(rewardId);
      });
    });
  }
  
  async redeemReward(rewardId) {
    try {
      const response = await fetch(`${this.apiBase}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Reward redeemed successfully!');
        // Refresh the page to update points balance
        window.location.reload();
      } else {
        alert(data.error || 'Failed to redeem reward. Please try again.');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('An error occurred. Please try again.');
    }
  }
  
  initCheckoutIntegration() {
    const checkoutElement = document.querySelector('[data-loyalty-studio-checkout-points]');
    if (checkoutElement && window.customer) {
      // Get cart data
      fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
          this.renderCheckoutPoints(checkoutElement, cart);
        })
        .catch(error => {
          console.error('Error fetching cart:', error);
        });
    }
  }
  
  renderCheckoutPoints(element, cart) {
    // In a real implementation, this would be calculated by the server
    const pointsPerDollar = 10;
    const pointsToEarn = Math.floor((cart.total_price / 100) * pointsPerDollar);
    
    let html = `
      <p class="points-to-earn">You'll earn <strong>${pointsToEarn} Points</strong> on this purchase!</p>
    `;
    
    element.innerHTML = html;
    
    // Fetch available rewards for redemption
    this.fetchRewards().then(rewards => {
      if (rewards.length > 0) {
        let rewardsHtml = '<div class="available-rewards">';
        rewardsHtml += '<h4>Available Rewards</h4>';
        
        rewards.forEach(reward => {
          rewardsHtml += `
            <div class="checkout-reward-item">
              <span class="reward-name">${reward.name}</span>
              <span class="reward-points">${reward.pointsCost} Points</span>
              <button class="reward-apply-button" data-reward-id="${reward.id}">Apply</button>
            </div>
          `;
        });
        
        rewardsHtml += '</div>';
        element.innerHTML += rewardsHtml;
        
        // Add event listeners to apply buttons
        element.querySelectorAll('.reward-apply-button').forEach(button => {
          button.addEventListener('click', e => {
            const rewardId = e.target.getAttribute('data-reward-id');
            this.applyReward(rewardId);
          });
        });
      }
    });
  }
  
  async applyReward(rewardId) {
    try {
      const response = await fetch(`${this.apiBase}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardId, applyToCart: true }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Reward applied to your cart!');
        // Refresh the page to show updated cart
        window.location.reload();
      } else {
        alert(data.error || 'Failed to apply reward. Please try again.');
      }
    } catch (error) {
      console.error('Error applying reward:', error);
      alert('An error occurred. Please try again.');
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.loyaltyStudio = new LoyaltyStudio();
});
