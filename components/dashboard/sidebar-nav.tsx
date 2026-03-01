'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Users,
  Calendar,
  FileText,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Sparkles,
  TrendingUp,
  HelpCircle,
  Clock,
} from 'lucide-react'
import { useState } from 'react'
import { signOut } from '@/lib/server-actions'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Branch Manager', href: '/dashboard/branch-manager', icon: Clock },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Branches', href: '/dashboard/branches', icon: Building2 },
  { name: 'Branch Priority', href: '/dashboard/branch-priority', icon: TrendingUp },
  { name: 'Supplies', href: '/dashboard/supplies', icon: Sparkles },
  { name: 'Event Analysis', href: '/dashboard/event-analysis', icon: BarChart3 },
  { name: 'Features Guide', href: '/dashboard/features-guide', icon: HelpCircle },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function LogoutButton() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      const success = await signOut()
      if (success) {
        router.push('/auth/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <motion.button
      onClick={handleLogout}
      disabled={isLoggingOut}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50"
    >
      <LogOut size={20} />
      <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
    </motion.button>
  )
}

export function SidebarNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const sidebarVariants = {
    hidden: { x: -280 },
    visible: { x: 0 },
  }

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: { delay: i * 0.05 },
    }),
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white border border-border shadow-sm"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </motion.button>

      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="hidden"
        animate={isOpen ? 'visible' : 'hidden'}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 z-40 w-72 h-screen bg-white border-r border-border lg:relative lg:translate-x-0 pt-16 lg:pt-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-8 border-b border-border">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                B
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">Banquet</h2>
                <p className="text-xs text-muted-foreground">Management Pro</p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item, i) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <motion.div
                  key={item.href}
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="relative group"
                  >
                    <motion.div
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-secondary'
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                          transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="px-4 py-6 border-t border-border space-y-2"
          >
            <LogoutButton />
          </motion.div>
        </div>
      </motion.aside>
    </>
  )
}
