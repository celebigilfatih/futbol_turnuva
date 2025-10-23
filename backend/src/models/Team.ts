import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  players: {
    name: string;
    number: number;
  }[];
  groupStats: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
}

const TeamSchema: Schema = new Schema({
  name: { type: String, required: true },
  players: [{
    name: { type: String, required: true },
    number: { type: Number, required: true }
  }],
  groupStats: {
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    drawn: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

export default mongoose.model<ITeam>('Team', TeamSchema); 