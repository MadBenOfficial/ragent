import type { AgentTemplate } from "../types";
import { ModalShell } from "./ModalShell";

interface TemplatePreviewModalProps {
  template: AgentTemplate | null;
  onClose: () => void;
  onUse: (template: AgentTemplate) => void;
}

export function TemplatePreviewModal({ template, onClose, onUse }: TemplatePreviewModalProps) {
  return (
    <ModalShell open={!!template} title={template?.name ?? ""} subtitle="Template preview." onClose={onClose}>
      {template ? (
        <div className="grid gap-4">
          <div className="rounded-lg border border-blue-300/12 bg-slate-950/42 p-4 text-sm text-slate-300">
            <p><span className="text-slate-500">Recommended agent type:</span> {template.recommendedType === "sovereign" ? "Sovereign Agent" : "Persistent Agent"}</p>
            <p className="mt-2"><span className="text-slate-500">Estimated monthly cost:</span> {template.cost}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-blue-100">Capabilities</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{template.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
          </div>
          <div className="rounded-lg border border-blue-300/12 bg-slate-950/42 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-blue-100">Example Mission</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{template.mission}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="small-action">Cancel</button>
            <button onClick={() => onUse(template)} className="small-action">Use This Template</button>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
