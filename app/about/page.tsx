'use client'

import Link from 'next/link'
import AIChat from '@/components/AIChat'

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold tracking-tight hover:text-emerald-400 transition-colors">
            Warmchain
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#product" className="text-sm text-gray-400 hover:text-white transition-colors">
              Product
            </Link>
            <Link href="/about" className="text-sm text-white font-medium">
              About
            </Link>
            <Link href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/signup"
              className="px-5 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-100 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Grid background with gradient mask */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black"></div>
        
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl mb-8">
            <span className="text-sm font-medium text-emerald-400">
              Our Story
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Built by a founder,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              for founders
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Warmchain exists because warm intros are the most powerful tool for founders—but the workflow is broken. We're fixing that.
          </p>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">
            Why We Built This
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold mb-8">
            Warm intros work. The process doesn't.
          </h3>
          
          <div className="space-y-6 text-lg text-gray-400 leading-relaxed">
            <p>
              I'm Andrey, the founder of Warmchain. I just finished three years in the Israeli Air Force as an aircraft mechanic. When I started working on my first startup, I quickly learned what every founder knows: warm intros are everything.
            </p>
            
            <p>
              Investors don't respond to cold emails. Customers don't take calls from strangers. Cofounders don't join teams they haven't been introduced to. If you want to close anything—capital, customers, partnerships, hires—you need warm intros.
            </p>
            
            <p>
              But here's the problem: the workflow is chaos. Every time I asked someone for an intro, I had to explain my startup from scratch. "Here's my deck, here's my one-pager, here's my Notion doc, let me also send you this PDF..." Connectors got overloaded. Asks got lost. Intros never happened.
            </p>
            
            <p>
              I thought: <em>Why isn't there a standard format for this?</em> When you apply to YC, you fill out a structured application. When you pitch investors, you send a deck with a consistent structure. But when you ask for a warm intro—the most important step in the process—there's no structure at all.
            </p>
            
            <p className="text-white font-semibold">
              So I built Warmchain. One shareable link. Everything a connector needs to decide in 30 seconds. No decks, no docs, no chaos.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/50 to-black"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">
                Our Mission
              </h2>
              <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Make warm intros structured, not chaotic
              </h3>
              <p className="text-lg text-gray-400 leading-relaxed">
                We believe every founder should have a clean, shareable way to package their startup. No more scattered docs, no more wasted connector time. Just one link that makes it easy to say yes.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="font-bold text-xl mb-2">Speed</h4>
                <p className="text-gray-400">Package your startup in 10 minutes. Share it in 10 seconds. Get a decision in 30 seconds.</p>
              </div>
              
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <div className="text-3xl mb-3">🎯</div>
                <h4 className="font-bold text-xl mb-2">Clarity</h4>
                <p className="text-gray-400">Structured format. Clear ask. No ambiguity. Connectors know exactly how to help.</p>
              </div>
              
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <div className="text-3xl mb-3">🔒</div>
                <h4 className="font-bold text-xl mb-2">Privacy</h4>
                <p className="text-gray-400">Your profile is private by default. You control who sees it. No public broadcasting.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">
            Who's Building This
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold mb-12">
            Solo founder, moving fast
          </h3>
          
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-12 text-left hover:bg-white/[0.03] transition-all">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                A
              </div>
              <div>
                <h4 className="text-2xl font-bold mb-2">Andrey</h4>
                <p className="text-emerald-400 font-medium mb-4">Founder & CEO</p>
                <p className="text-gray-400 leading-relaxed">
                  Former Israeli Air Force aircraft mechanic. First-time founder. Optimizing for speed, focus, and shipping fast. Building Warmchain with AI coding tools (Cursor + Claude) and actively looking for a technical cofounder to accelerate development.
                </p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10 text-gray-400">
              <p className="mb-4"><strong className="text-white">Why I'm building this:</strong></p>
              <p className="leading-relaxed">
                I've felt the pain firsthand. What actually moves fundraising, hiring, and partnerships isn't "more content" or another profile—it's access and trust. Warm intros. But the workflow is fragmented across Notion/Docs/decks/PDFs/DMs. Connectors get overloaded with low-signal asks. Intros become random, slow, inconsistent. I'm fixing that.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Gradient background with fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/50 to-black"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">
              How We Work
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold">
              Built on first principles
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-center group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🚀</div>
              <h4 className="text-xl font-bold mb-3">Ship fast</h4>
              <p className="text-gray-400 leading-relaxed">
                We don't wait for perfect. We ship MVP, get feedback, iterate. Speed beats perfection.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-center group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
              <h4 className="text-xl font-bold mb-3">Solve real problems</h4>
              <p className="text-gray-400 leading-relaxed">
                Every feature exists because a founder asked for it. No vanity metrics, no fluff.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-center group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🤝</div>
              <h4 className="text-xl font-bold mb-3">Respect users</h4>
              <p className="text-gray-400 leading-relaxed">
                No dark patterns. No spam. No selling your data. We build products we'd want to use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Radial gradient for emphasis */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            Join us in building
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              the future of warm intros
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            We're in beta. Shipping fast. Looking for founders who want better warm intros.
          </p>
          <Link 
            href="/signup"
            className="inline-block px-12 py-5 bg-white text-black font-bold text-lg rounded-full hover:scale-105 hover:shadow-[0_0_50px_rgba(52,211,153,0.6)] transition-all duration-300"
          >
            Create Your Profile — Free
          </Link>
          <p className="mt-6 text-sm text-gray-500">
            Or reach out: <a href="mailto:hello@warmchain.co" className="text-emerald-400 hover:text-emerald-300">hello@warmchain.co</a>
          </p>
        </div>
      </section>

      {/* AI Chat */}
      <AIChat />

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="text-xl font-semibold mb-4">Warmchain</div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Package your startup in 10 minutes. Share one link. Get warm intros that work.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/#product" className="text-gray-500 hover:text-white transition-colors">How it works</Link></li>
                <li><Link href="/signup" className="text-gray-500 hover:text-white transition-colors">Get started</Link></li>
                <li><Link href="/faq" className="text-gray-500 hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="text-gray-500 hover:text-white transition-colors">About</Link></li>
                <li><a href="mailto:hello@warmchain.co" className="text-gray-500 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2026 Warmchain. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}