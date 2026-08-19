import Link from 'next/link'

export default function SuperAdminOverview() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Link href="/superadmin/settings" className="rounded-xl border border-slate-700 bg-slate-900 p-6 transition hover:border-amber-300/70">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-300">Configuration</p>
        <h2 className="mt-3 text-2xl font-bold text-white">Site Settings</h2>
        <p className="mt-2 text-slate-400">Control the public hero, notifications, and email delivery configuration.</p>
      </Link>
      <Link href="/superadmin/users" className="rounded-xl border border-slate-700 bg-slate-900 p-6 transition hover:border-amber-300/70">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-300">Delegation</p>
        <h2 className="mt-3 text-2xl font-bold text-white">User Management</h2>
        <p className="mt-2 text-slate-400">Review accounts and make deliberate role or access changes.</p>
      </Link>
    </div>
  )
}