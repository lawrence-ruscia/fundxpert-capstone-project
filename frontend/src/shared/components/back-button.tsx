import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BackButton = () => {
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };
  return (
    <div className='flex items-center justify-between'>
      <Button
        variant='ghost'
        size='sm'
        onClick={handleBack}
        className='h-auto p-2'
      >
        <ArrowLeft className='h-4 w-4' />
      </Button>
      <div className='flex-1' />
    </div>
  );
};
