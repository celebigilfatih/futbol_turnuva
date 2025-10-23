import { Request, Response } from 'express';
import Team from '../models/Team';

// Tüm takımları getir
export const getAllTeams = async (req: Request, res: Response) => {
  try {
    const teams = await Team.find()
      .sort({ name: 1 });

    res.json({
      data: teams,
      total: teams.length,
      page: 1,
      limit: teams.length,
      totalPages: 1
    });
  } catch (error) {
    res.status(500).json({ message: 'Takımlar getirilirken bir hata oluştu.' });
  }
};

// Tek takım getir
export const getTeamById = async (req: Request, res: Response) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Takım bulunamadı.' });
    }
    res.json({ data: team });
  } catch (error) {
    res.status(500).json({ message: 'Takım getirilirken bir hata oluştu.' });
  }
};

// Yeni takım oluştur
export const createTeam = async (req: Request, res: Response) => {
  try {
    const team = new Team(req.body);
    await team.save();
    res.status(201).json({ data: team });
  } catch (error) {
    res.status(400).json({ message: 'Takım oluşturulurken bir hata oluştu.' });
  }
};

// Takım güncelle
export const updateTeam = async (req: Request, res: Response) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!team) {
      return res.status(404).json({ message: 'Takım bulunamadı.' });
    }
    res.json({ data: team });
  } catch (error) {
    res.status(400).json({ message: 'Takım güncellenirken bir hata oluştu.' });
  }
};

// Takım sil
export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Takım bulunamadı.' });
    }
    res.json({ message: 'Takım başarıyla silindi.' });
  } catch (error) {
    res.status(500).json({ message: 'Takım silinirken bir hata oluştu.' });
  }
};

// Oyuncu ekle
export const addPlayer = async (req: Request, res: Response) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Takım bulunamadı.' });
    }

    team.players.push(req.body);
    await team.save();
    res.json({ data: team });
  } catch (error) {
    res.status(400).json({ message: 'Oyuncu eklenirken bir hata oluştu.' });
  }
};

// Oyuncu güncelle
export const updatePlayer = async (req: Request, res: Response) => {
  try {
    const team = await Team.findOneAndUpdate(
      { 
        _id: req.params.id,
        'players._id': req.params.playerId 
      },
      { 
        $set: { 
          'players.$': req.body 
        } 
      },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ message: 'Takım veya oyuncu bulunamadı.' });
    }

    res.json({ data: team });
  } catch (error) {
    res.status(400).json({ message: 'Oyuncu güncellenirken bir hata oluştu.' });
  }
};

// Oyuncu sil
export const removePlayer = async (req: Request, res: Response) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { 
        $pull: { 
          players: { _id: req.params.playerId } 
        } 
      },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ message: 'Takım bulunamadı.' });
    }

    res.json({ data: team });
  } catch (error) {
    res.status(400).json({ message: 'Oyuncu silinirken bir hata oluştu.' });
  }
}; 

// Seed teams endpoint
export const seedTeams = async (req: Request, res: Response) => {
  try {
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
};
