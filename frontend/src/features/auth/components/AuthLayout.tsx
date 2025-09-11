import { useBreakpoint } from '@/hooks/useBreakpoint';
import background from '@/assets/login-background.png';
import backgroundSmall from '@/assets/login-background-small.png';
import Logo from '@/components/ui/logo';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const isTablet = useBreakpoint('(min-width: 768px)');

  return (
    <div
      className='lg:bg-autobg-center flex min-h-svh w-full items-center justify-center bg-contain bg-bottom bg-no-repeat p-6 sm:bg-bottom md:bg-contain md:p-10'
      style={{
        backgroundImage: `url(${isTablet ? background : backgroundSmall})`,
      }}
    >
      <div className='container grid h-svh max-w-none items-center justify-center'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-[480px] sm:p-8'>
          <div className='mb-4 flex items-center justify-center'>
            <Logo className='mb-2' />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
