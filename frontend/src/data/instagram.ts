/* Collected from the restaurant's own Instagram profile
   (instagram.com/raaharestaurant) on 2026-11-28 via page metadata.
   Media binaries cannot be downloaded into this workspace (Instagram's
   CDN is unreachable from the build environment); once the owner drops
   the matching files into public/media/insta/ (named by post id), the
   gallery and reel sections can bind to them. Captions, dates and
   engagement below are the real post metadata. */

export interface InstaPost {
  id: string;
  url: string;
  date: string;
  likes: number;
  comments: number;
  plays?: number;
  kind: "reel" | "photos";
  caption: string;
  /* Optional local media slot, filled when the owner uploads files. */
  media?: string;
}

export const INSTA_HANDLE = "raaharestaurant";
export const INSTA_PROFILE = "https://www.instagram.com/raaharestaurant";
export const INSTA_BIO = [
  "Restaurant and grill",
  "Arabic | Chinese | Indian | Mandi | Cafe",
  "Opening time: 11.30am to 11.30pm",
  "Madurai · Coimbatore · Coming soon Kerala",
];
export const INSTA_FOLLOWERS = 1573;


/* Representative stand-in visuals from the restaurant's credited menu
   photography, used until the matching Instagram file is uploaded. */
export const INSTA_STAND_INS: Record<string, string> = {
  "DgFU2p-GAWD": "/images/dishes/kulfi-falooda.webp",
  "DgALNlchFsQ": "/images/raaha-dining-room.jpg",
  "DgAGIfMhz5B": "/images/dishes/prawn-biryani.webp",
  "Df4jGSSvqev": "/images/dishes/mutton-biryani.webp",
  "DfzPS3gvicy": "/images/dishes/jalebi-rabri.webp",
  "Dfysj0oPkNK": "/images/dishes/tandoori-chicken.webp",
  "Dftb-4tPecV": "/images/dishes/mango-lassi.webp",
  "DfriCwUPw7k": "/images/dishes/charcoal-grill-chicken.webp",
  "DfhQnVJvqx4": "/images/dishes/mixed-grill-platter.webp",
  "DfZhg_EPamB": "/images/dishes/charcoal-grill-chicken.webp",
  "Deg3HQ9v4uk": "/images/dishes/jalebi-rabri.webp",
  "DfPKx6QP3La": "/images/dishes/butter-chicken.webp",
};

/* Owner upload binding: drop the Instagram file into
   public/media/insta/ and add one line here, e.g.
   "Df4jGSSvqev": "/media/insta/Df4jGSSvqev.mp4"
   Reels may be .mp4/.webm; photos .jpg/.webp. Tiles and, via
   categoryArtFor, category plates switch over automatically. */
export const INSTA_MEDIA: Record<string, string> = {
  // Real restaurant photography retrieved from the brand's public
  // listings and Instagram mirrors on 2026-11-28 (owner-directed).
  "DgALNlchFsQ": "/images/insta/dining-hall-night.jpg",
  "Df4jGSSvqev": "/images/insta/biryani-platter.webp",
  "Dfysj0oPkNK": "/images/insta/entrance-sign.jpg",
  "Dftb-4tPecV": "/images/insta/dining-hall-day.jpg",
  "DfriCwUPw7k": "/images/insta/kozi-doi-card.jpg",
};

/* Optional category artwork overrides backed by uploaded Instagram
   photos, e.g. "biryani": "/media/insta/mandi-reel-frame.jpg". */
export const INSTA_CATEGORY_ART: Record<string, string> = {};

export const instaMediaFor = (post: InstaPost): string =>
  INSTA_MEDIA[post.id] ?? INSTA_STAND_INS[post.id] ?? "/images/food-unavailable.svg";

