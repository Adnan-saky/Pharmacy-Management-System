import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button, MenuItem, Grid, Paper
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { getSuppliers, addMedicineCost } from '../../services/googleSheetsService';

const MedicineCostEntry = () => {
    const [suppliers, setSuppliers] = useState([]);
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    // Watch supplier select to set supplier name automatically
    const selectedSupplierId = watch('supplier_id');

    useEffect(() => {
        loadSuppliers();
    }, []);

    // When supplier ID changes, find and set the supplier Name
    useEffect(() => {
        if (selectedSupplierId && suppliers.length > 0) {
            const supplier = suppliers.find(s => s.id === selectedSupplierId);
            if (supplier) {
                setValue('supplier_name', supplier.name);
            }
        }
    }, [selectedSupplierId, suppliers, setValue]);

    const loadSuppliers = async () => {
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            enqueueSnackbar('Failed to load suppliers', { variant: 'error' });
        }
    };

    const onSubmit = async (data) => {
        try {
            await addMedicineCost(data);
            enqueueSnackbar('Medicine cost added successfully!', { variant: 'success' });
            reset();
            // Optional: navigate to list or stay
        } catch (error) {
            enqueueSnackbar('Failed to save cost', { variant: 'error' });
        }
    };

    return (
        <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom mb={3}>
                Enter Medicine Cost
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                    {/* Date */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            {...register('date', { required: 'Date is required' })}
                            error={!!errors.date}
                            helperText={errors.date?.message}
                            defaultValue={new Date().toISOString().split('T')[0]}
                        />
                    </Grid>

                    {/* Supplier */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Supplier"
                            fullWidth
                            defaultValue=""
                            {...register('supplier_id', { required: 'Supplier is required' })}
                            error={!!errors.supplier_id}
                            helperText={errors.supplier_id?.message}
                        >
                            {suppliers.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                    {option.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        {/* Hidden input for supplier Name */}
                        <input type="hidden" {...register('supplier_name')} />
                    </Grid>

                    {/* Medicine Details */}
                    <Grid item xs={12}>
                        <TextField
                            label="Medicine Details / Invoice Items"
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="e.g. Napa 500mg x100 boxes, Ace 200mg x50 strips..."
                            {...register('medicine_details', { required: 'Details are required' })}
                            error={!!errors.medicine_details}
                        />
                    </Grid>

                    {/* Total Amount */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Total Amount"
                            type="number"
                            fullWidth
                            InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography> }}
                            {...register('total_amount', { required: 'Amount is required', min: 0 })}
                            error={!!errors.total_amount}
                        />
                    </Grid>

                    {/* Payment Status */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Payment Status"
                            fullWidth
                            defaultValue="Paid"
                            {...register('payment_status', { required: true })}
                        >
                            <MenuItem value="Paid">Paid</MenuItem>
                            <MenuItem value="Due">Due</MenuItem>
                            <MenuItem value="Partial">Partial</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Notes */}
                    <Grid item xs={12}>
                        <TextField
                            label="Notes / Invoice No"
                            fullWidth
                            {...register('notes')}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" gap={2}>
                            <Button variant="outlined" onClick={() => reset()}>
                                Reset
                            </Button>
                            <Button type="submit" variant="contained" size="large">
                                Save Cost
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default MedicineCostEntry;
