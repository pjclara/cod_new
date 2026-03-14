import AppLogoIcon from '@/components/app-logo-icon';
import { Activity } from 'lucide-react';

export default function AppLogo() {
    return (
        <>
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                                <Activity className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                                Medic@dex
                            </span>
        </>
    );
}
