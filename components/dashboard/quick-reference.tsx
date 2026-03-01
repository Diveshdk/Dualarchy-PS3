'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export function QuickReference() {
  const [isOpen, setIsOpen] = useState(false)

  const sections = [
    {
      title: 'AI Features',
      items: [
        { label: 'Event Analysis', href: '/dashboard/event-analysis', desc: 'AI insights on event performance' },
        { label: 'Branch Comparison', href: '/dashboard/branches', desc: 'Multi-branch performance analysis' },
        { label: 'Smart Recommendations', href: '/dashboard/branch-priority', desc: 'Booking recommendations' },
      ],
    },
    {
      title: 'Management Tools',
      items: [
        { label: 'Supply Management', href: '/dashboard/supplies', desc: 'Inventory tracking by branch' },
        { label: 'Branch Priority', href: '/dashboard/branch-priority', desc: 'Set booking priorities' },
        { label: 'Features Guide', href: '/dashboard/features-guide', desc: 'Complete feature documentation' },
      ],
    },
    {
      title: 'Supply Status Colors',
      items: [
        { label: '🔴 Critical', desc: 'Stock ≤ 25% - Restock now' },
        { label: '🟠 Low', desc: 'Stock 26-50% - Plan reorder' },
        { label: '🟡 Medium', desc: 'Stock 51-100% - Monitor' },
        { label: '🟢 Healthy', desc: 'Stock 100%+ - Adequate' },
      ],
    },
  ]

  return (
    <>
      {/* Help Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40"
        title="Quick Reference"
      >
        {isOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
      </motion.button>

      {/* Quick Reference Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-50 lg:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              className="fixed bottom-0 right-0 top-0 w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
                <h2 className="font-bold text-lg text-foreground">Quick Reference</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-4 space-y-6">
                {sections.map((section, sectionIdx) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sectionIdx * 0.1 }}
                    className="space-y-3"
                  >
                    <h3 className="font-bold text-foreground text-sm uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </h3>

                    <div className="space-y-2">
                      {section.items.map((item, itemIdx) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: sectionIdx * 0.1 + itemIdx * 0.05 }}
                        >
                          {item.href ? (
                            <Link
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className="block p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                    {item.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                              </div>
                            </Link>
                          ) : (
                            <div className="p-3 rounded-lg bg-gray-50">
                              <p className="font-medium text-sm text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {/* Tips Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3"
                >
                  <h3 className="font-bold text-foreground text-sm">💡 Pro Tips</h3>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    <li>✓ Analyze events within 24-48 hours for best insights</li>
                    <li>✓ Check supplies daily and act on critical alerts</li>
                    <li>✓ Review branch comparison monthly to identify trends</li>
                    <li>✓ Test booking recommendations before launching</li>
                    <li>✓ Export reports for client presentations</li>
                  </ul>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
