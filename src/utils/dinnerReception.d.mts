import type { DinnerPack, DinnerPackRecipe } from './dinnerPack.mjs';
export interface ReceptionTask { id: string; label: string; }
export interface ReceptionChapter {
  id: string; number: string; eyebrow: string; title: string; description: string; tasks: ReceptionTask[]; lesson: string;
}
export interface ReceptionNotebook {
  guests: number; serviceTime: string; includeSide: boolean;
  pack: DinnerPack; chapters: ReceptionChapter[]; tasksCount: number;
  dessertMinutes: number; sideMinutes: number | null;
  status: string; safety: string; validation: string;
}
export declare const RECEPTION_STATUS: string;
export declare const RECEPTION_SIDE_NOTE: string;
export declare const RECEPTION_SAFETY: string;
export declare const RECEPTION_VALIDATION: string;
export declare function buildReceptionNotebook(
  recipes: readonly DinnerPackRecipe[],
  options?: { guests?: number; serviceTime?: string; includeSide?: boolean }
): ReceptionNotebook;
export declare function getNotebookProgress(
  notebook: ReceptionNotebook,
  checkedKeys: Set<string>
): {done: number; total: number; percentage: number};
