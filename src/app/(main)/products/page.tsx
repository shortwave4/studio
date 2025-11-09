import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ExternalLink } from "lucide-react";

export default function ProductsPage() {
  const products = PlaceHolderImages.filter(p => p.id.startsWith('product-'));

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Affiliate Products</h1>
        <p className="text-muted-foreground">
          Check out these recommended products.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-0">
              <div className="aspect-video relative">
                <Image
                  src={product.imageUrl}
                  alt={product.description}
                  fill
                  className="object-cover"
                  data-ai-hint={product.imageHint}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CardTitle className="font-headline text-2xl mb-2">{product.imageHint.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</CardTitle>
              <CardDescription>
                {product.description}
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Get It Now
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
