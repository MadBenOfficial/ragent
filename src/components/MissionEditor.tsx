import { missionLines } from "../data/seedData";
import { GlassCard } from "./GlassCard";
import { SectionHeader } from "./SectionHeader";

interface MissionEditorProps {
  profileName: string;
  mission: string;
  onMissionChange: (mission: string) => void;
}

export function MissionEditor({ profileName, mission, onMissionChange }: MissionEditorProps) {
  const previewLines = mission.trim().length
    ? mission.split("\n")
    : missionLines.map((line, index) => (index === 0 ? `You are ${profileName || "your agent"}.` : line));

  return (
    <GlassCard className="p-4">
      <SectionHeader number="4" title="Mission & Behavior" subtitle="Define the purpose and behavioral directives of your agent. This text becomes the agent prompt." />
      <textarea
        value={mission}
        onChange={(event) => onMissionChange(event.target.value)}
        placeholder={`You are ${profileName || "your agent"}. Describe the mission, objectives, and behavioral directives...`}
        className="input mt-4 min-h-[120px] w-full resize-y font-mono text-[11px] leading-5"
        aria-label="Agent mission and behavior directive"
      />
      <div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-slate-500">System directive preview</div>
      <div className="mt-1.5 rounded-lg border border-blue-300/12 bg-slate-950/54 p-2.5 font-mono text-[11px] leading-5 text-slate-300">
        {previewLines.map((line, index) => (
          <div key={`${index}-${line}`} className="grid grid-cols-[22px_1fr] gap-3">
            <span className="text-right text-slate-600">{index + 1}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
