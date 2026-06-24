export type ChatRequest = {
  id: string;
  name: string;
  topic: string;
  status: "waiting" | "active" | "completed";
  date: string;
};

export const clientChats: ChatRequest[] = [
  { id: "1", name: "Dr. Aryan Sharma", topic: "Vedic Astrology", date: "Today, 4:00 PM", status: "waiting" },
  { id: "2", name: "Neha Iyer", topic: "Tarot Reading", date: "Yesterday, 6:30 PM", status: "completed" }
];

export const astrologerChats: ChatRequest[] = [
  { id: "1", name: "Aarav Mehta", topic: "Career clarity", date: "Today, 4:00 PM", status: "waiting" },
  { id: "2", name: "Nisha Rao", topic: "Marriage compatibility", date: "Yesterday, 6:30 PM", status: "active" }
];
