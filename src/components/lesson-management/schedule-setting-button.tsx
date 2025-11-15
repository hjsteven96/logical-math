"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { ScheduleSettingModal } from "./schedule-setting-modal";

type Props = {
  defaultSetting: {
    weekdays: number[];
    startTimeMinutes: number;
    endTimeMinutes: number;
    lessonDurationMinutes: number;
    breakDurationMinutes: number;
  } | null;
};

export function ScheduleSettingButton({ defaultSetting }: Props) {
  const [showModal, setShowModal] = useState(false);

  if (!defaultSetting) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <Settings className="h-4 w-4" />
        수업 시간 설정
      </button>
      {showModal && (
        <ScheduleSettingModal
          defaultSetting={defaultSetting}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

