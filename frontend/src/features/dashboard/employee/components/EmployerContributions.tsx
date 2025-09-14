import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type PropTypes = {
  value: number;
};
export const EmployerContributions = ({ value = 0 }: PropTypes) => {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>
          Employer Contributions
        </CardTitle>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          className='text-muted-foreground h-4 w-4'
        >
          <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
        </svg>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>₱{value}</div>
        <p className='text-muted-foreground text-xs'>+180.1% from last month</p>
      </CardContent>
    </Card>
  );
};
