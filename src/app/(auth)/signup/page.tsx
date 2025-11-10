
"use client";

import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { updateProfile, UserCredential, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { doc, GeoPoint, getDoc } from "firebase/firestore";

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
import { Separator } from "@/components/ui/separator";

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

   React.useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          const user = result.user;
          const userDocRef = doc(firestore, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            handlePostSignup(user, user.displayName || "Google User", user.email || "", user.phoneNumber || "");
          } else {
            router.push('/');
          }
        }
      })
      .catch((error) => {
        console.error("Google Redirect Sign-In Error:", error);
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: "Could not sign in with Google. Please try again.",
        });
      });
  }, [auth, firestore, router, toast]);

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

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
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>
        </Form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
         <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
           <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.928C34.319 4.886 29.521 2.5 24 2.5C11.411 2.5 1.5 12.411 1.5 25s9.911 22.5 22.5 22.5c11.954 0 21.725-8.543 22.5-20.417v-4.5z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12.5 24 12.5c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.319 4.886 29.521 2.5 24 2.5C17.3 2.5 11.467 6.333 7.633 11.719l-1.327 2.972z" />
            <path fill="#4CAF50" d="M24 47.5c5.943 0 11.23-2.315 15.056-6.196l-6.52-4.909C30.563 39.293 27.464 41 24 41c-5.22 0-9.613-3.26-11.284-7.618l-6.702 4.867C9.227 42.905 16.029 47.5 24 47.5z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571l6.52 4.909c3.93-3.64 6.463-8.981 6.463-15.48z" />
          </svg>
          Google
        </Button>
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
