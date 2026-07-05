import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

export function SplashScreen() {
  const { loading } = useAuth();
  const [fontLoaded, setFontLoaded] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loading && fontLoaded) {
      const timer = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, fontLoaded]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 flex flex-col items-center justify-center w-screen h-screen bg-[#f5f2ed] z-[9999]"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="mb-8 relative"
          >
            <div className="absolute inset-0 bg-white rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(85,44,36,0.3)]"></div>
            <img src="/icon.png" alt="Logo" className="relative w-28 h-28 rounded-[2rem] object-cover p-1 z-10" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-black text-[#552c24] tracking-tight uppercase"
            style={{ fontFamily: 'KyoboHandwriting2024_ParkSeoWoo, sans-serif' }}
          >
            오리쇼츠
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
