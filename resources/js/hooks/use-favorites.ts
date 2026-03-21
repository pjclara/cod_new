import { useEffect, useState } from 'react';
import { addFavorite, getFavorites, removeFavorite } from '@/lib/icd-api';

type FavorableType = 'icd10_cm' | 'icd10_pcs';

export function useFavorites(isAuthenticated: boolean) {
    // map favorableId -> favorite id
    const [favMap, setFavMap] = useState<Record<number, number>>({});
    const [pending, setPending] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!isAuthenticated) return;
        getFavorites().then((favs) => {
            const map: Record<number, number> = {};
            favs.forEach((f) => { map[f.favorable_id] = f.id; });
            setFavMap(map);
        });
    }, [isAuthenticated]);

    function isFavorite(favorableId: number) {
        return favorableId in favMap;
    }

    function toggle(favorableId: number, favorableType: FavorableType) {
        if (pending.has(favorableId)) return;
        setPending((p) => new Set(p).add(favorableId));

        if (isFavorite(favorableId)) {
            const favId = favMap[favorableId];
            removeFavorite(favId)
                .then(() => {
                    setFavMap((prev) => {
                        const next = { ...prev };
                        delete next[favorableId];
                        return next;
                    });
                })
                .finally(() => setPending((p) => { const n = new Set(p); n.delete(favorableId); return n; }));
        } else {
            addFavorite(favorableId, favorableType)
                .then((fav) => {
                    setFavMap((prev) => ({ ...prev, [favorableId]: fav.id }));
                })
                .finally(() => setPending((p) => { const n = new Set(p); n.delete(favorableId); return n; }));
        }
    }

    return { isFavorite, toggle, isPending: (id: number) => pending.has(id) };
}
