import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowRight, BadgeCheck, FileText, Gauge, ShieldCheck, Sparkles, Video, WalletCards } from "lucide-react";

const features = [
  {
    title: "Video + Voice First",
    desc: "Start onboarding with live camera and voice interactions designed for mobile users.",
    Icon: Video,
  },
  {
    title: "Gesture-Friendly UX",
    desc: "A calm interface that supports communication through speech and sign gestures.",
    Icon: ShieldCheck,
  },
  {
    title: "Smart Assistance",
    desc: "Capture information naturally while the app guides each step clearly.",
    Icon: Sparkles,
  },
  {
    title: "Faster Decisions",
    desc: "Move from onboarding to review screens with less friction and fewer drop-offs.",
    Icon: Gauge,
  },
];

const steps = [
  {
    title: "Open link",
    desc: "Start from your secure campaign link. No app download or long setup needed.",
    Icon: FileText,
  },
  {
    title: "Join call",
    desc: "Allow camera and microphone access, then begin the guided video application.",
    Icon: Video,
  },
  {
    title: "Verify details",
    desc: "Complete voice prompts, ID checks, and liveness verification in one calm flow.",
    Icon: BadgeCheck,
  },
  {
    title: "Get offer",
    desc: "Review the next-step result after your profile and risk signals are processed.",
    Icon: WalletCards,
  },
];

export default function Landing() {
  return (
    <div className="w-full pb-12">
      <nav className="mb-12 rounded-full border border-black/10 bg-white/80 px-4 py-2 backdrop-blur sm:px-5">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="LoanVision AI" className="h-6 w-6" />
            <span className="text-sm font-semibold sm:text-base">LoanVision AI</span>
          </Link>
          <div className="hidden items-center justify-center gap-16 text-sm sm:flex">
            <a href="#home" className="text-black/70 transition-colors hover:text-black">
              Home
            </a>
            <a href="#features" className="text-black/70 transition-colors hover:text-black">
            Features
            </a>
            <a href="#how-it-works" className="text-black/70 transition-colors hover:text-black">
            How it works
            </a>
            <a href="#faq" className="text-black/70 transition-colors hover:text-black">
            FAQ
            </a>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Link to="/login" className="block">
              <Button variant="outline" size="sm" className="h-9 px-4">
                Login
              </Button>
            </Link>
            <Link to="/login" className="block">
              <Button size="sm" className="h-9 px-4">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section id="home" className="py-2 text-center">
        <p className="mx-auto mb-3 inline-block rounded-full bg-soft-yellow px-3 py-1 text-xs font-medium"> Easy loan assessment</p>
        <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight my-2 sm:text-7xl">
          Video-Based Digital Loan Origination System.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-black/65 sm:text-base">
          LoanVision AI helps run a cleaner onboarding journey with video, voice, and guided interactions in one place.
        </p>
        <div className="mx-auto mt-7 w-full max-w-xs">
          <Link to="/dashboard" className="block">
            <Button className="px-16">Start Call</Button>
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <div className="mx-auto mt-5 w-full max-w-4xl rounded-3xl border border-black/15 bg-black p-2 shadow-sm">
          <video
            className="aspect-video w-full rounded-2xl bg-black"
            controls
            preload="metadata"
            poster="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80"
          >
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <section id="features" className="my-24 rounded-4xl bg-white/55 px-4 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.35fr] lg:items-stretch">
          <div className="flex flex-col justify-between">
            <div>
              <p className="inline-flex rounded-full border border-black/15 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-black">
                Services
              </p>
              <h2 className="mt-5 max-w-sm text-3xl font-semibold leading-tight text-black sm:text-4xl">
                Explore our comprehensive service offerings
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-black/60">
                Focused on your loan journey, our guided video flow helps collect details, verify identity, and move applications forward with clarity.
              </p>
            </div>

            <Link to="/dashboard" className="mt-8 inline-flex w-fit">
              <Button className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ Icon, ...item }, index) => (
            <div
              key={item.title}
              className={`min-h-44 rounded-3xl p-6 shadow-sm transition-transform hover:-translate-y-1 ${
                index === 0 || index === 3 ? "bg-soft-yellow" : "bg-white"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-8 text-base font-semibold text-black">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-black/60">{item.desc}</p>
            </div>
          ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="my-24 rounded-4xl bg-white/55 px-4 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-black/15 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-black">
              Process
            </p>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight text-black sm:text-4xl">
              Move from first tap to loan decision
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-black/60">
              The application flow keeps each step clear: open the link, join the call, verify details, and review the next result.
            </p>
          </div>

          <Link to="/dashboard" className="inline-flex w-fit">
            <Button className="gap-2">
              Start Flow
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ Icon, title, desc }, index) => (
            <div
              key={title}
              className={`flex min-h-44 gap-4 rounded-3xl p-5 shadow-sm transition-transform hover:-translate-y-1 ${
                index === 1 || index === 3 ? "bg-soft-blue" : "bg-white"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-black">{title}</p>
                <p className="mt-3 text-sm leading-6 text-black/60">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="my-24">
        <div className="grid gap-10 md:grid-cols-[0.42fr_1fr] md:gap-12">
          <div>
            <h2 className="text-4xl font-semibold leading-tight">Any questions? We got you.</h2>
            <p className="mt-5 max-w-sm text-sm text-black/65">
              Find quick answers about setup, onboarding, and account access before you begin.
            </p>
            <a href="#faq" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
              More FAQs <span aria-hidden="true">→</span>
            </a>
          </div>

          <div>
            <details className="group border-b border-black/20 py-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
                How does this work?
                <span className="text-xl leading-none group-open:hidden">+</span>
                <span className="hidden text-xl leading-none group-open:inline">−</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm text-black/65">
                Open the secure link, complete the guided video interaction, and proceed with the next-step decision flow.
              </p>
            </details>

            <details className="group border-b border-black/20 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
                Are there any additional fees?
                <span className="text-xl leading-none group-open:hidden">+</span>
                <span className="hidden text-xl leading-none group-open:inline">−</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm text-black/65">
                No platform fee is charged for basic onboarding access. Any product pricing terms are shown transparently
                during the process.
              </p>
            </details>

            <details className="group border-b border-black/20 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
                How can I get the app?
                <span className="text-xl leading-none group-open:hidden">+</span>
                <span className="hidden text-xl leading-none group-open:inline">−</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm text-black/65">
                No app download is required. You can use the flow directly in your mobile or desktop browser.
              </p>
            </details>

            <details className="group border-b border-black/20 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
                What features do you offer?
                <span className="text-xl leading-none group-open:hidden">+</span>
                <span className="hidden text-xl leading-none group-open:inline">−</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm text-black/65">
                Core features include guided video onboarding, voice interaction, smart data capture, and progress
                visibility for operators.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="mt-14 border-t border-black/10 bg-soft-yellow px-4 py-8 text-center">
        <h3 className="text-2xl font-semibold">Start onboarding today</h3>
        <p className="mt-2 text-sm text-black/65">Simple, clean, and fast from first tap to final screen.</p>
        <div className="mx-auto mt-5 grid w-full max-w-md grid-cols-2 gap-3">
          <Link to="/dashboard" className="block">
            <Button className="w-full">Open App</Button>
          </Link>
          <Link to="/login" className="block">
            <Button variant="outline" className="w-full">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      <footer className="mt-12 border-t border-black/10 pt-6">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-black/60 sm:flex-row">
          <p>© 2026 LoanVision AI</p>
          <div className="flex items-center gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
