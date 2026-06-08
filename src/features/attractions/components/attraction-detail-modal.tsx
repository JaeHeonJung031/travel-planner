"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import type { AttractionResult } from "@/server/ai/types";
import { Clock, ExternalLink, MapPin, Star, Ticket, X } from "lucide-react";

type Props = {
  attraction: AttractionResult | null;
  onClose: () => void;
};

export function AttractionDetailModal({ attraction, onClose }: Props) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const photos =
    attraction?.imageUrls?.length
      ? attraction.imageUrls
      : attraction?.imageUrl
        ? [attraction.imageUrl]
        : [];

  useEffect(() => {
    setPhotoIndex(0);
    setLightbox(false);
  }, [attraction?.id]);

  useEffect(() => {
    if (!attraction) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (lightbox) {
        setLightbox(false);
        return;
      }
      onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [attraction, onClose, lightbox]);

  if (!attraction) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${attraction.lat},${attraction.lng}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${attraction.name} 상세 정보`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="닫기"
        onClick={onClose}
      />

      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0">
          {photos.length > 0 ? (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="relative block aspect-[4/3] w-full cursor-zoom-in bg-slate-100 sm:aspect-[16/10]"
              aria-label="사진 크게 보기"
            >
              <Image
                src={photos[photoIndex]}
                alt={attraction.name}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
              <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                탭하여 확대
              </span>
              {photos.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2.5 py-1 text-lg text-white backdrop-blur-sm hover:bg-black/55"
                    aria-label="이전 사진"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoIndex((i) => (i + 1) % photos.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2.5 py-1 text-lg text-white backdrop-blur-sm hover:bg-black/55"
                    aria-label="다음 사진"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoIndex(i);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          i === photoIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"
                        }`}
                        aria-label={`사진 ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </button>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-slate-500 sm:aspect-[16/10]">
              사진 없음
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/65"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">{attraction.name}</h2>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-800">
              <Star size={15} className="fill-amber-500 text-amber-500" />
              {attraction.rating}
            </span>
          </div>

          {attraction.bestVisitTags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {attraction.bestVisitTags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {attraction.fee ? (
              <p className="flex items-center gap-2">
                <Ticket size={16} className="shrink-0 text-rose-500" />
                입장료 {attraction.fee}
              </p>
            ) : null}
            {attraction.hours ? (
              <p className="flex items-center gap-2">
                <Clock size={16} className="shrink-0 text-slate-400" />
                운영 {attraction.hours}
              </p>
            ) : null}
            {attraction.address ? (
              <p className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                {attraction.address}
              </p>
            ) : null}
          </div>

          {attraction.description ? (
            <p className="mt-4 text-sm leading-relaxed text-slate-700">{attraction.description}</p>
          ) : null}

          {attraction.highlights?.length ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-900">볼거리</h3>
              <ul className="mt-2 space-y-1.5">
                {attraction.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-rose-400">·</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {attraction.tips ? (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-900">여행 팁</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-950/90">{attraction.tips}</p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              닫기
            </Button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-600"
            >
              <ExternalLink size={16} />
              지도에서 보기
            </a>
          </div>
        </div>
      </div>

      {lightbox && photos.length > 0 ? (
        <div
          className="fixed inset-0 z-[110] flex flex-col bg-black/95"
          role="dialog"
          aria-label="사진 확대 보기"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="닫기"
            onClick={() => setLightbox(false)}
          />
          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-4 pt-14">
            <Image
              src={photos[photoIndex]}
              alt={attraction.name}
              width={1600}
              height={1200}
              className="relative z-10 max-h-[85vh] w-auto max-w-full object-contain"
              unoptimized
            />
            {photos.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
                  }}
                  className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-2xl text-white hover:bg-white/25"
                  aria-label="이전"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex((i) => (i + 1) % photos.length);
                  }}
                  className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-2xl text-white hover:bg-white/25"
                  aria-label="다음"
                >
                  ›
                </button>
                <p className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-sm text-white/80">
                  {photoIndex + 1} / {photos.length}
                </p>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 z-20 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            aria-label="닫기"
          >
            <X size={24} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
