import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, MenuItem, Grid, Paper, Autocomplete
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { addOperationalCost } from '../../services/googleSheetsService';

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

const OperationalCostEntry = () => {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm();
    const { enqueueSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await addOperationalCost(data);
            enqueueSnackbar('Operational cost added successfully!', { variant: 'success' });
            reset();
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to save cost', { variant: 'error' });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom mb={3}>
                Enter Operational Cost
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

                    {/* Cost Type - Enhanced with Autocomplete */}
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="cost_type"
                            control={control}
                            defaultValue=""
                            rules={{ required: 'Cost Type is required' }}
                            render={({ field: { onChange, value }, fieldState: { error } }) => (
                                <Autocomplete
                                    freeSolo
                                    options={COST_TYPES}
                                    value={value || ''}
                                    onChange={(event, newValue) => {
                                        // Handle selection from dropdown
                                        onChange(newValue);
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        // Handle typing
                                        onChange(newInputValue);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Cost Type"
                                            fullWidth
                                            error={!!error}
                                            helperText={error ? error.message : "Select or type new"}
                                        />
                                    )}
                                />
                            )}
                        />
                    </Grid>

                    {/* Amount */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Amount"
                            type="number"
                            fullWidth
                            InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography> }}
                            {...register('amount', { required: 'Amount is required', min: 0 })}
                            error={!!errors.amount}
                        />
                    </Grid>

                    {/* Recipient */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Paid To (Optional)"
                            fullWidth
                            placeholder="e.g. Landlord, Staff Name"
                            {...register('recipient')}
                        />
                    </Grid>

                    {/* Notes */}
                    <Grid item xs={12}>
                        <TextField
                            label="Notes"
                            fullWidth
                            multiline
                            rows={2}
                            {...register('notes')}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" gap={2}>
                            <Button variant="outlined" onClick={() => reset()} disabled={isSubmitting}>
                                Reset
                            </Button>
                            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Cost'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default OperationalCostEntry;
