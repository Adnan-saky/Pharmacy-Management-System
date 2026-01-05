import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Tabs,
    Tab,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Download,
    Print,
    Assessment,
    CheckCircle,
} from '@mui/icons-material';
import {
    readSales,
    getMedicineCosts,
    getOperationalCosts,
    getPettyCashTransactions,
    getInvestments,
} from '../../services/googleSheetsService';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import Loading from '../common/Loading';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Reports = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [sales, setSales] = useState([]);
    const [medicineCosts, setMedicineCosts] = useState([]);
    const [operationalCosts, setOperationalCosts] = useState([]);
    const [pettyCash, setPettyCash] = useState([]);
    const [investments, setInvestments] = useState([]);

    // Date Range State
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const [salesData, medicineData, operationalData, pettyCashData, investmentData] = await Promise.all([
                readSales(),
                getMedicineCosts(),
                getOperationalCosts(),
                getPettyCashTransactions(),
                getInvestments(),
            ]);
            setSales(salesData);
            setMedicineCosts(medicineData);
            setOperationalCosts(operationalData);
            setPettyCash(pettyCashData);
            setInvestments(investmentData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter data by date range
    const filterByDateRange = (data, dateField = 'sale_date') => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include end date fully

        return data.filter(item => {
            const itemDate = new Date(item[dateField]);
            return itemDate >= start && itemDate <= end;
        });
    };

    const filteredSales = filterByDateRange(sales);
    const filteredMedicineCosts = filterByDateRange(medicineCosts, 'date');
    const filteredOperationalCosts = filterByDateRange(operationalCosts, 'date');
    const filteredPettyCash = filterByDateRange(pettyCash, 'date');
    const filteredInvestments = filterByDateRange(investments, 'date');

    // Calculate metrics (Period Specific)
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
    const totalMedicineCosts = filteredMedicineCosts.reduce((sum, cost) => sum + (parseFloat(cost.total_amount) || 0), 0);
    const totalOperationalCosts = filteredOperationalCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
    const totalCosts = totalMedicineCosts + totalOperationalCosts;
    const grossProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0;

    const dueSales = filteredSales.filter(sale => sale.status !== 'Paid' && parseFloat(sale.due_amount) > 0);
    const totalDueAmount = dueSales.reduce((sum, sale) => sum + (parseFloat(sale.due_amount) || 0), 0);
    const totalPaidFromDues = dueSales.reduce((sum, sale) => sum + (parseFloat(sale.paid_amount) || 0), 0);

    // ==========================================
    // BALANCE SHEET ITEMS (ALL TIME / GLOBAL)
    // These should NOT be affected by the date filter
    // ==========================================

    // 1. Total Capital Invested (Lifetime)
    const globalTotalInvestments = investments.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    // 2. Petty Cash Balance (Lifetime)
    const globalPettyCashIn = pettyCash
        .filter(txn => (txn.type || '').toUpperCase() === 'IN')
        .reduce((sum, txn) => sum + (parseFloat(txn.amount) || 0), 0);
    const globalPettyCashOut = pettyCash
        .filter(txn => (txn.type || '').toUpperCase() === 'OUT')
        .reduce((sum, txn) => sum + (parseFloat(txn.amount) || 0), 0);
    const globalPettyCashBalance = globalPettyCashIn - globalPettyCashOut;

    // 3. Total Receivables / Due (Lifetime)
    const globalDueSales = sales.filter(sale => sale.status !== 'Paid' && parseFloat(sale.due_amount) > 0);
    const globalTotalDueAmount = globalDueSales.reduce((sum, sale) => sum + (parseFloat(sale.due_amount) || 0), 0);

    // Print handler
    const handlePrint = () => {
        window.print();
    };

    // Export to CSV (simplified)
    const handleExport = () => {
        alert('Export functionality would generate CSV/Excel file here');
    };

    if (isLoading) {
        return <Loading message="Loading reports..." />;
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        📊 Financial Reports
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Comprehensive financial analysis and insights
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Print Report">
                        <IconButton onClick={handlePrint} color="primary">
                            <Print />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Export to Excel">
                        <IconButton onClick={handleExport} color="success">
                            <Download />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Date Range Selector */}
            <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    📅 Select Date Range
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Start Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            sx={{ bgcolor: 'white', borderRadius: 1 }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="End Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            sx={{ bgcolor: 'white', borderRadius: 1 }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - 7);
                                    setStartDate(date.toISOString().split('T')[0]);
                                    setEndDate(new Date().toISOString().split('T')[0]);
                                }}
                                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.200' } }}
                            >
                                Last 7 Days
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - 30);
                                    setStartDate(date.toISOString().split('T')[0]);
                                    setEndDate(new Date().toISOString().split('T')[0]);
                                }}
                                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.200' } }}
                            >
                                Last 30 Days
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                    const date = new Date();
                                    date.setMonth(date.getMonth() - 1);
                                    date.setDate(1);
                                    setStartDate(date.toISOString().split('T')[0]);
                                    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                                    setEndDate(endOfMonth.toISOString().split('T')[0]);
                                }}
                                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.200' } }}
                            >
                                Last Month
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
                <Typography variant="caption" sx={{ color: 'white', mt: 2, display: 'block' }}>
                    Showing data from {formatDate(startDate)} to {formatDate(endDate)} ({filteredSales.length} transactions)
                </Typography>
            </Paper>

            {/* Report Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab icon={<Assessment />} label="Profit & Loss" iconPosition="start" />
                    <Tab icon={<TrendingUp />} label="Sales Report" iconPosition="start" />
                    <Tab icon={<TrendingDown />} label="Expense Report" iconPosition="start" />
                    <Tab label="Due Sales Aging" />
                    <Tab label="Summary" />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            {activeTab === 0 && (
                <ProfitLossReport
                    totalRevenue={totalRevenue}
                    totalMedicineCosts={totalMedicineCosts}
                    totalOperationalCosts={totalOperationalCosts}
                    totalCosts={totalCosts}
                    grossProfit={grossProfit}
                    profitMargin={profitMargin}
                    totalInvestments={globalTotalInvestments}
                    filteredSales={filteredSales}
                    filteredMedicineCosts={filteredMedicineCosts}
                    filteredOperationalCosts={filteredOperationalCosts}
                />
            )}

            {activeTab === 1 && (
                <SalesReport
                    sales={filteredSales}
                    totalRevenue={totalRevenue}
                    dueSales={dueSales}
                    totalDueAmount={totalDueAmount}
                    totalPaidFromDues={totalPaidFromDues}
                />
            )}

            {activeTab === 2 && (
                <ExpenseReport
                    medicineCosts={filteredMedicineCosts}
                    operationalCosts={filteredOperationalCosts}
                    totalMedicineCosts={totalMedicineCosts}
                    totalOperationalCosts={totalOperationalCosts}
                    totalCosts={totalCosts}
                />
            )}

            {activeTab === 3 && (
                <DueAgingReport
                    dueSales={globalDueSales}
                    totalDueAmount={globalTotalDueAmount}
                />
            )}

            {activeTab === 4 && (
                <SummaryReport
                    totalRevenue={totalRevenue}
                    totalCosts={totalCosts}
                    grossProfit={grossProfit}
                    profitMargin={profitMargin}
                    totalDueAmount={globalTotalDueAmount}
                    pettyCashBalance={globalPettyCashBalance}
                    totalInvestments={globalTotalInvestments}
                    salesCount={filteredSales.length}
                    dueSalesCount={globalDueSales.length}
                />
            )}
        </Box>
    );
};

// ============================================
// PROFIT & LOSS REPORT
// ============================================
const ProfitLossReport = ({
    totalRevenue,
    totalMedicineCosts,
    totalOperationalCosts,
    totalCosts,
    grossProfit,
    profitMargin,
    totalInvestments,
    pettyCashBalance,
    filteredSales,
    filteredMedicineCosts,
    filteredOperationalCosts,
}) => {
    // Monthly breakdown
    const monthlyData = {};

    filteredSales.forEach(sale => {
        const month = new Date(sale.sale_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
            monthlyData[month] = { month, revenue: 0, costs: 0, profit: 0 };
        }
        monthlyData[month].revenue += parseFloat(sale.total_amount) || 0;
    });

    filteredMedicineCosts.forEach(cost => {
        const month = new Date(cost.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
            monthlyData[month] = { month, revenue: 0, costs: 0, profit: 0 };
        }
        monthlyData[month].costs += parseFloat(cost.total_amount) || 0;
    });

    filteredOperationalCosts.forEach(cost => {
        const month = new Date(cost.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
            monthlyData[month] = { month, revenue: 0, costs: 0, profit: 0 };
        }
        monthlyData[month].costs += parseFloat(cost.amount) || 0;
    });

    Object.keys(monthlyData).forEach(month => {
        monthlyData[month].profit = monthlyData[month].revenue - monthlyData[month].costs;
    });

    const monthlyChartData = Object.values(monthlyData);

    return (
        <Box>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: 'success.light' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="success.dark">Total Revenue</Typography>
                            <Typography variant="h4">{formatCurrency(totalRevenue)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: 'error.light' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="error.dark">Total Costs</Typography>
                            <Typography variant="h4">{formatCurrency(totalCosts)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: grossProfit >= 0 ? 'primary.light' : 'warning.light' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color={grossProfit >= 0 ? 'primary.dark' : 'warning.dark'}>
                                Net Profit
                            </Typography>
                            <Typography variant="h4">{formatCurrency(grossProfit)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Second Row */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: 'info.light' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="info.dark">Profit Margin</Typography>
                            <Typography variant="h4">{profitMargin}%</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                        <CardContent>
                            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Balance (Gross)</Typography>
                            <Typography variant="h4">{formatCurrency(totalRevenue - totalMedicineCosts)}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Revenue - Medicine Cost
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Monthly Profit Chart */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>📈 Monthly Profit Trend</Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#00C49F" />
                        <Bar dataKey="costs" name="Costs" fill="#FF8042" />
                        <Bar dataKey="profit" name="Profit" fill="#0088FE" />
                    </BarChart>
                </ResponsiveContainer>
            </Paper>

            {/* Detailed P&L Statement */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>💼 Profit & Loss Statement</Typography>
                <Divider sx={{ my: 2 }} />
                <TableContainer>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell><strong>REVENUE</strong></TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ pl: 4 }}>Total Sales</TableCell>
                                <TableCell align="right"><strong>{formatCurrency(totalRevenue)}</strong></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>TOTAL REVENUE</strong></TableCell>
                                <TableCell align="right" sx={{ bgcolor: 'success.light' }}>
                                    <strong>{formatCurrency(totalRevenue)}</strong>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell colSpan={2} sx={{ height: 20 }}></TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell><strong>COST OF GOODS SOLD</strong></TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ pl: 4 }}>Medicine Costs</TableCell>
                                <TableCell align="right">{formatCurrency(totalMedicineCosts)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>TOTAL COGS</strong></TableCell>
                                <TableCell align="right" sx={{ bgcolor: 'error.light' }}>
                                    <strong>{formatCurrency(totalMedicineCosts)}</strong>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell colSpan={2} sx={{ height: 20 }}></TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell><strong>OPERATING EXPENSES</strong></TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ pl: 4 }}>Operational Costs</TableCell>
                                <TableCell align="right">{formatCurrency(totalOperationalCosts)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>TOTAL OPERATING EXPENSES</strong></TableCell>
                                <TableCell align="right" sx={{ bgcolor: 'error.light' }}>
                                    <strong>{formatCurrency(totalOperationalCosts)}</strong>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell colSpan={2} sx={{ height: 20 }}></TableCell>
                            </TableRow>

                            <TableRow sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <TableCell sx={{ color: 'white' }}><strong>NET PROFIT / (LOSS)</strong></TableCell>
                                <TableCell align="right" sx={{ color: 'white' }}>
                                    <strong>{formatCurrency(grossProfit)}</strong>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

// Placeholder components for other reports (will create these next)
// ============================================
// SALES REPORT
// ============================================
const SalesReport = ({ sales, totalRevenue, dueSales, totalDueAmount, totalPaidFromDues }) => {
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    return (
        <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <CardContent>
                            <Typography variant="subtitle2">Total Sales Volume</Typography>
                            <Typography variant="h4">{formatCurrency(totalRevenue)}</Typography>
                            <Typography variant="caption">{sales.length} Transactions</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <CardContent>
                            <Typography variant="subtitle2">Total Outstanding Dues</Typography>
                            <Typography variant="h4">{formatCurrency(totalDueAmount)}</Typography>
                            <Typography variant="caption">{dueSales.length} Unpaid/Partial Sales</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <CardContent>
                            <Typography variant="subtitle2">Collected from Dues</Typography>
                            <Typography variant="h4">{formatCurrency(totalPaidFromDues)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Customer Name</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell align="right">Paid</TableCell>
                                <TableCell align="right">Due</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Payment</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sales
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((sale, index) => (
                                    <TableRow hover key={index}>
                                        <TableCell>{formatDate(sale.sale_date)}</TableCell>
                                        <TableCell>{sale.customer_name || 'Walk-in'}</TableCell>
                                        <TableCell align="right">{formatCurrency(sale.total_amount)}</TableCell>
                                        <TableCell align="right">{formatCurrency(sale.paid_amount)}</TableCell>
                                        <TableCell align="right" sx={{ color: sale.due_amount > 0 ? 'error.main' : 'inherit', fontWeight: sale.due_amount > 0 ? 'bold' : 'normal' }}>
                                            {formatCurrency(sale.due_amount)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={sale.status}
                                                size="small"
                                                color={sale.status === 'Paid' ? 'success' : sale.status === 'Due' ? 'error' : 'warning'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">{sale.payment_method}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Simple Pagination Controls */}
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <Typography sx={{ alignSelf: 'center' }}>
                        Page {page + 1} of {Math.ceil(sales.length / rowsPerPage)}
                    </Typography>
                    <Button
                        disabled={page >= Math.ceil(sales.length / rowsPerPage) - 1}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

// ============================================
// EXPENSE REPORT
// ============================================
const ExpenseReport = ({ medicineCosts, operationalCosts, totalMedicineCosts, totalOperationalCosts, totalCosts }) => {
    const [subTab, setSubTab] = useState(0);

    return (
        <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
                        <CardContent>
                            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Total Expenses</Typography>
                            <Typography variant="h4">{formatCurrency(totalCosts)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Purchase Costs (Medicine)</Typography>
                            <Typography variant="h5" color="error.main">{formatCurrency(totalMedicineCosts)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Operational Expenses</Typography>
                            <Typography variant="h5" color="warning.main">{formatCurrency(totalOperationalCosts)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ mb: 2 }}>
                <Tabs value={subTab} onChange={(e, v) => setSubTab(v)} centered>
                    <Tab label="Medicine Purchases" />
                    <Tab label="Operational Expenses" />
                </Tabs>
            </Paper>

            {subTab === 0 && (
                <Paper sx={{ overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 500 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Medicine Name</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell align="right">Qty</TableCell>
                                    <TableCell align="right">Cost/Unit</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {medicineCosts.map((cost, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>{formatDate(cost.date)}</TableCell>
                                        <TableCell>{cost.medicine_name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={cost.action_type || 'Restock'}
                                                size="small"
                                                color={cost.action_type === 'New' ? 'info' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="right">{cost.quantity_added}</TableCell>
                                        <TableCell align="right">{formatCurrency(cost.cost_price)}</TableCell>
                                        <TableCell align="right">{formatCurrency(cost.total_amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {subTab === 1 && (
                <Paper sx={{ overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 500 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Authorized By</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {operationalCosts.map((cost, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>{formatDate(cost.date)}</TableCell>
                                        <TableCell>{cost.description}</TableCell>
                                        <TableCell><Chip label={cost.category} size="small" variant="outlined" /></TableCell>
                                        <TableCell>{cost.authorized_by}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(cost.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
};

// ============================================
// DUE AGING REPORT
// ============================================
const DueAgingReport = ({ dueSales, totalDueAmount }) => {
    return (
        <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle1">
                    Total Outstanding Dues: <strong>{formatCurrency(totalDueAmount)}</strong>
                </Typography>
                You have {dueSales.length} unpaid or partially paid sales records.
            </Alert>

            <Paper sx={{ overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Sale Date</TableCell>
                                <TableCell>Customer Info</TableCell>
                                <TableCell align="right">Total Amount</TableCell>
                                <TableCell align="right">Paid</TableCell>
                                <TableCell align="right">Balance Due</TableCell>
                                <TableCell align="right">Aging (Days)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {dueSales
                                .sort((a, b) => new Date(a.sale_date) - new Date(b.sale_date)) // Oldest first
                                .map((sale, index) => {
                                    const daysOverdue = Math.floor((new Date() - new Date(sale.sale_date)) / (1000 * 60 * 60 * 24));
                                    return (
                                        <TableRow key={index} hover sx={{ bgcolor: daysOverdue > 30 ? 'error.lighter' : 'inherit' }}>
                                            <TableCell>{formatDate(sale.sale_date)}</TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2">{sale.customer_name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{sale.customer_phone}</Typography>
                                            </TableCell>
                                            <TableCell align="right">{formatCurrency(sale.total_amount)}</TableCell>
                                            <TableCell align="right">{formatCurrency(sale.paid_amount)}</TableCell>
                                            <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                                {formatCurrency(sale.due_amount)}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={`${daysOverdue} days`}
                                                    color={daysOverdue > 30 ? 'error' : daysOverdue > 7 ? 'warning' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            {dueSales.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                        <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography>No outstanding dues!</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

// ============================================
// SUMMARY REPORT
// ============================================
const SummaryReport = ({ totalRevenue, totalCosts, grossProfit, profitMargin, totalDueAmount, pettyCashBalance, totalInvestments, salesCount, dueSalesCount }) => {
    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Paper elevation={3} sx={{ p: 5 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        EXECUTIVE SUMMARY
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Financial Statement & Health Card
                    </Typography>
                    <Divider sx={{ mt: 2, width: '50%', mx: 'auto' }} />
                </Box>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                            Income Statement
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Total Revenue</Typography>
                            <Typography variant="subtitle1">{formatCurrency(totalRevenue)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'error.main' }}>
                            <Typography>Total Expenses</Typography>
                            <Typography variant="subtitle1">- {formatCurrency(totalCosts)}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h6">Net Profit</Typography>
                            <Typography variant="h6" color={grossProfit >= 0 ? 'success.main' : 'error.main'}>
                                {formatCurrency(grossProfit)}
                            </Typography>
                        </Box>

                        <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                            Key Ratios
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Profit Margin</Typography>
                            <Chip
                                label={`${profitMargin}%`}
                                color={profitMargin > 20 ? 'success' : profitMargin > 0 ? 'warning' : 'error'}
                                size="small"
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                            Assets & Liabilities
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Petty Cash Balance</Typography>
                            <Typography variant="subtitle1">{formatCurrency(pettyCashBalance)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Receivables (Due)</Typography>
                            <Typography variant="subtitle1">{formatCurrency(totalDueAmount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography>Total Capital Invested</Typography>
                            <Typography variant="subtitle1">{formatCurrency(totalInvestments)}</Typography>
                        </Box>

                        <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                            Activity Volume
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Total Sales Count</Typography>
                            <Typography variant="subtitle1">{salesCount}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Due Records</Typography>
                            <Typography variant="subtitle1" color={dueSalesCount > 0 ? 'warning.main' : 'text.primary'}>
                                {dueSalesCount}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 5, textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
                    <Typography variant="caption">
                        Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default Reports;
