"use client";

import { useEffect, useRef } from "react";

/**
 * Pósters del fondo de la portada en móvil/tablet, pintados en un
 * <canvas> cuando la página ya ha cargado.
 *
 * Antes eran <img> con prioridad, y como son lo más grande de la
 * pantalla el navegador los tomaba por el "contenido principal" (LCP):
 * la portada parecía tardar ~5 s en cargar en móvil por una decoración.
 * Un canvas no cuenta para esa medida y no compite con lo importante.
 *
 * Misma colocación que tenían (relativa a la pantalla, fija al hacer
 * scroll).
 */

type Slot = {
  src: string;
  // Esquina de referencia y desplazamiento, en px CSS
  x: number;
  y: number;
  fromRight?: boolean;
  fromBottom?: boolean;
  w: number;
  h: number;
  rotate: number; // grados
  alpha: number;
};

const SLOTS: Slot[] = [
  { src: "/posters/dune.jpg", x: -120, y: 0, w: 280, h: 420, rotate: -15, alpha: 0.35 },
  { src: "/posters/interstellar.jpg", x: -120, y: 80, fromRight: true, w: 280, h: 420, rotate: 15, alpha: 0.35 },
  { src: "/posters/shogun.jpg", x: -80, y: 120, fromBottom: true, w: 260, h: 380, rotate: 12, alpha: 0.3 },
  { src: "/posters/thebear.jpg", x: -80, y: 0, fromRight: true, fromBottom: true, w: 260, h: 380, rotate: -12, alpha: 0.3 },
];

// Versión reducida de cada póster (next/image), no el JPG original
function optimized(src: string) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=384&q=60`;
}

function load(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = optimized(src);
  });
}

function draw(canvas: HTMLCanvasElement, images: (HTMLImageElement | null)[]) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  SLOTS.forEach((slot, index) => {
    const image = images[index];

    if (!image) return;

    const left = slot.fromRight ? width - slot.x - slot.w : slot.x;
    const top = slot.fromBottom ? height - slot.y - slot.h : slot.y;

    ctx.save();
    ctx.globalAlpha = slot.alpha;
    ctx.filter = "blur(1px)";
    ctx.translate(left + slot.w / 2, top + slot.h / 2);
    ctx.rotate((slot.rotate * Math.PI) / 180);

    // Esquinas redondeadas (rounded-2xl)
    ctx.beginPath();
    ctx.roundRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h, 16);
    ctx.clip();

    // Como object-cover: recorta la imagen para llenar el hueco
    const scale = Math.max(slot.w / image.width, slot.h / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;

    ctx.drawImage(image, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  });
}

export default function MobilePosterCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;

    if (!canvas) return;

    let images: (HTMLImageElement | null)[] = [];
    let cancelled = false;

    const start = async () => {
      images = await Promise.all(SLOTS.map((slot) => load(slot.src)));

      if (cancelled) return;

      draw(canvas, images);
      canvas.style.opacity = "1";
    };

    const onLoad = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => void start(), { timeout: 2000 });
      } else {
        setTimeout(() => void start(), 200);
      }
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    const onResize = () => {
      if (images.length) draw(canvas, images);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full opacity-0 transition-opacity duration-1000 lg:hidden"
    />
  );
}
