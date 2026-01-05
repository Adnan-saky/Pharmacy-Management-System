import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    InputAdornment,
    MenuItem,
    Card,
    CardContent,
    Collapse,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { createSale, readSales } from '../../services/googleSheetsService';
import { getTodayString, formatDate, isWithinRange } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import Loading from '../common/Loading';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Validation schema
const schema = yup.object({
    sale_date: yup.string().required('Date is required'),
    total_amount: yup
        .number()
        .required('Amount is required')
        .positive('Amount must be greater than 0')
        .typeError('Amount must be a number'),
    payment_method: yup.string().required('Payment method is required'),
    notes: yup.string(),
}).required();

const SalesManagement = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI state
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            sale_date: getTodayString(),
            total_amount: '',
            payment_method: 'Cash',
            notes: '',
        },
    });

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            const data = await readSales();
            const sorted = data.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
            setSales(sorted);
            setFilteredSales(sorted);
        } catch (error) {
            console.error('Error fetching sales:', error);
            enqueueSnackbar('Failed to load sales', { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    // Apply filters
    useEffect(() => {
        let filtered = [...sales];

        if (dateFrom && dateTo) {
            filtered = filtered.filter(sale =>
                isWithinRange(sale.sale_date, dateFrom, dateTo)
            );
        } else if (dateFrom) {
            filtered = filtered.filter(sale =>
                new Date(sale.sale_date) >= new Date(dateFrom)
            );
        } else if (dateTo) {
            filtered = filtered.filter(sale =>
                new Date(sale.sale_date) <= new Date(dateTo)
            );
        }

        if (paymentMethodFilter) {
            filtered = filtered.filter(sale =>
                sale.payment_method === paymentMethodFilter
            );
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(sale =>
                sale.notes?.toLowerCase().includes(query) ||
                sale.total_amount.toString().includes(query) ||
                sale.customer_name?.toLowerCase().includes(query)
            );
        }

        setFilteredSales(filtered);
    }, [dateFrom, dateTo, searchQuery, paymentMethodFilter, sales]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const saleData = {
                sale_date: data.sale_date,
                total_amount: data.total_amount,
                payment_method: data.payment_method,
                notes: data.notes || '',
                customer_name: 'Walk-in',
                paid_amount: data.total_amount,
                due_amount: 0,
                status: 'Paid'
            };

            await createSale(saleData);
            enqueueSnackbar('Sale recorded successfully!', { variant: 'success' });

            reset({
                sale_date: getTodayString(),
                total_amount: '',
                payment_method: 'Cash',
                notes: '',
            });

            fetchSales();
        } catch (error) {
            console.error('Error creating sale:', error);
            enqueueSnackbar('Failed to record sale', { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);

    if (isLoading) {
        return <Loading message="Loading sales..." />;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Sales Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Record new sales and view transaction history
                    </Typography>
                </Box>
                <Button
                    variant={showFilters ? 'contained' : 'outlined'}
                    startIcon={showFilters ? <ExpandLessIcon /> : <FilterListIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
            </Box>

            {/* Entry Form */}
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                        ⚡ Quick Sale Entry
                    </Typography>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={2.4}>
                                <Controller
                                    name="sale_date"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="date"
                                            fullWidth
                                            size="medium"
                                            error={!!errors.sale_date}
                                            sx={{
                                                bgcolor: 'white',
                                                borderRadius: 1
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2.4}>
                                <Controller
                                    name="total_amount"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            placeholder="Enter amount"
                                            type="number"
                                            fullWidth
                                            size="medium"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">৳</InputAdornment>
                                            }}
                                            error={!!errors.total_amount}
                                            sx={{
                                                bgcolor: 'white',
                                                borderRadius: 1
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2.4}>
                                <Controller
                                    name="payment_method"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            size="medium"
                                            error={!!errors.payment_method}
                                            sx={{
                                                bgcolor: 'white',
                                                borderRadius: 1
                                            }}
                                        >
                                            <MenuItem value="Cash">💵 Cash</MenuItem>
                                            <MenuItem value="Card">💳 Card</MenuItem>
                                            <MenuItem value="UPI">📱 UPI</MenuItem>
                                            <MenuItem value="Bank Transfer">🏦 Bank Transfer</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2.4}>
                                <Controller
                                    name="notes"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            placeholder="Notes (optional)"
                                            fullWidth
                                            size="medium"
                                            sx={{
                                                bgcolor: 'white',
                                                borderRadius: 1
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={12} md={2.4}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    disabled={isSubmitting}
                                    sx={{
                                        height: '56px',
                                        bgcolor: 'success.main',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        '&:hover': { bgcolor: 'success.dark' }
                                    }}
                                >
                                    {isSubmitting ? '💾 SAVING...' : '✅ RECORD SALE'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>

            {/* Filters */}
            <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Date From"
                                type="date"
                                fullWidth
                                size="small"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Date To"
                                type="date"
                                fullWidth
                                size="small"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                select
                                label="Payment Method"
                                fullWidth
                                size="small"
                                value={paymentMethodFilter}
                                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            >
                                <MenuItem value="">All Methods</MenuItem>
                                <MenuItem value="Cash">Cash</MenuItem>
                                <MenuItem value="Card">Card</MenuItem>
                                <MenuItem value="UPI">UPI</MenuItem>
                                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Search"
                                fullWidth
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Customer, notes, amount..."
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </Collapse>

            {/* Sales List */}
            <Paper>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        📊 Recent Transactions ({filteredSales.length})
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                        Total: {formatCurrency(totalSales)}
                    </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 500 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Customer</strong></TableCell>
                                <TableCell align="right"><strong>Amount</strong></TableCell>
                                <TableCell><strong>Payment</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Notes</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Box py={3}>
                                            <Typography variant="body1" color="text.secondary">
                                                {searchQuery || dateFrom || dateTo || paymentMethodFilter
                                                    ? 'No sales found matching your filters'
                                                    : 'No sales recorded yet. Add your first sale!'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSales.map((sale, index) => (
                                    <TableRow
                                        key={sale.id || index}
                                        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                                    >
                                        <TableCell>{formatDate(sale.sale_date)}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {sale.customer_name || 'Walk-in'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatCurrency(sale.total_amount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={sale.payment_method === 'Credit' ? 'Due Received' : sale.payment_method}
                                                size="small"
                                                color={
                                                    sale.payment_method === 'Cash' ? 'success' :
                                                        sale.payment_method === 'Card' ? 'primary' :
                                                            sale.payment_method === 'UPI' ? 'secondary' :
                                                                sale.payment_method === 'Credit' ? 'warning' :
                                                                    'default'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={sale.status || 'Paid'}
                                                size="small"
                                                variant="outlined"
                                                color={
                                                    sale.status === 'Paid' ? 'success' :
                                                        sale.status === 'Partial' ? 'warning' : 'error'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    maxWidth: 250,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {sale.notes || '-'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default SalesManagement;
