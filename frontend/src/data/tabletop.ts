import type { Category } from "./menu";
import { INSTA_CATEGORY_ART } from "./instagram";

/** Category plates show the representative dish photograph with its background
    removed (transparent cut-outs in `public/images/dish-cutouts/`). */

export const tabletopCategoryImage = (category: Category) =>
  category.image.replace("/images/dishes/", "/images/dish-cutouts/");

/* Instagram-backed category artwork: once the owner uploads real photos
   from the restaurant feed and lists them in INSTA_CATEGORY_ART, the
   category plates switch over automatically. */
export const categoryArtFor = (category: Category): string =>
  INSTA_CATEGORY_ART[category.id] ?? tabletopCategoryImage(category);
