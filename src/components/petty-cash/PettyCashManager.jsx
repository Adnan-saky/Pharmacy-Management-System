import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, TextField, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Card, CardContent, Divider
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { getPettyCashTransactions, addPettyCashTransaction } from '../../services/googleSheetsService';
import Loading from '../common/Loading';
import { formatCurrency } from '../../utils/formatters';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

const PettyCashManager = () => {
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [transactionType, setTransactionType] = useState('OUT'); // 'IN' or 'OUT'
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { enqueueSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const data = await getPettyCashTransactions();
            setTransactions(data.reverse()); // Show newest first
            if (data.length > 0) {
                setBalance(data[0].balance); // Newest first means index 0 has latest balance? No.
                // If we reverse, index 0 is newest. So index 0 has latest balance. 
                // Wait, if reverse() mutates or returns new array? 
                // data from backend is usually chronological (oldest first).
                // So last item in 'data' is latest balance.
                // Let's re-sort to be sure.
                const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setTransactions(sorted);
                setBalance(sorted.length > 0 ? sorted[0].balance : 0);
            } else {
                setBalance(0);
            }
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to load transactions', { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const payload = { ...data, type: transactionType };
            await addPettyCashTransaction(payload);
            enqueueSnackbar('Transaction added successfully!', { variant: 'success' });
            reset();
            fetchTransactions(); // Refresh list and balance
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to save', { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <Loading message="Loading Petty Cash..." />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Petty Cash Management</Typography>

            {/* Balance Card */}
            <Card sx={{ mb: 4, bgcolor: balance >= 0 ? '#e8f5e9' : '#ffebee' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="h6" color="text.secondary">Current Balance</Typography>
                    <Typography variant="h2" color={balance >= 0 ? 'success.main' : 'error.main'} fontWeight="bold">
                        {formatCurrency(balance)}
                    </Typography>
                </CardContent>
            </Card>

            <Grid container spacing={4}>
                {/* Entry Form */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>New Transaction</Typography>

                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <Button
                                variant={transactionType === 'IN' ? 'contained' : 'outlined'}
                                color="success"
                                startIcon={<AddCircleIcon />}
                                onClick={() => setTransactionType('IN')}
                                fullWidth
                            >
                                Add Cash (IN)
                            </Button>
                            <Button
                                variant={transactionType === 'OUT' ? 'contained' : 'outlined'}
                                color="error"
                                startIcon={<RemoveCircleIcon />}
                                onClick={() => setTransactionType('OUT')}
                                fullWidth
                            >
                                Expense (OUT)
                            </Button>
                        </Box>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Date"
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        {...register('date', { required: 'Date is required' })}
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Amount"
                                        type="number"
                                        fullWidth
                                        InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography> }}
                                        {...register('amount', { required: 'Amount is required', min: 0 })}
                                        error={!!errors.amount}
                                        helperText={errors.amount?.message}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Description"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder={transactionType === 'IN' ? 'e.g. Withdraw from Bank' : 'e.g. Tea for guests'}
                                        {...register('description', { required: 'Description is required' })}
                                        error={!!errors.description}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        disabled={isSubmitting}
                                        color={transactionType === 'IN' ? 'success' : 'error'}
                                    >
                                        {isSubmitting ? 'Saving...' : `Save ${transactionType === 'IN' ? 'Deposit' : 'Expense'}`}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Grid>

                {/* Transaction List */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 0, overflow: 'hidden' }}>
                        <Typography variant="h6" sx={{ p: 2, bgcolor: 'grey.100' }}>Recent Transactions</Typography>
                        <Divider />
                        <TableContainer sx={{ maxHeight: 500 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell align="right">Balance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">No transactions yet.</TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((txn) => (
                                            <TableRow key={txn.id}>
                                                <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Chip
                                                            label={txn.type}
                                                            size="small"
                                                            color={txn.type === 'IN' ? 'success' : 'error'}
                                                            variant="outlined"
                                                        />
                                                        {txn.description}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: txn.type === 'IN' ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                                                    {txn.type === 'IN' ? '+' : '-'}{formatCurrency(txn.amount)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                                    {formatCurrency(txn.balance)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PettyCashManager;
