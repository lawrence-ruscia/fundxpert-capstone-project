import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { LucideProps } from 'lucide-react';

interface PropTypes {
  label: string;
  value: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >;
  comparison?: string | null;
}
export const BalanceCard = ({
  label,
  value = '0',
  icon,
  comparison,
}: PropTypes) => {
  const Icon = icon;
  return (
    <Card className='from-primary/5 to-card dark:bg-card @container/card bg-gradient-to-t shadow-xs'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{label}</CardTitle>
        <Icon />
      </CardHeader>
      <CardContent className='space-y-1'>
        <div className='text-2xl font-semibold tabular-nums'>{value}</div>
        <p className='text-muted-foreground text-xs'>{comparison}</p>
      </CardContent>
    </Card>
  );
};