export const INSTA_POSTS: InstaPost[] = [
  {
    id: "DgFU2p-GAWD",
    url: "https://instagram.com/p/DgFU2p-GAWD",
    date: "2026-11-23",
    likes: 21,
    comments: 0,
    kind: "photos",
    caption:
      "Three desserts, three different moods, one sweet destination! From the refreshing taste of Tender Coconut Falooda…",
  },
  {
    id: "DgALNlchFsQ",
    url: "https://instagram.com/p/DgALNlchFsQ",
    date: "2026-11-21",
    likes: 103,
    comments: 7,
    plays: 3284,
    kind: "reel",
    caption:
      "Good food, warm ambience, and beautiful moments with your favourite people! Some evenings are best spent around a table…",
  },
  {
    id: "DgAGIfMhz5B",
    url: "https://instagram.com/p/DgAGIfMhz5B",
    date: "2026-11-21",
    likes: 29,
    comments: 0,
    kind: "photos",
    caption:
      "Seafood lovers, this platter is calling your name! A little bit of everything, a whole lot of flavour!",
  },
  {
    id: "Df4jGSSvqev",
    url: "https://instagram.com/p/Df4jGSSvqev",
    date: "2026-11-18",
    likes: 152,
    comments: 16,
    plays: 3988,
    kind: "reel",
    caption:
      "Good mandi starts long before it reaches your table! From carefully marinated meat to perfectly cooked, flavourful rice…",
  },
  {
    id: "DfzPS3gvicy",
    url: "https://instagram.com/p/DfzPS3gvicy",
    date: "2026-11-16",
    likes: 63,
    comments: 0,
    plays: 2133,
    kind: "reel",
    caption:
      "Some cravings don't need a reason! Layers of sweetness, creamy goodness and a little crunch in every spoonful.",
  },
  {
    id: "Dfysj0oPkNK",
    url: "https://instagram.com/p/Dfysj0oPkNK",
    date: "2026-11-16",
    likes: 29,
    comments: 0,
    kind: "photos",
    caption:
      "Coimbatore, something delicious is on its way! A new destination for food lovers, a new chapter of flavours.",
  },
  {
    id: "Dftb-4tPecV",
    url: "https://instagram.com/p/Dftb-4tPecV",
    date: "2026-11-14",
    likes: 61,
    comments: 3,
    plays: 1798,
    kind: "reel",
    caption: "Happy Children's Day!",
  },
  {
    id: "DfriCwUPw7k",
    url: "https://instagram.com/p/DfriCwUPw7k",
    date: "2026-11-13",
    likes: 54,
    comments: 4,
    plays: 992,
    kind: "reel",
    caption:
      "Nothing makes us happier than seeing our customers enjoy every bite! Real experiences, genuine smiles and flavours worth sharing.",
  },
  {
    id: "DfhQnVJvqx4",
    url: "https://instagram.com/p/DfhQnVJvqx4",
    date: "2026-11-09",
    likes: 26,
    comments: 0,
    kind: "photos",
    caption:
      "Coimbatore, get ready for a delicious new experience! Something special is on its way.",
  },
  {
    id: "DfZhg_EPamB",
    url: "https://instagram.com/p/DfZhg_EPamB",
    date: "2026-11-06",
    likes: 99,
    comments: 1,
    plays: 2615,
    kind: "reel",
    caption:
      "From the sizzling shawarma spit to the first delicious bite! Watch the magic behind Raaha's Special Shawarma, freshly prepared with flavour in every layer.",
  },
  {
    id: "Deg3HQ9v4uk",
    url: "https://instagram.com/p/Deg3HQ9v4uk",
    date: "2026-10-15",
    likes: 19,
    comments: 0,
    kind: "photos",
    caption:
      "Savour the rich, golden goodness of Arabian Kunafa at Raaha — where every bite is a sweet masterpiece.",
  },
  {
    id: "DfPKx6QP3La",
    url: "https://instagram.com/p/DfPKx6QP3La",
    date: "2026-11-02",
    likes: 21,
    comments: 0,
    kind: "photos",
    caption:
      "A bowl full of warmth, rich flavours, and pure comfort! Craving something delicious? Indulge in Raaha's signature bowls.",
  },
];
