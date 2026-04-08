"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Vote } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface AssembleiaAberta {
  id: string;
  titulo: string;
}

export default function FloatingVotarButton() {
  const [assembleias, setAssembleias] = useState<AssembleiaAberta[]>([]);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);

  useEffect(() => {
    fetch(`${API_URL}/assembleias/abertas/`)
      .then((r) => r.json())
      .then((data: AssembleiaAberta[]) => {
        setAssembleias(data);
        if (data.length > 0) {
          setDragPos({
            x: window.innerWidth - 220,
            y: window.innerHeight - 160,
          });
          setReady(true);
        }
      })
      .catch(() => {});
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      wasDragged.current = false;
      dragOffset.current = {
        x: e.clientX - dragPos.x,
        y: e.clientY - dragPos.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [dragPos]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    wasDragged.current = true;
    setDragPos({
      x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y)),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  if (!ready || assembleias.length === 0) return null;

  const target = assembleias[0];

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "fixed",
        left: dragPos.x,
        top: dragPos.y,
        zIndex: 9999,
        touchAction: "none",
        userSelect: "none",
        cursor: dragging.current ? "grabbing" : "grab",
      }}
      className="flex flex-col items-center gap-1"
    >
      <a
        href={`/votacao/${target.id}`}
        onClick={(e) => {
          if (wasDragged.current) e.preventDefault();
        }}
        className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold px-10 py-5 rounded-2xl shadow-2xl transition-colors select-none animate-pulse"
      >
        <Vote className="w-8 h-8" />
        VOTAR
      </a>
      <span className="text-[10px] text-gray-400 select-none">
        arraste para mover
      </span>
    </div>
  );
}
