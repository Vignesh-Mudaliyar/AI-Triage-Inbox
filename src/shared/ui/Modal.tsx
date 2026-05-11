import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children }: Readonly<Props>) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  // Native <dialog> fires `close` for both Escape and dialog.close(); fold
  // both into the same exit path so the parent always learns it dismissed.
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const handler = () => onClose();
    dlg.addEventListener('close', handler);
    return () => dlg.removeEventListener('close', handler);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      className="
        backdrop:bg-ink-900/40 backdrop:backdrop-blur-[2px]
        bg-white rounded-2xl shadow-pop p-6 w-full max-w-md
        m-auto open:animate-fade-in
      "
    >
      <div className="space-y-4">
        <div>
          <h2 id="modal-title" className="text-base font-semibold text-ink-900">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
        </div>
        {children}
      </div>
    </dialog>
  );
}
