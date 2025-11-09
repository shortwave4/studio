
'use client';

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, PlusCircle } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { AddProductDialog } from "@/components/add-product-dialog";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import type { AffiliateProduct } from "@/types";

export default function ProductsPage() {
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const firestore = useFirestore();
  const productsCollection = useMemoFirebase(() => collection(firestore, 'affiliate_products'), [firestore]);
  const { data: products, isLoading: productsLoading } = useCollection<AffiliateProduct>(productsCollection);

  const isLoading = isAdminLoading || productsLoading;

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Affiliate Products</h1>
          <p className="text-muted-foreground">
            Check out these recommended products.
          </p>
        </div>
        {!isLoading && isAdmin && (
          <AddProductDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </AddProductDialog>
        )}
      </div>
       {productsLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden shadow-lg">
                    <CardHeader className="p-0">
                        <div className="aspect-video relative bg-muted animate-pulse" />
                    </CardHeader>
                    <CardContent className="p-6 space-y-2">
                        <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                    </CardContent>
                    <CardFooter>
                        <div className="h-10 w-full rounded bg-muted animate-pulse" />
                    </CardFooter>
                </Card>
            ))}
         </div>
       ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products?.map((product) => (
            <Card key={product.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-0">
                <div className="aspect-video relative">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="font-headline text-2xl mb-2">{product.name}</CardTitle>
                <CardDescription>
                  {product.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href={product.affiliateLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Get It Now
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
       )}
    </div>
  );
}
