import { useState, useEffect } from 'react';

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if it's already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show iOS prompt after a short delay
      const timer = setTimeout(() => setShowInstallPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || !showInstallPrompt) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] bg-white text-[#552c24] px-4 py-3 rounded-lg shadow-[4px_4px_0px_#552c24] border-2 border-[#552c24] flex items-center justify-between gap-4 w-11/12 max-w-sm">
      <div className="flex flex-col">
        <span className="font-bold text-sm">오리쇼츠 앱 설치</span>
        {isIOS ? (
          <span className="text-xs opacity-80 mt-1">
            공유 버튼을 누르고 '홈 화면에 추가'를 선택하세요.
          </span>
        ) : (
          <span className="text-xs opacity-80 mt-1">
            앱으로 설치하여 더 빠르고 편리하게 이용하세요!
          </span>
        )}
      </div>
      {!isIOS && (
        <button 
          onClick={handleInstallClick}
          className="bg-[#ffcd4a] px-3 py-1.5 rounded-md font-bold text-xs uppercase hover:bg-[#e5b842] transition-colors"
        >
          설치
        </button>
      )}
      <button onClick={() => setShowInstallPrompt(false)} className="text-xs opacity-50 underline">
        닫기
      </button>
    </div>
  );
}
