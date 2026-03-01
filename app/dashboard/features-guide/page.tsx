'use client'

import { motion } from 'framer-motion'
import {
  Sparkles,
  Building2,
  TrendingUp,
  Package,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

const features = [
  {
    id: 'ai-analytics',
    title: 'AI-Powered Event Analysis',
    description: 'Gemini AI analyzes event performance and generates actionable insights',
    icon: Sparkles,
    href: '/dashboard/event-analysis',
    highlights: [
      'Post-event performance metrics',
      'Revenue and profitability analysis',
      'Guest experience recommendations',
      'Logistics optimization tips',
      'Automated report generation',
    ],
    color: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'branch-comparison',
    title: 'Branch Comparison Analytics',
    description: 'Compare performance metrics across all branches with AI insights',
    icon: Building2,
    href: '/dashboard/branches',
    highlights: [
      'Multi-branch performance comparison',
      'Top performer identification',
      'Growth and improvement recommendations',
      'Staffing and resource optimization',
      'Scaling strategies',
    ],
    color: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'priority-management',
    title: 'Branch Priority Management',
    description: 'Set booking priorities and get smart recommendations for full branches',
    icon: TrendingUp,
    href: '/dashboard/branch-priority',
    highlights: [
      'Custom branch priority ordering',
      'Automatic backup recommendations',
      'Smart capacity management',
      'Price comparison insights',
      'Guest preference matching',
    ],
    color: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'supply-management',
    title: 'Smart Supply Management',
    description: 'Branch-specific inventory tracking with color-coded alerts',
    icon: Package,
    href: '/dashboard/supplies',
    highlights: [
      'Real-time stock monitoring',
      'Critical/Low/Healthy color coding',
      'Branch-wise availability tracking',
      'Automatic low-stock notifications',
      'Reorder recommendations',
    ],
    color: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
  },
]

const alertTypes = [
  { type: 'critical', color: 'bg-red-50', borderColor: 'border-red-200', label: '≤ 25% stock', description: 'Immediate action required' },
  { type: 'low', color: 'bg-amber-50', borderColor: 'border-amber-200', label: '26-50% stock', description: 'Plan reorder soon' },
  { type: 'medium', color: 'bg-yellow-50', borderColor: 'border-yellow-200', label: '51-100% stock', description: 'Monitor levels' },
  { type: 'healthy', color: 'bg-emerald-50', borderColor: 'border-emerald-200', label: '100%+ stock', description: 'Adequate supply' },
]

export default function FeaturesGuidePage() {
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
    <div className="space-y-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold text-foreground">Premium Features</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Powered by advanced AI and intelligent analytics to optimize your banquet operations
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-2 gap-6"
      >
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.id}
              variants={itemVariants}
              className={`rounded-xl border ${feature.borderColor} bg-gradient-to-br ${feature.color} p-8 hover:shadow-lg transition-all group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <motion.div whileHover={{ x: 4 }} className="text-primary">
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{feature.description}</p>

              <ul className="space-y-2 mb-6">
                {feature.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {highlight}
                  </li>
                ))}
              </ul>

              <motion.a
                href={feature.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Explore Feature
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Supply Status Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-border p-8 space-y-6"
      >
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-primary" />
          Supply Status Indicators
        </h2>
        <p className="text-muted-foreground">Color-coded system to quickly identify supply levels across branches</p>

        <div className="grid md:grid-cols-4 gap-4">
          {alertTypes.map((item) => (
            <motion.div
              key={item.type}
              whileHover={{ scale: 1.05 }}
              className={`${item.color} border ${item.borderColor} rounded-lg p-6 text-center`}
            >
              <p className="font-bold text-foreground text-lg">{item.label}</p>
              <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Branch Priority Workflow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl border border-border p-8 space-y-6"
      >
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" />
          How Branch Priority Works
        </h2>

        <div className="space-y-4">
          {[
            {
              step: 1,
              title: 'Set Priority Order',
              description: 'Owner arranges branches in preferred booking order using the Branch Priority page',
            },
            {
              step: 2,
              title: 'Customer Inquiry',
              description: 'Customer submits booking request with guest count and budget',
            },
            {
              step: 3,
              title: 'Smart Matching',
              description: 'AI analyzes availability and matches with highest priority branch',
            },
            {
              step: 4,
              title: 'Fallback Options',
              description: 'If primary branch is full, system recommends next available options',
            },
            {
              step: 5,
              title: 'Customer Confirmation',
              description: 'Customer accepts recommendation and booking is confirmed',
            },
          ].map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 p-8 space-y-4"
      >
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Pro Tips
        </h3>
        <ul className="space-y-3">
          {[
            'Review AI analysis reports after each event to identify patterns and improvement areas',
            'Set up low-stock alerts in the Supply Management page to prevent shortages',
            'Regularly compare branch performance to identify best practices and scale them across locations',
            'Use branch priority to optimize bookings based on current availability and preferences',
            'Export event reports for client presentations and stakeholder reviews',
          ].map((tip, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
