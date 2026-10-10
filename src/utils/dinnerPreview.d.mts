export interface DinnerPreviewIngredient {
  quantity?: number;
  unit?: string;
  name: string;
  scalable?: boolean;
}
export interface DinnerPreviewRecipe {
  title: string;
  baseServings: number;
  ingredients: DinnerPreviewIngredient[];
}
export interface DinnerShoppingItem {
  name: string;
  unit: string;
  quantity: number | null;
  dishes: string[];
  display: string;
}
export declare const PILOT_SLUGS: readonly ['amok-trey', 'chek-ktis'];
export declare const PILOT_SIDE_SLUG: 'prahok-ktis';
export declare function formatPreviewQuantity(value: number): string;
export declare function buildPilotShoppingList(
  selectedRecipes: readonly DinnerPreviewRecipe[],
  guests: number
): DinnerShoppingItem[];
export declare function buildShoppingListText(
  items: readonly DinnerShoppingItem[],
  guests: number,
  dishTitles?: readonly string[]
): string;
