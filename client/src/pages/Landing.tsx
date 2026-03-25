import { Link } from "wouter";
import { QrCode, Bot, MessageSquare, BarChart3, CheckCircle, ArrowRight, Utensils, Globe, Zap, Clock } from "lucide-react";

const DEMO_SLUG = "test-restaurant-tetove";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 text-foreground">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-100 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Utensils className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">HAJDE HA</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Log in
              </span>
            </Link>
            <Link href="/register">
              <span className="text-sm font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer">
                Get started
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
          <Zap className="h-3.5 w-3.5" />
          30-day free trial · No credit card needed
        </div>
        <h1 className="text-5xl sm:text-6xl font-black text-foreground leading-[1.08] tracking-tight mb-6">
          The digital menu<br />
          <span className="text-primary">your restaurant deserves</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Give customers a beautiful QR menu, real-time table ordering, AI waiter suggestions, and WhatsApp receipts — all without a single app download.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register">
            <span className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-primary text-primary-foreground text-base font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-primary/20">
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link href={`/restaurant/${DEMO_SLUG}`}>
            <span className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-stone-100 dark:bg-stone-800 text-foreground text-base font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer">
              See a live menu
            </span>
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-stone-50 dark:bg-stone-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center text-foreground mb-3">Everything in one platform</h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            Built specifically for restaurants in Macedonia. Supports Albanian, Macedonian, and English out of the box.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: QrCode,
                color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
                title: "QR Menu",
                desc: "Customers scan and browse your full menu instantly. No app, no friction.",
              },
              {
                icon: Bot,
                color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
                title: "AI Waiter",
                desc: "Smart dish recommendations and allergy info powered by AI — in any language.",
              },
              {
                icon: MessageSquare,
                color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                title: "WhatsApp Bill",
                desc: "Customers request the bill and receive an itemized receipt via WhatsApp.",
              },
              {
                icon: BarChart3,
                color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                title: "Live Orders",
                desc: "See every table's order in real time. No missed orders, no shouting.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-black text-center text-foreground mb-3">Up and running in 5 minutes</h2>
        <p className="text-muted-foreground text-center mb-14">No technical knowledge required.</p>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Sign up & add your menu", desc: "Create your account, enter your restaurant details, and add your dishes — categories, prices, photos, languages." },
            { step: "2", title: "Print your table QR codes", desc: "Download QR codes for each table directly from your dashboard. Print, laminate, done." },
            { step: "3", title: "Watch orders come in", desc: "Customers scan, browse, and order. You see everything live. Send the bill with one tap." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col items-start">
              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-black mb-5">
                {step}
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Multilingual callout ── */}
      <section className="bg-primary/5 dark:bg-primary/10 border-y border-primary/10 py-14">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center gap-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground mb-2">Albanian · Macedonian · English</h3>
            <p className="text-muted-foreground">
              Every menu, every button, every receipt — available in all three languages. Customers choose their language the moment they scan, and the whole experience switches instantly.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="max-w-6xl mx-auto px-4 py-20" id="pricing">
        <h2 className="text-3xl font-black text-center text-foreground mb-3">Simple pricing</h2>
        <p className="text-muted-foreground text-center mb-14">
          Start free. Pay after your trial by bank transfer — no complicated payment setup.
        </p>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Trial */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 p-7 flex flex-col">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Free Trial</div>
            <div className="text-4xl font-black text-foreground mb-1">0 MKD</div>
            <div className="text-sm text-muted-foreground mb-6">for 30 days</div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {["All features included", "Unlimited menu items", "Real-time orders", "AI waiter", "WhatsApp receipts"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/register">
              <span className="block w-full text-center px-5 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-foreground font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer text-sm">
                Start for free
              </span>
            </Link>
          </div>

          {/* Monthly */}
          <div className="rounded-2xl border-2 border-primary p-7 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded-full bg-primary text-primary-foreground">
              MOST POPULAR
            </div>
            <div className="text-sm font-semibold text-primary mb-2">Monthly</div>
            <div className="text-4xl font-black text-foreground mb-1">990 <span className="text-xl font-semibold text-muted-foreground">MKD</span></div>
            <div className="text-sm text-muted-foreground mb-6">per month</div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {["Everything in trial", "Priority support", "Custom domain ready", "Analytics dashboard", "Cancel anytime"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/register">
              <span className="block w-full text-center px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity cursor-pointer text-sm">
                Start free trial
              </span>
            </Link>
          </div>

          {/* Annual */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 p-7 flex flex-col">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Annual</div>
            <div className="text-4xl font-black text-foreground mb-1">9,900 <span className="text-xl font-semibold text-muted-foreground">MKD</span></div>
            <div className="text-sm text-muted-foreground mb-6">per year · save 2 months</div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {["Everything in Monthly", "2 months free", "Dedicated onboarding", "Priority feature requests", "Invoice provided"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/register">
              <span className="block w-full text-center px-5 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-foreground font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer text-sm">
                Start free trial
              </span>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2">
          <Clock className="h-4 w-4" />
          After your 30-day trial, contact us to activate your plan via bank transfer. No automatic charges.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-stone-100 dark:border-stone-800 py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Utensils className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">HAJDE HA</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Made for restaurants in Macedonia · Tetovë
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/auth/login"><span className="hover:text-foreground transition-colors cursor-pointer">Login</span></Link>
            <Link href="/register"><span className="hover:text-foreground transition-colors cursor-pointer">Register</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
