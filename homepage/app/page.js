import Header from "./components/Header";
import Hero from "./components/Hero";
import ValueProp from "./components/ValueProp";
import HowItWorks from "./components/HowItWorks";
import WalletTiers from "./components/WalletTiers";
import Testimonials from "./components/Testimonials";
import ContactFooter from "./components/ContactFooter";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <Header />
      <main className="flex-1">
        <Hero />
        <ValueProp />
        <HowItWorks />
        <WalletTiers />
        <Testimonials />
      </main>
      <ContactFooter />
    </div>
  );
}
