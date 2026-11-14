import { AppProvider, useApp } from "./store/app";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/HomePage";
import { MenuPage } from "./components/MenuPage";
import { CategoryPage } from "./components/CategoryPage";
import { FoodPage } from "./components/FoodPage";
import { AboutPage } from "./components/AboutPage";
import { ServicesPage } from "./components/ServicesPage";
import { ReservePage } from "./components/ReservePage";
import { CartPage } from "./components/CartPage";
import { TrackingPage } from "./components/TrackingPage";
import {
  AccountModal,
  CheckoutModal,
  SearchOverlay,
  Toasts,
} from "./components/Modals";

function Pages() {
  const { route } = useApp();

  switch (route.page) {
    case "menu":
      return <MenuPage />;
    case "about":
      return <AboutPage />;
    case "services":
      return <ServicesPage />;
    case "reserve":
      return <ReservePage />;
    case "cart":
      return <CartPage />;
    case "tracking":
      return <TrackingPage />;
    case "category":
      return <CategoryPage key={route.id} categoryId={route.id ?? ""} />;
    case "food":
      return <FoodPage key={route.id} itemId={route.id ?? ""} />;
    case "home":
    default:
      return <HomePage />;
  }
}

function Shell() {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <Pages />
      <Footer />
      {/* Overlays */}
      <SearchOverlay />
      <AccountModal />
      <CheckoutModal />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
