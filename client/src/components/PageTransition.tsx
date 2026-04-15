import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Cubic-bezier for slick feeling
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(10px)',
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
