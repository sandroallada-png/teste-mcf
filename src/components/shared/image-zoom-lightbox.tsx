
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ImageZoomLightboxProps {
    isOpen: boolean;
    imageUrl: string | null;
    onClose: () => void;
}

export function ImageZoomLightbox({ isOpen, imageUrl, onClose }: ImageZoomLightboxProps) {
    return (
        <AnimatePresence>
            {isOpen && imageUrl && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-4 md:p-12 cursor-zoom-out pointer-events-auto"
                    onPointerDownCapture={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    {/* Decorative Background Elements for Premium Feel */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-40" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] opacity-30" />
                    </div>

                    {/* Close Button - More Refined */}
                    <motion.button
                        initial={{ scale: 0.5, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="absolute top-8 right-8 z-[100000] h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 flex items-center justify-center text-white backdrop-blur-2xl group"
                        onPointerDownCapture={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300 pointer-events-none" />
                    </motion.button>

                    {/* Image Container with Elegant Shadow & Border */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                        className="relative max-w-5xl w-full h-full flex items-center justify-center cursor-zoom-out"
                    >
                        <div className="relative group/img">
                            <img
                                src={imageUrl}
                                alt="Zoom Premium"
                                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/5 transition-transform duration-700"
                            />
                            {/* Subtle Overlays for depth */}
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
