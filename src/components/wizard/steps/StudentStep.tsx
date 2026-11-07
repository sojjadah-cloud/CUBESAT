"use client";

import { useLocale } from "@/components/LocaleProvider";
import { SelectField, StepHeading, TextField } from "@/components/ui/fields";
import { useWizard } from "@/components/wizard/context";
import { ACADEMIC_LEVELS, DEPARTMENTS, OTHER } from "@/lib/institution";
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

  const dept = DEPARTMENTS.find((d) => d.id === data.department);
  const specOptions = [
    ...(dept?.specialisations ?? []).map((o) => ({ value: o.id, label: o[locale] })),
    ...(data.department ? [{ value: OTHER, label: t.common.other }] : []),
  ];

  const studentIdHint = rules.studentIdHint?.[locale];
  const emailHint = rules.emailDomains.length
    ? s.emailHintDomains(rules.emailDomains.map((d) => `@${d}`).join(" / "))
    : s.emailHintAny;

  return (
    <div>
      <StepHeading title={s.title} />
      <div className="panel grid gap-x-5 gap-y-6 p-5 sm:grid-cols-2 sm:p-7">
        <TextField {...bind("fullName")} label={s.fullName} autoComplete="name" maxLength={120} className="sm:col-span-2" />
        <TextField {...bind("studentId")} label={s.studentId} hint={studentIdHint} autoComplete="off" ltr maxLength={40} />
        <SelectField
          {...bind("academicLevel")}
          label={s.academicLevel}
          options={ACADEMIC_LEVELS.map((o) => ({ value: o.id, label: o[locale] }))}
        />
        <SelectField
          {...bind("department")}
          onChange={(v) => update({ department: v, specialisation: "", specialisationOther: "", departmentOther: v === OTHER ? data.departmentOther : "" })}
          label={s.department}
          options={[...DEPARTMENTS.map((o) => ({ value: o.id, label: o[locale] })), { value: OTHER, label: t.common.other }]}
        />
        {data.department === OTHER ? (
          <TextField {...bind("departmentOther")} label={s.departmentOther} maxLength={120} />
        ) : (
          <div className="hidden sm:block" aria-hidden="true" />
        )}
        <SelectField
          {...bind("specialisation")}
          onChange={(v) => update({ specialisation: v, specialisationOther: v === OTHER ? data.specialisationOther : "" })}
          label={s.specialisation}
          options={specOptions}
          disabled={!data.department}
          placeholder={data.department ? undefined : s.specialisationFirst}
        />
        {data.specialisation === OTHER ? (
          <TextField {...bind("specialisationOther")} label={s.specialisationOther} maxLength={120} />
        ) : (
          <div className="hidden sm:block" aria-hidden="true" />
        )}
        <TextField {...bind("phone")} label={s.phone} hint={s.phoneHint} type="tel" inputMode="tel" autoComplete="tel" ltr maxLength={30} />
        <TextField {...bind("email")} label={s.email} hint={emailHint} type="email" inputMode="email" autoComplete="email" ltr maxLength={160} />
      </div>
    </div>
  );
}
