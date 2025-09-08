import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useInView = ({
  threshold = 0,
  rootMargin = '0px',
  triggerOnce = false
}: UseInViewOptions = {}) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 如果不支持IntersectionObserver，直接设为可见
    if (!window.IntersectionObserver) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setInView(isIntersecting);

        if (isIntersecting && triggerOnce) {
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, inView };
};