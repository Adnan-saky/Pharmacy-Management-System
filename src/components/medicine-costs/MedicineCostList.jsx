import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { getMedicineCosts } from '../../services/googleSheetsService';
import Loading from '../common/Loading';
import { formatCurrency } from '../../utils/formatters';

const MedicineCostList = () => {
    const [costs, setCosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCosts();
    }, []);

    const fetchCosts = async () => {
        try {
            const data = await getMedicineCosts();
            setCosts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <Loading message="Loading Costs..." />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Medicine Cost History</Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Supplier</TableCell>
                            <TableCell>Items</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Notes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {costs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No cost records found.</TableCell>
                            </TableRow>
                        ) : (
                            costs.map((cost) => (
                                <TableRow key={cost.id}>
                                    <TableCell>{new Date(cost.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{cost.supplier_name}</TableCell>
                                    <TableCell>{cost.medicine_details}</TableCell>
                                    <TableCell>{formatCurrency(cost.total_amount)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={cost.payment_status}
                                            color={cost.payment_status === 'Paid' ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{cost.notes}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default MedicineCostList;
