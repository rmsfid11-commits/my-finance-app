import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Undo2 } from 'lucide-react';

function Toast() {
  const { toast, setToast } = useStore();
  const [visible, setVisible] = useState(false);
  const dismiss = () => { setVisible(false); setTimeout(() => setToast(null), 300); };

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const t = setTimeout(dismiss, toast.duration || 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (!toast) return null;

  const isWarn = toast.type === 'warn';
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-md transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium ${isWarn ? 'bg-[#FF9F43]/15 border-[#FF9F43]/30 text-[#FF9F43]' : 'border-c-border text-c-text'}`} style={!isWarn ? { background: 'var(--c-card-solid)' } : {}}>
        <span className="flex-1">{toast.message}</span>
        {toast.undo && <button onClick={() => { toast.undo(); dismiss(); }} className="flex items-center gap-1 text-[#3182F6] font-bold shrink-0"><Undo2 size={14} /> 되돌리기</button>}
        {toast.action && <span className="text-[#3182F6] font-bold shrink-0">{toast.action}</span>}
        <button onClick={dismiss} className="text-c-text3 shrink-0"><X size={14} /></button>
      </div>
    </div>
  );
}

export default Toast;
