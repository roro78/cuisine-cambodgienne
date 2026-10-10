import type { DinnerPreviewRecipe, DinnerShoppingItem } from './dinnerPreview.mjs';
import type { DinnerDurationRecipe, DinnerServicePlan } from './dinnerTimeline.mjs';

export interface DinnerPackRecipe extends DinnerPreviewRecipe, DinnerDurationRecipe {
  slug: string;
  equipment?: string[];
}

export interface DinnerPack {
  guests: number;
  includeSide: boolean;
  serviceTime: string;
  menu: { slug: string; title: string }[];
  items: DinnerShoppingItem[];
  timeline: DinnerServicePlan;
  equipment: string[];
  notice: string;
}

export declare const DINNER_PACK_NOTICE: string;
export declare function buildPilotDinnerPack(recipes: readonly DinnerPackRecipe[], guests: number, serviceTime: string, includeSide?: boolean): DinnerPack;
export declare function buildPilotDinnerPackText(pack: DinnerPack): string;
