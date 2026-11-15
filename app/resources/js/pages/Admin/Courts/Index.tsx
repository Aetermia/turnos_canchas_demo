import { Head, Link } from '@inertiajs/react';

import { AdminLayout } from '@/layouts/admin-layout';
import { money } from '@/lib/format';

type Props = {
    courts: Array<{
        id: number;
        name: string;
        sport: string;
        surface: string | null;
        is_active: boolean;
        slot_minutes: number;
        buffer_minutes: number;
        price_from_cents: number | null;
        bookings_count: number;
    }>;
};

export default function Index({ courts }: Props) {
    return (
        <AdminLayout
            title="Canchas"
            actions={
                <Link
                    href="/panel/canchas/nueva"
                    className="rounded-control bg-accent px-3 py-2 text-sm font-medium text-paper hover:bg-[#8f3c19]"
                >
                    Nueva cancha
                </Link>
            }
        >
            <Head title="Canchas" />

            {courts.length === 0 ? (
                <div className="rounded-card border border-line bg-white p-6">
                    <p className="text-sm text-ink">Todavía no hay canchas.</p>
                    <p className="mt-1 text-sm text-ink-soft">
                        Cargá la primera con su horario y sus tarifas para que el sitio público empiece a mostrar turnos.
                    </p>
                    <Link
                        href="/panel/canchas/nueva"
                        className="mt-3 inline-block rounded-control bg-brand px-3 py-2 text-sm font-medium text-paper"
                    >
                        Crear cancha
                    </Link>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-card border border-line bg-white">
                    <table className="w-full min-w-[720px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-line text-left text-[11px] font-medium tracking-wide text-ink-soft uppercase">
                                <th scope="col" className="px-3 py-2">
                                    Cancha
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Turno
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Intervalo
                                </th>
                                <th scope="col" className="px-3 py-2 text-right">
                                    Desde
                                </th>
                                <th scope="col" className="px-3 py-2 text-right">
                                    Reservas
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Estado
                                </th>
                                <th scope="col" className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {courts.map((court) => (
                                <tr key={court.id} className="border-b border-line last:border-0">
                                    <td className="px-3 py-2.5">
                                        <span className="block text-ink">{court.name}</span>
                                        <span className="block text-xs text-ink-soft">
                                            {court.sport}
                                            {court.surface ? ` · ${court.surface}` : ''}
                                        </span>
                                    </td>
                                    <td className="tnum px-3 py-2.5 text-ink-soft">{court.slot_minutes} min</td>
                                    <td className="tnum px-3 py-2.5 text-ink-soft">{court.buffer_minutes} min</td>
                                    <td className="tnum px-3 py-2.5 text-right text-ink">{money(court.price_from_cents)}</td>
                                    <td className="tnum px-3 py-2.5 text-right text-ink-soft">{court.bookings_count}</td>
                                    <td className="px-3 py-2.5">
                                        <span
                                            className={`inline-flex rounded-control border px-2 py-0.5 text-[11px] font-medium ${
                                                court.is_active
                                                    ? 'border-brand/25 bg-brand-soft text-brand'
                                                    : 'border-line bg-paper-sunk text-ink-soft'
                                            }`}
                                        >
                                            {court.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                        <Link
                                            href={`/panel/canchas/${court.id}/editar`}
                                            className="text-xs text-ink underline decoration-line"
                                        >
                                            Editar
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="mt-3 text-xs text-ink-soft">
                El precio “desde” surge de la tarifa más baja configurada. Las canchas no se borran: se desactivan para
                conservar el historial.
            </p>
        </AdminLayout>
    );
}
