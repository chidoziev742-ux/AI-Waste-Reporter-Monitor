import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Droplets,
  Info,
  Compass,
  Upload,
  Sparkles,
  Send,
  Heart,
  RefreshCw,
  Wind,
  Layers,
  Zap,
  ChevronRight,
  Database,
  Grid,
  Filter,
  Check,
  Award,
  BookOpen
} from "lucide-react";
import InteractiveMap from "./components/InteractiveMap";
import { Report, WasteAnalysis, ChatMessage } from "./types";

export const NIGERIAN_CITIES = [
  "Abeokuta", "Abakaliki", "Abuja", "Ado Ekiti", "Akure", "Asaba", "Awka", "Bauchi", 
  "Benin City", "Birnin Kebbi", "Calabar", "Damaturu", "Dutse", "Enugu", "Gombe", 
  "Gusau", "Ibadan", "Ilorin", "Jalingo", "Jos", "Kaduna", "Kano", "Katsina", 
  "Lafia", "Lagos", "Lokoja", "Makurdi", "Minna", "Nnewi", "Nsukka", "Ogbomosho", 
  "Onitsha", "Oshogbo", "Owerri", "Port Harcourt", "Sokoto", "Umuahia", "Uyo", 
  "Warri", "Yenagoa", "Yola", "Zaria"
];

