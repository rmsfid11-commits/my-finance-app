import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';

function EditableNumber({ value, onSave, format, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleClick = () => {
    setInputValue(String(value));
    setEditing(true);
  };

  const handleSave = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed !== value) {
      onSave(parsed);
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="!w-28 !py-1.5 !px-2 !text-sm !rounded-lg text-center font-semibold !bg-[#0D1117] !border-[#3182F6] !text-white"
        style={{ boxShadow: '0 0 0 3px rgba(49,130,246,0.15)' }}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={`cursor-pointer inline-flex items-center gap-0.5 bg-[#3182F6]/8 border-b border-dashed border-[#3182F6]/30 rounded px-1 py-0.5 transition-colors hover:bg-[#3182F6]/15 ${className}`}
      title="클릭하여 수정"
    >
      <span className="truncate">{format ? format(value) : value?.toLocaleString()}</span>
      <Pencil size={9} className="text-[#3182F6]/40 ml-0.5 shrink-0" />
    </span>
  );
}

export default EditableNumber;
