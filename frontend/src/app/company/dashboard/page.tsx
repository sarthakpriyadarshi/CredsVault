"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Image from "next/image"
import { Award, Bell, FileText, Home, LogOut, Moon, Settings, Sun, User } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/context/ThemeContext"
import TemplateBuilder from "./components/TemplateBuilder"
import CredentialIssuer from "./components/CredentialIssuer"
import CompanyProfile from "./components/CompanyProfile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CompanyData {
  name: string
  email: string
  totalTemplates: number
  totalCredentialsIssued: number
  recentTemplates: number
  pendingCredentials: number
}

export default function Dashboard() {
  const router = useRouter()
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'template' | 'credential' | 'profile'>('overview')
  const [loading, setLoading] = useState(true)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)

  useEffect(() => {
    console.log("Active Tab:", activeTab);
  }, [activeTab]);
  
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/company/login")
      return
    }

    // Fetch company data
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/company/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        })
        setCompanyData(response.data)
        console.log(response.data);
        setLoading(false)
      } catch (error) {
        console.error("Error fetching company data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/company/login")
  }

  if (loading) return <DashboardSkeleton />

  return (
    <div className="flex min-h-screen bg-background tomorrow">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Image
            src="/cred-vault-logo.svg"
            alt="Company Logo"
            width={50}
            height={50}
            className="mr-2"
          />
          <span className="font-semibold">CredsVault</span>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="flex flex-col gap-1 px-2">
            <Button
              variant={activeTab === "overview" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <Home className="mr-2 h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === "template" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("template")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Template Builder
            </Button>
            <Button
              variant={activeTab === "credential" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("credential")}
            >
              <Award className="mr-2 h-4 w-4" />
              Issue Credentials
            </Button>
            <Button
              variant={activeTab === "profile" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Company Profile
            </Button>
          </div>
        </nav>
        <div className="mt-auto border-t p-4">
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold md:hidden">Company Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={toggleDarkMode}
            >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt={companyData?.name || "Company"} />
                    <AvatarFallback>{companyData?.name?.charAt(0) || "C"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'template' | 'credential' | 'profile')} className="w-full">
            <TabsList className="md:hidden mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="template">Templates</TabsTrigger>
              <TabsTrigger value="credential">Credentials</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companyData?.totalTemplates}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Credentials Issued</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companyData?.totalCredentialsIssued}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Templates</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companyData?.recentTemplates}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Credentials</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companyData?.pendingCredentials}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="template">
              <TemplateBuilder />
            </TabsContent>

            <TabsContent value="credential">
              <CredentialIssuer />
            </TabsContent>

            <TabsContent value="profile">
              <CompanyProfile />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

const DashboardSkeleton = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="ml-2 h-4 w-32" />
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="flex flex-col gap-2 px-2">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </nav>
      </aside>

      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <Skeleton className="h-8 w-8 rounded-full ml-auto" />
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
