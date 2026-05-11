import { Modal } from '../../shared/ui/Modal';
import { Button } from '../../shared/ui/Button';

export type RegenerateChoice = 'replace' | 'append' | 'cancel';

interface Props {
  open: boolean;
  onChoose: (choice: RegenerateChoice) => void;
}

export function RegenerateConfirm({ open, onChoose }: Readonly<Props>) {
  return (
    <Modal
      open={open}
      onClose={() => onChoose('cancel')}
      title="You have unsaved edits in this draft"
      description="The AI will produce a fresh reply. Choose how to combine it with what you've already written."
    >
      <div className="grid gap-2">
        <ChoiceRow
          label="Replace my edits"
          hint="Discard your text and use the new AI draft."
          onClick={() => onChoose('replace')}
          tone="danger"
        />
        <ChoiceRow
          label="Append AI continuation"
          hint="Keep your text; new AI output streams onto the end."
          onClick={() => onChoose('append')}
          tone="primary"
        />
      </div>
      <div className="flex justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={() => onChoose('cancel')}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

function ChoiceRow({
  label,
  hint,
  onClick,
  tone,
}: Readonly<{
  label: string;
  hint: string;
  onClick: () => void;
  tone: 'danger' | 'primary';
}>) {
  const accent =
    tone === 'danger'
      ? 'hover:border-priority-p1 hover:bg-red-50/50'
      : 'hover:border-brand-300 hover:bg-brand-50/50';
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 border border-ink-200 rounded-lg transition-colors ${accent}`}
    >
      <div className="text-sm font-medium text-ink-900">{label}</div>
      <div className="text-xs text-ink-500 mt-0.5">{hint}</div>
    </button>
  );
}
