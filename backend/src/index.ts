import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import teamRoutes from './routes/team';
import tournamentRoutes from './routes/tournament';
import matchRoutes from './routes/match';
import playerRoutes from './routes/player';
import authRoutes from './routes/auth';
import crossoverFinalsRoutes from './routes/crossoverFinals';

// Routes will be imported here
// import matchRoutes from './routes/match';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/football-tournament';

console.log('Connecting to MongoDB at:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
.then(() => {
  console.log('Connected to MongoDB successfully');
  console.log('Connection state:', mongoose.connection.readyState);
  console.log('Database name:', mongoose.connection.name);
})
.catch((error) => {
  console.error('MongoDB connection error:', {
    message: error.message,
    code: error.code,
    name: error.name,
    stack: error.stack
  });
  process.exit(1); // Eğer veritabanına bağlanamazsak uygulamayı sonlandır
});

// MongoDB bağlantı durumu değişikliklerini dinle
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/crossover-finals', crossoverFinalsRoutes);

// Routes will be configured here
// app.use('/api/matches', matchRoutes);

// Debug route to list all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes: string[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods);
          routes.push(`${methods} ${middleware.regexp.toString()} ${path}`);
        }
      });
    }
  });
  res.json({ routes });
});

// MongoDB connection test endpoint
app.get('/api/debug/db', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const dbName = mongoose.connection.name;
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      connectionState: state,
      databaseName: dbName,
      collections: collections.map(c => c.name),
      models: Object.keys(mongoose.models)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database connection error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a temporary endpoint to seed teams
app.get('/api/seed-teams', async (req, res) => {
  try {
    // Import the seed data
    const teams = [
  {
    name: "Galatasaray",
    players: [
      { name: "Fernando Muslera", number: 1, position: "Kaleci" },
      { name: "Sacha Boey", number: 2, position: "Defans" },
      { name: "Abdülkerim Bardakcı", number: 3, position: "Defans" },
      { name: "Victor Nelsson", number: 4, position: "Defans" },
      { name: "Angeliño", number: 5, position: "Defans" },
      { name: "Lucas Torreira", number: 6, position: "Orta Saha" },
      { name: "Kerem Aktürkoğlu", number: 7, position: "Orta Saha" },
      { name: "Dries Mertens", number: 8, position: "Orta Saha" },
      { name: "Mauro Icardi", number: 9, position: "Forvet" },
      { name: "Hakim Ziyech", number: 10, position: "Orta Saha" },
      { name: "Wilfried Zaha", number: 11, position: "Forvet" },
      { name: "Barış Alper Yılmaz", number: 12, position: "Orta Saha" },
      { name: "Tanguy Ndombele", number: 13, position: "Orta Saha" },
      { name: "Sergio Oliveira", number: 14, position: "Orta Saha" },
      { name: "Davinson Sanchez", number: 15, position: "Defans" },
      { name: "Günay Güvenç", number: 16, position: "Kaleci" },
      { name: "Kaan Ayhan", number: 17, position: "Defans" },
      { name: "Halil Dervişoğlu", number: 18, position: "Forvet" }
    ]
  },
  {
    name: "Fenerbahçe",
    players: [
      { name: "Dominik Livakovic", number: 1, position: "Kaleci" },
      { name: "Bright Osayi-Samuel", number: 2, position: "Defans" },
      { name: "Alexander Djiku", number: 3, position: "Defans" },
      { name: "Rodrigo Becao", number: 4, position: "Defans" },
      { name: "Ferdi Kadıoğlu", number: 5, position: "Defans" },
      { name: "İsmail Yüksek", number: 6, position: "Orta Saha" },
      { name: "İrfan Can Kahveci", number: 7, position: "Orta Saha" },
      { name: "Sebastian Szymanski", number: 8, position: "Orta Saha" },
      { name: "Edin Dzeko", number: 9, position: "Forvet" },
      { name: "Dusan Tadic", number: 10, position: "Orta Saha" },
      { name: "Ryan Kent", number: 11, position: "Orta Saha" },
      { name: "Fred", number: 12, position: "Orta Saha" },
      { name: "Mert Hakan Yandaş", number: 13, position: "Orta Saha" },
      { name: "Michy Batshuayi", number: 14, position: "Forvet" },
      { name: "Serdar Aziz", number: 15, position: "Defans" },
      { name: "İrfan Can Eğribayat", number: 16, position: "Kaleci" },
      { name: "Jayden Oosterwolde", number: 17, position: "Defans" },
      { name: "Joshua King", number: 18, position: "Forvet" }
    ]
  },
  {
    name: "Beşiktaş",
    players: [
      { name: "Mert Günok", number: 1, position: "Kaleci" },
      { name: "Onur Bulut", number: 2, position: "Defans" },
      { name: "Omar Colley", number: 3, position: "Defans" },
      { name: "Daniel Amartey", number: 4, position: "Defans" },
      { name: "Arthur Masuaku", number: 5, position: "Defans" },
      { name: "Salih Uçan", number: 6, position: "Orta Saha" },
      { name: "Gedson Fernandes", number: 7, position: "Orta Saha" },
      { name: "Alex Oxlade-Chamberlain", number: 8, position: "Orta Saha" },
      { name: "Vincent Aboubakar", number: 9, position: "Forvet" },
      { name: "Rachid Ghezzal", number: 10, position: "Orta Saha" },
      { name: "Milot Rashica", number: 11, position: "Orta Saha" },
      { name: "Cenk Tosun", number: 12, position: "Forvet" },
      { name: "Necip Uysal", number: 13, position: "Orta Saha" },
      { name: "Jean Onana", number: 14, position: "Orta Saha" },
      { name: "Tayfur Bingöl", number: 15, position: "Defans" },
      { name: "Ersin Destanoğlu", number: 16, position: "Kaleci" },
      { name: "Eric Bailly", number: 17, position: "Defans" },
      { name: "Jackson Muleka", number: 18, position: "Forvet" }
    ]
  },
  {
    name: "Trabzonspor",
    players: [
      { name: "Uğurcan Çakır", number: 1, position: "Kaleci" },
      { name: "Larsen", number: 2, position: "Defans" },
      { name: "Marc Bartra", number: 3, position: "Defans" },
      { name: "Stefano Denswil", number: 4, position: "Defans" },
      { name: "Eren Elmalı", number: 5, position: "Defans" },
      { name: "Berat Özdemir", number: 6, position: "Orta Saha" },
      { name: "Bakasetas", number: 7, position: "Orta Saha" },
      { name: "Abdülkadir Ömür", number: 8, position: "Orta Saha" },
      { name: "Paul Onuachu", number: 9, position: "Forvet" },
      { name: "Nicolas Pepe", number: 10, position: "Orta Saha" },
      { name: "Trezeguet", number: 11, position: "Orta Saha" },
      { name: "Enis Bardhi", number: 12, position: "Orta Saha" },
      { name: "Umut Bozok", number: 13, position: "Forvet" },
      { name: "Batista Mendy", number: 14, position: "Orta Saha" },
      { name: "Mehmet Can", number: 15, position: "Defans" },
      { name: "Onurcan Piri", number: 16, position: "Kaleci" },
      { name: "Hüseyin Türkmen", number: 17, position: "Defans" },
      { name: "Enis Destan", number: 18, position: "Forvet" }
    ]
  },
  {
    name: "Adana Demirspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Adana Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Antalyaspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Antalya Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Alanyaspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Alanya Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Başakşehir",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Başakşehir Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Gaziantep FK",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Gaziantep Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Hatayspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Hatay Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "İstanbulspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `İstanbulspor Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Kasımpaşa",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Kasımpaşa Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Kayserispor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Kayseri Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Konyaspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Konya Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Pendikspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Pendik Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Rizespor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Rize Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Sivasspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Sivas Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Ankaragücü",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Ankara Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Samsunspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Samsun Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Fatih Karagümrük",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Karagümrük Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Altay",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Altay Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Göztepe",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Göztepe Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Giresunspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Giresun Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  },
  {
    name: "Erzurumspor",
    players: Array.from({ length: 18 }, (_, i) => ({
      name: `Erzurum Oyuncu ${i + 1}`,
      number: i + 1,
      position: i === 0 ? "Kaleci" : i < 6 ? "Defans" : i < 14 ? "Orta Saha" : "Forvet"
    }))
  }
];
    
    // Get the Team model
    const Team = require('./models/Team').default;
    
    // Delete existing teams
    const deleteResult = await Team.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing teams`);
    
    // Add groupStats to each team
    const teamsWithStats = teams.map(team => ({
      ...team,
      groupStats: {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      }
    }));
    
    // Create new teams
    const createdTeams = await Team.create(teamsWithStats);
    console.log(`Created ${createdTeams.length} teams`);
    
    res.json({ 
      message: 'Teams seeded successfully', 
      count: createdTeams.length 
    });
  } catch (error: any) {
    console.error('Error seeding teams:', error);
    res.status(500).json({ 
      message: 'Error seeding teams', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Football Tournament API is running' });
});

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});