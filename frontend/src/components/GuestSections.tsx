import { useState } from "react";
import { RateStars } from "./StarRating";

/* House-wide rating: guests can score the whole Raaha experience. */
export function SiteRatingSection() {
  return (
    <section className="home-rating" aria-labelledby="site-rating-title">
      <div className="home-rating__inner">
        <h2 id="site-rating-title" className="home-rating__title">
          How was your <em>Raaha experience?</em>
        </h2>
        <p className="home-rating__copy">
          From the first welcome to the last bite of dessert — tell us how we did. Your stars
          guide our kitchen and help the next guest pick their table.
        </p>
        <RateStars storageKey="site" seedSum={4.7 * 3860} seedCount={3860} noun="Raaha Restaurant & Grill" />
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Do I need to reserve a table, or can I walk in?",
    a: "Walk-ins are always welcome at our Gokhale Road dining room, but weekend and festival nights fill fast. Reserving ahead guarantees your table - and for groups of six or more we always recommend it, so the kitchen can pace the grill and the dum handis for you.",
  },
  {
    q: "Can you host family functions, birthdays or wedding dinners in Madurai?",
    a: "Yes - our upper hall seats up to 80 guests for set menus, and our kitchen caters wedding dinners and office gatherings across Madurai. Share your date and headcount through the reserve page and our team will plan the menu, from starter fries to the kulfi counter, with you.",
  },
  {
    q: "How do I order takeaway or delivery, and track my order?",
    a: "Add dishes to your bag from the menu and check out on the site, or call the counter during opening hours. Once the kitchen fires your order, the tracking page follows it live - packed, on the bike, and at your door - with the rider's distance and ETA.",
  },
  {
    q: "I have allergies or a spice preference - will the kitchen adjust a dish?",
    a: "Of course. Every dish carries a spice level and most can be cooked mild, medium or fiery on request. Tell us about nut, dairy or gluten allergies when you order and the chefs will prepare your plate separately, with clean pans and dedicated oil.",
  },
];

/* Four restaurant-and-guest questions, answered in an accordion. */
export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="home-faq faq" aria-labelledby="faq-title">
      <div className="faq__inner">
        <h2 id="faq-title" className="faq__title">
          Questions <em>we love to answer</em>
        </h2>
        <ul className="faq__list">
          {FAQS.map((entry, index) => {
            const isOpen = open === index;
            return (
              <li key={entry.q} className={`faq__item ${isOpen ? "is-open" : ""}`}>
                <h3 style={{ margin: 0 }}>
                  <button
                    type="button"
                    id={`faq-btn-${index}`}
                    className="faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    onClick={() => setOpen(isOpen ? null : index)}
                  >
                    <span>{entry.q}</span>
                    <span className="faq__chev" aria-hidden="true">
                      +
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-btn-${index}`}
                  className="faq__a"
                  hidden={!isOpen}
                >
                  <p>{entry.a}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
