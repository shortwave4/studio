
"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth, useFirestore, setDocumentNonBlocking, requestPermission } from "@/firebase";
import { updateProfile } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      // In a real app, you'd fetch the bio from their Firestore profile
      // For now, we'll use a placeholder.
      setBio("Loves hiking and photography.");
    }
    // Check initial notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user || !auth.currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save changes.",
      });
      return;
    }
    setIsSaving(true);
    try {
      // Update display name in Firebase Auth
      await updateProfile(auth.currentUser, { displayName: name });

      // Update bio in Firestore (non-blocking)
      const userRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userRef, { bio: bio }, { merge: true });

      toast({
        title: "Success!",
        description: "Your profile has been updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Could not save your profile. Please try again.",
      });
    } finally {
        setIsSaving(false);
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    if (!user) return;

    if (checked) {
      const token = await requestPermission(firestore, user.uid);
      if (token) {
        setPushEnabled(true);
        toast({
          title: "Notifications Enabled",
          description: "You will now receive push notifications.",
        });
      } else {
         // The user denied permission, so we switch it back off.
        setPushEnabled(false);
         toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You need to grant permission to enable notifications.",
        });
      }
    } else {
      // In a real app, you would have logic here to revoke the token on your server.
      // For now, we'll just update the UI.
      setPushEnabled(false);
      console.log("Push notifications disabled by user toggle.");
      // We don't show a toast here to avoid being too noisy.
    }
  };


  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This is how others will see you on the site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select a theme for the application.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications on your device.
                </p>
              </div>
              <Switch checked={pushEnabled} onCheckedChange={handlePushToggle} aria-readonly={isSaving} />
            </div>
             <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {isSaving ? "Saving..." : "Save Changes"}
            </Button>
        </div>
      </div>
    </div>
  );
}

    