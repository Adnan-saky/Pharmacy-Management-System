import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Button,
    IconButton,
    Tooltip,
    TextField,
    Divider,
    Stack,
    Alert
} from '@mui/material';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    TrendingUp,
    AttachMoney,
    ShoppingCart,
    Warning,
    Refresh,
    AccountBalanceWallet,
    DateRange
} from '@mui/icons-material';
import {
    readSales,
    getMedicineCosts,
    getOperationalCosts,
    getPettyCashTransactions,
} from '../../services/googleSheetsService';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import Loading from '../common/Loading';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = () => {
    const [sales, setSales] = useState([]);
    const [medicineCosts, setMedicineCosts] = useState([]);
    const [operationalCosts, setOperationalCosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Date Range State
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30); // Default to last 30 days
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setRefreshing(true);
        try {
            const [salesData, medicineData, operationalData] = await Promise.all([
                readSales(),
                getMedicineCosts(),
                getOperationalCosts(),
            ]);
            setSales(salesData);
            setMedicineCosts(medicineData);
            setOperationalCosts(operationalData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // --- Filter Helper ---
    const filterByDate = (data, dateField = 'sale_date') => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return data.filter(item => {
            const d = new Date(item[dateField] || item.date);
            return d >= start && d <= end;
        });
    };

    // --- Memoized Filtered Data ---
    const filteredSales = useMemo(() => filterByDate(sales, 'sale_date'), [sales, startDate, endDate]);
    const filteredMedicineCosts = useMemo(() => filterByDate(medicineCosts, 'date'), [medicineCosts, startDate, endDate]);
    // const filteredOperationalCosts = useMemo(() => filterByDate(operationalCosts, 'date'), [operationalCosts, startDate, endDate]); // Not strictly needed for top cards but good for P&L if added later

    // --- Calculations for Cards ---
    const metrics = useMemo(() => {
        // 1. Daily Cash Sell (Today's Collection)
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySales = sales.filter(s => (s.sale_date || '').startsWith(todayStr));
        const dailyCashSell = todaySales.reduce((sum, s) => sum + (parseFloat(s.paid_amount) || 0), 0);

        // 2. Total Revenue (Range)
        const totalRevenue = filteredSales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);

        // 3. Total Due Sell (Range Due Amount)
        // Interpreted as "Sales on Credit" during this period
        const totalDueSell = filteredSales.reduce((sum, s) => sum + (parseFloat(s.due_amount) || 0), 0);

        // 4. Medicine Costs (Range)
        const totalMedicineCosts = filteredMedicineCosts.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0);

        // 5. Balance (Range Revenue - Range Med Costs)
        const balance = totalRevenue - totalMedicineCosts;

        return {
            dailyCashSell,
            totalRevenue,
            totalDueSell,
            balance,
            totalMedicineCosts
        };
    }, [filteredSales, filteredMedicineCosts, sales]); // Depend on 'sales' for daily calculation

    // --- Chart Data Preparation ---
    const chartData = useMemo(() => {
        // 1. Revenue Trend (Area Chart)
        const dailyMap = {};
        // Generate array of dates between start and end to fill gaps with 0
        const current = new Date(startDate);
        const end = new Date(endDate);
        const dateArray = [];

        while (current <= end) {
            dateArray.push(new Date(current).toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }

        dateArray.forEach(dateStr => {
            // Format for display: "Jan 01"
            const dateObj = new Date(dateStr);
            const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dailyMap[dateStr] = {
                fullDate: dateStr,
                date: displayDate,
                revenue: 0
            };
        });

        filteredSales.forEach(sale => {
            const dateStr = (sale.sale_date || '').split('T')[0];
            if (dailyMap[dateStr]) {
                dailyMap[dateStr].revenue += parseFloat(sale.total_amount) || 0;
            }
        });

        const revenueTrend = Object.values(dailyMap).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

        // 2. Payment Methods (Pie Chart)
        const methodMap = {};
        filteredSales.forEach(sale => {
            const method = sale.payment_method || 'Unknown';
            if (!methodMap[method]) methodMap[method] = 0;
            methodMap[method] += parseFloat(sale.total_amount) || 0;
        });

        // Ensure we always have data for the pie chart to render something
        let paymentMethods = Object.keys(methodMap).map(name => ({
            name: name === 'Credit' ? 'Due/Credit' : name,
            value: methodMap[name]
        }));

        if (paymentMethods.length === 0) {
            paymentMethods = [{ name: 'No Data', value: 1 }];
        }

        // 3. Cost Breakdown (Bar Chart - Simplified)
        // Showing "Revenue" vs "Med Costs" vs "Profit" for the period
        const financialOverview = [
            { name: 'Revenue', value: metrics.totalRevenue, fill: '#8884d8' },
            { name: 'Med Costs', value: metrics.totalMedicineCosts, fill: '#ff8042' },
            { name: 'Balance', value: metrics.balance, fill: metrics.balance >= 0 ? '#00C49F' : '#FFBB28' },
        ];

        return { revenueTrend, paymentMethods, financialOverview };
    }, [filteredSales, metrics, startDate, endDate]);

    if (isLoading) return <Loading message="Loading dashboard..." />;

    return (
        <Box>
            {/* Header & Date Filter */}
            <Box sx={{ mb: 4 }}>
                <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                    <Grid item xs={12} md={5}>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            📊 Business Dashboard
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Overview for {formatDate(startDate)} - {formatDate(endDate)}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                <DateRange color="action" />
                                <TextField
                                    label="From"
                                    type="date"
                                    size="small"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ bgcolor: 'white' }}
                                />
                                <TextField
                                    label="To"
                                    type="date"
                                    size="small"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ bgcolor: 'white' }}
                                />
                                <Tooltip title="Refresh Data">
                                    <IconButton onClick={fetchAllData} disabled={refreshing} sx={{ bgcolor: 'white', boxShadow: 1 }}>
                                        <Refresh className={refreshing ? 'rotating' : ''} />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Score Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* 1. Daily Cash sales */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', height: '100%' }}>
                        <CardContent>
                            <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachMoney fontSize="small" /> Daily Cash Sell (Today)
                            </Typography>
                            <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                                {formatCurrency(metrics.dailyCashSell)}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Collected Today ({new Date().toLocaleDateString()})
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 2. Total Due Sales (Range) */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', height: '100%' }}>
                        <CardContent>
                            <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Warning fontSize="small" /> Total Due Sales
                            </Typography>
                            <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                                {formatCurrency(metrics.totalDueSell)}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Credit given in selected period
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 3. Balance (Revenue - Med Costs) */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'white', height: '100%' }}>
                        <CardContent>
                            <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccountBalanceWallet fontSize="small" /> Balance
                            </Typography>
                            <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                                {formatCurrency(metrics.balance)}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                (Revenue - Medicine Costs)
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 4. Total Revenue (Range) */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', height: '100%' }}>
                        <CardContent>
                            <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingUp fontSize="small" /> Total Sales
                            </Typography>
                            <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                                {formatCurrency(metrics.totalRevenue)}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Total volume in selected period
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts Row 1 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Revenue Trend */}
                <Grid item xs={12} md={12}>
                    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '500px', width: '400px' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#334155' }}>
                            📈 Revenue Trend
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={chartData.revenueTrend} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: '#64748b', fontSize: 13 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                    minTickGap={50}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 13 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `৳${value}`}
                                    width={70}
                                />
                                <RechartsTooltip
                                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                {/* Added dots to make data points distinct and easier to interact with */}
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#3b82f6' }}
                                    activeDot={{ r: 7, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Payment Methods */}
                <Grid item xs={12} lg={12}>
                    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '500px', width: '400px' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#334155' }}>
                            💳 Payment Mix
                        </Typography>
                        <Box sx={{ height: '90%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    {/* Adjusted radius to prevent clipping and fit better */}
                                    <Pie
                                        data={chartData.paymentMethods}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={75}
                                        outerRadius={105}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.paymentMethods.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        wrapperStyle={{ bottom: 20 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Charts Row 2: Financial Overview */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#334155' }}>
                            💰 Financial Overview (Selected Period)
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.financialOverview} barSize={60}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.financialOverview.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 2 }}>
                            {chartData.financialOverview.map((item, idx) => (
                                <Box key={idx} sx={{ textAlign: 'center' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>{item.name}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: item.fill }}>{formatCurrency(item.value)}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    {/* Insights / Quick Stats */}
                    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#334155' }}>
                            💡 Insights
                        </Typography>
                        <Stack spacing={2}>
                            <Alert severity="info" icon={<ShoppingCart fontSize="inherit" />}>
                                <strong>{filteredSales.length}</strong> transactions in this period.
                                Avg ticket size: <strong>{filteredSales.length > 0 ? formatCurrency(metrics.totalRevenue / filteredSales.length) : '৳0'}</strong>
                            </Alert>

                            {metrics.totalDueSell > 0 && (
                                <Alert severity="warning">
                                    <strong>{formatCurrency(metrics.totalDueSell)}</strong> given in credit/due this period.
                                    Monitor collection.
                                </Alert>
                            )}

                            <Alert severity="success">
                                Profit Metric (Balance): <strong>{formatCurrency(metrics.balance)}</strong>
                                <br />
                                <Typography variant="caption">
                                    Note: This balance only accounts for Medicine Costs. Operational costs are calculated separately in reports.
                                </Typography>
                            </Alert>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
