"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  {
    image: "/images/onboarding-1.png",
    title: "Find Your Perfect Flatmate",
    subtitle:
      "Swipe through verified profiles. AI matches you by lifestyle, not just budget.",
  },
  {
    image: "/images/onboarding-2.png",
    title: "Everyone is Verified",
    subtitle:
      "Every member passes email and phone verification. A trusted community, always.",
  },
  {
    image: "/images/onboarding-3.png",
    title: "Swipe, Match, Move In",
    subtitle:
      "Like a profile, get matched, and start chatting. Your new home is one swipe away.",
  },
];

export default function WelcomePage() {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const goTo = useCallback(
    (index: number, dir: "left" | "right") => {
      if (isAnimating || index < 0 || index >= slides.length) return;
      setIsAnimating(true);
      setDirection(dir);
      setTimeout(() => {
        setCurrent(index);
        setDirection(null);
        setIsAnimating(false);
      }, 250);
    },
    [isAnimating]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDelta) > 60) {
      if (touchDelta < 0 && current < slides.length - 1) {
        goTo(current + 1, "left");
      } else if (touchDelta > 0 && current > 0) {
        goTo(current - 1, "right");
      }
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  // Mouse drag for desktop
  const [mouseStart, setMouseStart] = useState<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStart(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStart === null) return;
    const delta = e.clientX - mouseStart;
    if (Math.abs(delta) > 60) {
      if (delta < 0 && current < slides.length - 1) {
        goTo(current + 1, "left");
      } else if (delta > 0 && current > 0) {
        goTo(current - 1, "right");
      }
    }
    setMouseStart(null);
  };

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (current < slides.length - 1) {
        goTo(current + 1, "left");
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [current, goTo]);

  const slide = slides[current];

  return (
    <div className="flex min-h-dvh flex-col safe-top safe-bottom">
      {/* Skip button */}
      <div className="flex justify-end px-6 pt-4">
        <Link
          href="/verify"
          className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-dark-secondary"
        >
          Skip
        </Link>
      </div>

      {/* Slide content */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 no-select touch-action-pan"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Illustration */}
        <div
          className={`mb-8 w-full max-w-[280px] transition-all duration-250 ease-out ${
            direction === "left"
              ? "animate-slide-out"
              : direction === "right"
              ? "animate-slide-out"
              : "animate-slide-in"
          }`}
          style={{
            transform: touchDelta
              ? `translateX(${touchDelta * 0.3}px)`
              : undefined,
          }}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-xl)]">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-contain"
              priority
              sizes="280px"
            />
          </div>
        </div>

        {/* Text */}
        <div
          className={`text-center transition-all duration-250 ease-out ${
            direction ? "opacity-0" : "opacity-100"
          }`}
        >
          <h1 className="mb-3 text-[28px] font-bold leading-tight text-dark">
            {slide.title}
          </h1>
          <p className="mx-auto max-w-[300px] text-base leading-relaxed text-dark-secondary">
            {slide.subtitle}
          </p>
        </div>

        {/* Dots */}
        <div className="mt-8 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() =>
                goTo(i, i > current ? "left" : "right")
              }
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-primary"
                  : "w-2.5 bg-border hover:bg-muted"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-8">
        <Link
          href="/verify"
          className="flex h-14 w-full items-center justify-center rounded-[var(--radius-lg)] bg-primary text-lg font-semibold text-white shadow-[var(--shadow-button)] transition-all duration-200 hover:bg-primary-dark hover:shadow-[var(--shadow-card)] active:scale-[0.98]"
        >
          Get Started →
        </Link>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/verify"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
