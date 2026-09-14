const fs = require('fs');
let code = fs.readFileSync('src/store/useNgoStore.ts', 'utf8');

// Replace delete functions to revert on error
const collections = ['projects', 'campaigns', 'volunteers', 'events', 'news', 'donations', 'messages', 'documents'];

collections.forEach(col => {
  const cap = col.charAt(0).toUpperCase() + col.slice(1, -1) + (col === 'news' ? 's' : (col === 'messages' ? 'e' : ''));
  // Wait, the singulars: 
  // projects -> Project
  // campaigns -> Campaign
  // volunteers -> Volunteer
  // events -> Event
  // news -> News
  // donations -> Donation
  // messages -> Message
  // documents -> Document
});
