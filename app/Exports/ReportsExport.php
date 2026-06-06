<?php

namespace App\Exports;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportsExport implements FromCollection, ShouldAutoSize, WithColumnFormatting, WithHeadings, WithMapping, WithStyles, WithTitle
{
    /**
     * @param  array{date_from: ?string, date_to: ?string, search: string, status: string, export_period?: string}  $filters
     */
    public function __construct(
        protected array $filters = [
            'date_from' => null,
            'date_to' => null,
            'search' => '',
            'status' => '',
            'export_period' => '',
        ],
    ) {}

    public function collection(): Collection
    {
        return $this->applyFilters(Booking::query())
            ->with('resortOption:id,name')
            ->latest('bookings.created_at')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Reference No.',
            'Customer Name',
            'Email',
            'Contact Number',
            'Option',
            'Booking Date',
            'Booking Time',
            'Pax',
            'Total Price',
            'Payment Method',
            'Status',
            'Created At',
        ];
    }

    public function map($booking): array
    {
        return [
            $booking->booking_reference,
            $booking->full_name,
            $booking->email,
            $booking->contact_number,
            $booking->resortOption?->name ?? '-',
            optional($booking->booking_date)->format('Y-m-d'),
            $booking->booking_time,
            $booking->pax,
            $booking->total_price,
            $booking->payment_method,
            $booking->booking_status,
            $booking->created_at?->timezone(config('app.display_timezone'))->format('Y-m-d h:i A'),
        ];
    }

    public function columnFormats(): array
    {
        return [
            'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();

        $sheet->freezePane('A2');
        $sheet->getStyle('A1:'.$highestColumn.'1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '0F766E'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        $sheet->getStyle('A1:'.$highestColumn.$highestRow)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'D1D5DB'],
                ],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_TOP,
            ],
        ]);

        if ($highestRow > 1) {
            $sheet->getStyle('H2:I'.$highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        $sheet->getRowDimension(1)->setRowHeight(24);

        return [];
    }

    public function title(): string
    {
        return 'Booking Reports';
    }

    private function applyFilters(Builder $query): Builder
    {
        $dateColumn = ! empty($this->filters['export_period'])
            ? 'bookings.created_at'
            : 'bookings.booking_date';

        return $query
            ->when($this->filters['date_from'], fn ($query, $dateFrom) => $query->whereDate($dateColumn, '>=', $dateFrom))
            ->when($this->filters['date_to'], fn ($query, $dateTo) => $query->whereDate($dateColumn, '<=', $dateTo))
            ->when($this->filters['search'], function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('bookings.booking_reference', 'like', "%{$search}%")
                        ->orWhere('bookings.full_name', 'like', "%{$search}%")
                        ->orWhere('bookings.email', 'like', "%{$search}%")
                        ->orWhere('bookings.contact_number', 'like', "%{$search}%");
                });
            })
            ->when($this->filters['status'], fn ($query, $status) => $query->where('bookings.booking_status', $status));
    }
}
