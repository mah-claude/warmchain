'use client'

import Link from 'next/link'
import AIChat from '@/components/AIChat'
import { useState, useEffect } from 'react'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Premium Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10" 
           style={{
             backgroundColor: scrollY > 50 ? 'rgba(0,0,0,0.8)' : 'transparent',
             backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
             transition: 'all 0.3s ease'
           }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Warmchain
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Product
            </button>
            <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
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

      {/* Hero Section - Vercel/Superhuman inspired */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-green-500/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-8 hover:bg-white/10 transition-all group">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Now in Beta — Free for founders
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-[1.05] tracking-tight">
            Package your startup.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
              Get warm intros.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Stop sending decks and long DMs. One shareable link gives connectors everything they need to say yes in 30 seconds.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              href="/signup"
              className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(52,211,153,0.6)]"
            >
              <span className="relative z-10">Create your profile</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
            <button 
              onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border border-white/20 text-white font-medium rounded-full hover:bg-white/5 backdrop-blur-xl transition-all duration-300"
            >
              See how it works
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free during beta</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Setup in 10 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-32 px-6 border-t border-white/5 bg-gradient-to-b from-black to-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">
              The Problem
            </h2>
            <h3 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Warm intros are broken
            </h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every founder knows warm intros work. But the process is chaos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">😰</div>
              <h4 className="text-xl font-semibold mb-3">Scattered context</h4>
              <p className="text-gray-400 leading-relaxed">
                "Here's my deck, my one-pager, my Notion doc, let me also explain..." Too many files, too much friction.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⏱️</div>
              <h4 className="text-xl font-semibold mb-3">Wastes connector time</h4>
              <p className="text-gray-400 leading-relaxed">
                Connectors spend 10 minutes reading docs to make a 10-second decision. Most won't bother.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🤷</div>
              <h4 className="text-xl font-semibold mb-3">No clear ask</h4>
              <p className="text-gray-400 leading-relaxed">
                "Can you intro me to investors?" Which ones? What stage? What check size? Vague asks go nowhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="product" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">
              The Solution
            </h2>
            <h3 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              One link. Everything they need.
            </h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Package your startup once. Share everywhere. Make it easy for connectors to say yes.
            </p>
          </div>

          {/* Feature showcase */}
          <div className="space-y-32">
            {/* Feature 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                  Step 1
                </div>
                <h4 className="text-3xl md:text-4xl font-bold mb-6">
                  Create your profile in 10 minutes
                </h4>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                  Fill out 7 fields: company name, one-liner, stage, traction, your ask, team, and links. That's it. No complex setup, no design work.
                </p>
                <ul className="space-y-4">
                  {['Company + one-liner', 'Stage + traction metrics', 'Clear ask (funding, hiring, etc.)', 'Team + links'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                {/* Mockup placeholder - you'll replace with actual screenshot */}
                <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-8 shadow-2xl">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] rounded-2xl"></div>
                  <div className="relative space-y-4">
                    <div className="h-8 bg-white/5 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-white/5 rounded w-5/6"></div>
                    <div className="h-32 bg-white/5 rounded mt-8"></div>
                    <div className="flex gap-2">
                      <div className="h-10 bg-emerald-500/20 rounded flex-1 animate-pulse"></div>
                      <div className="h-10 bg-white/5 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="md:order-2">
                <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                  Step 2
                </div>
                <h4 className="text-3xl md:text-4xl font-bold mb-6">
                  Share your link everywhere
                </h4>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                  Get a clean URL like warmchain.com/yourname. Use it for every intro request instead of sending decks, PDFs, or long explanations.
                </p>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 font-mono text-sm text-emerald-400">
                  warmchain.com/airbnb
                </div>
              </div>
              <div className="relative md:order-1">
                <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/20 to-black p-8 shadow-2xl">
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20"></div>
                        <div className="h-4 bg-white/10 rounded w-32"></div>
                      </div>
                      <div className="h-3 bg-white/5 rounded w-full mb-2"></div>
                      <div className="h-3 bg-white/5 rounded w-4/5"></div>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="h-4 bg-emerald-500/20 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-emerald-500/10 rounded w-full"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-10 bg-white/5 rounded flex-1"></div>
                      <div className="h-10 bg-emerald-500/20 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                  Step 3
                </div>
                <h4 className="text-3xl md:text-4xl font-bold mb-6">
                  Connectors decide in 30 seconds
                </h4>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                  Everything is on one page. Stage, traction, the ask—clear and structured. No digging through files. Connectors can help you faster.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <div className="font-semibold mb-1">30-second decision time</div>
                      <div className="text-sm text-gray-400">vs 10+ minutes reading decks</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-2xl">✓</div>
                    <div>
                      <div className="font-semibold mb-1">Structured format</div>
                      <div className="text-sm text-gray-400">Every intro request is consistent</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-8 shadow-2xl overflow-hidden">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                  </div>
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600"></div>
                      <div>
                        <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-white/5 rounded w-48"></div>
                      </div>
                    </div>
                    <div className="h-px bg-white/10 my-6"></div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                        <div className="h-3 bg-white/5 rounded flex-1"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                        <div className="h-3 bg-white/5 rounded flex-1"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                        <div className="h-3 bg-white/5 rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="h-3 bg-emerald-500/20 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by founders who ship fast
            </h2>
            <p className="text-xl text-gray-400">
              Join the beta and start getting better warm intros today
            </p>
          </div>

          {/* Testimonial cards - placeholder */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                quote: "Sent my Warmchain link to 5 angels. Got 3 intros in 24 hours. Way faster than sending decks.",
                author: "Sarah Chen",
                role: "Founder, DevFlow"
              },
              {
                quote: "Connectors actually look at it because it's structured. No more 'let me get back to you' silence.",
                author: "Marcus Rivera",
                role: "Founder, BetaLabs"
              },
              {
                quote: "Built my profile in 8 minutes. Shared it 20 times this week. This should be the standard.",
                author: "Priya Patel",
                role: "Founder, Stackwise"
              }
            ].map((testimonial, i) => (
              <div key={i} className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all">
                <div className="text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-sm font-bold">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.author}</div>
                    <div className="text-xs text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '50+', label: 'Founders using Warmchain' },
              { number: '200+', label: 'Profiles created' },
              { number: '< 10min', label: 'Average setup time' },
              { number: '30sec', label: 'Connector decision time' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/20 to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            Stop explaining.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              Start closing.
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Package your startup once. Share everywhere. Get warm intros that actually work.
          </p>
          <Link 
            href="/signup"
            className="inline-block px-12 py-5 bg-white text-black font-bold text-lg rounded-full hover:scale-105 hover:shadow-[0_0_50px_rgba(52,211,153,0.6)] transition-all duration-300"
          >
            Create Your Profile — Free
          </Link>
          <p className="mt-6 text-sm text-gray-500">
            Free during beta • No credit card • 10-minute setup
          </p>
        </div>
      </section>

      {/* AI Chat */}
      <AIChat />

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6">
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
                <li>
                  <button 
                    onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })} 
                    className="text-gray-500 hover:text-white transition-colors text-left"
                  >
                    How it works
                  </button>
                </li>
                <li><Link href="/signup" className="text-gray-500 hover:text-white transition-colors">Get started</Link></li>
                <li><Link href="/faq" className="text-gray-500 hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="text-gray-500 hover:text-white transition-colors">About</Link></li>
                <li><a href="mailto:hello@warmchain.com" className="text-gray-500 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2026 Warmchain. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}