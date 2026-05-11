import { Header } from './Header';
import { InboxList } from '../features/inbox/InboxList';
import { ItemDetail } from '../features/detail/ItemDetail';
import { useUIStore } from '../store/uiStore';
import { cx } from '../shared/utils/cx';

export function App() {
  const selectedId = useUIStore((s) => s.selectedId);

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[420px_1fr]">
        <section
          aria-label="Inbox list"
          className={cx(
            'min-h-0 border-r border-ink-200 bg-white',
            selectedId ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
          )}
        >
          <InboxList />
        </section>
        <section
          aria-label="Message detail"
          className={cx(
            'min-h-0 overflow-y-auto bg-ink-50',
            selectedId ? 'block' : 'hidden lg:block'
          )}
        >
          <ItemDetail />
        </section>
      </main>
    </div>
  );
}
