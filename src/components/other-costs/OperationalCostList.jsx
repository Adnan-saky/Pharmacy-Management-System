import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { getOperationalCosts } from '../../services/googleSheetsService';
import Loading from '../common/Loading';
import { formatCurrency } from '../../utils/formatters';

const OperationalCostList = () => {
    const [costs, setCosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCosts();
    }, []);

    const fetchCosts = async () => {
        try {
            const data = await getOperationalCosts();
            // Sort by date descending
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setCosts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <Loading message="Loading Operational Costs..." />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Operational Costs History</Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Paid To</TableCell>
                            <TableCell>Notes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {costs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No cost records found.</TableCell>
                            </TableRow>
                        ) : (
                            costs.map((cost) => (
                                <TableRow key={cost.id}>
                                    <TableCell>{new Date(cost.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip label={cost.cost_type} color="primary" variant="outlined" size="small" />
                                    </TableCell>
                                    <TableCell>{formatCurrency(cost.amount)}</TableCell>
                                    <TableCell>{cost.recipient || '-'}</TableCell>
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

export default OperationalCostList;
