"use client";

import { useEffect, useState } from "react";

export default function CosmicBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#fcfbf7] pointer-events-none">
      {/* Dynamic Stars */}
      <div className="stars-container">
        <div className="star star-layer-1"></div>
        <div className="star star-layer-2"></div>
        <div className="star star-layer-3"></div>
      </div>

      {/* Rotating Earth (Transparent/Glowing Wireframe) */}
      <div className="earth-container absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 mix-blend-screen">
        <div className="earth-sphere">
          {/* Latitude lines */}
          <div className="lat-line lat-1"></div>
          <div className="lat-line lat-2"></div>
          <div className="lat-line lat-3"></div>
          
          {/* Longitude lines (Animated) */}
          <div className="lon-line lon-1"></div>
          <div className="lon-line lon-2"></div>
          <div className="lon-line lon-3"></div>
          <div className="lon-line lon-4"></div>
          <div className="lon-line lon-5"></div>
          <div className="lon-line lon-6"></div>
        </div>
      </div>

      <style jsx>{`
        /* --- STARS --- */
        .stars-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .star {
          position: absolute;
          background: transparent;
          width: 2px;
          height: 2px;
          border-radius: 50%;
        }

        /* Generate random box shadows for stars */
        .star-layer-1 {
          animation: moveStars 100s linear infinite;
          box-shadow: ${generateStars(150)};
        }
        .star-layer-2 {
          width: 3px;
          height: 3px;
          animation: moveStars 150s linear infinite;
          box-shadow: ${generateStars(100)};
        }
        .star-layer-3 {
          width: 4px;
          height: 4px;
          animation: moveStars 200s linear infinite;
          box-shadow: ${generateStars(50)};
          opacity: 0.8;
        }

        @keyframes moveStars {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-2000px);
          }
        }

        /* --- EARTH --- */
        .earth-container {
          width: 80vmin;
          height: 80vmin;
          max-width: 800px;
          max-height: 800px;
          border-radius: 50%;
          position: absolute;
          perspective: 1000px;
          filter: drop-shadow(0 0 40px rgba(153, 255, 102, 0.15));
        }

        .earth-sphere {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid rgba(43, 27, 27, 0.15);
          position: relative;
          transform-style: preserve-3d;
          animation: spinEarth 30s linear infinite;
          box-shadow: inset 0 0 60px rgba(43, 27, 27, 0.05);
        }

        /* Latitude Lines (Horizontal) */
        .lat-line {
          position: absolute;
          width: 100%;
          border: 1px solid rgba(43, 27, 27, 0.1);
          border-radius: 50%;
          left: 0;
        }
        .lat-1 { height: 86%; top: 7%; }
        .lat-2 { height: 50%; top: 25%; }
        .lat-3 { height: 98%; top: 1%; }

        /* Longitude Lines (Vertical) */
        .lon-line {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 1px solid rgba(43, 27, 27, 0.15);
          border-radius: 50%;
          top: 0;
          left: 0;
        }

        .lon-1 { transform: rotateY(0deg); }
        .lon-2 { transform: rotateY(30deg); }
        .lon-3 { transform: rotateY(60deg); }
        .lon-4 { transform: rotateY(90deg); }
        .lon-5 { transform: rotateY(120deg); }
        .lon-6 { transform: rotateY(150deg); }

        @keyframes spinEarth {
          0% {
            transform: rotateY(0deg) rotateX(15deg);
          }
          100% {
            transform: rotateY(360deg) rotateX(15deg);
          }
        }
      `}</style>
    </div>
  );
}

// Helper to generate a random string of box-shadow coordinates
function generateStars(count) {
  let shadows = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 2500); // spread across large width
    const y = Math.floor(Math.random() * 2500); // spread across large height
    
    // Vary the colors slightly (Mint, Sage, White)
    const colorChance = Math.random();
    let color = "#000000"; // Carbon
    if (colorChance > 0.8) color = "#99ff66"; // Acid Lime
    else if (colorChance > 0.5) color = "#2b1b1b"; // Espresso

    shadows.push(`${x}px ${y}px ${color}`);
  }
  return shadows.join(", ");
}
