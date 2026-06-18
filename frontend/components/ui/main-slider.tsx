"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

const cards = [
  {
    image: "/cards/property1.png",
    label: "Student Properties",
    href: "/public-properties",
    arrowBg: "bg-[#b8d4f0]",
    arrowColor: "text-[#3a7bd5]",
  },
  {
    image: "/cards/marketplace1.png",
    label: "Marketplace",
    href: "/marketplace",
    arrowBg: "bg-[#fed7aa]",
    arrowColor: "text-[#c2410c]",
  },
  {
    image: "/cards/reels1.png",
    label: "Student Reels",
    href: "/reels",
    arrowBg: "bg-[#a8e6b8]",
    arrowColor: "text-[#22863a]",
  },
  { 
    image: "/cards/voucher1.png",
    label: "Student Vouchers",
    href: "/offers",
    arrowBg: "bg-[#d8cef0]",
    arrowColor: "text-[#7c4dbe]",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay },
  }),
};

export default function Index() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-white">
      {/* Nav */}
      {/* <nav className="relative z-10 flex items-center justify-end px-8 py-5">
        <div className="flex items-center gap-6 text-sm font-medium text-[#8a5a2a]">
          <a href="/auth/signin" className="hover:text-[#de8444] transition-colors">Sign in</a>
          <a href="/auth/signup" className="hover:text-[#de8444] transition-colors">Become a partner</a>
        </div>
      </nav> */}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 pb-12">
        {/* Logo */}
        <div className="sm:mb-4">
          <a href="/">
            <Image src="/smlogo-t.png" alt="StudentMoves" width={600} height={200} className="h-24 w-auto object-contain" priority />
          </a>
        </div>

        {/* Tagline */}
        <p className=" sm:text-2xl lg:text-3xl font-semibold mb-14 text-center tracking-tight">
          <span className="block text-gray-500">Everything students need. All in One Place.</span>
        </p>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-full max-w-5xl mb-10"
        >
          {cards.map((card) => (
            <motion.button
              key={card.href}
              variants={cardVariants}
              onClick={() => router.push(card.href)}
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer text-left aspect-[1] shadow-[0_4px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)] transition-shadow duration-300"
            >
              {/* Image section */}
              <div className="relative flex-1 bg-white">
                <div className={`absolute inset-0 hidden sm:block ${card.arrowBg}`} />
                <Image
                  src={card.image}
                  alt={card.label}
                  fill
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>

              {/* Footer section */}
              <div className="flex items-center justify-center sm:justify-between gap-2 px-4 py-3 bg-white">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-snug">
                  {card.label}
                </h3>
                <div className={`hidden sm:flex flex-shrink-0 items-center justify-center w-9 h-9 rounded-full ${card.arrowBg} ${card.arrowColor} transition-transform duration-200 group-hover:scale-110`}>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          custom={0.5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-3 w-full sm:w-auto"
        >
          <button
            onClick={() => router.push("/auth/signin")}
            className="bg-[#fb923c] hover:bg-[#ea580c] text-white font-semibold text-lg w-full sm:w-auto sm:px-24 py-3.5 rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Sign in
          </button>
          <a href="/auth/signup" className="text-[#8a5a2a]/70 text-sm hover:text-[#fb923c] transition-colors">
            Become a partner
          </a>
        </motion.div>
      </div>

      {/* Footer tagline */}
      <motion.p
        style={{ position: "relative", zIndex: 10 }}
        custom={0.7}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-center text-[#8a5a2a]/60 text-sm pb-8"
      >
        Your student life. Simplified. 🧡
      </motion.p>
    </section>
  );
}


