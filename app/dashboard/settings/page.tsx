'use client'

import { motion } from 'framer-motion'
import { Bell, Lock, User, Shield, LogOut, ChevronRight } from 'lucide-react'

const settingsSections = [
  {
    icon: User,
    title: 'Profile Settings',
    description: 'Update your personal information and account details',
    items: [
      { label: 'Full Name', value: 'John Doe' },
      { label: 'Email', value: 'john@banquet.com' },
      { label: 'Phone', value: '+91 98765 43210' },
    ],
  },
  {
    icon: Lock,
    title: 'Security & Password',
    description: 'Manage your password and security preferences',
    items: [
      { label: 'Change Password', action: true },
      { label: 'Two-Factor Authentication', action: true },
      { label: 'Login History', action: true },
    ],
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Control how and when you receive notifications',
    items: [
      { label: 'Email Notifications', toggle: true, enabled: true },
      { label: 'SMS Alerts', toggle: true, enabled: false },
      { label: 'Push Notifications', toggle: true, enabled: true },
    ],
  },
  {
    icon: Shield,
    title: 'Privacy & Permissions',
    description: 'Manage your data and access permissions',
    items: [
      { label: 'Data Privacy', action: true },
      { label: 'App Permissions', action: true },
      { label: 'Connected Apps', action: true },
    ],
  },
]

export default function SettingsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
      </motion.div>

      {/* Settings Sections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {settingsSections.map((section, sectionIdx) => {
          const Icon = section.icon
          return (
            <motion.div
              key={sectionIdx}
              variants={itemVariants}
              className="bg-white rounded-xl border border-border overflow-hidden"
            >
              {/* Section Header */}
              <div className="p-6 border-b border-border flex items-start gap-4">
                <motion.div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </motion.div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">{section.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                </div>
              </div>

              {/* Section Items */}
              <div className="divide-y divide-border">
                {section.items.map((item, itemIdx) => (
                  <motion.div
                    key={itemIdx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (sectionIdx * 0.1) + (itemIdx * 0.05) }}
                    className="p-5 hover:bg-secondary/30 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      {item.value && (
                        <p className="text-sm text-muted-foreground mt-1">{item.value}</p>
                      )}
                    </div>

                    {item.toggle ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className={`relative w-12 h-7 rounded-full transition-all ${
                          item.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          animate={{ x: item.enabled ? 24 : 2 }}
                          className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                        />
                      </motion.button>
                    ) : item.action ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium group-hover:bg-primary group-hover:text-white transition-all"
                      >
                        Configure
                      </motion.button>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-rose-50 rounded-xl border border-rose-200 p-6"
      >
        <h3 className="font-bold text-rose-900 mb-4">Danger Zone</h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-between p-4 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-rose-600" />
            <div className="text-left">
              <p className="font-medium text-rose-900">Logout</p>
              <p className="text-xs text-rose-700">Sign out from this account</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-600" />
        </motion.button>
      </motion.div>
    </div>
  )
}
