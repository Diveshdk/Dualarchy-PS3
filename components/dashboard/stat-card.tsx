'use client'

import { motion } from 'framer-motion'
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number
  color?: 'blue' | 'emerald' | 'amber' | 'rose'
  index?: number
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  rose: 'bg-rose-50 text-rose-600 border-rose-200',
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
      className="bg-white rounded-xl border border-border p-6 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="text-3xl font-bold text-foreground mt-2"
          >
            {value}
          </motion.p>
          {trend !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              {trend >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-600">{Math.abs(trend)}% increase</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  <span className="text-sm text-rose-600">{Math.abs(trend)}% decrease</span>
                </>
              )}
            </div>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`${colorClasses[color]} rounded-lg p-3 border`}
        >
          <Icon size={24} />
        </motion.div>
      </div>
    </motion.div>
  )
}
