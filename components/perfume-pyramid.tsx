"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type Note = {
  name: string;
  icon: string;
};

type PerfumePyramidProps = {
  topNotes: Note[];
  heartNotes: Note[];
  baseNotes: Note[];
};

export function PerfumePyramid({ topNotes, heartNotes, baseNotes }: PerfumePyramidProps) {
  const hasNotes = topNotes.length > 0 || heartNotes.length > 0 || baseNotes.length > 0;

  if (!hasNotes) return null;

  return (
    <section className="mt-20 border-t border-white/5 pt-20">
      <div className="mb-12 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-gold">Olfactory Journey</p>
        <h2 className="mt-4 font-heading text-4xl text-mist">The Scent Architecture</h2>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="relative flex flex-col items-center gap-16">
          {/* Top Notes */}
          <PyramidSection
            title="The Ascension"
            subtitle="Top Notes"
            notes={topNotes}
            delay={0}
            className="w-full max-w-md"
            iconSize="lg"
          />

          {/* Heart Notes */}
          <PyramidSection
            title="The Soul"
            subtitle="Heart Notes"
            notes={heartNotes}
            delay={0.2}
            className="w-full max-w-2xl"
            iconSize="md"
          />

          {/* Base Notes */}
          <PyramidSection
            title="The Eternity"
            subtitle="Base Notes"
            notes={baseNotes}
            delay={0.4}
            className="w-full"
            iconSize="sm"
          />

          {/* Connecting Line (Pyramid Shape) */}
          <div className="absolute left-1/2 top-0 -z-10 h-full w-px -translate-x-1/2 bg-gradient-to-b from-gold/40 via-gold/10 to-transparent" />
        </div>
      </div>
    </section>
  );
}

function PyramidSection({
  title,
  subtitle,
  notes,
  delay,
  className = "",
  iconSize = "md"
}: {
  title: string;
  subtitle: string;
  notes: Note[];
  delay: number;
  className?: string;
  iconSize?: "sm" | "md" | "lg";
}) {
  if (notes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
      className={`flex flex-col items-center text-center ${className}`}
    >
      <div className="mb-6">
        <h3 className="font-heading text-2xl tracking-wide text-gold">{title}</h3>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{subtitle}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {notes.map((note, index) => (
          <div key={`${note.name}-${index}`} className="group flex flex-col items-center gap-4">
            {/* The Circle of Design */}
            <div className={`relative overflow-hidden rounded-full border-[3px] border-charcoal bg-midnight ring-1 ring-gold/40 transition-all duration-700 group-hover:ring-gold group-hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] ${
              iconSize === "lg" ? "h-28 w-28" : iconSize === "md" ? "h-24 w-24" : "h-20 w-20"
            }`}>
              {/* Image with object-cover to fill the circle */}
              <Image
                src={note.icon}
                alt={note.name}
                fill
                sizes={iconSize === "lg" ? "112px" : iconSize === "md" ? "96px" : "80px"}
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
              />
              
              {/* Dark Overlay for premium feel (Fragrantica style) */}
              <div className="absolute inset-0 bg-black/20 transition-opacity duration-500 group-hover:opacity-0" />
              
              {/* Gold Inner Stroke Effect */}
              <div className="absolute inset-0 rounded-full border border-gold/10 pointer-events-none" />
            </div>
            
            <span className="max-w-[120px] text-center text-[10px] font-bold uppercase tracking-[0.2em] text-mist/60 transition-colors duration-300 group-hover:text-gold">
              {note.name}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
