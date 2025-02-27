"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Save, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface CompanyProfileData {
  name: string;
  email: string;
  address?: string;
  logo?: string;
}

export default function CompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [form, setForm] = useState<CompanyProfileData>({
    name: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/company/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        setForm(res.data);
      } catch (error) {
        console.error("Error fetching company profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setUpdateStatus("loading");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_BASE_URL}/company/profile`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setEditing(false);
      setUpdateStatus("success");
      setTimeout(() => setUpdateStatus("idle"), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateStatus("error");
      setTimeout(() => setUpdateStatus("idle"), 3000);
    }
  };

  return (
    <Card className="shadow-lg p-6">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Company Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-16 w-16 rounded-full" />
          </>
        ) : (
          <>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                {profile?.logo ? (
                  <AvatarImage src={profile.logo} alt={profile.name} />
                ) : (
                  <AvatarFallback className="text-lg">
                    {profile?.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">{profile?.name}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={form.address || ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Company Name</Label>
                  <p className="font-medium">{profile?.name}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Email Address</Label>
                  <p className="font-medium">{profile?.email}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Address</Label>
                  <p className="font-medium">{profile?.address || "No address provided"}</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <div className="flex justify-between px-6 pb-4">
        {editing ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                setForm(profile || { name: "", email: "", address: "" });
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={updateStatus === "loading"}>
              {updateStatus === "loading" ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
            </Button>
          </>
        ) : (
          <Button onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>
    </Card>
  );
}
