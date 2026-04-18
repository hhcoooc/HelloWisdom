import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthModal({ isOpen, onClose, message = "需要登录才能执行此操作" }: AuthModalProps) {
  const router = useRouter();
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Let React render the DOM first, then trigger animation classes
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${
        isVisible ? "bg-black/20 backdrop-blur-sm" : "bg-transparent backdrop-blur-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-2xl bg-white/90 p-6 text-center shadow-2xl backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-black">
          <LogIn className="h-8 w-8 ml-1" />
        </div>

        <h3 className="mb-2 text-xl font-semibold text-gray-900">需要登录</h3>
        <p className="mb-6 text-sm text-gray-600">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            稍后再说
          </button>
          <button
            onClick={() => {
              onClose();
              router.push("/login");
            }}
            className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-black/10 transition-all hover:bg-gray-800 hover:shadow-black/20 active:scale-[0.98]"
          >
            去登录
          </button>
        </div>
      </div>
    </div>
  );
}
