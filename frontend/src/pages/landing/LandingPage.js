import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../api/services';
import {
  Zap, Brain, BarChart3, Shield, Clock, CheckCircle,
  ArrowRight, Star, ChevronDown, Menu, X, Sparkles, Target,
  Layers
} from 'lucide-react';

const NAV_LINKS = ['Features', 'How It Works', 'Pricing', 'Testimonials'];

const FEATURES = [
  { icon: Brain, title: 'AI Resume Parsing', desc: 'Instantly extract skills, experience, and education from any resume format using advanced NLP.' },
  { icon: Target, title: 'Semantic Matching', desc: 'Match candidates to jobs based on meaning, not just keywords. Find the best fit every time.' },
  { icon: BarChart3, title: 'Explainable Scoring', desc: 'Transparent AI scores with detailed breakdowns — know exactly why a candidate ranks high.' },
  { icon: Layers, title: 'Pipeline Tracking', desc: '7-stage visual pipeline from application to hire. Move candidates with a single click.' },
  { icon: Clock, title: 'Interview Automation', desc: 'Schedule interviews and send email invites automatically. Save hours every week.' },
  { icon: Shield, title: 'Duplicate Detection', desc: 'AI-powered duplicate candidate detection keeps your talent pool clean and accurate.' },
];



const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Head of Talent, Nexus Corp', text: 'TalentFlow AI cut our time-to-hire by 60%. The AI scoring is incredibly accurate and the explainability feature builds trust with our hiring managers.', rating: 5 },
  { name: 'Marcus Williams', role: 'VP People, ScaleUp Inc', text: 'We went from reviewing 500 resumes manually to having AI shortlist the top 10 in minutes. Game-changing for our recruiting team.', rating: 5 },
  { name: 'Priya Sharma', role: 'Recruiting Lead, TechVentures', text: 'The semantic matching is unlike anything I\'ve used. It finds candidates we would have missed with keyword-only search.', rating: 5 },
];

