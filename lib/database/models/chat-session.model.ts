import mongoose, { Schema, Document, Model } from "mongoose";

export interface ChatMessageRecord {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatSessionDocument extends Document {
  messages: ChatMessageRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<ChatMessageRecord>(
  {
    role: { type: String, required: true, enum: ["user", "assistant", "system"] },
    content: { type: String, required: true },
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<ChatSessionDocument>(
  {
    messages: {
      type: [ChatMessageSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "chat_sessions",
  }
);

export const ChatSession: Model<ChatSessionDocument> =
  mongoose.models.ChatSession ||
  mongoose.model<ChatSessionDocument>("ChatSession", ChatSessionSchema);
