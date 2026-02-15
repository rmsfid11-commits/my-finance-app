function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="px-4 py-3 rounded-xl shadow-xl text-sm min-w-[120px] border border-c-border" style={{ background: 'var(--c-card-solid)', color: 'var(--c-text)' }}>
      {label && <div className="text-xs mb-1.5" style={{ color: 'var(--c-text2)' }}>{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.stroke || '#3182F6' }} />
          <span className="text-xs" style={{ color: 'var(--c-text2)' }}>{entry.name || entry.dataKey}</span>
          <span className="font-semibold ml-auto">{formatter ? formatter(entry.value) : entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default CustomTooltip;
