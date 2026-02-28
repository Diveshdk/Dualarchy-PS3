'use client';

import { useEffect, useState } from 'react';
import { getCurrentUserProfile, updateProfile, getBranches, createBranch, updateBranch, getTeamMembers, assignUserToBranch } from '@/lib/actions';
import { Profile, Branch, TeamMember } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { Plus, Edit2, X, Building2, Users, User, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams?.get('tab') || 'profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });

  // Branch form
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({ name: '', location: '', phone: '', email: '' });

  useEffect(() => {
    (async () => {
      const [profileRes, branchRes] = await Promise.all([getCurrentUserProfile(), getBranches()]);
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
        setProfileForm({ full_name: profileRes.data.full_name ?? '', phone: profileRes.data.phone ?? '' });
      }
      if (branchRes.success && branchRes.data) setBranches(branchRes.data);

      if (profileRes.data?.role === 'owner') {
        const teamRes = await getTeamMembers();
        if (teamRes.success && teamRes.data) setTeam(teamRes.data);
      }
      setLoading(false);
    })();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const res = await updateProfile(profileForm);
    if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  const handleSaveBranch = async () => {
    setSaving(true);
    if (editBranch) {
      const res = await updateBranch(editBranch.id, branchForm);
      if (res.success && res.data) {
        setBranches((prev) => prev.map((b) => b.id === editBranch.id ? res.data! : b));
      }
    } else {
      const res = await createBranch(branchForm);
      if (res.success && res.data) setBranches((prev) => [res.data!, ...prev]);
    }
    setShowBranchForm(false); setEditBranch(null); setBranchForm({ name: '', location: '', phone: '', email: '' });
    setSaving(false);
  };

  const handleAssignBranch = async (userId: string, branchId: string | null) => {
    await assignUserToBranch(userId, branchId);
    const teamRes = await getTeamMembers();
    if (teamRes.success && teamRes.data) setTeam(teamRes.data);
  };

  if (loading) return <div className="p-8 text-slate-500 text-center">Loading settings...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your profile, branches, and team</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl w-fit border border-slate-800">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          ...(profile?.role === 'owner' ? [
            { id: 'branches', label: 'Branches', icon: Building2 },
            { id: 'team', label: 'Team', icon: Users },
          ] : []),
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg">
          <h3 className="text-base font-semibold text-slate-200 mb-5">Your Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={profile?.email || ''} disabled
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-500 text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
              <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
              <div className="px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 text-sm capitalize">{profile?.role?.replace('_', ' ')}</div>
            </div>
            <button onClick={handleSaveProfile} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
              {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Branches Tab */}
      {tab === 'branches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
            <button onClick={() => { setShowBranchForm(true); setEditBranch(null); setBranchForm({ name: '', location: '', phone: '', email: '' }); }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Branch
            </button>
          </div>

          {branches.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700 border-dashed rounded-xl p-12 text-center">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No branches yet. Create your first branch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b) => (
                <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <button onClick={() => { setEditBranch(b); setBranchForm({ name: b.name, location: b.location ?? '', phone: b.phone ?? '', email: b.email ?? '' }); setShowBranchForm(true); }}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-semibold text-slate-200 mb-1">{b.name}</h4>
                  {b.location && <p className="text-xs text-slate-500 mb-1">📍 {b.location}</p>}
                  {b.phone && <p className="text-xs text-slate-500">📞 {b.phone}</p>}
                  {b.email && <p className="text-xs text-slate-500">✉ {b.email}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Branch Form Modal */}
          {showBranchForm && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-white">{editBranch ? 'Edit Branch' : 'New Branch'}</h2>
                  <button onClick={() => { setShowBranchForm(false); setEditBranch(null); }} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'name', label: 'Branch Name *', type: 'text', placeholder: 'Main Branch' },
                    { key: 'location', label: 'Location', type: 'text', placeholder: 'Mumbai, Maharashtra' },
                    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 9876543210' },
                    { key: 'email', label: 'Email', type: 'email', placeholder: 'branch@example.com' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">{f.label}</label>
                      <input type={f.type} value={branchForm[f.key as keyof typeof branchForm]} onChange={(e) => setBranchForm((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button onClick={() => { setShowBranchForm(false); setEditBranch(null); }} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 text-sm font-medium">Cancel</button>
                    <button onClick={handleSaveBranch} disabled={saving || !branchForm.name} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                      {saving ? 'Saving...' : editBranch ? 'Update' : 'Create Branch'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team Tab */}
      {tab === 'team' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">{team.length} team member{team.length !== 1 ? 's' : ''} assigned to your branches</p>

          {team.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700 border-dashed rounded-xl p-12 text-center">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No team members yet. They need to sign up and you&apos;ll assign them here.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="text-slate-200 font-medium">{member.full_name || '—'}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${member.role === 'branch_manager' ? 'bg-violet-500/10 text-violet-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{member.branch_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={member.branch_id ?? ''}
                          onChange={(e) => handleAssignBranch(member.id, e.target.value || null)}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                        >
                          <option value="">Unassigned</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
