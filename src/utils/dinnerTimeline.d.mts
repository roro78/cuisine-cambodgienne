export interface DinnerDurationRecipe {
  title: string;
  prepTime: string;
  cookTime: string;
}
export interface DinnerTimelineStep {
  id: string;
  time: string;
  title: string;
  description: string;
}
export interface DinnerServicePlan {
  main: string;
  dessert: string;
  prepMinutes: number;
  cookMinutes: number;
  marginMinutes: number;
  dessertPrepMinutes: number;
  dessertCookMinutes: number;
  servingTime: string;
  steps: DinnerTimelineStep[];
}
export declare const SERVICE_TIMES: readonly string[];
export declare const PLANNING_MARGIN_MINUTES: number;
export declare function readRecipeDuration(value: string): number;
export declare function displayClock(minutes: number): string;
export declare function buildPilotServicePlan(mainRecipe: DinnerDurationRecipe, dessertRecipe: DinnerDurationRecipe, servingTime: string, bufferMinutes?: number): DinnerServicePlan;
