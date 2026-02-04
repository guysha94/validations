'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        window.scrollTo(0, 0);
        // If you are using a custom scrollable div, replace window.scrollTo with
        // a ref and the scrollTop property of that element (e.g., mainContentRef.current.scrollTop = 0;)
    }, [pathname]); // This runs the effect whenever the route changes

    return null; // This component doesn't render anything
}