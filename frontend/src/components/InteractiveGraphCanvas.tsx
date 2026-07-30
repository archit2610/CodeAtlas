import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface GraphVisualNode {
  id: string;
  name: string;
  angle: number; // in degrees
  color: string;
  count: number;
}

interface InteractiveGraphCanvasProps {
  nodes: GraphVisualNode[];
  onSelectCategory: (category: string) => void;
  selectedCategory: string | null;
}

export const InteractiveGraphCanvas: React.FC<InteractiveGraphCanvasProps> = ({
  nodes,
  onSelectCategory,
  selectedCategory
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Convert polar coordinates (angle, radius) to Cartesian (x, y) centered at (50, 50)
  const getCoordinates = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: 50 + radius * Math.cos(rad),
      y: 50 + radius * Math.sin(rad),
    };
  };

  return (
    <div className="flex w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[520px] shrink-0 items-center justify-center self-center my-2 mx-auto select-none px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        className="relative w-full aspect-square border border-[#262B33] rounded-3xl bg-[#181C22]/95 backdrop-blur-xl p-8 shadow-2xl flex items-center justify-center overflow-visible"
      >
        {/* Glowing Background Radial Halo */}
        <div className="absolute inset-0 bg-radial from-[#38BDF8]/10 via-transparent to-transparent pointer-events-none rounded-3xl" />

        {/* SVG Graphic Canvas */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-8 overflow-visible">
          <defs>
            <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Central Orbit Circle (radius=28, strokeWidth=0.18) */}
          <circle
            cx="50"
            cy="50"
            r="28"
            fill="none"
            stroke="#E4E1D6"
            strokeWidth="0.18"
            opacity="0.45"
            strokeDasharray="1 1"
          />

          {/* Core Repository Hub Node (50, 50) */}
          <circle cx="50" cy="50" r="14" fill="url(#hubGlow)" opacity="0.25" />
          <circle cx="50" cy="50" r="4" fill="#12151A" stroke="#38BDF8" strokeWidth="0.8" />
          <text
            x="50"
            y="50.8"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#38BDF8"
            fontSize="2.2"
            fontWeight="800"
            className="font-mono tracking-widest uppercase pointer-events-none"
          >
            CORE
          </text>

          {/* Radiating Edges & Nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredId === node.id || selectedCategory === node.id;
            const lineEnd = getCoordinates(node.angle, 30);

            return (
              <g key={node.id} className="cursor-pointer" onClick={() => onSelectCategory(node.id)}>
                {/* Radiating Line from center (50,50) to (lineEnd.x, lineEnd.y) */}
                <line
                  x1="50"
                  y1="50"
                  x2={lineEnd.x}
                  y2={lineEnd.y}
                  stroke={node.color}
                  strokeWidth={isHovered ? "0.6" : "0.22"}
                  opacity={isHovered ? "1" : "0.5"}
                  style={{ transition: 'all 0.3s ease' }}
                />

                {/* Node End Dot */}
                <circle
                  cx={lineEnd.x}
                  cy={lineEnd.y}
                  r={isHovered ? "2.2" : "1.5"}
                  fill={node.color}
                  opacity={isHovered ? "1" : "0.85"}
                  style={{ transition: 'all 0.3s ease' }}
                />
              </g>
            );
          })}
        </svg>

        {/* HTML Positioned Floating Text Labels (Padded Radius 37 to avoid edge clipping) */}
        <div className="absolute inset-0 pointer-events-none p-6">
          {nodes.map((node, index) => {
            const isHovered = hoveredId === node.id || selectedCategory === node.id;
            const pos = getCoordinates(node.angle, 36);

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.4 + index * 0.15,
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectCategory(node.id)}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute pointer-events-auto cursor-pointer"
              >
                <div
                  className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-all duration-250 ${
                    isHovered
                      ? 'bg-[#1E232B] border border-[#38BDF8] shadow-lg shadow-[#38BDF8]/20 scale-105 z-20'
                      : 'bg-[#12151A]/90 border border-[#262B33] hover:border-[#38BDF8]/60'
                  }`}
                >
                  <span
                    style={{
                      color: isHovered ? node.color : '#E4E1D6',
                      fontWeight: isHovered ? 800 : 500,
                    }}
                    className="text-[11px] uppercase font-mono tracking-wider whitespace-nowrap"
                  >
                    {node.name}
                  </span>
                  <span className="text-[10px] text-[#8A8F97] font-mono font-bold">
                    {node.count} files
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
