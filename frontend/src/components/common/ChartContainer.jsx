import React, { useState, useEffect, useRef } from 'react';

const ChartContainer = ({ children, className = '' }) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasSize = size.width > 0 && size.height > 0;

  return (
    <div ref={ref} className={className}>
      {hasSize ? (
        children
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-slate-500">
          Loading chart...
        </div>
      )}
    </div>
  );
};

export default ChartContainer;
