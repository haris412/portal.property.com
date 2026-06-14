// What Node.js returns BACK to Angular
export interface Conversation {
  _id:           string;
  propertyId:    string;
  propertyTitle: string;
  propertyPrice: string;
  participants:  Participant[];
  lastMessage?:  LastMessage;
  createdAt:     Date;
  updatedAt:     Date;
}

export interface Participant {
  userId:    string;
  name:      string;
  initials:  string;
  hasUnread: boolean;
}

export interface LastMessage {
  text:     string;
  senderId: string;
  at:       Date;
}