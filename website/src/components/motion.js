export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.3, // slower staggering between children
      delayChildren: 0.1, // slightly longer delay before children appear
    },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: "easeOut" }, // slower fade up
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 1.0 }, // slower fade in
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.0, ease: "easeOut" }, // slower scale in
  },
};

export const cardHover = {
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
    transition: { duration: 0.35 }, // slower hover animation
  },
};
