import { motion } from 'framer-motion';

function PageWrapper({ children }) {
  return (
    <motion.section
      className="min-h-[calc(100vh-140px)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

export default PageWrapper;