const PRICING = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    desc: 'Perfect for small teams',
    features: ['Up to 5 active jobs', '100 AI resume parses/mo', 'Basic pipeline tracking', 'Email notifications'],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/month',
    desc: 'For growing companies',
    features: ['Unlimited active jobs', '1,000 AI parses/mo', 'Full pipeline + kanban', 'Smart shortlisting', 'Explainable AI', 'Priority support'],
    cta: 'Start Hiring Today',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations',
    features: ['Unlimited everything', 'Custom AI models', 'SSO & advanced security', 'Dedicated success manager', 'SLA guarantee', 'API access'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Post Your Job', desc: 'Create detailed job postings with required skills, experience, and salary range in minutes.' },
  { step: '02', title: 'AI Parses Resumes', desc: 'Upload resumes and our AI instantly extracts structured data — skills, experience, education.' },
  { step: '03', title: 'Smart Ranking', desc: 'Candidates are automatically scored and ranked by relevance to your specific job requirements.' },
  { step: '04', title: 'Hire the Best', desc: 'Move top candidates through your pipeline, schedule interviews, and make confident offers.' },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    dashboardAPI.getStats().then((res) => setLiveStats(res.data.stats)).catch(() => {});
  }, []);

  const faqs = [
    { q: 'How does the AI resume parsing work?', a: 'Our AI uses large language models to read and understand resume content, extracting structured data like skills, work history, and education — regardless of format.' },
    { q: 'Is my data secure?', a: 'Yes. All data is encrypted at rest and in transit. We are SOC 2 compliant and never share your candidate data with third parties.' },
    { q: 'Can I try it before buying?', a: 'Absolutely. We offer a 14-day free trial with full access to all Professional features. No credit card required.' },
    { q: 'How accurate is the AI scoring?', a: 'Our AI achieves 85%+ accuracy in candidate-job matching, validated against real hiring outcomes across thousands of placements.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/10' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">TalentFlow <span className="text-violet-400">AI</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                {l}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2 rounded-lg transition-all"
            >
              Start Hiring Today
            </Link>
          </div>

          <button className="md:hidden text-gray-400" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-[#0d0d14] border-t border-white/10 px-6 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileOpen(false)} className="block text-sm text-gray-400 hover:text-white py-1">
                {l}
              </a>
            ))}
            <Link to="/login" className="block text-sm text-gray-400 hover:text-white py-1">Sign In</Link>
            <Link to="/register" className="block text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-center">
              Start Hiring Today
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-medium px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Limited Early Access Available
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            <span className="text-white">Hire Smarter</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              with AI
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-4 leading-relaxed">
            Transform Your Recruitment Process with intelligent automation, semantic matching, and explainable AI that finds the best talent faster.
          </p>

          <p className="text-lg text-gray-500 mb-10">
            AI-Powered Hiring. Smarter Decisions. Better Teams.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
            >
              Start Hiring Today
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all"
            >
              View Live Demo
            </Link>
          </div>

          <p className="text-xs text-gray-600 mt-5">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>

        {/* Hero Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-1">
            <div className="bg-[#0d0d18] rounded-xl overflow-hidden">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="flex-1 mx-4 bg-white/5 rounded-md px-3 py-1 text-xs text-gray-500">app.talentflow.ai/dashboard</div>
              </div>
              {/* Fake dashboard */}
              <div className="p-6 grid grid-cols-4 gap-3">
                {[
                  ['Active Jobs', liveStats?.activeJobs ?? '—', 'bg-violet-500/20 text-violet-400'],
                  ['Candidates', liveStats?.totalCandidates ?? '—', 'bg-indigo-500/20 text-indigo-400'],
                  ['Applications', liveStats?.totalApplications ?? '—', 'bg-blue-500/20 text-blue-400'],
                  ['Hired', liveStats?.hired ?? '—', 'bg-emerald-500/20 text-emerald-400'],
                ].map(([label, val, cls]) => (
                  <div key={label} className={`${cls} rounded-xl p-4`}>
                    <p className="text-xs opacity-70 mb-1">{label}</p>
                    <p className="text-2xl font-bold">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-violet-600/20 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: liveStats ? liveStats.activeJobs : '—', label: 'Active Jobs' },
            { value: liveStats ? liveStats.totalCandidates : '—', label: 'Candidates' },
            { value: liveStats ? liveStats.totalApplications : '—', label: 'Applications' },
            { value: liveStats ? liveStats.hired : '—', label: 'Hired' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-1">
                {value}
              </p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Find the Best Talent Faster
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Every tool you need to run a modern, AI-powered recruitment operation — in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group bg-white/3 hover:bg-white/6 border border-white/8 hover:border-violet-500/30 rounded-2xl p-6 transition-all duration-300">
                <div className="w-11 h-11 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-violet-950/20 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Transform Your Recruitment Process
            </h2>
            <p className="text-gray-400 text-lg">From job post to hire in 4 simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-violet-500/40 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="text-5xl font-black text-violet-500/20 mb-3">{step}</div>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl font-black text-white mb-4">Trusted by Hiring Teams</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, rating }) => (
              <div key={name} className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">"{text}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{name}</p>
                  <p className="text-xs text-gray-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl font-black text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400">Start free. Scale as you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map(({ name, price, period, desc, features, cta, highlight }) => (
              <div
                key={name}
                className={`relative rounded-2xl p-6 border transition-all ${
                  highlight
                    ? 'bg-gradient-to-b from-violet-600/20 to-indigo-600/10 border-violet-500/50 shadow-lg shadow-violet-500/10'
                    : 'bg-white/3 border-white/8'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <p className="font-bold text-white mb-1">{name}</p>
                <p className="text-xs text-gray-500 mb-4">{desc}</p>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-black text-white">{price}</span>
                  <span className="text-gray-500 text-sm mb-1">{period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center text-sm font-semibold py-3 rounded-xl transition-all ${
                    highlight
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20'
                      : 'bg-white/8 hover:bg-white/12 text-white border border-white/10'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white">{q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border border-violet-500/30 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/10" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Limited Early Access Available
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                AI-Powered Hiring.<br />
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Smarter Decisions. Better Teams.
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Join hundreds of companies already hiring smarter with TalentFlow AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-violet-500/30 hover:-translate-y-0.5"
                >
                  Start Hiring Today
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all"
                >
                  Sign In to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">TalentFlow <span className="text-violet-400">AI</span></span>
          </div>
          <p className="text-xs text-gray-600">© 2025 TalentFlow AI · Smart ATS Hiring Suite · All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Security'].map((l) => (
              <span key={l} className="text-xs text-gray-600 hover:text-gray-400 transition-colors cursor-pointer">{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
