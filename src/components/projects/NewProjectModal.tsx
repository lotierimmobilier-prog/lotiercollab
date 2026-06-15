import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280',
  '#1A3A5C', '#059669', '#DC2626', '#2563EB', '#D97706',
];

interface Props {
  open: boolean;
  onClose: () => void;
  parentId?: string | null;
  parentName?: string;
  isSuperAdmin?: boolean;
  forcePrivate?: boolean;
  onSubmit: (data: { name: string; color: string; parent_id: string | null; sort_order: number; is_private?: boolean }) => Promise<unknown>;
}

export function NewProjectModal({ open, onClose, parentId = null, parentName, isSuperAdmin = false, forcePrivate = false, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [isPrivate, setIsPrivate] = useState(!isSuperAdmin || forcePrivate);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setColor(COLORS[0]);
      setIsPrivate(!isSuperAdmin || forcePrivate);
    }
  }, [open, isSuperAdmin, forcePrivate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSubmit({ name: name.trim(), color, parent_id: parentId, sort_order: 0, is_private: isPrivate });
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1A3A5C]">
            {parentId ? `Nouveau sous-projet` : 'Nouveau projet'}
          </DialogTitle>
          {parentId && parentName && (
            <p className="text-sm text-gray-500 mt-0.5">dans <span className="font-medium text-gray-700">{parentName}</span></p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Nom *</Label>
            <Input
              id="project-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={parentId ? 'Nom du sous-projet...' : 'Nom du projet...'}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-500">Couleur sélectionnée</span>
            </div>
          </div>

          {/* Visibility — shown for non-super-admins; locked when parent is private */}
          {(!isSuperAdmin || forcePrivate) && (
            <div
              role={forcePrivate ? undefined : 'button'}
              onClick={forcePrivate ? undefined : () => setIsPrivate(v => !v)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all select-none ${
                forcePrivate
                  ? 'border-[#1A3A5C] bg-[#1A3A5C]/5 cursor-default opacity-80'
                  : isPrivate
                  ? 'border-[#1A3A5C] bg-[#1A3A5C]/5 cursor-pointer'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 cursor-pointer'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isPrivate ? 'bg-[#1A3A5C] text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isPrivate ? 'text-[#1A3A5C]' : 'text-gray-500'}`}>
                  {isPrivate ? 'Projet privé' : 'Projet partagé'}
                </p>
                <p className="text-xs text-gray-400 leading-tight">
                  {forcePrivate
                    ? 'Hérité du projet parent — visible uniquement par vous'
                    : isPrivate
                    ? 'Visible uniquement par vous — non partagé avec l\'équipe'
                    : 'Visible par tous les membres de l\'équipe'}
                </p>
              </div>
              {!forcePrivate && (
                <div className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors ${isPrivate ? 'bg-[#1A3A5C]' : 'bg-gray-200'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isPrivate ? 'left-5' : 'left-1'}`} />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-[#1A3A5C] hover:bg-[#142d47] text-white"
            >
              {loading ? 'Création...' : parentId ? 'Créer le sous-projet' : 'Créer le projet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
