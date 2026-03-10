// Shared TypeScript types for ICD-10 application

export interface Specialty {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    subspecialties?: Subspecialty[];
}

export interface Subspecialty {
    id: number;
    specialty_id: number;
    name: string;
    slug: string;
    description: string | null;
    specialty?: Specialty;
}

export interface Icd10Cm {
    id: number;
    subspecialty_id: number | null;
    code: string;
    description: string;
    notes: string | null;
    billable: boolean;
    subspecialty?: Subspecialty;
}

export interface Icd10Pcs {
    id: number;
    subspecialty_id: number | null;
    code: string;
    description: string;
    notes: string | null;
    subspecialty?: Subspecialty;
}

export interface Icd10PcsAxisOption {
    axis: number;
    axis_name: string;
    value: string;
    prefix: string;
    term: string;
    description: string;
    label: string;
}

export interface Icd10PcsStructureNode {
    prefix: string;
    selected_length: number;
    next_axis: number | null;
    axis_names: Record<number, string>;
    match_count: number;
    options: Icd10PcsAxisOption[];
    exact_match: {
        code: string;
        description: string;
    } | null;
}

export interface Favorite {
    id: number;
    user_id: number;
    favorable_id: number;
    favorable_type: string;
    favorable?: Icd10Cm | Icd10Pcs;
    created_at: string;
}

export interface Paginated<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
}
