'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Bell, X, CheckCircle } from 'lucide-react'

interface Notification {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  actionLabel?: string
  onAction?: () => void
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Initialize with some mock notifications
    setNotifications([
      {
        id: '1',
        type: 'critical',
        title: 'Critical Supply Alert',
        message: 'Decorative Plates running critically low at Mumbai branch',
        timestamp: new Date(),
        actionLabel: 'Restock Now',
        onAction: () => console.log('Restocking...'),
      },
      {
        id: '2',
        type: 'warning',
        title: 'Low Stock Warning',
        message: 'Table Covers at Delhi branch below threshold level',
        timestamp: new Date(Date.now() - 3600000),
      },
    ])
  }, [])

  const handleRemove = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const criticalCount = notifications.filter((n) => n.type === 'critical').length
  const warningCount = notifications.filter((n) => n.type === 'warning').length

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' }
      case 'warning':
        return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' }
      case 'success':
        return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' }
      default:
        return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' }
    }
  }

  return (
    <>
      {/* Notification Bell Icon */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg hover:bg-secondary transition-all"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {(criticalCount > 0 || warningCount > 0) && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                criticalCount > 0 ? 'bg-red-600' : 'bg-amber-600'
              }`}
            >
              {criticalCount + warningCount}
            </motion.span>
          )}
        </motion.button>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-border shadow-xl z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground">Notifications</h3>
                  <p className="text-xs text-muted-foreground">
                    {criticalCount} critical, {warningCount} warnings
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {notifications.map((notification, idx) => {
                      const styles = getNotificationStyles(notification.type)
                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`${styles.bg} border-b ${styles.border} p-4`}
                        >
                          <div className="flex items-start gap-3">
                            {notification.type === 'critical' ? (
                              <AlertTriangle className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
                            ) : (
                              <CheckCircle className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-foreground text-sm">{notification.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.timestamp)}
                                </span>
                                {notification.actionLabel && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      notification.onAction?.()
                                      handleRemove(notification.id)
                                    }}
                                    className="text-xs font-medium text-primary hover:text-primary/80"
                                  >
                                    {notification.actionLabel}
                                  </motion.button>
                                )}
                              </div>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemove(notification.id)}
                              className="p-1 hover:bg-black/5 rounded transition-colors"
                            >
                              <X className="w-4 h-4 text-muted-foreground" />
                            </motion.button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
