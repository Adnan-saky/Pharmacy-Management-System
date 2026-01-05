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
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    InputAdornment,
    IconButton,
    Tooltip
} from '@mui/material';
import { readSales, updateSale } from '../../services/googleSheetsService';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { useSnackbar } from 'notistack';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import Loading from '../common/Loading';
import DueEntry from './DueEntry';

const DueSalesList = () => {
    const [sales, setSales] = useState([]);
    const [dueSales, setDueSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);
    const [collectionAmount, setCollectionAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            const data = await readSales();
            // Filter only due or partial sales
            const dues = data.filter(sale => {
                // Check if status is explicitly not Paid, OR if due_amount > 0 (for robustness)
                // Note: floating point comparison safety included
                return sale.status !== 'Paid' && (parseFloat(sale.due_amount) > 0.1);
            });
            setSales(data);
            setDueSales(dues);
            setFilteredSales(dues);
        } catch (error) {
            console.error('Error fetching sales:', error);
            enqueueSnackbar(`Failed to load due sales: ${error.message}`, { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCollection = (sale) => {
        setSelectedSale(sale);
        setCollectionAmount(''); // Reset input
    };

    const handleClose = () => {
        setSelectedSale(null);
        setCollectionAmount('');
    };

    const handleCollect = async () => {
        if (!selectedSale || !collectionAmount) return;

        const amountToPay = parseFloat(collectionAmount);
        if (isNaN(amountToPay) || amountToPay <= 0) {
            enqueueSnackbar('Please enter a valid amount', { variant: 'warning' });
            return;
        }


        setIsSubmitting(true);
        try {
            const newPaid = (selectedSale.paid_amount || 0) + amountToPay;
            const newDue = (selectedSale.total_amount || 0) - newPaid;

            // Determine new status
            // Use a small epsilon for float comparison logic if needed, but simple logic works for currency usually
            let newStatus = 'Partial';
            if (newDue <= 0.5) { // Threshold for rounding errors
                newStatus = 'Paid';
            }

            const updatedData = {
                ...selectedSale,
                paid_amount: newPaid,
                due_amount: newDue > 0 ? newDue : 0,
                status: newStatus
            };

            await updateSale(selectedSale.id, updatedData);

            enqueueSnackbar('Payment collected successfully!', { variant: 'success' });
            handleClose();
            fetchSales(); // Refresh the list
        } catch (error) {
            console.error('Error updating sale:', error);
            enqueueSnackbar('Failed to record payment', { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        const filtered = dueSales.filter(sale =>
            (sale.customer_name && sale.customer_name.toLowerCase().includes(query)) ||
            (sale.notes && sale.notes.toLowerCase().includes(query))
        );
        setFilteredSales(filtered);
    };

    if (isLoading) {
        return <Loading message="Loading due sales..." />;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Due Management
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Add new due entries and manage collections
            </Typography>

            {/* Entry Form */}
            <Box sx={{ mt: 2 }}>
                <DueEntry onSuccess={fetchSales} />
            </Box>

            {/* Search Bar */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
                <SearchIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                <TextField
                    label="Search Customer or Details"
                    variant="standard"
                    fullWidth
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </Box>

            <Paper sx={{ mt: 1, p: 2 }}>
                {filteredSales.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            {searchQuery ? 'No matching records found' : 'No due sales found'}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Customer</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="right">Paid</TableCell>
                                    <TableCell align="right">Due</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                    <TableCell align="center">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredSales.map((sale) => (
                                    <TableRow key={sale.id} hover>
                                        <TableCell>{formatDate(sale.sale_date)}</TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2">
                                                {sale.customer_name || 'Unknown'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {sale.notes}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">{formatCurrency(sale.total_amount)}</TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main' }}>
                                            {formatCurrency(sale.paid_amount)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                            {formatCurrency(sale.due_amount)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={sale.status}
                                                color={sale.status === 'Paid' ? 'success' : sale.status === 'Partial' ? 'warning' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Collect Payment">
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    startIcon={<PaymentIcon />}
                                                    onClick={() => handleOpenCollection(sale)}
                                                >
                                                    Collect
                                                </Button>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Collection Dialog */}
            <Dialog open={!!selectedSale} onClose={handleClose}>
                <DialogTitle>Collect Payment</DialogTitle>
                <DialogContent sx={{ minWidth: 350, pt: 2 }}>
                    {selectedSale && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Customer: <strong>{selectedSale.customer_name}</strong>
                            </Typography>
                            <Typography variant="body2" color="error" gutterBottom>
                                Currently Due: <strong>{formatCurrency(selectedSale.due_amount)}</strong>
                            </Typography>

                            <TextField
                                autoFocus
                                margin="dense"
                                label="Collection Amount"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={collectionAmount}
                                onChange={(e) => setCollectionAmount(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                                }}
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={handleCollect}
                        variant="contained"
                        color="success"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm Collection'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DueSalesList;
