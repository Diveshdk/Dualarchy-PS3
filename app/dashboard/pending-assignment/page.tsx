import { Clock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function PendingAssignmentPage() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Awaiting Assignment</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Your account has been created successfully. You need to be assigned to a branch by your owner before accessing the dashboard.
        </p>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-400" />
            Next Steps
          </h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center flex-shrink-0">1</span>
              Share your email address with your owner/admin
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center flex-shrink-0">2</span>
              Ask them to assign you to a branch in Settings → Team
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center flex-shrink-0">3</span>
              Refresh this page after assignment
            </li>
          </ul>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Refresh Status
        </Link>
      </div>
    </div>
  );
}
