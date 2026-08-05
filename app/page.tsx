"use client";

import { useState } from "react";
import Image from "next/image";

type TourCard = {
  title: string;
  price: string;
  location: string;
  image: string;
  tag: string;
};

type DestinationItem = {
  name: string;
  image: string;
};

type FooterColumnProps = {
  title: string;
  links: string[];
};

const tourCards: TourCard[] = [
  {
    title: "Sydney Sailing Experience",
    price: "$530",
    location: "Sydney",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    tag: "On Sale",
  },
  {
    title: "Coastal Adventure Route",
    price: "$480",
    location: "Melbourne",
    image:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80",
    tag: "Popular",
  },
  {
    title: "Luxury Campervan Journey",
    price: "$620",
    location: "Auckland",
    image:
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=900&q=80",
    tag: "Best Deal",
  },
  {
    title: "Island Diving Package",
    price: "$390",
    location: "Fiji",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    tag: "New",
  },
];

const destinations: DestinationItem[] = [
  {
    name: "AUSTRALIA",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "NEW ZEALAND",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "FIJI",
    image:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "SOUTH EAST ASIA",
    image:
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "USA",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  },
];

const galleryImages: string[] = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=400&q=80",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      <section className="relative min-h-[640px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1900&q=85"
          alt="Ocean travel background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/55" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 text-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 via-teal-300 to-blue-500" />
            <div>
              <h1 className="text-xl font-semibold tracking-wide">travelindo</h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">
                let&apos;s ride
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-9 text-xs font-semibold uppercase tracking-[0.28em] text-white/85 md:flex">
            <a href="#" className="transition hover:text-white">
              What We Offer
            </a>
            <a href="#" className="transition hover:text-white">
              Sale
            </a>
            <a href="#" className="transition hover:text-white">
              Blog
            </a>
            <a href="#" className="transition hover:text-white">
              About Us
            </a>
            <a href="#" className="transition hover:text-white">
              Get In Touch
            </a>
          </nav>

          <div className="hidden text-xs uppercase tracking-[0.25em] text-white/80 md:block">
            Log In &nbsp; / &nbsp; Join Us
          </div>
        </header>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pt-32 text-center text-white">
          <h2 className="text-3xl font-bold uppercase tracking-[0.2em] md:text-5xl">
            Find All Tours, Activities and Courses!
          </h2>
          <p className="mt-4 text-sm tracking-[0.22em] text-white/80">
            Skydive, surf course, kayaking tours, diving trips, guided tours and much more!
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {["✈", "🚗", "🚌", "🛏"].map((icon, index) => (
              <button
                key={icon}
                type="button"
                className={`grid h-12 w-12 place-items-center rounded-full text-lg shadow-lg ${
                  index === 0 ? "bg-orange-500 text-white" : "bg-white text-slate-600"
                }`}
                aria-label={`Tour category ${index + 1}`}
              >
                {icon}
              </button>
            ))}

            <div className="mt-4 flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:mt-0 md:flex-row md:rounded-full">
              <input
                className="h-14 flex-1 px-6 text-sm text-slate-700 outline-none"
                placeholder="Start location"
              />
              <input
                className="h-14 flex-1 border-t border-slate-100 px-6 text-sm text-slate-700 outline-none md:border-l md:border-t-0"
                placeholder="End location"
              />
              <input
                type="date"
                className="h-14 flex-1 border-t border-slate-100 px-6 text-sm text-slate-700 outline-none md:border-l md:border-t-0"
              />
              <button
                type="button"
                className="h-14 bg-sky-600 px-9 text-xs font-bold uppercase tracking-[0.25em] text-white transition hover:bg-sky-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-5">
          {[
            ["🏆", "Certified Agents"],
            ["🗺", "30.000+ Things To Do"],
            ["⭐", "3.000+ Tour Operators"],
            ["🚐", "500+ Rental Companies"],
            ["☎", "Excellent Customer Support"],
          ].map(([icon, text]) => (
            <div
              key={text}
              className="flex min-h-28 flex-col items-center justify-center border-r border-slate-100 px-4 text-center"
            >
              <div className="text-2xl text-cyan-500">{icon}</div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-light uppercase tracking-[0.26em] text-slate-700 md:text-5xl">
            Best Sellers & Hot Deals
          </h2>
          <p className="mt-4 text-sm tracking-[0.16em] text-slate-400">
            Recommended tours & activities in Sydney
          </p>

          <div className="mt-8 flex justify-center gap-3">
            {["✈", "🚗", "🚌", "🛏"].map((icon) => (
              <button
                key={icon}
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-orange-400 hover:text-orange-500"
                aria-label={`Filter ${icon}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-7 md:grid-cols-4">
          {tourCards.map((item) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-sm bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
            >
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
                <div className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white">
                  ♥
                </div>
                <div className="absolute right-0 top-0 bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
                  {item.tag}
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
                <p className="mt-3 text-3xl font-light text-sky-600">{item.price}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>📍 {item.location}</span>
                  <span>•</span>
                  <span>3 days / 2 nights</span>
                </div>

                <p className="mt-4 text-xs leading-6 text-slate-500">
                  Enjoy a curated travel experience with scenic routes, flexible schedule,
                  and friendly local assistance.
                </p>

                <button
                  type="button"
                  className="mt-5 rounded-full bg-orange-500 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-orange-600"
                >
                  Read More
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        {destinations.slice(0, 2).map((item) => (
          <DestinationBlock key={item.name} item={item} large />
        ))}
      </section>

      <section className="grid md:grid-cols-3">
        {destinations.slice(2).map((item) => (
          <DestinationBlock key={item.name} item={item} />
        ))}
      </section>

      <section className="relative overflow-hidden py-24 text-center">
        <Image
          src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1600&q=80"
          alt="Customer review background"
          fill
          sizes="100vw"
          className="object-cover opacity-10"
        />
        <div className="relative mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-light uppercase tracking-[0.28em] text-slate-700 md:text-5xl">
            Customer Reviews
          </h2>
          <p className="mt-8 text-sm leading-8 text-slate-500">
            “Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vel mauris
            mauris finibus fringilla. Morbi molestie odio erat tincidunt, in fermentum
            nunc convallis.”
          </p>
          <p className="mt-6 text-sm font-bold text-slate-700">- Dexter Morgan, UK</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-3xl">◎</div>
          <button
            type="button"
            className="mt-4 border border-slate-300 px-5 py-2 text-xs font-bold uppercase tracking-widest"
          >
            Follow
          </button>
          <p className="mt-6 text-xs leading-6 text-slate-500">
            Follow us & share your Travelindo experience with us.
          </p>
          <p className="mt-3 text-xs font-bold text-sky-600">#travelindo</p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {galleryImages.map((src, index) => (
            <div key={src} className="relative aspect-square overflow-hidden">
              <Image
                src={src}
                alt={`Gallery ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-500 hover:scale-110"
              />
              <div className="absolute bottom-2 right-2 text-white">◎</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-300">
        <div className="border-b border-white/10 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
            <h3 className="text-xl font-light uppercase tracking-[0.2em]">
              Subscribe To Our Emails
            </h3>
            <div className="flex w-full max-w-lg overflow-hidden rounded-full bg-white">
              <input
                className="h-12 flex-1 px-6 text-sm text-slate-700 outline-none"
                placeholder="Enter Your Email Address"
              />
              <button
                type="button"
                className="bg-orange-500 px-7 text-xs font-bold uppercase tracking-widest text-white"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
          <FooterColumn
            title="Navigation"
            links={["Home", "Sale", "Blog", "About Us", "Get In Touch"]}
          />
          <FooterColumn
            title="Top Destinations"
            links={["Australia", "New Zealand", "Fiji", "South East Asia", "USA"]}
          />
          <FooterColumn
            title="Account"
            links={["Login", "Register", "My Backpack", "Wishlist", "Payment Methods"]}
          />
          <FooterColumn
            title="Terms"
            links={["Privacy Policy", "Terms of Use", "Sitemap", "Price Guarantee"]}
          />
        </div>

        <div className="mx-auto flex max-w-6xl items-center justify-between border-t border-white/10 px-6 py-6 text-xs text-slate-500">
          <p>© 2026 Travelindo. All Rights Reserved.</p>
          <div className="flex gap-3">
            <span>●</span>
            <span>●</span>
            <span>●</span>
          </div>
        </div>
      </footer>

      <FloatingAiChat />
    </main>
  );
}

function DestinationBlock({
  item,
  large = false,
}: {
  item: DestinationItem;
  large?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden ${large ? "h-72" : "h-64"}`}>
      <Image
        src={item.image}
        alt={item.name}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition duration-700 hover:scale-110"
      />
      <div className="absolute inset-0 bg-slate-950/40" />
      <div className="absolute inset-0 grid place-items-center">
        <h3 className="text-3xl font-bold uppercase tracking-[0.22em] text-white md:text-4xl">
          {item.name}
        </h3>
      </div>
    </div>
  );
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
        {title}
      </h4>
      <ul className="mt-5 space-y-3 text-sm text-slate-500">
        {links.map((link) => (
          <li key={link}>
            <a href="#" className="transition hover:text-white">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-24 cursor-pointer border-none bg-transparent p-0 sm:bottom-7 sm:right-7 sm:w-72 md:w-80"
          aria-label="Buka Tanya AI"
        >
          <img
            src="/animasi.gif"
            alt="Tanya AI"
            className="h-auto w-full drop-shadow-2xl transition duration-300 hover:scale-105"
          />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-[390px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.25)] sm:bottom-7 sm:right-7">
          <div className="flex items-center justify-between bg-sky-600 px-5 py-4 text-white">
            <div>
              <h3 className="text-sm font-bold">Tanya AI Travelindo</h3>
              <p className="text-xs text-white/80">
                Asisten wisata siap membantu
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-lg transition hover:bg-white/25"
              aria-label="Tutup dialog"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
              Halo! Mau cari paket wisata, destinasi, atau rekomendasi perjalanan?
            </div>

            <div className="space-y-3">
              <button
                type="button"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
              >
                Rekomendasikan destinasi populer
              </button>

              <button
                type="button"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
              >
                Cari paket wisata sesuai budget
              </button>

              <button
                type="button"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
              >
                Tanya jadwal dan aktivitas
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <input
                type="text"
                placeholder="Tulis pertanyaan..."
                className="h-10 flex-1 text-sm text-slate-700 outline-none"
              />
              <button
                type="button"
                className="rounded-full bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-orange-600"
              >
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}