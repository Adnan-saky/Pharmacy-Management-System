import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
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
    MenuItem,
    InputAdornment,
    Autocomplete,
    Card,
    CardContent,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import {
    getSuppliers,
    addMedicineCost,
    getMedicineCosts,
    addOperationalCost,
    getOperationalCosts
} from '../../services/googleSheetsService';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import Loading from '../common/Loading';
import MedicationIcon from '@mui/icons-material/Medication';
import BusinessIcon from '@mui/icons-material/Business';

const COST_TYPES = [
    'Rent',
    'Electricity',
    'Internet',
    'Salary',
    'Food',
    'Maintenance',
    'Transportation',
    'Others'
];

const CostManagement = () => {
    const [tabValue, setTabValue] = useState(0);
    const [suppliers, setSuppliers] = useState([]);
    const [medicineCosts, setMedicineCosts] = useState([]);
    const [operationalCosts, setOperationalCosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    // Medicine form
    const medicineForm = useForm({
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            supplier_id: '',
            supplier_name: '',
            medicine_details: '',
            total_amount: '',
            payment_status: 'Paid',
            notes: ''
        }
    });

    // Operational form
    const operationalForm = useForm({
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            cost_type: '',
            amount: '',
            recipient: '',
            notes: ''
        }
    });

    const selectedSupplierId = medicineForm.watch('supplier_id');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedSupplierId && suppliers.length > 0) {
            const supplier = suppliers.find(s => s.id === selectedSupplierId);
            if (supplier) {
                medicineForm.setValue('supplier_name', supplier.name);
            }
        }
    }, [selectedSupplierId, suppliers]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [suppliersData, medicineData, operationalData] = await Promise.all([
                getSuppliers(),
                getMedicineCosts(),
                getOperationalCosts()
            ]);
            setSuppliers(suppliersData);
            setMedicineCosts(medicineData.sort((a, b) => new Date(b.date) - new Date(a.date)));
            setOperationalCosts(operationalData.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (error) {
            enqueueSnackbar('Failed to load data', { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitMedicine = async (data) => {
        setIsSubmitting(true);
        try {
            await addMedicineCost(data);
            enqueueSnackbar('Medicine cost added successfully!', { variant: 'success' });
            medicineForm.reset({
                date: new Date().toISOString().split('T')[0],
                supplier_id: '',
                supplier_name: '',
                medicine_details: '',
                total_amount: '',
                payment_status: 'Paid',
                notes: ''
            });
            loadData();
        } catch (error) {
            enqueueSnackbar('Failed to save cost', { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmitOperational = async (data) => {
        setIsSubmitting(true);
        try {
            await addOperationalCost(data);
            enqueueSnackbar('Operational cost added successfully!', { variant: 'success' });
            operationalForm.reset({
                date: new Date().toISOString().split('T')[0],
                cost_type: '',
                amount: '',
                recipient: '',
                notes: ''
            });
            loadData();
        } catch (error) {
            enqueueSnackbar('Failed to save cost', { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalMedicineCosts = medicineCosts.reduce((sum, cost) => sum + (parseFloat(cost.total_amount) || 0), 0);
    const totalOperationalCosts = operationalCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);

    if (isLoading) {
        return <Loading message="Loading costs..." />;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Cost Management
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Track medicine purchases and operational expenses
            </Typography>

            <Paper sx={{ mt: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, newValue) => setTabValue(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab icon={<MedicationIcon />} label="Medicine Costs" iconPosition="start" />
                    <Tab icon={<BusinessIcon />} label="Operational Costs" iconPosition="start" />
                </Tabs>

                {/* Medicine Costs Tab */}
                {tabValue === 0 && (
                    <Box sx={{ p: 3 }}>
                        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                                    💊 Add Medicine Cost
                                </Typography>
                                <form onSubmit={medicineForm.handleSubmit(onSubmitMedicine)}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <TextField
                                                type="date"
                                                fullWidth
                                                {...medicineForm.register('date', { required: true })}
                                                error={!!medicineForm.formState.errors.date}
                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <TextField
                                                select
                                                fullWidth
                                                {...medicineForm.register('supplier_id', { required: true })}
                                                error={!!medicineForm.formState.errors.supplier_id}
                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                                defaultValue=""
                                            >
                                                <MenuItem value="" disabled>Select Supplier</MenuItem>
                                                {suppliers.map((supplier) => (
                                                    <MenuItem key={supplier.id} value={supplier.id}>
                                                        {supplier.name}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                            <input type="hidden" {...medicineForm.register('supplier_name')} />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <TextField
                                                placeholder="Medicine details"
                                                fullWidth
                                                {...medicineForm.register('medicine_details', { required: true })}
                                                error={!!medicineForm.formState.errors.medicine_details}
                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <TextField
                                                type="number"
                                                placeholder="Amount"
                                                fullWidth
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">৳</InputAdornment>
                                                }}
                                                {...medicineForm.register('total_amount', { required: true })}
                                                error={!!medicineForm.formState.errors.total_amount}
                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <TextField
                                                select
                                                fullWidth
                                                {...medicineForm.register('payment_status')}
                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                            >
                                                <MenuItem value="Paid">✅ Paid</MenuItem>
                                                <MenuItem value="Due">⏳ Due</MenuItem>
                                                <MenuItem value="Partial">⚠️ Partial</MenuItem>
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={6}>
                                            <TextField
                                                placeholder="Notes / Invoice No"
                                                fullWidth
                                                {...medicineForm.register('notes')}
                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={12} md={3}>
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
                                                    '&:hover': { bgcolor: 'success.dark' }
                                                }}
                                            >
                                                {isSubmitting ? '💾 SAVING...' : '✅ ADD COST'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Medicine Costs List */}
                        <Paper>
                            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6">
                                    📋 Medicine Costs ({medicineCosts.length})
                                </Typography>
                                <Typography variant="h6" fontWeight="bold">
                                    Total: {formatCurrency(totalMedicineCosts)}
                                </Typography>
                            </Box>
                            <TableContainer sx={{ maxHeight: 400 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Date</strong></TableCell>
                                            <TableCell><strong>Supplier</strong></TableCell>
                                            <TableCell><strong>Details</strong></TableCell>
                                            <TableCell align="right"><strong>Amount</strong></TableCell>
                                            <TableCell><strong>Status</strong></TableCell>
                                            <TableCell><strong>Notes</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {medicineCosts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    <Typography variant="body2" color="text.secondary" py={3}>
                                                        No medicine costs recorded yet
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            medicineCosts.map((cost, index) => (
                                                <TableRow key={cost.id || index} hover>
                                                    <TableCell>{formatDate(cost.date)}</TableCell>
                                                    <TableCell>{cost.supplier_name}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                                            {cost.medicine_details}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {formatCurrency(cost.total_amount)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={cost.payment_status}
                                                            size="small"
                                                            color={
                                                                cost.payment_status === 'Paid' ? 'success' :
                                                                    cost.payment_status === 'Partial' ? 'warning' : 'error'
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
                                                            {cost.notes || '-'}
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
                )}

                {/* Operational Costs Tab */}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                                    🏢 Add Operational Cost
                                </Typography>
                                <form onSubmit={operationalForm.handleSubmit(onSubmitOperational)}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <TextField
                                                type="date"
                                                fullWidth
                                                {...operationalForm.register('date', { required: true })}
                                                error={!!operationalForm.formState.errors.date}
                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                name="cost_type"
                                                control={operationalForm.control}
                                                rules={{ required: true }}
                                                render={({ field: { onChange, value }, fieldState: { error } }) => (
                                                    <Autocomplete
                                                        freeSolo
                                                        options={COST_TYPES}
                                                        value={value || ''}
                                                        onChange={(e, newValue) => onChange(newValue)}
                                                        onInputChange={(e, newInputValue) => onChange(newInputValue)}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="Cost type"
                                                                error={!!error}
                                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                                            />
                                                        )}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2}>
                                            <TextField
                                                type="number"
                                                placeholder="Amount"
                                                fullWidth
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">৳</InputAdornment>
                                                }}
                                                {...operationalForm.register('amount', { required: true })}
                                                error={!!operationalForm.formState.errors.amount}
                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2}>
                                            <TextField
                                                placeholder="Paid to (optional)"
                                                fullWidth
                                                {...operationalForm.register('recipient')}
                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2}>
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
                                                    '&:hover': { bgcolor: 'success.dark' }
                                                }}
                                            >
                                                {isSubmitting ? '💾 SAVING...' : '✅ ADD COST'}
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                placeholder="Notes"
                                                fullWidth
                                                {...operationalForm.register('notes')}
                                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                            />
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Operational Costs List */}
                        <Paper>
                            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6">
                                    📋 Operational Costs ({operationalCosts.length})
                                </Typography>
                                <Typography variant="h6" fontWeight="bold">
                                    Total: {formatCurrency(totalOperationalCosts)}
                                </Typography>
                            </Box>
                            <TableContainer sx={{ maxHeight: 400 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Date</strong></TableCell>
                                            <TableCell><strong>Type</strong></TableCell>
                                            <TableCell align="right"><strong>Amount</strong></TableCell>
                                            <TableCell><strong>Paid To</strong></TableCell>
                                            <TableCell><strong>Notes</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {operationalCosts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    <Typography variant="body2" color="text.secondary" py={3}>
                                                        No operational costs recorded yet
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            operationalCosts.map((cost, index) => (
                                                <TableRow key={cost.id || index} hover>
                                                    <TableCell>{formatDate(cost.date)}</TableCell>
                                                    <TableCell>
                                                        <Chip label={cost.cost_type} size="small" variant="outlined" />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {formatCurrency(cost.amount)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{cost.recipient || '-'}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                                                            {cost.notes || '-'}
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
                )}
            </Paper>
        </Box>
    );
};

export default CostManagement;
