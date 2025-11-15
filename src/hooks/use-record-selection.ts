"use client";

import { create } from "zustand";

type Selection = {
  studentId?: number;
  studentName?: string;
  lessonDayId?: number;
  lessonLabel?: string;
};

type RecordSelectionStore = {
  selection: Selection;
  setSelection: (selection: Selection) => void;
};

export const useRecordSelection = create<RecordSelectionStore>((set) => ({
  selection: {},
  setSelection: (selection) => set({ selection }),
}));
