import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    canRegister: boolean;
    stats: {
        cm: number;
        pcs: number;
        specialties: number;
    };
}

export default function Welcome({ canRegister, stats }: Props) {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState<'cm' | 'pcs'>('cm');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!query.trim()) return;
        router.visit(`/icd/${searchType}?q=${encodeURIComponent(query.trim())}`);
    }

    return (
        <>
            <Head title="ICD-10 — Pesquisa de Códigos Clínicos" />

            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                    <a href="/icd" className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ICD-10
                    </a>
                    <div className="flex items-center gap-4">
                        <a href="/icd/cm" className="text-sm text-slate-600 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400">CM</a>
                        <a href="/icd/pcs" className="text-sm text-slate-600 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400">PCS</a>
                        <a href="/icd" className="hidden text-sm text-slate-600 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400 sm:inline">Especialidades</a>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                        <a href="/login" className="text-sm font-medium text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400">
                            Entrar
                        </a>
                        {canRegister && (
                            <a
                                href="/register"
                                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Registar
                            </a>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-4 py-20 text-white sm:px-6 sm:py-28">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-4 inline-block rounded-full bg-blue-700/50 px-4 py-1 text-sm font-medium uppercase tracking-wider text-blue-200">
                        Nomenclatura Internacional
                    </div>
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                        Pesquisa de Códigos<br />
                        <span className="text-blue-300">ICD-10</span>
                    </h1>
                    <p className="mb-10 text-lg text-blue-100 sm:text-xl">
                        Pesquise em {stats.cm.toLocaleString('pt-PT')} diagnósticos CM e{' '}
                        {stats.pcs.toLocaleString('pt-PT')} procedimentos PCS.{' '}
                        Sem registo necessário.
                    </p>

                    {/* Search form */}
                    <form onSubmit={handleSearch} className="flex flex-col items-stretch gap-3 sm:flex-row">
                        <div className="flex flex-1 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-white/20">
                            <div className="flex items-center border-r border-slate-200">
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value as 'cm' | 'pcs')}
                                    className="h-full rounded-l-xl border-0 bg-slate-50 px-3 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
                                >
                                    <option value="cm">CM</option>
                                    <option value="pcs">PCS</option>
                                </select>
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ex: diabetes, pneumonia, 0DT1…"
                                className="flex-1 bg-white px-4 py-4 text-slate-800 placeholder-slate-400 focus:outline-none"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-blue-500 px-8 py-4 font-semibold text-white shadow-lg hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-blue-900 sm:w-auto"
                        >
                            Pesquisar
                        </button>
                    </form>
                </div>
            </section>

            {/* Stats bar */}
            <section className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
                    <div className="px-6 py-6 text-center">
                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                            {stats.cm.toLocaleString('pt-PT')}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Diagnósticos CM</div>
                    </div>
                    <div className="px-6 py-6 text-center">
                        <div className="text-3xl font-bold text-violet-700 dark:text-violet-400">
                            {stats.pcs.toLocaleString('pt-PT')}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Procedimentos PCS</div>
                    </div>
                    <div className="px-6 py-6 text-center">
                        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                            {stats.specialties.toLocaleString('pt-PT')}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Especialidades</div>
                    </div>
                </div>
            </section>

            {/* Feature cards */}
            <section className="bg-slate-50 px-4 py-16 dark:bg-slate-900 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <h2 className="mb-10 text-center text-2xl font-bold text-slate-800 dark:text-slate-100">
                        O que pode pesquisar
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-3">

                        {/* CM Card */}
                        <a
                            href="/icd/cm"
                            className="group rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-blue-900/40 dark:bg-slate-800"
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-slate-800 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-400">
                                Diagnósticos CM
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Classificação Internacional de Doenças — Modificação Clínica. Pesquise por código ou descrição.
                            </p>
                            <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                                Explorar CM
                                <svg className="ml-1 h-4 w-4 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </a>

                        {/* PCS Card */}
                        <a
                            href="/icd/pcs"
                            className="group rounded-2xl border border-violet-100 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-violet-900/40 dark:bg-slate-800"
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-slate-800 group-hover:text-violet-700 dark:text-slate-100 dark:group-hover:text-violet-400">
                                Procedimentos PCS
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Sistema de Codificação de Procedimentos. Selector de 7 eixos e pesquisa por código alfanumérico.
                            </p>
                            <div className="mt-4 flex items-center text-sm font-medium text-violet-600 dark:text-violet-400">
                                Explorar PCS
                                <svg className="ml-1 h-4 w-4 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </a>

                        {/* Specialties Card */}
                        <a
                            href="/icd"
                            className="group rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-emerald-900/40 dark:bg-slate-800"
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-slate-800 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                                Por Especialidade
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Navegue por {stats.specialties} especialidades médicas e as suas subespecialidades com códigos ICD-10 associados.
                            </p>
                            <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                Ver Especialidades
                                <svg className="ml-1 h-4 w-4 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </a>

                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white px-4 py-8 dark:border-slate-800 dark:bg-slate-950">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row dark:text-slate-400">
                    <span>ICD-10 — Nomenclatura Internacional de Doenças e Procedimentos</span>
                    <div className="flex items-center gap-4">
                        <a href="/icd/cm" className="hover:text-blue-600 dark:hover:text-blue-400">Diagnósticos CM</a>
                        <a href="/icd/pcs" className="hover:text-violet-600 dark:hover:text-violet-400">Procedimentos PCS</a>
                        <a href="/login" className="hover:text-slate-700 dark:hover:text-slate-300">Entrar</a>
                    </div>
                </div>
            </footer>
        </>
    );
}
