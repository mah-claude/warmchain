'use client'

import Link from 'next/link'
import { useState } from 'react'
import AIChat from '@/components/AIChat'

export default function FAQ() {
  const [openCategory, setOpenCategory] = useState('general')
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    { id: 'general', label: 'General', icon: '💬' },
    { id: 'product', label: 'Product', icon: '⚡' },
    { id: 'pricing', label: 'Pricing', icon: '💳' },
    { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
    { id: 'technical', label: 'Technical', icon: '⚙️' }
  ]

  const faqs = {
    general: [
      {
        id: 'what-is',
        q: "What is Warmchain?",
        a: "Warmchain is a platform that helps founders package their startup into a clean, shareable profile. Instead of sending decks, docs, or long DMs every time you ask for a warm intro, you share one link. Connectors get everything they need to decide in 30 seconds: your stage, traction, ask, and team—all on one page."
      },
      {
        id: 'who-for',
        q: "Who is Warmchain for?",
        a: "Warmchain is built for founders who need warm intros to raise capital, hire cofounders, close partnerships, or find customers. If you're tired of explaining your startup from scratch every time, Warmchain is for you."
      },
      {
        id: 'how-different',
        q: "How is this different from LinkedIn or AngelList?",
        a: "LinkedIn and AngelList are discovery platforms—they help you find people. Warmchain optimizes for the warm intro workflow itself. We don't have feeds, follower counts, or broadcasting. Instead, we give you a structured format that respects connector time and makes it easy to say yes."
      },
      {
        id: 'setup-time',
        q: "How long does it take to create a profile?",
        a: "Less than 10 minutes. You fill out 7 fields (company name, one-liner, stage, traction, ask, team, links) and you're done. No design work, no complex setup."
      }
    ],
    product: [
      {
        id: 'how-works',
        q: "How does Warmchain work?",
        a: "It's simple: (1) Create your profile in ~10 minutes. (2) Get a shareable link like warmchain.com/yourname. (3) Use that link every time you ask for an intro. Connectors see your full context on one page and can decide quickly whether to help."
      },
      {
        id: 'who-sees',
        q: "Who can see my profile?",
        a: "Only people you share the link with. We don't have a public directory or feed. Your profile is private by default—you control who sees it."
      },
      {
        id: 'update',
        q: "Can I update my profile after creating it?",
        a: "Yes. You can edit your profile anytime. When you update your traction or ask, everyone with your link sees the latest version automatically."
      },
      {
        id: 'multiple',
        q: "Can I create multiple profiles?",
        a: "Right now, each user can create one profile. If you're working on multiple projects, you can update your profile to reflect your current focus."
      },
      {
        id: 'analytics',
        q: "Can I see who viewed my profile?",
        a: "Not yet, but this is on our roadmap. For now, focus on sharing your link and tracking intro outcomes manually."
      }
    ],
    pricing: [
      {
        id: 'cost',
        q: "How much does Warmchain cost?",
        a: "Warmchain is currently free during our beta phase. No credit card required."
      },
      {
        id: 'future-pricing',
        q: "Will it always be free?",
        a: "We plan to introduce paid plans in the future for features like intro request workflows, analytics, and priority support. But the core profile creation and sharing will remain free."
      },
      {
        id: 'refund',
        q: "Do you offer refunds?",
        a: "Since Warmchain is free right now, refunds don't apply. When we launch paid plans, we'll have a clear refund policy."
      }
    ],
    privacy: [
      {
        id: 'data-stored',
        q: "What data do you store?",
        a: "We store the information you provide in your profile (company name, one-liner, stage, traction, ask, team, links) and your account details (email, password). We don't sell your data or share it with third parties."
      },
      {
        id: 'delete-account',
        q: "Can I delete my account?",
        a: "Yes. Contact us at hello@warmchain.com and we'll delete your account and all associated data within 30 days."
      },
      {
        id: 'secure',
        q: "Is my data secure?",
        a: "Yes. We use industry-standard encryption for data storage and transmission. Your password is hashed, and we follow best practices for security."
      },
      {
        id: 'sharing',
        q: "Do you share my data with investors or connectors?",
        a: "No. We only display the information you choose to put in your public profile when someone visits your link. We never share your email, contact info, or account details."
      }
    ],
    technical: [
      {
        id: 'browsers',
        q: "What browsers are supported?",
        a: "Warmchain works on all modern browsers: Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version."
      },
      {
        id: 'mobile',
        q: "Does Warmchain work on mobile?",
        a: "Yes! Warmchain is fully responsive and works great on mobile devices. You can create and share profiles from your phone."
      },
      {
        id: 'export',
        q: "Can I export my profile data?",
        a: "Not yet, but we're building an export feature. For now, you can copy your profile content manually."
      },
      {
        id: 'api',
        q: "Do you have an API?",
        a: "Not yet. If you're interested in API access, let us know at hello@warmchain.com."
      }
    ]
  }

  const allQuestions = Object.values(faqs).flat()
  const filteredQuestions = searchQuery 
    ? allQuestions.filter(faq => 
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const currentQuestions = searchQuery ? filteredQuestions : faqs[openCategory as keyof typeof faqs]

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
            <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/faq" className="text-sm text-white font-medium">
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
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl mb-8">
            <span className="text-sm font-medium text-emerald-400">
              Got questions? We've got answers.
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Frequently Asked
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Everything you need to know about Warmchain. Can't find what you're looking for? Use the AI assistant below.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur-xl"
            />
            <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Category Pills */}
          {!searchQuery && (
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setOpenCategory(cat.id)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    openCategory === cat.id
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Questions */}
          <div className="max-w-4xl mx-auto space-y-4">
            {searchQuery && filteredQuestions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-xl text-gray-400">No results found for "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Clear search
                </button>
              </div>
            )}

            {currentQuestions && currentQuestions.map((faq) => (
              <div
                key={faq.id}
                className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.05] hover:border-emerald-500/20 transition-all duration-300"
              >
                <button
                  onClick={() => setOpenQuestion(openQuestion === faq.id ? null : faq.id)}
                  className="w-full px-8 py-6 text-left flex justify-between items-center gap-4 group"
                >
                  <span className="text-lg font-semibold group-hover:text-emerald-400 transition-colors">
                    {faq.q}
                  </span>
                  <svg 
                    className={`w-6 h-6 text-gray-400 transition-all duration-300 flex-shrink-0 ${
                      openQuestion === faq.id ? 'rotate-180 text-emerald-400' : ''
                    }`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ${
                    openQuestion === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-8 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-6">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still have questions CTA */}
      <section className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/10 to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="text-5xl mb-6">💬</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Still have questions?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Can't find the answer you're looking for? We're here to help.
          </p>
          <a 
            href="mailto:hello@warmchain.com"
            className="inline-block px-10 py-4 bg-white text-black font-bold rounded-full hover:scale-105 hover:shadow-[0_0_40px_rgba(52,211,153,0.6)] transition-all duration-300"
          >
            Contact Support
          </a>
        </div>
      </section>

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
                <li><Link href="/#product" className="text-gray-500 hover:text-white transition-colors">How it works</Link></li>
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
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}