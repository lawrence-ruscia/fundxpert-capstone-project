import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingUp, Banknote, ArrowDownCircle, Target } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const QuickActions = ({ ...props }) => {
  const navigate = useNavigate();
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Quick access to common tasks</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <Button
          size='lg'
          className='flex items-center justify-start gap-4 px-4'
          onClick={() => navigate('/employee/contributions')}
        >
          <TrendingUp />
          <span>View Contributions</span>
        </Button>
        <Button
          size='lg'
          className='gap- flex items-center justify-start px-4'
          onClick={() => navigate('/employee/projection')}
        >
          <Target />
          <span>Project Fund Growth</span>
        </Button>
        <Button
          size='lg'
          className='flex items-center justify-start gap-4 px-4'
          onClick={() => navigate('/employee/loans')}
        >
          <Banknote />
          <span>Request Loan</span>
        </Button>
        <Button
          size='lg'
          className='flex items-center justify-start gap-4 px-4'
          onClick={() => navigate('/employee/withdrawals')}
        >
          <ArrowDownCircle />
          <span>Request Withdrawal</span>
        </Button>
      </CardContent>
    </Card>
  );
};
