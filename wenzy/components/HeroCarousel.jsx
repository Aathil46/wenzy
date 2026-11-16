'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { mediaUrl } from '@/lib/supabase';
import { btn } from './button';

const textPositions = {
  'left top': 'items-start justify-start text-left',
  'center top': 'items-center justify-start text-center',
  'right top': 'items-end justify-start text-right',
  'left center': 'items-start justify-center text-left',
  'center center': 'items-center justify-center text-center',
  'right center': 'items-end justify-center text-right',
  'left bottom': 'items-start justify-end text-left',
  'center bottom': 'items-center justify-end text-center',
  'right bottom': 'items-end justify-end text-right',
};

function Arrow({ direction }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d={direction === 'next' ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>;
}

function SlideMedia({ slide, active }) {
  const desktopUrl = slide.media_path ? mediaUrl(slide.media_path) : null;
  const mobileUrl = slide.mobile_media_path ? mediaUrl(slide.mobile_media_path) : desktopUrl;
  if (!desktopUrl) return <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(255,255,255,.16),transparent_28%),linear-gradient(120deg,#262626,#050505_58%,#737373)]" />;
  if (slide.media_type === 'video') return <video className="absolute inset-0 h-full w-full object-cover" src={desktopUrl} autoPlay={active} muted loop playsInline style={{ objectPosition: slide.image_position || 'center center' }} />;
  return <picture className="absolute inset-0 block h-full w-full"><source media="(max-width: 767px)" srcSet={mobileUrl || desktopUrl} /><img src={desktopUrl} alt="" className="h-full w-full object-cover" loading={active ? 'eager' : 'lazy'} style={{ objectPosition: slide.image_position || 'center center' }} /></picture>;
}

export default function HeroCarousel({ banners = [] }) {
  const slides = useMemo(() => banners, [banners]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const current = slides[index] || slides[0];
  const interval = 6500;
  const textClass = textPositions[current?.text_position] || textPositions['left bottom'];

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (reduced || paused || document.hidden || slides.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), interval);
    return () => window.clearInterval(timer);
  }, [interval, paused, reduced, slides.length]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const move = (offset) => setIndex((value) => (value + offset + slides.length) % slides.length);
  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  if (!slides.length) return null;

  return (
    <section className="hero-carousel relative h-[min(82vh,860px)] min-h-[620px] overflow-hidden bg-[#090909] text-white" aria-roledescription="carousel" aria-label="WENZY featured collections" onMouseEnter={pause} onMouseLeave={resume} onFocus={pause} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) resume(); }}>
      {slides.map((slide, slideIndex) => {
        const active = slideIndex === index;
        return <div key={slide.id || slideIndex} className={`absolute inset-0 transition-[opacity,transform] duration-700 ${active ? 'z-10 opacity-100' : 'z-0 opacity-0'} ${reduced ? '!transition-none' : ''}`} aria-hidden={!active}>
          <SlideMedia slide={slide} active={active} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.7),rgba(0,0,0,.16)_58%,rgba(0,0,0,.28)),linear-gradient(0deg,rgba(0,0,0,.68),transparent_62%)]" />
          <div className={`relative mx-auto flex h-full max-w-[1440px] flex-col px-6 pb-24 pt-28 sm:px-10 lg:px-16 ${textClass}`}>
            <div className={`hero-copy max-w-2xl ${active ? 'hero-copy-visible' : ''}`}>
              <p className="text-[.68rem] font-semibold uppercase tracking-[.28em] text-white/70">{slide.eyebrow || 'WENZY / FEATURED'}</p>
              <h1 className="mt-5 max-w-3xl text-[clamp(3.2rem,8vw,8.4rem)] font-semibold uppercase leading-[.88] tracking-[-.055em]">{slide.headline || 'WEAR YOUR EDGE.'}</h1>
              {slide.subheadline && <p className="mt-6 max-w-md text-sm leading-6 text-white/75 sm:text-base">{slide.subheadline}</p>}
              {slide.cta_label && slide.cta_href && <Link href={slide.cta_href} className={`${btn({ intent: 'light' })} mt-8 !border-white/30 !bg-white !text-black`}>{slide.cta_label}</Link>}
            </div>
          </div>
        </div>;
      })}

      {slides.length > 1 && <>
        <div className="absolute bottom-8 left-6 z-20 flex items-center gap-2 sm:left-10 lg:left-16">
          <button type="button" className="hero-control" onClick={() => move(-1)} aria-label="Previous slide"><Arrow direction="previous" /></button>
          <button type="button" className="hero-control" onClick={() => move(1)} aria-label="Next slide"><Arrow direction="next" /></button>
        </div>
        <div className="absolute bottom-9 right-6 z-20 flex items-center gap-2 sm:right-10 lg:right-16" role="tablist" aria-label="Choose featured slide">
          {slides.map((slide, slideIndex) => <button key={slide.id || slideIndex} type="button" role="tab" aria-selected={slideIndex === index} aria-label={`Go to slide ${slideIndex + 1}`} className={`h-1 transition-all duration-300 ${slideIndex === index ? 'w-12 bg-white' : 'w-5 bg-white/40 hover:bg-white'}`} onClick={() => setIndex(slideIndex)} />)}
        </div>
      </>}
      <div className="absolute bottom-9 left-1/2 z-20 hidden -translate-x-1/2 text-[.62rem] uppercase tracking-[.25em] text-white/50 md:block">WEAR YOUR EDGE.</div>
    </section>
  );
}
