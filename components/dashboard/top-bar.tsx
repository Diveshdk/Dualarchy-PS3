'use client'

import { motion } from 'framer-motion'
import { NotificationCenter } from './notifications'
import { User, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/server-actions'
import { useState } from 'react'

export function TopBar() {
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
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 right-0 left-0 lg:left-72 h-16 bg-white border-b border-border z-40 flex items-center justify-between px-6 md:px-8"
    >
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <NotificationCenter />

        {/* User Menu */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground hidden md:inline">Account</span>
          </button>
        </motion.div>

        {/* Logout Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium hidden md:inline">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
