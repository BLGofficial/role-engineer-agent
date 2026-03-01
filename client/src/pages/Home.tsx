import { useState, useRef, useEffect, ChangeEvent } from "react";
import {
  Loader2,
  Download,
  RotateCcw,
  Zap,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  Settings,
  Clock,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";


const MASTER_SYSTEM_PROMPT = "You are an elite AI Role Engineering Specialist with 15+ years of expertise in computational linguistics, behavioral AI design, and persona architecture. You create production-ready role-based prompts that transform AI models into highly specialized, contextually appropriate agents. When given a role request, you MUST respond with ONLY a valid JSON object (no markdown, no backticks, no extra text) in this exact structure: {\"roleName\": \"Descriptive role identifier\", \"coreFunction\": \"1-3 sentence summary of what this role does\", \"keyAttributes\": {\"roleFunction\": \"value\", \"expertiseLevel\": \"value\", \"tone\": \"value\", \"communicationStyle\": \"value\", \"coreValues\": \"value\", \"domainFocus\": \"value\"}, \"primaryUseCases\": [\"use case 1\", \"use case 2\", \"use case 3\"], \"antiUseCases\": [\"what NOT to use for 1\", \"what NOT to use for 2\"], \"systemPrompt\": \"Complete production-ready system prompt\", \"userPrompt\": \"Complete structured user prompt template\", \"reuseTemplate\": \"Reusable template version with {{VARIABLE_NAME}} placeholders\", \"example1\": {\"scenario\": \"Scenario\", \"input\": \"Sample query\", \"output\": \"Response\"}, \"example2\": {\"scenario\": \"Scenario\", \"input\": \"Sample query\", \"output\": \"Response\"}, \"evaluatorChecklist\": [\"Question 1\", \"Question 2\", \"Question 3\"], \"usageNotes\": \"Platform-specific guidance\", \"designRationale\": \"Explanation of key decisions\"}";
interface RoleData {
  roleName: string;
  coreFunction: string;
  keyAttributes: Record<string, string>;
  primaryUseCases: string[];
  antiUseCases: string[];
  systemPrompt: string;
  userPrompt: string;
  reuseTemplate: string;
  example1: { scenario: string; input: string; output: string };
  example2: { scenario: string; input: string; output: string };
  evaluatorChecklist: string[];
  usageNotes: string;
  designRationale: string;
}

interface RecentPersona {
  id: string;
  name: string;
  topic: string;
  timestamp: number;
  data: RoleData;
}

function GlassCard({ children, className = "", glow = false, style }: { children: React.ReactNode; className?: string; glow?: boolean; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-2xl border border-orange-500/40 rounded-lg sm:rounded-2xl shadow-lg sm:shadow-2xl transition-all duration-500 hover:border-orange-400/70 hover:bg-white/8 hover:shadow-lg sm:hover:shadow-2xl ${glow ? "animate-glow-pulse" : ""
        } ${className}`}
    >
      {children}
    </div>
  );
}

function PipelineStep({
  label,
  status,
}: {
  label: string;
  status: "pending" | "active" | "complete";
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 animate-fade-in">
      <div
        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 ${status === "complete"
          ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50 animate-pulse-glow"
          : status === "active"
            ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white animate-pulse-glow"
            : "bg-orange-950/40 text-orange-300/60 border border-orange-500/20"
          }`}
      >
        {status === "complete" ? "✓" : status === "active" ? "●" : "○"}
      </div>
      <span
        className={`text-xs sm:text-sm font-semibold transition-all duration-500 ${status === "complete"
          ? "text-orange-300"
          : status === "active"
            ? "text-orange-300 font-bold"
            : "text-orange-200/50"
          }`}
      >
        {label}
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 sm:p-2 hover:bg-orange-500/20 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={14} className="sm:w-4 sm:h-4 text-orange-300 animate-bounce-in" />
      ) : (
        <Copy size={14} className="sm:w-4 sm:h-4 text-orange-200/70 hover:text-orange-300 transition-colors" />
      )}
    </button>
  );
}

