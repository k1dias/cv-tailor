"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { Resume, Experience, SkillGroup } from "@/lib/schema/resume";

interface Props {
  value: Resume;
  onChange: (r: Resume) => void;
}

/**
 * Editor inline do CV adaptado. Controlado: toda alteração emite um novo
 * Resume para o pai (usado no export e no preview do template).
 */
export function ResumeEditor({ value, onChange }: Props) {
  const set = (patch: Partial<Resume>) => onChange({ ...value, ...patch });

  const setContact = (patch: Partial<Resume["contact"]>) =>
    set({ contact: { ...value.contact, ...patch } });

  const setExperience = (i: number, patch: Partial<Experience>) => {
    const experience = value.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    set({ experience });
  };

  const addExperience = () =>
    set({
      experience: [
        ...value.experience,
        { company: "", title: "", start: "", current: false, bullets: [""] },
      ],
    });

  const removeExperience = (i: number) =>
    set({ experience: value.experience.filter((_, idx) => idx !== i) });

  const setSkillGroup = (i: number, patch: Partial<SkillGroup>) => {
    const skills = value.skills.map((g, idx) => (idx === i ? { ...g, ...patch } : g));
    set({ skills });
  };

  return (
    <div className="grid gap-6">
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Contato
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Nome" value={value.contact.name} onChange={(v) => setContact({ name: v })} />
          <Field
            label="E-mail"
            value={value.contact.email ?? ""}
            onChange={(v) => setContact({ email: v })}
          />
          <Field
            label="Telefone"
            value={value.contact.phone ?? ""}
            onChange={(v) => setContact({ phone: v })}
          />
          <Field
            label="Localização"
            value={value.contact.location ?? ""}
            onChange={(v) => setContact({ location: v })}
          />
        </div>
      </fieldset>

      <div className="grid gap-2">
        <Label>Resumo</Label>
        <Textarea
          className="min-h-24"
          value={value.summary}
          onChange={(e) => set({ summary: e.target.value })}
        />
      </div>

      <Separator />

      <fieldset className="grid gap-4">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Experiência
          </legend>
          <Button type="button" size="sm" variant="outline" onClick={addExperience}>
            + Adicionar
          </Button>
        </div>
        {value.experience.map((e, i) => (
          <div key={i} className="grid gap-2 rounded-md border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Cargo" value={e.title} onChange={(v) => setExperience(i, { title: v })} />
              <Field
                label="Empresa"
                value={e.company}
                onChange={(v) => setExperience(i, { company: v })}
              />
              <Field
                label="Início"
                value={e.start}
                onChange={(v) => setExperience(i, { start: v })}
              />
              <Field
                label="Fim"
                value={e.end ?? ""}
                onChange={(v) => setExperience(i, { end: v })}
                disabled={e.current}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={e.current}
                onCheckedChange={(v) => setExperience(i, { current: v, end: v ? undefined : e.end })}
              />
              <Label className="text-sm">Emprego atual</Label>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Bullets (um por linha)</Label>
              <Textarea
                className="min-h-24"
                value={e.bullets.join("\n")}
                onChange={(ev) =>
                  // mantém linhas (inclusive vazias) durante a edição; limpeza no export
                  setExperience(i, { bullets: ev.target.value.split("\n") })
                }
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="justify-self-start text-destructive"
              onClick={() => removeExperience(i)}
            >
              Remover experiência
            </Button>
          </div>
        ))}
      </fieldset>

      <Separator />

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Skills
        </legend>
        {value.skills.map((g, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[200px_1fr]">
            <Field
              label="Categoria"
              value={g.category ?? ""}
              onChange={(v) => setSkillGroup(i, { category: v })}
            />
            <Field
              label="Itens (separados por vírgula)"
              value={g.items.join(", ")}
              onChange={(v) =>
                setSkillGroup(i, { items: v.split(",").map((s) => s.trim()).filter(Boolean) })
              }
            />
          </div>
        ))}
      </fieldset>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
