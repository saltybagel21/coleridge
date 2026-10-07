import { renderToStaticMarkup } from 'react-dom/server';
import { AnimatePresence } from 'motion/react';
import { PublicPage } from './App';

export const renderPublicPage = () => renderToStaticMarkup(
  <AnimatePresence initial={false}>
    <PublicPage staticContent />
  </AnimatePresence>,
);
