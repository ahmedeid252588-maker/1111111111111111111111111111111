
import React, { Component, ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { NeumorphicButton } from './Neumorphic';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#f5f5f5]" dir="rtl">
          <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-500 mb-6 flex items-center justify-center shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff]">
            <CircleAlert size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[#4a4a4a] mb-4">عذراً، حدث خطأ ما</h2>
          <p className="text-slate-500 mb-8 max-w-md">لقد واجهنا مشكلة تقنية. يرجى محاولة إعادة تحميل الصفحة.</p>
          <NeumorphicButton onClick={() => window.location.reload()}>إعادة التحميل</NeumorphicButton>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-white rounded-xl text-left text-xs overflow-auto max-w-full text-red-400 border border-red-100">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
