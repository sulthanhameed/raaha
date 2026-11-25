import { AppProvider, useApp } from "./store/app";
import { MenuProvider } from "./store/menu";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/HomePage";
import { MenuPage } from "./components/MenuPage";
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
import { CartFlightLayer } from "./components/CartFlightLayer";
import { RouteCurtain } from "./components/RouteCurtain";
import { usePointerFeedback } from "./utils/usePointerFeedback";
import { useSectionLights } from "./utils/useSectionLights";

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
    case "food":
      return <FoodPage key={route.id} itemId={route.id ?? ""} />;
    case "home":
    default:
      return <HomePage />;
  }
}

function Shell() {
  const { route } = useApp();
  const routeKey = `${route.page}/${route.id ?? ""}`;
  // Delegated pointer feedback and the per-banner light pool are decorative.
  usePointerFeedback();
  useSectionLights(routeKey);
  return (
    <div className="min-h-dvh">
      <Navbar />
      <div key={routeKey} className="route-arrival">
        <Pages />
      </div>
      <Footer />
      {/* Overlays */}
      <SearchOverlay />
      <AccountModal />
      <CheckoutModal />
      <Toasts />
      <RouteCurtain routeKey={routeKey} />
      <CartFlightLayer />
    </div>
  );
}

export default function App() {
  return (
    <MenuProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </MenuProvider>
  );
}
