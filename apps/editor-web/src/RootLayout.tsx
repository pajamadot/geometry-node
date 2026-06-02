import { Outlet } from 'react-router-dom';
import Header from '../app/components/Header';

export default function RootLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
