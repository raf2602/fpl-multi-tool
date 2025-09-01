// Simple debug script to test FPL league access
// Usage: node debug-league.js <league-id>

const leagueId = process.argv[2];

if (!leagueId) {
  console.log('Usage: node debug-league.js <league-id>');
  console.log('Example: node debug-league.js 314');
  process.exit(1);
}

async function testLeague(id) {
  const url = `https://fantasy.premierleague.com/api/leagues-classic/${id}/standings/?page_standings=1`;
  
  console.log(`Testing league ${id}...`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('❌ League not found');
      } else if (response.status === 403) {
        console.log('❌ League is private');
      } else {
        console.log(`❌ Error: ${response.status}`);
      }
      return;
    }
    
    const data = await response.json();
    
    if (data.league) {
      console.log('✅ League found!');
      console.log(`Name: ${data.league.name}`);
      console.log(`Type: ${data.league.league_type === 'c' || data.league.league_type === 'x' ? 'Classic League' : data.league.league_type === 'h' ? 'Head-to-Head League' : 'Fantasy Draft League'}`);
      console.log(`Privacy: ${data.league.code_privacy === 'p' ? 'Public' : 'Private'}`);
      console.log(`Members: ${data.standings?.results?.length || 0}`);
      console.log(`Max entries: ${data.league.max_entries || 'Unlimited'}`);
    } else {
      console.log('❌ Invalid response format');
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

testLeague(leagueId);
