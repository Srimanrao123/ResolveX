"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Slide = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  image: string;
};

const slides: Slide[] = [
  {
    id: "essentials",
    tag: "NEW SEASON · AUTUMN/WINTER '26",
    title: "Elevated Everyday Essentials",
    subtitle: "Crafted from heavyweight organic cotton and structured regenerative denim for a quiet, modern statement.",
    primaryCtaText: "Shop New Arrivals →",
    primaryCtaLink: "/shop",
    secondaryCtaText: "Explore Jackets",
    secondaryCtaLink: "/shop/classic-denim-jacket",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "velocity-runner",
    tag: "BESTSELLER SPOTLIGHT",
    title: "The Velocity Runner",
    subtitle: "Ultra-responsive cushioning paired with a breathable engineered knit upper. Built for daily motion.",
    primaryCtaText: "Shop The Runner →",
    primaryCtaLink: "/shop/premium-running-shoes",
    secondaryCtaText: "View Footwear",
    secondaryCtaLink: "/shop",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "minimalism",
    tag: "CURATED COLLECTION",
    title: "Relaxed Silhouettes & Tailoring",
    subtitle: "Fluid lines, premium poplin, and breathable European linens designed for effortless versatility.",
    primaryCtaText: "Explore Collection →",
    primaryCtaLink: "/shop",
    secondaryCtaText: "Poplin Shirts",
    secondaryCtaLink: "/shop/tailored-poplin-shirt",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop",
  },
];

export function HomeCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      className="carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="carousel-track">
        {slides.map((slide, index) => {
          const isActive = index === current;
          return (
            <div
              key={slide.id}
              className={`carousel-slide ${isActive ? "active" : ""}`}
              style={{
                backgroundImage: `linear-gradient(to right, rgba(17, 24, 20, 0.85) 0%, rgba(17, 24, 20, 0.55) 50%, rgba(17, 24, 20, 0.25) 100%), url(${slide.image})`,
              }}
            >
              <div className="carousel-caption">
                <span className="carousel-badge">{slide.tag}</span>
                <h1>{slide.title}</h1>
                <p>{slide.subtitle}</p>
                <div className="carousel-actions">
                  <Link href={slide.primaryCtaLink} className="button primary">
                    {slide.primaryCtaText}
                  </Link>
                  {slide.secondaryCtaText && slide.secondaryCtaLink && (
                    <Link href={slide.secondaryCtaLink} className="button ghost light">
                      {slide.secondaryCtaText}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="carousel-nav-btn prev"
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        onClick={nextSlide}
        className="carousel-nav-btn next"
        aria-label="Next slide"
      >
        ›
      </button>

      {/* Slide indicator dots */}
      <div className="carousel-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrent(index)}
            className={`carousel-dot ${index === current ? "active" : ""}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
