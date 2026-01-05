import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Divider,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { getInvestments, addInvestment } from '../../services/googleSheetsService';

// Initial form state
const defaultValues = {
    date: new Date().toISOString().split('T')[0],
    investor_name: '',
    amount: '',
    contact: '',
    notes: ''
};

const InvestorDashboard = () => {
    const [stats, setStats] = useState({ totalAmount: 0, investorCount: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const { control, handleSubmit, reset } = useForm({ defaultValues });

    // Fetch data
    const fetchData = async () => {
        try {
            const data = await getInvestments();
            setTransactions(data);

            // Calculate stats
            const total = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            const investors = new Set(data.map(item => item.investor_name)).size;

            setStats({ totalAmount: total, investorCount: investors });
        } catch (error) {
            console.error('Error loading investments:', error);
            enqueueSnackbar('Failed to load investments', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle form submission
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await addInvestment(data);
            enqueueSnackbar('Investment added successfully!', { variant: 'success' });
            reset(defaultValues);
            fetchData(); // Refresh data
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to save', { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount).replace('BDT', '৳');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Investor Tracking
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: '#e3f2fd' }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary">Total Invested Capital</Typography>
                            <Typography variant="h3" color="primary" fontWeight="bold">
                                {formatCurrency(stats.totalAmount)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary">Total Investors</Typography>
                            <Typography variant="h3" fontWeight="bold">
                                {stats.investorCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Entry Form */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Add New Investment</Typography>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Controller
                                        name="date"
                                        control={control}
                                        rules={{ required: 'Date is required' }}
                                        render={({ field, fieldState: { error } }) => (
                                            <TextField
                                                {...field}
                                                type="date"
                                                label="Date"
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                                error={!!error}
                                                helperText={error?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Controller
                                        name="amount"
                                        control={control}
                                        rules={{ required: 'Amount is required', min: 1 }}
                                        render={({ field, fieldState: { error } }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="Amount (৳)"
                                                fullWidth
                                                error={!!error}
                                                helperText={error?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="investor_name"
                                        control={control}
                                        rules={{ required: 'Name is required' }}
                                        render={({ field, fieldState: { error } }) => (
                                            <TextField
                                                {...field}
                                                label="Investor Name"
                                                fullWidth
                                                placeholder="e.g. John Doe"
                                                error={!!error}
                                                helperText={error?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="contact"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Contact Info"
                                                fullWidth
                                                placeholder="Phone or Email"
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="notes"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Notes / Terms"
                                                fullWidth
                                                multiline
                                                rows={2}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Saving...' : 'Add Investment'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Grid>

                {/* List */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        <Typography variant="h6" sx={{ p: 2, pb: 0 }}>Recent Investments</Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : transactions.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">No investments recorded yet.</Typography>
                            </Box>
                        ) : (
                            <TableContainer sx={{ maxHeight: 440 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Investor</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Contact</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {transactions.slice().reverse().map((row) => (
                                            <TableRow hover key={row.id}>
                                                <TableCell>{row.date}</TableCell>
                                                <TableCell>{row.investor_name}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    {formatCurrency(row.amount)}
                                                </TableCell>
                                                <TableCell>{row.contact}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default InvestorDashboard;
