import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, LucideIcon } from 'lucide-react';

// --- Neumorphic Components ---
export interface NeumorphicCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`p-8 rounded-[40px] bg-[#f5f5f5] shadow-[12px_12px_24px_#d1d1d1,-12px_-12px_24px_#ffffff] ${className} ${onClick ? 'cursor-pointer active:shadow-inner transition-all' : ''}`}
  >
    {children}
  </div>
);

export interface NeumorphicButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({ children, onClick, className = '', variant = 'primary', disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-5 rounded-3xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
      variant === 'primary' 
        ? 'bg-[#4d9685] text-white shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:bg-[#458777]' 
        : 'bg-[#f5f5f5] text-[#4a4a4a] shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-inner'
    } ${className}`}
  >
    {children}
  </button>
);

export interface NeumorphicInputProps {
  icon?: LucideIcon;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  id?: string;
  min?: string;
}

export const NeumorphicInput: React.FC<NeumorphicInputProps> = ({ icon: Icon, placeholder, type = 'text', value, onChange, className = '', id, min }) => (
  <div className={`w-full mb-8 relative ${className}`}>
    {Icon && (
      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon size={22} />
      </div>
    )}
    <input 
      id={id}
      min={min}
      type={type} 
      placeholder={placeholder} 
      value={value}
      onChange={onChange}
      dir="rtl"
      className={`w-full h-16 ${Icon ? 'pr-16' : 'pr-6'} pl-6 bg-[#f5f5f5] rounded-[24px] shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 placeholder:text-slate-400 font-medium text-lg border-none focus:ring-2 focus:ring-[#4d9685]/10 transition-all`}
    />
  </div>
);

export interface NeumorphicSelectProps {
  icon?: LucideIcon;
  placeholder?: string;
  options: ({ label: string; value: string } | string)[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export const NeumorphicSelect: React.FC<NeumorphicSelectProps> = ({ 
  icon: Icon, 
  placeholder, 
  options, 
  value, 
  onChange, 
  className = '' 
}) => (
  <div className={`w-full mb-8 relative ${className}`}>
    {Icon && (
      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <Icon size={22} />
      </div>
    )}
    <select 
      value={value || ""}
      onChange={onChange}
      dir="rtl"
      className={`w-full h-16 ${Icon ? 'pr-16' : 'pr-6'} pl-12 bg-[#f5f5f5] rounded-[24px] shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 font-medium text-lg border-none focus:ring-2 focus:ring-[#4d9685]/10 transition-all appearance-none`}
    >
      {placeholder ? <option key="placeholder" value="" disabled>{placeholder}</option> : null}
      {Array.isArray(options) ? options.filter(Boolean).map((opt, idx) => {
        const isString = typeof opt === 'string';
        const val = isString ? opt : opt.value;
        const lbl = isString ? opt : opt.label;
        const key = isString ? `opt-s-${opt}-${idx}` : `opt-o-${opt.value}-${idx}`;
        return <option key={key} value={val}>{lbl}</option>;
      }) : null}
    </select>
    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
      <ChevronRight size={20} className="-rotate-90" />
    </div>
  </div>
);

export interface NeumorphicTextAreaProps {
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  rows?: number;
}

export const NeumorphicTextArea: React.FC<NeumorphicTextAreaProps> = ({ placeholder, value, onChange, className = '', rows = 4 }) => (
  <div className={`w-full mb-8 relative ${className}`}>
    <textarea 
      placeholder={placeholder} 
      value={value}
      onChange={onChange}
      rows={rows}
      dir="rtl"
      className="w-full p-6 bg-[#f5f5f5] rounded-[24px] shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 placeholder:text-slate-400 font-medium text-lg border-none focus:ring-2 focus:ring-[#4d9685]/10 transition-all resize-none"
    />
  </div>
);

export interface NeumorphicSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const NeumorphicSwitch: React.FC<NeumorphicSwitchProps> = ({ label, checked, onChange, className = '' }) => (
  <div className={`flex items-center justify-between p-6 rounded-3xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] ${className}`}>
    <span className="font-bold text-slate-600">{label}</span>
    <button 
      onClick={() => onChange(!checked)}
      className={`w-14 h-8 rounded-full transition-all relative ${checked ? 'bg-[#4d9685] shadow-inner' : 'bg-[#e0e0e0] shadow-inner'}`}
    >
      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${checked ? 'right-7' : 'right-1'}`} />
    </button>
  </div>
);

export const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="w-12 h-12 rounded-2xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-slate-400 hover:text-[#4d9685] transition-colors"
  >
    <ChevronRight size={24} />
  </button>
);
