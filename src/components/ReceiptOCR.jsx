import { useState, useRef } from 'react';
import { Camera, Loader2, X, Check } from 'lucide-react';

const extractData = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let amount = null, date = null, place = null;

  // 금액: 가장 큰 숫자 (콤마 포함)
  const amounts = [];
  for (const line of lines) {
    const matches = line.match(/[\d,]+원|합\s*계\s*[\d,]+|총\s*[\d,]+|[\d]{1,3}(,\d{3})+/g);
    if (matches) matches.forEach(m => {
      const n = parseInt(m.replace(/[^0-9]/g, ''));
      if (n >= 100 && n < 100000000) amounts.push(n);
    });
  }
  if (amounts.length) amount = Math.max(...amounts);

  // 날짜
  for (const line of lines) {
    const dm = line.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/) || line.match(/(\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
    if (dm) { const y = dm[1].length === 2 ? '20' + dm[1] : dm[1]; date = `${y}-${dm[2].padStart(2,'0')}-${dm[3].padStart(2,'0')}`; break; }
  }

  // 장소: 첫 번째 한글 포함 라인 (숫자만 있는 라인 제외)
  for (const line of lines.slice(0, 5)) {
    if (/[가-힣]{2,}/.test(line) && !/^\d+$/.test(line) && !/전화|번호|사업자/.test(line)) { place = line.substring(0, 20); break; }
  }

  return { amount, date, place };
};

export default function ReceiptOCR({ onResult, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const processImage = async (file) => {
    setProcessing(true); setError(null);
    try {
      const url = URL.createObjectURL(file);
      setPreview(url);
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('kor+eng');
      const { data: { text } } = await worker.recognize(url);
      await worker.terminate();
      URL.revokeObjectURL(url);
      const extracted = extractData(text);
      setResult(extracted);
    } catch (e) {
      console.error('OCR error:', e);
      setError('인식 실패. 다시 시도해주세요.');
    }
    setProcessing(false);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) processImage(f);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-fade" onClick={onClose}>
      <div className="glass rounded-3xl p-6 mx-4 max-w-sm w-full animate-pop" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-c-text">영수증 스캔</h3>
          <button onClick={onClose} className="text-c-text3"><X size={18} /></button>
        </div>

        {!preview && !processing && (
          <div className="space-y-3">
            <button onClick={() => fileRef.current?.click()} className="w-full flex flex-col items-center gap-3 p-8 glass-inner rounded-2xl">
              <Camera size={32} className="text-[#3182F6]" />
              <span className="text-sm font-medium text-c-text2">사진 촬영 또는 갤러리에서 선택</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          </div>
        )}

        {processing && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={32} className="text-[#3182F6] animate-spin" />
            <span className="text-sm text-c-text2">영수증 인식 중...</span>
          </div>
        )}

        {error && <div className="text-center py-4 text-sm text-[#FF4757]">{error}</div>}

        {result && (
          <div className="space-y-3">
            {preview && <img src={preview} alt="receipt" className="w-full h-32 object-cover rounded-xl" />}
            <div className="glass-inner rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-c-text2">금액</span><span className="font-bold text-c-text">{result.amount ? `${result.amount.toLocaleString()}원` : '인식 불가'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-c-text2">날짜</span><span className="font-bold text-c-text">{result.date || '인식 불가'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-c-text2">장소</span><span className="font-bold text-c-text">{result.place || '인식 불가'}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setPreview(null); setResult(null); }} className="flex-1 py-3 glass-inner rounded-2xl text-sm font-semibold text-c-text2">다시 촬영</button>
              <button onClick={() => { onResult(result); onClose(); }} className="flex-1 py-3 bg-[#3182F6] rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-1"><Check size={16} /> 적용</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
