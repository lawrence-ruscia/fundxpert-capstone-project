import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigate } from '../api/navigateHelper';

export default function NavigationSetter() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return null; // it doesn't render anything
}
