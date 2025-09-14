import { Outlet, Link } from 'react-router-dom';

export default function EmployeeLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <nav style={{ padding: '1rem', borderRight: '1px solid #ccc' }}>
        <ul>
          <li>
            <Link to='/dashboard'>Overview</Link>
          </li>
          <li>
            <Link to='/dashboard/contributions'>Contributions</Link>
          </li>
        </ul>
      </nav>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
