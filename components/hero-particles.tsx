"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  alpha: number;
};

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    let animation = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: Math.max(40, Math.floor(rect.width / 14)) }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        radius: 0.7 + Math.random() * 2.2,
        speed: 0.08 + Math.random() * 0.28,
        drift: -0.12 + Math.random() * 0.24,
        alpha: 0.25 + Math.random() * 0.65
      }));
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);

      for (const particle of particles) {
        particle.y -= particle.speed;
        particle.x += particle.drift;

        if (particle.y < -10) {
          particle.y = rect.height + 10;
          particle.x = Math.random() * rect.width;
        }

        if (particle.x < -10) {
          particle.x = rect.width + 10;
        }

        if (particle.x > rect.width + 10) {
          particle.x = -10;
        }

        context.beginPath();
        context.fillStyle = `rgba(212, 175, 55, ${particle.alpha})`;
        context.shadowColor = "rgba(212, 175, 55, 0.5)";
        context.shadowBlur = 12;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }

      animation = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" aria-hidden="true" />;
}
