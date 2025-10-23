import mongoose, { Document, Schema } from 'mongoose';
import { ITournament } from './Tournament';
import { ITeam } from './Team';

interface IScorer {
  player: mongoose.Types.ObjectId;
  minute: number;
}

interface IScore {
  homeTeam: number;
  awayTeam: number;
  scorers: {
    homeTeam: IScorer[];
    awayTeam: IScorer[];
  };
}

export interface IMatch extends Document {
  tournament: mongoose.Types.ObjectId;
  homeTeam: mongoose.Types.ObjectId;
  awayTeam: mongoose.Types.ObjectId;
  date: Date;
  field: number;
  stage: 'group' | 'quarter_final' | 'semi_final' | 'final';
  group?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score?: IScore;
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
  winner?: mongoose.Types.ObjectId;
}

const ScorerSchema = new Schema<IScorer>({
  player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  minute: { type: Number, required: true, min: 0, max: 120 }
});

const ScoreSchema = new Schema<IScore>({
  homeTeam: { type: Number, default: 0 },
  awayTeam: { type: Number, default: 0 },
  scorers: {
    homeTeam: [ScorerSchema],
    awayTeam: [ScorerSchema]
  }
}, { _id: false });

const MatchSchema = new Schema<IMatch>({
  tournament: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  homeTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  awayTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  date: { type: Date, required: true },
  field: { type: Number, required: true },
  stage: { 
    type: String, 
    enum: ['group', 'quarter_final', 'semi_final', 'final'],
    required: true 
  },
  group: { type: String },
  status: { 
    type: String, 
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled' 
  },
  score: ScoreSchema,
  extraTimeEnabled: { type: Boolean, default: false },
  penaltyShootoutEnabled: { type: Boolean, default: false },
  winner: { type: Schema.Types.ObjectId, ref: 'Team' }
}, {
  timestamps: true
});

export default mongoose.model<IMatch>('Match', MatchSchema);