export default function Home() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [recentPersonas, setRecentPersonas] = useState<RecentPersona[]>([]);
  const [pipelineStep, setPipelineStep] = useState<"idle" | "received" | "generating" | "review" | "ready">("idle");
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // tRPC mutation for generating role
  const generateRoleMutation = trpc.roleEngine.generate.useMutation();

  // Load recent personas from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentPersonas");
    if (saved) {
      setRecentPersonas(JSON.parse(saved));
    }
  }, []);

  const savePersona = (data: RoleData, topic: string) => {
    const newPersona: RecentPersona = {
      id: Date.now().toString(),
      name: data.roleName,
      topic,
      timestamp: Date.now(),
      data,
    };
    const updated = [newPersona, ...recentPersonas].slice(0, 5);
    setRecentPersonas(updated);
    localStorage.setItem("recentPersonas", JSON.stringify(updated));
  };

  const deletePersona = (id: string) => {
    const updated = recentPersonas.filter((p) => p.id !== id);
    setRecentPersonas(updated);
    localStorage.setItem("recentPersonas", JSON.stringify(updated));
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setRole(e.target.value);
  };

  const handleGenerate = async () => {
    if (!role.trim()) return;
    setLoading(true);
    setError(null);
    setRoleData(null);
    setPipelineStep("received");

    try {
      setPipelineStep("generating");

      const result = await generateRoleMutation.mutateAsync({
        topic: role,
        masterPrompt: MASTER_SYSTEM_PROMPT,
      });

      if (result.success && result.data) {
        setRoleData(result.data);
        savePersona(result.data, role);
        setPipelineStep("ready");
        setCheckedItems({});
      } else {
        throw new Error(result.error || "Failed to generate role");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate role");
      setPipelineStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!roleData) return;
    setDownloading(true);
    try {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      document.head.appendChild(script);

      await new Promise((r) => {
        script.onload = r;
      });

      const JSZip = (window as any).JSZip;
      const zip = new JSZip();
      const folder = zip.folder(roleData.roleName.replace(/\s+/g, "_"));

      folder.file("system_prompt.md", `# ${roleData.roleName} — System Prompt\n\n${roleData.systemPrompt}`);
      folder.file("user_prompt.md", `# ${roleData.roleName} — User Prompt\n\n${roleData.userPrompt}`);
      folder.file("reuse_template.md", `# ${roleData.roleName} — Reusable Template\n\n${roleData.reuseTemplate}`);
      folder.file("examples.md", `# Examples\n\n### Example 1: ${roleData.example1.scenario}\n**Input:** ${roleData.example1.input}\n**Output:** ${roleData.example1.output}\n\n### Example 2: ${roleData.example2.scenario}\n**Input:** ${roleData.example2.input}\n**Output:** ${roleData.example2.output}`);
      folder.file("evaluator_checklist.md", `# Checklist\n\n${roleData.evaluatorChecklist.map((c) => `- [ ] ${c}`).join("\n")}`);
      folder.file("usage_notes.md", `# Usage\n\n${roleData.usageNotes}`);
      folder.file("persona_attributes.md", `# Attributes\n\n${JSON.stringify(roleData.keyAttributes, null, 2)}`);
      folder.file("complete_package.json", JSON.stringify(roleData, null, 2));

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${roleData.roleName.replace(/\s+/g, "_")}_role_package.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("Failed to download ZIP package");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-glow [animation-duration:8s]" />
        <div className="absolute bottom-1/3 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-orange-400/8 rounded-full blur-3xl animate-pulse-glow [animation-duration:10s] [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 w-48 sm:w-72 h-48 sm:h-72 bg-orange-500/8 rounded-full blur-3xl animate-pulse-glow [animation-duration:12s] [animation-delay:4s]" />
      </div>

      <style>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 140, 0, 0.3), inset 0 0 20px rgba(255, 140, 0, 0.1); }
          50% { box-shadow: 0 0 40px rgba(255, 140, 0, 0.6), inset 0 0 30px rgba(255, 140, 0, 0.2); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(255, 140, 0, 0.5), 0 0 20px rgba(255, 140, 0, 0.3); }
          50% { box-shadow: 0 0 20px rgba(255, 140, 0, 0.8), 0 0 40px rgba(255, 140, 0, 0.5); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        [style*="--animation-delay"] {
          animation-delay: var(--animation-delay);
        }
      `}</style>

      <div className="relative z-10 flex flex-col lg:flex-row h-screen overflow-hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-all duration-300"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Sidebar */}
        <div
          className={`fixed lg:static w-64 h-screen border-r border-orange-500/20 bg-black flex flex-col overflow-y-auto transition-all duration-300 z-40 ${sidebarOpen ? "left-0" : "-left-64 lg:left-0"
            }`}
        >
          {/* Logo/Header */}
          <div className="p-4 sm:p-6 border-b border-orange-500/20">
            <div className="flex items-center gap-3 mb-2 animate-fade-in">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/50 animate-pulse-glow">
                <Sparkles size={16} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">AI Engineer</div>
                <div className="text-xs text-orange-400">v1.0</div>
              </div>
            </div>
          </div>

          {/* AI Engineer Card */}
          <div className="p-3 sm:p-4 m-3 sm:m-4 animate-fade-in [animation-delay:0.1s]">
            <GlassCard className="p-3 sm:p-4 glow" glow>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 sm:w-12 h-8 sm:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50 animate-pulse-glow" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white">AI Engineer</div>
                  <div className="text-xs text-orange-300">Active</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse-glow" />
                <span className="text-orange-200 font-semibold">System Ready</span>
              </div>
            </GlassCard>
          </div>

          {/* Recent Personas */}
          <div className="flex-1 px-3 sm:px-4 py-4 sm:py-6 border-t border-orange-500/20">
            <div className="text-xs font-bold text-orange-400 mb-3 flex items-center gap-2">
              <Clock size={12} className="sm:w-4 sm:h-4" />
              RECENT
            </div>
            <div className="space-y-2">
              {recentPersonas.map((persona, idx) => (
                <div
                  key={persona.id}
                  className="group p-2 sm:p-3 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-all duration-300 cursor-pointer relative animate-fade-in hover:shadow-lg hover:shadow-orange-500/30"
                  style={{ "--animation-delay": `${idx * 0.05}s` } as React.CSSProperties}
                  onClick={() => {
                    setRoleData(persona.data);
                    setRole(persona.topic);
                    setPipelineStep("ready");
                    setSidebarOpen(false);
                  }}
                >
                  <div className="text-xs font-semibold text-white truncate pr-6">{persona.name}</div>
                  <div className="text-xs text-orange-200/70 truncate">{persona.topic}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePersona(persona.id);
                    }}
                    title="Delete persona"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Trash2 size={12} className="text-orange-300/60 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="p-3 sm:p-4 border-t border-orange-500/20">
            <button className="w-full flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 transition-all duration-300 text-xs font-semibold text-orange-200 hover:text-white hover:shadow-lg hover:shadow-orange-500/30">
              <Settings size={14} className="sm:w-4 sm:h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Top Bar */}
          <div className="h-12 sm:h-16 border-b border-orange-500/20 bg-black flex items-center px-4 sm:px-8 justify-between animate-slide-up">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Role Engineering</h1>
              <p className="text-xs text-orange-200/70 hidden sm:block">Master Framework Powered</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-right">
              <div className="hidden sm:block">
                <div className="text-xs text-orange-200/70">Status</div>
                <div className="text-sm font-bold text-orange-400 animate-pulse-glow">Ready</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse-glow" />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {/* Input Section */}
              <GlassCard className="p-4 sm:p-8 animate-slide-up" glow>
                <label className="block text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Sparkles size={14} className="sm:w-4 sm:h-4 text-orange-400 animate-pulse-glow" />
                  DESCRIBE YOUR ROLE
                </label>
                <textarea
                  value={role}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) handleGenerate();
                  }}
                  placeholder="A senior data scientist who explains ML concepts..."
                  className="w-full min-h-24 sm:min-h-32 bg-white/5 border border-orange-500/30 rounded-lg sm:rounded-xl text-white text-sm p-3 sm:p-4 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all placeholder-orange-200/40"
                />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3 sm:mt-4">
                  <span className="text-xs text-orange-200/60">{role.length} characters</span>
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !role.trim()}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${loading || !role.trim()
                      ? "bg-orange-950/60 text-orange-200/40 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105 active:scale-95 animate-pulse-glow"
                      }`}
                  >
                    <Zap size={14} className="sm:w-4 sm:h-4" />
                    {loading ? "GENERATING..." : "ENGINEER ROLE"}
                  </button>
                </div>
              </GlassCard>

              {/* Error */}
              {error && (
                <GlassCard className="p-3 sm:p-4 border-red-500/50 bg-red-500/15 animate-slide-up">
                  <p className="text-xs sm:text-sm text-red-200">⚠ {error}</p>
                </GlassCard>
              )}

              {/* Loading */}
              {loading && (
                <GlassCard className="p-8 sm:p-12 flex justify-center animate-slide-up" glow>
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-6 sm:w-8 h-6 sm:h-8 animate-spin text-orange-500" />
                    <p className="text-xs sm:text-sm text-orange-200 font-semibold text-center">Engineering your role with Kimi 2.5 (Groq)...</p>
                  </div>
                </GlassCard>
              )}

              {/* Pipeline Tracker */}
              {roleData && (
                <GlassCard className="p-4 sm:p-6 animate-slide-up overflow-x-auto" glow>
                  <div className="text-xs font-bold text-orange-400 mb-3 sm:mb-4">GENERATION PIPELINE</div>
                  <div className="flex items-center justify-between gap-1 sm:gap-2 min-w-max sm:min-w-0">
                    <PipelineStep label="Received" status={pipelineStep !== "idle" ? "complete" : "pending"} />
                    <ChevronRight size={12} className="sm:w-4 sm:h-4 text-orange-500/50 flex-shrink-0" />
                    <PipelineStep label="Generating" status={pipelineStep === "ready" ? "complete" : pipelineStep === "generating" ? "active" : "pending"} />
                    <ChevronRight size={12} className="sm:w-4 sm:h-4 text-orange-500/50 flex-shrink-0" />
                    <PipelineStep label="Review" status={pipelineStep === "ready" ? "complete" : "pending"} />
                    <ChevronRight size={12} className="sm:w-4 sm:h-4 text-orange-500/50 flex-shrink-0" />
                    <PipelineStep label="Ready" status={pipelineStep === "ready" ? "active" : "pending"} />
                  </div>
                </GlassCard>
              )}

              {/* Results */}
              {roleData && (
                <>
                  {/* Role Header */}
                  <GlassCard className="p-4 sm:p-8 animate-slide-up" glow>
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 break-words">{roleData.roleName}</h2>
                        <p className="text-orange-100 text-xs sm:text-sm leading-relaxed">{roleData.coreFunction}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-2 sm:px-3 py-1 rounded-full bg-orange-500/25 border border-orange-500/50 text-orange-200 text-xs font-semibold animate-pulse-glow whitespace-nowrap">
                          {roleData.keyAttributes.expertiseLevel}
                        </span>
                        <span className="px-2 sm:px-3 py-1 rounded-full bg-orange-400/20 border border-orange-400/40 text-orange-200 text-xs font-semibold animate-pulse-glow whitespace-nowrap">
                          {roleData.keyAttributes.tone}
                        </span>
                      </div>
                    </div>
                  </GlassCard>

                  {/* System Prompt Preview */}
                  <GlassCard className="p-4 sm:p-6 animate-slide-up" glow>
                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                      <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 min-w-0">
                        <Sparkles size={12} className="sm:w-4 sm:h-4 text-orange-400 animate-pulse-glow flex-shrink-0" />
                        <span className="truncate">SYSTEM PROMPT</span>
                      </label>
                      <CopyButton text={roleData.systemPrompt} />
                    </div>
                    <pre className="bg-white/5 border border-orange-500/30 rounded-lg p-3 sm:p-4 text-xs text-orange-100 overflow-x-auto max-h-48 sm:max-h-64 font-mono leading-relaxed">
                      {roleData.systemPrompt}
                    </pre>
                  </GlassCard>

                  {/* Bento Grid - Template Outputs */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* User Message Template */}
                    <GlassCard className="p-4 sm:p-6 animate-slide-up" glow style={{ animationDelay: "0.1s" }}>
                      <label className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 block flex items-center gap-2">
                        <Sparkles size={12} className="sm:w-4 sm:h-4 text-orange-400 animate-pulse-glow" />
                        USER TEMPLATE
                      </label>
                      <pre className="bg-white/5 border border-orange-500/30 rounded-lg p-3 sm:p-4 text-xs text-orange-100 overflow-x-auto max-h-40 sm:max-h-48 font-mono leading-relaxed">
                        {roleData.userPrompt}
                      </pre>
                    </GlassCard>

                    {/* Reusable Template */}
                    <GlassCard className="p-4 sm:p-6 animate-slide-up" glow style={{ animationDelay: "0.15s" }}>
                      <label className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 block flex items-center gap-2">
                        <Sparkles size={12} className="sm:w-4 sm:h-4 text-orange-400 animate-pulse-glow" />
                        REUSABLE
                      </label>
                      <pre className="bg-white/5 border border-orange-500/30 rounded-lg p-3 sm:p-4 text-xs text-orange-100 overflow-x-auto max-h-40 sm:max-h-48 font-mono leading-relaxed">
                        {roleData.reuseTemplate}
                      </pre>
                    </GlassCard>

                    {/* Example Exchanges */}
                    <GlassCard className="p-4 sm:p-6 lg:col-span-2 animate-slide-up" glow style={{ animationDelay: "0.2s" }}>
                      <label className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 block flex items-center gap-2">
                        <Sparkles size={12} className="sm:w-4 sm:h-4 text-orange-400 animate-pulse-glow" />
                        EXAMPLES
                      </label>
                      <div className="space-y-3 sm:space-y-4">
                        {[roleData.example1, roleData.example2].map((ex, i) => (
                          <div key={i} className="bg-white/5 border border-orange-500/30 rounded-lg p-3 sm:p-4 hover:border-orange-500/60 transition-all duration-300">
                            <div className="text-xs font-bold text-orange-400 mb-2">{ex.scenario}</div>
                            <div className="text-xs text-orange-100 mb-2 break-words">
                              <span className="text-orange-400 font-semibold">Input:</span> {ex.input}
                            </div>
                            <div className="text-xs text-orange-100 break-words">
                              <span className="text-orange-400 font-semibold">Output:</span> {ex.output}
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Evaluator Checklist */}
                    <GlassCard className="p-4 sm:p-6 animate-slide-up" glow style={{ animationDelay: "0.25s" }}>
                      <label className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 block flex items-center gap-2">
                        <Sparkles size={12} className="sm:w-4 sm:h-4 text-orange-400 animate-pulse-glow" />
                        CHECKLIST
                      </label>
                      <div className="space-y-2">
                        {roleData.evaluatorChecklist.map((item, i) => (
                          <label key={i} className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={checkedItems[i] || false}
                              onChange={(e) => setCheckedItems((p) => ({ ...p, [i]: e.target.checked }))}
                              className="mt-1 w-3 h-3 sm:w-4 sm:h-4 rounded border-orange-500/50 bg-white/5 accent-orange-500 cursor-pointer flex-shrink-0"
                            />
                            <span className="text-xs sm:text-sm text-orange-100 group-hover:text-white transition-colors duration-300">
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Usage Notes */}
                    <GlassCard className="p-4 sm:p-6 animate-slide-up" glow style={{ animationDelay: "0.3s" }}>
                      <label className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 block flex items-center gap-2">
                        <Sparkles size={12} className="sm:w-4 sm:h-4 text-orange-400 animate-pulse-glow" />
                        NOTES
                      </label>
                      <p className="text-xs sm:text-sm text-orange-100 leading-relaxed max-h-32 overflow-y-auto">
                        {roleData.usageNotes}
                      </p>
                    </GlassCard>
                  </div>

                  {/* Export Card */}
                  <GlassCard className="p-4 sm:p-8 border-orange-400/50 bg-gradient-to-r from-orange-500/20 to-orange-400/10 animate-slide-up" glow>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Ready to Export</h3>
                        <p className="text-xs sm:text-sm text-orange-100">Your complete role package is ready</p>
                      </div>
                      <div className="w-8 sm:w-12 h-8 sm:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 animate-pulse-glow shadow-lg shadow-orange-500/50 flex-shrink-0" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                      {["system_prompt.md", "user_prompt.md", "reuse_template.md", "examples.md", "evaluator_checklist.md", "usage_notes.md", "persona_attributes.md", "complete_package.json"].map((file) => (
                        <div key={file} className="text-center">
                          <div className="text-xs text-orange-400 mb-1 font-semibold">✓</div>
                          <div className="text-xs font-medium text-orange-100 truncate">{file.split(".")[0]}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => {
                          setRoleData(null);
                          setRole("");
                          setError(null);
                          setPipelineStep("idle");
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-orange-500/40 text-orange-200 text-xs sm:text-sm font-bold hover:bg-orange-500/15 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 hover:scale-105 active:scale-95"
                      >
                        <RotateCcw size={14} className="sm:w-4 sm:h-4" />
                        NEW ROLE
                      </button>
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${downloading
                          ? "bg-orange-950/60 text-orange-200/40 cursor-not-allowed"
                          : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105 active:scale-95 animate-pulse-glow"
                          }`}
                      >
                        <Download size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{downloading ? "PREPARING..." : "DOWNLOAD ZIP"}</span>
                        <span className="sm:hidden">{downloading ? "..." : "DOWNLOAD"}</span>
                      </button>
                    </div>
                  </GlassCard>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
