import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    MenuItem,
    Grid,
    Alert,
    InputAdornment,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { createSale } from '../../services/googleSheetsService';
import { getTodayString } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

// Payment method options
const PAYMENT_METHODS = ['Cash', 'Card', 'Bkash', 'Nagad', 'Other'];

// Validation schema
const schema = yup.object({
    sale_date: yup.string().required('Sale date is required'),
    total_amount: yup
        .number()
        .required('Amount is required')
        .positive('Amount must be greater than 0')
        .typeError('Amount must be a number'),
    paid_amount: yup
        .number()
        .typeError('Paid amount must be a number')
        .min(0, 'Paid amount cannot be negative')
        .test('max-amount', 'Paid amount cannot exceed total amount', function (value) {
            return value <= this.parent.total_amount;
        }),
    customer_name: yup.string().when(['total_amount', 'paid_amount'], {
        is: (total, paid) => paid < total,
        then: (schema) => schema.required('Customer name is required for due sales'),
        otherwise: (schema) => schema,
    }),
    payment_method: yup.string().required('Payment method is required'),
    notes: yup.string(),
}).required();

const SalesEntry = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            sale_date: getTodayString(),
            total_amount: '',
            paid_amount: '',
            customer_name: '',
            payment_method: 'Cash',
            notes: '',
        },
    });

    // Watch values for real-time calculations
    const totalAmount = parseFloat(watch('total_amount')) || 0;
    const paidAmount = parseFloat(watch('paid_amount')); // Can be NaN if empty

    // Calculate Due Amount
    // If paidAmount is NaN (empty), treat it as 0 for calmulation visually, 
    // BUT for UX, we usually leave it empty.
    // Let's decide: if Paid is user-entered, use it. 
    const effectivePaid = isNaN(paidAmount) ? 0 : paidAmount;
    const dueAmount = Math.max(0, totalAmount - effectivePaid);

    // Auto-fill Paid Amount when Total Amount changes (only if Paid is empty or equals previous total)
    // Actually, simpler UX: just let user type.

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Prepare the final data
            const finalPaid = data.paid_amount === '' ? data.total_amount : data.paid_amount;
            const finalDue = data.total_amount - finalPaid;

            let status = 'Paid';
            if (finalDue > 0) {
                status = finalPaid > 0 ? 'Partial' : 'Due';
            }

            const saleData = {
                ...data,
                paid_amount: finalPaid,
                due_amount: finalDue,
                status,
                customer_name: data.customer_name || (status === 'Paid' ? 'Walk-in' : ''),
            };

            await createSale(saleData);

            enqueueSnackbar('Sale added successfully!', {
                variant: 'success',
                autoHideDuration: 3000,
            });

            // Reset form
            reset({
                sale_date: getTodayString(),
                total_amount: '',
                paid_amount: '',
                customer_name: '',
                payment_method: 'Cash',
                notes: '',
            });
        } catch (error) {
            console.error('Error creating sale:', error);
            enqueueSnackbar(`Failed to add sale: ${error.message}`, {
                variant: 'error',
                autoHideDuration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Daily Sales Entry
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Record your daily sales transactions. For due sales, please enter customer name.
            </Typography>

            <Paper sx={{ p: 3, mt: 3, maxWidth: 800 }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                        {/* Sale Date */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="sale_date"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Sale Date"
                                        type="date"
                                        fullWidth
                                        error={!!errors.sale_date}
                                        helperText={errors.sale_date?.message}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Customer Name */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="customer_name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Customer Name"
                                        placeholder="Required for due sales"
                                        fullWidth
                                        error={!!errors.customer_name}
                                        helperText={errors.customer_name?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Total Amount */}
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="total_amount"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Total Amount"
                                        type="number"
                                        fullWidth
                                        error={!!errors.total_amount}
                                        helperText={errors.total_amount?.message}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                                        }}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            // Auto-populate paid amount if currently empty
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val)) {
                                                // Optional: Set paid amount to total automatically
                                                setValue('paid_amount', val);
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Paid Amount */}
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="paid_amount"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Paid Amount"
                                        type="number"
                                        fullWidth
                                        error={!!errors.paid_amount}
                                        helperText={errors.paid_amount?.message}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Due Amount (Read Only) */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Due Amount"
                                value={formatCurrency(dueAmount)}
                                fullWidth
                                disabled
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                                    style: {
                                        color: dueAmount > 0 ? 'red' : 'green',
                                        fontWeight: 'bold'
                                    }
                                }}
                            />
                        </Grid>

                        {/* Payment Method */}
                        <Grid item xs={12}>
                            <Controller
                                name="payment_method"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Payment Method"
                                        fullWidth
                                        error={!!errors.payment_method}
                                        helperText={errors.payment_method?.message}
                                    >
                                        {PAYMENT_METHODS.map((method) => (
                                            <MenuItem key={method} value={method}>
                                                {method}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Notes */}
                        <Grid item xs={12}>
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Notes (Optional)"
                                        multiline
                                        rows={3}
                                        fullWidth
                                        placeholder="Add any additional notes about this sale..."
                                    />
                                )}
                            />
                        </Grid>

                        {/* Submit Button */}
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={isSubmitting}
                                sx={{
                                    bgcolor: dueAmount > 0 ? 'warning.main' : 'primary.main',
                                    '&:hover': {
                                        bgcolor: dueAmount > 0 ? 'warning.dark' : 'primary.dark',
                                    }
                                }}
                            >
                                {isSubmitting ? 'Adding Sale...' : (dueAmount > 0 ? 'Add Due Sale' : 'Add Sale')}
                            </Button>
                        </Grid>
                    </Grid>
                </form>

                {/* Info Alert */}
                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        <strong>Tip:</strong> If Paid Amount is less than Total Amount, it will be automatically marked as a "Due Sale".
                    </Typography>
                </Alert>
            </Paper>
        </Box>
    );
};

export default SalesEntry;
