import { clsx, type ClassValue } from "clsx"

/**
 * UX4G-compatible className utility
 * Combines multiple class names (no tailwind-merge needed)
 */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs)
}
