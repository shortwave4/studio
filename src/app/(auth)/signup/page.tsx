
"use client";

import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { updateProfile, UserCredential, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, GeoPoint } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth, useFirestore, setDocumentNonBlocking, requestPermission } from "@/firebase";
import { Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  phoneNumber: z.string().min(10, { message: "Please enter a valid phone number." }),
});

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phoneNumber: "",
    },
  });

  const saveProfileWithLocation = (user: any, name: string, email: string, phoneNumber: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userProfile = {
            id: user.uid,
            name,
            email,
            phoneNumber,
            coordinates: new GeoPoint(latitude, longitude),
          };
          const userRef = doc(firestore, "users", user.uid);
          setDocumentNonBlocking(userRef, userProfile, { merge: true });
        },
        () => {
          saveProfileWithoutLocation(user, name, email, phoneNumber);
        }
      );
    } else {
      saveProfileWithoutLocation(user, name, email, phoneNumber);
    }
  }

  const saveProfileWithoutLocation = (user: any, name: string, email: string, phoneNumber: string) => {
      const userProfile = {
        id: user.uid,
        name,
        email,
        phoneNumber,
        coordinates: null,
      };
      const userRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userRef, userProfile, { merge: true });
  }

  const handlePostSignup = (user: any, name: string, email: string, phoneNumber: string) => {
    saveProfileWithLocation(user, name, email, phoneNumber);
    requestPermission(firestore, user.uid);
    router.push('/');
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential: UserCredential | undefined = await createUserWithEmailAndPassword(auth, values.email, values.password);
      if (userCredential?.user) {
        await updateProfile(userCredential.user, { displayName: values.name });
        handlePostSignup(userCredential.user, values.name, values.email, values.phoneNumber);
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
            variant: "destructive",
            title: "Signup Failed",
            description: "This email is already registered. Please login or use a different email.",
        });
      } else {
        toast({
            variant: "destructive",
            title: "Signup Failed",
            description: "Could not create your account. Please try again.",
        });
      }
    }
  }

  return (
    <Card className="w-full max-w-md mx-4">
      <CardHeader className="text-center">
         <div className="flex justify-center items-center mb-4">
            <Flame className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
        <CardDescription>Join ConnectSphere today!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Your Phone Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
