import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Eager load critical components
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Unauthorized from './components/auth/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy load route components for code splitting
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const SalesManagement = lazy(() => import('./components/sales/SalesManagement'));
const Suppliers = lazy(() => import('./components/suppliers/Suppliers'));
const CostManagement = lazy(() => import('./components/costs/CostManagement'));
const PettyCashManager = lazy(() => import('./components/petty-cash/PettyCashManager'));
const InvestorDashboard = lazy(() => import('./components/investors/InvestorDashboard'));
const DueSalesList = lazy(() => import('./components/due-sales/DueSalesList'));
const Reports = lazy(() => import('./components/reports/Reports'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));

// Loading component
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress size={60} />
  </Box>
);



const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f4f6f8',
    },
  },
});

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Routes */}
              <Route element={
                <ProtectedRoute roles={['admin', 'owner', 'sales-man', 'investor']}>
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <Outlet />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />

                {/* Sales - Accessible to most */}
                <Route path="/sales" element={<SalesManagement />} />
                <Route path="/due-sales" element={<DueSalesList />} />
                <Route path="/petty-cash" element={<PettyCashManager />} />

                {/* Admin/Owner Only */}
                <Route element={<ProtectedRoute roles={['admin', 'owner']} />}>
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/costs" element={<CostManagement />} />
                  <Route path="/admin" element={<AdminPanel />} />
                </Route>

                {/* Investments - Admin/Owner/Investor */}
                <Route element={<ProtectedRoute roles={['admin', 'owner', 'investor']} />}>
                  <Route path="/investments" element={<InvestorDashboard />} />
                </Route>

                <Route path="/reports" element={<Reports />} />
              </Route>
            </Routes>
          </Router>
        </SnackbarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
