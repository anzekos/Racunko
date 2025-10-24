// components/sidebar.tsx
"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users, FileText, Home, ChevronLeft, ChevronRight, ListChecks, Quote, Receipt, FileSignature } from "lucide-react"
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
    { 
      icon: FileText, 
      label: "Računi", 
      href: "/invoices",
      active: pathname.includes('/invoices') && !pathname.includes('/list'),
      submenu: [
        { label: "Nov račun", href: "/invoices" },
        { label: "Vsi računi", href: "/invoices/list" }
      ]
    },
    { 
      icon: Quote, 
      label: "Ponudbe", 
      href: "/quotes",
      active: pathname.includes('/quotes') && !pathname.includes('/list'),
      submenu: [
        { label: "Nova ponudba", href: "/quotes" },
        { label: "Vse ponudbe", href: "/quotes/list" }
      ]
    },
    { 
      icon: Receipt, 
      label: "Dobropisi", 
      href: "/credit-notes",
      active: pathname.includes('/credit-notes') && !pathname.includes('/list'),
      submenu: [
        { label: "Nov dobropis", href: "/credit-notes" },
        { label: "Vsi dobropisi", href: "/credit-notes/list" }
      ]
    },
    { 
      icon: FileSignature, 
      label: "Pogodbe", 
      href: "/contracts",
      active: pathname.includes('/contracts') && !pathname.includes('/list'),
      submenu: [
        { label: "Nova pogodba", href: "/contracts" },
        { label: "Vse pogodbe", href: "/contracts/list" }
      ]
    },
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
          <div key={index} className="mb-1">
            <Link href={item.href} passHref>
              <Button
                variant={item.active ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-3", collapsed && "justify-center px-2")}
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            </Link>
            
            {/* Submenu items */}
            {!collapsed && item.submenu && (
              <div className="ml-6 mt-1 space-y-1">
                {item.submenu.map((subItem, subIndex) => (
                  <Link key={subIndex} href={subItem.href} passHref>
                    <Button
                      variant={pathname === subItem.href ? "secondary" : "ghost"}
                      className="w-full justify-start text-xs h-8"
                    >
                      {subItem.label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
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
            <div>Anže Kos • v2.0</div>
          </div>
        </div>
      )}
    </div>
  )
}
