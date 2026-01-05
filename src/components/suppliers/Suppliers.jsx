import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
    DialogContent, DialogActions
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { getSuppliers, addSupplier } from '../../services/googleSheetsService';
import Loading from '../common/Loading';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const { register, handleSubmit, reset } = useForm();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            enqueueSnackbar('Failed to load suppliers', { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            await addSupplier(data);
            enqueueSnackbar('Supplier added successfully!', { variant: 'success' });
            setOpenDialog(false);
            reset();
            fetchSuppliers();
        } catch (error) {
            enqueueSnackbar('Failed to add supplier', { variant: 'error' });
        }
    };

    if (isLoading) return <Loading message="Loading Suppliers..." />;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Suppliers</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Add Supplier
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Contact Info</TableCell>
                            <TableCell>Joined Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center">No suppliers found.</TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell>{supplier.name}</TableCell>
                                    <TableCell>{supplier.contact_info}</TableCell>
                                    <TableCell>
                                        {new Date(supplier.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Supplier Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Add New Supplier</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Supplier Name"
                            fullWidth
                            required
                            {...register('name', { required: true })}
                        />
                        <TextField
                            margin="dense"
                            label="Contact Info (Phone/Address)"
                            fullWidth
                            multiline
                            rows={3}
                            {...register('contact_info')}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Add</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default Suppliers;
