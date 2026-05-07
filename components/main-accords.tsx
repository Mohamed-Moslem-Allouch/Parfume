"use client";

import { motion } from "framer-motion";

type Accord = {
  name: string;
  value: number; // 0-100
};

type MainAccordsProps = {
  accords: Accord[];
};

const ACCORD_COLORS: Record<string, string> = {
  "sweet": "rgb(238, 54, 59)",
  "powdery": "rgb(238, 221, 204)",
  "woody": "rgb(119, 68, 20)",
  "floral": "rgb(255, 95, 141)",
  "aromatic": "rgb(55, 160, 137)",
  "citrus": "rgb(249, 255, 82)",
  "fresh spicy": "rgb(131, 201, 40)",
  "animalic": "rgb(142, 75, 19)",
  "balsamic": "rgb(173, 131, 89)",
  "warm spicy": "rgb(204, 51, 0)",
  "green": "rgb(14, 140, 29)",
  "fresh": "rgb(155, 229, 237)",
  "musky": "rgb(231, 216, 234)",
  "soft spicy": "rgb(226, 119, 82)",
  "fruity": "rgb(252, 75, 41)",
  "amber": "rgb(188, 77, 16)",
  "earthy": "rgb(84, 72, 56)",
  "white floral": "rgb(237, 242, 251)",
  "vanilla": "rgb(255, 254, 192)",
  "rose": "rgb(254, 1, 107)",
  "herbal": "rgb(108, 164, 127)",
  "patchouli": "rgb(99, 101, 46)",
  "aldehydic": "rgb(216, 233, 246)",
  "lactonic": "rgb(251, 249, 242)",
  "aquatic": "rgb(99, 204, 226)",
  "smoky": "rgb(130, 116, 135)",
  "leather": "rgb(120, 72, 58)",
  "soapy": "rgb(227, 246, 252)",
  "violet": "rgb(156, 29, 255)",
  "sour": "rgb(192, 231, 65)",
  "coffee": "rgb(84, 56, 30)",
  "lavender": "rgb(175, 155, 205)"
};

export function MainAccords({ accords }: MainAccordsProps) {
  if (!accords.length) return null;

  // Sort by value descending
  const sortedAccords = [...accords].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(...accords.map((a) => a.value));

  return (
    <section className="mt-12 lg:mt-0">
      <div className="mb-6">
        <h3 className="font-heading text-xl tracking-wider text-mist">Main Accords</h3>
      </div>
      <div className="flex flex-col">
        {sortedAccords.map((accord, index) => {
          const color = ACCORD_COLORS[accord.name.toLowerCase()] || "rgb(150, 150, 150)";
          const width = (accord.value / maxValue) * 100;
          
          const isLight = [
            "citrus", "soapy", "white floral", "vanilla", 
            "powdery", "lavender", "fresh", "aquatic"
          ].includes(accord.name.toLowerCase());

          return (
            <div key={accord.name} className="group relative h-6 w-full">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${width}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                style={{ backgroundColor: color }}
                className="absolute inset-y-0 left-0 flex items-center justify-center rounded-r-lg px-3 shadow-sm"
              >
                <span className={`whitespace-nowrap text-[10px] font-bold tracking-widest transition-transform duration-300 group-hover:scale-105 ${
                  isLight ? "text-black/70" : "text-white"
                }`}>
                  {accord.name}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
