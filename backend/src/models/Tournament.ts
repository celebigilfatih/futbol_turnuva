import mongoose, { Schema, Document } from 'mongoose';

export interface ITournament extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  numberOfFields: number;
  matchDuration: number;
  breakDuration: number;
  teamsPerGroup: number;
  numberOfGroups: number;
  startTime: string;
  endTime: string;
  lunchBreakStart: string;
  lunchBreakDuration: number;
  groups: {
    _id: mongoose.Types.ObjectId;
    name: string;
    teams: string[];
  }[];
  status: 'pending' | 'group_stage' | 'knockout_stage' | 'quarter_final' | 'semi_final' | 'final' | 'completed';
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
}

const TournamentSchema: Schema = new Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  numberOfFields: { type: Number, required: true },
  matchDuration: { type: Number, required: true }, // dakika cinsinden
  breakDuration: { type: Number, required: true }, // dakika cinsinden
  teamsPerGroup: { type: Number, required: true },
  numberOfGroups: { type: Number, required: true },
  startTime: { type: String, default: '09:00' }, // İlk maç başlangıç saati
  endTime: { type: String, default: '17:00' }, // Son maç başlangıç saati
  lunchBreakStart: { type: String, default: '12:00' }, // Öğle arası başlangıç saati
  lunchBreakDuration: { type: Number, default: 60 }, // Öğle arası süresi (dakika)
  groups: [{
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }]
  }],
  status: {
    type: String,
    enum: ['pending', 'group_stage', 'knockout_stage', 'quarter_final', 'semi_final', 'final', 'completed'],
    default: 'pending'
  },
  extraTimeEnabled: { type: Boolean, default: true },
  penaltyShootoutEnabled: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model<ITournament>('Tournament', TournamentSchema);