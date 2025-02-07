export interface IMessage {
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export interface IConversation {
  _id: string;
  user: string;
  title: string;
  messages: IMessage[];
  createdAt: string;
  updatedAt: string;
}
