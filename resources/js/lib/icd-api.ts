import axios from 'axios';
import type {
    Favorite,
    Icd10Cm,
    Icd10Pcs,
    Icd10PcsStructureNode,
    Paginated,
    Specialty,
    Subspecialty,
} from '@/types/icd';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    withXSRFToken: true,
});

// Helper: unwrap API Resource { data: T } envelope
type Envelope<T> = { data: T };

// ── Specialties ──────────────────────────────────────────────────────────────

export const getSpecialties = (): Promise<Specialty[]> =>
    api.get<Envelope<Specialty[]>>('/specialties').then((r) => r.data.data);

export const getSpecialty = (id: number): Promise<Specialty> =>
    api.get<Envelope<Specialty>>(`/specialties/${id}`).then((r) => r.data.data);

// ── Subspecialties ───────────────────────────────────────────────────────────

export const getSubspecialties = (specialtyId: number): Promise<Subspecialty[]> =>
    api
        .get<Envelope<Subspecialty[]>>(`/specialties/${specialtyId}/subspecialties`)
        .then((r) => r.data.data);

export const getSubspecialty = (id: number): Promise<Subspecialty> =>
    api.get<Envelope<Subspecialty>>(`/subspecialties/${id}`).then((r) => r.data.data);

// ── ICD-10-CM ────────────────────────────────────────────────────────────────

export const getIcd10Cm = (params?: {
    subspecialty_id?: number;
    billable?: boolean;
    page?: number;
}): Promise<Paginated<Icd10Cm>> =>
    api.get<Paginated<Icd10Cm>>('/icd10-cm', { params }).then((r) => r.data);

export const getIcd10CmDetail = (code: string): Promise<Icd10Cm> =>
    api.get<Envelope<Icd10Cm>>(`/icd10-cm/${code}`).then((r) => r.data.data);

export const searchIcd10Cm = (q: string): Promise<Icd10Cm[]> =>
    api.get<Envelope<Icd10Cm[]>>('/icd10-cm/search', { params: { q } }).then((r) => r.data.data);

// ── ICD-10-PCS ───────────────────────────────────────────────────────────────

export const getIcd10Pcs = (params?: {
    subspecialty_id?: number;
    code_prefix?: string;
    page?: number;
}): Promise<Paginated<Icd10Pcs>> =>
    api.get<Paginated<Icd10Pcs>>('/icd10-pcs', { params }).then((r) => r.data);

export const getIcd10PcsDetail = (code: string): Promise<Icd10Pcs> =>
    api.get<Envelope<Icd10Pcs>>(`/icd10-pcs/${code}`).then((r) => r.data.data);

export const getIcd10PcsStructure = (prefix = ''): Promise<Icd10PcsStructureNode> =>
    api.get<Icd10PcsStructureNode>('/icd10-pcs/structure', { params: { prefix } }).then((r) => r.data);

export const searchIcd10Pcs = (q: string): Promise<Icd10Pcs[]> =>
    api.get<Envelope<Icd10Pcs[]>>('/icd10-pcs/search', { params: { q } }).then((r) => r.data.data);

// ── Favorites ────────────────────────────────────────────────────────────────

export const getFavorites = (): Promise<Favorite[]> =>
    api.get<Envelope<Favorite[]>>('/favorites').then((r) => r.data.data);

export const addFavorite = (
    favorable_id: number,
    favorable_type: 'icd10_cm' | 'icd10_pcs',
): Promise<Favorite> =>
    api.post<Envelope<Favorite>>('/favorites', { favorable_id, favorable_type }).then((r) => r.data.data);

export const removeFavorite = (id: number): Promise<void> =>
    api.delete(`/favorites/${id}`).then(() => undefined);
