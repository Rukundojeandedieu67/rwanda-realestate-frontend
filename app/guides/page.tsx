import Link from 'next/link'

const guides = [
  {
    number: '01',
    title: 'Find a property',
    description: 'Browse homes across Rwanda, then narrow results by location, type, price, and purpose.',
    steps: ['Open Browse Properties.', 'Compare photos, details, and availability.', 'Send an inquiry when you are ready to ask a question.'],
  },
  {
    number: '02',
    title: 'Buy or rent with confidence',
    description: 'Save promising listings and keep your conversations in one place while you decide.',
    steps: ['Create an account to save favorites.', 'Contact the owner or agent through the listing.', 'Confirm the terms before making any payment.'],
  },
  {
    number: '03',
    title: 'List a property',
    description: 'Owners and agents can present a property clearly so the right people can find it.',
    steps: ['Register and choose the owner or agent role.', 'Add accurate property details and good photos.', 'Respond to inquiries and keep availability current.'],
  },
]

export default function GuidesPage() {
  return (
    <div className="space-y-10 py-6 sm:space-y-14 sm:py-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-nzu-teal px-6 py-10 text-white shadow-xl shadow-nzu-teal/10 sm:px-10 sm:py-14 lg:px-16">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[28px] border-nzu-cream/15" />
        <div className="absolute -bottom-28 right-24 h-52 w-52 rounded-full border-[18px] border-nzu-terracotta/30" />
        <div className="relative max-w-3xl">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-nzu-cream">
            <span className="h-px w-8 bg-nzu-cream" />
            Nzu guides
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">Make your next move with clarity.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
            A quick field guide for finding a home, starting a conversation, or putting your property in front of the right people.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/properties" className="inline-flex items-center justify-center rounded-lg bg-nzu-cream px-5 py-3 text-sm font-bold text-nzu-teal transition hover:bg-white">
              Explore properties
            </Link>
            <span className="text-sm text-white/65">Open to everyone, no account needed</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="guide-paths-heading">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nzu-terracotta">Choose your path</p>
            <h2 id="guide-paths-heading" className="mt-2 text-2xl font-bold text-nzu-teal sm:text-3xl">Everything starts here.</h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-slate-500">Three simple ways to get moving on Nzu.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {guides.map((guide, index) => (
            <article key={guide.number} className={`group flex flex-col rounded-2xl border border-nzu-teal/10 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${index === 1 ? 'lg:translate-y-5' : ''}`}>
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-nzu-cream text-sm font-bold text-nzu-teal">{guide.number}</span>
                <span className="text-2xl text-nzu-terracotta transition-transform group-hover:translate-x-1">-&gt;</span>
              </div>
              <h3 className="mt-7 text-xl font-bold text-nzu-teal">{guide.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{guide.description}</p>
              <ol className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm text-slate-700">
                {guide.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-nzu-cream text-xs font-bold text-nzu-teal">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
          </article>
        ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-nzu-terracotta/20 bg-nzu-cream/60 p-6 sm:flex sm:items-center sm:justify-between sm:p-8">
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nzu-terracotta">A good rule</p>
          <h2 className="mt-2 text-xl font-bold text-nzu-teal">Start with a real conversation.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700">Verify the property, the person, and the agreed terms before making any payment.</p>
        </div>
        <Link href="/properties" className="relative mt-5 inline-flex shrink-0 items-center justify-center rounded-lg bg-nzu-teal px-5 py-3 text-sm font-semibold text-white transition hover:bg-nzu-teal/90 sm:mt-0">
          Browse properties
        </Link>
      </section>
    </div>
  )
}