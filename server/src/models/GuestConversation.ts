import mongoose, { Schema, Document } from "mongoose";

export interface IGuestMessage {
  sender: "user" | "model";
  text: string;
  timestamp: Date;
}

export interface IGuestConversation extends Document {
  guestId: string; // a random UUID or unique string
  messages: IGuestMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}

const GuestMessageSchema = new Schema<IGuestMessage>(
  {
    sender: { type: String, enum: ["user", "model"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const GuestConversationSchema = new Schema<IGuestConversation>(
  {
    guestId: { type: String, required: true, unique: true },
    messages: [GuestMessageSchema],
  },
  { timestamps: true },
);

const GuestConversation = mongoose.model<IGuestConversation>(
  "GuestConversation",
  GuestConversationSchema,
);

export default GuestConversation;
