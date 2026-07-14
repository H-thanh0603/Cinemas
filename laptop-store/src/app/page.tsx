import { Hero } from "@/components/home/hero";
import { BrandStrip } from "@/components/home/brand-strip";
import { DealSection } from "@/components/home/deal-section";
import { FeaturedGrid } from "@/components/home/featured-grid";
import { BlogTeaser } from "@/components/home/blog-teaser";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-8 lg:px-6">
      <Hero />
      <BrandStrip />
      <DealSection />
      <FeaturedGrid />
      <BlogTeaser />
    </div>
  );
}
