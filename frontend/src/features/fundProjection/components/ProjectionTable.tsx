import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Calculator } from 'lucide-react';

interface ProjectionRecord {
  year: number;
  employee_contribution: number;
  employer_contribution: number;
  vested_amount: number;
  unvested_amount: number;
  total_balance: number;
  with_growth: number;
}

interface ProjectionTotals {
  employee: number;
  employer: number;
  vested: number;
  unvested: number;
  final_balance: number;
  final_with_growth: number;
}

export default function ProjectionTable({
  data,
  totals,
}: {
  data: ProjectionRecord[];
  totals: ProjectionTotals;
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className='from-card to-card/80 border-0 bg-gradient-to-br shadow-lg'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-foreground flex items-center gap-2 text-xl font-semibold'>
              <FileSpreadsheet className='text-primary h-5 w-5' />
              Detailed Projection Breakdown
            </CardTitle>
            <p className='text-muted-foreground text-sm'>
              Year-by-year contribution and growth analysis
            </p>
          </div>
          <Badge variant='secondary' className='flex items-center gap-1'>
            <Calculator className='h-3 w-3' />
            {data.length} Years
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className='border-border/50 overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/50 hover:bg-muted/50'>
                <TableHead className='text-foreground font-semibold'>
                  Year
                </TableHead>
                <TableHead className='text-foreground font-semibold'>
                  Employee
                </TableHead>
                <TableHead className='text-foreground font-semibold'>
                  Employer
                </TableHead>
                <TableHead className='text-foreground font-semibold'>
                  Vested
                </TableHead>
                <TableHead className='text-foreground font-semibold'>
                  Unvested
                </TableHead>
                <TableHead className='text-foreground font-semibold'>
                  Total Balance
                </TableHead>
                <TableHead className='text-foreground font-semibold'>
                  With Growth
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={row.year}
                  className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <TableCell className='text-primary font-medium'>
                    {row.year}
                  </TableCell>
                  <TableCell className='text-card-foreground'>
                    {formatCurrency(row.employee_contribution)}
                  </TableCell>
                  <TableCell className='text-card-foreground'>
                    {formatCurrency(row.employer_contribution)}
                  </TableCell>
                  <TableCell className='text-card-foreground'>
                    {formatCurrency(row.vested_amount)}
                  </TableCell>
                  <TableCell className='text-card-foreground'>
                    {formatCurrency(row.unvested_amount)}
                  </TableCell>
                  <TableCell className='text-foreground font-semibold'>
                    {formatCurrency(row.total_balance)}
                  </TableCell>
                  <TableCell className='text-secondary font-semibold'>
                    {formatCurrency(row.with_growth)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Cards */}
        <div className='mt-6 grid grid-cols-2 gap-4 md:grid-cols-4'>
          <div className='from-primary/10 to-primary/5 border-primary/20 rounded-lg border bg-gradient-to-br p-4'>
            <div className='text-primary text-xs font-medium tracking-wide uppercase'>
              Total Employee
            </div>
            <div className='text-foreground mt-1 text-lg font-bold'>
              {formatCurrency(totals.employee)}
            </div>
          </div>

          <div className='from-secondary/10 to-secondary/5 border-secondary/20 rounded-lg border bg-gradient-to-br p-4'>
            <div className='text-secondary text-xs font-medium tracking-wide uppercase'>
              Total Employer
            </div>
            <div className='text-foreground mt-1 text-lg font-bold'>
              {formatCurrency(totals.employer)}
            </div>
          </div>

          <div className='from-chart-3/10 to-chart-3/5 border-chart-3/20 rounded-lg border bg-gradient-to-br p-4'>
            <div className='text-chart-3 text-xs font-medium tracking-wide uppercase'>
              Final Balance
            </div>
            <div className='text-foreground mt-1 text-lg font-bold'>
              {formatCurrency(totals.final_balance)}
            </div>
          </div>

          <div className='from-chart-4/10 to-chart-4/5 border-chart-4/20 rounded-lg border bg-gradient-to-br p-4'>
            <div className='text-chart-4 text-xs font-medium tracking-wide uppercase'>
              With Growth
            </div>
            <div className='text-foreground mt-1 text-lg font-bold'>
              {formatCurrency(totals.final_with_growth)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
