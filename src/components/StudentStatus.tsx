import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgress } from '@/lib/progress';
export function StudentStatus() {
  const { loading, saving, error, retry } = useProgress();
  if (error) return <div role="alert" className="my-4 flex flex-wrap items-center gap-3 rounded-md border border-destructive p-4"><AlertCircle className="shrink-0 text-destructive" /><p className="min-w-0 flex-1">{error}</p><Button variant="outline" onClick={retry}>Tentar novamente</Button></div>;
  if (loading || saving) return <p role="status" className="my-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{loading ? 'Carregando seu progresso…' : 'Salvando progresso…'}</p>;
  return null;
}
