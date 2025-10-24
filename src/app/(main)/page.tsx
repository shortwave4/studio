import DiscoverUsers from "@/components/discover-users";

export default function DiscoverPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Discover People</h1>
        <p className="text-muted-foreground">
          Connect with people near you based on your location.
        </p>
      </div>
      <DiscoverUsers />
    </div>
  );
}
