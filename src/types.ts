export interface WasteAnalysis {
  materialName: string;
  category: string;
  recyclability: "High" | "Medium" | "Low" | "None";
  drainageBlockRisk: "High" | "Medium" | "Low";
  hazardLevel: "Low" | "Medium" | "High";
  carbonFootprintEstimate: string;
  sortingGuide: string;
  ecoAlternative: string;
  aiAnalysisText: string;
}

export interface Report {
  id: string;
  title: string;
  location: string;
  city: string;
  lat: number; // custom grid coordinates (0-100) for a highly polished map model
  lng: number; // custom grid coordinates (0-100)
  type: "Blocked Drainage" | "Illegal Dumping" | "Plastic Pileup" | "Industrial Smoke" | "E-Waste";
  status: "Critical" | "Investigating" | "Clearing" | "Resolved";
  riskScore: number; // 0-100 risk score
  reportedAt: string;
  likes: number;
  description: string;
  imageUrl?: string;
  userReported?: boolean;
  aiFeedback?: WasteAnalysis;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}
