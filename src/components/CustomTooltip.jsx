function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#191F28] text-white px-4 py-3 rounded-xl shadow-xl text-sm min-w-[120px]">
      {label && <div className="text-xs text-gray-400 mb-1.5">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.stroke || '#3182F6' }} />
          <span className="text-gray-300 text-xs">{entry.name || entry.dataKey}</span>
          <span className="font-semibold ml-auto">{formatter ? formatter(entry.value) : entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default CustomTooltip;
