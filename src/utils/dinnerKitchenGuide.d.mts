export interface KitchenSourceStep {
  title: string;
  text: string;
  duration?: string;
  cue?: string;
  mistake?: string;
}
export interface KitchenSourceRecipe {
  slug: string;
  title: string;
  intro: string;
  steps: KitchenSourceStep[];
}
export interface KitchenGuideStep {
  id: string;
  title: string;
  text: string;
  duration: string | null;
  cue: string | null;
  mistake: string | null;
}
export interface KitchenGuideDish {
  slug: string;
  title: string;
  intro: string;
  steps: KitchenGuideStep[];
}
export declare const PILOT_GUIDE_SLUGS: readonly ['amok-trey', 'chek-ktis'];
export declare const PILOT_GUIDE_SIDE_SLUG: 'prahok-ktis';
export declare const AMOK_RAW_EGG_CAUTION: string;
export declare const PRAHOK_RAW_PORK_CAUTION: string;
export declare function buildPilotKitchenGuide(recipes: readonly KitchenSourceRecipe[], includeSide?: boolean): KitchenGuideDish[];
export declare function readGuideStep(dishes: readonly KitchenGuideDish[], slug: string, index: number): { dish: KitchenGuideDish; step: KitchenGuideStep; position: number; total: number };
export declare function getGuideCompletedCount(dish: KitchenGuideDish, completedStepIds: Set<string>): number;