export default function App() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [currentCityFilter, setCurrentCityFilter] = useState<string>("All Cities");
  
  // New report form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Lagos");
  const [location, setLocation] = useState("");
  const [wasteType, setWasteType] = useState("Blocked Drainage");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analyzedFeedback, setAnalyzedFeedback] = useState<WasteAnalysis | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please drop a valid image file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result as string);
        setAnalyzedFeedback(null); // reset prior
      };
      reader.readAsDataURL(file);
    }
  };

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      sender: "bot",
      text: "🌍 **Eco-Intelligence AI Terminal Active**\n\nI am your specialized African Urban resilience assistant. Ask me anything about mitigating community drainage blockages, recycling plastic types, managing hazardous e-waste, or implementing water-channel protections in vulnerable neighborhoods.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);

  // General Status triggers
  const [metrics, setMetrics] = useState({
    activeClogs: 0,
    resolvedIssues: 0,
    totalEngagement: 0,
    pollutionRiskIndex: 78
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial report set
  const loadReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
        calculateMetrics(data);
      }
    } catch (e) {
      console.error("Failed to fetch reports", e);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const calculateMetrics = (data: Report[]) => {
    const active = data.filter(r => r.status !== "Resolved").length;
    const resolved = data.filter(r => r.status === "Resolved").length;
    const engagement = data.reduce((acc, current) => acc + current.likes, 0);
    
    // Average risk score calculations
    const avgRisk = data.length > 0 
      ? Math.round(data.reduce((acc, curr) => acc + curr.riskScore, 0) / data.length)
      : 50;

    setMetrics({
      activeClogs: active,
      resolvedIssues: resolved,
      totalEngagement: engagement,
      pollutionRiskIndex: avgRisk
    });
  };

  // Upvote/Like a report
  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/like`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setReports(prev => prev.map(r => r.id === id ? { ...r, likes: updated.likes } : r));
        setMetrics(prev => ({ ...prev, totalEngagement: prev.totalEngagement + 1 }));
        if (selectedReport?.id === id) {
          setSelectedReport(prev => prev ? { ...prev, likes: updated.likes } : null);
        }
      }
    } catch (e) {
      console.error("E-error liking", e);
    }
  };

  // Change status of blockages
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: updated.status } : r));
        if (selectedReport?.id === id) {
          setSelectedReport(prev => prev ? { ...prev, status: updated.status } : null);
        }
        // update basic counts
        setTimeout(() => {
          loadReports();
        }, 150);
      }
    } catch (e) {
      console.error("E-error updating status", e);
    }
  };

  // Image upload handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result as string);
        setAnalyzedFeedback(null); // reset prior
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Environmental Analyzer Call
  const triggerAiAnalysis = async () => {
    if (!imageFile && !description) {
      alert("Please provide at least a photo or brief text description of the waste accumulation site to run our AI Model.");
      return;
    }
    
    setIsAnalyzingImage(true);
    try {
      const res = await fetch("/api/analyze-waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageFile,
          description: description || title || "Unlabeled camera sample"
        })
      });
      if (res.ok) {
        const result: WasteAnalysis = await res.json();
        setAnalyzedFeedback(result);
      }
    } catch (error) {
      console.error("Analysis failure:", error);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Create new live environmental report
  const submitNewReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !city || !description) {
      alert("Please fill in key metadata fields (Title, City, Location, Hazard Description).");
      return;
    }

    setIsSubmittingReport(true);
    try {
      const bodyPayload = {
        title,
        description,
        city,
        location,
        lat: lat || Math.floor(Math.random() * 41) + 30, // Fallback coordinates from selected map aspect
        lng: lng || Math.floor(Math.random() * 41) + 30,
        type: wasteType,
        imageUrl: imageFile || undefined,
        aiFeedback: analyzedFeedback || undefined
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });
      
      if (res.ok) {
        const addedProduct = await res.json();
        setReports(prev => [addedProduct, ...prev]);
        calculateMetrics([addedProduct, ...reports]);
        
        // Clear reporting inputs
        setTitle("");
        setDescription("");
        setLocation("");
        setImageFile(null);
        setAnalyzedFeedback(null);
        setLat(null);
        setLng(null);
        alert("Success! Your environmental audit was published of live community channels.");
      }
    } catch (e) {
      console.error("Error creating record", e);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Run chat message
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!presetText) setChatInput("");
    setIsChatSending(true);

    try {
      const apiMessages = [...chatMessages, userMsg].map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch("/api/chat-eco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (res.ok) {
        const botRes = await res.json();
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "bot",
          text: botRes.text,
          timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages(prev => [...prev, botMsg]);
      }
    } catch (e) {
      console.error("Chat backend failure:", e);
    } finally {
      setIsChatSending(false);
    }
  };

  const mapSelectedCoordinates = (clickedLat: number, clickedLng: number) => {
    setLat(clickedLat);
    setLng(clickedLng);
  };

  // Filtered reports list
  const filteredReportsList = reports.filter(r => {
    if (currentCityFilter === "All Cities") return true;
    return r.city.toLowerCase() === currentCityFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans flex flex-col antialiased ambient-grid relative">
      
      {/* Top Banner Navigation */}
      <header className="h-16 border-b border-slate-800/80 flex items-center justify-between px-6 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-display">
              ECO-SENSE <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-xs">AI</span>
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
              Urban Environmental Resilience Monitor
            </p>
          </div>
        </div>

        {/* Global telemetry variables */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Resilience Status</span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 
              COMMUNITY NODE CONNECTED
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Climate Threat Level</span>
            <span className="text-xs font-mono font-bold text-amber-400">
              MODERATE CLOG RISK (78 AQI)
            </span>
          </div>
        </div>

        {/* Action shortcut to report form */}
        <div>
          <a
            href="#report-creation-lab"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold transition-all uppercase tracking-wider shadow-sm flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" /> File New Audit
          </a>
        </div>
      </header>

      {/* Main Grid Panels Container */}
      <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Aspect: Map, Stats, Forms - 8 cols */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Quick Metrics Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500">Active Blockages</span>
              <span className="text-2xl font-bold text-rose-400 mt-2 font-display">{metrics.activeClogs}</span>
              <p className="text-[10px] text-slate-400 mt-1">Requires local dredging</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500">Unclogged Sites</span>
              <span className="text-2xl font-bold text-emerald-400 mt-2 font-display">{metrics.resolvedIssues}</span>
              <p className="text-[10px] text-slate-400 mt-1">Successfully restored</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500">Citizen Sign-offs</span>
              <span className="text-2xl font-bold text-sky-400 mt-2 font-display">{metrics.totalEngagement}</span>
              <p className="text-[10px] text-slate-400 mt-1">Audit verification votes</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500">Avg Risk Rating</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-yellow-400 font-display">{metrics.pollutionRiskIndex}%</span>
                <span className="text-[9px] font-mono text-rose-400 font-bold uppercase">High Flood</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Based on visual intensity</p>
            </div>
          </section>

          {/* Map Controls and Filters */}
          <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filter Region:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {["All Cities", "Lagos", "Owerri", "Port Harcourt", "Abuja", "Nairobi", "Accra"].map((cityOpt) => (
                  <button
                    key={cityOpt}
                    onClick={() => {
                      setCurrentCityFilter(cityOpt);
                      setSelectedReport(null);
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium transition duration-150 ${
                      currentCityFilter === cityOpt
                        ? "bg-emerald-600 text-white border border-emerald-500 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800"
                    }`}
                  >
                    {cityOpt}
                  </button>
                ))}

                {/* More Cities dropdown filter */}
                <select
                  value={
                    ["All Cities", "Lagos", "Owerri", "Port Harcourt", "Abuja", "Nairobi", "Accra"].includes(currentCityFilter)
                      ? ""
                      : currentCityFilter
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      setCurrentCityFilter(e.target.value);
                      setSelectedReport(null);
                    }
                  }}
                  className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded text-xs font-mono font-medium transition focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="" disabled>More Cities...</option>
                  {NIGERIAN_CITIES.filter(c => !["Lagos", "Owerri", "Port Harcourt", "Abuja"].includes(c)).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="All Cities">-- Reset Filter --</option>
                </select>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800">
              Interactive Grid: <span className="text-emerald-400 font-bold">{filteredReportsList.length} hotspots</span> registered
            </div>
          </div>

          {/* Interactive Hydrological Map Visual */}
          <div className="h-[480px]">
            <InteractiveMap
              reports={reports}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              onSelectCoordinates={mapSelectedCoordinates}
              currentCityFilter={currentCityFilter}
            />
          </div>

          {/* AI Image Scanner and Report Submission Center */}
          <section id="report-creation-lab" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden p-6">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 bg-emerald-950 border border-emerald-800 rounded flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">AI Vision Environmental Audit Lab</h2>
                <p className="text-xs text-slate-500">Provide a waste image. Our localized AI models detect material types, pollution risks, and suggest recycling steps.</p>
              </div>
            </div>

            <form onSubmit={submitNewReport} className="mt-5 space-y-5">
              
              {/* Image Input Segment */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <span className="block text-xs font-mono text-slate-400 mb-2 uppercase">Camera / Image Upload</span>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border border-dashed rounded p-4 aspect-[4/3] flex flex-col items-center justify-center text-center cursor-pointer group transition-all duration-300 ${
                      isDragging
                        ? "border-emerald-400 bg-emerald-950/30 shadow-[0_0_15px_rgba(52,211,153,0.15)] scale-[1.01]"
                        : "border-slate-700 bg-slate-950/80 hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    {imageFile ? (
                      <div className="absolute inset-2 overflow-hidden rounded">
                        <img src={imageFile} alt="Preview dump" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <p className="text-[10px] font-mono text-emerald-400 font-bold">REPLACE PHOTO</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 p-2">
                        <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                          isDragging ? "bg-emerald-950 border-emerald-500 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-400 group-hover:border-slate-700"
                        }`}>
                          <Upload className={`w-5 h-5 ${isDragging ? "animate-bounce text-emerald-400" : ""}`} />
                        </div>
                        <p className={`text-xs font-bold transition-colors ${isDragging ? "text-emerald-300" : "text-slate-300"}`}>
                          {isDragging ? "Drop your file here!" : "Drag or click photo"}
                        </p>
                        <p className="text-[9px] text-slate-500 leading-tight">Meters, micro-dumps, plastic clogs (max 12MB)</p>
                      </div>
                    )}
                  </div>

                  {imageFile && (
                    <button
                      type="button"
                      onClick={triggerAiAnalysis}
                      disabled={isAnalyzingImage}
                      className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold text-xs uppercase rounded transition-all flex items-center justify-center gap-1.5"
                    >
                      {isAnalyzingImage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Running AI Models...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Analyze with AI
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Form General Fields */}
                <div className="md:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Selected City</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none focus:border-slate-700 cursor-pointer"
                      >
                        <optgroup label="Nigeria (Core Cities & States)">
                          {NIGERIAN_CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </optgroup>
                        <optgroup label="International Regions">
                          <option value="Nairobi">Nairobi (Kenya)</option>
                          <option value="Accra">Accra (Ghana)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Issue Classification</label>
                      <select
                        value={wasteType}
                        onChange={(e) => setWasteType(e.target.value)}
                        className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none focus:border-slate-700"
                      >
                        <option value="Blocked Drainage">Blocked Storm Drainage</option>
                        <option value="Illegal Dumping">Illegal Dumping Ground</option>
                        <option value="Plastic Pileup">Plastic Pileup Site</option>
                        <option value="Industrial Smoke">Industrial Air Pollution</option>
                        <option value="E-Waste">Discarded Electronic Waste</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Aesthetic Title / Short Description</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Clogged tertiary canal near main intersection"
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-slate-700"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Location Address / Landmark</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Oshodi interchange near market pillars"
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-slate-700"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Locked Grid Coordinates (Lat% , Lng%)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          readOnly
                          value={lat !== null ? `${lat}% Lat` : "Auto lock"}
                          className="w-full text-xs font-mono bg-slate-950/60 border border-slate-800 rounded p-2.5 text-slate-400 text-center"
                        />
                        <input
                          type="text"
                          readOnly
                          value={lng !== null ? `${lng}% Lng` : "Auto lock"}
                          className="w-full text-xs font-mono bg-slate-950/60 border border-slate-800 rounded p-2.5 text-slate-400 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Observations / Hazard Description</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detail current flow obstruction, stagnation level, health hazards, and approximate length..."
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-slate-700 resize-none"
                      required
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Display AI Waste Analysis Result if loaded */}
              {analyzedFeedback && (
                <div className="mt-4 p-4 rounded bg-slate-950/90 border border-slate-800 space-y-3 font-mono text-xs text-slate-300 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      AI SPECTROMETRY FEEDBACK
                    </span>
                    <span className="bg-emerald-950 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded uppercase border border-emerald-800">
                      Material Classification Locked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p><strong className="text-slate-400 uppercase text-[10px]">Identified Resource:</strong> {analyzedFeedback.materialName}</p>
                      <p><strong className="text-slate-400 uppercase text-[10px]">Resilience Category:</strong> {analyzedFeedback.category}</p>
                      <p><strong className="text-slate-400 uppercase text-[10px]">Recyclability Metric:</strong> {analyzedFeedback.recyclability}</p>
                      <p><strong className="text-slate-400 uppercase text-[10px]">Hazard Level:</strong> {analyzedFeedback.hazardLevel}</p>
                    </div>

                    <div className="space-y-2">
                      <p><strong className="text-slate-400 uppercase text-[10px]">Drain Block Risk:</strong> {analyzedFeedback.drainageBlockRisk}</p>
                      <p><strong className="text-slate-400 uppercase text-[10px]">Carbon Equivalency Estimate:</strong> {analyzedFeedback.carbonFootprintEstimate}</p>
                      <p><strong className="text-slate-400 uppercase text-[10px]">Eco-Friendly Substitute:</strong> <span className="text-emerald-400 font-semibold">{analyzedFeedback.ecoAlternative}</span></p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <p className="font-sans text-[11px] text-slate-400 uppercase font-bold tracking-wider">Step-by-Step Sorting Guide:</p>
                    <p className="text-slate-300 font-mono text-xs leading-relaxed">{analyzedFeedback.sortingGuide}</p>
                  </div>

                  <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 font-sans text-xs leading-relaxed">
                    <strong>Urban Impact Overview:</strong> {analyzedFeedback.aiAnalysisText}
                  </div>
                </div>
              )}

              {/* Publish Trigger */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs uppercase rounded cursor-pointer transition-all tracking-wider shadow"
                >
                  {isSubmittingReport ? "Publishing Stream..." : "Publish To Live Climate Map"}
                </button>
              </div>

            </form>
          </section>

        </div>

        {/* Right Aspect: AI Expert Assistant & Live Detection Feed - 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* AI ECO CHAT TERM */}
          <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Eco-Intelligence Terminal</h3>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">Expert Agent</span>
            </div>

            {/* Chat message scrolling stream */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 font-sans text-xs no-scroll">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono text-slate-500">
                    <span>{m.sender === "user" ? "Citizen Observer" : "Eco-Intelligence Model"}</span>
                    <span>&middot;</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div
                    className={`p-3 rounded max-w-[90%] leading-relaxed ${
                      m.sender === "user"
                        ? "bg-slate-800 text-slate-100 border border-slate-700 font-mono"
                        : "bg-slate-950/80 border border-slate-800 text-slate-300 whitespace-pre-line"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isChatSending && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                  <span>AI model compiling ecological advice...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Presets / Common concerns */}
            <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/60 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSendChatMessage("How do plastic bags block storm drain systems?")}
                className="text-[9px] font-mono text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded transition text-left"
              >
                # Storm blockages
              </button>
              <button
                type="button"
                onClick={() => handleSendChatMessage("How coordinates tracking pinpoints local floods?")}
                className="text-[9px] font-mono text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded transition text-left"
              >
                # Map patterns
              </button>
            </div>

            {/* Chat Input controls */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendChatMessage();
                }}
                placeholder="Ask our African Climate AI model..."
                className="flex-grow bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
              />
              <button
                type="button"
                onClick={() => handleSendChatMessage()}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold rounded transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>

          {/* ACTIVE HAZARDS FEED / STREAM */}
          <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden flex flex-col flex-grow">
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Hazard Stream</h3>
                <p className="text-[10px] text-slate-500">Citizen verified reports for the current filter</p>
              </div>
              <button
                onClick={loadReports}
                className="p-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="Refresh from node database"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reports List container */}
            <div className="p-4 overflow-y-auto max-h-[480px] space-y-4 no-scroll">
              {filteredReportsList.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 font-mono">No active registered hotspots found in this region.</p>
                </div>
              ) : (
                filteredReportsList.map((rep) => {
                  const isCurSelected = selectedReport?.id === rep.id;
                  
                  return (
                    <div
                      key={rep.id}
                      onClick={() => setSelectedReport(rep)}
                      className={`p-3.5 rounded border transition cursor-pointer flex flex-col gap-2 ${
                        isCurSelected
                          ? "bg-slate-800/80 border-slate-600"
                          : "bg-slate-950/65 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                      } ${
                        rep.status === "Critical" ? "border-l-2 border-l-rose-500" :
                        rep.status === "Resolved" ? "border-l-2 border-l-emerald-500" :
                        "border-l-2 border-l-amber-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">{rep.city}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            rep.status === "Critical" ? "bg-rose-950/85 text-rose-300 border border-rose-800" :
                            rep.status === "Resolved" ? "bg-emerald-950/85 text-emerald-300 border border-emerald-800" :
                            "bg-amber-950/85 text-amber-300 border border-amber-800"
                          }`}>
                            {rep.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white transition-colors hover:text-emerald-400 line-clamp-1">{rep.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{rep.description}</p>
                      </div>

                      {rep.imageUrl && (
                        <div className="w-full h-24 rounded overflow-hidden border border-slate-800 bg-slate-950">
                          <img src={rep.imageUrl} alt="Inspection thumbnail" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-800/40 pt-2 mt-1">
                        <span className="text-[9px] font-mono text-slate-500">
                          COORDS: {rep.lat !== undefined ? `${rep.lat}%, ${rep.lng}%` : "Grid simulated"}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {/* Vote engagement trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(rep.id);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-mono bg-slate-900/90 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded text-slate-300 hover:text-rose-400 transition"
                          >
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                            <span>{rep.likes} Likes</span>
                          </button>

                          {/* Admin Simulator controls */}
                          <select
                            value={rep.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(rep.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[9px] font-mono bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded p-1 transition cursor-pointer"
                          >
                            <option value="Critical">Critical</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Clearing">Clearing</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Policy & Community Awareness Cards */}
          <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              Climate AI Wisdom Board
            </h4>
            <div className="p-3 bg-slate-950/60 border border-slate-850 rounded">
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                💡 <span className="text-emerald-400 font-bold uppercase">PRO TIP:</span> Up to 85% of urban floods in Nairobi and Lagos are attributable directly to clogged street stormwater inlets. Setting up citizens with simple plastic recycling interceptors solves stormwater issues locally.
              </p>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-850 rounded">
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                ⚖️ <span className="text-emerald-400 font-bold uppercase">MARKET PROTOCOL:</span> Accra Municipal strictly rewards neighborhoods with higher recycling conversion factors. Documenting and publishing cleanups counts towards citizen tax deductions!
              </p>
            </div>
          </section>

        </div>

      </main>

      {/* Aesthetic Geometric Bar Status Footer */}
      <footer className="h-12 border-t border-slate-800 px-6 flex items-center justify-between text-[10px] font-mono text-slate-500 bg-[#0B0F19]/95 z-20 mt-auto">
        <div className="flex gap-8 uppercase">
          <span>Node Name: ECO-SENSE-LAG-WEST-04</span>
          <span className="hidden sm:inline">Channel Latency: 42ms</span>
          <span className="hidden md:inline">Synced data load: 1.42 GBs</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="status-dot bg-emerald-400 inline-block w-1.5 h-1.5 rounded-full animate-pulse"></span>
            AI Analytics Core Stable (Gemini v3.5)
          </span>
          <span className="text-slate-400 uppercase">v2.4.0-STABLE</span>
        </div>
      </footer>

    </div>
  );
}
