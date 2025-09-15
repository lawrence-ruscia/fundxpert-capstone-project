import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TrendingUp,
  Banknote,
  ArrowDownCircle,
  FileText,
  Shield,
} from 'lucide-react';

export const QuickActions = ({ ...props }) => {
  // TODO: Add navigation to each button
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Quick access to common tasks</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <Button size='lg' className='justify-start gap-3 px-4'>
          <TrendingUp />
          <span>View Contributions</span>
        </Button>
        <Button size='lg' className='justify-start gap-3 px-4'>
          <Banknote />
          <span>Request Loan</span>
        </Button>
        <Button size='lg' className='justify-start gap-3 px-4'>
          <ArrowDownCircle />
          <span>Request Withdrawal</span>
        </Button>
        <Button size='lg' className='justify-start gap-3 px-4'>
          <FileText />
          <span>Download Statement</span>
        </Button>
        <Button size='lg' className='justify-start gap-3 px-4'>
          <Shield />
          <span>Security Settings</span>
        </Button>
      </CardContent>
    </Card>
  );
};
