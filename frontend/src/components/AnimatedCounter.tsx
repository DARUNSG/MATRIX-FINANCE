import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0
}) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const [displayValue, setDisplayValue] = useState(prefix + (0).toLocaleString() + suffix);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return spring.on('change', (latest) => {
      const formatted = latest.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      setDisplayValue(`${prefix}${formatted}${suffix}`);
    });
  }, [spring, prefix, suffix, decimals]);

  return <motion.span className="inline-block">{displayValue}</motion.span>;
};
