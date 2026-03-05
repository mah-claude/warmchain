import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-3xl font-bold mb-3">Page not found</h1>
        <p className="text-gray-400 mb-8">
          This page doesn&apos;t exist. The profile you&apos;re looking for may have been moved or the link is incorrect.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-all"
          >
            Go home
          </Link>
          <Link
            href="/connectors"
            className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all"
          >
            Browse connectors
          </Link>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-xl font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            Warmchain
          </Link>
        </div>
      </div>
    </div>
  )
}
