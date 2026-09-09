import { MessageCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Props = {
    url: string;
    minimized?: boolean;
    onMinimizedChange?: (minimized: boolean) => void;
};

export default function MessengerButton({
    url,
    minimized,
    onMinimizedChange,
}: Props) {
    const [localMinimized, setLocalMinimized] = useState(false);
    const isMinimized = minimized ?? localMinimized;
    const expandButton = useRef<HTMLButtonElement>(null);
    const messageLink = useRef<HTMLAnchorElement>(null);
    const focusRequested = useRef(false);

    const changeMinimized = (value: boolean) => {
        focusRequested.current = true;
        setLocalMinimized(value);
        onMinimizedChange?.(value);
    };

    useEffect(() => {
        if (focusRequested.current) {
            focusRequested.current = false;
            (isMinimized ? expandButton.current : messageLink.current)?.focus();
        }
    }, [isMinimized]);

    return (
        <div
            className="fixed z-[60] print:hidden"
            style={{
                bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
                right: 'calc(1rem + env(safe-area-inset-right, 0px))',
            }}
        >
            {isMinimized ? (
                <button
                    ref={expandButton}
                    type="button"
                    onClick={() => changeMinimized(false)}
                    aria-label="Expand Messenger button"
                    aria-expanded={false}
                    title="Expand Messenger"
                    className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 bg-gray-500 text-white shadow-lg shadow-black/20 transition-colors hover:bg-gray-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-500"
                >
                    <MessageCircle className="size-5" aria-hidden="true" />
                </button>
            ) : (
                <>
                    <a
                        ref={messageLink}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Message Q8 Private Resort on Messenger (opens in a new tab)"
                        title="Message us on Messenger"
                        className="inline-flex size-14 items-center justify-center rounded-full border border-white/20 bg-emerald-600 text-white shadow-lg shadow-black/20 transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500"
                    >
                        <MessageCircle className="size-7" aria-hidden="true" />
                    </a>
                    <button
                        type="button"
                        onClick={() => changeMinimized(true)}
                        aria-label="Minimize Messenger button"
                        aria-expanded={true}
                        title="Minimize Messenger"
                        className="absolute -top-2 -right-2 inline-flex size-6 items-center justify-center rounded-full border border-emerald-700 bg-white text-emerald-800 shadow-sm transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </>
            )}
        </div>
    );
}
