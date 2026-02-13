import { useState, useEffect, useRef } from 'react';

export default function CountUp({ value, duration = 800, format, className = '' }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const raf = useRef();

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const diff = end - start;
    if (Math.abs(diff) < 1) { setDisplay(value); prev.current = value; return; }

    const t0 = performance.now();
    const animate = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + diff * eased);
      if (p < 1) raf.current = requestAnimationFrame(animate);
      else prev.current = value;
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <span className={className}>{format ? format(display) : Math.round(display).toLocaleString()}</span>;
}
