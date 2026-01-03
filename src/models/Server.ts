import mongoose, { Schema, model, models } from 'mongoose';

const serverSchema = new Schema({
    name: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
},{timestamps:true});

export const Server = models.Server || model('Server', serverSchema);