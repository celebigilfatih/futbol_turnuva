const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/football-tournament', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  console.log('Connected to MongoDB');
  
  try {
    // Get the Match collection
    const Match = db.collection('matches');
    
    // Find all matches
    const matches = await Match.find({}).toArray();
    
    console.log(`Found ${matches.length} matches`);
    
    // Display first few matches with their dates
    matches.slice(0, 5).forEach(match => {
      const date = new Date(match.date);
      console.log(`Match: ${match._id}`);
      console.log(`  Current UTC time: ${match.date}`);
      console.log(`  Current local time: ${date.toLocaleString('tr-TR')}`);
      console.log(`  Current hours (UTC): ${date.getUTCHours()}`);
      console.log(`  Current hours (local): ${date.getHours()}`);
      console.log('---');
    });
    
    // Ask for confirmation to fix
    console.log('\nTo fix the timezone issue, you need to:');
    console.log('1. Delete the current fixture from the UI (Fikstürü Sil button)');
    console.log('2. Regenerate the fixture with the new code (Fikstür Oluştur button)');
    console.log('\nThe new code will correctly handle Turkey timezone (UTC+3)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
});
