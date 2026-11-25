import type { Category } from "./menu";

/** Category plates show the representative dish photograph with its background
    removed (transparent cut-outs in `public/images/dish-cutouts/`). */
export const tabletopCategoryImage = (category: Category) =>
  category.image.replace("/images/dishes/", "/images/dish-cutouts/");
