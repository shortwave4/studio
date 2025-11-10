import DiscoverUsers from "@/components/discover-users";
import Announcements from "@/components/announcements";

export default function DiscoverPage() {
  return (
    <div className="container mx-auto">
       <Announcements />
      <div className="mb-8 mt-8 bg-card/80 p-6 rounded-lg shadow-lg backdrop-blur-sm">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Discover People</h1>
        <p className="text-muted-foreground">
          Connect with people near you based on your location.
        </p>
      </div>
      <DiscoverUsers />
    </div>
  );
}
