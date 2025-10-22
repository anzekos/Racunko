"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, TrendingUp, Database, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/app/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"

function HomePageContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user, logout } = useAuth()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        {/* Header z user info in logout */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Računko</h1>
              <p className="text-sm text-gray-600">Celovita rešitev za upravljanje strank in računov</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Prijavljeni kot: {user?.username}</p>
                <p className="text-xs text-gray-600">{user?.role}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={logout}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Odjava
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Welcome Section */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center mb-6">
                    <div className="relative w-48 h-32">
                      <Image src="/images/logo-black.png" alt="Računko Logo" fill className="object-contain" />
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold text-foreground">Dobrodošli v sistemu Računko</h1>
                  <p className="text-lg text-muted-foreground">
                    Celovita rešitev za upravljanje strank in generiranje računov
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentTime.toLocaleDateString("sl-SI", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    • {currentTime.toLocaleTimeString("sl-SI")}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <Link href="/customers">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          Upravljanje s strankami
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">
                          Dodajajte, urejajte in upravljajte podatke o strankah z naprednimi funkcijami iskanja in
                          filtriranja.
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Dostop do baze strank</span>
                          <Button variant="outline" size="sm">
                            Odpri
                          </Button>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <Link href="/invoices">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-chart-3/10 rounded-lg">
                            <FileText className="h-6 w-6 text-chart-3" />
                          </div>
                          Generiranje računov
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">
                          Ustvarjajte profesionalne račune z avtomatskim izračunom DDV in možnostjo pošiljanja po
                          e-pošti.
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Ustvari nov račun</span>
                          <Button variant="outline" size="sm">
                            Odpri
                          </Button>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                </div>

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-chart-4/10 rounded-lg">
                        <Database className="h-6 w-6 text-chart-4" />
                      </div>
                      Stanje sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">Testiranje</div>
                        <div className="text-sm text-muted-foreground">Način delovanja</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-chart-3">Aktivno</div>
                        <div className="text-sm text-muted-foreground">Stanje sistema</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-chart-4">v2.0</div>
                        <div className="text-sm text-muted-foreground">Različica</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Features Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Funkcionalnosti sistema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-primary/10 rounded">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Upravljanje strank</div>
                          <div className="text-sm text-muted-foreground">
                            Celovita baza podatkov o strankah z naprednimi funkcijami
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-chart-3/10 rounded">
                          <FileText className="h-4 w-4 text-chart-3" />
                        </div>
                        <div>
                          <div className="font-medium">Generiranje računov</div>
                          <div className="text-sm text-muted-foreground">
                            Profesionalni računi z avtomatskim izračunom DDV
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-chart-4/10 rounded">
                          <TrendingUp className="h-4 w-4 text-chart-4" />
                        </div>
                        <div>
                          <div className="font-medium">Finančni pregled</div>
                          <div className="text-sm text-muted-foreground">Sledenje plačilom in finančnim podatkom</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground border-t pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="relative w-32 h-20">
                      <Image src="/images/2km-logo.png" alt="2KM Consulting" fill className="object-contain" />
                    </div>
                  </div>
                  <p>2KM Consulting d.o.o. • Anže Kos • Različica 2.0</p>
                  <p className="mt-1">Sistem za upravljanje strank in generiranje računov</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  )
}
