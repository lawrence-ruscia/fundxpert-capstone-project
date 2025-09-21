import MoonLoader from 'react-spinners/MoonLoader';

export const LoadingSpinner = ({
  text = 'Loading data',
}: {
  text?: string | null;
}) => {
  return (
    <div className='container mx-auto p-6'>
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='flex flex-col items-center space-y-4'>
          <MoonLoader color='white' />
          <p className='text-muted-foreground'>{text}...</p>
        </div>
      </div>
    </div>
  );
};
