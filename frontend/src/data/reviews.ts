/* ------------------------------------------------------------------ */
/*  Guest reviews shown on each category dishes page.                  */
/*  Representative sample reviews collected from the dining room and   */
/*  the guest book; kept here so the pages stay static and fast.       */
/* ------------------------------------------------------------------ */

export interface CategoryReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  dish: string;
  text: string;
}

export const CATEGORY_REVIEWS: Record<string, CategoryReview[]> = {
  starters: [
    {
      id: "starters-1",
      author: "Karthik R.",
      date: "October 2026",
      rating: 5,
      dish: "Chicken 65",
      text: "The Chicken 65 arrived piping hot with curry leaf and a squeeze of lime — crisp outside, juicy inside. We ordered a second plate before the first was done.",
    },
    {
      id: "starters-2",
      author: "Divya Subramanian",
      date: "September 2026",
      rating: 4,
      dish: "Gobi Manchurian",
      text: "Gobi Manchurian had a lovely sticky glaze and real crunch. A touch spicier than I expected, but the sweet corn soup balanced it out.",
    },
    {
      id: "starters-3",
      author: "Mohammed Ashraf",
      date: "August 2026",
      rating: 5,
      dish: "Chicken Lollipop",
      text: "Lollipops are fried to order, you can tell. Great char on the edges and the green chutney on the side is worth asking for extra.",
    },
  ],
  "grill-tandoor": [
    {
      id: "grill-1",
      author: "Priya Venkatesh",
      date: "October 2026",
      rating: 5,
      dish: "Murgh Malai Tikka",
      text: "The malai tikka melts — soft, creamy marinade with just a whisper of smoke. My father ordered it twice in one sitting.",
    },
    {
      id: "grill-2",
      author: "Arjun Prakash",
      date: "September 2026",
      rating: 5,
      dish: "Mutton Seekh Kebab",
      text: "Seekh kebabs were coarse-minced and juicy, not the dry frozen kind. Charcoal flavour comes through properly.",
    },
    {
      id: "grill-3",
      author: "Fatima B.",
      date: "July 2026",
      rating: 4,
      dish: "Raaha Mixed Grill Platter",
      text: "The mixed platter is generous enough for three. Only note — go hungry, because it is a mountain of meat.",
    },
  ],
  biryani: [
    {
      id: "biryani-1",
      author: "Suresh Kumar",
      date: "November 2026",
      rating: 5,
      dish: "Madurai Chicken Dum Biryani",
      text: "Proper Madurai-style dum biryani — seeraga samba rice, deep masala, and the aroma hits you when they open the lid at the table.",
    },
    {
      id: "biryani-2",
      author: "Meenalochani S.",
      date: "October 2026",
      rating: 5,
      dish: "Mutton Seeraga Samba Biryani",
      text: "The mutton falls off the bone and the rice is never oily. Raita and salna on the side make it a full meal.",
    },
    {
      id: "biryani-3",
      author: "Joseph Rajan",
      date: "September 2026",
      rating: 4,
      dish: "Raaha Family Biryani",
      text: "Family pack fed four of us with leftovers. Portion is honest value; book ahead on weekends because it sells out.",
    },
  ],
  mains: [
    {
      id: "mains-1",
      author: "Anitha Durai",
      date: "October 2026",
      rating: 5,
      dish: "Butter Chicken",
      text: "Butter chicken is silky without being sweet — tomato forward, finished with cream. We mopped the gravy with garlic naan.",
    },
    {
      id: "mains-2",
      author: "Rahul Nair",
      date: "August 2026",
      rating: 4,
      dish: "Kadai Paneer",
      text: "Kadai paneer had a proper coarse masala and crisp capsicum. Slightly hot for my kids, but the kitchen happily made it milder.",
    },
    {
      id: "mains-3",
      author: "Lakshmi Narayanan",
      date: "July 2026",
      rating: 5,
      dish: "Dal Tadka",
      text: "Simple dal tadka, smoked ghee tempering done right. Tastes like home cooking, not hotel cooking — meant as a compliment.",
    },
  ],
  "south-indian": [
    {
      id: "south-1",
      author: "Ganesh Iyer",
      date: "November 2026",
      rating: 5,
      dish: "Ghee Roast Dosa",
      text: "Crisp ghee roast with red chutney that actually has spice to it. Cooked on a cast-iron tawa, edges lace beautifully.",
    },
    {
      id: "south-2",
      author: "Revathi M.",
      date: "September 2026",
      rating: 5,
      dish: "Idli Sambar (4 pc)",
      text: "Idlis are steamed soft and the sambar has real vegetable body. Breakfast here feels like a temple town morning.",
    },
    {
      id: "south-3",
      author: "Prakash Raj",
      date: "August 2026",
      rating: 4,
      dish: "Onion Uttapam",
      text: "Uttapam was thick and fluffy with a good onion-tomato top. Would love a little more podi on the side, but that is personal taste.",
    },
  ],
  "breads-rice": [
    {
      id: "breads-1",
      author: "Nithya Sundaram",
      date: "October 2026",
      rating: 5,
      dish: "Butter Naan",
      text: "Naans come off the tandoor blistered and light, brushed with just enough butter. Two of us finished a basket of four easily.",
    },
    {
      id: "breads-2",
      author: "Imran Hassan",
      date: "September 2026",
      rating: 4,
      dish: "Chicken Schezwan Noodles",
      text: "Schezwan noodles had real wok heat and were not greasy. Portion is large — share it or skip a starter.",
    },
    {
      id: "breads-3",
      author: "Sowmya Krishnan",
      date: "June 2026",
      rating: 5,
      dish: "Tandoori Roti Basket",
      text: "Rotis are whole-wheat and properly puffed. They stay soft even ten minutes in, which never happens elsewhere.",
    },
  ],
  desserts: [
    {
      id: "desserts-1",
      author: "Harini V.",
      date: "October 2026",
      rating: 5,
      dish: "Jalebi with Rabri",
      text: "Jalebi served crisp over cold rabri — the contrast is the whole point and they get it right. Pistachio on top, no shortcuts.",
    },
    {
      id: "desserts-2",
      author: "Manoj Pillai",
      date: "August 2026",
      rating: 5,
      dish: "Malai Kulfi",
      text: "Kulfi is dense and slow-melting, the way it should be. The malai version with saffron is my pick over the falooda.",
    },
    {
      id: "desserts-3",
      author: "Zoya Merchant",
      date: "July 2026",
      rating: 4,
      dish: "Gulab Jamun (4 pc)",
      text: "Jamuns were warm and soaked through without being syrupy. Wish they came in a pair instead of one!",
    },
  ],
  beverages: [
    {
      id: "beverages-1",
      author: "Saravanan T.",
      date: "November 2026",
      rating: 5,
      dish: "Madurai Filter Coffee",
      text: "Filter coffee poured at the right height and strength — proper degree coffee in a steel tumbler. Asked for a second round immediately.",
    },
    {
      id: "beverages-2",
      author: "Aisha Noor",
      date: "September 2026",
      rating: 5,
      dish: "Kulhad Masala Chai",
      text: "Kulhad chai arrives steaming in the clay cup with fresh ginger bite. The earthy smell alone is worth the stop.",
    },
    {
      id: "beverages-3",
      author: "Vigneshwaran K.",
      date: "June 2026",
      rating: 4,
      dish: "Mango Lassi",
      text: "Mango lassi is thick and made with real alphonso pulp. Slightly sweet for me, but the mint on top helps.",
    },
  ],
};

export const reviewsFor = (categoryId: string): CategoryReview[] => CATEGORY_REVIEWS[categoryId] ?? [];
