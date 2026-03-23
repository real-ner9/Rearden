export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateInitial: string;
  messages: Message[];
  unread: number;
}

const ME = "recruiter";

export const mockConversations: Conversation[] = [
  {
    id: "c1",
    candidateId: "1",
    candidateName: "Sarah Chen",
    candidateInitial: "S",
    unread: 1,
    messages: [
      {
        id: "m1",
        senderId: ME,
        text: "Hi Sarah! I was really impressed by your video profile. Would you be interested in discussing a Senior React role?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      {
        id: "m2",
        senderId: "1",
        text: "Thank you! I'd love to hear more about the role. What's the team like?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23),
      },
      {
        id: "m3",
        senderId: ME,
        text: "It's a tight-knit team of 6 engineers working on our core product. Very collaborative culture with a focus on code quality.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22),
      },
      {
        id: "m4",
        senderId: "1",
        text: "That sounds great! I'm definitely interested in learning more. When would be a good time for a quick call?",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
    ],
  },
  {
    id: "c2",
    candidateId: "2",
    candidateName: "Alex Rivera",
    candidateInitial: "A",
    unread: 0,
    messages: [
      {
        id: "m5",
        senderId: ME,
        text: "Alex, your full-stack experience looks amazing. We have an opening that might be perfect for you.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      },
      {
        id: "m6",
        senderId: "2",
        text: "Thanks for reaching out! I checked out the company and it looks like a great fit. Let's schedule something!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 47),
      },
      {
        id: "m7",
        senderId: ME,
        text: "Perfect. I've sent a calendar invite for tomorrow at 2 PM. Looking forward to it!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 46),
      },
    ],
  },
  {
    id: "c3",
    candidateId: "3",
    candidateName: "Jordan Lee",
    candidateInitial: "J",
    unread: 2,
    messages: [
      {
        id: "m8",
        senderId: "3",
        text: "Hi! I saw the job posting and wanted to reach out directly. My video profile covers most of my recent work.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        id: "m9",
        senderId: "3",
        text: "I'm particularly excited about the AI/ML aspects of the role. I've been working with LLMs for the past year.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    ],
  },
];
