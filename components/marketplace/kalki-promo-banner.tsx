/**
 * @file components/marketplace/kalki-promo-banner.tsx
 * @description Refer & Earn campaign banner. Styles live in app/globals.css (.kalki-promo).
 * The artwork is a local SVG (public/brand/referral-art.svg).
 */

"use client";

import React from "react";

interface KalkiPromoBannerProps {
  onReferNow: () => void;
}

export default function KalkiPromoBanner({ onReferNow }: KalkiPromoBannerProps) {
  return (
    <section aria-labelledby="referral-heading">
      <div className="kalki-promo">
        <div className="kalki-promo__copy">
          <p className="kalki-promo__eyebrow">Refer &amp; earn</p>
          <h3 id="referral-heading" className="kalki-promo__title">
            <span>
              Give <b>₹50.</b>
            </span>
            <span>
              Get <b>₹50.</b>
            </span>
          </h3>
          <p className="kalki-promo__text">
            Share your code with friends in Indore. They save ₹50 on their first ride, and you earn ₹50 credit.
          </p>
          <button type="button" onClick={onReferNow} className="kalki-promo__cta">
            Refer now
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/referral-art.svg"
          alt=""
          aria-hidden="true"
          width={460}
          height={280}
          loading="lazy"
          decoding="async"
          className="kalki-promo__art"
        />
      </div>
    </section>
  );
}
