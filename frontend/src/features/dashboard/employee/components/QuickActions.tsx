import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingUp, Banknote, ArrowDownCircle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickActions = ({ ...props }) => {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Quick access to common tasks</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <Button size='lg' className='justify-start gap-3 px-4'>
          <Link
            to='/dashboard/contributions'
            className='flex items-center gap-4'
          >
            <TrendingUp />
            <span>View Contributions</span>
          </Link>
        </Button>
        <Button size='lg' className='justify-start gap-3 px-4'>
          <Link to='/dashboard/projection' className='flex items-center gap-4'>
            <Target />
            <span>Project Fund Growth</span>
          </Link>
        </Button>
        <Button size='lg' className='justify-start gap-3 px-4'>
          <Link to='/dashboard/loans' className='flex items-center gap-4'>
            <Banknote />
            <span>Request Loan</span>
          </Link>
        </Button>
        <Button size='lg' className='justify-start gap-3 px-4'>
          <Link to='/dashboard/withdrawals' className='flex items-center gap-4'>
            <ArrowDownCircle />
            <span>Request Withdrawal</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
