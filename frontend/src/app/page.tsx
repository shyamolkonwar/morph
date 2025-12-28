import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import InteractivePlayground from "@/components/landing/InteractivePlayground";
import ProblemSolution from "@/components/landing/ProblemSolution";
import FeatureGrid from "@/components/landing/FeatureGrid";
import TechTrust from "@/components/landing/TechTrust";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-morph-bg">
      <Navbar />
      <Hero />
      <InteractivePlayground />
      <ProblemSolution />
      <FeatureGrid />
      <TechTrust />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
