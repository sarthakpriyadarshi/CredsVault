"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useTheme } from "@/context/ThemeContext"
import Image from "next/image"
import { Award, Bell, Calendar, ChevronDown, Home, LogOut, Moon, Settings, Sun, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { EditProfileModal } from "@/app/user/dashboard/components/EditProfileModal"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface Credential {
  id: string
  name: string
  issuingOrganization: string
  issueDate: string
  expiryDate?: string // Add expiryDate field
  description: string
  downloads?: number // Add downloads field
  featured?: boolean // Add featured field
}

interface User {
  name: string
  email: string
}

const Dashboard = () => {
  const router = useRouter()
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [user, setUser] = useState<User | null>(null)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/user/login")
      return
    }

    // Fetch user profile
    axios
      .get("http://localhost:3000/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUser(response.data)
      })
      .catch((error) => {
        console.error("Error fetching user profile:", error)
        router.push("/user/login")
      })

    // Fetch user credentials
    axios
      .get("/api/credentials", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setCredentials(response.data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching credentials:", error)
        setLoading(false)
      })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/user/login")
  }

  const handleProfileUpdate = async (updates: Partial<User>) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.put("http://localhost:3000/api/user/profile", updates, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.data.message === "Profile updated") {
        setUser((prevUser) => {
            if (prevUser) {
              return { ...prevUser, ...updates }
            }
            return updates as User
          })
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex min-h-screen bg-background tomorrow">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-3">
            <Image
              src="/cred-vault-logo.svg"
              alt="CredsVault"
              width={50}
              height={50}
              className="w-10 h-10"
            />
            <span className="font-semibold">CredsVault</span>
          </Link>
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
              variant={activeTab === "credentials" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("credentials")}
            >
              <Award className="mr-2 h-4 w-4" />
              All Credentials
            </Button>
            <Button
              variant={activeTab === "profile" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button
              variant={activeTab === "calendar" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("calendar")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Button>
            <Button
              variant={activeTab === "settings" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
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
          {/* Mobile menu button would go here */}
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold md:hidden">Credential Dashboard</h1>
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
                    <AvatarImage src="/placeholder-user.jpg" alt={user?.name || "User"} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
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
                <DropdownMenuItem onClick={() => setActiveTab("settings")}>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="md:hidden mb-4 w-full">
              <TabsTrigger value="overview" className="flex-1">
                Overview
              </TabsTrigger>
              <TabsTrigger value="credentials" className="flex-1">
                Credentials
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-1">
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Credentials</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{credentials.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Recent Credentials</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {
                          credentials.filter((cred) => {
                            const issueDate = new Date(cred.issueDate)
                            const threeMonthsAgo = new Date()
                            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
                            return issueDate > threeMonthsAgo
                          }).length
                        }
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Number of Downloads</CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-muted-foreground"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {credentials.reduce((total, cred) => total + (cred.downloads || 0), 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-muted-foreground"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {
                          credentials.filter((cred) => {
                            if (!cred.expiryDate) return false
                            const expiryDate = new Date(cred.expiryDate)
                            const today = new Date()
                            const thirtyDaysFromNow = new Date()
                            thirtyDaysFromNow.setDate(today.getDate() + 30)
                            return expiryDate > today && expiryDate < thirtyDaysFromNow
                          }).length
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Credentials</TabsTrigger>
                    <TabsTrigger value="recent">Recently Added</TabsTrigger>
                    <TabsTrigger value="featured">Featured</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {credentials.map((cred) => (
                        <Card key={cred.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-bold line-clamp-1">{cred.name}</CardTitle>
                              <Badge variant="outline">{new Date(cred.issueDate).getFullYear()}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <span className="font-medium">Issued by:</span>
                              <span className="ml-1">{cred.issuingOrganization}</span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mb-4">
                              <span className="font-medium">Issue Date:</span>
                              <span className="ml-1">{new Date(cred.issueDate).toLocaleDateString()}</span>
                            </div>
                            {cred.expiryDate && (
                              <div className="flex items-center text-sm text-muted-foreground mb-4">
                                <span className="font-medium">Expires:</span>
                                <span className="ml-1">{new Date(cred.expiryDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            <p className="text-sm line-clamp-3">{cred.description}</p>
                          </CardContent>
                          <CardFooter className="pt-2">
                            <Button variant="outline" size="sm" className="w-full">
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="recent" className="space-y-4">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {credentials
                        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
                        .slice(0, 6)
                        .map((cred) => (
                          <Card key={cred.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold line-clamp-1">{cred.name}</CardTitle>
                                <Badge variant="secondary">New</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="flex items-center text-sm text-muted-foreground mb-2">
                                <span className="font-medium">Issued by:</span>
                                <span className="ml-1">{cred.issuingOrganization}</span>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground mb-4">
                                <span className="font-medium">Issue Date:</span>
                                <span className="ml-1">{new Date(cred.issueDate).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm line-clamp-3">{cred.description}</p>
                            </CardContent>
                            <CardFooter className="pt-2">
                              <Button variant="outline" size="sm" className="w-full">
                                View Details
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="featured" className="space-y-4">
                    <div className="flex flex-col items-center justify-center py-12">
                      <Award className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Featured Credentials Coming Soon</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        We&apos;re working on highlighting your most important credentials. Check back soon for featured
                        credentials.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Credentials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {credentials.length > 0 ? (
                      <div className="space-y-4">
                        {credentials.slice(0, 3).map((cred) => (
                          <div key={cred.id} className="flex items-start gap-4 rounded-lg border p-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              <Award className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium leading-none">{cred.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {cred.issuingOrganization} • {new Date(cred.issueDate).toLocaleDateString()}
                              </p>
                            </div>
                            {cred.expiryDate && isExpiringCredential(cred) && (
                              <Badge variant="destructive" className="ml-auto">
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No credentials found.</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab("credentials")}>
                      View All Credentials
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">All Credentials</h2>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Sort by
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Newest first</DropdownMenuItem>
                      <DropdownMenuItem>Oldest first</DropdownMenuItem>
                      <DropdownMenuItem>A-Z</DropdownMenuItem>
                      <DropdownMenuItem>Z-A</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {credentials.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {credentials.map((cred) => (
                    <Card key={cred.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-bold line-clamp-1">{cred.name}</CardTitle>
                          <Badge variant="outline">{new Date(cred.issueDate).getFullYear()}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Issued by:</span>
                          <span className="ml-1">{cred.issuingOrganization}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mb-4">
                          <span className="font-medium">Issue Date:</span>
                          <span className="ml-1">{new Date(cred.issueDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm line-clamp-3">{cred.description}</p>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Credentials Found</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You don&apos;t have any credentials yet. They will appear here once they are issued to you.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="/placeholder-user.jpg" alt={user?.name || "User"} />
                      <AvatarFallback className="text-2xl">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 text-center sm:text-left">
                      <h3 className="text-2xl font-bold">{user?.name}</h3>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-4">Account Information</h4>
                    <dl className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-1">
                        <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                        <dd>{user?.name}</dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                        <dd>{user?.email}</dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="text-sm font-medium text-muted-foreground">Credentials</dt>
                        <dd>{credentials.length}</dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="text-sm font-medium text-muted-foreground">Member Since</dt>
                        <dd>January 2023</dd>
                      </div>
                    </dl>
                  </div>
                </CardContent>
                <CardFooter>
                  <EditProfileModal user={user!} onSave={handleProfileUpdate} />
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Calendar view coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Settings options coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

// Loading skeleton
const DashboardSkeleton = () => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Skeleton className="h-6 w-40" />
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="flex flex-col gap-2 px-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
          </div>
        </nav>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
            <Skeleton className="h-6 w-40 md:hidden" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array(2)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </main>
      </div>
    </div>
  )
}

const isExpiringCredential = (credential: Credential): boolean => {
  if (!credential.expiryDate) return false

  const expiryDate = new Date(credential.expiryDate)
  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)

  return expiryDate > today && expiryDate < thirtyDaysFromNow
}

export default Dashboard

