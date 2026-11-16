'use client';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { btn } from './button';
export function Button({ intent, size, className, ...p }) { return <button className={clsx(btn({ intent, size }), className)} {...p} />; }
// Critically damped spring (Apple default: no overshoot) for scroll reveals.
export function Reveal({ children, className, delay = 0 }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', duration: 0.7, bounce: 0, delay }}>{children}</motion.div>
  );
}
