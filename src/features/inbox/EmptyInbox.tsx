import { useUIStore } from '../../store/uiStore';
import { Button } from '../../shared/ui/Button';

export function EmptyInbox() {
  const query = useUIStore((s) => s.query);
  const status = useUIStore((s) => s.statusFilter);
  const priority = useUIStore((s) => s.priorityFilter);
  const reset = useUIStore.getState();

  const filtered = query !== '' || status !== 'All' || priority !== 'All';

  if (filtered) {
    return (
      <div className="flex-1 grid place-items-center px-6 text-center">
        <div className="max-w-xs space-y-3">
          <div className="text-3xl" aria-hidden="true">🔍</div>
          <h3 className="text-sm font-semibold text-ink-900">No messages match</h3>
          <p className="text-sm text-ink-500">
            Nothing in this inbox fits the current filters or search.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              reset.setQuery('');
              reset.setStatusFilter('All');
              reset.setPriorityFilter('All');
            }}
          >
            Clear filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid place-items-center px-6 text-center">
      <div className="max-w-xs space-y-2">
        <div className="text-3xl" aria-hidden="true">📭</div>
        <h3 className="text-sm font-semibold text-ink-900">Inbox zero</h3>
        <p className="text-sm text-ink-500">No new messages right now.</p>
      </div>
    </div>
  );
}
