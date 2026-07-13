import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { CollectionGallery } from "@/components/CollectionGallery";

// /collection — the full gallery of every minted card, as a real page.
export default function Collection() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Navbar />
      {/* The gallery is already a full-screen layout; closing returns home. */}
      <CollectionGallery open onClose={() => setLocation("/")} />
    </div>
  );
}
