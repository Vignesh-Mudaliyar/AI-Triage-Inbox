import { Button } from '../../shared/ui/Button';
import { useItemsStore } from '../../store/itemsStore';
import { useUIStore } from '../../store/uiStore';

export function BulkBar() {
  const bulkMode = useUIStore((s) => s.bulkMode);
  const setBulkMode = useUIStore((s) => s.setBulkMode);
  const selectedIds = useUIStore((s) => s.selectedIds);
  const clearSelected = useUIStore((s) => s.clearSelected);
  const bulkSetStatus = useItemsStore((s) => s.bulkSetStatus);

  if (!bulkMode) {
    return (
      <div className="px-4 py-2 border-b border-ink-200 bg-white flex items-center justify-end shrink-0">
        <button
          onClick={() => setBulkMode(true)}
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          Bulk select
        </button>
      </div>
    );
  }

  const count = selectedIds.size;

  return (
    <div className="px-4 py-2 border-b border-brand-200 bg-brand-50 flex items-center gap-3 shrink-0">
      <span className="text-xs text-ink-700 font-medium">{count} selected</span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={count === 0}
          onClick={() => {
            bulkSetStatus(Array.from(selectedIds), 'Done');
            clearSelected();
            setBulkMode(false);
          }}
        >
          Mark Done
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setBulkMode(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
