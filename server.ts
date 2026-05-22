import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// In-memory reports store
interface WasteAnalysis {
  materialName: string;
  category: string;
  recyclability: string;
  drainageBlockRisk: string;
  hazardLevel: string;
  carbonFootprintEstimate: string;
  sortingGuide: string;
  ecoAlternative: string;
  aiAnalysisText: string;
}

interface Report {
  id: string;
  title: string;
  location: string;
  city: string;
  lat: number;
  lng: number;
  type: string;
  status: string;
  riskScore: number;
  reportedAt: string;
  likes: number;
  description: string;
  imageUrl?: string;
  userReported?: boolean;
  aiFeedback?: WasteAnalysis;
}

const reports: Report[] = [
  {
    id: "rep-1",
    title: "Major drainage blockage by single-use PET bottles",
    location: "Oshodi Bus Interchange, storm drain G-2",
    city: "Lagos",
    lat: 42,
    lng: 48,
    type: "Blocked Drainage",
    status: "Critical",
    riskScore: 92,
    reportedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    likes: 24,
    description: "The main drainage grid is heavily clogged with plastic bags and PET plastic beverage bottles. High flooding hazard with the seasonal rains starting next week. The local market is directly at risk.",
    aiFeedback: {
      materialName: "PET Bottles & Polyethylene Bags",
      category: "Plastic Waste / Blockage",
      recyclability: "High (PET is easily recyclable)",
      drainageBlockRisk: "Critical",
      hazardLevel: "Medium (Causes flash floods)",
      carbonFootprintEstimate: "Each bottle represents approx 82g of CO2 emissions during lifecycle.",
      sortingGuide: "Dredging required. Debris should be separated: plastics into the community recycling bins, organic sludge composting, non-recyclable polymers isolated.",
      ecoAlternative: "Community ban on low-grade nylon packing and implementation of reusable textile bags.",
      aiAnalysisText: "Plastics aggregate along drainage mesh, causing heavy water stagnation. This results in toxic malaria breeding grounds and severe flash floods in urban environments like Oshodi."
    }
  },
  {
    id: "rep-2",
    title: "Unauthorized electronic waste debris next to watershed",
    location: "Near Alaba International Market watershed canal",
    city: "Lagos",
    lat: 30,
    lng: 35,
    type: "E-Waste",
    status: "Investigating",
    riskScore: 78,
    reportedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    likes: 12,
    description: "Several cathode-ray tubes (CRTs), discarded wires, and power supplies dumped on the muddy embankments of the canal. Rainwater is washing metallic materials into the drainage basin.",
  },
  {
    id: "rep-3",
    title: "Municipal debris clog restricting water movement",
    location: "Kibera Bridge, river tributary sector 4",
    city: "Nairobi",
    lat: 60,
    lng: 55,
    type: "Blocked Drainage",
    status: "Clearing",
    riskScore: 85,
    reportedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    likes: 35,
    description: "Silt, branches, and plastic carrier bags have gathered at the bridge bottleneck. Environmental groups are presently on-site but require heavier tools to restore full flow.",
  },
  {
    id: "rep-4",
    title: "Community-driven market container collection bin setup",
    location: "Kaneshie Central Market sorting terminal",
    city: "Accra",
    lat: 50,
    lng: 68,
    type: "Plastic Pileup",
    status: "Resolved",
    riskScore: 20,
    reportedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    likes: 48,
    description: "A large citizen-organized sorting depot has successfully sorted 450kg of packaging plastics. Clean-up complete and ready for transport to the local processing plant.",
  },
  {
    id: "rep-5",
    title: "Catastrophic silting blockage near Nworie River tributary",
    location: "Off Douglas Road drainage outlet, near market canal",
    city: "Owerri",
    lat: 48,
    lng: 52,
    type: "Blocked Drainage",
    status: "Critical",
    riskScore: 94,
    reportedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    likes: 31,
    description: "Massive pile-up of single-use consumer plastics and sand silt has completely obstructed the drainage tributary feeding the Nworie River. High soil erosion risks are starting to undermine the road foundations.",
    aiFeedback: {
      materialName: "Polystyrene Packaging & Sludge Silt",
      category: "Blocked Storm Basin",
      recyclability: "Medium",
      drainageBlockRisk: "Critical",
      hazardLevel: "High",
      carbonFootprintEstimate: "Silt combined with high polymer counts disrupts natural river banks, releasing embedded soil carbon.",
      sortingGuide: "Dredging combined with sediment barriers. Separate Styrofoam fractions immediately into closed bags as lightweight polymers easily scatter with seasonal winds.",
      ecoAlternative: "Introduce biodegradable pulp-molded containers instead of Styrofoam packaging within dry markets.",
      aiAnalysisText: "Otamiri and Nworie watersheds are fragile. Blocked outputs backup toxic standing water and lead to catastrophic gully washouts on active regional roads."
    }
  },
  {
    id: "rep-6",
    title: "Creek debris clogging saltwater drainage bypass",
    location: "Marine Base Creek channel outlet",
    city: "Port Harcourt",
    lat: 72,
    lng: 40,
    type: "Plastic Pileup",
    status: "Investigating",
    riskScore: 82,
    reportedAt: new Date(Date.now() - 15 * 3600000).toISOString(),
    likes: 18,
    description: "Extensive clusters of floating single-use packaging and drums in the estuary creek have created a damming effect. Tidal backup is causing urban drainages to outflow backwards into adjoining homes.",
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Helper to initialize Gemini client lazy-style
  let aiClient: GoogleGenAI | null = null;
  function getAiClient(): GoogleGenAI {
    if (!aiClient) {
      if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ Warning: GEMINI_API_KEY is not set. Falling back to mocked insights.");
      }
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || "MOCK_KEY",
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // --- API Endpoints ---

  // Get all reports
  app.get("/api/reports", (req, res) => {
    res.json(reports);
  });

  // Create a new report
  app.post("/api/reports", (req, res) => {
    const { title, location, city, lat, lng, type, description, imageUrl, aiFeedback } = req.body;
    
    if (!title || !location || !city || !type || !description) {
      return res.status(400).json({ error: "Missing required report fields" });
    }

    const newReport: Report = {
      id: `rep-${Date.now()}`,
      title,
      location,
      city,
      lat: Number(lat) || Math.floor(Math.random() * 80) + 10,
      lng: Number(lng) || Math.floor(Math.random() * 80) + 10,
      type,
      status: "Critical",
      riskScore: Math.floor(Math.random() * 41) + 50, // 50-90
      reportedAt: new Date().toISOString(),
      likes: 0,
      description,
      imageUrl,
      userReported: true,
      aiFeedback
    };

    reports.unshift(newReport);
    res.status(201).json(newReport);
  });

  // Vote or support a report
  app.post("/api/reports/:id/like", (req, res) => {
    const { id } = req.params;
    const report = reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    report.likes += 1;
    res.json(report);
  });

  // Update status
  app.post("/api/reports/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const report = reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    if (status) {
      report.status = status;
    }
    res.json(report);
  });

  // AI-powered Image Scanner and Material Analyzer endpoint
  app.post("/api/analyze-waste", async (req, res) => {
    const { image, description } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Mocked environmental fallback response if no API Key configuration exists
      return res.json({
        materialName: "Mock Polyethylene & PET Plastic (Offline Simulation)",
        category: "Plastic / Polymer Debris",
        recyclability: "High",
        drainageBlockRisk: "High",
        hazardLevel: "Medium",
        carbonFootprintEstimate: "Approx 82g CO12 equivalent per bottle. Plastic persists for over 450 years.",
        sortingGuide: "Dry thoroughly. Compact to minimize volume. Separate clear PET from colored plastics and place in localized sorting bins.",
        ecoAlternative: "Transition to stainless steel, bamboo canteen structures, or robust local clay storage containers.",
        aiAnalysisText: "Blocked drainage channels trigger municipal flash floods and create standing water pools that boost vector-borne pathogen counts like malaria."
      });
    }

    try {
      const gAI = getAiClient();
      
      const promptText = `Analyze this environmental photo/issue. Description supplied by the reporter: "${description || 'None supplied'}".
Identify the waste material or environmental issue in detail. You MUST respond strictly in a valid JSON format (raw JSON block without wrap, or fully compliant string format) with these keys:
{
  "materialName": "Identified item and chemical composition (e.g. Low-Density Polyethylene wrap)",
  "category": "Classification (e.g., Plastic Packaging / Blockage)",
  "recyclability": "High / Medium / Low / None",
  "drainageBlockRisk": "High / Medium / Low",
  "hazardLevel": "Low / Medium / High",
  "carbonFootprintEstimate": "Calculated or descriptive metric of its manufacturing/lifecycle footprint",
  "sortingGuide": "Step-by-step instructions on clean separation, cleaning, and storage for disposal",
  "ecoAlternative": "A natural, local or reusable alternative to avoid this packaging",
  "aiAnalysisText": "Brief 2-3 sentence overview on how leaving this waste outdoors damages urban cities, storm sewers and ecosystems."
}`;

      let result;
      if (image && image.includes("base64,")) {
        const parts = image.split("base64,");
        const mimeType = parts[0].split(":")[1].split(";")[0];
        const base64Data = parts[1];

        result = await gAI.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            { text: promptText }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });
      } else {
        result = await gAI.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            responseMimeType: "application/json"
          }
        });
      }

      const generatedText = result.text || "{}";
      const parsedData = JSON.parse(generatedText);
      res.json(parsedData);

    } catch (e: any) {
      console.error("Gemini Waste Analysis Error:", e);
      res.status(500).json({ error: "Failed to generate AI report analysis", message: e.message });
    }
  });

  // AI Environmental Chat assistant
  app.post("/api/chat-eco", async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      const lastMsgText = (messages[messages.length - 1]?.text || "").toLowerCase();
      let reply = "";

      const cityCategories = {
        coastal: {
          cities: ["lagos", "port harcourt", "warri", "yenagoa", "calabar", "uyo", "bayelsa", "rivers state", "akwa ibom", "cross river", "delta state"],
          profile: "Coastal Estuary & Delta Zone. Characterized by low-lying elevations, high salinity, ocean tide influence, and extremely high water tables.",
          issues: [
            "Estuary Blockage: Floating single-use plastics and chemical packaging block downstream marine creeks, causing severe tidal backing into residential compounds.",
            "Water Stagnation: Blocked concrete storm channels trap saline rainwater, accelerating asphalt street potholes and creating toxic malaria vectors."
          ],
          actions: [
            "Sieve Trash Cages: Position resilient steel-wired floatation cages across major estuary outfalls.",
            "Pre-Tidal Clearance: Dredge sand and silt from tidal gates weekly to guarantee gravitational water discharge."
          ]
        },
        erosion: {
          cities: [
            "owerri", "imo", "enugu", "awka", "onitsha", "umuahia", "abakaliki", "ado ekiti", "benin city", "abeokuta", "oshogbo", "akure", 
            "anambra", "ebonyi", "edo state", "ekiti", "abroad", "nnewi", "nsukka", "ogbomosho", "osun", "akure", "ondo", "ogun state"
          ],
          profile: "Precipitation-heavy Hilly & Watershed Zone. Famous for highly detached sandy/acidic soils and intense stormwater runoff speed.",
          issues: [
            "Catastrophic Gully Washouts: Obstructed commercial street drains force overflow waters onto unpaved sandy slopes, executing massive washouts that swallow roads and sub-metropolitan homes.",
            "River Silt Surcharges: Unmanaged packaging plastics, sand dredging residue, and soil silt dump straight into vulnerable river networks (such as Owerri's Nworie and Otamiri rivers), heavily choking water depth."
          ],
          actions: [
            "Commercial Gutter Grates: Retrofit crowded marketplace gutters with rigid iron grates to trap plastic bottles locally before river entry.",
            "Vegetative Bio-filters: Restabilize delicate neighborhood perimeter banks using gravel sandbags and deep-rooting vetiver grass rows."
          ]
        },
        central: {
          cities: ["abuja", "fct", "ibadan", "ilorin", "jos", "lokoja", "makurdi", "minna", "jalingo", "lafia", "ogun", " Oyo", "plateau", "kogi", "benue", "niger state", "taraba", "nasarawa"],
          profile: "Central Guinea Savannah & Wet River Basin Zone. Experiences intense metropolitan development, high soil compaction, and central river boundaries.",
          issues: [
            "Construction Sediment Clutter: Unregulated concrete sludge, clay washouts, and building tailings flow freely, completely choking core drainage culverts.",
            "Impervious Flash Flooding: Quick urban downs saturate paved surfaces, generating immediate flash river backups at major stream conduits."
          ],
          actions: [
            "Boundary Sediment Fences: Mandate dense geotextile fabric barriers at all active real estate construction boundaries.",
            "Highway Channel Desilting: Schedule quarterly municipal sweep-outs of highway box-culverts before heavy downpours."
          ]
        },
        northern: {
          cities: [
            "kano", "kaduna", "katsina", "sokoto", "maiduguri", "bauchi", "gombe", "damaturu", "gusau", "dutse", "birnin kebbi", "yola", "zaria",
            "borno", "yobe", "adamawa", "kebbi", "zamfara", "jigawa"
          ],
          profile: "Sahelian & Northern Savannah Zone. Characterized by prolonged hot dry seasons, strong dust-laden winds, and intense, brief torrential summer downpours.",
          issues: [
            "Dust & Nylon Grate Clogs: Lightweight nylons (specifically pure-water plastic sachets and shopping bags) blow straight into seasonal gutters during dry winds, forming impenetrable plastic dams.",
            "Extreme Flash River Breaks: Heavy brief summer storms immediately back up against dry sand-filled conduits, inundating commercial and residential areas."
          ],
          actions: [
            "March/April Clearout Cycles: Execute coordinated community-wide gutter sweep-outs strictly in late spring before the initial summer monsoon arrives.",
            "Urban Market Recyclers: Integrate micro-incentive centers at daily regional food markets to systematically capture and bag polymer films."
          ]
        }
      };

      let foundCategory = null;
      let matchedCity = "";

      for (const [key, cat] of Object.entries(cityCategories)) {
        const found = cat.cities.find(c => lastMsgText.includes(c));
        if (found) {
          foundCategory = cat;
          matchedCity = found.charAt(0).toUpperCase() + found.slice(1);
          break;
        }
      }

      if (foundCategory) {
        reply = `🌍 **Eco-Intelligence Climate Expert Report: ${matchedCity}, Nigeria**

**Regional Environmental Profile:**
${foundCategory.profile}

**Core Urban Vulnerabilities & Clog Factors:**
${foundCategory.issues.map(issue => `*   **${issue.split(":")[0]}:** ${issue.split(":")[1] || ""}`).join("\n")}

**Empirical Field Action Plans:**
${foundCategory.actions.map((act, idx) => `${idx + 1}.  **${act.split(":")[0]}:** ${act.split(":")[1] || ""}`).join("\n")}

*To get hyper-custom AI predictions dynamically, make sure to add your Gemini API Key in the Settings -> Secrets configuration panel!*`;
      } else if (lastMsgText.includes("nairobi") || lastMsgText.includes("kenya")) {
        reply = `🌍 **Eco-Intelligence Climate Expert Report: Nairobi, Kenya**

Nairobi stands on volcanic high elevation slopes. Water runoff velocity is exceptionally high, which means that any solid trash collection system must withstand heavy downward gravity force.
*   **Volcanic Silt & Sedimentation:** Rapid torrential runoff washes red volcanic soil mud and plastic bags straight into the Nairobi River watershed, creating thick sedimentary dams.
*   **Infrastructure Choke Points:** Severe blockages occurring at commercial grid culverts during standard rainy seasons backing up local pathways in places like South C and Nairobi West.

**Empirical Field Action Plans:**
1.  **Drop-In Trash Traps:** Implement grid traps near key storm openings in central business zones.
2.  **Volcanic Sediment Catchers:** Build soil-trapping stone gabions upvalley to slow down water runoff speeds.`;
      } else if (lastMsgText.includes("accra") || lastMsgText.includes("ghana")) {
        reply = `🌍 **Eco-Intelligence Climate Expert Report: Accra, Ghana**

Accra sits on a flat coastal shelf with fragile estuarine lagoons (such as Korle Lagoon and Odaw River channels).
*   **Lagoon Choking:** Millions of single-use PET bottles and household plastic containers float into Odaw stream drains, completely damming the Korle lagoon outflow and causing catastrophic standing floods in low elevation neighborhoods like Alajo and Glefe.
*   **Dense Market Garbage:** Markets (such as Makola and Agbogbloshie) generate immediate high-volume polymers which choke small neighborhood gutters.

**Empirical Field Action Plans:**
1.  **Inter-Lagoon Boom Barriers:** Maintain continuous floating booms across the Odaw river inlets to trap flowing plastics.
2.  **Accra Market Sorters:** Subsidize daily waste separation boxes directly inside market lanes.`;
      } else if (lastMsgText.includes("plastic") || lastMsgText.includes("recycl")) {
        reply = `♻️ **Eco-Sense Guide on Materials, Sorting, & Upcycling**

To stop plastics from blocking drainage networks, implement clean sorting protocols:
*   **PET Plastics (Code 1):** Beverage bottles. Collect dry, press flat, and store in clean crates.
*   **HDPE Bottles (Code 2):** Chemical, detergent, and shampoo containers. Highly valued by recyclers.
*   **Low-Density Bags (Code 4):** Standard pure water sachets and shopping wraps. Highly dangerous blocker of urban sewer grates!

*Recommendation:* Ensure community sorting locations are in dry, wind-shielded zones to prevent lightweight nylon bags from blowing away and landing back in street drainage.`;
      } else if (lastMsgText.includes("drain") || lastMsgText.includes("flood") || lastMsgText.includes("clog")) {
        reply = `🌊 **Sewer Drainage Clearing and Flow Management**

Flooding is often entirely caused by neglected drainage conduits. Optimize flow easily with these steps:
*   **Mesh Grate Inlets:** Retrofit storm entrances with vertical steel grills spaced 12mm apart to let water pass while stopping logs, tins, and plastics.
*   **Pre-Rain dredging:** Clear street gutters in early March before heavy rainfall cycles.
*   **Community Signage:** Establish trash containment zones directly adjacent to local street markets to ban random dumping entirely.`;
      } else {
        reply = `🌍 **Eco-Intelligence Climate Assistant (Offline Simulation Mode)**

I am ready to help you optimize community drainage resilience and prevent urban flooding across all Nigerian states and cities!

**Ask me custom questions such as:**
*   *What is the climate situation in Owerri, Imo State, Nigeria?*
*   *How does plastic clog Kaduna or Kano dry-drainage grates?*
*   *Tell me about coastal flash floods in Port Harcourt and Lagos.*
*   *What are the main flood threats in Ibadan, Enugu, or Abuja?*`;
      }

      return res.json({ text: reply });
    }

    try {
      const gAI = getAiClient();
      
      const systemInstructionChat = `You are a localized African Urban Environmental Expert, specializing in Nigerian cities (Lagos, Port Harcourt, Abuja, Owerri in Imo State, etc.), Kenyan cities (Nairobi), and Ghanaian cities (Accra).
You provide highly practical, respectful, and bulleted advice about local climate challenges, stormwater drainage clogs, gully erosion in states like Imo, silt in Owerri (specifically the Nworie and Otamiri river blockages), and plastic recycling strategies.
Address the user conversation history contextually and directly. Your response must be raw styled Markdown text with bold labels. Avoid general templates. Limit response to 150-250 words.`;

      const formattedContents = messages.map(m => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const result = await gAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemInstructionChat
        }
      });

      res.json({ text: result.text });

    } catch (e: any) {
      console.error("Gemini Chat Error:", e);
      res.status(500).json({ error: "Eco assistant took too long to respond", message: e.message });
    }
  });

  // Host Vite environment in Dev or static folder in Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Climate/Waste monitoring server active on port ${PORT}`);
  });
}

startServer();
