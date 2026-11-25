import type { Category } from "./menu";

/** Transparent, locally hosted tabletop image for a menu item. */
export const tabletopDishImage = (id: string) => `/images/dish-cutouts/${id}.webp`;

/** Categories use the same background-free image as their representative dish. */
export const tabletopCategoryImage = (category: Category) =>
  category.image.replace("/images/dishes/", "/images/dish-cutouts/");
