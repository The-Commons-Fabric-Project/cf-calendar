type ToastProps = {
  message?: string;
}

export default function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-200 bg-ink text-white px-5.5 py-3 rounded-sm text-sm font-medium shadow-[0_8px_24px_rgba(0,0,0,0.25)] animate-cf-rise max-w-[90vw] text-center font-sans">
      {message}
    </div>
  );
}