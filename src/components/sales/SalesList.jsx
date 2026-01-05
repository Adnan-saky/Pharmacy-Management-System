import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Grid,
    Alert,
    CircularProgress,
    Chip,
} from '@mui/material';
import { readSales } from '../../services/googleSheetsService';
import { formatDate, isWithinRange, parseDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import Loading from '../common/Loading';

const SalesList = () => {
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch sales data
    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await readSales();
            // Sort by date (newest first)
            const sorted = data.sort((a, b) =>
                new Date(b.sale_date) - new Date(a.sale_date)
            );
            setSales(sorted);
            setFilteredSales(sorted);
        } catch (err) {
            console.error('Error fetching sales:', err);
            setError('Failed to load sales data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Apply filters
    useEffect(() => {
        let filtered = [...sales];

        // Date range filter
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

        // Search filter (search in notes and amount)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(sale =>
                sale.notes?.toLowerCase().includes(query) ||
                sale.total_amount.toString().includes(query) ||
                sale.payment_method?.toLowerCase().includes(query)
            );
        }

        setFilteredSales(filtered);
    }, [dateFrom, dateTo, searchQuery, sales]);

    // Calculate total
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);

    if (isLoading) {
        return <Loading message="Loading sales data..." />;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Sales List
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                View and filter all sales transactions
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mt: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
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
                    <Grid item xs={12} sm={4}>
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
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Search"
                            fullWidth
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search notes, amount, or payment method..."
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Sales Table */}
            <Paper sx={{ mt: 3 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'primary.light' }}>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Customer</strong></TableCell>
                                <TableCell align="right"><strong>Amount</strong></TableCell>
                                <TableCell align="right"><strong>Due</strong></TableCell>
                                <TableCell><strong>Payment Method</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Notes</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Box py={3}>
                                            <Typography variant="body1" color="text.secondary">
                                                {searchQuery || dateFrom || dateTo
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
                                                {sale.customer_name || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatCurrency(sale.total_amount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" color={sale.due_amount > 0 ? 'error' : 'success.main'}>
                                                {formatCurrency(sale.due_amount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={sale.payment_method}
                                                size="small"
                                                color={
                                                    sale.payment_method === 'Cash' ? 'success' :
                                                        sale.payment_method === 'Card' ? 'primary' :
                                                            sale.payment_method === 'UPI' ? 'secondary' :
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
                                                    maxWidth: 300,
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

                {/* Total Footer */}
                {filteredSales.length > 0 && (
                    <Box
                        sx={{
                            p: 2,
                            borderTop: 1,
                            borderColor: 'divider',
                            backgroundColor: 'action.hover',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="body1" fontWeight="medium">
                            Total Sales ({filteredSales.length} transactions)
                        </Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                            {formatCurrency(totalSales)}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default SalesList;
