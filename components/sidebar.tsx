"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users, FileText, Home, ChevronLeft, ChevronRight, ListChecks } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  
  const menuItems = [
    { icon: Home, label: "Domov", href: "/", active: pathname === "/" },
    { icon: Users, label: "Stranke", href: "/customers", active: pathname === "/customers" },
    { icon: FileText, label: "Nov račun", href: "/invoices", active: pathname === "/invoices" && !pathname.includes("/list") },
    { icon: ListChecks, label: "Vsi računi", href: "/invoices/list", active: pathname.includes("/invoices/list") },
  ]

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image src="/images/logo-black.png" alt="Računko" fill className="object-contain" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Računko</h2>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <nav className="p-2">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.href}>
            <Button
              variant={item.active ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3 mb-1", collapsed && "justify-center px-2")}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          </Link>
        ))}
      </nav>
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div className="flex justify-center mb-2">
              <div className="relative w-16 h-10">
                <Image src="/images/2km-logo.png" alt="2KM Consulting" fill className="object-contain" />
              </div>
            </div>
            <div className="font-medium">2KM Consulting</div>
            <div>Anže Kos • v1.6</div>
          </div>
        </div>
      )}
    </div>
  )
}
