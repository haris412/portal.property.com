export type InboxTab = 'all' | 'read' | 'unread';
export type MessageSender = 'other' | 'me';

export interface ConversationMessage {
  id: string;
  sender: MessageSender;
  text: string;
  time: string;
}

export interface ConversationItem {
  id: string;
  name: string;
  avatar: string;
  roleLabel: string;
  title: string;
  propertyLine: string;
  listTime: string;
  unread: boolean;
  messages: ConversationMessage[];
}

export const INBOX_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'emma',
    name: 'Emma Johnson',
    avatar: 'https://i.pravatar.cc/100?img=47',
    roleLabel: 'Buyer',
    title: 'Buyer · Skyline Boulevard viewing',
    propertyLine: 'Interested in 1200 Skyline Boulevard, Apt 4B',
    listTime: '2 min ago',
    unread: true,
    messages: [
      {
        id: 'emma-1',
        sender: 'other',
        text: 'Hi Michael, I reviewed the property details. Is the apartment available for immediate move-in?',
        time: '10:02 AM'
      },
      {
        id: 'emma-2',
        sender: 'me',
        text: 'Yes, it is available. I can also arrange a viewing today if that works for you.',
        time: '10:05 AM'
      },
      {
        id: 'emma-3',
        sender: 'other',
        text: 'Great. Can we move the appointment to 11:00 AM if the unit is still available?',
        time: '10:08 AM'
      }
    ]
  },
  {
    id: 'daniel',
    name: 'Daniel Lee',
    avatar: 'https://i.pravatar.cc/100?img=13',
    roleLabel: 'Tenant',
    title: 'Tenant · Harbor Residence',
    propertyLine: 'Interested in Harbor Residence',
    listTime: '18 min ago',
    unread: false,
    messages: [
      {
        id: 'daniel-1',
        sender: 'other',
        text: 'Please share the latest lease terms and whether parking is included.',
        time: '9:42 AM'
      },
      {
        id: 'daniel-2',
        sender: 'me',
        text: 'Sure, I will send the updated lease summary and parking details shortly.',
        time: '9:49 AM'
      }
    ]
  },
  {
    id: 'sophia',
    name: 'Sophia Carter',
    avatar: 'https://i.pravatar.cc/100?img=32',
    roleLabel: 'Buyer',
    title: 'Buyer · Bellevue Heights',
    propertyLine: 'Interested in Bellevue Heights',
    listTime: '43 min ago',
    unread: true,
    messages: [
      {
        id: 'sophia-1',
        sender: 'other',
        text: 'I would like to confirm the rescheduled visit and know if the documents are ready.',
        time: '9:11 AM'
      }
    ]
  },
  {
    id: 'carlos',
    name: 'Carlos Rivera',
    avatar: 'https://i.pravatar.cc/100?img=12',
    roleLabel: 'New lead',
    title: 'New lead · Downtown loft inquiry',
    propertyLine: 'Downtown loft inquiry',
    listTime: '1 hr ago',
    unread: false,
    messages: [
      {
        id: 'carlos-1',
        sender: 'other',
        text: 'Is the listing still open for rent from next month onward?',
        time: '8:23 AM'
      }
    ]
  }
];