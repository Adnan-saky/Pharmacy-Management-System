import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    InputAdornment,
    Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { createSale } from '../../services/googleSheetsService';
import { getTodayString } from '../../utils/dateUtils';

// Validation schema
const schema = yup.object({
    sale_date: yup.string().required('Date is required'),
    customer_name: yup.string().required('Customer name is required'),
    contact_number: yup.string().optional(),
    medicine_details: yup.string().required('Medicine details are required'),
    total_amount: yup
        .number()
        .required('Amount is required')
        .positive('Amount must be greater than 0')
        .typeError('Amount must be a number'),
    paid_amount: yup
        .number()
        .transform((value) => (isNaN(value) ? 0 : value))
        .default(0)
        .test('max-amount', 'Paid amount cannot exceed total amount', function (value) {
            return value <= this.parent.total_amount;
        }),
    notes: yup.string(),
}).required();

const DueEntry = ({ onSuccess }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            sale_date: getTodayString(),
            customer_name: '',
            contact_number: '',
            medicine_details: '',
            total_amount: '',
            paid_amount: '',
            notes: '',
        },
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const finalPaid = data.paid_amount || 0;
            const finalDue = data.total_amount - finalPaid;

            const saleData = {
                sale_date: data.sale_date,
                total_amount: data.total_amount,
                payment_method: 'Credit', // Due sale - payment on credit
                notes: `${data.medicine_details} | Contact: ${data.contact_number} | Note: ${data.notes}`,
                customer_name: data.customer_name,
                paid_amount: finalPaid,
                due_amount: finalDue,
                status: finalDue > 0 ? (finalPaid > 0 ? 'Partial' : 'Due') : 'Paid'
            };

            await createSale(saleData);

            enqueueSnackbar('Due record added successfully!', { variant: 'success' });
            reset({
                sale_date: getTodayString(),
                customer_name: '',
                contact_number: '',
                medicine_details: '',
                total_amount: '',
                paid_amount: '',
                notes: '',
            });

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error adding due:', error);
            enqueueSnackbar('Failed to add due record', { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom color="error">
                Add New Due Record
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="sale_date"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Date"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    error={!!errors.sale_date}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="customer_name"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Customer Name"
                                    fullWidth
                                    error={!!errors.customer_name}
                                    helperText={errors.customer_name?.message}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="contact_number"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Contact Number (Optional)"
                                    fullWidth
                                    placeholder="017..."
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="medicine_details"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Medicine Details"
                                    fullWidth
                                    placeholder="e.g., Napa 1 box, Sergel 10pcs"
                                    error={!!errors.medicine_details}
                                    helperText={errors.medicine_details?.message}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="total_amount"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Total Amount"
                                    type="number"
                                    fullWidth
                                    InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                                    error={!!errors.total_amount}
                                    helperText={errors.total_amount?.message}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="paid_amount"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Paid / Advance (Optional)"
                                    type="number"
                                    fullWidth
                                    placeholder="0"
                                    InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                                    error={!!errors.paid_amount}
                                    helperText={errors.paid_amount?.message}
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
                                    label="Notes"
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
                            color="error"
                            fullWidth
                            size="large"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Add Due Record'}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default DueEntry;
