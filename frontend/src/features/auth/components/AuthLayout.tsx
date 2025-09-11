import { useBreakpoint } from '@/hooks/useBreakpoint';
import background from '@/assets/login-background.png';
import backgroundSmall from '@/assets/login-background-small.png';
import Logo from '@/components/ui/logo';

export const AuthLayout = ({
  children,
}: {
  children: React.ReactElement | React.ReactElement[];
}) => {
  const isTablet = useBreakpoint('(min-width: 768px)');

  return (
    <div
      className='lg:bg-autobg-center flex min-h-svh w-full items-center justify-center bg-contain bg-bottom bg-no-repeat p-6 sm:bg-bottom md:bg-contain md:p-10'
      style={{
        backgroundImage: `url(${isTablet ? background : backgroundSmall})`,
      }}
    >
      <div className='w-full max-w-sm'>
        <Logo className='mb-4' />
        {children}
      </div>
    </div>
  );
};
