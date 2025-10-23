import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  number: number;
  position?: string;
  team: mongoose.Types.ObjectId;
  tournament: mongoose.Types.ObjectId;
  goals: number;
  assists: number;
  matches: number;
  minutesPlayed: number;
}

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: Number, required: true },
  position: { type: String },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  goals: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  matches: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 }
}, { timestamps: true });

// Gol krallığı için index
PlayerSchema.index({ tournament: 1, goals: -1 });

export default mongoose.model<IPlayer>('Player', PlayerSchema);