"use client";

import { useLocale } from "@/components/LocaleProvider";
import { SelectField, StepHeading, TextField } from "@/components/ui/fields";
import { useWizard } from "@/components/wizard/context";
import { ACADEMIC_LEVELS, DEPARTMENTS } from "@/lib/institution";
import type { ApplicationData } from "@/lib/application";

export function StudentStep() {
  const { t, locale } = useLocale();
  const { data, update, err, touch, rules } = useWizard();
  const s = t.student;

  const bind = (key: keyof ApplicationData) => ({
    name: key,
    value: data[key] as string,
    onChange: (v: string) => update({ [key]: v } as Partial<ApplicationData>),
    onBlur: () => touch(key),
    error: err(key),
  });

  return (
    <div>
      <StepHeading title={s.title} />
      <div className="panel grid gap-x-5 gap-y-6 p-5 sm:grid-cols-2 sm:p-7">
        <TextField {...bind("fullName")} label={s.fullName} placeholder={s.ph.fullName} autoComplete="name" maxLength={120} className="sm:col-span-2" />
        <TextField
          {...bind("studentId")}
          label={s.studentId}
          hint={rules.studentIdHint?.[locale]}
          placeholder={s.ph.studentId}
          autoComplete="off"
          ltr
          maxLength={40}
        />
        <TextField {...bind("phone")} label={s.phone} hint={s.phoneHint} placeholder={s.ph.phone} type="tel" inputMode="tel" autoComplete="tel" ltr maxLength={30} />
        <SelectField
          {...bind("academicLevel")}
          label={s.academicLevel}
          options={ACADEMIC_LEVELS.map((o) => ({ value: o.id, label: o[locale] }))}
        />
        <SelectField
          {...bind("department")}
          label={s.department}
          options={DEPARTMENTS.map((o) => ({ value: o.id, label: o[locale] }))}
        />
        <TextField {...bind("specialisation")} label={s.specialisation} placeholder={s.ph.specialisation} maxLength={120} className="sm:col-span-2" />
      </div>
    </div>
  );
}
